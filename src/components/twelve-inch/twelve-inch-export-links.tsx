'use client';

import { ExportShareBar } from '@/components/collection/export-share-bar';

/** Download + system Share (AirDrop, Messages, … where supported). */
export function TwelveInchExportLinks() {
  return (
    <ExportShareBar
      apiBase="/api/twelve-inch/export"
      filePrefix="cratedb-twelve-inch"
    />
  );
}
