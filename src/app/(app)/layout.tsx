import Link from 'next/link';

import { DashboardNav } from '@/components/nav/dashboard-nav';
import { requireUser } from '@/server/auth/require-user';
import { logoutAction } from '@/server/actions/auth';

export default async function AppGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();

  return (
    <div className="relative min-h-screen bg-background">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-72 bg-gradient-to-b from-amber-500/8 via-transparent to-transparent dark:from-amber-500/5"
        aria-hidden
      />
      <header className="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-4 border-b border-border bg-surface/85 px-4 py-4 shadow-sm backdrop-blur-md dark:bg-surface/90 sm:px-6">
        <div className="flex min-w-0 flex-1 flex-wrap items-baseline gap-x-3 gap-y-1">
          <Link
            href="/dashboard"
            className="shrink-0 font-semibold tracking-tight text-foreground"
          >
            Cratedb
          </Link>
          <span className="truncate text-sm font-medium text-foreground">
            {user.profile?.displayName?.trim() || user.email.split('@')[0]}
          </span>
          <span className="hidden truncate text-xs text-muted sm:inline">
            {user.email}
          </span>
        </div>
        <form action={logoutAction}>
          <button
            type="submit"
            className="rounded-full border border-border bg-surface-2 px-4 py-2 text-sm font-medium text-foreground transition hover:bg-border/40 dark:hover:bg-zinc-800"
          >
            Log out
          </button>
        </form>
      </header>
      <div className="border-b border-border bg-surface/60 backdrop-blur-sm dark:bg-surface/70">
        <div className="mx-auto max-w-5xl px-3 py-3 sm:px-4">
          <DashboardNav />
        </div>
      </div>
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">{children}</div>
    </div>
  );
}
