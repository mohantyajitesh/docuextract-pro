# DocuExtract Pro - Makefile
# Commands for development and building

.PHONY: help setup dev backend ui build clean

# Default target
help:
	@echo "DocuExtract Pro - Available Commands"
	@echo "====================================="
	@echo ""
	@echo "Development:"
	@echo "  make setup     Full development setup"
	@echo "  make dev       Start development servers (backend + UI)"
	@echo "  make backend   Start backend only"
	@echo "  make ui        Start UI only"
	@echo ""
	@echo "Build:"
	@echo "  make build     Build desktop app for current platform"
	@echo "  make build-mac Build for macOS"
	@echo "  make build-win Build for Windows (from Windows)"
	@echo ""
	@echo "Utilities:"
	@echo "  make check     Run prerequisites check"
	@echo "  make test      Run tests"
	@echo "  make clean     Clean build artifacts"
	@echo ""
	@echo "License:"
	@echo "  make gen-key TYPE=PERSONAL   Generate test license key"

# =============================================================================
# Development
# =============================================================================

setup:
	@chmod +x scripts/setup-dev.sh
	@./scripts/setup-dev.sh

dev:
	@echo "Starting development servers..."
	@trap 'kill 0' SIGINT; \
	(source venv/bin/activate && python -m uvicorn src.api.main:app --reload --host 127.0.0.1 --port 8000) & \
	(cd ui && npm run dev) & \
	wait

backend:
	@echo "Starting backend..."
	@source venv/bin/activate && python -m uvicorn src.api.main:app --reload --host 127.0.0.1 --port 8000

ui:
	@echo "Starting UI..."
	@cd ui && npm run dev

# =============================================================================
# Build
# =============================================================================

build:
	@echo "Building desktop app..."
	@source venv/bin/activate && cd ui && npm run build
	@cargo tauri build

build-mac:
	@chmod +x scripts/build-mac.sh
	@./scripts/build-mac.sh

build-win:
	@powershell -ExecutionPolicy Bypass -File scripts/build-windows.ps1

# =============================================================================
# Utilities
# =============================================================================

check:
	@echo "Checking prerequisites..."
	@echo ""
	@echo "Python: $$(python3 --version 2>/dev/null || echo 'Not found')"
	@echo "Node.js: $$(node --version 2>/dev/null || echo 'Not found')"
	@echo "Rust: $$(rustc --version 2>/dev/null || echo 'Not found')"
	@echo "Ollama: $$(ollama --version 2>/dev/null || echo 'Not found')"
	@echo ""
	@ollama list 2>/dev/null || echo "Ollama not running"

test:
	@source venv/bin/activate && python -m pytest tests/ -v

clean:
	@echo "Cleaning..."
	@rm -rf venv
	@rm -rf ui/node_modules
	@rm -rf ui/dist
	@rm -rf src-tauri/target
	@rm -rf output/*
	@rm -rf __pycache__
	@find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
	@echo "Clean complete."

# =============================================================================
# License
# =============================================================================

gen-key:
ifndef TYPE
	@echo "Usage: make gen-key TYPE=PERSONAL|PROFESSIONAL|BUSINESS"
else
	@source venv/bin/activate && python -c "from src.license.validator import generate_license_key; print(generate_license_key('$(TYPE)'))"
endif
