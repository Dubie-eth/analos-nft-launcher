# ============================================
# RENAME REMAINING UNTITLED LOS BROS TRAITS
# ============================================
# This script renames the remaining untitled trait files
# after the first batch was renamed

Write-Host "`n🎨 Renaming Remaining Untitled Los Bros Traits...`n" -ForegroundColor Cyan

$baseDir = "C:\Users\dusti\OneDrive\Desktop\anal404s\analos-nft-launchpad\public\los-bros-traits"

# ============================================
# EYES (8 files: #6, #23-29)
# ============================================
Write-Host "👁️  Renaming Eyes..." -ForegroundColor Yellow
Set-Location "$baseDir\Eyes"

Rename-Item -Path "Untitled_Artwork-6.png" -NewName "surprised_wide.png"
Rename-Item -Path "Untitled_Artwork-23.png" -NewName "curious_look.png"
Rename-Item -Path "Untitled_Artwork-24.png" -NewName "focused_stare.png"
Rename-Item -Path "Untitled_Artwork-25.png" -NewName "winking_left.png"
Rename-Item -Path "Untitled_Artwork-26.png" -NewName "sad_tears.png"
Rename-Item -Path "Untitled_Artwork-27.png" -NewName "shocked_big.png"
Rename-Item -Path "Untitled_Artwork-28.png" -NewName "shifty_side.png"
Rename-Item -Path "Untitled_Artwork-29.png" -NewName "dizzy_spiral.png"

Write-Host "  ✅ Renamed 8 Eyes traits" -ForegroundColor Green

# ============================================
# HATS (3 files: #5, #21-22)
# ============================================
Write-Host "🎩 Renaming Hats..." -ForegroundColor Yellow
Set-Location "$baseDir\Hats"

Rename-Item -Path "Untitled_Artwork-5.png" -NewName "visor_sport.png"
Rename-Item -Path "Untitled_Artwork-21.png" -NewName "beanie_striped.png"
Rename-Item -Path "Untitled_Artwork-22.png" -NewName "sombrero_classic.png"

Write-Host "  ✅ Renamed 3 Hat traits" -ForegroundColor Green

# ============================================
# MOUTH (1 file: #30)
# ============================================
Write-Host "👄 Renaming Mouth..." -ForegroundColor Yellow
Set-Location "$baseDir\Mouth"

Rename-Item -Path "Untitled_Artwork-30.png" -NewName "neutral_line.png"

Write-Host "  ✅ Renamed 1 Mouth trait" -ForegroundColor Green

# ============================================
# SUMMARY
# ============================================
Write-Host "`n🎉 All 12 remaining untitled traits renamed successfully!`n" -ForegroundColor Green
Write-Host "📊 Final Summary:" -ForegroundColor Cyan
Write-Host "  - Eyes: 8 renamed (surprised_wide, curious_look, focused_stare, winking_left, sad_tears, shocked_big, shifty_side, dizzy_spiral)" -ForegroundColor White
Write-Host "  - Hats: 3 renamed (visor_sport, beanie_striped, sombrero_classic)" -ForegroundColor White
Write-Host "  - Mouth: 1 renamed (neutral_line)" -ForegroundColor White
Write-Host "`n✨ Total: 36 trait files now properly named!" -ForegroundColor Magenta
Write-Host "✨ 19.6 MILLION+ possible combinations!" -ForegroundColor Magenta

