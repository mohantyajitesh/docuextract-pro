"""
DocuExtract Pro - Configuration
"""
import os
from pathlib import Path

# Model Configuration
TEXT_MODEL = os.environ.get("OLLAMA_TEXT_MODEL", "llama3.1:latest")
VISION_MODEL = os.environ.get("OLLAMA_VISION_MODEL", "llava:7b")
OLLAMA_BASE_URL = os.environ.get("OLLAMA_BASE_URL", "http://localhost:11434")

# Processing limits
MAX_TOKENS = int(os.environ.get("MAX_TOKENS", "4096"))
DOC_TEXT_LIMIT = int(os.environ.get("DOC_TEXT_LIMIT", "30000"))
SIGNATURE_CONFIDENCE_THRESHOLD = float(os.environ.get("SIGNATURE_CONFIDENCE_THRESHOLD", "0.6"))

# Paths
BASE_DIR = Path(__file__).parent.parent.parent
OUTPUT_DIR = Path(os.environ.get("OUTPUT_DIR", str(BASE_DIR / "output")))
OUTPUT_DIR.mkdir(exist_ok=True)

# API Configuration
API_HOST = os.environ.get("API_HOST", "127.0.0.1")
API_PORT = int(os.environ.get("API_PORT", "8000"))

# License Configuration
LICENSE_PUBLIC_KEY = """-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA2Z3qX2BTLS4e...
-----END PUBLIC KEY-----"""  # Replace with actual key for production
