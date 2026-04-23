import { describe, expect, it } from 'vitest';

import {
  fallbackExportFilename,
  filenameFromContentDisposition,
} from '@/lib/share-export';

describe('share-export helpers', () => {
  it('parses filename from Content-Disposition', () => {
    const res = new Response(null, {
      headers: {
        'Content-Disposition':
          'attachment; filename="cratedb-records-2026-04-29-partial.csv"',
      },
    });
    expect(filenameFromContentDisposition(res, 'x.csv')).toBe(
      'cratedb-records-2026-04-29-partial.csv'
    );
  });

  it('falls back when header missing', () => {
    const res = new Response(null);
    expect(filenameFromContentDisposition(res, 'y.txt')).toBe('y.txt');
  });

  it('builds fallback export name', () => {
    const n = fallbackExportFilename('cratedb-singles', 'pdf');
    expect(n.startsWith('cratedb-singles-')).toBe(true);
    expect(n.endsWith('.pdf')).toBe(true);
  });
});
