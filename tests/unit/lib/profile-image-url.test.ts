import { describe, expect, it } from 'vitest';

import { profileImageUrl } from '@/lib/profile-image-url';

describe('profileImageUrl', () => {
  it('adds cache-bust query when updatedAt is set', () => {
    expect(profileImageUrl('user1', 1700000000000)).toBe(
      '/api/users/user1/profile-image?v=1700000000000'
    );
  });

  it('omits query when no timestamp', () => {
    expect(profileImageUrl('user1', null)).toBe('/api/users/user1/profile-image');
  });
});
