/**
 * Spotify album `images[]` — pick a reasonable thumbnail URL for UI and downloads.
 */
export function pickBestSpotifyImageUrl(images: unknown): string | null {
  if (!Array.isArray(images) || images.length === 0) return null;

  type Img = { url?: unknown; width?: unknown };
  const parsed: { url: string; width: number }[] = [];

  for (const im of images) {
    if (!im || typeof im !== 'object') continue;
    const u = (im as Img).url;
    const w = (im as Img).width;
    if (typeof u !== 'string' || !u.startsWith('https://')) continue;
    const width = typeof w === 'number' && Number.isFinite(w) ? w : 640;
    parsed.push({ url: u, width });
  }

  if (parsed.length === 0) return null;

  parsed.sort(
    (a, b) => Math.abs(a.width - 300) - Math.abs(b.width - 300)
  );
  return parsed[0]?.url ?? null;
}
