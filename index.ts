import { existsSync, readFileSync, writeFileSync } from "fs"
import {
  ADMIN_ADDRESSES,
  SHARE_PER_BALL,
  BASE_END_BLOCK_NUMBER,
  BASE_START_BLOCK_NUMBER,
  CACHE_DIR,
  GASHA_ADDRESS,
  NETWORK_RPC,
  NUM_OF_WINNER,
  OFFICIAL_NFTS,
  POINT_TABLE,
  ZORA_END_BLOCK_NUMBER,
  ZORA_START_BLOCK_NUMBER,
} from "./config"
import { Address, createPublicClient, http, zeroAddress } from "viem"
import { base, zora } from "viem/chains"
import { BalanceOfBall, OfficialNFTMintHistory, SpinHistory } from "./types"
import tweetnacl from "tweetnacl"
import shuffleSeed from "shuffle-seed"
import { GashaAbi } from "./abi/GashaABI"
import { ZoraERC1155Abi } from "./abi/ZoraERC1155ABI"

const publicBaseClient = createPublicClient({
  chain: base,
  transport: http(NETWORK_RPC),
})

const publicZoraClient = createPublicClient({
  chain: zora,
  transport: http(),
})

const fetchGashaSpinEvents = async () => {
  const isExist = existsSync(`${CACHE_DIR}/gasha-spin-history.json`)
  const history: SpinHistory = isExist
    ? JSON.parse(readFileSync(`${CACHE_DIR}/gasha-spin-history.json`, "utf-8"))
    : {}

  let blockNumber = BASE_START_BLOCK_NUMBER

  while (blockNumber <= BASE_END_BLOCK_NUMBER) {
    const fromBlock = blockNumber
    const toBlock = blockNumber + 500

    console.log(
      `Fetching GashaSpin events from block ${fromBlock} to ${toBlock}`
    )

    const events = await publicBaseClient.getContractEvents({
      address: GASHA_ADDRESS,
      abi: GashaAbi,
      eventName: "Spin",
      fromBlock: BigInt(fromBlock),
      toBlock: BigInt(toBlock),
    })

    for (const event of events) {
      const hash = event.transactionHash
      const minter = event.args.minter?.toLocaleLowerCase()
      const ids = event.args.ids?.map((id) => Number(id))
      const quantities = event.args.quantities?.map((quantity) =>
        Number(quantity)
      )
      const timestamp = Number(
        await publicBaseClient
          .getBlock({ blockNumber: event.blockNumber })
          .then((block) => block.timestamp)
      )

      if (!minter || !ids || !quantities) continue

      if (!history[minter]) {
        history[minter] = []
      }

      if (history[minter].some((item) => item.hash === hash)) continue
      history[minter].push({ ids, quantities, timestamp, hash })
    }

    blockNumber = toBlock + 1

    await new Promise((resolve) => setTimeout(resolve, 200))
  }

  writeFileSync(
    `${CACHE_DIR}/gasha-spin-history.json`,
    JSON.stringify(history, null, 2)
  )
}

const fetchOfficialZoraNFTMint = async () => {
  const isExist = existsSync(`${CACHE_DIR}/officialnft-mint-history.json`)
  const history: OfficialNFTMintHistory = isExist
    ? JSON.parse(
        readFileSync(`${CACHE_DIR}/officialnft-mint-history.json`, "utf-8")
      )
    : {}

  for (const contractAddress of Object.keys(OFFICIAL_NFTS)) {
    const historyOfContract = history[contractAddress.toLowerCase()] || {}
    let blockNumber = ZORA_START_BLOCK_NUMBER

    while (blockNumber <= ZORA_END_BLOCK_NUMBER) {
      const fromBlock = blockNumber
      const toBlock = blockNumber + 500

      console.log(
        `Fetching ZoraPurchase events for ${contractAddress.slice(
          0,
          5
        )} from block ${fromBlock} to ${toBlock}`
      )

      const events = await publicZoraClient.getContractEvents({
        address: contractAddress as Address,
        eventName: "TransferSingle",
        fromBlock: BigInt(fromBlock),
        toBlock: BigInt(toBlock),
        abi: ZoraERC1155Abi,
      })

      for (const event of events) {
        const hash = event.transactionHash
        const from = event.args.from?.toLocaleLowerCase()
        const minter = event.args.to?.toLocaleLowerCase()
        const token_id = Number(event.args.id)
        const quantity = Number(event.args.value)
        const timestamp = Number(
          await publicZoraClient
            .getBlock({ blockNumber: event.blockNumber })
            .then((block) => block.timestamp)
        )

        if (!minter || !token_id || !quantity) continue
        if (!OFFICIAL_NFTS[contractAddress].includes(token_id)) continue
        if (from !== zeroAddress) continue

        if (!historyOfContract[minter]) {
          historyOfContract[minter] = []
        }

        if (
          historyOfContract[minter].some(
            (item) => item.hash === hash && item.token_id === token_id
          )
        )
          continue

        historyOfContract[minter].push({ quantity, timestamp, hash, token_id })
      }

      blockNumber = toBlock + 1

      await new Promise((resolve) => setTimeout(resolve, 200))
    }
    history[contractAddress.toLowerCase()] = historyOfContract
  }
  writeFileSync(
    `${CACHE_DIR}/officialnft-mint-history.json`,
    JSON.stringify(history, null, 2)
  )
}

