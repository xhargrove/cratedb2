import { OWNER_EXPORT_ROW_MAX } from '@/lib/collection-constants';
import type { SingleExportRow } from '@/types/single-export';
import { prisma } from '@/db/client';

export async function listSinglesForExport(ownerId: string): Promise<{
  rows: SingleExportRow[];
  totalInDatabase: number;
  capped: boolean;
}> {
  const totalInDatabase = await prisma.collectionSingle.count({
    where: { ownerId },
  });

  const rows = await prisma.collectionSingle.findMany({
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
