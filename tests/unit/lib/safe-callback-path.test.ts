import { describe, expect, it } from 'vitest';

import { parseDashboardCallbackPath } from '@/lib/safe-callback-path';

describe('parseDashboardCallbackPath', () => {
  it('accepts dashboard paths', () => {
    expect(parseDashboardCallbackPath('/dashboard')).toBe('/dashboard');
    expect(parseDashboardCallbackPath('/dashboard/containers/abc')).toBe(
      '/dashboard/containers/abc'
    );
    expect(
      parseDashboardCallbackPath('/dashboard/containers/abc?q=1')
    ).toBe('/dashboard/containers/abc?q=1');
  });

  it('accepts search query values that contain ://', () => {
    expect(
      parseDashboardCallbackPath('/dashboard/records?q=https%3A%2F%2Fa.com')
    ).toBe('/dashboard/records?q=https%3A%2F%2Fa.com');
    expect(
      parseDashboardCallbackPath(
        '/dashboard/singles?q=https://example.com/album'
      )
    ).toBe('/dashboard/singles?q=https://example.com/album');
  });

  it('rejects open redirects and junk', () => {
    expect(parseDashboardCallbackPath('//evil.com')).toBeNull();
    expect(parseDashboardCallbackPath('https://evil.com')).toBeNull();
    expect(parseDashboardCallbackPath('/login')).toBeNull();
    expect(parseDashboardCallbackPath('/dashboard/../../../etc')).toBeNull();
    expect(parseDashboardCallbackPath('javascript:alert(1)')).toBeNull();
    expect(parseDashboardCallbackPath('')).toBeNull();
    expect(parseDashboardCallbackPath(null)).toBeNull();
    expect(parseDashboardCallbackPath('/dashboardevil')).toBeNull();
  });
});
