import { SingleCard } from '@/components/singles/single-card';

import type { SingleDisplayRow } from '@/types/single-display';

export function SinglesGrid({ singles }: { singles: SingleDisplayRow[] }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {singles.map((s) => (
        <SingleCard key={s.id} single={s} />
      ))}
    </div>
  );
}
