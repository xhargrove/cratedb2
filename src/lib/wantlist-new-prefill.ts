/** Optional URL defaults for `/dashboard/wantlist/new` (e.g. from collection record). */
export type WantlistNewPrefill = {
  artist: string;
  title: string;
  year: string;
};

function firstString(v: string | string[] | undefined): string | undefined {
  if (v === undefined) return undefined;
  return Array.isArray(v) ? v[0] : v;
}

export function parseWantlistNewPrefill(
  raw: Record<string, string | string[] | undefined>
): WantlistNewPrefill {
  return {
    artist: firstString(raw.artist)?.trim() ?? '',
    title: firstString(raw.title)?.trim() ?? '',
    year: firstString(raw.year)?.trim() ?? '',
  };
}
