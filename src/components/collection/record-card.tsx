import Link from 'next/link';

import { recordArtworkUrl } from '@/lib/record-artwork-url';
import { RecordArtworkImage } from '@/components/records/record-artwork-image';

import type { RecordDisplayRow } from '@/types/record-display';

type RecordCardProps = {
  record: RecordDisplayRow;
  /** Omit link (e.g. public profile grid). Default: owner detail page. */
  detailHref?: string | null;
};

export function RecordCard({ record, detailHref }: RecordCardProps) {
  const artworkSrc = recordArtworkUrl(
    record.id,
    Boolean(record.artworkKey),
    record.artworkUpdatedAt,
    'thumb'
  );

  const inner = (
    <>
      <div className="relative">
        <RecordArtworkImage
          src={artworkSrc}
          alt=""
          className="aspect-square w-full"
          imgClassName="h-full w-full object-cover"
        />
        {record.quantity > 1 ? (
          <span className="absolute right-2 top-2 rounded-full bg-black/70 px-2 py-0.5 text-xs font-semibold tabular-nums text-white">
            ×{record.quantity}
          </span>
        ) : null}
      </div>
      <div className="flex flex-col p-4">
        <span className="font-semibold text-zinc-900 dark:text-zinc-100">
          {record.artist}
        </span>
        <span className="mt-1 text-sm text-zinc-700 dark:text-zinc-300">
          {record.title}
        </span>
        <dl className="mt-3 space-y-1 text-xs text-zinc-500 dark:text-zinc-400">
          {record.quantity > 1 ? (
            <div>
              <dt className="inline font-medium">Copies</dt>{' '}
              <dd className="inline tabular-nums">{record.quantity}</dd>
            </div>
          ) : null}
          {record.year != null ? (
            <div>
              <dt className="inline font-medium">Year</dt>{' '}
              <dd className="inline">{record.year}</dd>
            </div>
          ) : null}
          {record.genre ? (
            <div>
              <dt className="inline font-medium">Genre</dt>{' '}
              <dd className="inline">{record.genre}</dd>
            </div>
          ) : null}
          {record.storageLocation ? (
            <div>
              <dt className="inline font-medium">Storage</dt>{' '}
              <dd className="inline">{record.storageLocation}</dd>
            </div>
          ) : null}
        </dl>
      </div>
    </>
  );

  const cardClass =
    'flex flex-col overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900';

  if (detailHref === null) {
    return <div className={cardClass}>{inner}</div>;
  }

  return (
    <Link
      href={detailHref ?? `/dashboard/records/${record.id}`}
      className={`${cardClass} transition hover:border-zinc-300 hover:shadow dark:hover:border-zinc-700`}
    >
      {inner}
    </Link>
  );
}
