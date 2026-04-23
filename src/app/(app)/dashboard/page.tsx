import type { Metadata } from 'next';
import Link from 'next/link';

import { requireUser } from '@/server/auth/require-user';

export const metadata: Metadata = {
  title: 'Dashboard · Cratedb',
};

const DASHBOARD_FOLLOW_ERRORS: Record<string, string> = {
  'invalid-target': 'Invalid follow request.',
  'user-not-found': 'That user could not be found.',
};

function firstParam(
  raw: Record<string, string | string[] | undefined>,
  key: string
): string | undefined {
  const v = raw[key];
  if (v === undefined) return undefined;
  return Array.isArray(v) ? v[0] : v;
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requireUser();
  const raw = await searchParams;
  const followErr = firstParam(raw, 'followError');
  const followMsg =
    followErr !== undefined && followErr !== ''
      ? (DASHBOARD_FOLLOW_ERRORS[followErr] ??
        'Something went wrong while updating follow state.')
      : undefined;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
          Dashboard
        </h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Manage your vinyl collection — all record access is scoped to your
          account on the server.
        </p>
        {followMsg ? (
          <p
            className="mt-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-900 dark:border-red-900 dark:bg-red-950/60 dark:text-red-100"
            role="alert"
          >
            {followMsg}
          </p>
        ) : null}
      </div>
      <nav className="flex flex-wrap gap-3">
        <Link
          href="/dashboard/records"
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          View records
        </Link>
        <Link
          href="/dashboard/records/new"
          className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium hover:bg-zinc-100 dark:border-zinc-600 dark:hover:bg-zinc-800"
        >
          Add record
        </Link>
        <Link
          href="/dashboard/stats"
          className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium hover:bg-zinc-100 dark:border-zinc-600 dark:hover:bg-zinc-800"
        >
          Insights
        </Link>
        <Link
          href="/dashboard/wantlist"
          className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium hover:bg-zinc-100 dark:border-zinc-600 dark:hover:bg-zinc-800"
        >
          Wantlist
        </Link>
        <Link
          href="/dashboard/wantlist/new"
          className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium hover:bg-zinc-100 dark:border-zinc-600 dark:hover:bg-zinc-800"
        >
          Add wantlist entry
        </Link>
        <Link
          href={`/u/${user.id}`}
          className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium hover:bg-zinc-100 dark:border-zinc-600 dark:hover:bg-zinc-800"
        >
          Your public profile
        </Link>
      </nav>
    </div>
  );
}
