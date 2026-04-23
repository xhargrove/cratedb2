import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

import { parseDashboardCallbackPath } from '@/lib/safe-callback-path';
import { getCurrentUser } from '@/server/auth/get-current-user';

/** Server-only guard: redirects anonymous users to login. */
export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) {
    const h = await headers();
    const returnPath = parseDashboardCallbackPath(
      h.get('x-crate-dashboard-path')
    );
    if (returnPath) {
      redirect(`/login?callbackUrl=${encodeURIComponent(returnPath)}`);
    }
    redirect('/login');
  }
  return user;
}
