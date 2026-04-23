'use client';

import { useActionState, useState } from 'react';

import { createRecordAction } from '@/server/actions/records';

import {
  RecordFormFields,
  type ContainerSelectOption,
} from '@/components/records/record-form-fields';
import { SpotifyAlbumSearch } from '@/components/records/spotify-album-search';

export function CreateRecordForm({
  spotifySearch,
  containerOptions,
}: {
  spotifySearch: { enabled: true } | { enabled: false; reason: string };
  containerOptions: ContainerSelectOption[];
}) {
  const [state, formAction, pending] = useActionState(createRecordAction, null);

  const [spotifyFillKey, setSpotifyFillKey] = useState<string>('initial');
  const [defaults, setDefaults] = useState<{
    artist: string;
    title: string;
    year: number | null;
    genre?: string | null;
  } | null>(null);
  const [spotifyCoverPreviewUrl, setSpotifyCoverPreviewUrl] = useState<
    string | null
  >(null);
  const [spotifyAlbumId, setSpotifyAlbumId] = useState('');

  return (
    <div className="grid gap-3 rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
        New record
      </h2>
      {/* Spotify uses its own <form> — must not be nested inside the record form. */}
      <SpotifyAlbumSearch
        enabled={spotifySearch.enabled}
        disabledReason={
          spotifySearch.enabled ? undefined : spotifySearch.reason
        }
        onPickAlbum={(a) => {
          setDefaults({
            artist: a.artist,
            title: a.title,
            year: a.year,
            genre: a.genreHint ?? undefined,
          });
          setSpotifyAlbumId(a.id);
          setSpotifyCoverPreviewUrl(a.coverUrl);
          setSpotifyFillKey(a.id + String(a.year ?? ''));
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
        <input type="hidden" name="spotifyAlbumId" value={spotifyAlbumId} />
        <RecordFormFields
          key={spotifyFillKey}
          artworkMode="create"
          defaults={defaults ?? undefined}
          spotifyCoverPreviewUrl={spotifyCoverPreviewUrl}
          containerOptions={containerOptions}
        />
        <button
          type="submit"
          disabled={pending}
          className="w-fit rounded-md bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900"
        >
          {pending ? 'Saving…' : 'Create record'}
        </button>
      </form>
    </div>
  );
}
