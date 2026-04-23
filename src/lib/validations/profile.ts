import { z } from 'zod';

import { ProfileVibe } from '@/generated/prisma/client';

export const profileUpdateSchema = z.object({
  displayName: z.preprocess(
    (v) => {
      if (v == null) return '';
      return String(v).trim();
    },
    z.string().max(120, 'Display name is too long')
  ),
  bio: z.preprocess(
    (v) => {
      if (v == null) return '';
      return String(v).trim();
    },
    z.string().max(500, 'Bio is too long')
  ),
  vibe: z.nativeEnum(ProfileVibe, {
    message: 'Pick how you show up on Cratedb',
  }),
  collectionPublic: z.preprocess((v) => {
    return v === '1' || v === 'on' || v === true;
  }, z.boolean()),
  removeProfileImage: z.preprocess((v) => {
    return v === '1' || v === 'on' || v === true;
  }, z.boolean()),
});

export type ProfileUpdateFields = z.infer<typeof profileUpdateSchema>;

export function parseProfileUpdateForm(formData: FormData) {
  const raw = {
    displayName: formData.get('displayName'),
    bio: formData.get('bio'),
    vibe: formData.get('vibe'),
    collectionPublic: formData.get('collectionPublic'),
    removeProfileImage: formData.get('removeProfileImage'),
  };
  const parsed = profileUpdateSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false as const,
      error: parsed.error.issues[0]?.message ?? 'Invalid input',
    };
  }
  const displayNameTrimmed = parsed.data.displayName.trim();
  const bioTrimmed = parsed.data.bio.trim();
  return {
    ok: true as const,
    data: {
      displayName: displayNameTrimmed === '' ? null : displayNameTrimmed,
      bio: bioTrimmed === '' ? null : bioTrimmed,
      vibe: parsed.data.vibe,
      collectionPublic: parsed.data.collectionPublic,
      removeProfileImage: parsed.data.removeProfileImage,
    },
  };
}
