import type { Metadata } from 'next';
import Link from 'next/link';

import { CreateTwelveInchForm } from '@/components/twelve-inch/create-twelve-inch-form';
import { getSpotifyIntegrationConfig } from '@/server/spotify/config';

export const metadata: Metadata = {
  title: 'Add 12-inch single · Cratedb',
};

export default function NewTwelveInchPage() {
  const spotify = getSpotifyIntegrationConfig();

  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/dashboard/twelve-inch"
        className="text-sm text-zinc-600 underline dark:text-zinc-400"
      >
        ← 12-inch singles
      </Link>
      <CreateTwelveInchForm
        spotifySearch={
          spotify.enabled
            ? { enabled: true }
            : { enabled: false, reason: spotify.reason }
        }
      />
    </div>
  );
}
