import { describe, expect, it, vi, beforeEach } from 'vitest';

vi.mock('@/db/client', () => ({
  prisma: {
    storageContainer: {
      findFirst: vi.fn(),
    },
  },
}));

import { prisma } from '@/db/client';
import { storageContainerExistsForOwner } from '@/server/containers/assert-owned';

describe('storageContainerExistsForOwner', () => {
  beforeEach(() => {
    vi.mocked(prisma.storageContainer.findFirst).mockReset();
  });

  it('queries id and ownerId', async () => {
    vi.mocked(prisma.storageContainer.findFirst).mockResolvedValue(null);
    await storageContainerExistsForOwner('c1', 'u1');
    expect(prisma.storageContainer.findFirst).toHaveBeenCalledWith({
      where: { id: 'c1', ownerId: 'u1' },
      select: { id: true },
    });
  });

  it('returns false when not found', async () => {
    vi.mocked(prisma.storageContainer.findFirst).mockResolvedValue(null);
    await expect(storageContainerExistsForOwner('c1', 'u1')).resolves.toBe(
      false
    );
  });

  it('returns true when row exists', async () => {
    vi.mocked(prisma.storageContainer.findFirst).mockResolvedValue({
      id: 'c1',
    } as never);
    await expect(storageContainerExistsForOwner('c1', 'u1')).resolves.toBe(true);
  });
});
