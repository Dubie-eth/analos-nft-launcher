# PowerShell Script to Update All Security.txt Files with Real Contact Info
# Based on Solana's official security.txt implementation

Write-Host "🔐 Updating Analos Security.txt Files with Your Info" -ForegroundColor Cyan
Write-Host "====================================================`n" -ForegroundColor Cyan

# Your actual contact information
$GITHUB_USERNAME = "Dubie-eth"
$GITHUB_REPO = "analos-nft-launchpad-program"
$SECURITY_EMAIL = "support@launchonlos.fun"
$TWITTER_HANDLE = "@EWildn"
$TELEGRAM = "t.me/Dubie_420"
$DISCORD_SERVER = "analos"  # Update this if you have a Discord
$PROJECT_URL = "https://analos.io"

Write-Host "📋 Using your information:" -ForegroundColor Green
Write-Host "   GitHub: $GITHUB_USERNAME/$GITHUB_REPO" -ForegroundColor White
Write-Host "   Twitter: $TWITTER_HANDLE" -ForegroundColor White
Write-Host "   Telegram: $TELEGRAM" -ForegroundColor White
Write-Host "   Email: $SECURITY_EMAIL`n" -ForegroundColor White

# Program definitions with your actual deployed IDs
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
            # Create security.txt in Solana's official format
            $content = @"
name: "$($program.Name)"
project_url: "https://github.com/$GITHUB_USERNAME/$GITHUB_REPO"
contacts: "email:$SECURITY_EMAIL,twitter:$TWITTER_HANDLE,telegram:$TELEGRAM"
policy: "https://github.com/$GITHUB_USERNAME/$GITHUB_REPO/blob/main/SECURITY.md"
preferred_languages: "en"
source_code: "https://github.com/$GITHUB_USERNAME/$GITHUB_REPO"
source_revision: "$($program.ProgramID)"
source_release: "v1.0.0"
auditors: "None"
acknowledgements: "Thank you to all security researchers who help keep Analos secure. Contact us at $SECURITY_EMAIL or via Twitter $TWITTER_HANDLE or Telegram $TELEGRAM"
expiry: ""
"@
            Set-Content -Path $securityFile -Value $content
            Write-Host "✓ Updated: $($program.Name)" -ForegroundColor Green
            $updated++
        }
        catch {
            Write-Host "✗ Failed: $($program.Name) - $($_.Exception.Message)" -ForegroundColor Red
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

# Create lib.rs code snippets for each program
Write-Host "`n📝 Next: Add security_txt! macro to each lib.rs file`n" -ForegroundColor Cyan
Write-Host "Add this to the TOP of each lib.rs (after imports):`n" -ForegroundColor Yellow

foreach ($program in $programs) {
    $rustCode = @"

// ==========================================
// For: programs/$($program.Folder)/src/lib.rs
// ==========================================
#[cfg(not(feature = "no-entrypoint"))]
use {default_env::default_env, solana_security_txt::security_txt};

#[cfg(not(feature = "no-entrypoint"))]
security_txt! {
    name: "$($program.Name)",
    project_url: "https://github.com/$GITHUB_USERNAME/$GITHUB_REPO",
    contacts: "email:$SECURITY_EMAIL,twitter:$TWITTER_HANDLE,telegram:$TELEGRAM",
    policy: "https://github.com/$GITHUB_USERNAME/$GITHUB_REPO/blob/main/SECURITY.md",
    preferred_languages: "en",
    source_code: "https://github.com/$GITHUB_USERNAME/$GITHUB_REPO",
    source_revision: "$($program.ProgramID)",
    source_release: "v1.0.0",
    auditors: "None",
    acknowledgements: "Thank you to all security researchers!"
}

"@
    Write-Host $rustCode -ForegroundColor Gray
}

Write-Host "`n📦 Also add to each Cargo.toml:" -ForegroundColor Yellow
Write-Host @"
[dependencies]
solana-security-txt = "1.1.1"
default-env = "0.1.1"
"@ -ForegroundColor Gray

Write-Host "`n🔍 After adding macros, you can verify locally:" -ForegroundColor Cyan
Write-Host "cargo install --git https://github.com/neodyme-labs/solana-security-txt query-security-txt" -ForegroundColor Gray
Write-Host "query-security-txt target/deploy/your_program.so`n" -ForegroundColor Gray

Write-Host "✅ Security.txt files updated with your info!" -ForegroundColor Green
Write-Host "`n📚 See VERIFIED-BUILDS-IMPLEMENTATION.md for full guide`n" -ForegroundColor Cyan

