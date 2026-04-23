import Link from 'next/link';

import { singleArtworkUrl } from '@/lib/single-artwork-url';
import { RecordArtworkImage } from '@/components/records/record-artwork-image';

import type { SingleDisplayRow } from '@/types/single-display';

export function SingleCard({ single }: { single: SingleDisplayRow }) {
  const artworkSrc = singleArtworkUrl(
    single.id,
    Boolean(single.artworkKey),
    single.artworkUpdatedAt,
    'thumb'
  );

  return (
    <Link
      href={`/dashboard/singles/${single.id}`}
      className="flex flex-col overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm transition hover:border-zinc-300 hover:shadow dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700"
    >
      <div className="relative">
        <RecordArtworkImage
          src={artworkSrc}
          alt=""
          className="aspect-square w-full"
          imgClassName="h-full w-full object-cover"
        />
        {single.quantity > 1 ? (
          <span className="absolute right-2 top-2 rounded-full bg-black/70 px-2 py-0.5 text-xs font-semibold tabular-nums text-white">
            ×{single.quantity}
          </span>
        ) : null}
      </div>
      <div className="flex flex-col p-4">
        <span className="font-semibold text-zinc-900 dark:text-zinc-100">
          {single.artist}
        </span>
        <span className="mt-1 text-sm text-zinc-700 dark:text-zinc-300">
          {single.title}
        </span>
        {single.bSideTitle ? (
          <span className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            B-side: {single.bSideTitle}
          </span>
        ) : null}
        <dl className="mt-3 space-y-1 text-xs text-zinc-500 dark:text-zinc-400">
          {single.quantity > 1 ? (
            <div>
              <dt className="inline font-medium">Copies</dt>{' '}
              <dd className="inline tabular-nums">{single.quantity}</dd>
            </div>
          ) : null}
          {single.year != null ? (
            <div>
              <dt className="inline font-medium">Year</dt>{' '}
              <dd className="inline">{single.year}</dd>
            </div>
          ) : null}
          {single.genre ? (
            <div>
              <dt className="inline font-medium">Genre</dt>{' '}
              <dd className="inline">{single.genre}</dd>
            </div>
          ) : null}
          {single.storageLocation ? (
            <div>
              <dt className="inline font-medium">Storage</dt>{' '}
              <dd className="inline">{single.storageLocation}</dd>
            </div>
          ) : null}
        </dl>
      </div>
    </Link>
  );
}
