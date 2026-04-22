import type { Metadata } from 'next';
import Link from 'next/link';

import { CollectionEmpty } from '@/components/collection/collection-empty';
import { CollectionToolbar } from '@/components/collection/collection-toolbar';
import { RecordGrid } from '@/components/collection/record-grid';
import { RecordList } from '@/components/collection/record-list';
import {
  parseCollectionSearchParams,
  serializeCollectionParams,
} from '@/lib/collection-query-params';
import { requireUser } from '@/server/auth/require-user';
import {
  countRecordsForOwner,
  getCollectionFacets,
  listRecordsForOwner,
  type ListRecordsOptions,
} from '@/server/records/list-for-owner';
import type { RecordDisplayRow } from '@/types/record-display';

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
  }[]
): RecordDisplayRow[] {
  return rows.map((r) => ({
    id: r.id,
    artist: r.artist,
    title: r.title,
    year: r.year,
    genre: r.genre,
    storageLocation: r.storageLocation,
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

  const query: ListRecordsOptions = {
    search: urlState.q || undefined,
    sort: urlState.sort,
    genre: urlState.genre || undefined,
    storageLocation: urlState.storageLocation || undefined,
  };

  const [records, totalOwned, facets] = await Promise.all([
    listRecordsForOwner(user.id, query),
    countRecordsForOwner(user.id),
    getCollectionFacets(user.id),
  ]);

  const displayRecords = toDisplayRows(records);

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
            {totalOwned === 0
              ? 'No records yet'
              : `${records.length} of ${totalOwned} showing`}
          </p>
        </div>
        <Link
          href="/dashboard/records/new"
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          Add record
        </Link>
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
