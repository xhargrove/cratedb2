import { NextResponse } from 'next/server';

import { prisma } from '@/db/client';
import { logger } from '@/lib/logger';
import { getCurrentUser } from '@/server/auth/get-current-user';
import { isOwnerCollectionPublic } from '@/server/public/collection-access';
import { readArtworkObject } from '@/server/storage/artwork-store';

/**
 * Serve artwork for the owner, or for anyone if the owner's collection is public.
 */
export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const viewer = await getCurrentUser();

    const record = await prisma.collectionRecord.findFirst({
      where: { id },
      select: {
        ownerId: true,
        artworkKey: true,
        artworkMimeType: true,
      },
    });

    if (!record?.artworkKey || !record.artworkMimeType) {
      return new NextResponse('Not found', { status: 404 });
    }

    const isOwner = viewer?.id === record.ownerId;
    if (!isOwner) {
      const allowed = await isOwnerCollectionPublic(record.ownerId);
      if (!allowed) {
        return new NextResponse('Forbidden', { status: 403 });
      }
    }

    try {
      const object = await readArtworkObject(record.artworkKey);
      if (!object) {
        return new NextResponse('Not found', { status: 404 });
      }
      const cacheControl = isOwner
        ? 'private, max-age=3600'
        : 'public, max-age=3600';

      const nodeBuf =
        object.buffer instanceof Buffer
          ? object.buffer
          : Buffer.from(object.buffer);

      return new NextResponse(new Uint8Array(nodeBuf), {
        status: 200,
        headers: {
          'Content-Type': record.artworkMimeType,
          'Cache-Control': cacheControl,
        },
      });
    } catch (e) {
      logger.warn({ err: e, recordId: id }, 'record artwork read failed');
      return new NextResponse('Not found', { status: 404 });
    }
  } catch (e) {
    logger.error({ err: e }, 'record artwork GET failed');
    return new NextResponse('Service unavailable', { status: 503 });
  }
}
