/**
 * IDL for Analos NFT Launchpad Program
 * Program ID: FS2aWrQnDcVioFnskRjnD1aXzb9DXEHd3SSMUyxHDgUo
 */

export const ANALOS_LAUNCHPAD_IDL = {
  version: "0.1.0",
  name: "analos_nft_launchpad",
  instructions: [
    {
      name: "initializeCollection",
      accounts: [
        { name: "collectionConfig", isMut: true, isSigner: false },
        { name: "authority", isMut: true, isSigner: true },
        { name: "systemProgram", isMut: false, isSigner: false }
      ],
      args: [
        { name: "maxSupply", type: "u64" },
        { name: "priceLamports", type: "u64" },
        { name: "revealThreshold", type: "u64" },
        { name: "collectionName", type: "string" },
        { name: "collectionSymbol", type: "string" },
        { name: "placeholderUri", type: "string" }
      ]
    },
    {
      name: "mintPlaceholder",
      accounts: [
        { name: "collectionConfig", isMut: true, isSigner: false },
        { name: "mintRecord", isMut: true, isSigner: false },
        { name: "payer", isMut: true, isSigner: true },
        { name: "systemProgram", isMut: false, isSigner: false }
      ],
      args: []
    },
    {
      name: "revealCollection",
      accounts: [
        { name: "collectionConfig", isMut: true, isSigner: false },
        { name: "authority", isMut: false, isSigner: true }
      ],
      args: [
        { name: "revealedBaseUri", type: "string" }
      ]
    },
    {
      name: "revealNft",
      accounts: [
        { name: "collectionConfig", isMut: false, isSigner: false },
        { name: "mintRecord", isMut: true, isSigner: false }
      ],
      args: []
    },
    {
      name: "withdrawFunds",
      accounts: [
        { name: "collectionConfig", isMut: true, isSigner: false },
        { name: "authority", isMut: true, isSigner: true }
      ],
      args: [
        { name: "amount", type: "u64" }
      ]
    },
    {
      name: "setPause",
      accounts: [
        { name: "collectionConfig", isMut: true, isSigner: false },
        { name: "authority", isMut: false, isSigner: true }
      ],
      args: [
        { name: "paused", type: "bool" }
      ]
    },
    {
      name: "updateConfig",
      accounts: [
        { name: "collectionConfig", isMut: true, isSigner: false },
        { name: "authority", isMut: false, isSigner: true }
      ],
      args: [
        { name: "newPrice", type: { option: "u64" } },
        { name: "newRevealThreshold", type: { option: "u64" } }
      ]
    }
  ],
  accounts: [
    {
      name: "CollectionConfig",
      type: {
        kind: "struct",
        fields: [
          { name: "authority", type: "publicKey" },
          { name: "maxSupply", type: "u64" },
          { name: "currentSupply", type: "u64" },
          { name: "priceLamports", type: "u64" },
          { name: "revealThreshold", type: "u64" },
          { name: "isRevealed", type: "bool" },
          { name: "isPaused", type: "bool" },
          { name: "globalSeed", type: { array: ["u8", 32] } },
          { name: "collectionName", type: "string" },
          { name: "collectionSymbol", type: "string" },
          { name: "placeholderUri", type: "string" }
        ]
      }
    },
    {
      name: "MintRecord",
      type: {
        kind: "struct",
        fields: [
          { name: "mintIndex", type: "u64" },
          { name: "minter", type: "publicKey" },
          { name: "isRevealed", type: "bool" },
          { name: "rarityScore", type: "u64" }
        ]
      }
    }
  ],
  events: [
    {
      name: "MintEvent",
      fields: [
        { name: "mintIndex", type: "u64", index: false },
        { name: "minter", type: "publicKey", index: false },
        { name: "rarityScore", type: "u64", index: false },
        { name: "timestamp", type: "i64", index: false }
      ]
    },
    {
      name: "RevealEvent",
      fields: [
        { name: "timestamp", type: "i64", index: false },
        { name: "totalMinted", type: "u64", index: false },
        { name: "revealedBaseUri", type: "string", index: false }
      ]
    },
    {
      name: "NftRevealedEvent",
      fields: [
        { name: "mintIndex", type: "u64", index: false },
        { name: "rarityTier", type: "string", index: false },
        { name: "rarityScore", type: "u64", index: false }
      ]
    }
  ],
  errors: [
    { code: 6000, name: "SoldOut", msg: "Collection is sold out" },
    { code: 6001, name: "CollectionPaused", msg: "Collection minting is paused" },
    { code: 6002, name: "AlreadyRevealed", msg: "Collection has already been revealed" },
    { code: 6003, name: "ThresholdNotMet", msg: "Reveal threshold has not been met" },
    { code: 6004, name: "NotRevealed", msg: "Collection has not been revealed yet" },
    { code: 6005, name: "InsufficientFunds", msg: "Insufficient funds for withdrawal" },
    { code: 6006, name: "InvalidThreshold", msg: "Invalid threshold value" }
  ]
} as const;

export type AnalosLaunchpadIDL = typeof ANALOS_LAUNCHPAD_IDL;

