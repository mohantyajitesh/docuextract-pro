import React from 'react';
import { FileText, CheckCircle, XCircle, Clock, Loader2 } from 'lucide-react';
import { cn } from '../utils/cn';
import type { JobStatus } from '../utils/api';

interface ProcessingCardProps {
  filename: string;
  status: JobStatus | null;
  onViewResult?: () => void;
}

export function ProcessingCard({ filename, status, onViewResult }: ProcessingCardProps) {
  const isCompleted = status?.status === 'completed';
  const isFailed = status?.status === 'failed';
  const isProcessing = status?.status === 'processing';
  const isPending = status?.status === 'pending';

  const getStatusIcon = () => {
    if (isCompleted) return <CheckCircle className="w-5 h-5 text-success-500" />;
    if (isFailed) return <XCircle className="w-5 h-5 text-danger-500" />;
    if (isProcessing) return <Loader2 className="w-5 h-5 text-primary-500 animate-spin" />;
    return <Clock className="w-5 h-5 text-gray-400" />;
  };

  const getStatusText = () => {
    if (isCompleted) return 'Completed';
    if (isFailed) return 'Failed';
    if (isProcessing) return status?.current_step || 'Processing...';
    return 'Pending';
  };

  const getStatusColor = () => {
    if (isCompleted) return 'text-success-600';
    if (isFailed) return 'text-danger-600';
    if (isProcessing) return 'text-primary-600';
    return 'text-gray-500';
  };

  return (
    <div className="card p-4">
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center flex-shrink-0">
          <FileText className="w-5 h-5 text-primary-600" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-4">
            <h3 className="font-medium text-gray-900 dark:text-gray-100 truncate">
              {filename}
            </h3>
            {getStatusIcon()}
          </div>

          <div className="mt-2">
            <div className="flex items-center justify-between mb-1">
              <span className={cn('text-sm', getStatusColor())}>
                {getStatusText()}
              </span>
              {(isProcessing || isPending) && (
                <span className="text-sm text-gray-500">
                  {status?.progress || 0}%
                </span>
              )}
            </div>

            {(isProcessing || isPending) && (
              <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary-500 rounded-full transition-all duration-500"
                  style={{ width: `${status?.progress || 0}%` }}
                />
              </div>
            )}

            {isFailed && status?.error && (
              <p className="text-sm text-danger-600 mt-1">{status.error}</p>
            )}
          </div>

          {isCompleted && onViewResult && (
            <button
              onClick={onViewResult}
              className="mt-3 text-sm text-primary-600 hover:text-primary-700 font-medium"
            >
              View Results
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
