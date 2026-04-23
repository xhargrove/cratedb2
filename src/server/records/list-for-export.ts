import { OWNER_EXPORT_ROW_MAX } from '@/lib/collection-constants';
import type { RecordExportRow } from '@/types/record-export';
import { prisma } from '@/db/client';

export async function listRecordsForExport(ownerId: string): Promise<{
  rows: RecordExportRow[];
  totalInDatabase: number;
  capped: boolean;
}> {
  const totalInDatabase = await prisma.collectionRecord.count({
    where: { ownerId },
  });

  const rows = await prisma.collectionRecord.findMany({
    where: { ownerId },
    orderBy: { createdAt: 'desc' },
    take: OWNER_EXPORT_ROW_MAX,
    select: {
      id: true,
      artist: true,
      title: true,
      year: true,
      genre: true,
      storageLocation: true,
      notes: true,
      quantity: true,
      spotifyAlbumId: true,
      metadataSource: true,
      metadataSourceId: true,
      createdAt: true,
    },
  });

  return {
    rows,
    totalInDatabase,
    capped: totalInDatabase > rows.length,
  };
}
