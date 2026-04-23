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
import {
  countDistinctSingleArtistsForOwner,
  groupSinglesArtistsForOwner,
  groupSinglesGenresForOwner,
  groupSinglesYearsForOwner,
  singlesArtworkCountsForOwner,
  singlesCountsForOwner,
} from '@/server/stats/singles-aggregates';
import {
  countDistinctTwelveInchArtistsForOwner,
  groupTwelveInchArtistsForOwner,
  groupTwelveInchGenresForOwner,
  groupTwelveInchYearsForOwner,
  twelveInchArtworkCountsForOwner,
  twelveInchCountsForOwner,
} from '@/server/stats/twelve-inch-aggregates';
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
    singlesRowAndCopies,
    distinctArtistsInSingles,
    singlesArtwork,
    singlesGenresRaw,
    singlesArtistsRaw,
    singlesYearsRaw,
    twelveInchRowAndCopies,
    distinctArtistsInTwelveInch,
    twelveInchArtwork,
    twelveInchGenresRaw,
    twelveInchArtistsRaw,
    twelveInchYearsRaw,
  ] = await Promise.all([
    countWantlistItemsForOwner(ownerId),
    countDistinctArtistsForOwner(ownerId),
    artworkCountsForOwner(ownerId),
    groupGenresForOwner(ownerId),
    groupArtistsForOwner(ownerId),
    groupYearsForOwner(ownerId),
    getFollowCounts(ownerId),
    singlesCountsForOwner(ownerId),
    countDistinctSingleArtistsForOwner(ownerId),
    singlesArtworkCountsForOwner(ownerId),
    groupSinglesGenresForOwner(ownerId),
    groupSinglesArtistsForOwner(ownerId),
    groupSinglesYearsForOwner(ownerId),
    twelveInchCountsForOwner(ownerId),
    countDistinctTwelveInchArtistsForOwner(ownerId),
    twelveInchArtworkCountsForOwner(ownerId),
    groupTwelveInchGenresForOwner(ownerId),
    groupTwelveInchArtistsForOwner(ownerId),
    groupTwelveInchYearsForOwner(ownerId),
  ]);

  const { total: recordCount, withArtwork } = artwork;
  const { rowCount: singleCount, totalCopies: singlesTotalCopies } =
    singlesRowAndCopies;
  const { total: singlesTotal, withArtwork: singlesWithArtwork } =
    singlesArtwork;
  const { rowCount: twelveInchCount, totalCopies: twelveInchTotalCopies } =
    twelveInchRowAndCopies;
  const { total: twelveInchTotal, withArtwork: twelveInchWithArtwork } =
    twelveInchArtwork;

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
    singleCount,
    singlesTotalCopies,
    distinctArtistsInSingles,
    singlesArtwork: {
      withArtwork: singlesWithArtwork,
      percentWithArtwork: percentWithArtwork(singlesTotal, singlesWithArtwork),
    },
    singlesGenres: addBarWidths(singlesGenresRaw),
    singlesArtists: addBarWidths(singlesArtistsRaw),
    singlesTopReleaseYears: addBarWidths(singlesYearsRaw),
    twelveInchCount,
    twelveInchTotalCopies,
    distinctArtistsInTwelveInch,
    twelveInchArtwork: {
      withArtwork: twelveInchWithArtwork,
      percentWithArtwork: percentWithArtwork(
        twelveInchTotal,
        twelveInchWithArtwork
      ),
    },
    twelveInchGenres: addBarWidths(twelveInchGenresRaw),
    twelveInchArtists: addBarWidths(twelveInchArtistsRaw),
    twelveInchTopReleaseYears: addBarWidths(twelveInchYearsRaw),
    follows,
  };
}
