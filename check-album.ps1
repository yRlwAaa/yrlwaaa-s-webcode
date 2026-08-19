$tmp = New-TemporaryFile
curl.exe -sL --max-time 15 "https://yrlwa.top/albums/AcgExample/" -o $tmp 2>&1
if (Test-Path $tmp) {
  Get-Content $tmp -TotalCount 50
  Remove-Item $tmp
} else {
  Write-Host "Failed to download"
}