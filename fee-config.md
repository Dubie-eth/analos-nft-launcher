# Fee Configuration

## Current Fee Structure
- **Platform Fee**: 2.5% (250 basis points)
- **Buyback Fee**: 1.5% (150 basis points) 
- **Dev Fee**: 1.0% (100 basis points)
- **Total Fees**: 5.0% (500 basis points)
- **Creator Gets**: 95.0% (9500 basis points)

## Fee Recipients (UPDATE THESE WITH REAL ADDRESSES)

### Platform Wallet (2.5% of each mint)
Current: `11111111111111111111111111111111`
**Action**: Replace with your actual platform wallet address

### Buyback Wallet (1.5% of each mint)  
Current: `22222222222222222222222222222222`
**Action**: Replace with your $LOL buyback program address

### Dev Wallet (1.0% of each mint)
Current: `33333333333333333333333333333333`  
**Action**: Replace with your developer maintenance wallet address

## How to Update Fee Recipients

1. Generate new wallet addresses:
   ```bash
   solana-keygen new --outfile platform-wallet.json
   solana-keygen new --outfile buyback-wallet.json  
   solana-keygen new --outfile dev-wallet.json
   ```

2. Update the constants in `lib.rs`:
   ```rust
   pub const PLATFORM_WALLET: &str = "YOUR_PLATFORM_ADDRESS";
   pub const BUYBACK_WALLET: &str = "YOUR_BUYBACK_ADDRESS";
   pub const DEV_WALLET: &str = "YOUR_DEV_ADDRESS";
   ```

3. Redeploy the program with updated addresses

## Fee Distribution Example

If someone mints an NFT for 1 LOS (1,000,000,000 lamports):
- Creator gets: 950,000,000 lamports (95%)
- Platform gets: 25,000,000 lamports (2.5%)
- Buyback gets: 15,000,000 lamports (1.5%)
- Dev gets: 10,000,000 lamports (1.0%)
