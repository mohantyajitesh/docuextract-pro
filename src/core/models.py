"""
DocuExtract Pro - Pydantic Models for Validated Output
"""
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field
from datetime import datetime
from enum import Enum


class JobStatus(str, Enum):
    """Processing job status."""
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


class SignatureStatus(str, Enum):
    """Signature validation status."""
    VALID = "valid"
    NEEDS_REVIEW = "needs_review"
    INVALID = "invalid"


class SignatureResult(BaseModel):
    """Validated signature detection result."""
    id: str = Field(description="Unique signature identifier")
    confidence: float = Field(ge=0, le=1, description="Detection confidence score")
    location: Dict[str, float] = Field(description="Bounding box coordinates (left, top, width, height)")
    status: SignatureStatus = Field(description="Validation status")
    page: Optional[int] = Field(default=None, description="Page number if multi-page")


class KeyValuePair(BaseModel):
    """Extracted key-value pair from document."""
    key: str = Field(description="Field name/label")
    value: str = Field(description="Field value")
    confidence: float = Field(ge=0, le=1, default=0.8)
    page: Optional[int] = Field(default=None, description="Page number")


class TableCell(BaseModel):
    """Single table cell."""
    value: str
    row: int
    col: int
    confidence: float = 0.9


class TableData(BaseModel):
    """Extracted table structure."""
    id: str = Field(default="table_1", description="Table identifier")
    rows: List[List[str]] = Field(description="Table rows with cell values")
    headers: Optional[List[str]] = Field(default=None, description="Table headers if detected")
    page: Optional[int] = Field(default=None, description="Page number")


class HumanReviewItem(BaseModel):
    """Item flagged for human review."""
    type: str = Field(description="Type of item (signature, field, table, etc.)")
    id: str = Field(description="Item identifier")
    confidence: float = Field(ge=0, le=1)
    reason: str = Field(description="Why review is needed")
    page: Optional[int] = Field(default=None)


class ExtractionResult(BaseModel):
    """Complete validated extraction output."""
    document_source: str = Field(description="Original document path or name")
    document_type: Optional[str] = Field(default=None, description="Detected document type")
    pages: int = Field(ge=1, description="Number of pages processed")
    processed_at: str = Field(description="ISO timestamp")
    processing_time_seconds: float = Field(default=0.0, description="Processing duration")

    # Extracted content
    text: str = Field(description="Full extracted document text")
    text_by_page: Optional[List[str]] = Field(default=None, description="Text split by page")
    key_values: List[KeyValuePair] = Field(default_factory=list)
    tables: List[TableData] = Field(default_factory=list)
    signatures: List[SignatureResult] = Field(default_factory=list)

    # Review flags
    human_review_required: bool = Field(default=False)
    human_review_items: List[HumanReviewItem] = Field(default_factory=list)

    # Quality metrics
    overall_confidence: float = Field(ge=0, le=1, default=0.0)
    warnings: List[str] = Field(default_factory=list)


class ProcessingJob(BaseModel):
    """Document processing job."""
    job_id: str = Field(description="Unique job identifier")
    status: JobStatus = Field(default=JobStatus.PENDING)
    filename: str = Field(description="Original filename")
    file_size: int = Field(description="File size in bytes")
    created_at: str = Field(description="ISO timestamp when job was created")
    started_at: Optional[str] = Field(default=None)
    completed_at: Optional[str] = Field(default=None)
    progress: int = Field(ge=0, le=100, default=0)
    current_step: Optional[str] = Field(default=None)
    result: Optional[ExtractionResult] = Field(default=None)
    error: Optional[str] = Field(default=None)


# API Request/Response Models
class ProcessRequest(BaseModel):
    """Request to process a document."""
    method: str = Field(default="auto", description="Processing method: auto, docling, pymupdf, ocr, vision")
    extract_tables: bool = Field(default=True)
    extract_signatures: bool = Field(default=True)
    extract_key_values: bool = Field(default=True)


class ProcessResponse(BaseModel):
    """Response after submitting a document for processing."""
    job_id: str
    status: JobStatus
    message: str


class JobStatusResponse(BaseModel):
    """Response for job status query."""
    job_id: str
    status: JobStatus
    progress: int
    current_step: Optional[str]
    error: Optional[str]


class ExportFormat(str, Enum):
    """Supported export formats."""
    JSON = "json"
    CSV = "csv"
    EXCEL = "xlsx"
    MARKDOWN = "markdown"


class ExportRequest(BaseModel):
    """Request to export results."""
    format: ExportFormat = Field(default=ExportFormat.JSON)
    include_text: bool = Field(default=True)
    include_tables: bool = Field(default=True)
    include_key_values: bool = Field(default=True)
    include_signatures: bool = Field(default=True)


class HealthResponse(BaseModel):
    """Health check response."""
    status: str
    version: str
    ollama_connected: bool
    text_model_available: bool
    vision_model_available: bool
    license_valid: bool
    license_type: Optional[str]
