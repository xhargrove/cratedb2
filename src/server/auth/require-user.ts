import { redirect } from 'next/navigation';

import { getCurrentUser } from '@/server/auth/get-current-user';

/** Server-only guard: redirects anonymous users to login. */
export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/login');
  }
  return user;
}
