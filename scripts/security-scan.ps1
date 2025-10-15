# 🔒 SECURITY SCAN SCRIPT (Windows PowerShell)
# Scans for keypair files and enforces security rules

Write-Host "🔒 Running Security Scan..." -ForegroundColor Cyan

# Security violations counter
$VIOLATIONS = 0

Write-Host "📋 Checking Security Rules..." -ForegroundColor Yellow

# Rule 1: Check for keypairs in project root
Write-Host "🔍 Rule 1: Checking for keypairs in project root..." -ForegroundColor Yellow
$ROOT_KEYPAIRS = Get-ChildItem -Path . -Name "*keypair*.json", "*wallet*.json" -File | Where-Object { $_ -notlike ".secure-keypairs*" }

if ($ROOT_KEYPAIRS) {
    Write-Host "❌ VIOLATION: Keypair files found in project root!" -ForegroundColor Red
    Write-Host "Files found:" -ForegroundColor Red
    $ROOT_KEYPAIRS | ForEach-Object { Write-Host "  $_" -ForegroundColor Red }
    Write-Host "Move these files to .secure-keypairs/ directory immediately!" -ForegroundColor Red
    $VIOLATIONS++
} else {
    Write-Host "✅ PASS: No keypairs in project root" -ForegroundColor Green
}

# Rule 2: Check for temporary keypair files
Write-Host "🔍 Rule 2: Checking for temporary keypair files..." -ForegroundColor Yellow
$TEMP_FILES = Get-ChildItem -Path . -Recurse -Name "temp-*.json", "tmp-*.json" | Where-Object { $_ -notlike ".secure-keypairs*" }

if ($TEMP_FILES) {
    Write-Host "❌ VIOLATION: Temporary keypair files found!" -ForegroundColor Red
    Write-Host "Files found:" -ForegroundColor Red
    $TEMP_FILES | ForEach-Object { Write-Host "  $_" -ForegroundColor Red }
    Write-Host "Delete these temporary files immediately!" -ForegroundColor Red
    $VIOLATIONS++
} else {
    Write-Host "✅ PASS: No temporary keypair files" -ForegroundColor Green
}

# Rule 3: Check git staging for sensitive files
Write-Host "🔍 Rule 3: Checking git staging for sensitive files..." -ForegroundColor Yellow
try {
    $STAGED_FILES = git diff --cached --name-only 2>$null | Where-Object { $_ -match "\.json$" -and $_ -match "(keypair|wallet|private)" }
    
    if ($STAGED_FILES) {
        Write-Host "❌ VIOLATION: Sensitive files staged for commit!" -ForegroundColor Red
        Write-Host "Files staged:" -ForegroundColor Red
        $STAGED_FILES | ForEach-Object { Write-Host "  $_" -ForegroundColor Red }
        Write-Host "Remove these files from staging immediately!" -ForegroundColor Red
        $VIOLATIONS++
    } else {
        Write-Host "✅ PASS: No sensitive files in git staging" -ForegroundColor Green
    }
} catch {
    Write-Host "⚠️  Could not check git staging (git not available)" -ForegroundColor Yellow
}

# Rule 4: Verify .secure-keypairs directory exists and is protected
Write-Host "🔍 Rule 4: Checking secure storage..." -ForegroundColor Yellow
if (Test-Path ".secure-keypairs") {
    Write-Host "✅ PASS: Secure keypairs directory exists" -ForegroundColor Green
    
    # Check if directory is git-ignored
    if (Test-Path ".gitignore") {
        $GITIGNORE_CONTENT = Get-Content ".gitignore" -Raw
        if ($GITIGNORE_CONTENT -match "\.secure-keypairs") {
            Write-Host "✅ PASS: Secure directory is git-ignored" -ForegroundColor Green
        } else {
            Write-Host "❌ VIOLATION: Secure directory not git-ignored!" -ForegroundColor Red
            $VIOLATIONS++
        }
    }
} else {
    Write-Host "❌ VIOLATION: Secure keypairs directory missing!" -ForegroundColor Red
    $VIOLATIONS++
}

# Rule 5: Check for hardcoded private keys in code
Write-Host "🔍 Rule 5: Scanning for hardcoded private keys..." -ForegroundColor Yellow
$CODE_FILES = Get-ChildItem -Path . -Recurse -Include "*.rs", "*.ts", "*.js", "*.tsx" | Where-Object { $_.FullName -notlike "*\.secure-keypairs*" -and $_.FullName -notlike "*scripts*" }

$HARDCODED_KEYS = $CODE_FILES | Select-String -Pattern "\[[\d,\s]{64,}\]" | Where-Object { $_.Filename -notlike "*test*" }

if ($HARDCODED_KEYS) {
    Write-Host "❌ VIOLATION: Potential hardcoded private keys found!" -ForegroundColor Red
    Write-Host "Files with potential private keys:" -ForegroundColor Red
    $HARDCODED_KEYS | ForEach-Object { Write-Host "  $($_.Filename):$($_.LineNumber)" -ForegroundColor Red }
    Write-Host "Remove hardcoded private keys immediately!" -ForegroundColor Red
    $VIOLATIONS++
} else {
    Write-Host "✅ PASS: No hardcoded private keys found" -ForegroundColor Green
}

# Summary
Write-Host ""
Write-Host "📊 Security Scan Summary:" -ForegroundColor Cyan
if ($VIOLATIONS -eq 0) {
    Write-Host "✅ ALL SECURITY RULES PASSED!" -ForegroundColor Green
    Write-Host "🛡️ System is secure" -ForegroundColor Green
    exit 0
} else {
    Write-Host "❌ $VIOLATIONS SECURITY VIOLATIONS FOUND!" -ForegroundColor Red
    Write-Host "🚨 IMMEDIATE ACTION REQUIRED" -ForegroundColor Red
    Write-Host ""
    Write-Host "🔒 The 5 Golden Rules:" -ForegroundColor Yellow
    Write-Host "1. 🚫 NEVER leave keypairs in project root" -ForegroundColor Yellow
    Write-Host "2. 🗑️ ALWAYS delete temporary copies after use" -ForegroundColor Yellow
    Write-Host "3. 📵 NEVER commit keypair files to git" -ForegroundColor Yellow
    Write-Host "4. ✅ ALWAYS verify recipient before sharing" -ForegroundColor Yellow
    Write-Host "5. 🔐 ALWAYS use secure communication channels" -ForegroundColor Yellow
    exit 1
}
