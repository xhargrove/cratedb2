import type { RankedRow, RankedRowWithBar } from '@/server/stats/types';

/**
 * Relative bar widths within one dataset (max row = 100%).
 * Empty input yields []. Zero max yields all barPct 0.
 */
export function addBarWidths(rows: RankedRow[]): RankedRowWithBar[] {
  if (rows.length === 0) return [];
  const max = Math.max(...rows.map((r) => r.count));
  if (max <= 0) {
    return rows.map((r) => ({ ...r, barPct: 0 }));
  }
  return rows.map((r) => ({
    ...r,
    barPct: Math.round((r.count / max) * 1000) / 10,
  }));
}
