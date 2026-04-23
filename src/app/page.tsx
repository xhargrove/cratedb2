import Link from 'next/link';

import { getCurrentUser } from '@/server/auth/get-current-user';

export default async function Home() {
  const user = await getCurrentUser();

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-background text-foreground">
      <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden>
        <div className="absolute -left-32 top-1/4 h-[28rem] w-[28rem] rounded-full bg-amber-500/15 blur-3xl dark:bg-amber-500/10" />
        <div className="absolute -right-20 bottom-0 h-80 w-80 rounded-full bg-zinc-400/20 blur-3xl dark:bg-zinc-600/15" />
        <div className="absolute left-1/2 top-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full border border-zinc-200/60 dark:border-zinc-700/50" />
        <div className="absolute left-1/2 top-1/2 h-48 w-48 -translate-x-1/2 -translate-y-1/2 rounded-full border border-zinc-200/40 dark:border-zinc-700/40" />
        <div className="absolute left-1/2 top-1/2 h-8 w-8 -translate-x-1/2 -translate-y-1/2 rounded-full bg-zinc-300/30 dark:bg-zinc-600/30" />
      </div>

      <header className="mx-auto flex w-full max-w-3xl items-center justify-between px-6 py-6">
        <span className="text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
          Cratedb
        </span>
        {user ? (
          <Link
            href="/dashboard"
            className="text-sm font-medium text-amber-800 underline decoration-amber-500/40 underline-offset-4 hover:decoration-amber-500 dark:text-amber-200"
          >
            Dashboard
          </Link>
        ) : null}
      </header>

      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center px-6 pb-20 pt-4 text-center sm:pt-8">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-800/90 dark:text-amber-300/90">
          Your collection, on the record
        </p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">
          Track vinyl.
          <span className="block text-zinc-600 dark:text-zinc-400">
            Share the crate.
          </span>
        </h1>
        <p className="mt-6 max-w-lg text-pretty text-base leading-relaxed text-muted">
          Log albums and 45s, tune a public profile, and keep your shelf
          organized — one account, server-side ownership, no spreadsheets.
        </p>

        <nav className="mt-10 flex flex-wrap items-center justify-center gap-3">
          {user ? (
            <Link
              href="/dashboard"
              className="rounded-full bg-accent px-8 py-3 text-sm font-semibold text-accent-foreground shadow-lg shadow-amber-900/10 ring-2 ring-accent/25 transition hover:brightness-105 dark:shadow-black/40"
            >
              Open dashboard
            </Link>
          ) : (
            <>
              <Link
                href="/signup"
                className="rounded-full bg-accent px-8 py-3 text-sm font-semibold text-accent-foreground shadow-lg shadow-amber-900/10 ring-2 ring-accent/25 transition hover:brightness-105 dark:shadow-black/40"
              >
                Sign up free
              </Link>
              <Link
                href="/login"
                className="rounded-full border border-border bg-surface px-6 py-3 text-sm font-semibold text-foreground shadow-sm backdrop-blur transition hover:bg-surface-2"
              >
                Log in
              </Link>
            </>
          )}
        </nav>
      </main>

      <footer className="border-t border-border/80 bg-surface/80 px-6 py-6 text-center text-xs text-muted backdrop-blur dark:bg-surface/60">
        Built for collectors — stack your shelves, not your tabs.
      </footer>
    </div>
  );
}
