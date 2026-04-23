import { z } from 'zod';

import {
  CONTAINER_LOCATION_NOTE_MAX,
  CONTAINER_NAME_MAX,
} from '@/lib/collection-constants';
const optionalTrimmed = (max: number) =>
  z.preprocess(
    (val) =>
      val === '' || val === undefined || val === null ? undefined : String(val),
    z.string().trim().max(max).optional()
  );

const containerKindField = z.preprocess((v) => {
  if (v === '' || v === undefined || v === null) return 'SHELF';
  const s = String(v);
  if (s === 'SHELF' || s === 'BOX' || s === 'CRATE') return s;
  return 'SHELF';
}, z.enum(['SHELF', 'BOX', 'CRATE']));

export const containerIdSchema = z
  .string()
  .trim()
  .min(1, 'Container id is required');

export function parseContainerId(value: unknown) {
  const parsed = containerIdSchema.safeParse(value);
  if (!parsed.success) {
    return {
      ok: false as const,
      error: parsed.error.issues[0]?.message ?? 'Invalid container id',
    };
  }
  return { ok: true as const, id: parsed.data };
}

const containerIdFromForm = z.preprocess(
  (v) => (v === '' || v === undefined || v === null ? null : String(v)),
  z.union([z.null(), z.string().trim().min(1).max(128)])
);

export const containerWriteFormSchema = z.object({
  name: z.preprocess(
    (v) => (v == null ? '' : String(v)),
    z
      .string()
      .trim()
      .min(1, 'Name is required')
      .max(CONTAINER_NAME_MAX, `At most ${CONTAINER_NAME_MAX} characters`)
  ),
  kind: containerKindField,
  locationNote: optionalTrimmed(CONTAINER_LOCATION_NOTE_MAX),
});

export type ContainerWriteFields = z.infer<typeof containerWriteFormSchema>;

export function parseContainerForm(formData: FormData) {
  const raw = {
    name: formData.get('name'),
    kind: formData.get('kind'),
    locationNote: formData.get('locationNote'),
  };
  const parsed = containerWriteFormSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false as const,
      error: parsed.error.issues[0]?.message ?? 'Invalid input',
    };
  }
  return { ok: true as const, data: parsed.data };
}

/** Optional `containerId` on record forms — empty clears assignment. */
export function parseRecordContainerIdField(formData: FormData) {
  const raw = formData.get('containerId');
  const parsed = containerIdFromForm.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false as const,
      error: parsed.error.issues[0]?.message ?? 'Invalid container',
    };
  }
  return { ok: true as const, containerId: parsed.data };
}
