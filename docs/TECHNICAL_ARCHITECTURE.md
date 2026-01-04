# DocuExtract Pro - Technical Architecture Guide

**The Complete Technical Reference for Understanding DocuExtract Pro**

This document will make you the architect of this application. After reading this, you'll be able to explain every component, how they connect, and why each technology choice was made.

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [System Architecture](#system-architecture)
3. [Technology Stack Deep Dive](#technology-stack-deep-dive)
4. [Component Breakdown](#component-breakdown)
5. [Data Flow](#data-flow)
6. [Code Walkthrough](#code-walkthrough)
7. [AI/ML Pipeline](#aiml-pipeline)
8. [API Reference](#api-reference)
9. [Frontend Architecture](#frontend-architecture)
10. [Desktop App (Tauri)](#desktop-app-tauri)
11. [License System](#license-system)
12. [File Structure Map](#file-structure-map)
13. [How to Explain to Customers](#how-to-explain-to-customers)

---

## Executive Summary

### What Is DocuExtract Pro?

DocuExtract Pro is a **desktop application** that uses **local AI** to extract structured data from documents. It solves the problem of manual data entry from PDFs, scanned documents, and images.

### The 30-Second Pitch

> "DocuExtract Pro is like having a data entry assistant that works in seconds, runs on your computer (no cloud), and costs a one-time fee instead of monthly subscriptions. Drop a document, get structured data—text, tables, form fields, and even signature detection."

### Key Differentiators

| Feature | DocuExtract Pro | Competitors |
|---------|-----------------|-------------|
| **Privacy** | 100% local processing | Cloud-based |
| **Pricing** | One-time $49-199 | $20-100/month |
| **AI Models** | Llama 3.1 + LLaVA (open source) | Proprietary APIs |
| **Offline** | Works without internet | Requires internet |
| **Accuracy** | 97.9% table extraction (Docling) | Varies |

---

## System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           USER'S COMPUTER                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │                        TAURI SHELL (Rust)                               │ │
│  │                    Native desktop container                             │ │
│  │                    Manages process lifecycle                            │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                    │                                         │
│           ┌────────────────────────┴────────────────────────┐               │
│           │                                                  │               │
│           ▼                                                  ▼               │
│  ┌─────────────────────────┐                  ┌─────────────────────────┐   │
│  │   REACT FRONTEND        │    HTTP API      │   FASTAPI BACKEND       │   │
│  │   (Port 3000)           │◄────────────────►│   (Port 8000)           │   │
│  │                         │                  │                         │   │
│  │  • DropZone.tsx         │                  │  • main.py (API routes) │   │
│  │  • ResultsViewer.tsx    │                  │  • processor.py (AI)    │   │
│  │  • ProcessingCard.tsx   │                  │  • validator.py (license)│  │
│  └─────────────────────────┘                  └─────────────────────────┘   │
│                                                           │                  │
│                                                           │ Python calls     │
│                                                           ▼                  │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                      PROCESSING ENGINE                                │   │
│  │  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ │   │
│  │  │   Docling    │ │   EasyOCR    │ │  img2table   │ │   OpenCV     │ │   │
│  │  │  (PDF parse) │ │   (OCR)      │ │  (tables)    │ │ (signatures) │ │   │
│  │  └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘ │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                    │                                         │
│                                    │ Ollama API (localhost:11434)           │
│                                    ▼                                         │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                         OLLAMA (AI Runtime)                           │   │
│  │  ┌─────────────────────────┐    ┌─────────────────────────────────┐  │   │
│  │  │  llama3.1:latest        │    │  llava:7b                       │  │   │
│  │  │  (Text understanding)   │    │  (Vision/Image understanding)   │  │   │
│  │  │  4.9 GB                 │    │  4.7 GB                         │  │   │
│  │  └─────────────────────────┘    └─────────────────────────────────┘  │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Layer Responsibilities

| Layer | Technology | Responsibility |
|-------|------------|----------------|
| **Shell** | Tauri (Rust) | Native window, process management, file access |
| **Frontend** | React + Tailwind | User interface, file upload, results display |
| **Backend API** | FastAPI (Python) | REST endpoints, job queue, export |
| **Processing** | Python libraries | OCR, table extraction, signature detection |
| **AI Runtime** | Ollama | Run LLMs locally for text/vision understanding |

---

## Technology Stack Deep Dive

### Why These Technologies?

#### Frontend: React + Tailwind + Vite

```
React 18          → Component-based UI, large ecosystem
Tailwind CSS      → Rapid styling, consistent design
Vite              → Fast dev server, instant HMR
TypeScript        → Type safety, better tooling
React Query       → Server state management, caching
```

**Why not Electron?** Tauri is 30x smaller (5MB vs 150MB) and uses less RAM.

#### Backend: FastAPI + Python

```
FastAPI           → Modern async Python, automatic OpenAPI docs
Pydantic          → Data validation, type safety
Uvicorn           → ASGI server, async support
Background Tasks  → Non-blocking document processing
```

**Why FastAPI?** Auto-generated API docs, async support, Pydantic integration.

#### AI/ML: The Processing Pipeline

```
┌─────────────────────────────────────────────────────────────────┐
│                    DOCUMENT PROCESSING PIPELINE                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  INPUT: PDF or Image                                            │
│           │                                                      │
│           ▼                                                      │
│  ┌─────────────────┐                                            │
│  │ 1. LOAD DOCUMENT │                                            │
│  │                  │                                            │
│  │  IF text PDF:    │──► Docling (97.9% table accuracy)         │
│  │  IF scanned:     │──► EasyOCR (MPS-accelerated on M1)        │
│  │  IF complex:     │──► LLaVA vision model                     │
│  └─────────────────┘                                            │
│           │                                                      │
│           ▼                                                      │
│  ┌─────────────────┐                                            │
│  │ 2. EXTRACT TEXT  │──► Full document text, page-by-page       │
│  └─────────────────┘                                            │
│           │                                                      │
│           ▼                                                      │
│  ┌─────────────────┐                                            │
│  │ 3. EXTRACT TABLES│                                            │
│  │                  │                                            │
│  │  img2table       │──► Detects table structure                │
│  │  + EasyOCR       │──► Reads cell contents                    │
│  └─────────────────┘                                            │
│           │                                                      │
│           ▼                                                      │
│  ┌─────────────────┐                                            │
│  │ 4. DETECT SIGS   │                                            │
│  │                  │                                            │
│  │  OpenCV          │──► Adaptive thresholding                  │
│  │  Contour analysis│──► Find ink-like marks                    │
│  │  Confidence      │──► Score each detection                   │
│  └─────────────────┘                                            │
│           │                                                      │
│           ▼                                                      │
│  ┌─────────────────┐                                            │
│  │ 5. KEY-VALUES    │                                            │
│  │                  │                                            │
│  │  Regex patterns  │──► "Label: Value" extraction              │
│  │  (Future: LLM)   │──► Semantic understanding                 │
│  └─────────────────┘                                            │
│           │                                                      │
│           ▼                                                      │
│  OUTPUT: ExtractionResult (Pydantic model)                      │
│          • text, tables, key_values, signatures                 │
│          • confidence scores, review flags                      │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

#### Library Selection Rationale

| Library | Purpose | Why Chosen |
|---------|---------|------------|
| **Docling** | PDF parsing | 97.9% table accuracy (best in class) |
| **EasyOCR** | Text from images | M1 Mac compatible (MPS), unlike PaddleOCR |
| **img2table** | Table detection | Structured output, works with any OCR |
| **OpenCV** | Signature detection | Industry standard, no dependencies |
| **LangChain/Ollama** | LLM integration | Clean API for local models |

---

## Component Breakdown

### Backend Components

#### `src/api/main.py` - REST API

```python
# Key endpoints:
POST /api/process      # Upload document, returns job_id
GET  /api/status/{id}  # Poll job progress (0-100%)
GET  /api/result/{id}  # Get extraction results
POST /api/export/{id}  # Export to CSV/Excel/JSON
GET  /api/health       # System status check
```

**How it works:**
1. User uploads file → saved to `/output/uploads/`
2. Background task started → `process_document_task()`
3. Job stored in memory dict → `jobs[job_id]`
4. Frontend polls `/status` every second
5. When complete → result available at `/result`

#### `src/core/processor.py` - Processing Engine

```python
class DocumentProcessor:
    def process_document(
        self,
        file_path: str,
        method: str = "auto",           # auto, docling, ocr, vision
        extract_tables: bool = True,
        extract_signatures: bool = True,
        extract_key_values: bool = True,
        progress_callback: Callable     # Updates UI progress
    ) -> ExtractionResult:
```

**Processing steps:**
1. **Load** (10-40%): Parse PDF/image to text
2. **Tables** (40-65%): Detect and extract table structures
3. **Signatures** (65-80%): Find signature regions with OpenCV
4. **Key-Values** (80-90%): Extract "Label: Value" pairs
5. **Build Result** (90-100%): Validate with Pydantic

#### `src/core/models.py` - Data Models

```python
class ExtractionResult(BaseModel):
    document_source: str           # Original file path
    document_type: Optional[str]   # "invoice", "contract", etc.
    pages: int                     # Number of pages
    processed_at: str              # ISO timestamp
    processing_time_seconds: float

    text: str                      # Full extracted text
    key_values: List[KeyValuePair] # [{key, value, confidence}]
    tables: List[TableData]        # [{id, rows, headers, page}]
    signatures: List[SignatureResult] # [{id, confidence, status, location}]

    human_review_required: bool    # Flag for low-confidence items
    overall_confidence: float      # 0.0 - 1.0
```

#### `src/license/validator.py` - License System

```python
class LicenseValidator:
    LICENSE_TYPES = {
        "TRIAL":        {"documents": 10,  "machines": 1},
        "PERSONAL":     {"documents": -1,  "machines": 1},  # -1 = unlimited
        "PROFESSIONAL": {"documents": -1,  "machines": 2},
        "BUSINESS":     {"documents": -1,  "machines": 5},
    }

    def can_process(self) -> bool:    # Check if user can process
    def record_usage(self):            # Increment counter
    def activate(self, key: str):      # Activate license key
```

**Key format:** `XXXX-XXXX-XXXX-XXXX`
- First 4 chars: Type code (PERS, PROF, BUSI)
- Middle 8 chars: Random
- Last 4 chars: MD5 checksum

### Frontend Components

#### `ui/src/App.tsx` - Main Application

```typescript
function App() {
  const [activeJobs, setActiveJobs] = useState<ActiveJob[]>([]);
  const [selectedResult, setSelectedResult] = useState<ExtractionResult | null>(null);

  // Health check query (every 30 seconds)
  const { data: health } = useQuery({ queryKey: ['health'], queryFn: checkHealth });

  // Process document mutation
  const processMutation = useMutation({
    mutationFn: (file: File) => processDocument(file),
    onSuccess: (data, file) => {
      setActiveJobs(prev => [{ jobId: data.job_id, filename: file.name }, ...prev]);
    }
  });

  // Poll job status every 1 second
  usePolling(pollJobStatus, 1000, hasActiveJobs);
}
```

#### `ui/src/components/DropZone.tsx` - File Upload

```typescript
export function DropZone({ onFileSelect, isProcessing }: DropZoneProps) {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (files) => onFileSelect(files[0]),
    accept: {
      'application/pdf': ['.pdf'],
      'image/*': ['.png', '.jpg', '.jpeg', '.tiff']
    },
    maxFiles: 1,
    disabled: isProcessing
  });

  return (
    <div {...getRootProps()}>
      {isDragActive ? "Drop here" : "Drag & drop your document"}
    </div>
  );
}
```

#### `ui/src/components/ResultsViewer.tsx` - Results Display

```typescript
// Tabs: Summary | Text | Tables | Key-Values | Signatures
// Each tab displays extracted data with confidence scores
// Export dropdown: JSON, CSV, Excel, Markdown
```

#### `ui/src/utils/api.ts` - API Client

```typescript
export async function processDocument(file: File): Promise<ProcessResponse> {
  const formData = new FormData();
  formData.append('file', file);
  return fetch('/api/process', { method: 'POST', body: formData }).then(r => r.json());
}

export async function getJobStatus(jobId: string): Promise<JobStatus> {
  return fetch(`/api/status/${jobId}`).then(r => r.json());
}

export async function getResult(jobId: string): Promise<ExtractionResult> {
  return fetch(`/api/result/${jobId}`).then(r => r.json());
}
```

---

## Data Flow

### Complete Request Lifecycle

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                          DOCUMENT PROCESSING FLOW                             │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  1. USER DROPS FILE                                                          │
│     DropZone.tsx → onFileSelect(file)                                        │
│           │                                                                   │
│           ▼                                                                   │
│  2. UPLOAD TO BACKEND                                                        │
│     App.tsx → processMutation.mutate(file)                                   │
│     api.ts → POST /api/process (FormData)                                    │
│           │                                                                   │
│           ▼                                                                   │
│  3. BACKEND RECEIVES                                                         │
│     main.py → @app.post("/api/process")                                      │
│     • Validate file type (.pdf, .png, .jpg)                                  │
│     • Check license: can_process()                                           │
│     • Save to /output/uploads/{job_id}.pdf                                   │
│     • Create job record: jobs[job_id] = ProcessingJob(...)                   │
│     • Start background task                                                  │
│           │                                                                   │
│           ▼                                                                   │
│  4. BACKGROUND PROCESSING                                                    │
│     main.py → process_document_task(job_id, file_path, options)              │
│     processor.py → DocumentProcessor.process_document()                      │
│           │                                                                   │
│           ├──► Step 1: Load document (Docling/EasyOCR)                       │
│           ├──► Step 2: Extract tables (img2table)                            │
│           ├──► Step 3: Detect signatures (OpenCV)                            │
│           ├──► Step 4: Extract key-values (regex)                            │
│           └──► Step 5: Build ExtractionResult                                │
│           │                                                                   │
│           ▼                                                                   │
│  5. STORE RESULT                                                             │
│     main.py → results[job_id] = extraction_result                            │
│     main.py → jobs[job_id].status = "completed"                              │
│           │                                                                   │
│           ▼                                                                   │
│  6. FRONTEND POLLS                                                           │
│     usePolling.ts → every 1 second                                           │
│     api.ts → GET /api/status/{job_id}                                        │
│     App.tsx → update activeJobs state                                        │
│     ProcessingCard.tsx → show progress bar                                   │
│           │                                                                   │
│           ▼                                                                   │
│  7. FETCH RESULT                                                             │
│     App.tsx → handleViewResult(job_id)                                       │
│     api.ts → GET /api/result/{job_id}                                        │
│     App.tsx → setSelectedResult(result)                                      │
│     ResultsViewer.tsx → display tabs                                         │
│           │                                                                   │
│           ▼                                                                   │
│  8. EXPORT (OPTIONAL)                                                        │
│     ResultsViewer.tsx → onExport("xlsx")                                     │
│     api.ts → POST /api/export/{job_id}                                       │
│     processor.py → export_to_excel()                                         │
│     Browser → download file                                                  │
│                                                                               │
└──────────────────────────────────────────────────────────────────────────────┘
```

### Data Models Flow

```
File Upload
    │
    ▼
ProcessRequest ──────────────────────────────────────────┐
{                                                        │
  method: "auto",                                        │
  extract_tables: true,                                  │
  extract_signatures: true,                              │
  extract_key_values: true                               │
}                                                        │
    │                                                    │
    ▼                                                    │
ProcessResponse                                          │
{                                                        │
  job_id: "abc-123-def",                                │
  status: "pending",                                     │
  message: "Document queued"                             │
}                                                        │
    │                                                    │
    ▼                                                    │
JobStatusResponse (polled)                               │
{                                                        │
  job_id: "abc-123-def",                                │
  status: "processing",  ◄── "pending" → "processing" → "completed"
  progress: 45,          ◄── 0 to 100                    │
  current_step: "Extracting tables"                      │
}                                                        │
    │                                                    │
    ▼                                                    │
ExtractionResult ◄───────────────────────────────────────┘
{
  document_source: "/path/to/invoice.pdf",
  document_type: "invoice",
  pages: 2,
  processed_at: "2024-01-15T10:30:00",
  processing_time_seconds: 4.5,

  text: "INVOICE\nInvoice #: INV-001\nDate: ...",

  key_values: [
    { key: "Invoice Number", value: "INV-001", confidence: 0.95 },
    { key: "Date", value: "January 15, 2024", confidence: 0.90 },
    { key: "Total", value: "$1,234.56", confidence: 0.88 }
  ],

  tables: [
    {
      id: "table_1",
      page: 1,
      headers: ["Item", "Qty", "Price", "Total"],
      rows: [
        ["Widget A", "10", "$50.00", "$500.00"],
        ["Widget B", "5", "$100.00", "$500.00"]
      ]
    }
  ],

  signatures: [
    {
      id: "sig_1",
      confidence: 0.85,
      status: "valid",
      page: 2,
      location: { left: 0.1, top: 0.8, width: 0.3, height: 0.1 }
    }
  ],

  human_review_required: false,
  overall_confidence: 0.89
}
```

---

## AI/ML Pipeline

### How Signature Detection Works

```python
# src/core/processor.py - detect_signatures()

def detect_signatures(image_path: str, threshold: float = 0.6):
    """
    STEP 1: Load and preprocess image
    """
    img = cv2.imread(image_path)
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

    # Focus on bottom 40% of page (where signatures typically are)
    signature_region = gray[int(height * 0.6):, :]

    """
    STEP 2: Find ink marks using adaptive thresholding
    """
    binary = cv2.adaptiveThreshold(
        signature_region, 255,
        cv2.ADAPTIVE_THRESH_GAUSSIAN_C,  # Local threshold
        cv2.THRESH_BINARY_INV,           # Invert (ink = white)
        11, 2                             # Block size, constant
    )

    """
    STEP 3: Find contours (connected components)
    """
    contours, _ = cv2.findContours(binary, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

    """
    STEP 4: Filter for signature-like shapes
    """
    for contour in contours:
        area = cv2.contourArea(contour)
        x, y, w, h = cv2.boundingRect(contour)
        aspect_ratio = w / h

        # Signatures are typically:
        # - Medium size (500-50000 pixels)
        # - Wider than tall (aspect ratio 1.5-10)
        # - Moderate ink density (5-50%)

        if 500 < area < 50000 and 1.5 < aspect_ratio < 10:
            ink_density = count_white_pixels(roi) / total_pixels
            if 0.05 < ink_density < 0.5:
                confidence = min(0.9, ink_density * 2 + 0.3)
                signatures.append({...})

    """
    STEP 5: Classify by confidence
    """
    # >= 60%: valid
    # 40-60%: needs_review
    # < 40%: invalid
```

### How Table Extraction Works

```python
# Uses img2table library with EasyOCR backend

from img2table.document import Image as Img2TableImage
from img2table.ocr import EasyOCR as Img2TableOCR

def extract_tables_with_img2table(image_path: str):
    """
    STEP 1: Initialize OCR backend
    """
    ocr = Img2TableOCR(lang=['en'])

    """
    STEP 2: Load document
    """
    doc = Img2TableImage(src=image_path)

    """
    STEP 3: Detect tables (line detection + cell segmentation)
    """
    extracted_tables = doc.extract_tables(ocr=ocr)

    """
    STEP 4: Convert to structured format
    """
    for table in extracted_tables:
        if table.df is not None:  # Returns pandas DataFrame
            rows = [table.df.columns.tolist()] + table.df.values.tolist()
            # Returns: [["Header1", "Header2"], ["Row1Col1", "Row1Col2"], ...]
```

### How Document Loading Works

```python
def load_document(file_path: str, method: str = "auto"):
    """
    METHOD SELECTION:
    """
    if method == "auto":
        if is_image(file_path):
            method = "ocr"      # Use EasyOCR
        else:
            method = "docling"  # Use Docling for PDFs

    """
    DOCLING (Primary - 97.9% table accuracy):
    """
    if method == "docling":
        from docling.document_converter import DocumentConverter
        converter = DocumentConverter()
        result = converter.convert(str(file_path))
        return result.document.export_to_markdown()

    """
    EASYOCR (For scanned documents):
    """
    if method == "ocr":
        reader = easyocr.Reader(['en'], gpu=True)  # MPS on M1
        result = reader.readtext(image_path)
        return '\n'.join([text for _, text, _ in result])

    """
    LLAVA VISION (For complex layouts):
    """
    if method == "vision":
        llm = ChatOllama(model="llava:7b")
        message = HumanMessage(content=[
            {"type": "text", "text": "Extract all text from this document"},
            {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{img_b64}"}}
        ])
        return llm.invoke([message]).content
```

---

## API Reference

### Endpoints

| Method | Endpoint | Request | Response |
|--------|----------|---------|----------|
| POST | `/api/process` | `FormData: file` | `{job_id, status, message}` |
| GET | `/api/status/{job_id}` | - | `{job_id, status, progress, current_step}` |
| GET | `/api/result/{job_id}` | - | `ExtractionResult` |
| POST | `/api/export/{job_id}` | `{format: "xlsx"}` | File download |
| GET | `/api/health` | - | `{status, ollama_connected, ...}` |
| GET | `/api/license` | - | `{valid, type, remaining}` |
| POST | `/api/license/activate` | `?license_key=XXXX-...` | `{message, info}` |

### Interactive API Docs

When backend is running: **http://127.0.0.1:8000/docs**

This auto-generated Swagger UI lets you test all endpoints.

---

## Desktop App (Tauri)

### How Tauri Works

```
┌─────────────────────────────────────────────────────────────┐
│                    TAURI ARCHITECTURE                        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │                    RUST CORE                            │ │
│  │  src-tauri/src/main.rs                                 │ │
│  │                                                         │ │
│  │  • Creates native window                               │ │
│  │  • Starts Python backend as subprocess                 │ │
│  │  • Manages Ollama connection                           │ │
│  │  • Handles file system access                          │ │
│  └────────────────────────────────────────────────────────┘ │
│                          │                                   │
│                          │ IPC Bridge                        │
│                          ▼                                   │
│  ┌────────────────────────────────────────────────────────┐ │
│  │                    WEBVIEW                              │ │
│  │  Renders React app (ui/dist/)                          │ │
│  │  Minimal memory footprint (not Chromium)               │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Tauri vs Electron

| Feature | Tauri | Electron |
|---------|-------|----------|
| Bundle size | ~5 MB | ~150 MB |
| RAM usage | ~30 MB | ~150 MB |
| Backend | Rust (fast, safe) | Node.js |
| Webview | System native | Chromium (bundled) |

### Build Commands

```bash
# Development
cargo tauri dev

# Production build
cargo tauri build

# Outputs:
# macOS: src-tauri/target/release/bundle/macos/DocuExtract Pro.app
# macOS: src-tauri/target/release/bundle/dmg/DocuExtract Pro_1.0.0.dmg
# Windows: src-tauri/target/release/bundle/msi/DocuExtract Pro_1.0.0.msi
```

---

## License System

### How Licensing Works

```
┌─────────────────────────────────────────────────────────────┐
│                    LICENSE FLOW                              │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  FIRST RUN:                                                  │
│  ──────────                                                  │
│  1. No license file exists                                   │
│  2. Create TRIAL license automatically                       │
│  3. Save to ~/.docuextract/license.json                     │
│  4. Trial: 10 documents, 14 days                            │
│                                                              │
│  PROCESSING:                                                 │
│  ───────────                                                 │
│  1. Check can_process() before each document                │
│  2. If trial: check document count < 10                     │
│  3. If paid: always allow (unlimited)                       │
│  4. record_usage() after successful processing              │
│                                                              │
│  ACTIVATION:                                                 │
│  ───────────                                                 │
│  1. User enters key: PERS-XXXX-XXXX-XXXX                   │
│  2. Validate format (regex)                                  │
│  3. Decode type from first 4 chars                          │
│  4. Verify checksum (last 4 chars)                          │
│  5. Save to license.json with machine_id                    │
│                                                              │
│  MACHINE BINDING:                                            │
│  ────────────────                                            │
│  machine_id = SHA256(hostname + arch + processor)[:16]      │
│  Prevents sharing keys across unlimited machines            │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### License File Structure

```json
// ~/.docuextract/license.json
{
  "type": "PROFESSIONAL",
  "key": "PROF-A1B2-C3D4-E5F6",
  "machine_id": "abc123def456",
  "activated_at": "2024-01-15T10:00:00",
  "expires_at": "2025-01-15T10:00:00",
  "documents_processed": 47,
  "machines": ["abc123def456", "xyz789..."]
}
```

---

## File Structure Map

```
docuextract-pro/
│
├── src/                              # PYTHON BACKEND
│   ├── __init__.py                   # Package marker
│   │
│   ├── api/                          # REST API LAYER
│   │   ├── __init__.py
│   │   └── main.py                   # FastAPI app, all endpoints
│   │                                  # 250 lines, handles:
│   │                                  # - File upload
│   │                                  # - Job management
│   │                                  # - Background processing
│   │                                  # - Export functionality
│   │
│   ├── core/                         # PROCESSING ENGINE
│   │   ├── __init__.py
│   │   ├── config.py                 # Environment variables
│   │   │                              # TEXT_MODEL, VISION_MODEL, etc.
│   │   │
│   │   ├── models.py                 # Pydantic data models
│   │   │                              # ExtractionResult, KeyValuePair,
│   │   │                              # TableData, SignatureResult, etc.
│   │   │
│   │   └── processor.py              # MAIN PROCESSING LOGIC
│   │                                  # 600 lines, contains:
│   │                                  # - DocumentProcessor class
│   │                                  # - detect_signatures()
│   │                                  # - extract_with_easyocr()
│   │                                  # - extract_tables_with_img2table()
│   │                                  # - load_with_docling/pymupdf/vision()
│   │
│   └── license/                      # LICENSE MANAGEMENT
│       ├── __init__.py
│       └── validator.py              # LicenseValidator class
│                                      # Trial limits, activation, machine binding
│
├── ui/                               # REACT FRONTEND
│   ├── src/
│   │   ├── main.tsx                  # React entry point
│   │   ├── App.tsx                   # Main app component (200 lines)
│   │   │                              # State management, polling, mutations
│   │   │
│   │   ├── components/
│   │   │   ├── DropZone.tsx          # Drag-drop file upload
│   │   │   ├── ProcessingCard.tsx    # Job progress display
│   │   │   ├── ResultsViewer.tsx     # Tabbed results display (350 lines)
│   │   │   ├── Header.tsx            # App header, dark mode toggle
│   │   │   └── StatusBar.tsx         # Connection status, license info
│   │   │
│   │   ├── hooks/
│   │   │   └── usePolling.ts         # Polling hook for job status
│   │   │
│   │   └── utils/
│   │       ├── api.ts                # API client functions
│   │       └── cn.ts                 # Tailwind class merger
│   │
│   ├── index.html                    # HTML entry point
│   ├── package.json                  # NPM dependencies
│   ├── tailwind.config.js            # Tailwind configuration
│   ├── tsconfig.json                 # TypeScript configuration
│   └── vite.config.ts                # Vite build configuration
│
├── src-tauri/                        # TAURI DESKTOP SHELL
│   ├── src/
│   │   └── main.rs                   # Rust entry point
│   │                                  # Starts Python backend
│   │                                  # Creates native window
│   │
│   ├── Cargo.toml                    # Rust dependencies
│   ├── tauri.conf.json               # Tauri configuration
│   │                                  # Window size, permissions, bundling
│   └── build.rs                      # Build script
│
├── scripts/                          # BUILD & SETUP SCRIPTS
│   ├── setup-dev.sh                  # Development environment setup
│   ├── build-mac.sh                  # macOS build script
│   └── build-windows.ps1             # Windows build script
│
├── docs/                             # DOCUMENTATION
│   ├── PRODUCT_PLAN.md               # Pricing, marketing, sales strategy
│   ├── SYSTEM_REQUIREMENTS.md        # Hardware/software requirements
│   └── TECHNICAL_ARCHITECTURE.md     # This file
│
├── output/                           # PROCESSING OUTPUT
│   └── uploads/                      # Uploaded files (temporary)
│
├── requirements.txt                  # Python dependencies
├── Makefile                          # Development commands
├── README.md                         # Project overview
├── LICENSE                           # MIT License
├── .gitignore                        # Git ignore rules
└── .env.example                      # Environment template
```

---

## How to Explain to Customers

### For Business Owners (Non-Technical)

> "DocuExtract Pro reads your documents like a human would, but in seconds instead of minutes. Drop in an invoice, and it pulls out the vendor name, invoice number, line items, and total—ready to paste into your accounting software or export to Excel. It runs on your computer, so sensitive documents never leave your office."

### For IT Managers

> "It's a locally-deployed document processing solution using open-source AI models (Llama 3.1, LLaVA). No cloud dependencies, no API costs, no data leaving the network. Runs on standard hardware—16GB RAM, no GPU required. One-time license, unlimited documents."

### For Developers

> "FastAPI backend with async job processing, React frontend with TanStack Query, Tauri for desktop packaging. The processing pipeline uses Docling (97.9% table accuracy), EasyOCR with MPS acceleration, and OpenCV for signature detection. All models run locally via Ollama."

### The Demo Script

1. **Show the problem** (30 sec)
   - "Here's a stack of invoices. Normally, you'd open each one, type the vendor, amount, date..."

2. **Show the solution** (60 sec)
   - Drop an invoice
   - Watch progress bar
   - Show extracted data in tabs
   - Click "Export to Excel"

3. **Show the value** (30 sec)
   - "That took 5 seconds. Manual entry would be 5 minutes."
   - "100 invoices = 8 hours saved per month"
   - "One-time $99 vs $20/month subscription = break-even in 5 months"

---

## Summary

You now understand:

1. **Architecture**: React → FastAPI → Processing Engine → Ollama
2. **Data Flow**: Upload → Job Queue → Background Processing → Poll → Display
3. **AI Pipeline**: Docling/EasyOCR → img2table → OpenCV → Regex
4. **Components**: Each file's purpose and how they connect
5. **Business Model**: Trial → Paid tiers, one-time purchase
6. **How to explain**: Different pitches for different audiences

You are now the architect of DocuExtract Pro.
