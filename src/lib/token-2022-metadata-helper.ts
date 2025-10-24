/**
 * Token-2022 Metadata Helper
 * Uses Token-2022 extensions for on-chain metadata (same as $LOL token)
 * More reliable and standard than custom Analos metadata program
 */

import {
  Connection,
  PublicKey,
  Transaction,
  TransactionInstruction,
  SystemProgram,
  Keypair,
} from '@solana/web3.js';
import {
  TOKEN_2022_PROGRAM_ID,
  createInitializeMetadataPointerInstruction,
  createInitializeInstruction,
  getMintLen,
  ExtensionType,
  LENGTH_SIZE,
  TYPE_SIZE,
} from '@solana/spl-token';

/**
 * Calculate space needed for mint with metadata pointer extension
 */
export function getMintLenWithMetadataPointer(): number {
  const extensions = [ExtensionType.MetadataPointer];
  return getMintLen(extensions);
}

/**
 * Create metadata pointer instruction
 * This tells the mint where its metadata is stored
 */
export function createMetadataPointerInstruction(
  mint: PublicKey,
  authority: PublicKey | null,
  metadataAddress: PublicKey
): TransactionInstruction {
  return createInitializeMetadataPointerInstruction(
    mint,
    authority,
    metadataAddress,
    TOKEN_2022_PROGRAM_ID
  );
}

/**
 * Create Token-2022 metadata instruction using the Token Metadata Interface
 * This is the SAME approach used by $LOL token
 */
export function createToken2022MetadataInstruction(
  mint: PublicKey,
  updateAuthority: PublicKey,
  mintAuthority: PublicKey,
  name: string,
  symbol: string,
  uri: string
): TransactionInstruction {
  // Use the Token Metadata Interface
  // Format based on Token-2022 metadata standard
  
  const nameBytes = Buffer.from(name.substring(0, 32), 'utf-8');
  const symbolBytes = Buffer.from(symbol.substring(0, 10), 'utf-8');
  const uriBytes = Buffer.from(uri.substring(0, 200), 'utf-8');

  // Build instruction data for Token Metadata Interface
  // This follows the same format as Solana's Token-2022 metadata
  const data = Buffer.concat([
    // Instruction discriminator (29 for initialize metadata)
    Buffer.from([29]),
    
    // Name (length + string)
    Buffer.from(new Uint32Array([nameBytes.length]).buffer),
    nameBytes,
    
    // Symbol (length + string)
    Buffer.from(new Uint32Array([symbolBytes.length]).buffer),
    symbolBytes,
    
    // URI (length + string)
    Buffer.from(new Uint32Array([uriBytes.length]).buffer),
    uriBytes,
  ]);

  return new TransactionInstruction({
    keys: [
      { pubkey: mint, isSigner: false, isWritable: true },           // Metadata account (stored on mint itself)
      { pubkey: updateAuthority, isSigner: false, isWritable: false }, // Update authority
      { pubkey: mint, isSigner: false, isWritable: false },          // Mint account
      { pubkey: mintAuthority, isSigner: true, isWritable: false },  // Mint authority (must sign)
    ],
    programId: TOKEN_2022_PROGRAM_ID,  // Use Token-2022 program (same as $LOL!)
    data,
  });
}

/**
 * Check if this is a better approach than custom Analos metadata
 */
export function shouldUseToken2022Metadata(): boolean {
  // Always use Token-2022 metadata for consistency with $LOL token
  // Benefits:
  // - Standard Solana approach
  // - Same as $LOL token
  // - Better explorer support
  // - No custom program needed
  return true;
}

