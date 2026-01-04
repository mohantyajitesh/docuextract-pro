import React from 'react';

interface TimeSavedBannerProps {
  documentsProcessed: number;
}

export function TimeSavedBanner({ documentsProcessed }: TimeSavedBannerProps) {
  // Average time to manually extract data from a document: 15 minutes
  // DocuExtract Pro average processing time: 30 seconds
  const MANUAL_MINUTES_PER_DOC = 15;
  const AUTO_SECONDS_PER_DOC = 30;

  const manualMinutes = documentsProcessed * MANUAL_MINUTES_PER_DOC;
  const autoMinutes = (documentsProcessed * AUTO_SECONDS_PER_DOC) / 60;
  const savedMinutes = Math.max(0, manualMinutes - autoMinutes);

  // Convert to hours if > 60 minutes
  const formatTime = (minutes: number) => {
    if (minutes >= 60) {
      const hours = Math.floor(minutes / 60);
      const mins = Math.round(minutes % 60);
      return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
    }
    return `${Math.round(minutes)}m`;
  };

  // Calculate cost savings (assuming $30/hour labor cost)
  const HOURLY_RATE = 30;
  const savedDollars = (savedMinutes / 60) * HOURLY_RATE;

  if (documentsProcessed === 0) {
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-success-50 to-primary-50 dark:from-success-900/20 dark:to-primary-900/20 rounded-xl p-4 border border-success-200 dark:border-success-800">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-success-100 dark:bg-success-900/30 flex items-center justify-center">
            <svg className="w-5 h-5 text-success-600 dark:text-success-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
              Time Saved This Session
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Based on {documentsProcessed} document{documentsProcessed !== 1 ? 's' : ''} processed
            </p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="text-center">
            <p className="text-2xl font-bold text-success-600 dark:text-success-400">
              {formatTime(savedMinutes)}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Time Saved</p>
          </div>

          <div className="h-8 w-px bg-gray-200 dark:bg-gray-700" />

          <div className="text-center">
            <p className="text-2xl font-bold text-primary-600 dark:text-primary-400">
              ${savedDollars.toFixed(0)}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Value Saved*</p>
          </div>
        </div>
      </div>

      {documentsProcessed >= 5 && (
        <div className="mt-3 pt-3 border-t border-success-200 dark:border-success-800">
          <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
            <svg className="w-4 h-4 text-success-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>
              At this rate, you'll save <strong>{formatTime(savedMinutes * 20)}</strong> per month processing 100 documents!
            </span>
          </div>
        </div>
      )}

      <p className="text-[10px] text-gray-400 mt-2">
        *Based on avg. manual data entry time of {MANUAL_MINUTES_PER_DOC} min/doc at ${HOURLY_RATE}/hr labor cost
      </p>
    </div>
  );
}
