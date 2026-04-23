import type { Metadata } from 'next';
import Link from 'next/link';

import { prisma } from '@/db/client';
import { EditProfileForm } from '@/components/profile/edit-profile-form';
import { requireUser } from '@/server/auth/require-user';

export const metadata: Metadata = {
  title: 'Profile · Cratedb',
};

export default async function ProfileSettingsPage() {
  const user = await requireUser();

  await prisma.profile.upsert({
    where: { userId: user.id },
    create: { userId: user.id },
    update: {},
  });

  const profile = await prisma.profile.findUniqueOrThrow({
    where: { userId: user.id },
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <Link
            href="/dashboard"
            className="text-sm text-zinc-600 underline dark:text-zinc-400"
          >
            ← Dashboard
          </Link>
          <h1 className="mt-3 text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
            Your profile
          </h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Signed in as <span className="font-medium">{user.email}</span> —
            email is private and never shown on your public page.
          </p>
        </div>
      </div>

      <EditProfileForm
        userId={user.id}
        initialDisplayName={profile.displayName}
        initialBio={profile.bio}
        initialVibe={profile.vibe}
        initialCollectionPublic={profile.collectionPublic}
      />
    </div>
  );
}
