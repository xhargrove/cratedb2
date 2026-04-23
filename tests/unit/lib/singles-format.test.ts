import { describe, expect, it } from 'vitest';

import {
  escapeCsvField,
  formatSinglesAsCsv,
  formatSinglesAsTsv,
} from '@/lib/export/singles-format';
import type { SingleExportRow } from '@/types/single-export';

const baseDate = new Date('2024-06-15T12:00:00.000Z');

const row = (overrides: Partial<SingleExportRow> = {}): SingleExportRow => ({
  id: 'c1',
  artist: 'A',
  title: 'T',
  bSideTitle: null,
  year: 1970,
  genre: 'Funk',
  storageLocation: 'Crate 1',
  notes: null,
  quantity: 1,
  spotifyTrackId: null,
  createdAt: baseDate,
  ...overrides,
});

describe('singles export format', () => {
  it('escapes csv fields with quotes and commas', () => {
    expect(escapeCsvField('a,b')).toBe('"a,b"');
    expect(escapeCsvField('say "hi"')).toBe('"say ""hi"""');
  });

  it('formats csv with header', () => {
    const csv = formatSinglesAsCsv([row({ artist: 'X', title: 'Y' })]);
    expect(csv).toContain('id,artist,title');
    expect(csv).toContain('c1,X,Y');
    expect(csv).toContain('1970');
    expect(csv).toContain('2024-06-15T12:00:00.000Z');
  });

  it('formats tsv without breaking on tabs in data', () => {
    const tsv = formatSinglesAsTsv([row({ notes: 'has\ttab', artist: 'A,B' })]);
    expect(tsv).not.toContain('\thas\t');
    expect(tsv).toContain('has tab');
  });
});
