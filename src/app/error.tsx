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
    console.error('[app/error]', {
      digest: error.digest,
      name: error.name,
      message: error.message,
    });
  }, [error]);

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 px-6 text-center">
      <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">
        Something went wrong
      </h2>
      <p className="max-w-md text-sm text-neutral-600 dark:text-neutral-400">
        {error.message ||
          'An unexpected error occurred in this part of the app.'}
      </p>
      <button
        type="button"
        className="rounded-md bg-neutral-900 px-4 py-2 text-sm text-white hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200"
        onClick={() => reset()}
      >
        Try again
      </button>
    </div>
  );
}
