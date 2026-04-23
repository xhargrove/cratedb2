import { prisma } from '../src/db/client';
import {
  ALLOWED_ARTWORK_MIME_TYPES,
  type AllowedArtworkMimeType,
} from '../src/lib/validations/artwork';
import { logger } from '../src/lib/logger';
import {
  readArtworkFile,
  resolveArtworkAbsolutePath,
} from '../src/server/storage/local-artwork-store';
import { getArtworkStore } from '../src/server/storage/artwork-store';

type RowRef = {
  table:
    | 'records'
    | 'collection_singles'
    | 'collection_twelve_inch_singles'
    | 'profiles';
  id: string;
  key: string;
  mimeType: string;
};

function toAllowedMime(value: string): AllowedArtworkMimeType | null {
  return (ALLOWED_ARTWORK_MIME_TYPES as readonly string[]).includes(value)
    ? (value as AllowedArtworkMimeType)
    : null;
}

function parseFlags() {
  const args = new Set(process.argv.slice(2));
  return {
    dryRun: args.has('--dry-run'),
    force: args.has('--force'),
  };
}

async function collectRows(): Promise<RowRef[]> {
  const [records, singles, twelveInch, profiles] = await Promise.all([
    prisma.collectionRecord.findMany({
      where: {
        artworkKey: { not: null },
        artworkMimeType: { not: null },
      },
      select: { id: true, artworkKey: true, artworkMimeType: true },
    }),
    prisma.collectionSingle.findMany({
      where: {
        artworkKey: { not: null },
        artworkMimeType: { not: null },
      },
      select: { id: true, artworkKey: true, artworkMimeType: true },
    }),
    prisma.collectionTwelveInchSingle.findMany({
      where: {
        artworkKey: { not: null },
        artworkMimeType: { not: null },
      },
      select: { id: true, artworkKey: true, artworkMimeType: true },
    }),
    prisma.profile.findMany({
      where: {
        profileImageKey: { not: null },
        profileImageMimeType: { not: null },
      },
      select: { id: true, profileImageKey: true, profileImageMimeType: true },
    }),
  ]);

  return [
    ...records.map((r) => ({
      table: 'records' as const,
      id: r.id,
      key: r.artworkKey!,
      mimeType: r.artworkMimeType!,
    })),
    ...singles.map((r) => ({
      table: 'collection_singles' as const,
      id: r.id,
      key: r.artworkKey!,
      mimeType: r.artworkMimeType!,
    })),
    ...twelveInch.map((r) => ({
      table: 'collection_twelve_inch_singles' as const,
      id: r.id,
      key: r.artworkKey!,
      mimeType: r.artworkMimeType!,
    })),
    ...profiles.map((r) => ({
      table: 'profiles' as const,
      id: r.id,
      key: r.profileImageKey!,
      mimeType: r.profileImageMimeType!,
    })),
  ];
}

async function main() {
  const { dryRun, force } = parseFlags();
  const rows = await collectRows();
  const store = getArtworkStore();

  let uploaded = 0;
  let skippedExisting = 0;
  let missingLocal = 0;
  let failed = 0;

  logger.info(
    { totalRows: rows.length, dryRun, force },
    'starting artwork migration to object storage'
  );

  for (const row of rows) {
    try {
      if (!force) {
        const exists = await store.objectExists(row.key);
        if (exists) {
          skippedExisting += 1;
          logger.info(
            { table: row.table, id: row.id, key: row.key },
            'skip existing object'
          );
          continue;
        }
      }

      const localPath = resolveArtworkAbsolutePath(row.key);
      let buffer: Buffer;
      try {
        buffer = await readArtworkFile(row.key);
      } catch {
        missingLocal += 1;
        logger.warn(
          { table: row.table, id: row.id, key: row.key, localPath },
          'missing local artwork file'
        );
        continue;
      }

      if (dryRun) {
        logger.info(
          {
            table: row.table,
            id: row.id,
            key: row.key,
            bytes: buffer.length,
            mimeType: row.mimeType,
          },
          'dry-run migrate artwork object'
        );
        uploaded += 1;
        continue;
      }

      const mimeType = toAllowedMime(row.mimeType);
      if (!mimeType) {
        failed += 1;
        logger.error(
          {
            table: row.table,
            id: row.id,
            key: row.key,
            mimeType: row.mimeType,
          },
          'invalid mime type for artwork migration row'
        );
        continue;
      }

      await store.putObject(row.key, buffer, mimeType);
      uploaded += 1;
      logger.info(
        { table: row.table, id: row.id, key: row.key, bytes: buffer.length },
        'migrated artwork object'
      );
    } catch (err) {
      failed += 1;
      logger.error(
        { err, table: row.table, id: row.id, key: row.key },
        'failed to migrate artwork object'
      );
    }
  }

  logger.info(
    {
      totalRows: rows.length,
      uploaded,
      skippedExisting,
      missingLocal,
      failed,
      dryRun,
    },
    'completed artwork migration to object storage'
  );

  if (failed > 0) {
    process.exitCode = 1;
  }
}

main().finally(async () => {
  await prisma.$disconnect().catch(() => {});
});
