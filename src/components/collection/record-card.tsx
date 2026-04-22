import Link from 'next/link';

import type { RecordDisplayRow } from '@/types/record-display';

export function RecordCard({ record }: { record: RecordDisplayRow }) {
  return (
    <Link
      href={`/dashboard/records/${record.id}`}
      className="flex flex-col rounded-lg border border-zinc-200 bg-white p-4 shadow-sm transition hover:border-zinc-300 hover:shadow dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700"
    >
      <span className="font-semibold text-zinc-900 dark:text-zinc-100">
        {record.artist}
      </span>
      <span className="mt-1 text-sm text-zinc-700 dark:text-zinc-300">
        {record.title}
      </span>
      <dl className="mt-3 space-y-1 text-xs text-zinc-500 dark:text-zinc-400">
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
    </Link>
  );
}
