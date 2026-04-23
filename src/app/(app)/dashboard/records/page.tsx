import type { Metadata } from 'next';
import Link from 'next/link';

import { CollectionEmpty } from '@/components/collection/collection-empty';
import { RecordsExportLinks } from '@/components/collection/records-export-links';
import { CollectionToolbar } from '@/components/collection/collection-toolbar';
import { RecordGrid } from '@/components/collection/record-grid';
import { RecordList } from '@/components/collection/record-list';
import {
  parseCollectionSearchParams,
  serializeCollectionParams,
} from '@/lib/collection-query-params';
import { COLLECTION_LIST_MAX } from '@/lib/collection-constants';
import { requireUser } from '@/server/auth/require-user';
import {
  countRecordsForOwner,
  getCollectionFacets,
  listRecordsWithMetaForOwner,
  type ListRecordsOptions,
} from '@/server/records/list-for-owner';
import type { RecordDisplayRow } from '@/types/record-display';

const COLLECTION_ERROR_MESSAGES: Record<string, string> = {
  'delete-invalid-id':
    'Could not delete: invalid or missing record id. Nothing was removed.',
  'delete-not-found':
    'Could not delete: record was not found or you do not have access.',
  'delete-failed': 'Could not delete the record due to a server error.',
};

const COLLECTION_ERROR_FALLBACK =
  'Could not complete that action. Your collection was not changed.';

function firstParam(
  raw: Record<string, string | string[] | undefined>,
  key: string
): string | undefined {
  const v = raw[key];
  if (v === undefined) return undefined;
  return Array.isArray(v) ? v[0] : v;
}

function collectionHeaderSubtitle(args: {
  totalOwned: number;
  recordsLen: number;
  matchCount: number;
  capped: boolean;
  refined: boolean;
}): string {
  const { totalOwned, recordsLen, matchCount, capped, refined } = args;

  if (totalOwned === 0) return 'No records yet';

  if (matchCount === 0) return 'No matches for current filters';

  if (capped) {
    return refined
      ? `Showing first ${recordsLen.toLocaleString()} of ${matchCount.toLocaleString()} matches (max ${COLLECTION_LIST_MAX.toLocaleString()} per page)`
      : `Showing first ${recordsLen.toLocaleString()} of ${totalOwned.toLocaleString()} records (max ${COLLECTION_LIST_MAX.toLocaleString()} per page)`;
  }

  if (refined) {
    return `${recordsLen.toLocaleString()} of ${matchCount.toLocaleString()} matching`;
  }

  return `${recordsLen.toLocaleString()} of ${totalOwned.toLocaleString()} showing`;
}

export const metadata: Metadata = {
  title: 'Records · Cratedb',
};

function toDisplayRows(
  rows: {
    id: string;
    artist: string;
    title: string;
    year: number | null;
    genre: string | null;
    storageLocation: string | null;
    quantity: number;
    artworkKey: string | null;
    artworkUpdatedAt: Date | null;
  }[]
): RecordDisplayRow[] {
  return rows.map((r) => ({
    id: r.id,
    artist: r.artist,
    title: r.title,
    year: r.year,
    genre: r.genre,
    storageLocation: r.storageLocation,
    quantity: r.quantity,
    artworkKey: r.artworkKey,
    artworkUpdatedAt: r.artworkUpdatedAt,
  }));
}

export default async function RecordsListPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requireUser();
  const raw = await searchParams;
  const urlState = parseCollectionSearchParams(raw);
  const collectionErrorCode = firstParam(raw, 'collectionError');
  const collectionErrorMessage = collectionErrorCode
    ? (COLLECTION_ERROR_MESSAGES[collectionErrorCode] ??
      COLLECTION_ERROR_FALLBACK)
    : undefined;

  const query: ListRecordsOptions = {
    search: urlState.q || undefined,
    sort: urlState.sort,
    genre: urlState.genre || undefined,
    storageLocation: urlState.storageLocation || undefined,
  };

  const refined =
    Boolean(urlState.q) ||
    Boolean(urlState.genre) ||
    Boolean(urlState.storageLocation);

  const [{ records, meta }, totalOwned, facets] = await Promise.all([
    listRecordsWithMetaForOwner(user.id, query),
    countRecordsForOwner(user.id),
    getCollectionFacets(user.id),
  ]);

  const displayRecords = toDisplayRows(records);

  const subtitle = collectionHeaderSubtitle({
    totalOwned,
    recordsLen: records.length,
    matchCount: meta.matchCount,
    capped: meta.capped,
    refined,
  });

  /** Reset search/sort/filters while keeping current view (grid vs list). */
  const clearFiltersHref = `/dashboard/records${serializeCollectionParams({
    q: '',
    sort: 'newest',
    view: urlState.view,
    genre: '',
    storageLocation: '',
  })}`;

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
            Collection
          </h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            {subtitle}
          </p>
          {collectionErrorMessage ? (
            <p
              className="mt-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-900 dark:border-red-900 dark:bg-red-950/60 dark:text-red-100"
              role="alert"
            >
              {collectionErrorMessage}
            </p>
          ) : null}
        </div>
        <div className="flex flex-col items-end gap-3 sm:flex-row sm:items-center">
          {totalOwned > 0 ? <RecordsExportLinks /> : null}
          <Link
            href="/dashboard/records/new"
            className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            Add record
          </Link>
        </div>
      </header>

      {totalOwned > 0 ? (
        <CollectionToolbar state={urlState} facets={facets} />
      ) : null}

      {totalOwned === 0 ? (
        <CollectionEmpty variant="no-records" />
      ) : records.length === 0 ? (
        <CollectionEmpty variant="no-results" clearHref={clearFiltersHref} />
      ) : urlState.view === 'list' ? (
        <RecordList records={displayRecords} />
      ) : (
        <RecordGrid records={displayRecords} />
      )}
    </div>
  );
}
