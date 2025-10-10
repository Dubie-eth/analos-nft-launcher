/**
 * Analos Metadata Program Types
 * TypeScript interfaces for the lightweight metadata program
 */

import { PublicKey } from '@solana/web3.js';

/**
 * NFT Metadata Account
 * Stores metadata for individual NFTs
 */
export interface NFTMetadata {
  mint: PublicKey;
  updateAuthority: PublicKey;
  name: string;
  symbol: string;
  uri: string;
  isMutable: boolean;
}

/**
 * Collection Metadata Account
 * Stores metadata for NFT collections
 */
export interface CollectionMetadata {
  collectionMint: PublicKey;
  updateAuthority: PublicKey;
  name: string;
  symbol: string;
  uri: string;
  verified: boolean;
}

/**
 * Metadata Program Events
 */
export interface MetadataCreatedEvent {
  mint: PublicKey;
  metadata: PublicKey;
  name: string;
  symbol: string;
  uri: string;
}

export interface MetadataUpdatedEvent {
  mint: PublicKey;
  metadata: PublicKey;
  name: string;
  symbol: string;
  uri: string;
}

export interface AuthorityTransferredEvent {
  mint: PublicKey;
  oldAuthority: PublicKey;
  newAuthority: PublicKey;
}

/**
 * Instruction parameters
 */
export interface CreateMetadataParams {
  name: string;
  symbol: string;
  uri: string;
}

export interface UpdateMetadataParams {
  name?: string;
  symbol?: string;
  uri?: string;
}

/**
 * PDA Seeds
 */
export const METADATA_PDA_SEEDS = {
  METADATA: 'metadata',
  COLLECTION_METADATA: 'collection_metadata',
};

/**
 * Validation constants
 */
export const METADATA_CONSTANTS = {
  MAX_NAME_LENGTH: 32,
  MAX_SYMBOL_LENGTH: 10,
  MAX_URI_LENGTH: 200,
};

