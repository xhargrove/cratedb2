import type { Metadata } from 'next';
import Link from 'next/link';

import { CreateSingleForm } from '@/components/singles/create-single-form';
import { getSpotifyIntegrationConfig } from '@/server/spotify/config';

export const metadata: Metadata = {
  title: 'Add single · Cratedb',
};

export default function NewSinglePage() {
  const spotify = getSpotifyIntegrationConfig();

  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/dashboard/singles"
        className="text-sm text-zinc-600 underline dark:text-zinc-400"
      >
        ← Singles
      </Link>
      <CreateSingleForm
        spotifySearch={
          spotify.enabled
            ? { enabled: true }
            : { enabled: false, reason: spotify.reason }
        }
      />
    </div>
  );
}
