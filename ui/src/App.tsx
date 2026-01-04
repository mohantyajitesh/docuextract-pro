import React, { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Header } from './components/Header';
import { DropZone } from './components/DropZone';
import { ProcessingCard } from './components/ProcessingCard';
import { ResultsViewer } from './components/ResultsViewer';
import { StatusBar } from './components/StatusBar';
import { usePolling } from './hooks/usePolling';
import {
  checkHealth,
  processDocument,
  getJobStatus,
  getResult,
  getLicenseInfo,
  exportResult,
  type JobStatus,
  type ExtractionResult,
} from './utils/api';

interface ActiveJob {
  jobId: string;
  filename: string;
  status: JobStatus | null;
}

function App() {
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  const [activeJobs, setActiveJobs] = useState<ActiveJob[]>([]);
  const [selectedResult, setSelectedResult] = useState<ExtractionResult | null>(null);

  const queryClient = useQueryClient();

  // Apply dark mode
  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);

  // Health check query
  const { data: health, isLoading: healthLoading } = useQuery({
    queryKey: ['health'],
    queryFn: checkHealth,
    refetchInterval: 30000,
    retry: 2,
  });

  // License info query
  const { data: license } = useQuery({
    queryKey: ['license'],
    queryFn: getLicenseInfo,
    retry: 1,
  });

  // Process document mutation
  const processMutation = useMutation({
    mutationFn: (file: File) => processDocument(file),
    onSuccess: (data, file) => {
      setActiveJobs((prev) => [
        { jobId: data.job_id, filename: file.name, status: null },
        ...prev,
      ]);
    },
  });

  // Poll for job status
  const pollJobStatus = useCallback(async () => {
    const pendingJobs = activeJobs.filter(
      (j) => j.status?.status !== 'completed' && j.status?.status !== 'failed'
    );

    for (const job of pendingJobs) {
      try {
        const status = await getJobStatus(job.jobId);
        setActiveJobs((prev) =>
          prev.map((j) => (j.jobId === job.jobId ? { ...j, status } : j))
        );
      } catch (error) {
        console.error('Failed to get job status:', error);
      }
    }
  }, [activeJobs]);

  usePolling(
    pollJobStatus,
    1000,
    activeJobs.some((j) => j.status?.status !== 'completed' && j.status?.status !== 'failed')
  );

  // Handle file selection
  const handleFileSelect = (file: File) => {
    processMutation.mutate(file);
  };

  // View result
  const handleViewResult = async (jobId: string) => {
    try {
      const result = await getResult(jobId);
      setSelectedResult(result);
    } catch (error) {
      console.error('Failed to get result:', error);
    }
  };

  // Export result
  const handleExport = async (format: 'json' | 'csv' | 'xlsx' | 'markdown') => {
    if (!selectedResult) return;

    const job = activeJobs.find((j) => j.status?.status === 'completed');
    if (!job) return;

    try {
      const blob = await exportResult(job.jobId, format);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `extraction.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const isProcessing = activeJobs.some(
    (j) => j.status?.status === 'processing' || j.status?.status === 'pending'
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      <Header darkMode={darkMode} onToggleDarkMode={() => setDarkMode(!darkMode)} />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Upload & Jobs */}
          <div className="space-y-6">
            {/* Upload Zone */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Process Document
              </h2>
              <DropZone onFileSelect={handleFileSelect} isProcessing={isProcessing} />

              {processMutation.isError && (
                <p className="mt-2 text-sm text-danger-600">
                  {(processMutation.error as Error).message}
                </p>
              )}
            </div>

            {/* Active Jobs */}
            {activeJobs.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                  Processing Queue
                </h2>
                <div className="space-y-3">
                  {activeJobs.map((job) => (
                    <ProcessingCard
                      key={job.jobId}
                      filename={job.filename}
                      status={job.status}
                      onViewResult={
                        job.status?.status === 'completed'
                          ? () => handleViewResult(job.jobId)
                          : undefined
                      }
                    />
                  ))}
                </div>
              </div>
            )}

            {/* What You Get Section */}
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                What You'll Get
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center flex-shrink-0">
                    <span className="text-primary-600 text-sm font-bold">1</span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-gray-100">Extracted Text</p>
                    <p className="text-sm text-gray-500">Full document text, searchable</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center flex-shrink-0">
                    <span className="text-primary-600 text-sm font-bold">2</span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-gray-100">Tables</p>
                    <p className="text-sm text-gray-500">Structured table data</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center flex-shrink-0">
                    <span className="text-primary-600 text-sm font-bold">3</span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-gray-100">Key-Values</p>
                    <p className="text-sm text-gray-500">Form fields, labels & values</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center flex-shrink-0">
                    <span className="text-primary-600 text-sm font-bold">4</span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-gray-100">Signatures</p>
                    <p className="text-sm text-gray-500">Detected & validated</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Results */}
          <div>
            {selectedResult ? (
              <ResultsViewer result={selectedResult} onExport={handleExport} />
            ) : (
              <div className="card p-12 text-center">
                <div className="w-16 h-16 mx-auto rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center mb-4">
                  <svg
                    className="w-8 h-8 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                  No Results Yet
                </h3>
                <p className="text-gray-500 mt-2">
                  Upload a document to see extraction results here
                </p>
              </div>
            )}
          </div>
        </div>
      </main>

      <StatusBar health={health ?? null} license={license ?? null} isLoading={healthLoading} />
    </div>
  );
}

export default App;
