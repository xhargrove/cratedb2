'use client';

import { useActionState } from 'react';

import { createWantlistItemAction } from '@/server/actions/wantlist';

import { WantlistFormFields } from '@/components/wantlist/wantlist-form-fields';

export function CreateWantlistForm({
  defaults,
}: {
  defaults?: {
    artist?: string;
    title?: string;
    year?: string;
  };
}) {
  const [state, formAction, pending] = useActionState(
    createWantlistItemAction,
    null
  );

  const yearNum =
    defaults?.year && /^\d+$/.test(defaults.year)
      ? Number(defaults.year)
      : undefined;

  return (
    <form
      action={formAction}
      className="grid gap-3 rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
    >
      <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
        New wantlist entry
      </h2>
      {state?.error ? (
        <p
          className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200"
          role="alert"
        >
          {state.error}
        </p>
      ) : null}
      <WantlistFormFields
        defaults={{
          artist: defaults?.artist,
          title: defaults?.title,
          year: yearNum,
        }}
      />
      <button
        type="submit"
        disabled={pending}
        className="w-fit rounded-md bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900"
      >
        {pending ? 'Saving…' : 'Add to wantlist'}
      </button>
    </form>
  );
}
