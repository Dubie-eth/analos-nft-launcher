# Docker Build for ANS Program (Windows)
# ========================================

Write-Host "🐳 Building ANS Program in Docker..." -ForegroundColor Cyan
Write-Host ""

# Get current directory
$currentDir = Get-Location
$workspaceDir = (Get-Item $currentDir).Parent.Parent.FullName

Write-Host "📂 Workspace: $workspaceDir" -ForegroundColor Yellow
Write-Host ""

# Build using official Anchor Docker image
docker run --rm `
  -v "${workspaceDir}:/workspace" `
  -w /workspace `
  projectserum/build:v0.29.0 `
  anchor build

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Build successful!" -ForegroundColor Green
    Write-Host ""
    
    if (Test-Path "$workspaceDir/target/deploy/analos_name_service.so") {
        Write-Host "📁 Program binary:" -ForegroundColor Cyan
        Get-Item "$workspaceDir/target/deploy/analos_name_service.so" | Format-Table Name, Length, LastWriteTime
        
        Write-Host "📄 IDL file:" -ForegroundColor Cyan
        Get-Item "$workspaceDir/target/idl/analos_name_service.json" | Format-Table Name, Length, LastWriteTime
        
        Write-Host ""
        Write-Host "🚀 Ready to deploy to Analos!" -ForegroundColor Green
        Write-Host ""
        Write-Host "Deploy commands:" -ForegroundColor Yellow
        Write-Host "  solana config set --url https://rpc.analos.io" -ForegroundColor White
        Write-Host "  solana program deploy target/deploy/analos_name_service.so --with-compute-unit-price 1000 --max-sign-attempts 100 --use-quic" -ForegroundColor White
    } else {
        Write-Host "❌ Binary not found!" -ForegroundColor Red
    }
} else {
    Write-Host ""
    Write-Host "❌ Build failed!" -ForegroundColor Red
    exit 1
}

