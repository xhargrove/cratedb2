import { NextResponse } from 'next/server';

import { prisma } from '@/db/client';
import { readArtworkObject } from '@/server/storage/artwork-store';

/**
 * Public profile photo — readable without auth (same idea as typical avatar URLs).
 * Missing file on disk → 404 even if DB row exists.
 */
export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  const profile = await prisma.profile.findUnique({
    where: { userId: id },
    select: {
      profileImageKey: true,
      profileImageMimeType: true,
    },
  });

  if (!profile?.profileImageKey || !profile.profileImageMimeType) {
    return new NextResponse('Not found', { status: 404 });
  }

  try {
    const object = await readArtworkObject(profile.profileImageKey);
    if (!object) {
      return new NextResponse('Not found', { status: 404 });
    }
    return new NextResponse(new Uint8Array(object.buffer), {
      status: 200,
      headers: {
        'Content-Type': profile.profileImageMimeType,
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch {
    return new NextResponse('Not found', { status: 404 });
  }
}
