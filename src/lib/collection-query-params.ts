import { z } from 'zod';

import {
  MAX_GENRE_URL_LENGTH,
  MAX_SEARCH_Q_LENGTH,
  MAX_STORAGE_URL_LENGTH,
} from '@/lib/collection-constants';

export const SORT_KEYS = [
  'newest',
  'oldest',
  'artist-asc',
  'artist-desc',
  'title-asc',
  'title-desc',
] as const;

export type SortKey = (typeof SORT_KEYS)[number];

export const VIEW_KEYS = ['grid', 'list'] as const;
export type ViewKey = (typeof VIEW_KEYS)[number];

const sortSchema = z.enum(SORT_KEYS).catch('newest');
const viewSchema = z.enum(VIEW_KEYS).catch('grid');

/** Normalized collection UI + query state from URL search params. */
export type CollectionUrlState = {
  q: string;
  sort: SortKey;
  view: ViewKey;
  genre: string;
  storageLocation: string;
};

function firstString(v: string | string[] | undefined): string | undefined {
  if (v === undefined) return undefined;
  return Array.isArray(v) ? v[0] : v;
}

function truncate(s: string, max: number): string {
  if (s.length <= max) return s;
  return s.slice(0, max);
}

export function parseCollectionSearchParams(
  raw: Record<string, string | string[] | undefined>
): CollectionUrlState {
  const qTrimmed = (firstString(raw.q)?.trim() ?? '').slice(
    0,
    MAX_SEARCH_Q_LENGTH
  );
  const genreRaw = truncate(
    firstString(raw.genre)?.trim() ?? '',
    MAX_GENRE_URL_LENGTH
  );
  const locationRaw = truncate(
    firstString(raw.location)?.trim() ?? '',
    MAX_STORAGE_URL_LENGTH
  );

  return {
    q: qTrimmed,
    sort: sortSchema.parse(firstString(raw.sort)),
    view: viewSchema.parse(firstString(raw.view)),
    genre: genreRaw,
    storageLocation: locationRaw,
  };
}

/** Build query string for `/dashboard/records` links (bookmarkable). */
export function serializeCollectionParams(state: CollectionUrlState): string {
  const p = new URLSearchParams();
  if (state.q) p.set('q', state.q);
  if (state.sort !== 'newest') p.set('sort', state.sort);
  if (state.view !== 'grid') p.set('view', state.view);
  if (state.genre) p.set('genre', state.genre);
  if (state.storageLocation) p.set('location', state.storageLocation);
  const s = p.toString();
  return s ? `?${s}` : '';
}
