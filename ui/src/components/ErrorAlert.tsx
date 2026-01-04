import React from 'react';

interface ErrorAlertProps {
  error: Error | string;
  onDismiss?: () => void;
  onRetry?: () => void;
}

// Map technical errors to user-friendly messages
function getUserFriendlyMessage(error: Error | string): {
  title: string;
  message: string;
  suggestion: string;
  icon: 'connection' | 'file' | 'server' | 'warning';
} {
  const errorText = typeof error === 'string' ? error : error.message;
  const lowerError = errorText.toLowerCase();

  // Connection errors
  if (lowerError.includes('network') || lowerError.includes('fetch') || lowerError.includes('failed to fetch')) {
    return {
      title: 'Connection Problem',
      message: 'Unable to connect to the processing server.',
      suggestion: 'Make sure the backend server is running. Run "make backend" in your terminal.',
      icon: 'connection',
    };
  }

  // Ollama not running
  if (lowerError.includes('ollama') || lowerError.includes('model not found')) {
    return {
      title: 'AI Engine Not Ready',
      message: 'The local AI engine (Ollama) is not responding.',
      suggestion: 'Start Ollama by running "ollama serve" in a separate terminal, then try again.',
      icon: 'server',
    };
  }

  // Health check failed
  if (lowerError.includes('health check')) {
    return {
      title: 'Backend Not Available',
      message: 'Cannot reach the document processing service.',
      suggestion: 'The backend server may have stopped. Restart it with "make backend".',
      icon: 'connection',
    };
  }

  // File type errors
  if (lowerError.includes('file type') || lowerError.includes('unsupported') || lowerError.includes('format')) {
    return {
      title: 'Unsupported File',
      message: 'This file type is not supported for processing.',
      suggestion: 'Supported formats: PDF, PNG, JPG, JPEG, TIFF, BMP. Try converting your file first.',
      icon: 'file',
    };
  }

  // File too large
  if (lowerError.includes('too large') || lowerError.includes('size')) {
    return {
      title: 'File Too Large',
      message: 'The uploaded file exceeds the maximum size limit.',
      suggestion: 'Try compressing the file or splitting it into smaller parts.',
      icon: 'file',
    };
  }

  // Processing errors
  if (lowerError.includes('processing') || lowerError.includes('extraction')) {
    return {
      title: 'Processing Error',
      message: 'Something went wrong while analyzing your document.',
      suggestion: 'Try uploading a clearer image or a different file format.',
      icon: 'warning',
    };
  }

  // License errors
  if (lowerError.includes('license') || lowerError.includes('limit') || lowerError.includes('trial')) {
    return {
      title: 'License Required',
      message: 'You have reached your document limit or your trial has expired.',
      suggestion: 'Upgrade to a paid license to continue processing documents.',
      icon: 'warning',
    };
  }

  // Export errors
  if (lowerError.includes('export')) {
    return {
      title: 'Export Failed',
      message: 'Unable to export your results.',
      suggestion: 'Try a different export format or process the document again.',
      icon: 'file',
    };
  }

  // Default fallback
  return {
    title: 'Something Went Wrong',
    message: errorText || 'An unexpected error occurred.',
    suggestion: 'Please try again. If the problem persists, restart the application.',
    icon: 'warning',
  };
}

export function ErrorAlert({ error, onDismiss, onRetry }: ErrorAlertProps) {
  const { title, message, suggestion, icon } = getUserFriendlyMessage(error);

  const icons = {
    connection: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
      </svg>
    ),
    file: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    server: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
      </svg>
    ),
    warning: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    ),
  };

  return (
    <div className="rounded-lg bg-danger-50 dark:bg-danger-900/20 border border-danger-200 dark:border-danger-800 p-4">
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-danger-100 dark:bg-danger-900/30 flex items-center justify-center text-danger-600 dark:text-danger-400">
          {icons[icon]}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-danger-800 dark:text-danger-200">
            {title}
          </h3>
          <p className="mt-1 text-sm text-danger-700 dark:text-danger-300">
            {message}
          </p>
          <div className="mt-2 flex items-start gap-2 text-xs text-danger-600 dark:text-danger-400">
            <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{suggestion}</span>
          </div>
        </div>
        <div className="flex-shrink-0 flex gap-2">
          {onRetry && (
            <button
              onClick={onRetry}
              className="px-3 py-1.5 text-xs font-medium text-danger-700 dark:text-danger-300 bg-danger-100 dark:bg-danger-900/30 hover:bg-danger-200 dark:hover:bg-danger-900/50 rounded-md transition-colors"
            >
              Retry
            </button>
          )}
          {onDismiss && (
            <button
              onClick={onDismiss}
              className="p-1.5 text-danger-400 hover:text-danger-600 dark:hover:text-danger-300 rounded-md transition-colors"
              aria-label="Dismiss"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
