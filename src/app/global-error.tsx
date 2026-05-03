'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
        <h1 style={{ color: '#dc2626' }}>Critical Error</h1>
        <p style={{ color: '#6b7280' }}>{error.message}</p>
        <button
          onClick={() => reset()}
          style={{
            padding: '0.5rem 1rem',
            background: '#D4AF37',
            border: 'none',
            borderRadius: '0.5rem',
            cursor: 'pointer',
          }}
        >
          Try again
        </button>
      </body>
    </html>
  );
}
