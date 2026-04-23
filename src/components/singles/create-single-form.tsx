'use client';

import { useActionState, useState } from 'react';

import { createSingleAction } from '@/server/actions/singles';

import { SingleFormFields } from '@/components/singles/single-form-fields';
import { SpotifyTrackSearch } from '@/components/singles/spotify-track-search';

export function CreateSingleForm({
  spotifySearch,
}: {
  spotifySearch: { enabled: true } | { enabled: false; reason: string };
}) {
  const [state, formAction, pending] = useActionState(createSingleAction, null);

  const [fillKey, setFillKey] = useState('initial');
  const [defaults, setDefaults] = useState<{
    artist: string;
    title: string;
    bSideTitle?: string | null;
    year: number | null;
    genre?: string | null;
  } | null>(null);
  const [spotifyCoverPreviewUrl, setSpotifyCoverPreviewUrl] = useState<
    string | null
  >(null);
  const [spotifyTrackId, setSpotifyTrackId] = useState('');

  return (
    <div className="grid gap-3 rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
        New 45 / single
      </h2>
      <SpotifyTrackSearch
        enabled={spotifySearch.enabled}
        disabledReason={
          spotifySearch.enabled ? undefined : spotifySearch.reason
        }
        onPickTrack={(t) => {
          setDefaults({
            artist: t.artist,
            title: t.title,
            year: t.year,
            genre: t.genreHint ?? undefined,
          });
          setSpotifyTrackId(t.id);
          setSpotifyCoverPreviewUrl(t.coverUrl);
          setFillKey(t.id + String(t.year ?? ''));
        }}
      />
      <form action={formAction} className="grid gap-3">
        {state?.error ? (
          <p
            className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200"
            role="alert"
          >
            {state.error}
          </p>
        ) : null}
        <input type="hidden" name="spotifyTrackId" value={spotifyTrackId} />
        <SingleFormFields
          artworkMode="create"
          defaults={defaults ?? undefined}
          spotifyCoverPreviewUrl={spotifyCoverPreviewUrl}
          spotifyPrefillRevision={fillKey}
        />
        <button
          type="submit"
          disabled={pending}
          className="w-fit rounded-md bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900"
        >
          {pending ? 'Saving…' : 'Save single'}
        </button>
      </form>
    </div>
  );
}
