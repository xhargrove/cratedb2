import { z } from 'zod';

/** Payload re-parsed on apply — must match server-side candidate shape. */
export const metadataCandidateSchema = z.object({
  id: z.string().trim().min(1).max(40),
  provider: z.literal('musicbrainz'),
  artist: z.string().trim().min(1).max(500),
  title: z.string().trim().min(1).max(500),
  year: z.union([z.number().int().min(1900).max(2100), z.null()]),
  genre: z.union([z.string().trim().max(200), z.null()]),
  label: z.union([z.string().trim().max(500), z.null()]),
});

export type ParsedMetadataCandidate = z.infer<typeof metadataCandidateSchema>;
