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

# Try to build with cargo directly
Write-Host "🔨 Building program with cargo..." -ForegroundColor Yellow
try {
    # Remove problematic lock file
    if (Test-Path "Cargo.lock") {
        Remove-Item "Cargo.lock" -Force
    }
    
    # Try building with cargo directly
    cargo build-sbf --manifest-path programs/analos-nft-launcher-program/Cargo.toml
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Build successful!" -ForegroundColor Green
        
        # Check if the program file exists
        $programFile = "target/deploy/analos_nft_launcher_program.so"
        if (Test-Path $programFile) {
            Write-Host "🚀 Deploying program to Analos..." -ForegroundColor Yellow
            solana program deploy $programFile --program-id target/deploy/analos_nft_launcher_program-keypair.json
            
            if ($LASTEXITCODE -eq 0) {
                Write-Host "✅ DEPLOYMENT SUCCESSFUL!" -ForegroundColor Green
                Write-Host "📋 Program ID: 9dEJ2oK4cgDE994FU9za4t2BN7mFwSCfhSsLTGD3a4ym" -ForegroundColor Cyan
                Write-Host "🌐 Network: https://rpc.analos.io" -ForegroundColor Cyan
                Write-Host "🔗 Explorer: https://explorer.analos.io/account/9dEJ2oK4cgDE994FU9za4t2BN7mFwSCfhSsLTGD3a4ym" -ForegroundColor Cyan
            } else {
                Write-Host "❌ Deployment failed!" -ForegroundColor Red
            }
        } else {
            Write-Host "❌ Program file not found: $programFile" -ForegroundColor Red
        }
    } else {
        Write-Host "❌ Build failed!" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "🎉 Deployment process completed!" -ForegroundColor Green
