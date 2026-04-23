import { describe, expect, it } from 'vitest';

import { normalizeDatabaseUrlForPgPool } from '@/db/normalize-database-url';

describe('normalizeDatabaseUrlForPgPool', () => {
  it('rewrites legacy sslmode aliases to verify-full', () => {
    expect(
      normalizeDatabaseUrlForPgPool(
        'postgresql://u:p@host:5432/db?schema=public&sslmode=require'
      )
    ).toBe('postgresql://u:p@host:5432/db?schema=public&sslmode=verify-full');
  });

  it('leaves uselibpqcompat URLs unchanged', () => {
    const u = 'postgresql://u:p@h:5432/d?sslmode=require&uselibpqcompat=true';
    expect(normalizeDatabaseUrlForPgPool(u)).toBe(u);
  });

  it('leaves non-ssl or verify-full URLs unchanged', () => {
    const local = 'postgresql://u:p@localhost:5432/db';
    expect(normalizeDatabaseUrlForPgPool(local)).toBe(local);
    const vf = 'postgresql://u:p@h:5432/d?sslmode=verify-full';
    expect(normalizeDatabaseUrlForPgPool(vf)).toBe(vf);
  });
});
