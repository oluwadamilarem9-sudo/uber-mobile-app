# Fixes npm ENOTEMPTY / EPERM on Windows (locked or corrupted node_modules).
# Run in PowerShell from project root:  .\scripts\fix-npm-install.ps1

$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot\..

Write-Host "`n1. Stopping Node / Metro processes..." -ForegroundColor Cyan
Get-Process node, java -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2

Write-Host "2. Moving old node_modules aside (do not delete in place)..." -ForegroundColor Cyan
if (Test-Path node_modules) {
  $trash = "node_modules._old_" + (Get-Date -Format "yyyyMMdd_HHmmss")
  Rename-Item -Path node_modules -NewName $trash -Force
  Write-Host "   Renamed to $trash — delete that folder later in File Explorer if you want." -ForegroundColor Yellow
}

Write-Host "3. Running npm install..." -ForegroundColor Cyan
npm install
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "`nDone. You can run: npm start`n" -ForegroundColor Green
