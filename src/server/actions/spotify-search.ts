'use server';

import { logger } from '@/lib/logger';
import { requireUser } from '@/server/auth/require-user';
import { getSpotifyIntegrationConfig } from '@/server/spotify/config';
import { searchSpotifyAlbums } from '@/server/spotify/search-albums';
import type { SpotifyAlbumSummary } from '@/server/spotify/types';

export type SpotifySearchState =
  | null
  | { error: string }
  | { albums: SpotifyAlbumSummary[] };

export async function searchSpotifyAlbumsAction(
  _prev: SpotifySearchState,
  formData: FormData
): Promise<SpotifySearchState> {
  await requireUser();

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
