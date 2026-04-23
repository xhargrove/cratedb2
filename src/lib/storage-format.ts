import type { PhysicalStorageKind } from '@/generated/prisma/client';

export type NormalizedPhysicalStorage = {
  storageKind: PhysicalStorageKind;
  shelfRow: number | null;
  shelfColumn: number | null;
  crateNumber: number | null;
  boxNumber: number | null;
  boxCustomLabel: string | null;
  /** Facet/search string — mirrors structured fields when kind ≠ NONE */
  storageLocation: string | null;
};

export function composeStorageLocation(
  n: NormalizedPhysicalStorage
): string | null {
  switch (n.storageKind) {
    case 'NONE':
      return null;
    case 'SHELF':
      if (n.shelfRow == null || n.shelfColumn == null) return null;
      return `Shelf · Row ${n.shelfRow} · Column ${n.shelfColumn}`;
    case 'CRATE':
      if (n.crateNumber == null) return null;
      return `Crate ${n.crateNumber}`;
    case 'BOX':
      if (n.boxCustomLabel?.trim()) {
        return `Box · ${n.boxCustomLabel.trim()}`;
      }
      if (n.boxNumber != null) {
        return `Box ${n.boxNumber}`;
      }
      return null;
    default:
      return null;
  }
}
