import { prisma } from '@/db/client';

export type PublicUserSummary = {
  id: string;
  /** Display label only — never email on public surfaces. */
  displayLabel: string;
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
      profile: { select: { displayName: true } },
    },
  });
  if (!user) return null;

  const name = user.profile?.displayName?.trim();
  const displayLabel =
    name && name.length > 0 ? name : `Collector ${user.id.slice(0, 8)}`;

  return { id: user.id, displayLabel };
}
