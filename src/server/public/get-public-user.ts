import { ProfileVibe } from '@/generated/prisma/client';

import { profileVibeLabel } from '@/lib/profile-vibes';
import { prisma } from '@/db/client';

export type PublicUserSummary = {
  id: string;
  /** Display label only — never email on public surfaces. */
  displayLabel: string;
  bio: string | null;
  vibe: ProfileVibe;
  vibeLabel: string;
};

/**
 * Resolve a user for `/u/[id]`. Returns null if user does not exist.
 */
export async function getPublicUserSummary(
  userId: string
): Promise<PublicUserSummary | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      profile: {
        select: { displayName: true, bio: true, vibe: true },
      },
    },
  });
  if (!user) return null;

  const name = user.profile?.displayName?.trim();
  const displayLabel =
    name && name.length > 0 ? name : `Collector ${user.id.slice(0, 8)}`;

  const vibe = user.profile?.vibe ?? ProfileVibe.COLLECTOR;
  const rawBio = user.profile?.bio?.trim();
  const bio = rawBio && rawBio.length > 0 ? rawBio : null;

  return {
    id: user.id,
    displayLabel,
    bio,
    vibe,
    vibeLabel: profileVibeLabel(vibe),
  };
}
