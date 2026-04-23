import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { recordArtworkUrl } from '@/lib/record-artwork-url';
import { DeleteRecordForm } from '@/components/records/delete-record-form';
import { RecordArtworkImage } from '@/components/records/record-artwork-image';
import { requireUser } from '@/server/auth/require-user';
import { getRecordByIdForOwner } from '@/server/records/get-by-id-for-owner';

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `Record ${id.slice(0, 8)}… · Cratedb`,
  };
}

export default async function RecordDetailPage({ params }: Props) {
  const { id } = await params;
  const user = await requireUser();

  const record = await getRecordByIdForOwner(id, user.id);
  if (!record) {
    notFound();
  }

  const artworkSrc = recordArtworkUrl(
    record.id,
    Boolean(record.artworkKey),
    record.artworkUpdatedAt
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Link
          href="/dashboard/records"
          className="text-sm text-zinc-600 underline dark:text-zinc-400"
        >
          ← Records
        </Link>
        <div className="flex flex-col items-end gap-2 sm:flex-row sm:items-center sm:gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href={`/dashboard/records/${record.id}/edit`}
              className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm font-medium hover:bg-zinc-100 dark:border-zinc-600 dark:hover:bg-zinc-800"
            >
              Edit
            </Link>
            <DeleteRecordForm recordId={record.id} />
          </div>
          <Link
            href={`/dashboard/wantlist/new?artist=${encodeURIComponent(record.artist)}&title=${encodeURIComponent(record.title)}${record.year != null ? `&year=${record.year}` : ''}`}
            className="text-xs text-zinc-600 underline dark:text-zinc-400"
          >
            Prefill wantlist from this album
          </Link>
        </div>
      </div>

      <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
        <RecordArtworkImage
          src={artworkSrc}
          alt={`Album artwork for ${record.title}`}
          className="w-full shrink-0 rounded-lg sm:h-56 sm:w-56"
          imgClassName="h-full w-full rounded-lg object-cover"
        />
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
            {record.artist} — {record.title}
          </h1>
          <dl className="mt-4 grid gap-2 text-sm text-zinc-700 dark:text-zinc-300">
            {record.quantity > 1 ? (
              <div>
                <dt className="inline font-medium text-zinc-500">Copies</dt>{' '}
                <dd className="inline tabular-nums">{record.quantity}</dd>
              </div>
            ) : null}
            {record.year != null ? (
              <div>
                <dt className="inline font-medium text-zinc-500">Year</dt>{' '}
                <dd className="inline">{record.year}</dd>
              </div>
            ) : null}
            {record.genre ? (
              <div>
                <dt className="inline font-medium text-zinc-500">Genre</dt>{' '}
                <dd className="inline">{record.genre}</dd>
              </div>
            ) : null}
            {record.storageLocation ? (
              <div>
                <dt className="inline font-medium text-zinc-500">Storage</dt>{' '}
                <dd className="inline">{record.storageLocation}</dd>
              </div>
            ) : null}
            {record.notes ? (
              <div>
                <dt className="mt-2 font-medium text-zinc-500">Notes</dt>
                <dd className="mt-1 whitespace-pre-wrap">{record.notes}</dd>
              </div>
            ) : null}
          </dl>
        </div>
      </div>
    </div>
  );
}
