import { NextResponse } from 'next/server';

import { prisma } from '@/db/client';
import { logger } from '@/lib/logger';
import { respondWithCollectionArtwork } from '@/server/artwork/collection-artwork-get';

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const row = await prisma.collectionTwelveInchSingle.findFirst({
      where: { id },
      select: {
        ownerId: true,
        artworkKey: true,
        artworkMimeType: true,
      },
    });

    return respondWithCollectionArtwork(request, {
      row,
      entityId: id,
      logContext: 'twelveInchId',
    });
  } catch (e) {
    logger.error({ err: e }, 'twelve-inch artwork GET failed');
    return new NextResponse('Service unavailable', { status: 503 });
  }
}
