import { Address } from "viem"

require("dotenv").config()

// Directory to store cache files
export const CACHE_DIR = __dirname + "/cache"

// Start and end block number of the event logs to fetch
export const BASE_START_BLOCK_NUMBER = 12400000
export const BASE_END_BLOCK_NUMBER = 12755660
export const ZORA_START_BLOCK_NUMBER = 12200000
export const ZORA_END_BLOCK_NUMBER = 12803400

// RPC endpoint of the network and gasha address
export const NETWORK_RPC = ""
export const GASHA_ADDRESS =
  "0x96E9215696733f7AD091A3D2437dAf892eF296C8" as Address

// Official NFT contract addresses and their token IDs
export const OFFICIAL_NFTS: { [address: string]: number[] } = {
  "0xb5d00e222daad1b3030a6a1d0ce5f2edd8de7fd0": [
    1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11,
  ],
  "0x7b20652910251fdf7d1b57dfc9159e3ca2f12a4f": [14, 15, 16, 17],
  "0x135e79d385f8ab419b9ea7ec07a5144ff526f98b": [1],
  "0x2a54cb5cfaae1ca5a96b039a0889b7dafff1befa": [1, 2, 3, 4],
}

// $BALL per bite
export const SHARE_PER_BALL = 100

// Number of winners to select
export const NUM_OF_WINNER = 3

// Point table for $BALL
export const POINT_TABLE = {
  gasha: {
    base: [200, 400, 800],
    table: [
      { start: 0, end: 1711893599, multiply: 2 },
      { start: 1711893599, end: 1712098800, multiply: 1 },
      { start: 1712098800, end: 1712185200, multiply: 2 },
      { start: 1712185200, end: 1712271600, multiply: 1 },
      { start: 1712271600, end: 1712300400, multiply: 2 },
    ],
  },
  official_nft: {
    base: [200],
    table: [
      { start: 0, end: 1711494000, multiply: 2 },
      { start: 1711494000, end: 1711720800, multiply: 1.5 },
      { start: 1711720800, end: 1712300400, multiply: 1 },
    ],
  },
}

// Admin address to be excluded
export const ADMIN_ADDRESSES: string[] = [
  "0xF98B7e44EFe4c60264564554B885ab884D0dd904",
  "0xdCb93093424447bF4FE9Df869750950922F1E30B",
  "0x62ad333E0C4164D86644A1D73Fb792254FF0E1c6",
  "0xA5d7901510512c876617a6D24E820a0EFc39aa92",
  "0xE9D387B9ED1327E59589da2b82FB491817703bC1",
]
