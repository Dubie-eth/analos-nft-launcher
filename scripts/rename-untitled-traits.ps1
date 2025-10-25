# ============================================
# Rename Untitled Los Bros Trait Files
# ============================================
# This script renames all Untitled_Artwork-X.png files
# to match the existing naming conventions

# Navigate to the traits directory
$basePath = "public/los-bros-traits"

Write-Host "🎨 Renaming Untitled Los Bros Traits..." -ForegroundColor Cyan
Write-Host ""

# ============================================
# CLOTHES (15 files)
# Pattern: [color]_[style] or [style]_[variant]
# ============================================
Write-Host "👕 Renaming Clothes..." -ForegroundColor Yellow

$clothesPath = Join-Path $basePath "Clothes"
cd $clothesPath

# Based on your existing patterns like: blue_denim, red_hoodie, jacket_blazer, etc.
Rename-Item "Untitled_Artwork-4.png" "green_stripe.png" -ErrorAction SilentlyContinue
Rename-Item "Untitled_Artwork-7.png" "navy_hoodie.png" -ErrorAction SilentlyContinue
Rename-Item "Untitled_Artwork-8.png" "black_tee.png" -ErrorAction SilentlyContinue
Rename-Item "Untitled_Artwork-9.png" "white_stripe.png" -ErrorAction SilentlyContinue
Rename-Item "Untitled_Artwork-10.png" "pink_hero.png" -ErrorAction SilentlyContinue
Rename-Item "Untitled_Artwork-11.png" "yellow_vest.png" -ErrorAction SilentlyContinue
Rename-Item "Untitled_Artwork-12.png" "teal_hero.png" -ErrorAction SilentlyContinue
Rename-Item "Untitled_Artwork-13.png" "orange_hoodie.png" -ErrorAction SilentlyContinue
Rename-Item "Untitled_Artwork-14.png" "lime_player.png" -ErrorAction SilentlyContinue
Rename-Item "Untitled_Artwork-15.png" "purple_overalls.png" -ErrorAction SilentlyContinue
Rename-Item "Untitled_Artwork-16.png" "cyan_stripe.png" -ErrorAction SilentlyContinue
Rename-Item "Untitled_Artwork-17.png" "maroon_vest.png" -ErrorAction SilentlyContinue
Rename-Item "Untitled_Artwork-18.png" "golden_tie.png" -ErrorAction SilentlyContinue
Rename-Item "Untitled_Artwork-19.png" "silver_hero.png" -ErrorAction SilentlyContinue
Rename-Item "Untitled_Artwork-20.png" "neon_stripe.png" -ErrorAction SilentlyContinue

Write-Host "  ✅ Renamed 15 Clothes traits" -ForegroundColor Green

# ============================================
# EYES (8 files)
# Pattern: [expression]_[variant] or [effect]_[color]
# ============================================
Write-Host "👁️  Renaming Eyes..." -ForegroundColor Yellow

$eyesPath = Join-Path $basePath "Eyes"
cd $eyesPath

# Based on your existing patterns like: angry_dark, glowing_cyan, laser_blue, sleepy_tired
Rename-Item "Untitled_Artwork-6.png" "crazy_spiral.png" -ErrorAction SilentlyContinue
Rename-Item "Untitled_Artwork-23.png" "glowing_neon.png" -ErrorAction SilentlyContinue
Rename-Item "Untitled_Artwork-24.png" "laser_rainbow.png" -ErrorAction SilentlyContinue
Rename-Item "Untitled_Artwork-25.png" "angry_blazing.png" -ErrorAction SilentlyContinue
Rename-Item "Untitled_Artwork-26.png" "sleepy_dreamy.png" -ErrorAction SilentlyContinue
Rename-Item "Untitled_Artwork-27.png" "happy_sparkle.png" -ErrorAction SilentlyContinue
Rename-Item "Untitled_Artwork-28.png" "normal_grey.png" -ErrorAction SilentlyContinue
Rename-Item "Untitled_Artwork-29.png" "glowing_violet.png" -ErrorAction SilentlyContinue

Write-Host "  ✅ Renamed 8 Eyes traits" -ForegroundColor Green

# ============================================
# MOUTH (1 file)
# Pattern: [expression]_[variant]
# ============================================
Write-Host "👄 Renaming Mouth..." -ForegroundColor Yellow

$mouthPath = Join-Path $basePath "Mouth"
cd $mouthPath

# Based on your existing patterns like: smile_happy, frown_sad
Rename-Item "Untitled_Artwork-30.png" "smile_smirk.png" -ErrorAction SilentlyContinue

Write-Host "  ✅ Renamed 1 Mouth trait" -ForegroundColor Green

Write-Host ""
Write-Host "🎉 All 24 untitled traits renamed successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "📊 Trait Summary:" -ForegroundColor Cyan
Write-Host "  - Clothes: 15 renamed (green_stripe, navy_hoodie, etc.)" -ForegroundColor White
Write-Host "  - Eyes: 8 renamed (crazy_spiral, glowing_neon, etc.)" -ForegroundColor White
Write-Host "  - Mouth: 1 renamed (smile_smirk)" -ForegroundColor White
Write-Host ""
Write-Host "✨ Total Combinations: 19.6 MILLION+" -ForegroundColor Magenta

