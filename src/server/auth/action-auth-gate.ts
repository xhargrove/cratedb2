import { resolveAuth } from '@/server/auth/get-current-user';
import type { SessionUser } from '@/server/auth/session-service';

export type ActionAuthResult =
  | { ok: true; user: SessionUser }
  | { ok: false; error: string };

/**
 * For server actions used with `useActionState`: never throw session/backend errors —
 * return a message so the client recovers and can submit again.
 */
export async function requireUserForServerAction(): Promise<ActionAuthResult> {
  const auth = await resolveAuth();
  if (auth.status === 'backend_unavailable') {
    return {
      ok: false,
      error:
        'Could not verify your session right now. Please try again in a moment.',
    };
  }
  if (auth.status !== 'authenticated') {
    return { ok: false, error: 'You must be signed in to continue.' };
  }
  return { ok: true, user: auth.user };
}
