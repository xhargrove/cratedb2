import type { SingleExportRow } from '@/types/single-export';

export function escapeCsvField(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function cell(v: string | number | null | undefined): string {
  if (v === null || v === undefined) return '';
  return String(v);
}

const CSV_HEADER =
  'id,artist,title,b_side,year,genre,storage,notes,copies,spotify_track_id,created_at';

/**
 * RFC 4180-style CSV with header row.
 */
export function formatSinglesAsCsv(rows: SingleExportRow[]): string {
  const lines = [CSV_HEADER];
  for (const r of rows) {
    const created = r.createdAt.toISOString();
    lines.push(
      [
        escapeCsvField(r.id),
        escapeCsvField(r.artist),
        escapeCsvField(r.title),
        escapeCsvField(cell(r.bSideTitle)),
        escapeCsvField(cell(r.year)),
        escapeCsvField(cell(r.genre)),
        escapeCsvField(cell(r.storageLocation)),
        escapeCsvField(cell(r.notes)),
        escapeCsvField(String(r.quantity)),
        escapeCsvField(cell(r.spotifyTrackId)),
        escapeCsvField(created),
      ].join(',')
    );
  }
  return lines.join('\r\n') + '\r\n';
}

/**
 * Tab-separated values (opens cleanly in Excel / Sheets); .txt extension.
 */
export function formatSinglesAsTsv(rows: SingleExportRow[]): string {
  const header =
    'id\tartist\ttitle\tb_side\tyear\tgenre\tstorage\tnotes\tcopies\tspotify_track_id\tcreated_at';
  const lines = [header];
  for (const r of rows) {
    const esc = (s: string) => s.replace(/\t/g, ' ').replace(/\r?\n/g, ' ');
    lines.push(
      [
        esc(r.id),
        esc(r.artist),
        esc(r.title),
        esc(cell(r.bSideTitle)),
        esc(cell(r.year)),
        esc(cell(r.genre)),
        esc(cell(r.storageLocation)),
        esc(cell(r.notes)),
        esc(String(r.quantity)),
        esc(cell(r.spotifyTrackId)),
        esc(r.createdAt.toISOString()),
      ].join('\t')
    );
  }
  return lines.join('\n') + '\n';
}
