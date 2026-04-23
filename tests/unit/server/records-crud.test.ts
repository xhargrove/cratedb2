import { describe, expect, it, vi, beforeEach } from 'vitest';

const artworkStorageMocks = vi.hoisted(() => ({
  deleteArtworkFile: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@/db/client', () => ({
  prisma: {
    collectionRecord: {
      findFirst: vi.fn(),
      create: vi.fn(),
      updateMany: vi.fn(),
      deleteMany: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
      groupBy: vi.fn(),
      update: vi.fn(),
    },
  },
}));

vi.mock('@/server/storage/local-artwork-store', async (importOriginal) => {
  const mod =
    await importOriginal<
      typeof import('@/server/storage/local-artwork-store')
    >();
  return {
    ...mod,
    deleteArtworkFile: artworkStorageMocks.deleteArtworkFile,
  };
});

import { prisma } from '@/db/client';
import { createRecordForOwner } from '@/server/records/create';
import { deleteRecordForOwner } from '@/server/records/delete';
import { getRecordByIdForOwner } from '@/server/records/get-by-id-for-owner';
import { COLLECTION_LIST_MAX } from '@/lib/collection-constants';
import {
  buildWhereForOwner,
  dedupeCaseInsensitiveSorted,
  getCollectionFacets,
  listRecordsForOwner,
  listRecordsWithMetaForOwner,
  orderForSort,
} from '@/server/records/list-for-owner';
import { updateRecordForOwner } from '@/server/records/update';

describe('getRecordByIdForOwner', () => {
  beforeEach(() => {
    vi.mocked(prisma.collectionRecord.findFirst).mockReset();
  });

  it('scopes query to id and ownerId', async () => {
    vi.mocked(prisma.collectionRecord.findFirst).mockResolvedValue(null);
    await getRecordByIdForOwner('rec1', 'owner99');
    expect(prisma.collectionRecord.findFirst).toHaveBeenCalledWith({
      where: {
        id: 'rec1',
        ownerId: 'owner99',
      },
    });
  });
});

describe('updateRecordForOwner', () => {
  beforeEach(() => {
    vi.mocked(prisma.collectionRecord.updateMany).mockReset();
  });

  it('updates only compound id + ownerId', async () => {
    vi.mocked(prisma.collectionRecord.updateMany).mockResolvedValue({
      count: 1,
    });
    const payload = {
      artist: 'X',
      title: 'Y',
      year: undefined as number | undefined,
      genre: undefined as string | undefined,
      storageLocation: undefined as string | undefined,
      notes: undefined as string | undefined,
    };
    const ok = await updateRecordForOwner('rid', 'oid', payload);
    expect(ok).toBe(true);
    expect(prisma.collectionRecord.updateMany).toHaveBeenCalledWith({
      where: { id: 'rid', ownerId: 'oid' },
      data: {
        artist: 'X',
        title: 'Y',
        year: null,
        genre: null,
        storageLocation: null,
        notes: null,
        spotifyAlbumId: null,
      },
    });
  });

  it('returns false when update touches no row (wrong owner)', async () => {
    vi.mocked(prisma.collectionRecord.updateMany).mockResolvedValue({
      count: 0,
    });
    const ok = await updateRecordForOwner('rid', 'wrong', {
      artist: 'X',
      title: 'Y',
      year: undefined,
      genre: undefined,
      storageLocation: undefined,
      notes: undefined,
    });
    expect(ok).toBe(false);
  });
});

