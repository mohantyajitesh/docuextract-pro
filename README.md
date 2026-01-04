# DocuExtract Pro

**AI-Powered Document Extraction That Runs 100% Locally**

Extract text, tables, key-value pairs, and signatures from any document—PDFs, scanned images, invoices, contracts—using AI that runs entirely on your computer. Your data never leaves your machine.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Platform](https://img.shields.io/badge/platform-macOS%20%7C%20Windows%20%7C%20Linux-lightgrey.svg)
![Python](https://img.shields.io/badge/python-3.10%2B-blue.svg)

---

## Why DocuExtract Pro?

| Feature | DocuExtract Pro | Cloud Services |
|---------|-----------------|----------------|
| **Privacy** | 100% offline, data never leaves your computer | Data uploaded to servers |
| **Cost** | One-time purchase | Monthly subscriptions |
| **Speed** | Local AI, no network latency | Depends on internet |
| **Limits** | Unlimited documents | Per-page pricing |
| **Compliance** | HIPAA/legal friendly | Compliance concerns |

---

## What You Get

Drop any document and receive:

```
INPUT: invoice.pdf
        ↓
OUTPUT:
  ├── Full text (searchable, copy-paste ready)
  ├── Tables (structured, export to Excel)
  ├── Key-Value Pairs
  │   ├── Invoice Number: INV-2024-001
  │   ├── Date: January 15, 2024
  │   ├── Total: $1,234.56
  │   └── Vendor: Acme Corp
  ├── Signatures (detected with confidence scores)
  └── Export: JSON, CSV, Excel, Markdown
```

---

## Quick Start

### Prerequisites

1. **Ollama** - Download from [ollama.ai](https://ollama.ai)
2. **Python 3.10+** - Download from [python.org](https://python.org)
3. **Node.js 18+** - Download from [nodejs.org](https://nodejs.org)

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/docuextract-pro.git
cd docuextract-pro

# Run setup
chmod +x scripts/setup-dev.sh
./scripts/setup-dev.sh

# Pull required AI models
ollama pull llama3.1:latest
ollama pull llava:7b
```

### Running

```bash
# Start Ollama (in a separate terminal)
ollama serve

# Start the application
make dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Features

### Document Types Supported
- PDF (text-based and scanned)
- Images (PNG, JPG, TIFF, BMP)
- Scanned documents
- Forms and contracts

### Extraction Capabilities
- **Text Extraction**: Full OCR with EasyOCR (M1 Mac optimized)
- **Table Detection**: 97.9% accuracy with Docling
- **Key-Value Pairs**: Automatic field detection
- **Signature Detection**: Location and validation with confidence scores

### Export Formats
- JSON (structured data)
- CSV (spreadsheet compatible)
- Excel (.xlsx with multiple sheets)
- Markdown (documentation friendly)

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      DocuExtract Pro                             │
├─────────────────────────────────────────────────────────────────┤
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                    Tauri Desktop Shell                     │  │
│  │              Lightweight native container (~5MB)           │  │
│  └───────────────────────────────────────────────────────────┘  │
│                              │                                   │
│  ┌───────────────────────────┴───────────────────────────────┐  │
│  │                  React + Tailwind UI                       │  │
│  │  • Drag-drop upload • Real-time progress • Export options │  │
│  └───────────────────────────────────────────────────────────┘  │
│                              │                                   │
│  ┌───────────────────────────┴───────────────────────────────┐  │
│  │              Python Backend (FastAPI)                      │  │
│  │  • Document processing • OCR • Table extraction            │  │
│  └───────────────────────────────────────────────────────────┘  │
│                              │                                   │
│  ┌───────────────────────────┴───────────────────────────────┐  │
│  │                    Ollama (Local AI)                       │  │
│  │              llama3.1 (text) + llava (vision)              │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Project Structure

```
docuextract-pro/
├── src/                      # Python backend
│   ├── api/                  # FastAPI endpoints
│   ├── core/                 # Processing engine
│   │   ├── config.py         # Configuration
│   │   ├── models.py         # Pydantic models
│   │   └── processor.py      # Document processor
│   └── license/              # License validation
├── ui/                       # React frontend
│   ├── src/
│   │   ├── components/       # UI components
│   │   ├── hooks/            # React hooks
│   │   └── utils/            # API client
│   └── package.json
├── src-tauri/                # Tauri desktop shell
├── scripts/                  # Build scripts
├── docs/                     # Documentation
│   ├── PRODUCT_PLAN.md       # Business plan
│   └── SYSTEM_REQUIREMENTS.md
├── requirements.txt          # Python dependencies
├── Makefile                  # Development commands
└── README.md
```

---

## Development

### Commands

```bash
make setup      # Full development setup
make dev        # Start dev servers (backend + UI)
make backend    # Start backend only
make ui         # Start UI only
make build      # Build desktop app
make check      # Check prerequisites
make clean      # Clean build artifacts
```

### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/process` | Upload and process document |
| GET | `/api/status/{job_id}` | Get job status |
| GET | `/api/result/{job_id}` | Get extraction result |
| POST | `/api/export/{job_id}` | Export to format |
| GET | `/api/health` | Health check |

---

## Building

### macOS

```bash
./scripts/build-mac.sh
```

Output: `src-tauri/target/release/bundle/dmg/DocuExtract Pro_*.dmg`

### Windows

```powershell
.\scripts\build-windows.ps1
```

Output: `src-tauri\target\release\bundle\msi\DocuExtract Pro_*.msi`

---

## System Requirements

| Component | Minimum | Recommended |
|-----------|---------|-------------|
| RAM | 16 GB | 32 GB |
| Storage | 15 GB | 20 GB SSD |
| CPU | 4 cores | 8+ cores |
| GPU | None | Apple Silicon / NVIDIA |

See [System Requirements](docs/SYSTEM_REQUIREMENTS.md) for full details.

---

## License Tiers

| Tier | Price | Features |
|------|-------|----------|
| Trial | Free | 10 documents, 14 days |
| Personal | $49 | Unlimited docs, 1 computer |
| Professional | $99 | Unlimited docs, 2 computers, commercial use |
| Business | $199 | Unlimited docs, 5 computers, priority support |

---

## Technology Stack

- **Frontend**: React 18, Tailwind CSS, Vite
- **Backend**: Python 3.10+, FastAPI, Pydantic
- **Desktop**: Tauri (Rust)
- **AI/ML**: LangChain, LangGraph, Ollama
- **OCR**: EasyOCR, img2table
- **Document Parsing**: Docling (97.9% table accuracy)

---

## Roadmap

- [ ] Batch processing (multiple files)
- [ ] Custom extraction templates
- [ ] More export formats (PDF, Word)
- [ ] Multi-language OCR
- [ ] Handwriting recognition
- [ ] Custom model fine-tuning

---

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## Support

- **Documentation**: [docs/](docs/)
- **Issues**: [GitHub Issues](https://github.com/yourusername/docuextract-pro/issues)
- **Email**: support@docuextract.pro

---

## License

MIT License - see [LICENSE](LICENSE) for details.

---

**Built with privacy in mind. Your documents, your data, your computer.**
