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
      <nav
        className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
        aria-label="Quick actions"
      >
        <Link
          href="/dashboard/records"
          className="group rounded-2xl border border-border bg-surface p-5 shadow-sm ring-1 ring-accent/10 transition hover:border-accent/35 hover:ring-accent/25"
        >
          <span className="block text-base font-semibold text-foreground">
            Records
          </span>
          <span className="mt-1 block text-sm text-muted">
            Browse and edit your LPs and albums.
          </span>
        </Link>
        <Link
          href="/dashboard/singles"
          className="group rounded-2xl border border-border bg-surface p-5 shadow-sm ring-1 ring-accent/10 transition hover:border-accent/35 hover:ring-accent/25"
        >
          <span className="block text-base font-semibold text-foreground">
            Singles (45s)
          </span>
          <span className="mt-1 block text-sm text-muted">
            Track 7-inch singles and B-sides.
          </span>
        </Link>
        <Link
          href="/dashboard/records/new"
          className="group rounded-2xl border border-border bg-surface p-5 shadow-sm ring-1 ring-accent/10 transition hover:border-accent/35 hover:ring-accent/25"
        >
          <span className="block text-base font-semibold text-foreground">
            Add record
          </span>
          <span className="mt-1 block text-sm text-muted">
            Log a new release to your shelf.
          </span>
        </Link>
        <Link
          href="/dashboard/stats"
          className="group rounded-2xl border border-border bg-surface p-5 shadow-sm ring-1 ring-accent/10 transition hover:border-accent/35 hover:ring-accent/25"
        >
          <span className="block text-base font-semibold text-foreground">
            Insights
          </span>
          <span className="mt-1 block text-sm text-muted">
            Stats and breakdowns for your crate.
          </span>
        </Link>
        <Link
          href="/dashboard/wantlist"
          className="group rounded-2xl border border-border bg-surface p-5 shadow-sm ring-1 ring-accent/10 transition hover:border-accent/35 hover:ring-accent/25"
        >
          <span className="block text-base font-semibold text-foreground">
            Wantlist
          </span>
          <span className="mt-1 block text-sm text-muted">
            Hunt list for your next digs.
          </span>
        </Link>
        <Link
          href="/dashboard/wantlist/new"
          className="group rounded-2xl border border-border bg-surface p-5 shadow-sm ring-1 ring-accent/10 transition hover:border-accent/35 hover:ring-accent/25"
        >
          <span className="block text-base font-semibold text-foreground">
            Add wantlist entry
          </span>
          <span className="mt-1 block text-sm text-muted">
            Note a title you are looking for.
          </span>
        </Link>
        <Link
          href="/dashboard/profile"
          className="group rounded-2xl border border-border bg-surface p-5 shadow-sm ring-1 ring-accent/10 transition hover:border-accent/35 hover:ring-accent/25"
        >
          <span className="block text-base font-semibold text-foreground">
            Profile
          </span>
          <span className="mt-1 block text-sm text-muted">
            Display name, vibe, and public shelf.
          </span>
        </Link>
        <Link
          href={`/u/${user.id}`}
          className="group rounded-2xl border border-dashed border-border bg-surface-2/80 p-5 shadow-sm ring-1 ring-accent/10 transition hover:border-accent/40 sm:col-span-2 lg:col-span-1"
        >
          <span className="block text-base font-semibold text-foreground">
            Public profile
          </span>
          <span className="mt-1 block text-sm text-muted">
            See what others see at your /u link.
          </span>
        </Link>
      </nav>
    </div>
  );
}
