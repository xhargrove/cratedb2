import type { PhysicalStorageKind } from '@/generated/prisma/client';

/** Pass-through for `StorageAssignmentFields` from DB / create (all optional). */
export type StorageAssignmentDefaults = {
  storageKind?: PhysicalStorageKind;
  shelfRow?: number | null;
  shelfColumn?: number | null;
  crateNumber?: number | null;
  boxNumber?: number | null;
  boxCustomLabel?: string | null;
  /** Free-text `storageLocation` when `storageKind` is still NONE (legacy or cleared). */
  legacyStorageLocation?: string | null;
};

type RowWithStorage = {
  storageKind: PhysicalStorageKind;
  shelfRow: number | null;
  shelfColumn: number | null;
  crateNumber: number | null;
  boxNumber: number | null;
  boxCustomLabel: string | null;
  storageLocation: string | null;
};

/** Build form defaults from a collection row (legacy free-text surfaced when kind is NONE). */
export function storageAssignmentDefaultsFromRow(
  row: RowWithStorage
): StorageAssignmentDefaults {
  const legacy =
    row.storageKind === 'NONE' && row.storageLocation?.trim()
      ? row.storageLocation.trim()
      : undefined;
  return {
    storageKind: row.storageKind,
    shelfRow: row.shelfRow,
    shelfColumn: row.shelfColumn,
    crateNumber: row.crateNumber,
    boxNumber: row.boxNumber,
    boxCustomLabel: row.boxCustomLabel,
    legacyStorageLocation: legacy,
  };
}
