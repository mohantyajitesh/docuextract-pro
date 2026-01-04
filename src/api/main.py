"""
DocuExtract Pro - FastAPI Backend
REST API for document processing operations.
"""
import os
import uuid
import asyncio
from pathlib import Path
from typing import Dict, Optional
from datetime import datetime
from contextlib import asynccontextmanager

from fastapi import FastAPI, UploadFile, File, HTTPException, BackgroundTasks, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles

from ..core.config import API_HOST, API_PORT, OUTPUT_DIR, TEXT_MODEL, VISION_MODEL, OLLAMA_BASE_URL
from ..core.models import (
    ProcessRequest, ProcessResponse, JobStatusResponse, ExportRequest,
    ExportFormat, HealthResponse, JobStatus, ProcessingJob, ExtractionResult
)
from ..core.processor import DocumentProcessor
from ..license.validator import LicenseValidator

# =============================================================================
# APP SETUP
# =============================================================================

# In-memory job storage (use Redis/DB for production)
jobs: Dict[str, ProcessingJob] = {}
results: Dict[str, ExtractionResult] = {}

# Processor and license validator
processor = DocumentProcessor()
license_validator = LicenseValidator()

# Upload directory
UPLOAD_DIR = Path(OUTPUT_DIR) / "uploads"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan handler."""
    # Startup
    print(f"DocuExtract Pro API starting on http://{API_HOST}:{API_PORT}")
    print(f"Text Model: {TEXT_MODEL}")
    print(f"Vision Model: {VISION_MODEL}")
    yield
    # Shutdown
    print("DocuExtract Pro API shutting down")


app = FastAPI(
    title="DocuExtract Pro",
    description="AI-powered document extraction API - Extract text, tables, signatures, and key-value pairs from any document.",
    version="1.0.0",
    lifespan=lifespan
)

# CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000", "tauri://localhost"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# =============================================================================
# BACKGROUND PROCESSING
# =============================================================================

async def process_document_task(job_id: str, file_path: str, options: ProcessRequest):
    """Background task for document processing."""
    job = jobs[job_id]

    def progress_callback(percent: int, step: str):
        job.progress = percent
        job.current_step = step

    try:
        job.status = JobStatus.PROCESSING
        job.started_at = datetime.now().isoformat()
        job.current_step = "Starting"

        # Run processing in thread pool
        loop = asyncio.get_event_loop()
        result = await loop.run_in_executor(
            None,
            lambda: processor.process_document(
                file_path=file_path,
                method=options.method,
                extract_tables=options.extract_tables,
                extract_signatures=options.extract_signatures,
                extract_key_values=options.extract_key_values,
                progress_callback=progress_callback
            )
        )

        # Save result
        results[job_id] = result
        output_path = processor.save_result(result)

        job.status = JobStatus.COMPLETED
        job.completed_at = datetime.now().isoformat()
        job.progress = 100
        job.current_step = "Complete"
        job.result = result

    except Exception as e:
        job.status = JobStatus.FAILED
        job.error = str(e)
        job.completed_at = datetime.now().isoformat()

    finally:
        # Cleanup uploaded file
        try:
            os.unlink(file_path)
        except:
            pass


# =============================================================================
# API ENDPOINTS
# =============================================================================

@app.get("/", tags=["Root"])
async def root():
    """API root endpoint."""
    return {
        "name": "DocuExtract Pro",
        "version": "1.0.0",
        "status": "running",
        "docs": "/docs"
    }


@app.get("/api/health", response_model=HealthResponse, tags=["Health"])
async def health_check():
    """Check API health and dependencies."""
    import subprocess

    ollama_connected = False
    text_model_available = False
    vision_model_available = False

    try:
        result = subprocess.run(["ollama", "list"], capture_output=True, text=True, timeout=5)
        if result.returncode == 0:
            ollama_connected = True
            models = result.stdout.lower()
            text_model_available = TEXT_MODEL.split(':')[0] in models
            vision_model_available = VISION_MODEL.split(':')[0] in models
    except:
        pass

    license_info = license_validator.get_license_info()

    return HealthResponse(
        status="healthy" if ollama_connected else "degraded",
        version="1.0.0",
        ollama_connected=ollama_connected,
        text_model_available=text_model_available,
        vision_model_available=vision_model_available,
        license_valid=license_info.get("valid", False),
        license_type=license_info.get("type")
    )


@app.post("/api/process", response_model=ProcessResponse, tags=["Processing"])
async def process_document(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    method: str = Query(default="auto", description="Processing method"),
    extract_tables: bool = Query(default=True),
    extract_signatures: bool = Query(default=True),
    extract_key_values: bool = Query(default=True)
):
    """
    Upload and process a document.
    Returns a job ID for tracking progress.
    """
    # Validate file type
    allowed_extensions = {'.pdf', '.png', '.jpg', '.jpeg', '.tiff', '.bmp', '.gif'}
    file_ext = Path(file.filename).suffix.lower()

    if file_ext not in allowed_extensions:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type: {file_ext}. Allowed: {', '.join(allowed_extensions)}"
        )

    # Check license for processing limits
    if not license_validator.can_process():
        raise HTTPException(
            status_code=403,
            detail="Processing limit reached. Please upgrade your license."
        )

    # Save uploaded file
    job_id = str(uuid.uuid4())
    file_path = UPLOAD_DIR / f"{job_id}{file_ext}"

    with open(file_path, "wb") as f:
        content = await file.read()
        f.write(content)

    # Create job
    job = ProcessingJob(
        job_id=job_id,
        status=JobStatus.PENDING,
        filename=file.filename,
        file_size=len(content),
        created_at=datetime.now().isoformat(),
        progress=0
    )
    jobs[job_id] = job

    # Start background processing
    options = ProcessRequest(
        method=method,
        extract_tables=extract_tables,
        extract_signatures=extract_signatures,
        extract_key_values=extract_key_values
    )
    background_tasks.add_task(process_document_task, job_id, str(file_path), options)

    # Increment usage counter
    license_validator.record_usage()

    return ProcessResponse(
        job_id=job_id,
        status=JobStatus.PENDING,
        message=f"Document '{file.filename}' queued for processing"
    )


@app.get("/api/status/{job_id}", response_model=JobStatusResponse, tags=["Processing"])
async def get_job_status(job_id: str):
    """Get the status of a processing job."""
    if job_id not in jobs:
        raise HTTPException(status_code=404, detail="Job not found")

    job = jobs[job_id]

    return JobStatusResponse(
        job_id=job_id,
        status=job.status,
        progress=job.progress,
        current_step=job.current_step,
        error=job.error
    )


@app.get("/api/result/{job_id}", tags=["Processing"])
async def get_result(job_id: str):
    """Get the extraction result for a completed job."""
    if job_id not in jobs:
        raise HTTPException(status_code=404, detail="Job not found")

    job = jobs[job_id]

    if job.status == JobStatus.PENDING or job.status == JobStatus.PROCESSING:
        raise HTTPException(status_code=202, detail="Job still processing")

    if job.status == JobStatus.FAILED:
        raise HTTPException(status_code=500, detail=f"Job failed: {job.error}")

    if job_id not in results:
        raise HTTPException(status_code=404, detail="Result not found")

    return results[job_id].model_dump()


@app.post("/api/export/{job_id}", tags=["Export"])
async def export_result(job_id: str, export_request: ExportRequest):
    """Export extraction result to specified format."""
    if job_id not in results:
        raise HTTPException(status_code=404, detail="Result not found")

    result = results[job_id]
    source_name = Path(result.document_source).stem
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")

    if export_request.format == ExportFormat.JSON:
        output_path = OUTPUT_DIR / f"{source_name}_{timestamp}.json"
        processor.save_result(result, str(output_path))

    elif export_request.format == ExportFormat.CSV:
        output_path = OUTPUT_DIR / f"{source_name}_{timestamp}.csv"
        processor.export_to_csv(result, str(output_path))

    elif export_request.format == ExportFormat.EXCEL:
        output_path = OUTPUT_DIR / f"{source_name}_{timestamp}.xlsx"
        processor.export_to_excel(result, str(output_path))

    elif export_request.format == ExportFormat.MARKDOWN:
        output_path = OUTPUT_DIR / f"{source_name}_{timestamp}.md"
        with open(output_path, 'w') as f:
            f.write(f"# Extraction Result: {source_name}\n\n")
            f.write(f"**Processed:** {result.processed_at}\n\n")
            f.write(f"## Key-Value Pairs\n\n")
            for kv in result.key_values:
                f.write(f"- **{kv.key}:** {kv.value}\n")
            f.write(f"\n## Tables\n\n")
            for table in result.tables:
                f.write(f"### {table.id}\n\n")
                if table.rows:
                    headers = table.rows[0]
                    f.write("| " + " | ".join(headers) + " |\n")
                    f.write("| " + " | ".join(["---"] * len(headers)) + " |\n")
                    for row in table.rows[1:]:
                        f.write("| " + " | ".join(row) + " |\n")
                f.write("\n")
            f.write(f"## Signatures\n\n")
            for sig in result.signatures:
                f.write(f"- {sig.id}: {sig.status.value} (confidence: {sig.confidence})\n")

    return FileResponse(
        path=str(output_path),
        filename=output_path.name,
        media_type="application/octet-stream"
    )


@app.get("/api/jobs", tags=["Processing"])
async def list_jobs(limit: int = Query(default=50, le=100)):
    """List recent processing jobs."""
    sorted_jobs = sorted(
        jobs.values(),
        key=lambda j: j.created_at,
        reverse=True
    )[:limit]

    return [
        {
            "job_id": j.job_id,
            "filename": j.filename,
            "status": j.status,
            "progress": j.progress,
            "created_at": j.created_at,
            "completed_at": j.completed_at
        }
        for j in sorted_jobs
    ]


@app.delete("/api/jobs/{job_id}", tags=["Processing"])
async def delete_job(job_id: str):
    """Delete a job and its results."""
    if job_id in jobs:
        del jobs[job_id]
    if job_id in results:
        del results[job_id]

    return {"message": "Job deleted"}


# =============================================================================
# LICENSE ENDPOINTS
# =============================================================================

@app.get("/api/license", tags=["License"])
async def get_license_info():
    """Get current license information."""
    return license_validator.get_license_info()


@app.post("/api/license/activate", tags=["License"])
async def activate_license(license_key: str):
    """Activate a license key."""
    success = license_validator.activate(license_key)

    if success:
        return {"message": "License activated successfully", "info": license_validator.get_license_info()}
    else:
        raise HTTPException(status_code=400, detail="Invalid license key")


# =============================================================================
# MAIN ENTRY
# =============================================================================

def run_server():
    """Run the API server."""
    import uvicorn
    uvicorn.run(app, host=API_HOST, port=API_PORT)


if __name__ == "__main__":
    run_server()
