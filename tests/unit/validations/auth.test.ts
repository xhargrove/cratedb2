import { describe, expect, it } from 'vitest';

import {
  parseLoginForm,
  parseSignupForm,
  passwordSchema,
} from '@/lib/validations/auth';

describe('passwordSchema', () => {
  it('accepts a strong password', () => {
    expect(() => passwordSchema.parse('Aa1!aaaa')).not.toThrow();
  });

  it('rejects short password', () => {
    expect(passwordSchema.safeParse('Aa1!').success).toBe(false);
  });

  it('rejects missing special character', () => {
    expect(passwordSchema.safeParse('Aa11aaaa').success).toBe(false);
  });
});

describe('parseSignupForm', () => {
  it('accepts valid signup data', () => {
    const fd = new FormData();
    fd.set('email', ' User@Example.COM ');
    fd.set('password', 'Aa1!aaaa');
    fd.set('confirmPassword', 'Aa1!aaaa');
    fd.set('displayName', 'DJ Test');
    const r = parseSignupForm(fd);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data.email).toBe('user@example.com');
      expect(r.data.displayName).toBe('DJ Test');
    }
  });

  it('rejects mismatched passwords', () => {
    const fd = new FormData();
    fd.set('email', 'a@b.com');
    fd.set('password', 'Aa1!aaaa');
    fd.set('confirmPassword', 'Aa1!aaab');
    const r = parseSignupForm(fd);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toContain('match');
  });

  it('rejects invalid email', () => {
    const fd = new FormData();
    fd.set('email', 'not-an-email');
    fd.set('password', 'Aa1!aaaa');
    fd.set('confirmPassword', 'Aa1!aaaa');
    const r = parseSignupForm(fd);
    expect(r.ok).toBe(false);
  });
});

describe('parseLoginForm', () => {
  it('parses login fields', () => {
    const fd = new FormData();
    fd.set('email', ' User@Example.COM ');
    fd.set('password', 'secret');
    const r = parseLoginForm(fd);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data.email).toBe('user@example.com');
      expect(r.data.password).toBe('secret');
    }
  });
});