describe('deleteRecordForOwner', () => {
  beforeEach(() => {
    vi.mocked(prisma.collectionRecord.deleteMany).mockReset();
    vi.mocked(prisma.collectionRecord.findFirst).mockReset();
    artworkStorageMocks.deleteArtworkFile.mockClear();
  });

  it('deletes only compound id + ownerId', async () => {
    vi.mocked(prisma.collectionRecord.findFirst).mockResolvedValue({
      artworkKey: null,
    } as never);
    vi.mocked(prisma.collectionRecord.deleteMany).mockResolvedValue({
      count: 1,
    });
    const ok = await deleteRecordForOwner('rid', 'oid');
    expect(ok).toBe(true);
    expect(prisma.collectionRecord.findFirst).toHaveBeenCalledWith({
      where: { id: 'rid', ownerId: 'oid' },
      select: { artworkKey: true },
    });
    expect(prisma.collectionRecord.deleteMany).toHaveBeenCalledWith({
      where: { id: 'rid', ownerId: 'oid' },
    });
    expect(artworkStorageMocks.deleteArtworkFile).not.toHaveBeenCalled();
  });

  it('returns false when delete touches no row', async () => {
    vi.mocked(prisma.collectionRecord.findFirst).mockResolvedValue({
      artworkKey: null,
    } as never);
    vi.mocked(prisma.collectionRecord.deleteMany).mockResolvedValue({
      count: 0,
    });
    const ok = await deleteRecordForOwner('rid', 'wrong');
    expect(ok).toBe(false);
    expect(artworkStorageMocks.deleteArtworkFile).not.toHaveBeenCalled();
  });

  it('deletes artwork file after row removal when stored', async () => {
    vi.mocked(prisma.collectionRecord.findFirst).mockResolvedValue({
      artworkKey: 'oid/rid.jpg',
    } as never);
    vi.mocked(prisma.collectionRecord.deleteMany).mockResolvedValue({
      count: 1,
    });
    const ok = await deleteRecordForOwner('rid', 'oid');
    expect(ok).toBe(true);
    expect(artworkStorageMocks.deleteArtworkFile).toHaveBeenCalledWith(
      'oid/rid.jpg'
    );
  });
});

