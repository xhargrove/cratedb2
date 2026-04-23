import { getFollowCounts } from '@/server/follows/follow-queries';
import {
  artworkCountsForOwner,
  countDistinctArtistsForOwner,
  groupArtistsForOwner,
  groupGenresForOwner,
  groupYearsForOwner,
} from '@/server/stats/collection-aggregates';
import { addBarWidths } from '@/server/stats/shape';
import type { OwnerInsights } from '@/server/stats/types';
import { countWantlistItemsForOwner } from '@/server/stats/wantlist-stats';

function percentWithArtwork(total: number, withArtwork: number): number | null {
  if (total <= 0) return null;
  return Math.round((withArtwork / total) * 100);
}

/**
 * Aggregates collection + wantlist + follow metrics for the signed-in user only.
 * Call only after `requireUser()` — pass `user.id` as ownerId.
 */
export async function getOwnerInsights(
  ownerId: string
): Promise<OwnerInsights> {
  const [
    wantlistCount,
    distinctArtistsInCollection,
    artwork,
    genresRaw,
    artistsRaw,
    yearsRaw,
    follows,
  ] = await Promise.all([
    countWantlistItemsForOwner(ownerId),
    countDistinctArtistsForOwner(ownerId),
    artworkCountsForOwner(ownerId),
    groupGenresForOwner(ownerId),
    groupArtistsForOwner(ownerId),
    groupYearsForOwner(ownerId),
    getFollowCounts(ownerId),
  ]);

  const { total: recordCount, withArtwork } = artwork;

  return {
    recordCount,
    wantlistCount,
    distinctArtistsInCollection,
    artwork: {
      withArtwork,
      percentWithArtwork: percentWithArtwork(recordCount, withArtwork),
    },
    genres: addBarWidths(genresRaw),
    artists: addBarWidths(artistsRaw),
    topReleaseYears: addBarWidths(yearsRaw),
    follows,
  };
}
