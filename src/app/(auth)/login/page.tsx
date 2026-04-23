import type { Metadata } from 'next';
import Link from 'next/link';

import { LoginForm } from '@/components/auth/login-form';
import { parseDashboardCallbackPath } from '@/lib/safe-callback-path';

export const metadata: Metadata = {
  title: 'Log in · Cratedb',
};

function firstParam(
  raw: Record<string, string | string[] | undefined> | null | undefined,
  key: string
): string | undefined {
  if (raw == null) return undefined;
  const v = raw[key];
  if (v === undefined) return undefined;
  return Array.isArray(v) ? v[0] : v;
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  let callbackUrl: string | undefined;
  try {
    const sp = await searchParams;
    callbackUrl =
      parseDashboardCallbackPath(firstParam(sp, 'callbackUrl')) ?? undefined;
  } catch {
    callbackUrl = undefined;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="text-center">
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
          Log in
        </h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Access your collection
        </p>
      </div>
      <LoginForm callbackUrl={callbackUrl} />
      <p className="text-center text-sm text-zinc-500">
        <Link href="/" className="underline underline-offset-4">
          ← Home
        </Link>
      </p>
    </div>
  );
}
