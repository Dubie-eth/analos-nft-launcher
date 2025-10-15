# PowerShell Script to Update All Security.txt Files and Add Security Macros
# Based on Solana's official security.txt implementation

Write-Host "🔐 Analos Security.txt Update Script" -ForegroundColor Cyan
Write-Host "====================================`n" -ForegroundColor Cyan

# ====================
# CONFIGURE YOUR INFO
# ====================
Write-Host "⚠️  IMPORTANT: Update these variables with YOUR actual information:`n" -ForegroundColor Yellow

$GITHUB_USERNAME = Read-Host "Enter your GitHub username"
$SECURITY_EMAIL = Read-Host "Enter your security email (e.g., support@launchonlos.fun)"
$TWITTER_HANDLE = Read-Host "Enter your Twitter handle (e.g., @analos_io)"
$DISCORD_SERVER = Read-Host "Enter your Discord server (e.g., analos)"
$GITHUB_REPO = Read-Host "Enter your repository name (e.g., analos-nft-launchpad)"

Write-Host "`n✓ Configuration received!" -ForegroundColor Green
Write-Host "Updating files...`n" -ForegroundColor Cyan

# Program definitions
$programs = @(
    @{
        Name = "Analos NFT Launchpad"
        LibName = "analos_nft_launchpad"
        ProgramID = "5gmaywNK418QzG7eFA7qZLJkCGS8cfcPtm4b2RZQaJHT"
        Folder = "analos-nft-launchpad"
    },
    @{
        Name = "Analos Token Launch"
        LibName = "analos_token_launch"
        ProgramID = "CDJZZCSod3YS9crpWAvWSLWEpPyx9QZCRRAcv7xL1FZf"
        Folder = "analos-token-launch"
    },
    @{
        Name = "Analos Rarity Oracle"
        LibName = "analos_rarity_oracle"
        ProgramID = "3cnHMbD3Y88BZbxEPzv7WZGkN12X2bwKEP4FFtaVd5B2"
        Folder = "analos-rarity-oracle"
    },
    @{
        Name = "Analos Price Oracle"
        LibName = "analos_price_oracle"
        ProgramID = "5ihyquuoRJXTocBhjEA48rGQGsM9ZB6HezYE1dQq8NUD"
        Folder = "analos-price-oracle"
    },
    @{
        Name = "Analos OTC Enhanced"
        LibName = "analos_otc_enhanced"
        ProgramID = "7hnWVgRxu2dNWiNAzNB2jWoubzMcdY6HNysjhLiawXPY"
        Folder = "analos-otc-enhanced"
    },
    @{
        Name = "Analos Airdrop Enhanced"
        LibName = "analos_airdrop_enhanced"
        ProgramID = "J2D1LiSGxj9vTN7vc3CUD1LkrnqanAeAoAhE2nvvyXHC"
        Folder = "analos-airdrop-enhanced"
    },
    @{
        Name = "Analos Vesting Enhanced"
        LibName = "analos_vesting_enhanced"
        ProgramID = "Ae3hXKsHzYPCPUKLtq2mdYZ3E2oKeKrF63ekceGxpHsY"
        Folder = "analos-vesting-enhanced"
    },
    @{
        Name = "Analos Token Lock Enhanced"
        LibName = "analos_token_lock_enhanced"
        ProgramID = "3WmPLvyFpmQ8yPHh7nLxj6FLSATn2uVeD2ceNpuRKwZH"
        Folder = "analos-token-lock-enhanced"
    },
    @{
        Name = "Analos Monitoring System"
        LibName = "analos_monitoring_system"
        ProgramID = "7PT1ubRGFWXFCmZTpsa9gtm9GZf8BaYTkSd7gE8VcXdG"
        Folder = "analos-monitoring-system"
    }
)

$updated = 0
$failed = 0

# Update security.txt files
foreach ($program in $programs) {
    $securityFile = "programs/$($program.Folder)/security.txt"
    
    if (Test-Path $securityFile) {
        try {
            $content = @"
name: "$($program.Name)"
project_url: "https://github.com/$GITHUB_USERNAME/$GITHUB_REPO"
contacts: "email:$SECURITY_EMAIL,discord:$DISCORD_SERVER,twitter:$TWITTER_HANDLE"
policy: "https://github.com/$GITHUB_USERNAME/$GITHUB_REPO/blob/main/SECURITY.md"
preferred_languages: "en"
source_code: "https://github.com/$GITHUB_USERNAME/$GITHUB_REPO"
source_revision: "$($program.ProgramID)"
source_release: "v1.0.0"
auditors: "None"
acknowledgements: "Thank you to all security researchers and contributors who help keep Analos secure."
expiry: ""
"@
            Set-Content -Path $securityFile -Value $content
            Write-Host "✓ Updated: $securityFile" -ForegroundColor Green
            $updated++
        }
        catch {
            Write-Host "✗ Failed: $securityFile - $($_.Exception.Message)" -ForegroundColor Red
            $failed++
        }
    }
    else {
        Write-Host "⚠  Not found: $securityFile" -ForegroundColor Yellow
    }
}

Write-Host "`n====================================`n" -ForegroundColor Cyan
Write-Host "Summary:" -ForegroundColor Cyan
Write-Host "✓ Updated: $updated files" -ForegroundColor Green
if ($failed -gt 0) {
    Write-Host "✗ Failed: $failed files" -ForegroundColor Red
}

Write-Host "`n📝 Next Steps:`n" -ForegroundColor Cyan
Write-Host "1. Review the updated security.txt files" -ForegroundColor White
Write-Host "2. Add security_txt! macro to each lib.rs file (see VERIFIED-BUILDS-IMPLEMENTATION.md)" -ForegroundColor White
Write-Host "3. Add 'solana-security-txt = `"1.1.1`"' to each Cargo.toml" -ForegroundColor White
Write-Host "4. Build with: solana-verify build" -ForegroundColor White
Write-Host "5. Deploy and verify your programs" -ForegroundColor White
Write-Host "6. Check https://explorer.analos.io/ for verification badge`n" -ForegroundColor White

Write-Host "✅ Script completed!" -ForegroundColor Green
Write-Host "`nFor detailed instructions, see: VERIFIED-BUILDS-IMPLEMENTATION.md`n" -ForegroundColor Cyan

# Generate verification commands
Write-Host "🔍 Verification Commands for Each Program:" -ForegroundColor Cyan
Write-Host "==========================================`n" -ForegroundColor Cyan

foreach ($program in $programs) {
    $command = @"
# $($program.Name)
solana-verify verify-from-repo -um \
  --program-id $($program.ProgramID) \
  --library-name $($program.LibName) \
  https://github.com/$GITHUB_USERNAME/$GITHUB_REPO \
  --commit-hash YOUR_COMMIT_HASH

"@
    Write-Host $command -ForegroundColor Gray
}

Write-Host "Copy these commands and run them after building and deploying your programs!" -ForegroundColor Yellow


