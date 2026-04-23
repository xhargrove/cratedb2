'use client';

import { useActionState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import type { ProfileVibe } from '@/generated/prisma/client';

import { PROFILE_VIBE_OPTIONS } from '@/lib/profile-vibes';
import {
  updateProfileAction,
  type ProfileActionState,
} from '@/server/actions/profile';

import { ProfileAvatar } from '@/components/profile/profile-avatar';

export function EditProfileForm({
  userId,
  initialDisplayName,
  initialBio,
  initialVibe,
  initialCollectionPublic,
  initialProfileImageSrc,
  previewInitials,
}: {
  userId: string;
  initialDisplayName: string | null;
  initialBio: string | null;
  initialVibe: ProfileVibe;
  initialCollectionPublic: boolean;
  initialProfileImageSrc: string | null;
  previewInitials: string;
}) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState<
    ProfileActionState,
    FormData
  >(updateProfileAction, null);

  useEffect(() => {
    if (state?.ok) {
      router.refresh();
    }
  }, [state, router]);

  return (
    <form
      action={formAction}
      className="grid gap-4 rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
    >
      <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
        Profile settings
      </h2>
      {state?.error ? (
        <p
          className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200"
          role="alert"
        >
          {state.error}
        </p>
      ) : null}
      {state?.ok ? (
        <p
          className="rounded border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-900 dark:border-green-900 dark:bg-green-950/60 dark:text-green-100"
          role="status"
        >
          Profile saved.
        </p>
      ) : null}

      <div className="flex flex-col gap-3 border-b border-zinc-200 pb-4 dark:border-zinc-700 sm:flex-row sm:items-start">
        <ProfileAvatar
          key={initialProfileImageSrc ?? 'no-photo'}
          src={initialProfileImageSrc}
          initials={previewInitials}
          size={96}
        />
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
            Profile photo
          </span>
          <input
            name="profileImage"
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="max-w-full text-sm text-zinc-800 file:mr-3 file:rounded-md file:border-0 file:bg-zinc-100 file:px-3 file:py-1.5 file:text-sm file:font-medium dark:text-zinc-200 dark:file:bg-zinc-800 dark:file:text-zinc-100"
          />
          <label className="flex cursor-pointer items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
            <input
              type="checkbox"
              name="removeProfileImage"
              value="1"
              disabled={!initialProfileImageSrc}
              className="rounded border-zinc-400 dark:border-zinc-500"
            />
            <span className={!initialProfileImageSrc ? 'opacity-50' : ''}>
              Remove current photo
            </span>
          </label>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Square photos work best. JPEG, PNG, WebP, or GIF — same limits as
            collection artwork (max 3MB).
          </p>
        </div>
      </div>

      <label className="flex flex-col gap-1 text-xs font-medium text-zinc-700 dark:text-zinc-300">
        Display name
        <input
          name="displayName"
          type="text"
          defaultValue={initialDisplayName ?? ''}
          autoComplete="nickname"
          placeholder="How you want to appear publicly"
          className="rounded border border-zinc-300 px-2 py-1.5 text-sm dark:border-zinc-600 dark:bg-zinc-950"
        />
        <span className="font-normal text-zinc-500 dark:text-zinc-400">
          Used on your public profile. Leave blank to show only your user id
          there; your email is never shown publicly.
        </span>
      </label>

      <label className="flex flex-col gap-1 text-xs font-medium text-zinc-700 dark:text-zinc-300">
        How you show up
        <select
          name="vibe"
          defaultValue={initialVibe}
          className="rounded border border-zinc-300 px-2 py-1.5 text-sm dark:border-zinc-600 dark:bg-zinc-950"
        >
          {PROFILE_VIBE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label} — {o.hint}
            </option>
          ))}
        </select>
        <span className="font-normal text-zinc-500 dark:text-zinc-400">
          Shown as a badge on your public profile (collector, DJ, producer, and
          more).
        </span>
      </label>

      <label className="flex flex-col gap-1 text-xs font-medium text-zinc-700 dark:text-zinc-300">
        Bio
        <textarea
          name="bio"
          rows={5}
          defaultValue={initialBio ?? ''}
          placeholder={
            'e.g. Club vinyl & rare groove. Always hunting Italian library cuts.'
          }
          className="resize-y rounded border border-zinc-300 px-2 py-1.5 text-sm dark:border-zinc-600 dark:bg-zinc-950"
        />
        <span className="font-normal text-zinc-500 dark:text-zinc-400">
          Optional. Tell people what you collect, play, or care about — max 500
          characters.
        </span>
      </label>

      <label className="flex cursor-pointer items-start gap-3 text-sm text-zinc-800 dark:text-zinc-200">
        <input
          type="checkbox"
          name="collectionPublic"
          value="1"
          defaultChecked={initialCollectionPublic}
          className="mt-1"
        />
        <span>
          <span className="font-medium">Show my collection publicly</span>
          <span className="mt-1 block text-xs font-normal text-zinc-600 dark:text-zinc-400">
            When enabled, visitors can browse your albums, 45s, and 12-inch
            singles (artwork rules still apply). Turn off to hide catalog from
            your public page.
          </span>
        </span>
      </label>

      <div className="flex flex-wrap items-center gap-4 pt-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900"
        >
          {pending ? 'Saving…' : 'Save profile'}
        </button>
        <Link
          href={`/u/${userId}`}
          className="text-sm font-medium text-zinc-700 underline hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-zinc-100"
        >
          View public profile
        </Link>
      </div>
    </form>
  );
}
