import { z } from 'zod';

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

export function parseCollectionSearchParams(
  raw: Record<string, string | string[] | undefined>
): CollectionUrlState {
  const qRaw = firstString(raw.q)?.trim() ?? '';
  const genreRaw = firstString(raw.genre)?.trim() ?? '';
  const locationRaw = firstString(raw.location)?.trim() ?? '';

  return {
    q: qRaw,
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
