import { describe, expect, it } from 'vitest';

import { addBarWidths } from '@/server/stats/shape';

describe('addBarWidths', () => {
  it('returns [] for empty rows', () => {
    expect(addBarWidths([])).toEqual([]);
  });

  it('maps max count to barPct 100', () => {
    expect(
      addBarWidths([
        { label: 'A', count: 10 },
        { label: 'B', count: 5 },
      ])
    ).toEqual([
      { label: 'A', count: 10, barPct: 100 },
      { label: 'B', count: 5, barPct: 50 },
    ]);
  });

  it('uses 0 barPct when all counts are zero', () => {
    expect(
      addBarWidths([
        { label: 'A', count: 0 },
        { label: 'B', count: 0 },
      ])
    ).toEqual([
      { label: 'A', count: 0, barPct: 0 },
      { label: 'B', count: 0, barPct: 0 },
    ]);
  });

  it('rounds barPct to one decimal', () => {
    const out = addBarWidths([
      { label: 'x', count: 3 },
      { label: 'y', count: 1 },
    ]);
    expect(out[1]?.barPct).toBe(33.3);
  });
});
