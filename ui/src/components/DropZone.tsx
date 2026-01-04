import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, Image } from 'lucide-react';
import { cn } from '../utils/cn';

interface DropZoneProps {
  onFileSelect: (file: File) => void;
  isProcessing?: boolean;
}

export function DropZone({ onFileSelect, isProcessing = false }: DropZoneProps) {
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0 && !isProcessing) {
        onFileSelect(acceptedFiles[0]);
      }
    },
    [onFileSelect, isProcessing]
  );

  const { getRootProps, getInputProps, isDragActive, isDragAccept, isDragReject } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/*': ['.png', '.jpg', '.jpeg', '.tiff', '.bmp', '.gif'],
    },
    maxFiles: 1,
    disabled: isProcessing,
  });

  return (
    <div
      {...getRootProps()}
      className={cn(
        'relative border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all duration-300',
        'hover:border-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20',
        isDragActive && 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 scale-[1.02]',
        isDragAccept && 'border-success-500 bg-success-500/10',
        isDragReject && 'border-danger-500 bg-danger-500/10',
        isProcessing && 'opacity-50 cursor-not-allowed',
        !isDragActive && 'border-gray-300 dark:border-gray-600'
      )}
    >
      <input {...getInputProps()} />

      <div className="flex flex-col items-center gap-4">
        <div
          className={cn(
            'w-16 h-16 rounded-full flex items-center justify-center transition-colors',
            isDragActive ? 'bg-primary-100 dark:bg-primary-800' : 'bg-gray-100 dark:bg-gray-700'
          )}
        >
          <Upload
            className={cn(
              'w-8 h-8 transition-colors',
              isDragActive ? 'text-primary-600' : 'text-gray-400'
            )}
          />
        </div>

        <div>
          <p className="text-lg font-medium text-gray-700 dark:text-gray-200">
            {isDragActive ? 'Drop your document here' : 'Drag & drop your document'}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            or click to browse files
          </p>
        </div>

        <div className="flex items-center gap-4 mt-4">
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <FileText className="w-4 h-4" />
            <span>PDF</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <Image className="w-4 h-4" />
            <span>PNG, JPG, TIFF</span>
          </div>
        </div>
      </div>

      {isProcessing && (
        <div className="absolute inset-0 bg-white/80 dark:bg-gray-900/80 rounded-xl flex items-center justify-center">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-gray-600 dark:text-gray-300">Processing...</span>
          </div>
        </div>
      )}
    </div>
  );
}
