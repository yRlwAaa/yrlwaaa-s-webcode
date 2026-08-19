# Remove thumb files from dist too
Get-ChildItem -Recurse -Filter "*.thumb*" -Path "E:\yrlwa-web\Mizuki-master\dist\images\albums\" | Remove-Item -Force -ErrorAction SilentlyContinue

# Check current state of album-scanner.ts
Write-Host "=== Scanner state ==="
Select-String -Pattern "async function scanPhotos|function scanPhotos|await scanPhotos|scanPhotos\(" -Path "E:\yrlwa-web\Mizuki-master\src\utils\album-scanner.ts" | ForEach-Object { $_.Line.Trim() }

Write-Host "=== PhotoCard state ==="
Select-String -Pattern "opacity|skeleton|thumbnail" -Path "E:\yrlwa-web\Mizuki-master\src\components\features\albums\PhotoCard.astro" | Select-Object -First 10 | ForEach-Object { $_.Line.Trim() }