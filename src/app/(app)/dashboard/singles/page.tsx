import type { Metadata } from 'next';
import Link from 'next/link';

import { COLLECTION_LIST_MAX } from '@/lib/collection-constants';
import { requireUser } from '@/server/auth/require-user';
import { listSinglesForOwner } from '@/server/singles/list-for-owner';

import { SinglesGrid } from '@/components/singles/singles-grid';

import type { SingleDisplayRow } from '@/types/single-display';

export const metadata: Metadata = {
  title: 'Singles · Cratedb',
};

const COLLECTION_ERROR_MESSAGES: Record<string, string> = {
  'delete-invalid-id':
    'Could not delete: invalid or missing id. Nothing was removed.',
  'delete-not-found':
    'Could not delete: single was not found or you do not have access.',
  'delete-failed':
    'Could not delete the single due to a server error.',
};

const FALLBACK_ERR =
  'Could not complete that action. Your singles were not changed.';

function firstParam(
  raw: Record<string, string | string[] | undefined>,
  key: string
): string | undefined {
  const v = raw[key];
  if (v === undefined) return undefined;
  return Array.isArray(v) ? v[0] : v;
}

export default async function SinglesPage({
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

  const { singles, total, capped } = await listSinglesForOwner(user.id);

  const displaySingles: SingleDisplayRow[] = singles.map((s) => ({
    id: s.id,
    artist: s.artist,
    title: s.title,
    bSideTitle: s.bSideTitle,
    year: s.year,
    genre: s.genre,
    storageLocation: s.storageLocation,
    artworkKey: s.artworkKey,
    artworkUpdatedAt: s.artworkUpdatedAt,
  }));

  let subtitle = 'No 45s or singles logged yet';
  if (total > 0) {
    subtitle = capped
      ? `Showing first ${displaySingles.length.toLocaleString()} of ${total.toLocaleString()} (max ${COLLECTION_LIST_MAX.toLocaleString()} per page)`
      : `${total.toLocaleString()} in your singles crate`;
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
            Singles (45s)
          </h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            One row per physical single — A-side song as the title; optional
            B-side.
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
        <Link
          href="/dashboard/singles/new"
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          Add single
        </Link>
      </header>

      {total === 0 ? (
        <div className="rounded-lg border border-dashed border-zinc-300 bg-zinc-50 px-6 py-12 text-center dark:border-zinc-700 dark:bg-zinc-900/50">
          <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
            No singles yet
          </p>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            Track individual 45s separately from full albums.
          </p>
          <Link
            href="/dashboard/singles/new"
            className="mt-4 inline-block rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900"
          >
            Add your first single
          </Link>
        </div>
      ) : (
        <SinglesGrid singles={displaySingles} />
      )}
    </div>
  );
}
