@echo off
echo 🚀 Deploying Analos NFT Launcher Smart Contracts...

REM Check if Anchor is installed
anchor --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Anchor CLI not found. Please install Anchor first:
    echo    npm install -g @coral-xyz/anchor-cli
    exit /b 1
)

REM Check if Solana CLI is installed
solana --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Solana CLI not found. Please install Solana CLI first:
    echo    Visit: https://docs.solana.com/cli/install-solana-cli-tools
    exit /b 1
)

REM Navigate to contracts directory
cd contracts

echo 📦 Building smart contracts...
anchor build
if %errorlevel% neq 0 (
    echo ❌ Build failed!
    exit /b 1
)

echo 🧪 Running tests...
anchor test
if %errorlevel% neq 0 (
    echo ❌ Tests failed!
    exit /b 1
)

echo 🚀 Deploying to Analos devnet...
anchor deploy --provider.cluster devnet
if %errorlevel% neq 0 (
    echo ❌ Deployment failed!
    exit /b 1
)

echo ✅ Smart contracts deployed successfully!
echo 📝 Program ID: 
solana address -k target/deploy/analos_nft_launcher-keypair.json
echo 🌐 Network: Analos Devnet
echo 🔗 Explorer: https://explorer.analos.io

echo 📝 Update your backend with the Program ID above
pause
