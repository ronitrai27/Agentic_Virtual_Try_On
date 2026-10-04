"use client";

import React from 'react';

interface LiveRegionProps {
  announcement: string;
  errorMessage: string | null;
  onRetry: () => void;
}

export const LiveRegion: React.FC<LiveRegionProps> = ({
  announcement,
  errorMessage,
  onRetry,
}) => {
  return (
    <>
      {/* Screen reader live polite announcement */}
      <div role="status" aria-live="polite" className="status-live">
        {announcement}
      </div>

      {/* Visual error notice with Retry button */}
      {errorMessage && (
        <div className="error-notice" role="alert">
          <span>{errorMessage}</span>
          <button
            type="button"
            className="retry-button"
            onClick={onRetry}
            aria-label="Retry transition"
          >
            Retry
          </button>
        </div>
      )}
    </>
  );
};
