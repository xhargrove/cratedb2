'use client';

import { useEffect } from 'react';

import { isSessionBackendUnavailableError } from '@/lib/auth-errors';

export default function AppGroupError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[app/(app)/error]', {
      digest: error.digest,
      name: error.name,
      message: error.message,
    });
  }, [error]);

  if (isSessionBackendUnavailableError(error)) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 px-6 text-center">
        <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
          Could not verify your session
        </h2>
        <p className="max-w-md text-sm text-zinc-600 dark:text-zinc-400">
          We couldn&apos;t reach the server to confirm your login. Your session
          was left intact — try again in a moment.
        </p>
        <button
          type="button"
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
          onClick={() => reset()}
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 px-6 text-center">
      <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
        Something went wrong
      </h2>
      <p className="max-w-md text-sm text-zinc-600 dark:text-zinc-400">
        {error.message ||
          'An unexpected error occurred in this part of the app.'}
      </p>
      <button
        type="button"
        className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
        onClick={() => reset()}
      >
        Try again
      </button>
    </div>
  );
}
