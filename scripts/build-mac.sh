#!/bin/bash
# DocuExtract Pro - macOS Build Script
# Builds the desktop application for macOS

set -e

echo "=========================================="
echo "DocuExtract Pro - macOS Build"
echo "=========================================="

cd "$(dirname "$0")/.."

# Activate venv
source venv/bin/activate

# Build UI
echo "Building UI..."
cd ui
npm run build
cd ..

# Build Tauri app
echo "Building Tauri app..."
cargo tauri build

echo ""
echo "=========================================="
echo "Build Complete!"
echo "=========================================="
echo ""
echo "App bundle: src-tauri/target/release/bundle/macos/DocuExtract Pro.app"
echo "DMG installer: src-tauri/target/release/bundle/dmg/DocuExtract Pro_*.dmg"
