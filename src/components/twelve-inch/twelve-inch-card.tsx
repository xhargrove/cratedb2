import Link from 'next/link';

import { twelveInchArtworkUrl } from '@/lib/twelve-inch-artwork-url';
import { RecordArtworkImage } from '@/components/records/record-artwork-image';

import type { TwelveInchDisplayRow } from '@/types/twelve-inch-display';

export function TwelveInchCard({ row }: { row: TwelveInchDisplayRow }) {
  const artworkSrc = twelveInchArtworkUrl(
    row.id,
    Boolean(row.artworkKey),
    row.artworkUpdatedAt,
    'thumb'
  );

  return (
    <Link
      href={`/dashboard/twelve-inch/${row.id}`}
      className="flex flex-col overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm transition hover:border-zinc-300 hover:shadow dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700"
    >
      <div className="relative">
        <RecordArtworkImage
          src={artworkSrc}
          alt=""
          className="aspect-square w-full"
          imgClassName="h-full w-full object-cover"
        />
        {row.quantity > 1 ? (
          <span className="absolute right-2 top-2 rounded-full bg-black/70 px-2 py-0.5 text-xs font-semibold tabular-nums text-white">
            ×{row.quantity}
          </span>
        ) : null}
      </div>
      <div className="flex flex-col p-4">
        <span className="font-semibold text-zinc-900 dark:text-zinc-100">
          {row.artist}
        </span>
        <span className="mt-1 text-sm text-zinc-700 dark:text-zinc-300">
          {row.title}
        </span>
        {row.bSideTitle ? (
          <span className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            B-side: {row.bSideTitle}
          </span>
        ) : null}
        <dl className="mt-3 space-y-1 text-xs text-zinc-500 dark:text-zinc-400">
          {row.quantity > 1 ? (
            <div>
              <dt className="inline font-medium">Copies</dt>{' '}
              <dd className="inline tabular-nums">{row.quantity}</dd>
            </div>
          ) : null}
          {row.year != null ? (
            <div>
              <dt className="inline font-medium">Year</dt>{' '}
              <dd className="inline">{row.year}</dd>
            </div>
          ) : null}
          {row.genre ? (
            <div>
              <dt className="inline font-medium">Genre</dt>{' '}
              <dd className="inline">{row.genre}</dd>
            </div>
          ) : null}
          {row.storageLocation ? (
            <div>
              <dt className="inline font-medium">Storage</dt>{' '}
              <dd className="inline">{row.storageLocation}</dd>
            </div>
          ) : null}
        </dl>
      </div>
    </Link>
  );
}
