import { cache } from 'react';

import { logger } from '@/lib/logger';
import {
  clearSessionCookie,
  getSessionCookieValue,
} from '@/server/auth/session-cookie';
import {
  resolveSessionForToken,
  type SessionUser,
} from '@/server/auth/session-service';

export type AuthResolution =
  | { status: 'authenticated'; user: SessionUser }
  | {
      status: 'unauthenticated';
      reason: 'no_cookie' | 'invalid_session' | 'session_expired';
    }
  | { status: 'backend_unavailable' };

/**
 * Full auth resolution for guards and APIs that must not treat DB blips as logout.
 * Wrapped in `cache()` so layouts and pages share one lookup per request.
 */
export const resolveAuth = cache(async (): Promise<AuthResolution> => {
  const token = await getSessionCookieValue();

  if (!token) {
    logger.info({ auth_event: 'auth_no_cookie' }, 'auth resolution');
    return { status: 'unauthenticated', reason: 'no_cookie' };
  }

  const res = await resolveSessionForToken(token);

  switch (res.outcome) {
    case 'session':
      return { status: 'authenticated', user: res.user };

    case 'not_found': {
      logger.info(
        { auth_event: 'auth_session_not_found' },
        'session id not in database; clearing cookie'
      );
      await clearSessionCookie();
      return { status: 'unauthenticated', reason: 'invalid_session' };
    }

    case 'expired': {
      logger.info(
        { auth_event: 'auth_session_expired' },
        'session expired; clearing cookie'
      );
      await clearSessionCookie();
      return { status: 'unauthenticated', reason: 'session_expired' };
    }

    case 'transient_backend_error': {
      logger.warn(
        { auth_event: 'auth_session_lookup_error' },
        'session lookup unavailable; keeping cookie'
      );
      return { status: 'backend_unavailable' };
    }

    default: {
      const _exhaustive: never = res;
      return _exhaustive;
    }
  }
});

/**
 * Returns the authenticated user, or null when unauthenticated **or** when session
 * backend is temporarily unavailable (same as “no user” for simple UIs).
 * Prefer {@link resolveAuth} when you must distinguish backend failures (APIs, artwork).
 */
export const getCurrentUser = cache(async (): Promise<SessionUser | null> => {
  const r = await resolveAuth();
  if (r.status === 'authenticated') return r.user;
  return null;
});
