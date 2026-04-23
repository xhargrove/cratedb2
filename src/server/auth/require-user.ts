import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

import { SessionBackendUnavailableError } from '@/lib/auth-errors';
import { parseDashboardCallbackPath } from '@/lib/safe-callback-path';
import { logger } from '@/lib/logger';
import { resolveAuth } from '@/server/auth/get-current-user';
import type { SessionUser } from '@/server/auth/session-service';

/** Server-only guard: redirects anonymous users to login; transient DB failure throws instead of logging out. */
export async function requireUser(): Promise<SessionUser> {
  const auth = await resolveAuth();

  if (auth.status === 'authenticated') {
    return auth.user;
  }

  if (auth.status === 'backend_unavailable') {
    logger.warn(
      { auth_event: 'auth_require_user_blocked_backend' },
      'requireUser blocked: session backend unavailable'
    );
    throw new SessionBackendUnavailableError();
  }

  const h = await headers();
  const returnPath = parseDashboardCallbackPath(
    h.get('x-crate-dashboard-path')
  );

  logger.info(
    {
      auth_event: 'auth_require_user_redirect',
      reason: auth.reason,
    },
    'redirecting anonymous user to login'
  );

  if (returnPath) {
    redirect(`/login?callbackUrl=${encodeURIComponent(returnPath)}`);
  }
  redirect('/login');
}
