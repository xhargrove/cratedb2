import type { Metadata } from 'next';
import Link from 'next/link';

import { COLLECTION_LIST_MAX } from '@/lib/collection-constants';
import { requireUser } from '@/server/auth/require-user';
import { listTwelveInchForOwner } from '@/server/twelve-inch-singles/list-for-owner';

import { TwelveInchExportLinks } from '@/components/twelve-inch/twelve-inch-export-links';
import { TwelveInchGrid } from '@/components/twelve-inch/twelve-inch-grid';

import type { TwelveInchDisplayRow } from '@/types/twelve-inch-display';

export const metadata: Metadata = {
  title: '12-inch singles · Cratedb',
};

const COLLECTION_ERROR_MESSAGES: Record<string, string> = {
  'delete-invalid-id':
    'Could not delete: invalid or missing id. Nothing was removed.',
  'delete-not-found':
    'Could not delete: entry was not found or you do not have access.',
  'delete-failed': 'Could not delete due to a server error.',
};

const FALLBACK_ERR =
  'Could not complete that action. Your collection was not changed.';

function firstParam(
  raw: Record<string, string | string[] | undefined>,
  key: string
): string | undefined {
  const v = raw[key];
  if (v === undefined) return undefined;
  return Array.isArray(v) ? v[0] : v;
}

export default async function TwelveInchListPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requireUser();
  const raw = await searchParams;
  const errCode = firstParam(raw, 'collectionError');
  const errorMessage = errCode
    ? (COLLECTION_ERROR_MESSAGES[errCode] ?? FALLBACK_ERR)
    : undefined;

  const { twelveInches, total, capped } = await listTwelveInchForOwner(user.id);

  const displayRows: TwelveInchDisplayRow[] = twelveInches.map((s) => ({
    id: s.id,
    artist: s.artist,
    title: s.title,
    bSideTitle: s.bSideTitle,
    year: s.year,
    genre: s.genre,
    storageLocation: s.storageLocation,
    quantity: s.quantity,
    artworkKey: s.artworkKey,
    artworkUpdatedAt: s.artworkUpdatedAt,
  }));

  let subtitle = 'No 12-inch singles logged yet';
  if (total > 0) {
    subtitle = capped
      ? `Showing first ${displayRows.length.toLocaleString()} of ${total.toLocaleString()} (max ${COLLECTION_LIST_MAX.toLocaleString()} per page)`
      : `${total.toLocaleString()} in your 12-inch crate`;
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
            12-inch singles
          </h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Maxis and extended mixes — separate from 45 RPM singles and full
            albums.
          </p>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            {subtitle}
          </p>
          {errorMessage ? (
            <p
              className="mt-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-900 dark:border-red-900 dark:bg-red-950/60 dark:text-red-100"
              role="alert"
            >
              {errorMessage}
            </p>
          ) : null}
        </div>
        <div className="flex flex-col items-end gap-3 sm:flex-row sm:items-center">
          {total > 0 ? <TwelveInchExportLinks /> : null}
          <Link
            href="/dashboard/twelve-inch/new"
            className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            Add 12-inch
          </Link>
        </div>
      </header>

      {total === 0 ? (
        <div className="rounded-lg border border-dashed border-zinc-300 bg-zinc-50 px-6 py-12 text-center dark:border-zinc-700 dark:bg-zinc-900/50">
          <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
            No 12-inch singles yet
          </p>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            Track maxi-singles and 12&quot; releases alongside your 45s.
          </p>
          <Link
            href="/dashboard/twelve-inch/new"
            className="mt-4 inline-block rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900"
          >
            Add your first 12-inch
          </Link>
        </div>
      ) : (
        <TwelveInchGrid rows={displayRows} />
      )}
    </div>
  );
}
