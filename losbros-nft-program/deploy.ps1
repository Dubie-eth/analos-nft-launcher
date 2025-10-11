# Deploy Los Bros NFT Program to Analos
Write-Host "🚀 Deploying Los Bros NFT Program to Analos..." -ForegroundColor Green

# Set environment variables
$env:HOME = $env:USERPROFILE

# Build the program
Write-Host "🔨 Building program..." -ForegroundColor Yellow
try {
    anchor build --provider.cluster https://rpc.analos.io
    Write-Host "✅ Build successful!" -ForegroundColor Green
} catch {
    Write-Host "❌ Build failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Deploy the program
Write-Host "🚀 Deploying to Analos..." -ForegroundColor Yellow
try {
    solana program deploy target/deploy/losbros_nft_program.so --program-id target/deploy/losbros_nft_program-keypair.json
    Write-Host "✅ Deployment successful!" -ForegroundColor Green
    Write-Host "📍 Program ID: G2P93mEMB46JhuA6rWRUMWZNJFEHJ5Bc1mUNetbUH7wR" -ForegroundColor Cyan
} catch {
    Write-Host "❌ Deployment failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host "🎉 Program deployed successfully to Analos!" -ForegroundColor Green
Write-Host "🔗 You can now use this program ID in your frontend" -ForegroundColor Cyan
