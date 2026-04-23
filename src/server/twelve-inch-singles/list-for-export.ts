import { OWNER_EXPORT_ROW_MAX } from '@/lib/collection-constants';
import type { TwelveInchExportRow } from '@/types/twelve-inch-export';
import { prisma } from '@/db/client';

export async function listTwelveInchForExport(ownerId: string): Promise<{
  rows: TwelveInchExportRow[];
  totalInDatabase: number;
  capped: boolean;
}> {
  const totalInDatabase = await prisma.collectionTwelveInchSingle.count({
    where: { ownerId },
  });

  const rows = await prisma.collectionTwelveInchSingle.findMany({
    where: { ownerId },
    orderBy: { createdAt: 'desc' },
    take: OWNER_EXPORT_ROW_MAX,
    select: {
      id: true,
      artist: true,
      title: true,
      bSideTitle: true,
      year: true,
      genre: true,
      storageLocation: true,
      notes: true,
      quantity: true,
      spotifyTrackId: true,
      createdAt: true,
    },
  });

  return {
    rows,
    totalInDatabase,
    capped: totalInDatabase > rows.length,
  };
}
