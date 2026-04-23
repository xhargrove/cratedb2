import { z } from 'zod';

/**
 * Same field rules as 45 RPM singles (`single.ts`) — shared metadata shape.
 */
export {
  singleBaseFieldsSchema as twelveInchWriteFormSchema,
  parseSingleForm as parseTwelveInchForm,
} from '@/lib/validations/single';

export type { SingleWriteFields as TwelveInchWriteFields } from '@/lib/validations/single';

export const twelveInchIdSchema = z
  .string()
  .trim()
  .min(1, '12-inch entry id is required');

export function parseTwelveInchId(value: unknown) {
  const parsed = twelveInchIdSchema.safeParse(value);
  if (!parsed.success) {
    return {
      ok: false as const,
      error: parsed.error.issues[0]?.message ?? 'Invalid id',
    };
  }
  return { ok: true as const, id: parsed.data };
}
