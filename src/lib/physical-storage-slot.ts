import { z } from 'zod';

import type { PhysicalStorageKind } from '@/generated/prisma/client';

import {
  STORAGE_BOX_CUSTOM_LABEL_MAX,
  STORAGE_BOX_NUMBER_MAX,
  STORAGE_CRATE_MAX,
  STORAGE_SHELF_COLUMN_MAX,
  STORAGE_SHELF_ROW_MAX,
} from '@/lib/storage-constants';
import {
  composeStorageLocation,
  type NormalizedPhysicalStorage,
} from '@/lib/storage-format';

/** Wire format version for slot keys in URLs. */
export const PHYSICAL_SLOT_WIRE_VERSION = 1 as const;

/** Non-NONE storage kinds that map to a virtual container. */
export type PhysicalSlotKind = Exclude<PhysicalStorageKind, 'NONE'>;

/** Canonical slot identity (matches persisted record columns). */
export type PhysicalStorageSlot = {
  storageKind: PhysicalSlotKind;
  shelfRow: number | null;
  shelfColumn: number | null;
  crateNumber: number | null;
  boxNumber: number | null;
  boxCustomLabel: string | null;
};

const shelfWire = z.object({
  v: z.literal(1),
  k: z.literal('SHELF'),
  sr: z.number().int().min(1).max(STORAGE_SHELF_ROW_MAX),
  sc: z.number().int().min(1).max(STORAGE_SHELF_COLUMN_MAX),
});

const crateWire = z.object({
  v: z.literal(1),
  k: z.literal('CRATE'),
  crn: z.number().int().min(1).max(STORAGE_CRATE_MAX),
});

const boxWire = z
  .object({
    v: z.literal(1),
    k: z.literal('BOX'),
    bn: z.number().int().min(1).max(STORAGE_BOX_NUMBER_MAX).optional(),
    bcl: z.string().trim().min(1).max(STORAGE_BOX_CUSTOM_LABEL_MAX).optional(),
  })
  .superRefine((data, ctx) => {
    const hasBcl = Boolean(data.bcl?.trim());
    const hasBn = data.bn != null;
    if (hasBcl === hasBn) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'BOX slot requires exactly one of bn or bcl',
      });
    }
  });

const wireSchema = z.union([shelfWire, crateWire, boxWire]);

type Wire = z.infer<typeof wireSchema>;

function wireToSlot(w: Wire): PhysicalStorageSlot | null {
  if (w.k === 'SHELF') {
    return {
      storageKind: 'SHELF',
      shelfRow: w.sr,
      shelfColumn: w.sc,
      crateNumber: null,
      boxNumber: null,
      boxCustomLabel: null,
    };
  }
  if (w.k === 'CRATE') {
    return {
      storageKind: 'CRATE',
      shelfRow: null,
      shelfColumn: null,
      crateNumber: w.crn,
      boxNumber: null,
      boxCustomLabel: null,
    };
  }
  const hasLabel = Boolean(w.bcl?.trim());
  const hasNum = w.bn != null;
  if (hasLabel === hasNum) return null;
  return {
    storageKind: 'BOX',
    shelfRow: null,
    shelfColumn: null,
    crateNumber: null,
    boxNumber: hasNum ? w.bn! : null,
    boxCustomLabel: hasLabel ? w.bcl!.trim() : null,
  };
}

function slotToWire(slot: PhysicalStorageSlot): Wire | null {
  switch (slot.storageKind) {
    case 'SHELF':
      if (slot.shelfRow == null || slot.shelfColumn == null) return null;
      return {
        v: 1,
        k: 'SHELF',
        sr: slot.shelfRow,
        sc: slot.shelfColumn,
      };
    case 'CRATE':
      if (slot.crateNumber == null) return null;
      return { v: 1, k: 'CRATE', crn: slot.crateNumber };
    case 'BOX': {
      const bcl = slot.boxCustomLabel?.trim();
      if (bcl) return { v: 1, k: 'BOX', bcl };
      if (slot.boxNumber != null) return { v: 1, k: 'BOX', bn: slot.boxNumber };
      return null;
    }
    default:
      return null;
  }
}

/** Build slot from DB row shape (album record storage columns). */
export function physicalSlotFromRecordFields(row: {
  storageKind: PhysicalStorageKind;
  shelfRow: number | null;
  shelfColumn: number | null;
  crateNumber: number | null;
  boxNumber: number | null;
  boxCustomLabel: string | null;
}): PhysicalStorageSlot | null {
  if (row.storageKind === 'NONE') return null;

  if (row.storageKind === 'SHELF') {
    const n: PhysicalStorageSlot = {
      storageKind: 'SHELF',
      shelfRow: row.shelfRow,
      shelfColumn: row.shelfColumn,
      crateNumber: null,
      boxNumber: null,
      boxCustomLabel: null,
    };
    return slotToWire(n) ? n : null;
  }

  if (row.storageKind === 'CRATE') {
    const n: PhysicalStorageSlot = {
      storageKind: 'CRATE',
      shelfRow: null,
      shelfColumn: null,
      crateNumber: row.crateNumber,
      boxNumber: null,
      boxCustomLabel: null,
    };
    return slotToWire(n) ? n : null;
  }

  if (row.storageKind === 'BOX') {
    const bcl = row.boxCustomLabel?.trim();
    if (bcl) {
      const n: PhysicalStorageSlot = {
        storageKind: 'BOX',
        shelfRow: null,
        shelfColumn: null,
        crateNumber: null,
        boxNumber: null,
        boxCustomLabel: bcl,
      };
      return slotToWire(n) ? n : null;
    }
    if (row.boxNumber != null) {
      const n: PhysicalStorageSlot = {
        storageKind: 'BOX',
        shelfRow: null,
        shelfColumn: null,
        crateNumber: null,
        boxNumber: row.boxNumber,
        boxCustomLabel: null,
      };
      return slotToWire(n) ? n : null;
    }
    return null;
  }

  return null;
}

export function encodePhysicalSlotKey(slot: PhysicalStorageSlot): string {
  const w = slotToWire(slot);
  if (!w) throw new Error('Invalid physical storage slot');
  const json = JSON.stringify(w);
  return Buffer.from(json, 'utf8').toString('base64url');
}

/** Returns `null` if the segment is missing, malformed, or out of range. */
export function decodePhysicalSlotKey(
  segment: string
): PhysicalStorageSlot | null {
  if (!segment || segment.length > 512) return null;
  try {
    const json = Buffer.from(segment, 'base64url').toString('utf8');
    const parsed = JSON.parse(json) as unknown;
    const w = wireSchema.safeParse(parsed);
    if (!w.success) return null;
    return wireToSlot(w.data);
  } catch {
    return null;
  }
}

export function physicalSlotLabel(slot: PhysicalStorageSlot): string | null {
  const n: NormalizedPhysicalStorage = {
    storageKind: slot.storageKind,
    shelfRow: slot.shelfRow,
    shelfColumn: slot.shelfColumn,
    crateNumber: slot.crateNumber,
    boxNumber: slot.boxNumber,
    boxCustomLabel: slot.boxCustomLabel,
    storageLocation: null,
  };
  return composeStorageLocation(n);
}

export function physicalSlotKindLabel(kind: PhysicalSlotKind): string {
  switch (kind) {
    case 'SHELF':
      return 'Shelf';
    case 'BOX':
      return 'Box';
    case 'CRATE':
      return 'Crate';
    default:
      return 'Storage';
  }
}
