import type { RankedRowWithBar } from '@/server/stats/types';

export function RankedInsightsBlock({
  title,
  description,
  rows,
  emptyHint,
}: {
  title: string;
  description: string;
  rows: RankedRowWithBar[];
  emptyHint: string;
}) {
  const isEmpty = rows.length === 0;

  return (
    <section className="rounded-lg border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
      <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
        {title}
      </h2>
      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
        {description}
      </p>
      {isEmpty ? (
        <p className="mt-4 text-sm text-zinc-500 dark:text-zinc-400">
          {emptyHint}
        </p>
      ) : (
        <ol className="mt-4 flex list-decimal flex-col gap-3 pl-5 marker:text-xs marker:text-zinc-400">
          {rows.map((row, idx) => (
            <li key={`${idx}-${row.label}`} className="pl-1">
              <div className="flex items-baseline justify-between gap-3 text-sm">
                <span className="truncate text-zinc-900 dark:text-zinc-100">
                  {row.label}
                </span>
                <span className="shrink-0 tabular-nums text-zinc-600 dark:text-zinc-400">
                  {row.count}
                </span>
              </div>
              <div
                className="mt-1 h-2 overflow-hidden rounded bg-zinc-100 dark:bg-zinc-800"
                aria-hidden
              >
                <div
                  className="h-full rounded bg-zinc-400 dark:bg-zinc-500"
                  style={{
                    width: `${row.barPct}%`,
                    minWidth: row.count > 0 ? '2px' : '0',
                  }}
                />
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
