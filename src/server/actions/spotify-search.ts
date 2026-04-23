'use server';

import { logger } from '@/lib/logger';
import { requireUserForServerAction } from '@/server/auth/action-auth-gate';
import { getSpotifyIntegrationConfig } from '@/server/spotify/config';
import { searchSpotifyAlbums } from '@/server/spotify/search-albums';
import { searchSpotifyTracks } from '@/server/spotify/search-tracks';
import type {
  SpotifyAlbumSummary,
  SpotifyTrackSummary,
} from '@/server/spotify/types';

export type SpotifySearchState =
  | null
  | { error: string }
  | { albums: SpotifyAlbumSummary[] };

export type SpotifyTrackSearchState =
  | null
  | { error: string }
  | { tracks: SpotifyTrackSummary[] };

export async function searchSpotifyAlbumsAction(
  _prev: SpotifySearchState,
  formData: FormData
): Promise<SpotifySearchState> {
  const auth = await requireUserForServerAction();
  if (!auth.ok) return { error: auth.error };

  const cfg = getSpotifyIntegrationConfig();
  if (!cfg.enabled) {
    return { error: cfg.reason };
  }

  const raw = formData.get('q');
  const q = typeof raw === 'string' ? raw : '';

  try {
    const result = await searchSpotifyAlbums({ cfg, query: q });
    if (!result.ok) {
      return { error: result.error };
    }
    if (result.albums.length === 0) {
      return { error: 'No albums found. Try different words.' };
    }
    return { albums: result.albums };
  } catch (e) {
    logger.error({ err: e }, 'searchSpotifyAlbumsAction');
    return { error: 'Something went wrong while searching Spotify.' };
  }
}

export async function searchSpotifyTracksAction(
  _prev: SpotifyTrackSearchState,
  formData: FormData
): Promise<SpotifyTrackSearchState> {
  const auth = await requireUserForServerAction();
  if (!auth.ok) return { error: auth.error };

  const cfg = getSpotifyIntegrationConfig();
  if (!cfg.enabled) {
    return { error: cfg.reason };
  }

  const raw = formData.get('q');
  const q = typeof raw === 'string' ? raw : '';

  try {
    const result = await searchSpotifyTracks({ cfg, query: q });
    if (!result.ok) {
      return { error: result.error };
    }
    if (result.tracks.length === 0) {
      return { error: 'No tracks found. Try different words.' };
    }
    return { tracks: result.tracks };
  } catch (e) {
    logger.error({ err: e }, 'searchSpotifyTracksAction');
    return { error: 'Something went wrong while searching Spotify.' };
  }
}
