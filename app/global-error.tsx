'use client';

import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Global root error:', error);
  }, [error]);

  return (
    <html>
      <body>
        <div style={{ minHeight: '100vh', background: '#f9fafb', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', fontFamily: 'sans-serif' }}>
          <div style={{ background: 'white', border: '1px solid #fecaca', borderRadius: '1rem', padding: '1.5rem', maxWidth: '40rem', width: '100%', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <h2 style={{ color: '#dc2626', fontSize: '1.125rem', fontWeight: 600, marginBottom: '0.5rem' }}>Something went wrong</h2>
            <p style={{ color: '#4b5563', fontSize: '0.875rem', marginBottom: '0.75rem' }}>{error.message || 'An unexpected error occurred.'}</p>
            {error.digest && (
              <p style={{ color: '#9ca3af', fontSize: '0.75rem', marginBottom: '1rem', fontFamily: 'monospace' }}>Digest: {error.digest}</p>
            )}
            <pre style={{ fontSize: '0.75rem', color: '#6b7280', background: '#f9fafb', borderRadius: '0.75rem', padding: '0.75rem', overflow: 'auto', maxHeight: '12rem', marginBottom: '1rem', whiteSpace: 'pre-wrap' }}>
              {error.stack || 'No stack trace available'}
            </pre>
            <button
              onClick={reset}
              style={{ padding: '0.5rem 1rem', background: '#16a34a', color: 'white', borderRadius: '0.75rem', fontSize: '0.875rem', fontWeight: 500, border: 'none', cursor: 'pointer' }}
            >
              Try again
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
