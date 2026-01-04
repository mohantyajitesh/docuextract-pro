import React from 'react';
import { CheckCircle, XCircle, AlertCircle, Loader2 } from 'lucide-react';
import type { HealthStatus, LicenseInfo } from '../utils/api';

interface StatusBarProps {
  health: HealthStatus | null;
  license: LicenseInfo | null;
  isLoading: boolean;
}

export function StatusBar({ health, license, isLoading }: StatusBarProps) {
  if (isLoading) {
    return (
      <div className="bg-gray-100 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600 px-4 py-2">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Connecting...</span>
        </div>
      </div>
    );
  }

  const isHealthy = health?.status === 'healthy';
  const ollamaOk = health?.ollama_connected;
  const modelsOk = health?.text_model_available && health?.vision_model_available;

  return (
    <div className="bg-gray-100 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600 px-4 py-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 text-sm">
          {/* Connection Status */}
          <div className="flex items-center gap-1.5">
            {isHealthy ? (
              <CheckCircle className="w-4 h-4 text-success-500" />
            ) : ollamaOk ? (
              <AlertCircle className="w-4 h-4 text-warning-500" />
            ) : (
              <XCircle className="w-4 h-4 text-danger-500" />
            )}
            <span className="text-gray-600 dark:text-gray-300">
              {isHealthy ? 'Ready' : ollamaOk ? 'Degraded' : 'Offline'}
            </span>
          </div>

          {/* Ollama Status */}
          <div className="flex items-center gap-1.5">
            <div
              className={`w-2 h-2 rounded-full ${
                ollamaOk ? 'bg-success-500' : 'bg-danger-500'
              }`}
            />
            <span className="text-gray-500 dark:text-gray-400">Ollama</span>
          </div>

          {/* Models Status */}
          <div className="flex items-center gap-1.5">
            <div
              className={`w-2 h-2 rounded-full ${
                modelsOk ? 'bg-success-500' : 'bg-warning-500'
              }`}
            />
            <span className="text-gray-500 dark:text-gray-400">Models</span>
          </div>
        </div>

        {/* License Info */}
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {license && (
            <span>
              {license.type} License
              {license.type === 'TRIAL' && license.remaining && (
                <span className="ml-2 text-warning-600">
                  ({license.remaining.documents} docs remaining)
                </span>
              )}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
