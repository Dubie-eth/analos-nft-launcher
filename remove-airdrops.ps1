# PowerShell script to remove airdrop-related code

$sourceFile = "MEGA-NFT-LAUNCHPAD-CORE.rs"
$outputFile = "MEGA-NFT-LAUNCHPAD-CORE-STREAMLINED.rs"

# Read the entire file
$content = Get-Content $sourceFile -Raw

# Remove PlatformFeeTreasury constant
$content = $content -replace 'pub const PLATFORM_FEE_BPS: u16 = 250;.*?\n', ''

# Remove functions
$functionsToRemove = @(
    'pub fn create_creator_airdrop_campaign',
    'pub fn activate_creator_airdrop_campaign',
    'pub fn claim_creator_airdrop'
)

# Remove structs
$structsToRemove = @(
    'pub struct PlatformFeeTreasury',
    'pub struct CreatorAirdropCampaign',
    'pub struct AirdropClaimRecord',
    'pub struct CreateCreatorAirdropCampaign',
    'pub struct ActivateCreatorAirdropCampaign',
    'pub struct ClaimCreatorAirdrop'
)

# Remove error codes
$errorsToRemove = @(
    'CampaignInactive',
    'CampaignNotStarted',
    'CampaignEnded',
    'AlreadyClaimed',
    'InsufficientFee'
)

Write-Output "Removing airdrop-related code..."
Write-Output "This will create: $outputFile"
Write-Output "Please manually review and compile the result."

# Save
$content | Set-Content $outputFile

Write-Output "Done! Please review $outputFile"

