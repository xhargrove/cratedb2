import { z } from 'zod';

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

export const wantlistWriteSchema = z.object({
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
  notes: optionalTrimmed(5000),
});

export type WantlistWriteFields = z.infer<typeof wantlistWriteSchema>;

export const wantlistIdSchema = z
  .string()
  .trim()
  .min(1, 'Wantlist item id is required');

export function parseWantlistForm(formData: FormData) {
  const raw = {
    artist: formData.get('artist'),
    title: formData.get('title'),
    year: formData.get('year'),
    genre: formData.get('genre'),
    notes: formData.get('notes'),
  };
  const parsed = wantlistWriteSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false as const,
      error: parsed.error.issues[0]?.message ?? 'Invalid input',
    };
  }
  return { ok: true as const, data: parsed.data };
}

export function parseWantlistId(value: unknown) {
  const parsed = wantlistIdSchema.safeParse(value);
  if (!parsed.success) {
    return {
      ok: false as const,
      error: parsed.error.issues[0]?.message ?? 'Invalid id',
    };
  }
  return { ok: true as const, id: parsed.data };
}
