import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { EditRecordForm } from '@/components/records/edit-record-form';
import { RecordEnrichmentPanel } from '@/components/records/record-enrichment-panel';
import { getEnrichmentConfig } from '@/server/enrichment/config';
import { getSpotifyIntegrationConfig } from '@/server/spotify/config';
import { requireUser } from '@/server/auth/require-user';
import { getRecordByIdForOwner } from '@/server/records/get-by-id-for-owner';

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `Edit record · Cratedb`,
    description: `Edit ${id}`,
  };
}

export default async function EditRecordPage({ params }: Props) {
  const { id } = await params;
  const user = await requireUser();

  const record = await getRecordByIdForOwner(id, user.id);
  if (!record) {
    notFound();
  }

  const enrichment = getEnrichmentConfig();
  const spotify = getSpotifyIntegrationConfig();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-4">
        <Link
          href={`/dashboard/records/${record.id}`}
          className="text-sm text-zinc-600 underline dark:text-zinc-400"
        >
          ← Back to record
        </Link>
      </div>
      <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
        Edit record
      </h1>
      <EditRecordForm
        record={record}
        spotifySearch={
          spotify.enabled
            ? { enabled: true }
            : { enabled: false, reason: spotify.reason }
        }
      />
      <RecordEnrichmentPanel
        recordId={record.id}
        enrichmentEnabled={enrichment.enabled}
        disabledReason={enrichment.enabled ? undefined : enrichment.reason}
      />
      {record.metadataSource ? (
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Last enriched from {record.metadataSource}
          {record.metadataSourceId
            ? ` (${record.metadataSourceId.slice(0, 8)}…)`
            : ''}
          {record.metadataAppliedAt
            ? ` · ${record.metadataAppliedAt.toISOString().slice(0, 10)}`
            : ''}
        </p>
      ) : null}
    </div>
  );
}
