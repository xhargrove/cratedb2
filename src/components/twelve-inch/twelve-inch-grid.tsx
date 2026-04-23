import { TwelveInchCard } from '@/components/twelve-inch/twelve-inch-card';

import type { TwelveInchDisplayRow } from '@/types/twelve-inch-display';

export function TwelveInchGrid({ rows }: { rows: TwelveInchDisplayRow[] }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {rows.map((r) => (
        <TwelveInchCard key={r.id} row={r} />
      ))}
    </div>
  );
}
