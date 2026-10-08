$targetZip = "release-pc/Billing_Pro_POS_v1.0_Windows_x64.zip"
if (Test-Path $targetZip) {
    Remove-Item $targetZip -Force
}
Write-Host "Compressing release-pc/Billing-Pro-POS-win32-x64 to $targetZip..."
Compress-Archive -Path "release-pc/Billing-Pro-POS-win32-x64/*" -DestinationPath $targetZip -CompressionLevel Fastest
Write-Host "Done!"
Get-Item $targetZip | Select-Object Name, Length, LastWriteTime
