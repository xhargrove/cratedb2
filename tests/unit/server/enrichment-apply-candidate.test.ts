import { describe, expect, it, vi, beforeEach } from 'vitest';

vi.mock('@/db/client', () => ({
  prisma: {
    collectionRecord: {
      updateMany: vi.fn(),
    },
  },
}));

vi.mock('@/server/records/get-by-id-for-owner', () => ({
  getRecordByIdForOwner: vi.fn(),
}));

import { prisma } from '@/db/client';
import { applyMetadataCandidateForRecord } from '@/server/enrichment/apply-candidate';
import { getRecordByIdForOwner } from '@/server/records/get-by-id-for-owner';

const candidate = {
  id: 'c47e6051-2647-4daa-b16e-7ff419b9e570',
  provider: 'musicbrainz' as const,
  artist: 'David Bowie',
  title: 'Low',
  year: 1977,
  genre: 'Rock',
  label: 'RCA',
};

describe('applyMetadataCandidateForRecord', () => {
  beforeEach(() => {
    vi.mocked(prisma.collectionRecord.updateMany).mockReset();
    vi.mocked(getRecordByIdForOwner).mockReset();
  });

  it('rejects when record not found for owner', async () => {
    vi.mocked(getRecordByIdForOwner).mockResolvedValue(null);
    const out = await applyMetadataCandidateForRecord({
      recordId: 'r1',
      ownerId: 'o1',
      candidate,
      mode: 'merge',
    });
    expect(out.ok).toBe(false);
    expect(prisma.collectionRecord.updateMany).not.toHaveBeenCalled();
  });

  it('merge fills only empty year and genre', async () => {
    vi.mocked(getRecordByIdForOwner).mockResolvedValue({
      id: 'r1',
      ownerId: 'o1',
      artist: 'Bowie',
      title: 'Low',
      year: null,
      genre: null,
      storageKind: 'NONE',
      shelfRow: null,
      shelfColumn: null,
      crateNumber: null,
      boxNumber: null,
      boxCustomLabel: null,
      storageLocation: null,
      notes: null,
      artworkKey: null,
      artworkMimeType: null,
      artworkUpdatedAt: null,
      metadataSource: null,
      metadataSourceId: null,
      metadataAppliedAt: null,
      spotifyAlbumId: null,
      quantity: 1,
      containerId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    vi.mocked(prisma.collectionRecord.updateMany).mockResolvedValue({
      count: 1,
    });

    const out = await applyMetadataCandidateForRecord({
      recordId: 'r1',
      ownerId: 'o1',
      candidate,
      mode: 'merge',
    });
    expect(out.ok).toBe(true);
    expect(prisma.collectionRecord.updateMany).toHaveBeenCalledWith({
      where: { id: 'r1', ownerId: 'o1' },
      data: expect.objectContaining({
        year: 1977,
        genre: 'Rock',
        metadataSource: 'musicbrainz',
        metadataSourceId: candidate.id,
      }),
    });
  });

  it('replace overwrites artist and title', async () => {
    vi.mocked(getRecordByIdForOwner).mockResolvedValue({
      id: 'r1',
      ownerId: 'o1',
      artist: 'Old',
      title: 'Old',
      year: 1999,
      genre: 'Pop',
      storageKind: 'NONE',
      shelfRow: null,
      shelfColumn: null,
      crateNumber: null,
      boxNumber: null,
      boxCustomLabel: null,
      storageLocation: null,
      notes: null,
      artworkKey: null,
      artworkMimeType: null,
      artworkUpdatedAt: null,
      metadataSource: null,
      metadataSourceId: null,
      metadataAppliedAt: null,
      spotifyAlbumId: null,
      quantity: 1,
      containerId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    vi.mocked(prisma.collectionRecord.updateMany).mockResolvedValue({
      count: 1,
    });

    await applyMetadataCandidateForRecord({
      recordId: 'r1',
      ownerId: 'o1',
      candidate,
      mode: 'replace',
    });

    expect(prisma.collectionRecord.updateMany).toHaveBeenCalledWith({
      where: { id: 'r1', ownerId: 'o1' },
      data: expect.objectContaining({
        artist: 'David Bowie',
        title: 'Low',
        year: 1977,
        genre: 'Rock',
      }),
    });
  });
});
