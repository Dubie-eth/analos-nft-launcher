# Analos Name Service (ANS) - Build and Deploy Script
# =====================================================

Write-Host "🔨 Building Analos Name Service (ANS) Program..." -ForegroundColor Cyan
Write-Host ""

# Check if Anchor is installed
$anchorVersion = anchor --version 2>$null
if (-not $anchorVersion) {
    Write-Host "❌ Anchor not found! Installing Anchor..." -ForegroundColor Red
    Write-Host ""
    Write-Host "Please install Anchor first:" -ForegroundColor Yellow
    Write-Host "  cargo install --git https://github.com/coral-xyz/anchor avm --locked --force" -ForegroundColor Yellow
    Write-Host "  avm install latest" -ForegroundColor Yellow
    Write-Host "  avm use latest" -ForegroundColor Yellow
    Write-Host ""
    
    # Try building with cargo-build-sbf instead
    Write-Host "Attempting to build with cargo-build-sbf..." -ForegroundColor Yellow
    
    cd ../..
    cargo build-sbf --manifest-path programs/analos-name-service/Cargo.toml --sbf-out-dir target/deploy
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Build failed! Please install Anchor." -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "📦 Building with Anchor ($anchorVersion)..." -ForegroundColor Green
    
    cd ../..
    anchor build --program-name analos_name_service
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Build failed!" -ForegroundColor Red
        exit 1
    }
}

Write-Host ""
Write-Host "✅ Build successful!" -ForegroundColor Green
Write-Host ""

# Show the program binary
if (Test-Path "target/deploy/analos_name_service.so") {
    Write-Host "📁 Program binary:" -ForegroundColor Cyan
    Get-Item target/deploy/analos_name_service.so | Format-Table Name, Length, LastWriteTime
    
    Write-Host ""
    Write-Host "🎯 Program ID will be generated on deployment" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "🚀 To deploy to Analos, run:" -ForegroundColor Green
    Write-Host "  solana config set --url https://rpc.analos.io" -ForegroundColor White
    Write-Host "  solana program deploy target/deploy/analos_name_service.so --with-compute-unit-price 1000 --max-sign-attempts 100 --use-quic" -ForegroundColor White
    Write-Host ""
} else {
    Write-Host "❌ Binary not found at target/deploy/analos_name_service.so" -ForegroundColor Red
}

