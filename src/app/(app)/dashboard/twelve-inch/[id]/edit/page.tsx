import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { EditTwelveInchForm } from '@/components/twelve-inch/edit-twelve-inch-form';
import { requireUser } from '@/server/auth/require-user';
import { getTwelveInchByIdForOwner } from '@/server/twelve-inch-singles/get-by-id-for-owner';
import { getSpotifyIntegrationConfig } from '@/server/spotify/config';

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: `Edit 12-inch · Cratedb`,
  };
}

export default async function EditTwelveInchPage({ params }: Props) {
  const { id } = await params;
  const user = await requireUser();

  const row = await getTwelveInchByIdForOwner(id, user.id);
  if (!row) {
    notFound();
  }

  const spotify = getSpotifyIntegrationConfig();

  return (
    <div className="flex flex-col gap-6">
      <Link
        href={`/dashboard/twelve-inch/${row.id}`}
        className="text-sm text-zinc-600 underline dark:text-zinc-400"
      >
        ← Back
      </Link>
      <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
        Edit 12-inch single
      </h1>
      <EditTwelveInchForm
        row={row}
        spotifySearch={
          spotify.enabled
            ? { enabled: true }
            : { enabled: false, reason: spotify.reason }
        }
      />
    </div>
  );
}
