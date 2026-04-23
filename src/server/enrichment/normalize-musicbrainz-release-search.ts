import {
  ENRICHMENT_MAX_CANDIDATES,
  MUSICBRAINZ_MBID_RE,
} from '@/server/enrichment/constants';
import { extractGenreFromMbReleasePayload } from '@/server/enrichment/musicbrainz-genre';
import type {
  EnrichmentProviderId,
  MetadataCandidate,
} from '@/server/enrichment/types';

function safeYearFromDate(date: unknown): number | null {
  if (typeof date !== 'string' || date.length < 4) return null;
  const y = Number(date.slice(0, 4));
  if (!Number.isFinite(y) || y < 1900 || y > 2100) return null;
  return y;
}

/**
 * Join MusicBrainz `artist-credit` entries (joinphrase precedes each name except the first block).
 */
export function formatArtistCredit(ac: unknown): string {
  if (!Array.isArray(ac)) return '';
  let out = '';
  for (const entry of ac) {
    if (!entry || typeof entry !== 'object') continue;
    const e = entry as Record<string, unknown>;
    const jp = typeof e.joinphrase === 'string' ? e.joinphrase : '';
    const name =
      typeof e.name === 'string'
        ? e.name.trim()
        : typeof e.artist === 'object' &&
            e.artist !== null &&
            typeof (e.artist as Record<string, unknown>).name === 'string'
          ? String((e.artist as Record<string, unknown>).name).trim()
          : '';
    out += jp;
    if (name) {
      if (out && !/\s$/.test(out) && !jp) out += ' ';
      out += name;
    }
  }
  return out.replace(/\s+/g, ' ').trim();
}

function pickLabel(rel: Record<string, unknown>): string | null {
  const li = rel['label-info'];
  if (!Array.isArray(li) || li.length === 0) return null;
  const first = li[0];
  if (!first || typeof first !== 'object') return null;
  const label = (first as Record<string, unknown>).label;
  if (!label || typeof label !== 'object') return null;
  const name = (label as Record<string, unknown>).name;
  if (typeof name !== 'string' || !name.trim()) return null;
  return name.trim().slice(0, 500);
}

/**
 * Maps MusicBrainz `/ws/2/release` search JSON to normalized candidates (bounded).
 */
export function normalizeMusicBrainzReleaseSearch(
  json: unknown,
  provider: EnrichmentProviderId,
  limit: number
): MetadataCandidate[] {
  if (!json || typeof json !== 'object') return [];
  const root = json as Record<string, unknown>;
  const releases = root.releases;
  if (!Array.isArray(releases)) return [];

  const out: MetadataCandidate[] = [];
  const seen = new Set<string>();

  for (const rel of releases) {
    if (out.length >= Math.min(limit, ENRICHMENT_MAX_CANDIDATES)) break;
    if (!rel || typeof rel !== 'object') continue;
    const r = rel as Record<string, unknown>;
    const id = typeof r.id === 'string' ? r.id : '';
    if (!MUSICBRAINZ_MBID_RE.test(id) || seen.has(id)) continue;

    const title =
      typeof r.title === 'string' ? r.title.trim().slice(0, 500) : '';
    const artist = formatArtistCredit(r['artist-credit']).slice(0, 500);
    if (!title || !artist) continue;

    const year =
      safeYearFromDate(r.date) ??
      safeYearFromDate(
        typeof r['first-release-date'] === 'string'
          ? r['first-release-date']
          : undefined
      );

    seen.add(id);
    out.push({
      id,
      provider,
      artist,
      title,
      year,
      genre: extractGenreFromMbReleasePayload(r),
      label: pickLabel(r),
    });
  }

  return out;
}
