'use client';

import { useActionState } from 'react';

import { updateWantlistItemAction } from '@/server/actions/wantlist';

import { WantlistFormFields } from '@/components/wantlist/wantlist-form-fields';

type Row = {
  id: string;
  artist: string;
  title: string;
  year: number | null;
  genre: string | null;
  notes: string | null;
};

export function EditWantlistForm({ item }: { item: Row }) {
  const [state, formAction, pending] = useActionState(
    updateWantlistItemAction,
    null
  );

  return (
    <form
      action={formAction}
      className="grid gap-3 rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
    >
      <input type="hidden" name="wantlistId" value={item.id} />
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
          artist: item.artist,
          title: item.title,
          year: item.year,
          genre: item.genre,
          notes: item.notes,
        }}
      />
      <button
        type="submit"
        disabled={pending}
        className="w-fit rounded-md bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900"
      >
        {pending ? 'Saving…' : 'Save changes'}
      </button>
    </form>
  );
}
