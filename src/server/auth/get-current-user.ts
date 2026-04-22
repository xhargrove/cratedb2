import { cache } from 'react';

import { getUserForSessionToken } from '@/server/auth/session-service';
import {
  clearSessionCookie,
  getSessionCookieValue,
} from '@/server/auth/session-cookie';

/**
 * Returns the authenticated user for the current request, or null.
 * Clears the session cookie if it does not match a valid session (tampered/expired).
 * Wrapped in `cache()` so layouts and pages share one lookup per request.
 */
export const getCurrentUser = cache(async () => {
  const token = await getSessionCookieValue();
  const user = await getUserForSessionToken(token);

  if (token && !user) {
    await clearSessionCookie();
  }

  return user;
});
