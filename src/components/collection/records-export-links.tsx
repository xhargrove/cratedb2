'use client';

import { ExportShareBar } from '@/components/collection/export-share-bar';

/** Download + system Share (AirDrop, Messages, … where supported). */
export function RecordsExportLinks() {
  return (
    <ExportShareBar
      apiBase="/api/records/export"
      filePrefix="cratedb-records"
    />
  );
}
