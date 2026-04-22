import { describe, expect, it } from 'vitest';

import { hashPassword, verifyPassword } from '@/server/auth/password';

describe('password hashing', () => {
  it('verifies correct password and rejects wrong password', async () => {
    const plain = 'Aa1!securepass';
    const hash = await hashPassword(plain);
    expect(hash).not.toContain(plain);
    await expect(verifyPassword(hash, plain)).resolves.toBe(true);
    await expect(verifyPassword(hash, 'wrong')).resolves.toBe(false);
  }, 20_000);
});
