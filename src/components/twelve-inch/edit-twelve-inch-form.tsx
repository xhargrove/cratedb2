'use client';

import { useActionState, useRef, useState } from 'react';

import type { PhysicalStorageKind } from '@/generated/prisma/client';
import { twelveInchArtworkUrl } from '@/lib/twelve-inch-artwork-url';
import { storageAssignmentDefaultsFromRow } from '@/lib/storage-form-defaults';
import { updateTwelveInchAction } from '@/server/actions/twelve-inch-singles';

import { TwelveInchFormFields } from '@/components/twelve-inch/twelve-inch-form-fields';
import { SpotifyTrackSearch } from '@/components/singles/spotify-track-search';

type Row = {
  id: string;
  artist: string;
  title: string;
  bSideTitle: string | null;
  year: number | null;
  quantity: number;
  genre: string | null;
  storageKind: PhysicalStorageKind;
  shelfRow: number | null;
  shelfColumn: number | null;
  crateNumber: number | null;
  boxNumber: number | null;
  boxCustomLabel: string | null;
  storageLocation: string | null;
  notes: string | null;
  artworkKey: string | null;
  artworkUpdatedAt: Date | string | null;
  spotifyTrackId: string | null;
};

function applySpotifyTrackToFormFields(
  form: HTMLFormElement,
  track: {
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
  if (artist) artist.value = track.artist;
  if (title) title.value = track.title;
  if (year) year.value = track.year != null ? String(track.year) : '';
  if (genre && track.genreHint) genre.value = track.genreHint;
}

export function EditTwelveInchForm({
  row,
  spotifySearch,
}: {
  row: Row;
  spotifySearch: { enabled: true } | { enabled: false; reason: string };
}) {
  const [state, formAction, pending] = useActionState(
    updateTwelveInchAction,
    null
  );
  const formRef = useRef<HTMLFormElement>(null);
  const [spotifyTrackId, setSpotifyTrackId] = useState(
    row.spotifyTrackId ?? ''
  );
  const [spotifyCoverPreviewUrl, setSpotifyCoverPreviewUrl] = useState<
    string | null
  >(null);
  const [applySpotifyArtwork, setApplySpotifyArtwork] = useState(false);

  const artworkPreviewUrl = twelveInchArtworkUrl(
    row.id,
    Boolean(row.artworkKey),
    row.artworkUpdatedAt,
    'medium'
  );

  return (
    <div className="grid gap-3 rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <SpotifyTrackSearch
        enabled={spotifySearch.enabled}
        disabledReason={
          spotifySearch.enabled ? undefined : spotifySearch.reason
        }
        onPickTrack={(t) => {
          setSpotifyTrackId(t.id);
          setSpotifyCoverPreviewUrl(t.coverUrl);
          setApplySpotifyArtwork(true);
          const form = formRef.current;
          if (form) applySpotifyTrackToFormFields(form, t);
        }}
      />
      <form ref={formRef} action={formAction} className="grid gap-3">
        <input type="hidden" name="twelveInchId" value={row.id} />
        <input type="hidden" name="spotifyTrackId" value={spotifyTrackId} />
        {applySpotifyArtwork ? (
          <input type="hidden" name="applySpotifyArtwork" value="1" />
        ) : null}
        {state?.error ? (
          <p
            className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200"
            role="alert"
          >
            {state.error}
          </p>
        ) : null}
        <TwelveInchFormFields
          artworkMode="edit"
          artworkPreviewUrl={artworkPreviewUrl}
          spotifyCoverPreviewUrl={spotifyCoverPreviewUrl}
          defaults={{
            artist: row.artist,
            title: row.title,
            bSideTitle: row.bSideTitle,
            year: row.year,
            quantity: row.quantity,
            genre: row.genre,
            storage: storageAssignmentDefaultsFromRow(row),
            notes: row.notes,
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
