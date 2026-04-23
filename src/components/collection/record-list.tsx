import Link from 'next/link';

import { recordArtworkUrl } from '@/lib/record-artwork-url';
import { RecordArtworkImage } from '@/components/records/record-artwork-image';

import type { RecordDisplayRow } from '@/types/record-display';

export function RecordList({ records }: { records: RecordDisplayRow[] }) {
  const showCopiesColumn = records.some((r) => r.quantity > 1);

  return (
    <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-zinc-200 bg-zinc-50 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400">
          <tr>
            <th className="w-14 px-2 py-3" aria-label="Cover" />
            <th className="px-4 py-3">Artist</th>
            <th className="px-4 py-3">Title</th>
            <th className="hidden px-3 py-3 sm:table-cell">Year</th>
            {showCopiesColumn ? (
              <th className="hidden px-3 py-3 md:table-cell">Copies</th>
            ) : null}
            <th className="hidden px-4 py-3 lg:table-cell">Genre</th>
            <th className="hidden px-4 py-3 xl:table-cell">Storage</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
          {records.map((r) => {
            const artworkSrc = recordArtworkUrl(
              r.id,
              Boolean(r.artworkKey),
              r.artworkUpdatedAt,
              'thumb'
            );
            return (
              <tr
                key={r.id}
                className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
              >
                <td className="w-14 px-2 py-2 align-middle">
                  <RecordArtworkImage
                    src={artworkSrc}
                    alt=""
                    className="h-10 w-10 rounded"
                    imgClassName="h-full w-full rounded object-cover"
                  />
                </td>
                <td className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-100">
                  {r.artist}
                </td>
                <td className="max-w-[200px] truncate px-4 py-3 text-zinc-700 dark:text-zinc-300">
                  <Link
                    href={`/dashboard/records/${r.id}`}
                    className="hover:underline"
                  >
                    {r.title}
                  </Link>
                </td>
                <td className="hidden px-4 py-3 text-zinc-600 dark:text-zinc-400 sm:table-cell">
                  {r.year ?? '—'}
                </td>
                {showCopiesColumn ? (
                  <td className="hidden px-3 py-3 tabular-nums text-zinc-600 dark:text-zinc-400 md:table-cell">
                    {r.quantity > 1 ? r.quantity : ''}
                  </td>
                ) : null}
                <td className="hidden max-w-[140px] truncate px-4 py-3 text-zinc-600 dark:text-zinc-400 lg:table-cell">
                  {r.genre ?? '—'}
                </td>
                <td className="hidden max-w-[140px] truncate px-4 py-3 text-zinc-600 dark:text-zinc-400 xl:table-cell">
                  {r.storageLocation ?? '—'}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
