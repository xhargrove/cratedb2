'use client';

import { useActionState, useRef, useState } from 'react';

import { recordArtworkUrl } from '@/lib/record-artwork-url';
import { updateRecordAction } from '@/server/actions/records';

import { RecordFormFields } from '@/components/records/record-form-fields';
import { SpotifyAlbumSearch } from '@/components/records/spotify-album-search';

type RecordRow = {
  id: string;
  artist: string;
  title: string;
  year: number | null;
  genre: string | null;
  storageLocation: string | null;
  notes: string | null;
  artworkKey: string | null;
  artworkUpdatedAt: Date | string | null;
  spotifyAlbumId: string | null;
};

function applySpotifyToFormFields(
  form: HTMLFormElement,
  album: {
    artist: string;
    title: string;
    year: number | null;
    genreHint: string | null;
  }
) {
  const artist = form.querySelector<HTMLInputElement>('input[name="artist"]');
  const title = form.querySelector<HTMLInputElement>('input[name="title"]');
  const year = form.querySelector<HTMLInputElement>('input[name="year"]');
  const genre = form.querySelector<HTMLInputElement>('input[name="genre"]');
  if (artist) artist.value = album.artist;
  if (title) title.value = album.title;
  if (year) year.value = album.year != null ? String(album.year) : '';
  if (genre && album.genreHint) genre.value = album.genreHint;
}

export function EditRecordForm({
  record,
  spotifySearch,
}: {
  record: RecordRow;
  spotifySearch: { enabled: true } | { enabled: false; reason: string };
}) {
  const [state, formAction, pending] = useActionState(updateRecordAction, null);
  const formRef = useRef<HTMLFormElement>(null);
  const [spotifyAlbumId, setSpotifyAlbumId] = useState(
    record.spotifyAlbumId ?? ''
  );
  const [spotifyCoverPreviewUrl, setSpotifyCoverPreviewUrl] = useState<
    string | null
  >(null);

  const artworkPreviewUrl = recordArtworkUrl(
    record.id,
    Boolean(record.artworkKey),
    record.artworkUpdatedAt
  );

  return (
    <div className="grid gap-3 rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      {/* Spotify search form must stay outside the record <form>. */}
      <SpotifyAlbumSearch
        enabled={spotifySearch.enabled}
        disabledReason={
          spotifySearch.enabled ? undefined : spotifySearch.reason
        }
        onPickAlbum={(a) => {
          setSpotifyAlbumId(a.id);
          setSpotifyCoverPreviewUrl(a.coverUrl);
          const form = formRef.current;
          if (form) applySpotifyToFormFields(form, a);
        }}
      />
      <form
        ref={formRef}
        id={`edit-record-form-${record.id}`}
        action={formAction}
        className="grid gap-3"
      >
        <input type="hidden" name="recordId" value={record.id} />
        <input type="hidden" name="spotifyAlbumId" value={spotifyAlbumId} />
        {state?.error ? (
          <p
            className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200"
            role="alert"
          >
            {state.error}
          </p>
        ) : null}
        <RecordFormFields
          artworkMode="edit"
          artworkPreviewUrl={artworkPreviewUrl}
          spotifyCoverPreviewUrl={spotifyCoverPreviewUrl}
          defaults={{
            artist: record.artist,
            title: record.title,
            year: record.year,
            genre: record.genre,
            storageLocation: record.storageLocation,
            notes: record.notes,
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
    </div>
  );
}
