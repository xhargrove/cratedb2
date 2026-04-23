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
    const single = await prisma.collectionSingle.findFirst({
      where: { id },
      select: {
        ownerId: true,
        artworkKey: true,
        artworkMimeType: true,
      },
    });

    return respondWithCollectionArtwork(request, {
      row: single,
      entityId: id,
      logContext: 'singleId',
    });
  } catch (e) {
    logger.error({ err: e }, 'single artwork GET failed');
    return new NextResponse('Service unavailable', { status: 503 });
  }
}
