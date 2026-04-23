import { describe, expect, it } from 'vitest';

import {
  buildContainerScanUrl,
  containerDashboardPath,
} from '@/lib/container-url';

describe('container URL helpers', () => {
  it('uses stable dashboard path with id only', () => {
    expect(containerDashboardPath('cont_1')).toBe(
      '/dashboard/containers/cont_1'
    );
  });

  it('builds absolute scan URL without embedding inventory', () => {
    expect(buildContainerScanUrl('https://app.example.com', 'cont_1')).toBe(
      'https://app.example.com/dashboard/containers/cont_1'
    );
    expect(buildContainerScanUrl('https://app.example.com/', 'cont_1')).toBe(
      'https://app.example.com/dashboard/containers/cont_1'
    );
  });
});
