'use client';

import { ExportShareBar } from '@/components/collection/export-share-bar';

/** Download + system Share (AirDrop, Messages, … where supported). */
export function SinglesExportLinks() {
  return (
    <ExportShareBar
      apiBase="/api/singles/export"
      filePrefix="cratedb-singles"
    />
  );
}
