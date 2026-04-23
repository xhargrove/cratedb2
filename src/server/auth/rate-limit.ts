import { headers } from 'next/headers';

type Bucket = {
  count: number;
  resetAt: number;
};

type RateLimitResult = {
  allowed: boolean;
  retryAfterSec?: number;
};

const WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const MAX_LOGIN_ATTEMPTS = 10;
const MAX_SIGNUP_ATTEMPTS = 5;

const buckets = new Map<string, Bucket>();

function nowMs() {
  return Date.now();
}

function cleanupExpired(now: number) {
  for (const [key, value] of buckets.entries()) {
    if (value.resetAt <= now) {
      buckets.delete(key);
    }
  }
}

function applyWindowedLimit(key: string, maxAttempts: number): RateLimitResult {
  const now = nowMs();
  cleanupExpired(now);

  const existing = buckets.get(key);
  if (!existing || existing.resetAt <= now) {
    buckets.set(key, {
      count: 1,
      resetAt: now + WINDOW_MS,
    });
    return { allowed: true };
  }

  if (existing.count >= maxAttempts) {
    return {
      allowed: false,
      retryAfterSec: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
    };
  }

  existing.count += 1;
  buckets.set(key, existing);
  return { allowed: true };
}

function normalizeIdentity(value: string) {
  return value.trim().toLowerCase();
}

async function getRequestFingerprint(): Promise<string> {
  const h = await headers();
  const forwardedFor = h.get('x-forwarded-for');
  const ip = forwardedFor?.split(',')[0]?.trim() || 'unknown-ip';
  const userAgent = h.get('user-agent')?.trim() || 'unknown-ua';
  return `${ip}|${userAgent}`;
}

export async function enforceLoginRateLimit(email: string): Promise<RateLimitResult> {
  const fingerprint = await getRequestFingerprint();
  return applyWindowedLimit(
    `login|${fingerprint}|${normalizeIdentity(email)}`,
    MAX_LOGIN_ATTEMPTS
  );
}

export async function enforceSignupRateLimit(email: string): Promise<RateLimitResult> {
  const fingerprint = await getRequestFingerprint();
  return applyWindowedLimit(
    `signup|${fingerprint}|${normalizeIdentity(email)}`,
    MAX_SIGNUP_ATTEMPTS
  );
}

