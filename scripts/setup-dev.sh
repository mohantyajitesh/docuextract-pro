#!/bin/bash
# DocuExtract Pro - Development Setup Script
# Sets up the development environment

set -e

echo "=========================================="
echo "DocuExtract Pro - Development Setup"
echo "=========================================="

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Check Python
echo -e "\n${YELLOW}Checking Python...${NC}"
if command -v python3 &> /dev/null; then
    PYTHON_VERSION=$(python3 -c 'import sys; print(f"{sys.version_info.major}.{sys.version_info.minor}")')
    echo -e "${GREEN}✓ Python $PYTHON_VERSION found${NC}"
else
    echo -e "${RED}✗ Python 3 not found${NC}"
    exit 1
fi

# Check Node.js
echo -e "\n${YELLOW}Checking Node.js...${NC}"
if command -v node &> /dev/null; then
    NODE_VERSION=$(node -v)
    echo -e "${GREEN}✓ Node.js $NODE_VERSION found${NC}"
else
    echo -e "${RED}✗ Node.js not found${NC}"
    echo "Install from: https://nodejs.org"
    exit 1
fi

# Check Rust (for Tauri)
echo -e "\n${YELLOW}Checking Rust...${NC}"
if command -v cargo &> /dev/null; then
    RUST_VERSION=$(rustc --version)
    echo -e "${GREEN}✓ $RUST_VERSION found${NC}"
else
    echo -e "${YELLOW}⚠ Rust not found. Installing...${NC}"
    curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
    source $HOME/.cargo/env
fi

# Check Ollama
echo -e "\n${YELLOW}Checking Ollama...${NC}"
if command -v ollama &> /dev/null; then
    echo -e "${GREEN}✓ Ollama found${NC}"
else
    echo -e "${RED}✗ Ollama not found${NC}"
    echo "Install from: https://ollama.ai"
fi

# Create Python virtual environment
echo -e "\n${YELLOW}Creating Python virtual environment...${NC}"
cd "$(dirname "$0")/.."

if [ -d "venv" ]; then
    echo -e "${YELLOW}⚠ Removing existing venv...${NC}"
    rm -rf venv
fi

python3 -m venv venv
source venv/bin/activate
pip install --upgrade pip

# Install Python dependencies
echo -e "\n${YELLOW}Installing Python dependencies...${NC}"
pip install -r requirements.txt

# Install UI dependencies
echo -e "\n${YELLOW}Installing UI dependencies...${NC}"
cd ui
npm install
cd ..

# Install Tauri CLI
echo -e "\n${YELLOW}Installing Tauri CLI...${NC}"
cargo install tauri-cli

echo -e "\n${GREEN}=========================================="
echo "Setup Complete!"
echo "==========================================${NC}"

echo -e "\n${YELLOW}Next steps:${NC}"
echo ""
echo "1. Start Ollama and pull models:"
echo "   ollama serve  # In a separate terminal"
echo "   ollama pull llama3.1:latest"
echo "   ollama pull llava:7b"
echo ""
echo "2. Start the development server:"
echo "   source venv/bin/activate"
echo "   make dev"
echo ""
echo "3. Build the desktop app:"
echo "   make build"
