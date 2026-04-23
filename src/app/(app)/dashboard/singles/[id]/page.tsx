import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { singleArtworkUrl } from '@/lib/single-artwork-url';
import { DeleteSingleForm } from '@/components/singles/delete-single-form';
import { RecordArtworkImage } from '@/components/records/record-artwork-image';
import { requireUser } from '@/server/auth/require-user';
import { getSingleByIdForOwner } from '@/server/singles/get-by-id-for-owner';

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `Single ${id.slice(0, 8)}… · Cratedb`,
  };
}

export default async function SingleDetailPage({ params }: Props) {
  const { id } = await params;
  const user = await requireUser();

  const single = await getSingleByIdForOwner(id, user.id);
  if (!single) {
    notFound();
  }

  const artworkSrc = singleArtworkUrl(
    single.id,
    Boolean(single.artworkKey),
    single.artworkUpdatedAt,
    'medium'
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Link
          href="/dashboard/singles"
          className="text-sm text-zinc-600 underline dark:text-zinc-400"
        >
          ← Singles
        </Link>
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href={`/dashboard/singles/${single.id}/edit`}
            className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm font-medium hover:bg-zinc-100 dark:border-zinc-600 dark:hover:bg-zinc-800"
          >
            Edit
          </Link>
          <DeleteSingleForm singleId={single.id} />
        </div>
      </div>

      <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
        <RecordArtworkImage
          src={artworkSrc}
          alt=""
          className="w-full shrink-0 rounded-lg sm:h-56 sm:w-56"
          imgClassName="h-full w-full rounded-lg object-cover"
        />
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            45 / single
          </p>
          <h1 className="mt-1 text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
            {single.artist} — {single.title}
          </h1>
          {single.bSideTitle ? (
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              <span className="font-medium text-zinc-700 dark:text-zinc-300">
                B-side:
              </span>{' '}
              {single.bSideTitle}
            </p>
          ) : null}
          <dl className="mt-4 grid gap-2 text-sm text-zinc-700 dark:text-zinc-300">
            {single.quantity > 1 ? (
              <div>
                <dt className="inline font-medium text-zinc-500">Copies</dt>{' '}
                <dd className="inline tabular-nums">{single.quantity}</dd>
              </div>
            ) : null}
            {single.year != null ? (
              <div>
                <dt className="inline font-medium text-zinc-500">Year</dt>{' '}
                <dd className="inline">{single.year}</dd>
              </div>
            ) : null}
            {single.genre ? (
              <div>
                <dt className="inline font-medium text-zinc-500">Genre</dt>{' '}
                <dd className="inline">{single.genre}</dd>
              </div>
            ) : null}
            {single.storageLocation ? (
              <div>
                <dt className="inline font-medium text-zinc-500">Storage</dt>{' '}
                <dd className="inline">{single.storageLocation}</dd>
              </div>
            ) : null}
            {single.notes ? (
              <div>
                <dt className="mt-2 font-medium text-zinc-500">Notes</dt>
                <dd className="mt-1 whitespace-pre-wrap">{single.notes}</dd>
              </div>
            ) : null}
          </dl>
        </div>
      </div>
    </div>
  );
}
