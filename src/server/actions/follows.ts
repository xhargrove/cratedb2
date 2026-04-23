'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { prisma } from '@/db/client';
import { logger } from '@/lib/logger';
import { parseFollowTargetUserId } from '@/lib/validations/follow';
import { requireUser } from '@/server/auth/require-user';
import { createFollowForUsers } from '@/server/follows/create-follow';
import { removeFollowForUsers } from '@/server/follows/remove-follow';

function redirectToPublicProfile(targetUserId: string, errorCode: string) {
  redirect(
    `/u/${encodeURIComponent(targetUserId)}?followError=${encodeURIComponent(errorCode)}`
  );
}

export async function followUserAction(formData: FormData): Promise<void> {
  const viewer = await requireUser();

  const parsed = parseFollowTargetUserId(formData.get('targetUserId'));
  if (!parsed.ok) {
    redirect('/dashboard?followError=invalid-target');
  }

  const targetId = parsed.targetUserId;

  if (targetId === viewer.id) {
    redirectToPublicProfile(viewer.id, 'self');
  }

  const targetExists = await prisma.user.findUnique({
    where: { id: targetId },
    select: { id: true },
  });
  if (!targetExists) {
    redirect('/dashboard?followError=user-not-found');
  }

  const existing = await prisma.userFollow.findFirst({
    where: { followerId: viewer.id, followedId: targetId },
    select: { id: true },
  });
  if (existing) {
    redirectToPublicProfile(targetId, 'duplicate');
  }

  try {
    await createFollowForUsers(viewer.id, targetId);
  } catch (e) {
    logger.error(
      { err: e, followerId: viewer.id, followedId: targetId },
      'followUser failed'
    );
    redirectToPublicProfile(targetId, 'failed');
  }

  revalidatePath(`/u/${targetId}`);
  redirect(`/u/${targetId}`);
}

export async function unfollowUserAction(formData: FormData): Promise<void> {
  const viewer = await requireUser();

  const parsed = parseFollowTargetUserId(formData.get('targetUserId'));
  if (!parsed.ok) {
    redirect('/dashboard?followError=invalid-target');
  }

  const targetId = parsed.targetUserId;

  if (targetId === viewer.id) {
    redirectToPublicProfile(viewer.id, 'self');
  }

  try {
    await removeFollowForUsers(viewer.id, targetId);
  } catch (e) {
    logger.error(
      { err: e, followerId: viewer.id, followedId: targetId },
      'unfollowUser failed'
    );
    redirectToPublicProfile(targetId, 'failed');
  }

  revalidatePath(`/u/${targetId}`);
  redirect(`/u/${targetId}`);
}
