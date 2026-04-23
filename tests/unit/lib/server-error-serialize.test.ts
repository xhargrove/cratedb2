import { describe, expect, it } from 'vitest';

import { SessionBackendUnavailableError } from '@/lib/auth-errors';
import { serializeUnknownError } from '@/lib/server-error-serialize';

describe('serializeUnknownError', () => {
  it('serializes a normal Error', () => {
    const s = serializeUnknownError(new Error('hello'));
    expect(s.errorName).toBe('Error');
    expect(s.errorMessage).toBe('hello');
    expect(s.category).toBe('unknown');
  });

  it('detects Prisma-style errors', () => {
    const e = Object.assign(new Error('Invalid `prisma.foo` invocation'), {
      code: 'P2021',
      meta: { table: 'missing' },
    });
    const s = serializeUnknownError(e);
    expect(s.prismaCode).toBe('P2021');
    expect(s.category).toBe('database');
    expect(s.prismaMeta).toEqual({ table: 'missing' });
  });

  it('tags SessionBackendUnavailableError', () => {
    const s = serializeUnknownError(new SessionBackendUnavailableError());
    expect(s.category).toBe('auth_session');
  });
});
