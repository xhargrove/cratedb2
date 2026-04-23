import { RecordCard } from '@/components/collection/record-card';

import type { PublicCollectionRecordRow } from '@/server/records/list-public-collection';
import type { RecordDisplayRow } from '@/types/record-display';

function toDisplayRows(rows: PublicCollectionRecordRow[]): RecordDisplayRow[] {
  return rows.map((r) => ({
    id: r.id,
    artist: r.artist,
    title: r.title,
    year: r.year,
    genre: r.genre,
    storageLocation: null,
    artworkKey: r.artworkKey,
    artworkUpdatedAt: r.artworkUpdatedAt,
  }));
}

export function PublicCollectionGrid({
  records,
}: {
  records: PublicCollectionRecordRow[];
}) {
  const display = toDisplayRows(records);
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {display.map((record) => (
        <RecordCard key={record.id} record={record} detailHref={null} />
      ))}
    </div>
  );
}
