# The Ball Winner Determination Logic

In order to ensure a transparent lottery, the lottery algorithm will be made publicly available. [index.ts](./index.ts) is the actual logic.

1. Calculate the $BALL of those who minted the gacha and OfficialNFT.
2. Create Address List 1 and sort them in alphabetical order.
3. Address list 1 is shuffled using the random numbers generated by the PRNG to create address list 2. The seed value is a string concatenation of address list 1 and hashed using the NaCl algorithm.
4. Concatenate Address List 2 with a string and generate a hash value using the NaCl algorithm. The hash values are then added together as a Uint8Array.
5. The Indexth person in address list 2 is the winner.
6. The same logic is used to determine the second and third person, except for the winner of 5.

\* The Ball's administrative team's address will be skipped

# How to run on your local

## Install node modules

```
$ yarn
```

## Copy config file

```
$ cp config.example.ts config.ts
```

## Set NetworkRPC for Base in config.ts

Get your own endpoint from alchemy

```
export const NETWORK_RPC='https://base-mainnet.g.alchemy.com/v2/...'
```

## Creake cache dir

```
$ mkdir cache
```

## Run the code

```
$ ./node_modeules/.bin/ts-node index.ts
```