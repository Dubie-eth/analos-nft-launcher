# 🎨 Analos Simple NFT Program

A lightweight, production-ready NFT program for the Analos blockchain.

## ✨ Features

- ✅ **Real NFTs**: Creates SPL tokens with 0 decimals
- ✅ **Metadata Storage**: Stores name, symbol, and URI on-chain
- ✅ **Transferable**: Full SPL token compatibility
- ✅ **Stakeable**: Can be used in staking programs
- ✅ **Sellable**: Compatible with marketplaces
- ✅ **Lightweight**: Easy to deploy and maintain
- ✅ **Gas Efficient**: Optimized for low transaction costs

## 🏗️ Architecture

### NFT Structure
Each NFT consists of:
1. **Mint Account**: SPL Token mint with 0 decimals
2. **Metadata Account**: PDA storing NFT metadata

### Metadata Format
```
Discriminator: 8 bytes ("METADATA")
Name: 32 bytes
Symbol: 10 bytes
URI: 200 bytes
```

## 📦 Deployment

### Option 1: Solana Playground (Recommended)

1. Go to https://beta.solpg.io
2. Create a new project
3. Upload `src/lib.rs` and `Cargo.toml`
4. Configure custom RPC: `https://rpc.analos.io`
5. Run: `build`
6. Run: `deploy`
7. Save the Program ID!

### Option 2: Local Build

```bash
cargo build-sbf
solana program deploy target/deploy/analos_simple_nft.so --url https://rpc.analos.io
```

## 🎯 Usage

### Creating an NFT

```typescript
import { Connection, PublicKey, Transaction, SystemProgram } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';

const PROGRAM_ID = new PublicKey('YOUR_DEPLOYED_PROGRAM_ID');

async function createNFT(
  connection: Connection,
  payer: Keypair,
  name: string,
  symbol: string,
  uri: string
) {
  // Generate mint keypair
  const mintKeypair = Keypair.generate();
  
  // Derive metadata PDA
  const [metadataPDA] = PublicKey.findProgramAddressSync(
    [
      Buffer.from('metadata'),
      PROGRAM_ID.toBuffer(),
      mintKeypair.publicKey.toBuffer(),
    ],
    PROGRAM_ID
  );
  
  // Prepare instruction data
  const nameBuffer = Buffer.alloc(32);
  Buffer.from(name).copy(nameBuffer);
  
  const symbolBuffer = Buffer.alloc(10);
  Buffer.from(symbol).copy(symbolBuffer);
  
  const uriBuffer = Buffer.alloc(200);
  Buffer.from(uri).copy(uriBuffer);
  
  const instructionData = Buffer.concat([nameBuffer, symbolBuffer, uriBuffer]);
  
  // Create instruction
  const instruction = new TransactionInstruction({
    keys: [
      { pubkey: payer.publicKey, isSigner: true, isWritable: true },
      { pubkey: mintKeypair.publicKey, isSigner: true, isWritable: true },
      { pubkey: metadataPDA, isSigner: false, isWritable: true },
      { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      { pubkey: SYSVAR_RENT_PUBKEY, isSigner: false, isWritable: false },
    ],
    programId: PROGRAM_ID,
    data: instructionData,
  });
  
  // Send transaction
  const transaction = new Transaction().add(instruction);
  const signature = await sendAndConfirmTransaction(
    connection,
    transaction,
    [payer, mintKeypair]
  );
  
  return {
    mint: mintKeypair.publicKey,
    metadata: metadataPDA,
    signature,
  };
}
```

## 🔍 Reading NFT Metadata

```typescript
async function getNFTMetadata(
  connection: Connection,
  programId: PublicKey,
  mintAddress: PublicKey
) {
  // Derive metadata PDA
  const [metadataPDA] = PublicKey.findProgramAddressSync(
    [
      Buffer.from('metadata'),
      programId.toBuffer(),
      mintAddress.toBuffer(),
    ],
    programId
  );
  
  // Fetch account data
  const accountInfo = await connection.getAccountInfo(metadataPDA);
  if (!accountInfo) {
    throw new Error('Metadata account not found');
  }
  
  const data = accountInfo.data;
  
  // Parse metadata
  const discriminator = data.slice(0, 8).toString();
  const name = data.slice(8, 40).toString().replace(/\0/g, '').trim();
  const symbol = data.slice(40, 50).toString().replace(/\0/g, '').trim();
  const uri = data.slice(50, 250).toString().replace(/\0/g, '').trim();
  
  return { name, symbol, uri };
}
```

## 🚀 Integration with Your Backend

Update your backend service to use this program:

```typescript
// backend/src/analos-simple-nft-service.ts
import { Connection, Keypair, PublicKey, Transaction, TransactionInstruction, SystemProgram, SYSVAR_RENT_PUBKEY } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';

const PROGRAM_ID = new PublicKey('YOUR_DEPLOYED_PROGRAM_ID');
const RPC_URL = 'https://rpc.analos.io';

export class AnalosSimpleNFTService {
  private connection: Connection;
  
  constructor() {
    this.connection = new Connection(RPC_URL, 'confirmed');
  }
  
  async mintNFT(
    payerKeypair: Keypair,
    name: string,
    symbol: string,
    uri: string
  ) {
    // Implementation here...
  }
}
```

## 🔧 Troubleshooting

### Build Fails
- Make sure you have Solana CLI installed
- Check Rust version: `rustc --version` (should be 1.70+)
- Try: `cargo clean && cargo build-sbf`

### Deployment Fails
- Check wallet balance (need ~2-5 LOS)
- Verify RPC URL is correct
- Make sure you're connected to Analos network

## 📊 Cost Estimates

- **Deployment**: ~2-3 LOS
- **NFT Creation**: ~0.002-0.005 LOS per NFT
- **Metadata Storage**: Included in creation cost

## 🎉 Advantages Over Full Metaplex

1. **Simpler**: Much easier to understand and maintain
2. **Lighter**: Smaller program size = lower deployment costs
3. **Faster**: Optimized for Analos blockchain
4. **Flexible**: Easy to customize for your needs
5. **Compatible**: Works with standard SPL token tools

## 🔮 Future Enhancements

- [ ] Collection support
- [ ] Royalty enforcement
- [ ] Update authority management
- [ ] Burn functionality
- [ ] Freeze authority

## 📝 License

MIT License - Feel free to use and modify!

---

**Built with ❤️ for the Analos ecosystem**
