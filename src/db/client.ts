import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

import { normalizeDatabaseUrlForPgPool } from '@/db/normalize-database-url';
import { PrismaClient } from '@/generated/prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  pgPool: Pool | undefined;
};

function createPrismaClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      'DATABASE_URL is missing. Copy .env.example and configure PostgreSQL.'
    );
  }

  const poolUrl = normalizeDatabaseUrlForPgPool(connectionString);
  const pool =
    globalForPrisma.pgPool ?? new Pool({ connectionString: poolUrl });
  if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.pgPool = pool;
  }

  const adapter = new PrismaPg(pool);

  const devLogs: Array<'query' | 'info' | 'warn' | 'error'> =
    process.env.PRISMA_QUERY_LOG === 'true'
      ? ['query', 'warn', 'error']
      : ['warn', 'error'];

  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? devLogs : ['error'],
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
