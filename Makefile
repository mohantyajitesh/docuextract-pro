# DocuExtract Pro - Makefile
# Commands for development and building

.PHONY: help setup dev backend ui build build-sidecar build-release clean

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
	@echo "  make build          Build desktop app (dev mode, no sidecar)"
	@echo "  make build-sidecar  Build Python sidecar binary"
	@echo "  make build-release  Full release build with sidecar"
	@echo "  make build-mac      Build for macOS"
	@echo "  make build-win      Build for Windows (from Windows)"
	@echo ""
	@echo "Utilities:"
	@echo "  make check     Run prerequisites check"
	@echo "  make test      Run tests"
	@echo "  make lint      Run linters"
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
	@echo "Building desktop app (dev mode)..."
	@source venv/bin/activate && cd ui && npm run build
	@cd src-tauri && cargo tauri build

build-sidecar:
	@echo "Building Python sidecar binary..."
	@source venv/bin/activate && pip install pyinstaller
	@source venv/bin/activate && pyinstaller docuextract-backend.spec --noconfirm
	@echo "Copying sidecar to binaries..."
	@ARCH=$$(uname -m); \
	OS=$$(uname -s | tr '[:upper:]' '[:lower:]'); \
	if [ "$$OS" = "darwin" ]; then \
		if [ "$$ARCH" = "arm64" ]; then \
			TARGET="aarch64-apple-darwin"; \
		else \
			TARGET="x86_64-apple-darwin"; \
		fi; \
	elif [ "$$OS" = "linux" ]; then \
		TARGET="x86_64-unknown-linux-gnu"; \
	fi; \
	cp dist/docuextract-backend src-tauri/binaries/docuextract-backend-$$TARGET
	@echo "Sidecar built successfully!"

build-release:
	@echo "Building release with sidecar..."
	@$(MAKE) build-sidecar
	@source venv/bin/activate && cd ui && npm run build
	@cd src-tauri && cargo tauri build --release
	@echo ""
	@echo "Build complete! Artifacts:"
	@ls -la src-tauri/target/release/bundle/

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

lint:
	@echo "Linting Python..."
	@source venv/bin/activate && pip install ruff black --quiet
	@source venv/bin/activate && ruff check src/ || true
	@source venv/bin/activate && black --check src/ || true
	@echo ""
	@echo "Linting TypeScript..."
	@cd ui && npm run lint || true
	@echo ""
	@echo "Linting Rust..."
	@cd src-tauri && cargo fmt --check || true
	@cd src-tauri && cargo clippy || true

clean:
	@echo "Cleaning..."
	@rm -rf venv
	@rm -rf ui/node_modules
	@rm -rf ui/dist
	@rm -rf src-tauri/target
	@rm -rf output/*
	@rm -rf dist build *.spec
	@rm -rf __pycache__
	@rm -rf src-tauri/binaries/docuextract-backend-*
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
