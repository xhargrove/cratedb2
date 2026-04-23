'use server';

import { redirect } from 'next/navigation';

import {
  enforceLoginRateLimit,
  enforceSignupRateLimit,
} from '@/server/auth/rate-limit';
import { hashPassword, verifyPassword } from '@/server/auth/password';
import {
  clearSessionCookie,
  getSessionCookieValue,
  setSessionCookie,
} from '@/server/auth/session-cookie';
import { createSession, destroySession } from '@/server/auth/session-service';
import { parseDashboardCallbackPath } from '@/lib/safe-callback-path';
import { parseLoginForm, parseSignupForm } from '@/lib/validations/auth';
import { logger } from '@/lib/logger';

export type AuthActionState = { error?: string } | null;

/** Avoid importing `@/generated/prisma/client` here — that loads Prisma's module bootstrap on every auth chunk (including GET /login via LoginForm → loginAction). */
function isPrismaUniqueViolation(e: unknown): boolean {
  return (
    typeof e === 'object' &&
    e !== null &&
    'code' in e &&
    (e as { code?: unknown }).code === 'P2002'
  );
}
const GENERIC_AUTH_FAILURE = 'Unable to authenticate right now. Try again.';

export async function signupAction(
  _prevState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const parsed = parseSignupForm(formData);
  if (!parsed.ok) {
    return { error: parsed.error };
  }

  const signupRate = await enforceSignupRateLimit(parsed.data.email);
  if (!signupRate.allowed) {
    logger.warn(
      { retryAfterSec: signupRate.retryAfterSec },
      'signup rate limit exceeded'
    );
    return { error: GENERIC_AUTH_FAILURE };
  }

  const passwordHash = await hashPassword(parsed.data.password);

  try {
    const { prisma } = await import('@/db/client');
    const user = await prisma.user.create({
      data: {
        email: parsed.data.email,
        passwordHash,
        profile: {
          create: {
            displayName: parsed.data.displayName,
          },
        },
      },
    });

    const sessionId = await createSession(user.id);
    await setSessionCookie(sessionId);
  } catch (e) {
    if (isPrismaUniqueViolation(e)) {
      return { error: GENERIC_AUTH_FAILURE };
    }
    logger.error({ err: e }, 'signup failed');
    return { error: GENERIC_AUTH_FAILURE };
  }

  const afterSignup = parseDashboardCallbackPath(formData.get('callbackUrl'));
  redirect(afterSignup ?? '/dashboard');
}

export async function loginAction(
  _prevState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const parsed = parseLoginForm(formData);
  if (!parsed.ok) {
    return { error: parsed.error };
  }

  const loginRate = await enforceLoginRateLimit(parsed.data.email);
  if (!loginRate.allowed) {
    logger.warn(
      { retryAfterSec: loginRate.retryAfterSec },
      'login rate limit exceeded'
    );
    return { error: GENERIC_AUTH_FAILURE };
  }

  const { prisma } = await import('@/db/client');
  const user = await prisma.user.findUnique({
    where: { email: parsed.data.email },
  });

  const ok =
    user && (await verifyPassword(user.passwordHash, parsed.data.password));

  if (!ok) {
    return { error: GENERIC_AUTH_FAILURE };
  }

  const sessionId = await createSession(user.id);
  await setSessionCookie(sessionId);

  const afterLogin = parseDashboardCallbackPath(formData.get('callbackUrl'));
  redirect(afterLogin ?? '/dashboard');
}

export async function logoutAction(): Promise<void> {
  const token = await getSessionCookieValue();
  if (token) {
    await destroySession(token);
  }
  await clearSessionCookie();
  redirect('/');
}
