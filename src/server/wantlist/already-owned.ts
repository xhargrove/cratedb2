import { prisma } from '@/db/client';
import { buildWantlistDedupeKey } from '@/lib/wantlist-dedupe';

/**
 * True if the user already has a collection row whose normalized identity matches
 * this wantlist-shaped artist/title/year (same rule as `dedupeKey`).
 */
export async function userAlreadyOwnsEquivalentRelease(
  ownerId: string,
  artist: string,
  title: string,
  year: number | null | undefined
): Promise<boolean> {
  const target = buildWantlistDedupeKey(artist, title, year);
  const rows = await prisma.collectionRecord.findMany({
    where: { ownerId },
    select: { artist: true, title: true, year: true },
  });
  for (const r of rows) {
    const key = buildWantlistDedupeKey(r.artist, r.title, r.year ?? undefined);
    if (key === target) return true;
  }
  return false;
}
