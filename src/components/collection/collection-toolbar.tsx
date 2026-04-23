import Link from 'next/link';

import { MAX_SEARCH_Q_LENGTH } from '@/lib/collection-constants';
import {
  serializeCollectionParams,
  type CollectionUrlState,
} from '@/lib/collection-query-params';
import type { CollectionFacets } from '@/server/records/list-for-owner';

export function CollectionToolbar({
  state,
  facets,
}: {
  state: CollectionUrlState;
  facets: CollectionFacets;
}) {
  const base = '/dashboard/records';
  const gridHref = `${base}${serializeCollectionParams({ ...state, view: 'grid' })}`;
  const listHref = `${base}${serializeCollectionParams({ ...state, view: 'list' })}`;

  const hasNonDefaults =
    Boolean(state.q) ||
    Boolean(state.genre) ||
    Boolean(state.storageLocation) ||
    state.sort !== 'newest';

  const clearHref = `${base}${serializeCollectionParams({
    q: '',
    sort: 'newest',
    view: state.view,
    genre: '',
    storageLocation: '',
  })}`;

  return (
    <div className="flex flex-col gap-4 rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <form method="GET" action={base} className="flex flex-col gap-4">
        <input type="hidden" name="view" value={state.view} />

        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-end">
          <label className="flex min-w-[200px] flex-1 flex-col gap-1 text-xs font-medium text-zinc-600 dark:text-zinc-400">
            Search
            <input
              type="search"
              name="q"
              defaultValue={state.q}
              maxLength={MAX_SEARCH_Q_LENGTH}
              placeholder="Artist, title, genre, storage, notes…"
              className="rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-900 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-100"
            />
          </label>

          <label className="flex flex-col gap-1 text-xs font-medium text-zinc-600 dark:text-zinc-400">
            Sort
            <select
              name="sort"
              defaultValue={state.sort}
              className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-100"
            >
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
              <option value="artist-asc">Artist A–Z</option>
              <option value="artist-desc">Artist Z–A</option>
              <option value="title-asc">Title A–Z</option>
              <option value="title-desc">Title Z–A</option>
            </select>
          </label>

          <label className="flex flex-col gap-1 text-xs font-medium text-zinc-600 dark:text-zinc-400">
            Genre
            <select
              name="genre"
              defaultValue={state.genre}
              className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-100"
            >
              <option value="">All genres</option>
              {facets.genres.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1 text-xs font-medium text-zinc-600 dark:text-zinc-400">
            Storage
            <select
              name="location"
              defaultValue={state.storageLocation}
              className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-100"
            >
              <option value="">All locations</option>
              {facets.locations.map((loc) => (
                <option key={loc} value={loc}>
                  {loc}
                </option>
              ))}
            </select>
          </label>

          <button
            type="submit"
            className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            Apply
          </button>
        </div>
      </form>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-zinc-100 pt-4 dark:border-zinc-800">
        <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
          View
        </span>
        <div className="flex gap-2">
          <Link
            href={gridHref}
            className={`rounded-md px-3 py-1.5 text-sm font-medium ${
              state.view === 'grid'
                ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                : 'border border-zinc-300 text-zinc-700 hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-800'
            }`}
          >
            Grid
          </Link>
          <Link
            href={listHref}
            className={`rounded-md px-3 py-1.5 text-sm font-medium ${
              state.view === 'list'
                ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                : 'border border-zinc-300 text-zinc-700 hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-800'
            }`}
          >
            List
          </Link>
        </div>
        {hasNonDefaults ? (
          <Link
            href={clearHref}
            className="text-sm text-zinc-600 underline dark:text-zinc-400"
          >
            Reset search & filters
          </Link>
        ) : null}
      </div>
    </div>
  );
}
