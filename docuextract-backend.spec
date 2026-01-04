# -*- mode: python ; coding: utf-8 -*-
"""
PyInstaller spec file for DocuExtract Pro backend sidecar.
This creates a standalone executable that Tauri can spawn.

Build with: pyinstaller docuextract-backend.spec
"""

import sys
from pathlib import Path

# Get the project root
project_root = Path(SPECPATH)

a = Analysis(
    ['sidecar_entry.py'],
    pathex=[str(project_root)],
    binaries=[],
    datas=[
        # Include the entire src directory
        ('src', 'src'),
    ],
    hiddenimports=[
        # LangChain
        'langchain',
        'langchain.agents',
        'langchain.chains',
        'langchain.llms',
        'langchain_ollama',
        'langchain_core',
        'langchain_core.messages',
        'langchain_core.tools',

        # LangGraph
        'langgraph',
        'langgraph.graph',
        'langgraph.prebuilt',
        'langgraph.checkpoint',
        'langgraph.checkpoint.memory',

        # FastAPI / Web
        'fastapi',
        'fastapi.middleware',
        'fastapi.middleware.cors',
        'uvicorn',
        'uvicorn.logging',
        'uvicorn.loops',
        'uvicorn.loops.auto',
        'uvicorn.protocols',
        'uvicorn.protocols.http',
        'uvicorn.protocols.http.auto',
        'uvicorn.lifespan',
        'uvicorn.lifespan.on',
        'starlette',
        'starlette.routing',
        'starlette.middleware',
        'anyio',
        'anyio._backends',
        'anyio._backends._asyncio',

        # Pydantic
        'pydantic',
        'pydantic.fields',
        'pydantic_core',

        # OCR and Image Processing
        'easyocr',
        'easyocr.easyocr',
        'easyocr.detection',
        'easyocr.recognition',
        'cv2',
        'PIL',
        'PIL.Image',
        'numpy',

        # Document Processing
        'docling',
        'docling.document_converter',
        'pymupdf',
        'pymupdf4llm',
        'fitz',
        'pdf2image',
        'img2table',
        'img2table.document',
        'img2table.ocr',

        # Utilities
        'multipart',
        'python_multipart',
        'openpyxl',

        # Torch (for EasyOCR)
        'torch',
        'torchvision',
    ],
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[
        # Exclude unnecessary packages to reduce size
        'tkinter',
        'matplotlib',
        'scipy',
        'pandas',  # We use openpyxl directly
        'jupyter',
        'IPython',
        'notebook',
    ],
    noarchive=False,
)

pyz = PYZ(a.pure)

exe = EXE(
    pyz,
    a.scripts,
    a.binaries,
    a.datas,
    [],
    name='docuextract-backend',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    upx_exclude=[],
    runtime_tmpdir=None,
    console=True,  # Keep console for logging
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
)
