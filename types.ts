export type SpinHistory = {
  [address: string]: {
    ids: number[]
    quantities: number[]
    timestamp: number
    hash: string
  }[]
}

export type OfficialNFTMintHistory = {
  [contractAddress: string]: {
    [address: string]: {
      quantity: number
      timestamp: number
      hash: string
      token_id: number
    }[]
  }
}

export type BalanceOfBall = {
  [address: string]: number
}
