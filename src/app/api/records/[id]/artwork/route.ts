import { NextResponse } from 'next/server';

import { prisma } from '@/db/client';
import { logger } from '@/lib/logger';
import { respondWithCollectionArtwork } from '@/server/artwork/collection-artwork-get';

/**
 * Serve artwork for the owner, or for anyone if the owner's collection is public.
 * Query `size`: `thumb` (grid/list), `medium` (detail), `full` (original upload; default).
 */
export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const record = await prisma.collectionRecord.findFirst({
      where: { id },
      select: {
        ownerId: true,
        artworkKey: true,
        artworkMimeType: true,
      },
    });

    return respondWithCollectionArtwork(request, {
      row: record,
      entityId: id,
      logContext: 'recordId',
    });
  } catch (e) {
    logger.error({ err: e }, 'record artwork GET failed');
    return new NextResponse('Service unavailable', { status: 503 });
  }
}
