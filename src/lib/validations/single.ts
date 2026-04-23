import { z } from 'zod';

import {
  parseStorageAssignmentFromForm,
  rawStorageAssignmentSchema,
} from '@/lib/validations/storage-assignment';

/** FormData may yield `null` for absent keys — normalize before string schemas. */
function optionalTrimmed(max: number) {
  return z.preprocess(
    (val) =>
      val === '' || val === undefined || val === null ? undefined : String(val),
    z.string().trim().max(max).optional()
  );
}

const yearField = z.preprocess((val) => {
  if (val === '' || val === undefined || val === null) return undefined;
  const n = Number(val);
  return Number.isFinite(n) ? n : NaN;
}, z.number().int().min(1900).max(2100).optional());

const quantityField = z.preprocess(
  (val) => {
    if (val === '' || val === undefined || val === null) return 1;
    const n = Number(val);
    return Number.isFinite(n) ? n : NaN;
  },
  z.number().int().min(1, 'At least 1 copy').max(999, 'At most 999 copies')
);

export const singleBaseFieldsSchema = z.object({
  artist: z.preprocess(
    (v) => (v == null ? '' : String(v)),
    z.string().trim().min(1, 'Artist is required').max(500)
  ),
  title: z.preprocess(
    (v) => (v == null ? '' : String(v)),
    z.string().trim().min(1, 'Song title is required').max(500)
  ),
  bSideTitle: optionalTrimmed(500),
  year: yearField,
  quantity: quantityField,
  genre: optionalTrimmed(200),
  notes: optionalTrimmed(5000),
  spotifyTrackId: optionalTrimmed(64),
});

export type SingleWriteFields = z.infer<typeof singleBaseFieldsSchema> &
  z.infer<typeof rawStorageAssignmentSchema>;

export const singleIdSchema = z.string().trim().min(1, 'Single id is required');

export function parseSingleForm(formData: FormData) {
  const storageParsed = parseStorageAssignmentFromForm(formData);
  if (!storageParsed.success) {
    return {
      ok: false as const,
      error:
        storageParsed.error.issues[0]?.message ?? 'Invalid storage assignment',
    };
  }

  const raw = {
    artist: formData.get('artist'),
    title: formData.get('title'),
    bSideTitle: formData.get('bSideTitle'),
    year: formData.get('year'),
    quantity: formData.get('quantity'),
    genre: formData.get('genre'),
    notes: formData.get('notes'),
    spotifyTrackId: formData.get('spotifyTrackId'),
  };
  const parsed = singleBaseFieldsSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false as const,
      error: parsed.error.issues[0]?.message ?? 'Invalid input',
    };
  }

  return {
    ok: true as const,
    data: {
      ...parsed.data,
      ...storageParsed.data,
    },
  };
}

export function parseSingleId(value: unknown) {
  const parsed = singleIdSchema.safeParse(value);
  if (!parsed.success) {
    return {
      ok: false as const,
      error: parsed.error.issues[0]?.message ?? 'Invalid single id',
    };
  }
  return { ok: true as const, id: parsed.data };
}
