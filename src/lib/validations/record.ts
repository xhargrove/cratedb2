import { z } from 'zod';

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

/** Canonical write shape for create + update (same fields). */
export const recordWriteFormSchema = z.object({
  artist: z.preprocess(
    (v) => (v == null ? '' : String(v)),
    z.string().trim().min(1, 'Artist is required').max(500)
  ),
  title: z.preprocess(
    (v) => (v == null ? '' : String(v)),
    z.string().trim().min(1, 'Title is required').max(500)
  ),
  year: yearField,
  genre: optionalTrimmed(200),
  storageLocation: optionalTrimmed(500),
  notes: optionalTrimmed(5000),
});

export type RecordWriteFields = z.infer<typeof recordWriteFormSchema>;

/** Route / form record id (opaque string; validated again server-side with ownership). */
export const recordIdSchema = z.string().trim().min(1, 'Record id is required');

export function parseRecordForm(formData: FormData) {
  const raw = {
    artist: formData.get('artist'),
    title: formData.get('title'),
    year: formData.get('year'),
    genre: formData.get('genre'),
    storageLocation: formData.get('storageLocation'),
    notes: formData.get('notes'),
  };
  const parsed = recordWriteFormSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false as const,
      error: parsed.error.issues[0]?.message ?? 'Invalid input',
    };
  }
  return { ok: true as const, data: parsed.data };
}

export function parseRecordId(value: unknown) {
  const parsed = recordIdSchema.safeParse(value);
  if (!parsed.success) {
    return {
      ok: false as const,
      error: parsed.error.issues[0]?.message ?? 'Invalid record id',
    };
  }
  return { ok: true as const, id: parsed.data };
}

/** @deprecated use parseRecordForm — alias for clarity in call sites */
export const parseCreateRecordForm = parseRecordForm;
