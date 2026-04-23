'use client';

import { useActionState } from 'react';

import {
  searchSpotifyTracksAction,
  type SpotifyTrackSearchState,
} from '@/server/actions/spotify-search';

import type { SpotifyTrackSummary } from '@/server/spotify/types';

export function SpotifyTrackSearch({
  enabled,
  disabledReason,
  onPickTrack,
}: {
  enabled: boolean;
  disabledReason?: string;
  onPickTrack: (track: SpotifyTrackSummary) => void;
}) {
  const [state, action, pending] = useActionState<
    SpotifyTrackSearchState,
    FormData
  >(searchSpotifyTracksAction, null);

  if (!enabled) {
    return (
      <div className="rounded-md border border-dashed border-zinc-300 bg-zinc-50 p-3 text-xs text-zinc-600 dark:border-zinc-600 dark:bg-zinc-900/40 dark:text-zinc-400">
        <p className="font-medium text-zinc-800 dark:text-zinc-200">
          Spotify song search unavailable
        </p>
        <p className="mt-1">{disabledReason ?? 'Not configured.'}</p>
      </div>
    );
  }

  const tracks = state && 'tracks' in state ? state.tracks : null;
  const err = state && 'error' in state ? state.error : null;

  return (
    <div className="flex flex-col gap-3 rounded-md border border-zinc-200 bg-zinc-50/80 p-3 dark:border-zinc-700 dark:bg-zinc-900/50">
      <p className="text-xs font-medium text-zinc-800 dark:text-zinc-200">
        Search Spotify (songs)
      </p>
      <p className="text-xs text-zinc-600 dark:text-zinc-400">
        Find the A-side song for your 45. Pick a result to fill artist, song
        title, year, and genre when available — then save. Sleeve art can come
        from Spotify when you save without uploading your own photo.
      </p>
      <form action={action} className="flex flex-wrap gap-2">
        <input
          name="q"
          type="search"
          placeholder="Artist or song title…"
          className="min-w-[12rem] flex-1 rounded border border-zinc-300 px-2 py-1.5 text-sm dark:border-zinc-600 dark:bg-zinc-950"
          autoComplete="off"
        />
        <button
          type="submit"
          disabled={pending}
          className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm font-medium hover:bg-zinc-100 disabled:opacity-60 dark:border-zinc-600 dark:hover:bg-zinc-800"
        >
          {pending ? 'Searching…' : 'Search'}
        </button>
      </form>
      {err ? (
        <p className="text-sm text-amber-800 dark:text-amber-200" role="alert">
          {err}
        </p>
      ) : null}
      {tracks && tracks.length > 0 ? (
        <ul className="flex max-h-56 flex-col gap-1 overflow-y-auto text-sm">
          {tracks.map((t) => (
            <li key={t.id}>
              <button
                type="button"
                className="flex w-full items-center gap-2 rounded border border-zinc-200 bg-white px-2 py-1.5 text-left hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:bg-zinc-800"
                onClick={() => onPickTrack(t)}
              >
                {t.coverUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element -- Spotify CDN URL from Web API
                  <img
                    src={t.coverUrl}
                    alt=""
                    className="h-10 w-10 shrink-0 rounded object-cover"
                    width={40}
                    height={40}
                  />
                ) : (
                  <div className="h-10 w-10 shrink-0 rounded bg-zinc-200 dark:bg-zinc-700" />
                )}
                <span className="min-w-0 flex-1">
                  <span className="font-medium text-zinc-900 dark:text-zinc-100">
                    {t.artist} — {t.title}
                  </span>
                  {t.albumName ? (
                    <span className="mt-0.5 block truncate text-xs text-zinc-500">
                      {t.albumName}
                      {t.year != null ? ` · ${t.year}` : ''}
                    </span>
                  ) : t.year != null ? (
                    <span className="ml-2 tabular-nums text-zinc-500">
                      ({t.year})
                    </span>
                  ) : null}
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
