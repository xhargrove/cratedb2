import { COLLECTION_LIST_MAX } from '@/lib/collection-constants';
import {
  decodePhysicalSlotKey,
  encodePhysicalSlotKey,
  physicalSlotFromRecordFields,
  physicalSlotLabel,
  type PhysicalStorageSlot,
} from '@/lib/physical-storage-slot';
import { prisma } from '@/db/client';
import type {
  PhysicalStorageKind,
  Prisma,
} from '@/generated/prisma/client';

export type PhysicalSlotSummary = {
  slotKey: string;
  slot: PhysicalStorageSlot;
  label: string;
  /** Rows across albums, 45s, and 12-inch singles in this slot. */
  itemCount: number;
};

const STORAGE_SELECT = {
  storageKind: true,
  shelfRow: true,
  shelfColumn: true,
  crateNumber: true,
  boxNumber: true,
  boxCustomLabel: true,
} as const;

type StorageRow = {
  storageKind: PhysicalStorageKind;
  shelfRow: number | null;
  shelfColumn: number | null;
  crateNumber: number | null;
  boxNumber: number | null;
  boxCustomLabel: string | null;
};

function whereForOwnerPhysicalSlot(
  ownerId: string,
  slot: PhysicalStorageSlot
): Prisma.CollectionRecordWhereInput {
  switch (slot.storageKind) {
    case 'SHELF':
      return {
        ownerId,
        storageKind: 'SHELF',
        shelfRow: slot.shelfRow,
        shelfColumn: slot.shelfColumn,
      };
    case 'CRATE':
      return {
        ownerId,
        storageKind: 'CRATE',
        crateNumber: slot.crateNumber,
      };
    case 'BOX':
      if (slot.boxCustomLabel?.trim()) {
        return {
          ownerId,
          storageKind: 'BOX',
          boxCustomLabel: slot.boxCustomLabel.trim(),
        };
      }
      return {
        ownerId,
        storageKind: 'BOX',
        boxNumber: slot.boxNumber,
        AND: [
          {
            OR: [{ boxCustomLabel: null }, { boxCustomLabel: '' }],
          },
        ],
      };
    default:
      return { ownerId, id: '__no_slot__' };
  }
}

function addRowsToSlotCounts(
  rows: StorageRow[],
  counts: Map<string, { slot: PhysicalStorageSlot; n: number }>
) {
  for (const r of rows) {
    const slot = physicalSlotFromRecordFields(r);
    if (!slot) continue;
    const key = encodePhysicalSlotKey(slot);
    const prev = counts.get(key);
    if (prev) {
      prev.n += 1;
    } else {
      counts.set(key, { slot, n: 1 });
    }
  }
}

/**
 * Distinct physical slots (non-NONE) that have at least one album, single, or
 * 12-inch single, with total row counts per slot.
 */
export async function listDistinctPhysicalSlotsForOwner(
  ownerId: string
): Promise<PhysicalSlotSummary[]> {
  const whereNonNone = {
    ownerId,
    storageKind: { not: 'NONE' as const },
  };

  const [recordRows, singleRows, twelveRows] = await Promise.all([
    prisma.collectionRecord.findMany({
      where: whereNonNone,
      select: STORAGE_SELECT,
    }),
    prisma.collectionSingle.findMany({
      where: whereNonNone,
      select: STORAGE_SELECT,
    }),
    prisma.collectionTwelveInchSingle.findMany({
      where: whereNonNone,
      select: STORAGE_SELECT,
    }),
  ]);

  const counts = new Map<string, { slot: PhysicalStorageSlot; n: number }>();
  addRowsToSlotCounts(recordRows, counts);
  addRowsToSlotCounts(singleRows, counts);
  addRowsToSlotCounts(twelveRows, counts);

  const summaries: PhysicalSlotSummary[] = [];
  for (const [slotKey, { slot, n }] of counts) {
    const label = physicalSlotLabel(slot);
    if (!label) continue;
    summaries.push({ slotKey, slot, label, itemCount: n });
  }

  summaries.sort((a, b) => a.label.localeCompare(b.label));
  return summaries;
}

export async function listRecordsForPhysicalSlot(
  ownerId: string,
  slotKeySegment: string
) {
  const slot = decodePhysicalSlotKey(slotKeySegment);
  if (!slot) return null;

  const baseWhere = whereForOwnerPhysicalSlot(ownerId, slot);
  const whereRecord = baseWhere;
  const whereSingle = baseWhere as unknown as Prisma.CollectionSingleWhereInput;
  const whereTwelve =
    baseWhere as unknown as Prisma.CollectionTwelveInchSingleWhereInput;

  const [
    recordTotal,
    singleTotal,
    twelveTotal,
    records,
    singles,
    twelveInch,
  ] = await Promise.all([
    prisma.collectionRecord.count({ where: whereRecord }),
    prisma.collectionSingle.count({ where: whereSingle }),
    prisma.collectionTwelveInchSingle.count({ where: whereTwelve }),
    prisma.collectionRecord.findMany({
      where: whereRecord,
      orderBy: [{ artist: 'asc' }, { title: 'asc' }],
      take: COLLECTION_LIST_MAX,
      select: {
        id: true,
        artist: true,
        title: true,
        year: true,
        quantity: true,
        artworkKey: true,
        artworkUpdatedAt: true,
      },
    }),
    prisma.collectionSingle.findMany({
      where: whereSingle,
      orderBy: [{ artist: 'asc' }, { title: 'asc' }],
      take: COLLECTION_LIST_MAX,
      select: {
        id: true,
        artist: true,
        title: true,
        bSideTitle: true,
        year: true,
        quantity: true,
        artworkKey: true,
        artworkUpdatedAt: true,
      },
    }),
    prisma.collectionTwelveInchSingle.findMany({
      where: whereTwelve,
      orderBy: [{ artist: 'asc' }, { title: 'asc' }],
      take: COLLECTION_LIST_MAX,
      select: {
        id: true,
        artist: true,
        title: true,
        bSideTitle: true,
        year: true,
        quantity: true,
        artworkKey: true,
        artworkUpdatedAt: true,
      },
    }),
  ]);

  const total = recordTotal + singleTotal + twelveTotal;
  const recordsCapped = recordTotal > COLLECTION_LIST_MAX;
  const singlesCapped = singleTotal > COLLECTION_LIST_MAX;
  const twelveInchCapped = twelveTotal > COLLECTION_LIST_MAX;

  return {
    slot,
    slotKey: encodePhysicalSlotKey(slot),
    label: physicalSlotLabel(slot) ?? '',
    recordTotal,
    singleTotal,
    twelveInchTotal: twelveTotal,
    total,
    recordsCapped,
    singlesCapped,
    twelveInchCapped,
    records,
    singles,
    twelveInch,
  };
}

export { decodePhysicalSlotKey, encodePhysicalSlotKey };
