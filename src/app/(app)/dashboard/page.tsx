import type { Metadata } from 'next';
import Link from 'next/link';

import { requireUser } from '@/server/auth/require-user';

export const metadata: Metadata = {
  title: 'Dashboard · Cratedb',
};

export default async function DashboardPage() {
  await requireUser();

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
      </nav>
    </div>
  );
}
