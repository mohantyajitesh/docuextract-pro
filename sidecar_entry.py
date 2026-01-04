#!/usr/bin/env python3
"""
DocuExtract Pro - Sidecar Entry Point
This is the entry point for the bundled Python backend (PyInstaller sidecar).
Tauri will spawn this process to run the FastAPI server.
"""
import sys
import os

# Ensure the src directory is in the path
if getattr(sys, 'frozen', False):
    # Running as PyInstaller bundle
    bundle_dir = sys._MEIPASS
    sys.path.insert(0, bundle_dir)
else:
    # Running as script
    sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import uvicorn
from src.api.main import app
from src.core.config import API_HOST, API_PORT


def main():
    """Start the FastAPI server."""
    print(f"Starting DocuExtract Pro backend on {API_HOST}:{API_PORT}")

    uvicorn.run(
        app,
        host=API_HOST,
        port=API_PORT,
        log_level="info",
        # Disable reload in production (bundled mode)
        reload=False
    )


if __name__ == "__main__":
    main()
