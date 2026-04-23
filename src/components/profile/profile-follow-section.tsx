import Link from 'next/link';

import { followUserAction, unfollowUserAction } from '@/server/actions/follows';

export async function ProfileFollowSection({
  targetUserId,
  viewerId,
  isFollowing,
}: {
  targetUserId: string;
  viewerId: string | null;
  isFollowing: boolean;
}) {
  if (!viewerId) {
    return (
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        <Link href="/login" className="font-medium underline">
          Log in
        </Link>{' '}
        to follow this collector.
      </p>
    );
  }

  if (viewerId === targetUserId) {
    return (
      <p className="text-sm text-zinc-500 dark:text-zinc-500">
        This is your public profile — others see this page without edit
        controls.
      </p>
    );
  }

  return (
    <form
      action={isFollowing ? unfollowUserAction : followUserAction}
      className="inline"
    >
      <input type="hidden" name="targetUserId" value={targetUserId} />
      <button
        type="submit"
        className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
      >
        {isFollowing ? 'Unfollow' : 'Follow'}
      </button>
    </form>
  );
}
