import type { Metadata } from 'next';
import Link from 'next/link';

import { requireUser } from '@/server/auth/require-user';
import { listWantlistItemsForOwner } from '@/server/wantlist/list-for-owner';

import { DeleteWantlistForm } from '@/components/wantlist/delete-wantlist-form';

export const metadata: Metadata = {
  title: 'Wantlist · Cratedb',
};

const WANTLIST_ERROR_MESSAGES: Record<string, string> = {
  'invalid-id': 'Could not remove that entry — invalid id.',
  'not-found': 'That wantlist entry was not found.',
  failed: 'Could not remove the entry due to a server error.',
};

const WANTLIST_ERROR_FALLBACK =
  'Something went wrong while updating your wantlist. Try again from the wantlist page.';

function firstParam(
  raw: Record<string, string | string[] | undefined>,
  key: string
): string | undefined {
  const v = raw[key];
  if (v === undefined) return undefined;
  return Array.isArray(v) ? v[0] : v;
}

export default async function WantlistPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requireUser();
  const raw = await searchParams;
  const errCode = firstParam(raw, 'wantlistError');
  const errMsg =
    errCode !== undefined && errCode !== ''
      ? (WANTLIST_ERROR_MESSAGES[errCode] ?? WANTLIST_ERROR_FALLBACK)
      : undefined;

  const items = await listWantlistItemsForOwner(user.id);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
            Wantlist
          </h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Releases you are looking for — separate from records you already
            own.
          </p>
          {errMsg ? (
            <p
              className="mt-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-900 dark:border-red-900 dark:bg-red-950/60 dark:text-red-100"
              role="alert"
            >
              {errMsg}
            </p>
          ) : null}
        </div>
        <Link
          href="/dashboard/wantlist/new"
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          Add entry
        </Link>
      </div>

      {items.length === 0 ? (
        <div className="rounded-lg border border-dashed border-zinc-300 bg-zinc-50 px-6 py-12 text-center dark:border-zinc-700 dark:bg-zinc-900/50">
          <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
            Your wantlist is empty
          </p>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            Add albums you do not own yet. Duplicates and items already in your
            collection are blocked automatically.
          </p>
          <Link
            href="/dashboard/wantlist/new"
            className="mt-4 inline-block rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900"
          >
            Add first entry
          </Link>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-zinc-200 bg-zinc-50 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400">
              <tr>
                <th className="px-4 py-3">Artist</th>
                <th className="px-4 py-3">Title</th>
                <th className="hidden px-4 py-3 sm:table-cell">Year</th>
                <th className="hidden px-4 py-3 lg:table-cell">Genre</th>
                <th className="hidden px-4 py-3 xl:table-cell">Notes</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {items.map((item) => (
                <tr
                  key={item.id}
                  className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                >
                  <td className="max-w-[140px] truncate px-4 py-3 font-medium text-zinc-900 dark:text-zinc-100">
                    {item.artist}
                  </td>
                  <td className="max-w-[180px] truncate px-4 py-3 text-zinc-700 dark:text-zinc-300">
                    {item.title}
                  </td>
                  <td className="hidden px-4 py-3 text-zinc-600 dark:text-zinc-400 sm:table-cell">
                    {item.year ?? '—'}
                  </td>
                  <td className="hidden max-w-[120px] truncate px-4 py-3 text-zinc-600 dark:text-zinc-400 lg:table-cell">
                    {item.genre ?? '—'}
                  </td>
                  <td className="hidden max-w-[200px] truncate px-4 py-3 text-zinc-600 dark:text-zinc-400 xl:table-cell">
                    {item.notes ?? '—'}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right">
                    <Link
                      href={`/dashboard/wantlist/${item.id}/edit`}
                      className="mr-3 text-xs font-medium text-zinc-700 underline dark:text-zinc-300"
                    >
                      Edit
                    </Link>
                    <DeleteWantlistForm itemId={item.id} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
