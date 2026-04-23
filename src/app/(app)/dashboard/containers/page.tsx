import type { Metadata } from 'next';
import Link from 'next/link';

import {
  containerKindLabel,
  ContainerKindIcon,
} from '@/components/containers/container-kind-icon';
import { requireUser } from '@/server/auth/require-user';
import { listDistinctPhysicalSlotsForOwner } from '@/server/records/physical-slots';

export const metadata: Metadata = {
  title: 'My containers · Cratedb',
};

export default async function ContainersPage() {
  const user = await requireUser();
  const rows = await listDistinctPhysicalSlotsForOwner(user.id);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
            My containers
          </h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Spots where releases live — derived from shelf, crate, and box
            assignments on albums, 45s, and 12-inch singles. Open one for the
            list and a QR label.
          </p>
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-lg border border-dashed border-zinc-300 bg-zinc-50 p-10 text-center dark:border-zinc-700 dark:bg-zinc-900/50">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            No physical slots yet. Edit an album, 45, or 12-inch single and
            choose a shelf, crate, or box under storage — a card will show up
            here automatically.
          </p>
          <Link
            href="/dashboard/records"
            className="mt-4 inline-block text-sm font-medium text-amber-800 underline dark:text-amber-300"
          >
            Go to records
          </Link>
        </div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {rows.map((r) => {
            const kindLabel = containerKindLabel(r.slot.storageKind);
            return (
              <li key={r.slotKey}>
                <Link
                  href={`/dashboard/containers/${r.slotKey}`}
                  className="flex h-full flex-col gap-3 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm transition hover:border-amber-300/80 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-amber-700/50"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-zinc-100 dark:bg-zinc-800">
                      <ContainerKindIcon
                        kind={r.slot.storageKind}
                        label={kindLabel}
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-zinc-900 dark:text-zinc-100">
                        {r.label}
                      </p>
                      <p className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                        {kindLabel}
                      </p>
                    </div>
                  </div>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    <span className="tabular-nums font-medium text-zinc-800 dark:text-zinc-200">
                      {r.itemCount}
                    </span>{' '}
                    {r.itemCount === 1 ? 'release' : 'releases'}
                  </p>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
