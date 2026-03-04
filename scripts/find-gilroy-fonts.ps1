# Script to find Gilroy font files on Windows system
Write-Host "Searching for Gilroy font files..." -ForegroundColor Cyan

$searchPaths = @(
    "C:\Windows\Fonts",
    "$env:LOCALAPPDATA\Microsoft\Windows\Fonts",
    "$env:USERPROFILE\AppData\Local\Figma\fonts",
    "$env:USERPROFILE\AppData\Roaming\Affinity\fonts"
)

$foundFonts = @()

foreach ($path in $searchPaths) {
    if (Test-Path $path) {
        Write-Host "`nChecking: $path" -ForegroundColor Yellow
        $fonts = Get-ChildItem -Path $path -Filter "*Gilroy*" -ErrorAction SilentlyContinue
        if ($fonts) {
            foreach ($font in $fonts) {
                Write-Host "  Found: $($font.Name)" -ForegroundColor Green
                $foundFonts += $font
            }
        }
    }
}

if ($foundFonts.Count -eq 0) {
    Write-Host "`nNo Gilroy fonts found in common locations." -ForegroundColor Red
    Write-Host "Please manually locate your font files and copy them to: assets/fonts/" -ForegroundColor Yellow
} else {
    Write-Host "`nFound $($foundFonts.Count) font file(s)" -ForegroundColor Green
    Write-Host "`nTo copy fonts to your project:" -ForegroundColor Cyan
    Write-Host "1. Copy these files to: assets/fonts/" -ForegroundColor White
    Write-Host "2. Rename them to match:" -ForegroundColor White
    Write-Host "   - Gilroy-Regular.ttf" -ForegroundColor Gray
    Write-Host "   - Gilroy-Medium.ttf" -ForegroundColor Gray
    Write-Host "   - Gilroy-SemiBold.ttf" -ForegroundColor Gray
    Write-Host "   - Gilroy-Bold.ttf" -ForegroundColor Gray
}

