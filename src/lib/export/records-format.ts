import { escapeCsvField } from '@/lib/export/singles-format';
import type { RecordExportRow } from '@/types/record-export';

function cell(v: string | number | null | undefined): string {
  if (v === null || v === undefined) return '';
  return String(v);
}

const CSV_HEADER =
  'id,artist,title,year,genre,storage,notes,copies,spotify_album_id,metadata_source,metadata_source_id,created_at';

export function formatRecordsAsCsv(rows: RecordExportRow[]): string {
  const lines = [CSV_HEADER];
  for (const r of rows) {
    lines.push(
      [
        escapeCsvField(r.id),
        escapeCsvField(r.artist),
        escapeCsvField(r.title),
        escapeCsvField(cell(r.year)),
        escapeCsvField(cell(r.genre)),
        escapeCsvField(cell(r.storageLocation)),
        escapeCsvField(cell(r.notes)),
        escapeCsvField(String(r.quantity)),
        escapeCsvField(cell(r.spotifyAlbumId)),
        escapeCsvField(cell(r.metadataSource)),
        escapeCsvField(cell(r.metadataSourceId)),
        escapeCsvField(r.createdAt.toISOString()),
      ].join(',')
    );
  }
  return lines.join('\r\n') + '\r\n';
}

export function formatRecordsAsTsv(rows: RecordExportRow[]): string {
  const header =
    'id\tartist\ttitle\tyear\tgenre\tstorage\tnotes\tcopies\tspotify_album_id\tmetadata_source\tmetadata_source_id\tcreated_at';
  const lines = [header];
  for (const r of rows) {
    const esc = (s: string) => s.replace(/\t/g, ' ').replace(/\r?\n/g, ' ');
    lines.push(
      [
        esc(r.id),
        esc(r.artist),
        esc(r.title),
        esc(cell(r.year)),
        esc(cell(r.genre)),
        esc(cell(r.storageLocation)),
        esc(cell(r.notes)),
        esc(String(r.quantity)),
        esc(cell(r.spotifyAlbumId)),
        esc(cell(r.metadataSource)),
        esc(cell(r.metadataSourceId)),
        esc(r.createdAt.toISOString()),
      ].join('\t')
    );
  }
  return lines.join('\n') + '\n';
}
