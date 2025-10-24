/**
 * Analos Metadata Helper
 * Simple metadata creation for Profile NFTs using Analos's metadata program
 * Program ID: 8ESkxgw28xsZgbeaTbVngduUk3zzWGMwccmUaSjSLYUL
 */

import {
  Connection,
  PublicKey,
  Transaction,
  TransactionInstruction,
  SystemProgram,
} from '@solana/web3.js';
import { ANALOS_RPC_URL } from '@/config/analos-programs';

// Analos Metadata Program ID
export const ANALOS_METADATA_PROGRAM_ID = new PublicKey('8ESkxgw28xsZgbeaTbVngduUk3zzWGMwccmUaSjSLYUL');

/**
 * Create metadata instruction for Analos
 * This creates a simple metadata account with name, symbol, and URI
 */
export function createAnalosMetadataInstruction(
  mint: PublicKey,
  updateAuthority: PublicKey,
  payer: PublicKey,
  name: string,
  symbol: string,
  uri: string
): TransactionInstruction {
  // Derive metadata PDA
  const [metadataPDA] = PublicKey.findProgramAddressSync(
    [
      Buffer.from('metadata'),
      ANALOS_METADATA_PROGRAM_ID.toBuffer(),
      mint.toBuffer(),
    ],
    ANALOS_METADATA_PROGRAM_ID
  );

  // Build instruction data
  // Format: [instruction_discriminator (1 byte), name_len (4), name, symbol_len (4), symbol, uri_len (4), uri]
  const nameBuffer = Buffer.from(name.substring(0, 32), 'utf-8');
  const symbolBuffer = Buffer.from(symbol.substring(0, 10), 'utf-8');
  const uriBuffer = Buffer.from(uri.substring(0, 200), 'utf-8');

  const data = Buffer.concat([
    Buffer.from([0]), // Instruction discriminator for "CreateMetadata"
    
    // Name (u32 length + bytes)
    Buffer.from([nameBuffer.length, 0, 0, 0]), // u32 LE
    nameBuffer,
    
    // Symbol (u32 length + bytes)
    Buffer.from([symbolBuffer.length, 0, 0, 0]), // u32 LE
    symbolBuffer,
    
    // URI (u32 length + bytes)
    Buffer.from([uriBuffer.length, 0, 0, 0]), // u32 LE
    uriBuffer,
    
    // Is mutable (1 byte)
    Buffer.from([1]), // true = mutable
  ]);

  return new TransactionInstruction({
    keys: [
      { pubkey: metadataPDA, isSigner: false, isWritable: true },
      { pubkey: mint, isSigner: false, isWritable: false },
      { pubkey: updateAuthority, isSigner: true, isWritable: false },
      { pubkey: payer, isSigner: true, isWritable: true },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    ],
    programId: ANALOS_METADATA_PROGRAM_ID,
    data,
  });
}

/**
 * Get metadata PDA for a mint
 */
export function getMetadataPDA(mint: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [
      Buffer.from('metadata'),
      ANALOS_METADATA_PROGRAM_ID.toBuffer(),
      mint.toBuffer(),
    ],
    ANALOS_METADATA_PROGRAM_ID
  );
}

/**
 * Check if metadata exists for a mint
 */
export async function metadataExists(
  connection: Connection,
  mint: PublicKey
): Promise<boolean> {
  try {
    const [metadataPDA] = getMetadataPDA(mint);
    const accountInfo = await connection.getAccountInfo(metadataPDA);
    return accountInfo !== null;
  } catch (error) {
    console.error('Error checking metadata:', error);
    return false;
  }
}

/**
 * Parse metadata account data
 */
export function parseMetadataAccount(data: Buffer): {
  name: string;
  symbol: string;
  uri: string;
  isMutable: boolean;
} | null {
  try {
    let offset = 0;

    // Skip discriminator (8 bytes if using Anchor, or may not exist)
    // Try both interpretations
    
    // Name (u32 length + bytes)
    const nameLen = data.readUInt32LE(offset);
    offset += 4;
    const name = data.slice(offset, offset + nameLen).toString('utf-8');
    offset += nameLen;

    // Symbol (u32 length + bytes)
    const symbolLen = data.readUInt32LE(offset);
    offset += 4;
    const symbol = data.slice(offset, offset + symbolLen).toString('utf-8');
    offset += symbolLen;

    // URI (u32 length + bytes)
    const uriLen = data.readUInt32LE(offset);
    offset += 4;
    const uri = data.slice(offset, offset + uriLen).toString('utf-8');
    offset += uriLen;

    // Is mutable (1 byte)
    const isMutable = data.readUInt8(offset) === 1;

    return { name, symbol, uri, isMutable };
  } catch (error) {
    console.error('Error parsing metadata:', error);
    return null;
  }
}

