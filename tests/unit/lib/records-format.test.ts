import { describe, expect, it } from 'vitest';

import {
  formatRecordsAsCsv,
  formatRecordsAsTsv,
} from '@/lib/export/records-format';
import type { RecordExportRow } from '@/types/record-export';

const baseDate = new Date('2024-06-15T12:00:00.000Z');

const row = (overrides: Partial<RecordExportRow> = {}): RecordExportRow => ({
  id: 'r1',
  artist: 'A',
  title: 'Album',
  year: 1971,
  genre: 'Soul',
  storageLocation: 'Shelf',
  notes: null,
  quantity: 1,
  spotifyAlbumId: null,
  metadataSource: null,
  metadataSourceId: null,
  createdAt: baseDate,
  ...overrides,
});

describe('records export format', () => {
  it('formats csv with header', () => {
    const csv = formatRecordsAsCsv([
      row({ artist: 'X', title: 'Y', notes: 'hello' }),
    ]);
    expect(csv).toContain('id,artist,title');
    expect(csv).toContain('r1,X,Y');
    expect(csv).toContain('1971');
    expect(csv).toContain('Soul');
    expect(csv).toContain(',1,'); // copies column
    expect(csv).toContain('hello');
    expect(csv).toContain('2024-06-15T12:00:00.000Z');
  });

  it('formats tsv without breaking on tabs in data', () => {
    const tsv = formatRecordsAsTsv([
      row({ notes: 'has\ttab', artist: 'A,B', metadataSourceId: 'mbid-1' }),
    ]);
    expect(tsv).not.toContain('\thas\t');
    expect(tsv).toContain('has tab');
    expect(tsv).toContain('mbid-1');
  });
});
