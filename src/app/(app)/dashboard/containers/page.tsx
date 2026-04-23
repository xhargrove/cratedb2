import type { Metadata } from 'next';
import Link from 'next/link';

import { containerImageUrl } from '@/lib/container-image-url';
import {
  containerKindLabel,
  ContainerKindIcon,
} from '@/components/containers/container-kind-icon';
import { requireUser } from '@/server/auth/require-user';
import { listStorageContainersForOwner } from '@/server/containers/list-for-owner';

export const metadata: Metadata = {
  title: 'My containers · Cratedb',
};

export default async function ContainersPage() {
  const user = await requireUser();
  const rows = await listStorageContainersForOwner(user.id);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
            My containers
          </h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Shelves, boxes, and crates — link albums and scan a QR to open the live
            view.
          </p>
        </div>
        <Link
          href="/dashboard/containers/new"
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          New container
        </Link>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-lg border border-dashed border-zinc-300 bg-zinc-50 p-10 text-center dark:border-zinc-700 dark:bg-zinc-900/50">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            You have not created any containers yet. Add one to group records and
            print a QR label for the shelf or crate.
          </p>
          <Link
            href="/dashboard/containers/new"
            className="mt-4 inline-block text-sm font-medium text-amber-800 underline dark:text-amber-300"
          >
            Create your first container
          </Link>
        </div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {rows.map((c) => {
            const img = containerImageUrl(
              c.id,
              Boolean(c.imageKey),
              c.imageUpdatedAt
            );
            const kindLabel = containerKindLabel(c.kind);
            const count = c._count.records;
            return (
              <li key={c.id}>
                <Link
                  href={`/dashboard/containers/${c.id}`}
                  className="flex h-full flex-col gap-3 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm transition hover:border-amber-300/80 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-amber-700/50"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-zinc-100 dark:bg-zinc-800">
                      {img ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={img}
                          alt=""
                          className="h-full w-full object-cover"
                          width={56}
                          height={56}
                        />
                      ) : (
                        <ContainerKindIcon kind={c.kind} label={kindLabel} />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-zinc-900 dark:text-zinc-100">
                        {c.name}
                      </p>
                      <p className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                        {kindLabel}
                      </p>
                    </div>
                  </div>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    <span className="tabular-nums font-medium text-zinc-800 dark:text-zinc-200">
                      {count}
                    </span>{' '}
                    {count === 1 ? 'record' : 'records'}
                  </p>
                  {c.locationNote?.trim() ? (
                    <p className="line-clamp-2 text-xs text-zinc-500 dark:text-zinc-500">
                      {c.locationNote.trim()}
                    </p>
                  ) : null}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
