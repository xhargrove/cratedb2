/** Owner-scoped dashboard insights (Phase 8). */

export type RankedRow = {
  label: string;
  count: number;
};

export type RankedRowWithBar = RankedRow & {
  /** 0–100 relative to the largest count in the current list (not share of collection). */
  barPct: number;
};

export type OwnerInsights = {
  recordCount: number;
  wantlistCount: number;
  distinctArtistsInCollection: number;
  artwork: {
    withArtwork: number;
    /** Integer 0–100 when recordCount > 0; null when there are no records (avoid implying 0% precision). */
    percentWithArtwork: number | null;
  };
  genres: RankedRowWithBar[];
  artists: RankedRowWithBar[];
  /** Release years present on records; excludes unknown/null years. */
  topReleaseYears: RankedRowWithBar[];
  follows: {
    followers: number;
    following: number;
  };
};