const calcBALL = async () => {
  const balanceOfBall: BalanceOfBall = {}

  const gashaSpinHistory: SpinHistory = JSON.parse(
    readFileSync(`${CACHE_DIR}/gasha-spin-history.json`, "utf-8")
  )
  const officialNFTMintHistory: OfficialNFTMintHistory = JSON.parse(
    readFileSync(`${CACHE_DIR}/officialnft-mint-history.json`, "utf-8")
  )

  // Calculate BALL balance from GashaSpin events
  const seriesItems = await publicBaseClient.readContract({
    address: GASHA_ADDRESS,
    abi: GashaAbi,
    functionName: "seriesItems",
  })

  const getRareness = (tokenId: number) => {
    const item = seriesItems.find((e) => BigInt(tokenId) === e.tokenId)
    return item?.rareness || 0
  }

  for (const address of Object.keys(gashaSpinHistory)) {
    balanceOfBall[address.toLocaleLowerCase()] = 0

    for (const spin of gashaSpinHistory[address.toLowerCase()]) {
      let point = 0

      const ids = spin.ids
      const quantities = spin.quantities
      const timestamp = spin.timestamp

      for (let i = 0; i < ids.length; i++) {
        const tokenId = ids[i]
        const quantity = quantities[i]
        const rareness = getRareness(tokenId)
        const basePoint = POINT_TABLE.gasha.base[rareness]
        const multiply =
          POINT_TABLE.gasha.table.find(
            (e) => e.start <= timestamp && timestamp < e.end
          )?.multiply || 0

        point += basePoint * multiply * quantity
      }

      balanceOfBall[address.toLowerCase()] += point
    }
  }

  // Calculate BALL balance from OfficialNFTMint events
  for (const contractAddress of Object.keys(officialNFTMintHistory)) {
    for (const address of Object.keys(
      officialNFTMintHistory[contractAddress.toLowerCase()]
    )) {
      for (const mint of officialNFTMintHistory[contractAddress.toLowerCase()][
        address.toLowerCase()
      ]) {
        const quantity = mint.quantity
        const timestamp = mint.timestamp

        let point = 0

        const basePoint = POINT_TABLE.official_nft.base[0]
        const multiply =
          POINT_TABLE.official_nft.table.find(
            (e) => e.start <= timestamp && timestamp < e.end
          )?.multiply || 0

        point += basePoint * multiply * quantity

        if (!balanceOfBall[address.toLowerCase()]) {
          balanceOfBall[address.toLowerCase()] = 0
        }

        balanceOfBall[address.toLowerCase()] += point
      }
    }
  }

  writeFileSync(
    `${CACHE_DIR}/balance-of-ball.json`,
    JSON.stringify(balanceOfBall, null, 2)
  )
}

const createLotteryAddressList = (exeptAddresses: string[]) => {
  const addresses = []
  const balanceOfBall = JSON.parse(
    readFileSync(`${CACHE_DIR}/balance-of-ball.json`, "utf-8")
  )

  for (const address of Object.keys(balanceOfBall)) {
    if (exeptAddresses.includes(address.toLowerCase())) continue
    const balance = balanceOfBall[address.toLowerCase()]
    const numOfShare = balance / SHARE_PER_BALL

    for (let i = 0; i < numOfShare; i++) {
      addresses.push(address.toLowerCase())
    }
  }

  addresses.sort()

  const seed = Buffer.from(addresses.join(""), "utf-8")
  const hash = tweetnacl.hash(seed)
  const hashStr = Array.from(hash).join("")

  const shuffledAddresses = shuffleSeed.shuffle(addresses, hashStr)

  return shuffledAddresses
}

const pickWinner = () => {
  const hitAddresses: string[] = []
  let numOfWinner = 0
  while (numOfWinner < NUM_OF_WINNER) {
    const addresses = createLotteryAddressList(hitAddresses)
    const seed = Buffer.from(addresses.join(""), "utf-8")
    const hash = tweetnacl.hash(seed)
    const index = hash.reduce((prev, current) => {
      return (prev + current) % addresses.length
    })
    const winner = addresses[index]

    if (!ADMIN_ADDRESSES.map((a) => a.toLowerCase()).includes(winner)) {
      console.log(`Winner ${numOfWinner + 1} is ${winner}`)
      numOfWinner++
    }

    hitAddresses.push(winner)
  }
}

const main = async () => {
  await fetchGashaSpinEvents()
  await fetchOfficialZoraNFTMint()
  await calcBALL()
  pickWinner()
}

main()
