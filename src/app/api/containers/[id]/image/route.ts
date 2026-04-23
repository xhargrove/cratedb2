import { NextResponse } from 'next/server';

import { prisma } from '@/db/client';
import { getCurrentUser } from '@/server/auth/get-current-user';
import { readArtworkObject } from '@/server/storage/artwork-store';

/**
 * Container cover image — owner only (no public scan mode for container media).
 */
export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const viewer = await getCurrentUser();
  if (!viewer) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const container = await prisma.storageContainer.findFirst({
    where: { id },
    select: {
      ownerId: true,
      imageKey: true,
      imageMimeType: true,
    },
  });

  if (!container?.imageKey || !container.imageMimeType) {
    return new NextResponse('Not found', { status: 404 });
  }

  if (container.ownerId !== viewer.id) {
    return new NextResponse('Forbidden', { status: 403 });
  }

  try {
    const object = await readArtworkObject(container.imageKey);
    if (!object) {
      return new NextResponse('Not found', { status: 404 });
    }
    return new NextResponse(new Uint8Array(object.buffer), {
      status: 200,
      headers: {
        'Content-Type': container.imageMimeType,
        'Cache-Control': 'private, max-age=3600',
      },
    });
  } catch {
    return new NextResponse('Not found', { status: 404 });
  }
}
