import { RecordCard } from '@/components/collection/record-card';

import type { RecordDisplayRow } from '@/types/record-display';

export function RecordGrid({ records }: { records: RecordDisplayRow[] }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {records.map((r) => (
        <RecordCard key={r.id} record={r} />
      ))}
    </div>
  );
}
