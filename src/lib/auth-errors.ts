/**
 * Thrown when session validation cannot reach the database after retries.
 * Must not be treated as “logged out”; cookie stays intact.
 * Handled by `(app)/error.tsx` — session work must run under that segment’s tree
 * (e.g. `AppDashboardShell`), not in `(app)/layout.tsx`, or Next falls back to root `error.tsx`.
 */
export class SessionBackendUnavailableError extends Error {
  readonly code = 'SESSION_BACKEND_UNAVAILABLE' as const;

  constructor(
    message = 'Could not verify your session right now. Please try again.'
  ) {
    super(message);
    this.name = 'SessionBackendUnavailableError';
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export function isSessionBackendUnavailableError(
  e: unknown
): e is SessionBackendUnavailableError {
  return (
    e instanceof SessionBackendUnavailableError ||
    (typeof e === 'object' &&
      e !== null &&
      'code' in e &&
      (e as { code?: string }).code === 'SESSION_BACKEND_UNAVAILABLE')
  );
}
