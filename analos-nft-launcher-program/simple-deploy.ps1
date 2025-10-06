# Simple deployment script for Analos NFT Launcher
Write-Host "🚀 Deploying Analos NFT Launcher Program" -ForegroundColor Green

# Set environment variables
$env:HOME = $env:USERPROFILE

# Configure for Analos
Write-Host "📡 Configuring for Analos network..." -ForegroundColor Yellow
solana config set --url https://rpc.analos.io

# Check balance
Write-Host "💰 Checking wallet balance..." -ForegroundColor Yellow
$balance = solana balance
Write-Host "Current balance: $balance SOL" -ForegroundColor Cyan

# Try to deploy using the existing program ID
Write-Host "🚀 Attempting to deploy program..." -ForegroundColor Yellow
try {
    # Check if we have a program file
    $programFile = "target/deploy/analos_nft_launcher_program.so"
    if (Test-Path $programFile) {
        Write-Host "✅ Found program file: $programFile" -ForegroundColor Green
        solana program deploy $programFile --program-id target/deploy/analos_nft_launcher_program-keypair.json
    } else {
        Write-Host "❌ Program file not found: $programFile" -ForegroundColor Red
        Write-Host "💡 Let's try a different approach..." -ForegroundColor Yellow
        
        # Try to create a simple program
        Write-Host "🔨 Creating simple program..." -ForegroundColor Yellow
        solana program write-buffer target/deploy/analos_nft_launcher_program.so --program-id 9dEJ2oK4cgDE994FU9za4t2BN7mFwSCfhSsLTGD3a4ym
    }
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ DEPLOYMENT SUCCESSFUL!" -ForegroundColor Green
        Write-Host "📋 Program ID: 9dEJ2oK4cgDE994FU9za4t2BN7mFwSCfhSsLTGD3a4ym" -ForegroundColor Cyan
        Write-Host "🌐 Network: https://rpc.analos.io" -ForegroundColor Cyan
        Write-Host "🔗 Explorer: https://explorer.analos.io/account/9dEJ2oK4cgDE994FU9za4t2BN7mFwSCfhSsLTGD3a4ym" -ForegroundColor Cyan
    } else {
        Write-Host "❌ Deployment failed!" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "🎉 Deployment process completed!" -ForegroundColor Green
