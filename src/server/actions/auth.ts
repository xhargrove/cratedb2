'use server';

import { redirect } from 'next/navigation';

import { prisma } from '@/db/client';
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

export async function signupAction(
  _prevState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const parsed = parseSignupForm(formData);
  if (!parsed.ok) {
    return { error: parsed.error };
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
      return { error: 'An account with this email already exists.' };
    }
    logger.error({ err: e }, 'signup failed');
    return { error: 'Something went wrong. Try again.' };
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

  const user = await prisma.user.findUnique({
    where: { email: parsed.data.email },
  });

  const ok =
    user && (await verifyPassword(user.passwordHash, parsed.data.password));

  if (!ok) {
    return { error: 'Invalid email or password.' };
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
