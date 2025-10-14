# ====================================
# Sync to Analos Programs Verification Repository
# ====================================

Write-Host "🔐 Syncing to analos-programs verification repository..." -ForegroundColor Cyan

$sourceRepo = "C:\Users\dusti\OneDrive\Desktop\anal404s\analos-nft-launchpad"
$targetRepo = "C:\Users\dusti\OneDrive\Desktop\anal404s\analos-programs"

# Check if target repo exists
if (-not (Test-Path $targetRepo)) {
    Write-Host "❌ Target repository not found at: $targetRepo" -ForegroundColor Red
    Write-Host "📝 Please clone https://github.com/Dubie-eth/analos-programs first" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Target repository found" -ForegroundColor Green

# Create directories if they don't exist
Write-Host "📁 Creating directory structure..." -ForegroundColor Cyan
New-Item -ItemType Directory -Force -Path "$targetRepo\programs" | Out-Null
New-Item -ItemType Directory -Force -Path "$targetRepo\idl" | Out-Null
New-Item -ItemType Directory -Force -Path "$targetRepo\docs" | Out-Null

# Copy program source files
Write-Host "📦 Copying program source files..." -ForegroundColor Cyan

$programs = @(
    "analos-price-oracle",
    "analos-rarity-oracle",
    "analos-token-launch",
    "analos-nft-launchpad",
    "analos-otc-enhanced",
    "analos-airdrop-enhanced",
    "analos-vesting-enhanced",
    "analos-token-lock-enhanced",
    "analos-monitoring-system"
)

foreach ($program in $programs) {
    $sourcePath = "$sourceRepo\programs\$program"
    $targetPath = "$targetRepo\programs\$program"
    
    if (Test-Path $sourcePath) {
        Write-Host "  📄 Copying $program..." -ForegroundColor Gray
        Copy-Item -Path $sourcePath -Destination $targetPath -Recurse -Force
        Write-Host "  ✅ $program copied" -ForegroundColor Green
    } else {
        Write-Host "  ⚠️  $program not found, skipping..." -ForegroundColor Yellow
    }
}

# Copy IDL files
Write-Host "📜 Copying IDL files..." -ForegroundColor Cyan
$idlSource = "$sourceRepo\minimal-repo\src\idl"
if (Test-Path $idlSource) {
    Copy-Item -Path "$idlSource\*.json" -Destination "$targetRepo\idl\" -Force
    Write-Host "✅ IDL files copied" -ForegroundColor Green
} else {
    Write-Host "⚠️  IDL directory not found" -ForegroundColor Yellow
}

# Copy documentation
Write-Host "📚 Copying documentation..." -ForegroundColor Cyan

$docs = @{
    "COMPLETE-SYSTEM-INTEGRATION.md" = "ARCHITECTURE.md"
    "DEPLOY-NFT-LAUNCHPAD-PLAYGROUND.md" = "DEPLOYMENT-GUIDE.md"
    "UPDATE-ANALOS-PROGRAMS-REPO.md" = "VERIFICATION-GUIDE.md"
}

foreach ($doc in $docs.GetEnumerator()) {
    $sourcePath = "$sourceRepo\$($doc.Key)"
    $targetPath = "$targetRepo\docs\$($doc.Value)"
    
    if (Test-Path $sourcePath) {
        Copy-Item -Path $sourcePath -Destination $targetPath -Force
        Write-Host "  ✅ $($doc.Key) → $($doc.Value)" -ForegroundColor Green
    }
}

# Copy root files
Write-Host "📋 Copying root configuration files..." -ForegroundColor Cyan

# Copy Anchor.toml
if (Test-Path "$sourceRepo\Anchor.toml") {
    Copy-Item -Path "$sourceRepo\Anchor.toml" -Destination "$targetRepo\Anchor.toml" -Force
    Write-Host "✅ Anchor.toml copied" -ForegroundColor Green
}

# Copy Cargo.toml
if (Test-Path "$sourceRepo\Cargo.toml") {
    Copy-Item -Path "$sourceRepo\Cargo.toml" -Destination "$targetRepo\Cargo.toml" -Force
    Write-Host "✅ Cargo.toml copied" -ForegroundColor Green
}

# Copy .gitignore
if (Test-Path "$sourceRepo\.gitignore") {
    Copy-Item -Path "$sourceRepo\.gitignore" -Destination "$targetRepo\.gitignore" -Force
    Write-Host "✅ .gitignore copied" -ForegroundColor Green
}

Write-Host ""
Write-Host "🎉 Sync complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Next steps:" -ForegroundColor Cyan
Write-Host "  1. cd $targetRepo" -ForegroundColor Gray
Write-Host "  2. Review the changes" -ForegroundColor Gray
Write-Host "  3. Create/update README.md, SECURITY.md, and security.txt" -ForegroundColor Gray
Write-Host "  4. git add ." -ForegroundColor Gray
Write-Host "  5. git commit -m '🔐 Complete program verification update'" -ForegroundColor Gray
Write-Host "  6. git push origin main" -ForegroundColor Gray
Write-Host ""
Write-Host "🔗 Repository: https://github.com/Dubie-eth/analos-programs" -ForegroundColor Cyan

