'use server';

import { redirect } from 'next/navigation';

import { prisma } from '@/db/client';
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
import { parseLoginForm, parseSignupForm } from '@/lib/validations/auth';
import { logger } from '@/lib/logger';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/client';

export type AuthActionState = { error?: string } | null;
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
    if (e instanceof PrismaClientKnownRequestError && e.code === 'P2002') {
      return { error: GENERIC_AUTH_FAILURE };
    }
    logger.error({ err: e }, 'signup failed');
    return { error: GENERIC_AUTH_FAILURE };
  }

  redirect('/dashboard');
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

  redirect('/dashboard');
}

export async function logoutAction(): Promise<void> {
  const token = await getSessionCookieValue();
  if (token) {
    await destroySession(token);
  }
  await clearSessionCookie();
  redirect('/');
}
