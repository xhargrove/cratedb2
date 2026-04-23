import { describe, expect, it } from 'vitest';

import { ProfileVibe } from '@/generated/prisma/client';
import { parseProfileUpdateForm } from '@/lib/validations/profile';

function minimalForm(overrides: Record<string, string> = {}) {
  const fd = new FormData();
  fd.set('displayName', overrides.displayName ?? 'Name');
  fd.set('bio', overrides.bio ?? '');
  fd.set('vibe', overrides.vibe ?? ProfileVibe.COLLECTOR);
  if (overrides.collectionPublic === '1') {
    fd.set('collectionPublic', '1');
  }
  return fd;
}

describe('parseProfileUpdateForm', () => {
  it('parses display name, vibe, bio, and public checkbox', () => {
    const fd = minimalForm({
      displayName: '  Vinyl Fan  ',
      bio: '  spins funk  ',
      vibe: ProfileVibe.DJ,
      collectionPublic: '1',
    });

    const out = parseProfileUpdateForm(fd);
    expect(out.ok).toBe(true);
    if (!out.ok) return;
    expect(out.data.displayName).toBe('Vinyl Fan');
    expect(out.data.bio).toBe('spins funk');
    expect(out.data.vibe).toBe(ProfileVibe.DJ);
    expect(out.data.collectionPublic).toBe(true);
  });

  it('maps empty display name and bio to null', () => {
    const fd = minimalForm({
      displayName: '   ',
      bio: '   ',
      vibe: ProfileVibe.PRODUCER,
    });

    const out = parseProfileUpdateForm(fd);
    expect(out.ok).toBe(true);
    if (!out.ok) return;
    expect(out.data.displayName).toBeNull();
    expect(out.data.bio).toBeNull();
    expect(out.data.vibe).toBe(ProfileVibe.PRODUCER);
  });

  it('treats absent checkbox as private collection', () => {
    const fd = minimalForm({ displayName: 'x', vibe: ProfileVibe.COLLECTOR });
    const out = parseProfileUpdateForm(fd);
    expect(out.ok).toBe(true);
    if (!out.ok) return;
    expect(out.data.collectionPublic).toBe(false);
  });

  it('rejects invalid vibe', () => {
    const fd = minimalForm({ vibe: 'FAKE_ROLE' });
    const out = parseProfileUpdateForm(fd);
    expect(out.ok).toBe(false);
  });
});
