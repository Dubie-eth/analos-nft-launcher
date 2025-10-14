# Security Check Script - Scan for Exposed Secrets
# Run this before every commit!

Write-Host "🔐 Checking for exposed secrets..." -ForegroundColor Cyan

$foundIssues = $false

# Check for keypair files
Write-Host "`nChecking for keypair files..." -ForegroundColor Yellow
$keypairFiles = git ls-files | Select-String "keypair.*\.json"
if ($keypairFiles) {
    Write-Host "❌ FOUND KEYPAIR FILES IN GIT:" -ForegroundColor Red
    $keypairFiles | ForEach-Object { Write-Host "  - $_" -ForegroundColor Red }
    $foundIssues = $true
} else {
    Write-Host "✅ No keypair files found in git" -ForegroundColor Green
}

# Check for .env files
Write-Host "`nChecking for .env files..." -ForegroundColor Yellow
$envFiles = git ls-files | Select-String "\.env"
if ($envFiles) {
    Write-Host "⚠️  FOUND .ENV FILES IN GIT:" -ForegroundColor Red
    $envFiles | ForEach-Object { Write-Host "  - $_" -ForegroundColor Red }
    $foundIssues = $true
} else {
    Write-Host "✅ No .env files found in git" -ForegroundColor Green
}

# Check for common private key patterns in staged files
Write-Host "`nScanning staged files for private key patterns..." -ForegroundColor Yellow
$stagedFiles = git diff --cached --name-only --diff-filter=ACM

foreach ($file in $stagedFiles) {
    if (Test-Path $file) {
        $content = Get-Content $file -Raw
        
        # Check for various private key patterns
        if ($content -match '"private.*[Kk]ey"' -or 
            $content -match '\[(\d+,\s*){10,}\d+\]' -or  # Array of numbers (keypair format)
            $content -match 'BEGIN.*PRIVATE KEY' -or
            $content -match 'secret.*=.*"[A-Za-z0-9+/=]{32,}"') {
            
            Write-Host "⚠️  WARNING: Potential private key pattern in: $file" -ForegroundColor Red
            $foundIssues = $true
        }
    }
}

# Check for untracked keypair files
Write-Host "`nChecking for untracked keypair files..." -ForegroundColor Yellow
$untrackedKeypairs = git status --porcelain | Select-String "^\?\?.*keypair"
if ($untrackedKeypairs) {
    Write-Host "⚠️  Found untracked keypair files (good - keep them untracked!):" -ForegroundColor Yellow
    $untrackedKeypairs | ForEach-Object { Write-Host "  - $_" -ForegroundColor Yellow }
}

# Final report
Write-Host "`n" + "="*60 -ForegroundColor Cyan
if ($foundIssues) {
    Write-Host "❌ SECURITY ISSUES FOUND!" -ForegroundColor Red
    Write-Host "Please review the issues above before committing." -ForegroundColor Red
    Write-Host "`nSee SECURE-KEY-MANAGEMENT.md for guidance." -ForegroundColor Yellow
    exit 1
} else {
    Write-Host "✅ No security issues detected!" -ForegroundColor Green
    Write-Host "Safe to commit." -ForegroundColor Green
    exit 0
}

