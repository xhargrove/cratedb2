import { NextResponse } from 'next/server';

import { parseArtworkDeliverySize } from '@/lib/artwork-delivery-size';
import { logger } from '@/lib/logger';
import type { AllowedArtworkMimeType } from '@/lib/validations/artwork';
import { resolveAuth } from '@/server/auth/get-current-user';
import { isOwnerCollectionPublic } from '@/server/public/collection-access';
import { readArtworkForDelivery } from '@/server/storage/artwork-delivery-read';

type ArtworkRow = {
  ownerId: string;
  artworkKey: string | null;
  artworkMimeType: string | null;
};

/**
 * Shared GET logic for collection entity artwork (album / single / 12-inch).
 * Privacy: owner or public profile only; cache headers unchanged from prior behaviour.
 */
export async function respondWithCollectionArtwork(
  request: Request,
  args: {
    row: ArtworkRow | null;
    entityId: string;
    logContext: string;
  }
): Promise<NextResponse> {
  const { row, entityId, logContext } = args;

  if (!row?.artworkKey || !row.artworkMimeType) {
    return new NextResponse('Not found', { status: 404 });
  }

  const auth = await resolveAuth();
  if (auth.status === 'backend_unavailable') {
    return new NextResponse('Service unavailable', { status: 503 });
  }
  const viewer = auth.status === 'authenticated' ? auth.user : null;

  const isOwner = viewer?.id === row.ownerId;
  if (!isOwner) {
    const allowed = await isOwnerCollectionPublic(row.ownerId);
    if (!allowed) {
      return new NextResponse('Forbidden', { status: 403 });
    }
  }

  const url = new URL(request.url);
  const size = parseArtworkDeliverySize(url.searchParams.get('size'));

  try {
    const payload = await readArtworkForDelivery(
      row.artworkKey,
      row.artworkMimeType as AllowedArtworkMimeType,
      size
    );
    if (!payload) {
      return new NextResponse('Not found', { status: 404 });
    }

    const cacheControl = isOwner
      ? 'private, max-age=3600, stale-while-revalidate=60'
      : 'public, max-age=3600, stale-while-revalidate=300';

    return new NextResponse(Buffer.from(payload.bytes), {
      status: 200,
      headers: {
        'Content-Type': payload.contentType,
        'Cache-Control': cacheControl,
        Vary: 'Cookie',
      },
    });
  } catch (err) {
    logger.warn(
      { err, [logContext]: entityId },
      `${logContext} artwork read failed`
    );
    return new NextResponse('Not found', { status: 404 });
  }
}
