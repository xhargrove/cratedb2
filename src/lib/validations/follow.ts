import { z } from 'zod';

/** Opaque user id (cuid) for follow target — existence checked server-side. */
export const followTargetIdSchema = z
  .string()
  .trim()
  .min(1, 'User id is required')
  .max(128);

export type FollowTargetParse =
  | { ok: true; targetUserId: string }
  | { ok: false; error: string };

export function parseFollowTargetUserId(value: unknown): FollowTargetParse {
  const parsed = followTargetIdSchema.safeParse(value);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? 'Invalid user id',
    };
  }
  return { ok: true, targetUserId: parsed.data };
}
