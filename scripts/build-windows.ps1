# DocuExtract Pro - Windows Build Script
# Builds the desktop application for Windows

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "DocuExtract Pro - Windows Build" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

Set-Location $PSScriptRoot\..

# Activate venv
.\venv\Scripts\Activate.ps1

# Build UI
Write-Host "Building UI..." -ForegroundColor Yellow
Set-Location ui
npm run build
Set-Location ..

# Build Tauri app
Write-Host "Building Tauri app..." -ForegroundColor Yellow
cargo tauri build

Write-Host ""
Write-Host "==========================================" -ForegroundColor Green
Write-Host "Build Complete!" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Green
Write-Host ""
Write-Host "MSI installer: src-tauri\target\release\bundle\msi\DocuExtract Pro_*.msi"
