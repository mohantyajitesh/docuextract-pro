/**
 * DocuExtract Pro - API Client
 */

const API_BASE = '/api';

export interface HealthStatus {
  status: string;
  version: string;
  ollama_connected: boolean;
  text_model_available: boolean;
  vision_model_available: boolean;
  license_valid: boolean;
  license_type: string | null;
}

export interface ProcessResponse {
  job_id: string;
  status: string;
  message: string;
}

export interface JobStatus {
  job_id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  current_step: string | null;
  error: string | null;
}

export interface KeyValuePair {
  key: string;
  value: string;
  confidence: number;
  page?: number;
}

export interface TableData {
  id: string;
  rows: string[][];
  headers?: string[];
  page?: number;
}

export interface SignatureResult {
  id: string;
  confidence: number;
  status: 'valid' | 'needs_review' | 'invalid';
  page?: number;
  location: {
    left: number;
    top: number;
    width: number;
    height: number;
  };
}

export interface ExtractionResult {
  document_source: string;
  document_type: string | null;
  pages: number;
  processed_at: string;
  processing_time_seconds: number;
  text: string;
  key_values: KeyValuePair[];
  tables: TableData[];
  signatures: SignatureResult[];
  human_review_required: boolean;
  overall_confidence: number;
}

export interface Job {
  job_id: string;
  filename: string;
  status: string;
  progress: number;
  created_at: string;
  completed_at: string | null;
}

export interface LicenseInfo {
  valid: boolean;
  type: string;
  documents_processed: number;
  documents_limit: number | string;
  remaining: {
    days: number;
    documents: number | string;
  };
}

// API Functions
export async function checkHealth(): Promise<HealthStatus> {
  const response = await fetch(`${API_BASE}/health`);
  if (!response.ok) throw new Error('Health check failed');
  return response.json();
}

export async function processDocument(
  file: File,
  options: {
    method?: string;
    extract_tables?: boolean;
    extract_signatures?: boolean;
    extract_key_values?: boolean;
  } = {}
): Promise<ProcessResponse> {
  const formData = new FormData();
  formData.append('file', file);

  const params = new URLSearchParams();
  if (options.method) params.append('method', options.method);
  if (options.extract_tables !== undefined) params.append('extract_tables', String(options.extract_tables));
  if (options.extract_signatures !== undefined) params.append('extract_signatures', String(options.extract_signatures));
  if (options.extract_key_values !== undefined) params.append('extract_key_values', String(options.extract_key_values));

  const url = `${API_BASE}/process${params.toString() ? '?' + params.toString() : ''}`;
  const response = await fetch(url, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Processing failed');
  }

  return response.json();
}

export async function getJobStatus(jobId: string): Promise<JobStatus> {
  const response = await fetch(`${API_BASE}/status/${jobId}`);
  if (!response.ok) throw new Error('Failed to get job status');
  return response.json();
}

export async function getResult(jobId: string): Promise<ExtractionResult> {
  const response = await fetch(`${API_BASE}/result/${jobId}`);
  if (!response.ok) {
    if (response.status === 202) {
      throw new Error('Still processing');
    }
    throw new Error('Failed to get result');
  }
  return response.json();
}

export async function listJobs(limit = 50): Promise<Job[]> {
  const response = await fetch(`${API_BASE}/jobs?limit=${limit}`);
  if (!response.ok) throw new Error('Failed to list jobs');
  return response.json();
}

export async function exportResult(
  jobId: string,
  format: 'json' | 'csv' | 'xlsx' | 'markdown'
): Promise<Blob> {
  const response = await fetch(`${API_BASE}/export/${jobId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ format }),
  });

  if (!response.ok) throw new Error('Export failed');
  return response.blob();
}

export async function getLicenseInfo(): Promise<LicenseInfo> {
  const response = await fetch(`${API_BASE}/license`);
  if (!response.ok) throw new Error('Failed to get license info');
  return response.json();
}

export async function activateLicense(key: string): Promise<{ message: string; info: LicenseInfo }> {
  const response = await fetch(`${API_BASE}/license/activate?license_key=${encodeURIComponent(key)}`, {
    method: 'POST',
  });

  if (!response.ok) {
    throw new Error('Invalid license key');
  }

  return response.json();
}
