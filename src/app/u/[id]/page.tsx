import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { getCurrentUser } from '@/server/auth/get-current-user';
import { getFollowCounts, isFollowing } from '@/server/follows/follow-queries';
import { getPublicUserSummary } from '@/server/public/get-public-user';
import { listPublicCollectionForUser } from '@/server/records/list-public-collection';

import { ProfileFollowSection } from '@/components/profile/profile-follow-section';
import { PublicProfileHeader } from '@/components/profile/public-profile-header';
import { PublicCollectionGrid } from '@/components/profile/public-collection-grid';

const FOLLOW_ERROR_MESSAGES: Record<string, string> = {
  self: 'You cannot follow your own profile.',
  duplicate: 'You are already following this collector.',
  failed: 'Could not update follow state. Try again.',
};

function firstParam(
  raw: Record<string, string | string[] | undefined>,
  key: string
): string | undefined {
  const v = raw[key];
  if (v === undefined) return undefined;
  return Array.isArray(v) ? v[0] : v;
}

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const user = await getPublicUserSummary(id);
  return {
    title: user ? `${user.displayLabel} · Cratedb` : 'Collector · Cratedb',
  };
}

export default async function PublicProfilePage({
  params,
  searchParams,
}: Props) {
  const { id } = await params;
  const raw = await searchParams;

  const user = await getPublicUserSummary(id);
  if (!user) {
    notFound();
  }

  const viewer = await getCurrentUser();
  const [counts, collection] = await Promise.all([
    getFollowCounts(id),
    listPublicCollectionForUser(id),
  ]);

  let following = false;
  if (viewer && viewer.id !== id) {
    following = await isFollowing(viewer.id, id);
  }

  const followErrCode = firstParam(raw, 'followError');
  const followErrMsg =
    followErrCode !== undefined && followErrCode !== ''
      ? (FOLLOW_ERROR_MESSAGES[followErrCode] ??
        'Something went wrong while updating follow state.')
      : undefined;

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <Link
          href="/"
          className="text-sm text-zinc-600 underline dark:text-zinc-400"
        >
          ← Home
        </Link>
        {viewer ? (
          <Link
            href="/dashboard"
            className="text-sm text-zinc-600 underline dark:text-zinc-400"
          >
            Dashboard
          </Link>
        ) : (
          <Link
            href="/login"
            className="text-sm text-zinc-600 underline dark:text-zinc-400"
          >
            Log in
          </Link>
        )}
      </div>

      <header className="space-y-6 border-b border-zinc-200 pb-8 dark:border-zinc-800">
        <PublicProfileHeader
          displayLabel={user.displayLabel}
          vibeLabel={user.vibeLabel}
          bio={user.bio}
        />
        <div>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            <span className="font-medium text-zinc-700 dark:text-zinc-300">
              {counts.followers}
            </span>{' '}
            followers ·{' '}
            <span className="font-medium text-zinc-700 dark:text-zinc-300">
              {counts.following}
            </span>{' '}
            following
          </p>
          <div className="mt-4">
            <ProfileFollowSection
              targetUserId={id}
              viewerId={viewer?.id ?? null}
              isFollowing={following}
            />
          </div>
          {followErrMsg ? (
            <p
              className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-900 dark:border-red-900 dark:bg-red-950/60 dark:text-red-100"
              role="alert"
            >
              {followErrMsg}
            </p>
          ) : null}
        </div>
      </header>

      <section className="mt-8">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          Collection
        </h2>
        {!collection.visible ? (
          <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
            This collector has chosen to hide their collection.
          </p>
        ) : collection.records.length === 0 ? (
          <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
            No records to show yet.
          </p>
        ) : (
          <div className="mt-4">
            <PublicCollectionGrid records={collection.records} />
          </div>
        )}
      </section>
    </div>
  );
}
