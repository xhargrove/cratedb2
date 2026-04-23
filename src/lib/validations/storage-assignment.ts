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

function optionalTrimmedLabel(max: number) {
  return z.preprocess(
    (val) =>
      val === '' || val === undefined || val === null ? undefined : String(val),
    z.string().trim().max(max).optional()
  );
}

function optionalPositiveInt(max: number) {
  return z.preprocess((val) => {
    if (val === '' || val === undefined || val === null) return undefined;
    const n = Number(val);
    return Number.isFinite(n) ? n : NaN;
  }, z.number().int().min(1).max(max).optional());
}

const storageKindField = z.preprocess(
  (v) => {
    if (v === '' || v === undefined || v === null) return 'NONE';
    const s = String(v);
    if (s === 'NONE' || s === 'SHELF' || s === 'CRATE' || s === 'BOX') return s;
    return 'NONE';
  },
  z.enum(['NONE', 'SHELF', 'CRATE', 'BOX'])
);

export const rawStorageAssignmentSchema = z
  .object({
    storageKind: storageKindField,
    shelfRow: optionalPositiveInt(STORAGE_SHELF_ROW_MAX),
    shelfColumn: optionalPositiveInt(STORAGE_SHELF_COLUMN_MAX),
    crateNumber: optionalPositiveInt(STORAGE_CRATE_MAX),
    boxPreset: z.preprocess(
      (v) => (v === undefined || v === null ? '' : String(v)),
      z.string()
    ),
    boxCustomLabel: optionalTrimmedLabel(STORAGE_BOX_CUSTOM_LABEL_MAX),
  })
  .superRefine((data, ctx) => {
    if (data.storageKind === 'NONE') return;

    if (data.storageKind === 'SHELF') {
      if (data.shelfRow == null || data.shelfColumn == null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Enter both row and column for the shelf.',
          path: ['shelfRow'],
        });
      }
      return;
    }

    if (data.storageKind === 'CRATE') {
      if (data.crateNumber == null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Choose a crate number.',
          path: ['crateNumber'],
        });
      }
      return;
    }

    if (data.storageKind === 'BOX') {
      const preset = data.boxPreset.trim();
      if (!preset) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Choose a numbered box or Custom.',
          path: ['boxPreset'],
        });
        return;
      }
      if (preset === 'custom') {
        if (!data.boxCustomLabel?.trim()) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Enter a label for your custom box.',
            path: ['boxCustomLabel'],
          });
        }
        return;
      }
      const n = Number(preset);
      if (!Number.isInteger(n) || n < 1 || n > STORAGE_BOX_NUMBER_MAX) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Choose a valid box number.',
          path: ['boxPreset'],
        });
      }
    }
  })
  .transform((data): NormalizedPhysicalStorage => {
    const kind = data.storageKind as PhysicalStorageKind;

    if (kind === 'NONE') {
      return {
        storageKind: 'NONE',
        shelfRow: null,
        shelfColumn: null,
        crateNumber: null,
        boxNumber: null,
        boxCustomLabel: null,
        storageLocation: null,
      };
    }

    if (kind === 'SHELF') {
      const out: NormalizedPhysicalStorage = {
        storageKind: 'SHELF',
        shelfRow: data.shelfRow ?? null,
        shelfColumn: data.shelfColumn ?? null,
        crateNumber: null,
        boxNumber: null,
        boxCustomLabel: null,
        storageLocation: null,
      };
      out.storageLocation = composeStorageLocation(out);
      return out;
    }

    if (kind === 'CRATE') {
      const out: NormalizedPhysicalStorage = {
        storageKind: 'CRATE',
        shelfRow: null,
        shelfColumn: null,
        crateNumber: data.crateNumber ?? null,
        boxNumber: null,
        boxCustomLabel: null,
        storageLocation: null,
      };
      out.storageLocation = composeStorageLocation(out);
      return out;
    }

    const preset = data.boxPreset.trim();
    let boxNumber: number | null = null;
    let boxCustomLabel: string | null = null;
    if (preset === 'custom') {
      boxCustomLabel = data.boxCustomLabel?.trim() ?? null;
    } else {
      const n = Number(preset);
      boxNumber = Number.isInteger(n) ? n : null;
    }

    const out: NormalizedPhysicalStorage = {
      storageKind: 'BOX',
      shelfRow: null,
      shelfColumn: null,
      crateNumber: null,
      boxNumber,
      boxCustomLabel,
      storageLocation: null,
    };
    out.storageLocation = composeStorageLocation(out);
    return out;
  });

export type ParsedStorageAssignment = z.infer<
  typeof rawStorageAssignmentSchema
>;

export function extractStorageAssignmentRaw(formData: FormData) {
  return {
    storageKind: formData.get('storageKind'),
    shelfRow: formData.get('shelfRow'),
    shelfColumn: formData.get('shelfColumn'),
    crateNumber: formData.get('crateNumber'),
    boxPreset: formData.get('boxPreset'),
    boxCustomLabel: formData.get('boxCustomLabel'),
  };
}

export function parseStorageAssignmentFromForm(formData: FormData) {
  const raw = extractStorageAssignmentRaw(formData);
  return rawStorageAssignmentSchema.safeParse(raw);
}
