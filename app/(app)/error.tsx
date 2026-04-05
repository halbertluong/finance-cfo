'use client';

import { useEffect } from 'react';

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('App section error:', error);
  }, [error]);

  return (
    <div className="flex items-center justify-center h-full min-h-screen bg-gray-50 p-4">
      <div className="bg-white border border-red-200 rounded-2xl p-6 max-w-lg w-full shadow-sm">
        <h2 className="text-lg font-semibold text-red-600 mb-2">Something went wrong</h2>
        <p className="text-sm text-gray-600 mb-3">{error.message || 'An unexpected error occurred.'}</p>
        {error.digest && (
          <p className="text-xs text-gray-400 mb-4 font-mono">Digest: {error.digest}</p>
        )}
        <pre className="text-xs text-gray-500 bg-gray-50 rounded-xl p-3 overflow-auto max-h-48 mb-4 whitespace-pre-wrap">
          {error.stack || 'No stack trace available'}
        </pre>
        <button
          onClick={reset}
          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-medium transition-colors"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
