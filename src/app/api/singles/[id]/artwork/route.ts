import { NextResponse } from 'next/server';

import { prisma } from '@/db/client';
import { getCurrentUser } from '@/server/auth/get-current-user';
import { isOwnerCollectionPublic } from '@/server/public/collection-access';
import { readArtworkObject } from '@/server/storage/artwork-store';

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const viewer = await getCurrentUser();

  const single = await prisma.collectionSingle.findFirst({
    where: { id },
    select: {
      ownerId: true,
      artworkKey: true,
      artworkMimeType: true,
    },
  });

  if (!single?.artworkKey || !single.artworkMimeType) {
    return new NextResponse('Not found', { status: 404 });
  }

  const isOwner = viewer?.id === single.ownerId;
  if (!isOwner) {
    const allowed = await isOwnerCollectionPublic(single.ownerId);
    if (!allowed) {
      return new NextResponse('Forbidden', { status: 403 });
    }
  }

  try {
    const object = await readArtworkObject(single.artworkKey);
    if (!object) {
      return new NextResponse('Not found', { status: 404 });
    }
    const cacheControl = isOwner
      ? 'private, max-age=3600'
      : 'public, max-age=3600';

    return new NextResponse(new Uint8Array(object.buffer), {
      status: 200,
      headers: {
        'Content-Type': single.artworkMimeType,
        'Cache-Control': cacheControl,
      },
    });
  } catch {
    return new NextResponse('Not found', { status: 404 });
  }
}
