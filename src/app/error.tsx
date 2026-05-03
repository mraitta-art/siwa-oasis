'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div style={{ padding: '2rem', textAlign: 'center' }}>
      <h2 style={{ color: '#dc2626' }}>Something went wrong!</h2>
      <p style={{ color: '#6b7280', marginBottom: '1rem' }}>{error.message}</p>
      <button
        onClick={() => reset()}
        style={{
          padding: '0.5rem 1rem',
          background: '#D4AF37',
          border: 'none',
          borderRadius: '0.5rem',
          cursor: 'pointer',
          fontWeight: 500,
        }}
      >
        Try again
      </button>
    </div>
  );
}
