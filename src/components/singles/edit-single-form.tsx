'use client';

import { useActionState } from 'react';

import { singleArtworkUrl } from '@/lib/single-artwork-url';
import { updateSingleAction } from '@/server/actions/singles';

import { SingleFormFields } from '@/components/singles/single-form-fields';

type SingleRow = {
  id: string;
  artist: string;
  title: string;
  bSideTitle: string | null;
  year: number | null;
  genre: string | null;
  storageLocation: string | null;
  notes: string | null;
  artworkKey: string | null;
  artworkUpdatedAt: Date | string | null;
};

export function EditSingleForm({ single }: { single: SingleRow }) {
  const [state, formAction, pending] = useActionState(updateSingleAction, null);

  const artworkPreviewUrl = singleArtworkUrl(
    single.id,
    Boolean(single.artworkKey),
    single.artworkUpdatedAt
  );

  return (
    <form
      action={formAction}
      className="grid gap-3 rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
    >
      <input type="hidden" name="singleId" value={single.id} />
      <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
        Edit single
      </h2>
      {state?.error ? (
        <p
          className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200"
          role="alert"
        >
          {state.error}
        </p>
      ) : null}
      <SingleFormFields
        artworkMode="edit"
        artworkPreviewUrl={artworkPreviewUrl}
        defaults={{
          artist: single.artist,
          title: single.title,
          bSideTitle: single.bSideTitle,
          year: single.year,
          genre: single.genre,
          storageLocation: single.storageLocation,
          notes: single.notes,
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
