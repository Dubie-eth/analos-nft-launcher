# Smart Contract Deployment Setup Guide

This guide will help you set up the Solana and Anchor toolchain for deploying the LosLauncher smart contracts.

## Prerequisites

- Windows 10/11
- PowerShell (as Administrator)
- Internet connection

## Step 1: Install Rust

1. Download Rust installer from: https://rustup.rs/
2. Run the installer and follow the prompts
3. Restart your terminal/PowerShell
4. Verify installation:
   ```bash
   rustc --version
   cargo --version
   ```

## Step 2: Install Solana CLI

### Option A: Using the installer (Recommended)
```bash
# Download the installer
curl -sSfL https://release.solana.com/v1.18.4/install | sh

# Add to PATH (restart terminal after this)
export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH"

# Verify installation
solana --version
```

### Option B: Using PowerShell (Windows)
```powershell
# Download installer
Invoke-WebRequest -Uri "https://github.com/solana-labs/solana/releases/download/v1.18.4/solana-install-init-x86_64-pc-windows-msvc.exe" -OutFile "solana-install.exe"

# Install
.\solana-install.exe stable

# Add to PATH manually or restart terminal
```

## Step 3: Install Anchor CLI

```bash
# Install via cargo
cargo install --git https://github.com/coral-xyz/anchor avm --locked --force

# Install specific version
avm install latest
avm use latest

# Verify installation
anchor --version
```

## Step 4: Configure Solana for Analos

```bash
# Set cluster to Analos devnet
solana config set --url https://rpc.analos.io

# Generate a new keypair (if you don't have one)
solana-keygen new --outfile ~/.config/solana/id.json

# Check your balance
solana balance

# Get some test SOL (if needed)
solana airdrop 2
```

## Step 5: Build and Deploy Contracts

```bash
# Navigate to contracts directory
cd contracts

# Build the contracts
anchor build

# Deploy to Analos devnet
anchor deploy --provider.cluster devnet

# Get the program ID
solana address -k target/deploy/analos_nft_launcher-keypair.json
```

## Step 6: Update Backend Configuration

After deployment, update the program ID in your backend:

1. Copy the program ID from the deployment output
2. Update `backend/src/simple-server.ts`:
   ```typescript
   const PROGRAM_ID = 'YOUR_ACTUAL_PROGRAM_ID_HERE';
   ```

## Troubleshooting

### Common Issues:

1. **"anchor not found"**: Make sure Anchor CLI is installed and in PATH
2. **"solana not found"**: Make sure Solana CLI is installed and in PATH
3. **Network errors**: Check your internet connection and firewall settings
4. **Permission errors**: Run PowerShell as Administrator

### Alternative: Use Docker

If you're having issues with local installation, you can use Docker:

```bash
# Pull the Solana development image
docker pull solanalabs/solana:v1.18.4

# Run with volume mount
docker run -it --rm -v ${PWD}:/workspace solanalabs/solana:v1.18.4 bash
```

## Current Status

For now, the system is set up with mock smart contract integration, so you can:

✅ Test the full frontend-backend flow
✅ Create and deploy collections
✅ Mint NFTs (simulated)
✅ Test all UI components

The smart contracts are ready to deploy when you have the toolchain set up.

## Next Steps

1. Follow the installation steps above
2. Deploy the contracts to Analos devnet
3. Update the backend with the real program ID
4. Test with real blockchain transactions

---

**Note**: The current mock setup allows you to test the entire application flow without needing the full Solana toolchain installed.
