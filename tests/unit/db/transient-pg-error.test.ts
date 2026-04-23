import { describe, expect, it } from 'vitest';

import { isTransientPgError } from '@/db/transient-pg-error';

describe('isTransientPgError', () => {
  it('recognizes common pool / network messages', () => {
    expect(isTransientPgError('ECONNRESET')).toBe(true);
    expect(isTransientPgError('Connection terminated unexpectedly')).toBe(
      true
    );
    expect(isTransientPgError("Can't reach database server")).toBe(true);
    expect(
      isTransientPgError('timeout exceeded when trying to connect')
    ).toBe(true);
  });

  it('does not flag validation errors', () => {
    expect(isTransientPgError('Unique constraint failed')).toBe(false);
  });
});
