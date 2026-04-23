import type { ProfileVibe } from '@/generated/prisma/client';

/** Ordered options for profile edit + labels on public profile. */
export const PROFILE_VIBE_OPTIONS: readonly {
  value: ProfileVibe;
  label: string;
  hint: string;
}[] = [
  {
    value: 'COLLECTOR',
    label: 'Collector',
    hint: 'Building a personal crate',
  },
  {
    value: 'DJ',
    label: 'DJ',
    hint: 'Spins records live or streams',
  },
  {
    value: 'PRODUCER',
    label: 'Producer',
    hint: 'Makes beats, edits, or remixes',
  },
  {
    value: 'CURATOR',
    label: 'Curator',
    hint: 'Sets, lists, radio, programming',
  },
  {
    value: 'ARCHIVIST',
    label: 'Archivist',
    hint: 'Cataloging, preservation, deep cuts',
  },
  {
    value: 'LISTENER',
    label: 'Listener',
    hint: 'Fan of the music first',
  },
] as const;

const labelByVibe = Object.fromEntries(
  PROFILE_VIBE_OPTIONS.map((o) => [o.value, o.label])
) as Record<ProfileVibe, string>;

export function profileVibeLabel(vibe: ProfileVibe): string {
  return labelByVibe[vibe];
}