describe('createRecordForOwner', () => {
  beforeEach(() => {
    vi.mocked(prisma.collectionRecord.create).mockReset();
  });

  it('sets ownerId from argument only', async () => {
    vi.mocked(prisma.collectionRecord.create).mockResolvedValue({
      id: 'new',
      ownerId: 'u1',
      artist: 'A',
      title: 'B',
      year: null,
      genre: null,
      storageLocation: null,
      notes: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as never);

    await createRecordForOwner('u1', {
      artist: 'A',
      title: 'B',
      year: undefined,
      genre: undefined,
      storageLocation: undefined,
      notes: undefined,
    });

    expect(prisma.collectionRecord.create).toHaveBeenCalledWith({
      data: {
        ownerId: 'u1',
        artist: 'A',
        title: 'B',
        year: null,
        genre: null,
        storageLocation: null,
        notes: null,
        spotifyAlbumId: null,
      },
    });
  });
});

describe('listRecordsForOwner', () => {
  beforeEach(() => {
    vi.mocked(prisma.collectionRecord.findMany).mockReset();
  });

  it('scopes list to ownerId with default newest sort', async () => {
    vi.mocked(prisma.collectionRecord.findMany).mockResolvedValue([]);
    await listRecordsForOwner('owner-99');
    expect(prisma.collectionRecord.findMany).toHaveBeenCalledWith({
      where: { ownerId: 'owner-99' },
      orderBy: [{ createdAt: 'desc' }],
      take: COLLECTION_LIST_MAX,
    });
  });

  it('passes search, filters, and sort into findMany', async () => {
    vi.mocked(prisma.collectionRecord.findMany).mockResolvedValue([]);
    await listRecordsForOwner('owner-99', {
      search: '  blue  ',
      sort: 'title-asc',
      genre: 'Jazz',
      storageLocation: 'Crate 1',
    });
    expect(prisma.collectionRecord.findMany).toHaveBeenCalledWith({
      where: buildWhereForOwner('owner-99', {
        search: '  blue  ',
        sort: 'title-asc',
        genre: 'Jazz',
        storageLocation: 'Crate 1',
      }),
      orderBy: orderForSort('title-asc'),
      take: COLLECTION_LIST_MAX,
    });
  });
});

describe('listRecordsWithMetaForOwner', () => {
  beforeEach(() => {
    vi.mocked(prisma.collectionRecord.findMany).mockReset();
    vi.mocked(prisma.collectionRecord.count).mockReset();
  });

  it('returns capped meta when list hits max and more rows exist', async () => {
    const many = Array.from({ length: COLLECTION_LIST_MAX }, (_, i) => ({
      id: `id-${i}`,
      ownerId: 'o1',
      artist: 'A',
      title: 'T',
      year: null as number | null,
      genre: null as string | null,
      storageLocation: null as string | null,
      notes: null as string | null,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

    vi.mocked(prisma.collectionRecord.findMany).mockResolvedValue(
      many as never
    );
    vi.mocked(prisma.collectionRecord.count).mockResolvedValue(
      COLLECTION_LIST_MAX + 1
    );

    const out = await listRecordsWithMetaForOwner('o1', undefined);
    expect(out.meta.matchCount).toBe(COLLECTION_LIST_MAX + 1);
    expect(out.meta.capped).toBe(true);
  });
});

describe('buildWhereForOwner', () => {
  it('builds OR search across text fields', () => {
    const w = buildWhereForOwner('u1', { search: 'test' });
    expect(w).toEqual({
      AND: [
        { ownerId: 'u1' },
        {
          OR: [
            { artist: { contains: 'test', mode: 'insensitive' } },
            { title: { contains: 'test', mode: 'insensitive' } },
            { genre: { contains: 'test', mode: 'insensitive' } },
            { storageLocation: { contains: 'test', mode: 'insensitive' } },
            { notes: { contains: 'test', mode: 'insensitive' } },
          ],
        },
      ],
    });
  });

  it('adds case-insensitive genre and storage filters', () => {
    const w = buildWhereForOwner('u1', {
      genre: 'Soul',
      storageLocation: 'A1',
    });
    expect(w).toEqual({
      AND: [
        { ownerId: 'u1' },
        { genre: { equals: 'Soul', mode: 'insensitive' } },
        { storageLocation: { equals: 'A1', mode: 'insensitive' } },
      ],
    });
  });

  it('returns only owner when no options', () => {
    expect(buildWhereForOwner('u1', undefined)).toEqual({ ownerId: 'u1' });
  });
});

describe('orderForSort', () => {
  it('maps sort keys to Prisma orderBy', () => {
    expect(orderForSort('newest')).toEqual([{ createdAt: 'desc' }]);
    expect(orderForSort('oldest')).toEqual([{ createdAt: 'asc' }]);
    expect(orderForSort('artist-asc')).toEqual([
      { artist: 'asc' },
      { title: 'asc' },
    ]);
    expect(orderForSort('title-desc')).toEqual([
      { title: 'desc' },
      { artist: 'asc' },
    ]);
  });
});

describe('dedupeCaseInsensitiveSorted', () => {
  it('keeps first-seen casing and sorts labels', () => {
    expect(dedupeCaseInsensitiveSorted(['rock', 'Rock', '  Jazz '])).toEqual([
      'Jazz',
      'rock',
    ]);
  });
});

describe('getCollectionFacets', () => {
  beforeEach(() => {
    vi.mocked(prisma.collectionRecord.groupBy).mockReset();
  });

  it('uses groupBy per field and dedupes case-insensitively', async () => {
    vi.mocked(prisma.collectionRecord.groupBy).mockImplementation(((args: {
      by: string[];
    }) => {
      if (args.by[0] === 'genre') {
        return Promise.resolve([{ genre: 'Rock' }, { genre: 'rock' }]);
      }
      return Promise.resolve([{ storageLocation: 'Bin 1' }]);
    }) as never);

    const facets = await getCollectionFacets('owner-1');
    expect(prisma.collectionRecord.groupBy).toHaveBeenCalledTimes(2);
    expect(facets.genres).toEqual(['Rock']);
    expect(facets.locations).toEqual(['Bin 1']);
  });
});
