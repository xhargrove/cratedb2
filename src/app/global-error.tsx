'use client';

import { useEffect } from 'react';

/**
 * Root-level error boundary — must define its own <html> / <body> (Next.js requirement).
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[app/global-error]', {
      digest: error.digest,
      name: error.name,
      message: error.message,
    });
  }, [error]);

  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col items-center justify-center gap-4 bg-white px-6 text-center text-neutral-900 dark:bg-neutral-950 dark:text-neutral-100">
        <h1 className="text-xl font-semibold">Application error</h1>
        <p className="max-w-md text-sm text-neutral-600 dark:text-neutral-400">
          {error.message || 'A critical error occurred.'}
        </p>
        <button
          type="button"
          className="rounded-md bg-neutral-900 px-4 py-2 text-sm text-white hover:bg-neutral-800"
          onClick={() => reset()}
        >
          Try again
        </button>
      </body>
    </html>
  );
}
