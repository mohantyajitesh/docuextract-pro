# DocuExtract Pro - System Requirements

This document outlines the hardware and software requirements for running DocuExtract Pro on your computer.

---

## Quick Compatibility Check

| Your System | Compatible? |
|-------------|-------------|
| Mac (M1/M2/M3, 16GB RAM) | ✅ Excellent |
| Mac (Intel, 16GB RAM) | ✅ Good |
| Windows (NVIDIA GPU, 16GB RAM) | ✅ Excellent |
| Windows (No GPU, 16GB RAM) | ✅ Good (slower) |
| Linux (NVIDIA GPU, 16GB RAM) | ✅ Excellent |
| Any system with 8GB RAM | ⚠️ Limited |
| Chromebook | ❌ Not supported |

---

## Minimum Requirements

These are the absolute minimum specifications to run DocuExtract Pro:

| Component | Requirement |
|-----------|-------------|
| **Operating System** | macOS 12+, Windows 10/11, Ubuntu 20.04+ |
| **RAM** | 16 GB |
| **Storage** | 15 GB free space |
| **CPU** | 4+ cores (Intel i5/AMD Ryzen 5 or equivalent) |
| **GPU** | Not required (but recommended) |

---

## Recommended Specifications

For the best experience with fast processing:

| Component | Recommendation |
|-----------|----------------|
| **Operating System** | macOS 13+ (Ventura), Windows 11, Ubuntu 22.04 |
| **RAM** | 32 GB |
| **Storage** | 20 GB free SSD space |
| **CPU** | 8+ cores (Apple M1/M2/M3, Intel i7, AMD Ryzen 7) |
| **GPU** | Apple Silicon, NVIDIA RTX 3060+ (6GB VRAM) |

---

## Platform-Specific Requirements

### macOS

| Requirement | Details |
|-------------|---------|
| **Version** | macOS 12 Monterey or later |
| **Chip** | Apple Silicon (M1/M2/M3) recommended, Intel supported |
| **RAM** | 16GB minimum (M-series Macs share RAM with GPU) |
| **Homebrew** | Required for installing dependencies |

**Additional Software:**
- Ollama (free, from ollama.ai)
- Poppler (installed via `brew install poppler`)

### Windows

| Requirement | Details |
|-------------|---------|
| **Version** | Windows 10 (21H2+) or Windows 11 |
| **Architecture** | 64-bit only |
| **RAM** | 16GB minimum |
| **GPU (optional)** | NVIDIA with 6GB+ VRAM for acceleration |

**Additional Software:**
- Ollama for Windows (free, from ollama.ai)
- Poppler for Windows (free, from GitHub)

### Linux

| Requirement | Details |
|-------------|---------|
| **Distribution** | Ubuntu 20.04+, Debian 11+, Fedora 35+ |
| **Architecture** | x86_64 |
| **RAM** | 16GB minimum |
| **GPU (optional)** | NVIDIA with CUDA drivers for acceleration |

**Additional Software:**
- Ollama (free, from ollama.ai)
- poppler-utils (`sudo apt install poppler-utils`)

---

## Storage Requirements Breakdown

| Component | Size |
|-----------|------|
| DocuExtract Pro Application | ~100 MB |
| Ollama Runtime | ~500 MB |
| Llama 3.1 Model | ~4.9 GB |
| LLaVA Vision Model | ~4.7 GB |
| OCR Models (EasyOCR) | ~500 MB |
| Working Space | ~5 GB |
| **Total** | **~15 GB** |

---

## Memory (RAM) Usage

| Operation | RAM Usage |
|-----------|-----------|
| Idle (app running) | ~500 MB |
| Loading models | ~8 GB |
| Processing document | ~10-12 GB |
| Peak (large document) | ~14 GB |

**Note:** With 16GB RAM, close memory-heavy applications (Chrome, Slack, etc.) during processing for best performance.

---

## GPU Acceleration

### Apple Silicon (M1/M2/M3)
- Uses Metal Performance Shaders (MPS) automatically
- No additional configuration needed
- Excellent performance on all M-series chips

### NVIDIA GPUs
- Requires NVIDIA drivers (included with Ollama)
- Minimum 6GB VRAM recommended
- Supported cards: GTX 1060+, RTX 2060+, RTX 3060+, RTX 4060+

### AMD GPUs
- Currently not supported for acceleration
- Falls back to CPU processing

### Intel GPUs
- Currently not supported for acceleration
- Falls back to CPU processing

---

## Processing Speed Estimates

| Hardware | 1-page PDF | 10-page PDF | Scanned Image |
|----------|------------|-------------|---------------|
| M1 Mac (16GB) | ~5 sec | ~30 sec | ~8 sec |
| M2/M3 Mac (16GB) | ~3 sec | ~20 sec | ~5 sec |
| RTX 3060 (12GB) | ~3 sec | ~20 sec | ~5 sec |
| RTX 4070 (12GB) | ~2 sec | ~12 sec | ~3 sec |
| CPU only (i7) | ~15 sec | ~90 sec | ~20 sec |

---

## Network Requirements

| Feature | Internet Required? |
|---------|-------------------|
| Initial setup | Yes (download ~10GB) |
| Daily usage | No (100% offline) |
| License activation | One-time only |
| Updates | Optional |

---

## Pre-Installation Checklist

Before installing DocuExtract Pro, verify:

### macOS
```bash
# Check macOS version
sw_vers

# Check available RAM
sysctl hw.memsize | awk '{print $2/1024/1024/1024 " GB"}'

# Check available disk space
df -h /

# Check if Homebrew is installed
brew --version
```

### Windows
```powershell
# Check Windows version
winver

# Check RAM
systeminfo | findstr "Total Physical Memory"

# Check disk space
Get-PSDrive C | Select-Object @{Name="Free(GB)";Expression={[math]::Round($_.Free/1GB,2)}}
```

### Linux
```bash
# Check distro
cat /etc/os-release

# Check RAM
free -h

# Check disk space
df -h /

# Check GPU (if NVIDIA)
nvidia-smi
```

---

## Troubleshooting Common Issues

### "Out of memory" errors
- Close other applications
- Reduce MAX_TOKENS in settings
- Process smaller documents

### "Model not found" errors
- Ensure Ollama is running: `ollama serve`
- Pull required models: `ollama pull llama3.1:latest`

### Slow processing
- Check if GPU acceleration is working
- Close background applications
- Use SSD instead of HDD

### PDF conversion errors
- Install poppler: `brew install poppler` (Mac) or download from GitHub (Windows)

---

## Support

If you encounter issues not covered here:

1. Check the [FAQ](./FAQ.md)
2. Visit our [GitHub Issues](https://github.com/yourrepo/docuextract-pro/issues)
3. Contact support: support@docuextract.pro

---

## Summary

| Requirement | Minimum | Recommended |
|-------------|---------|-------------|
| OS | macOS 12+, Win 10+, Ubuntu 20.04+ | Latest versions |
| RAM | 16 GB | 32 GB |
| Storage | 15 GB | 20 GB SSD |
| CPU | 4 cores | 8+ cores |
| GPU | None | Apple Silicon or NVIDIA |
| Internet | Setup only | Not required |
