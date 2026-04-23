import { revalidatePath } from 'next/cache';

import type { PhysicalStorageKind } from '@/generated/prisma/client';
import {
  encodePhysicalSlotKey,
  physicalSlotFromRecordFields,
} from '@/lib/physical-storage-slot';

/** Storage columns shared by albums, 45s, and 12-inch singles. */
export type PhysicalSlotPersistedRow = {
  storageKind: PhysicalStorageKind;
  shelfRow: number | null;
  shelfColumn: number | null;
  crateNumber: number | null;
  boxNumber: number | null;
  boxCustomLabel: string | null;
};

export function revalidatePhysicalSlotPagesFromRow(
  row: PhysicalSlotPersistedRow
): void {
  const slot = physicalSlotFromRecordFields(row);
  if (!slot) return;
  try {
    revalidatePath('/dashboard/containers');
    revalidatePath(`/dashboard/containers/${encodePhysicalSlotKey(slot)}`);
  } catch {
    /* ignore */
  }
}
