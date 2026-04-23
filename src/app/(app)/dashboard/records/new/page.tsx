import type { Metadata } from 'next';
import Link from 'next/link';

import { CreateRecordForm } from '@/components/records/create-record-form';
import { getSpotifyIntegrationConfig } from '@/server/spotify/config';

export const metadata: Metadata = {
  title: 'New record · Cratedb',
};

export default async function NewRecordPage() {
  const spotify = getSpotifyIntegrationConfig();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-4">
        <Link
          href="/dashboard/records"
          className="text-sm text-zinc-600 underline dark:text-zinc-400"
        >
          ← Records
        </Link>
      </div>
      <CreateRecordForm
        spotifySearch={
          spotify.enabled
            ? { enabled: true }
            : { enabled: false, reason: spotify.reason }
        }
      />
    </div>
  );
}
