/** Supported external metadata providers (Phase 9). */

export type EnrichmentProviderId = 'musicbrainz';

/** Normalized candidate shown to the user before apply. */
export type MetadataCandidate = {
  id: string;
  provider: EnrichmentProviderId;
  artist: string;
  title: string;
  year: number | null;
  genre: string | null;
  label: string | null;
};
