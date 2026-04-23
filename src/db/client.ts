import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

import { normalizeDatabaseUrlForPgPool } from '@/db/normalize-database-url';
import { logger } from '@/lib/logger';
import { PrismaClient } from '@/generated/prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  pgPool: Pool | undefined;
};

function parsePositiveInt(raw: string | undefined, fallback: number): number {
  if (raw === undefined || raw === '') return fallback;
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

/**
 * pg pool tuning for hosted Postgres (idle disconnects, serverless).
 * Override via PG_* env vars if your provider docs recommend different values.
 */
function createPgPool(connectionString: string): Pool {
  const max = parsePositiveInt(process.env.PG_POOL_MAX, 10);
  // Default 20s — hosted Postgres cold-starts / TLS often exceed 10s after idle.
  const connectionTimeoutMillis = parsePositiveInt(
    process.env.PG_CONNECTION_TIMEOUT_MS,
    20_000
  );
  const idleTimeoutMillis = parsePositiveInt(
    process.env.PG_IDLE_TIMEOUT_MS,
    30_000
  );

  /**
   * Lets the pool release workers on idle (good on Vercel Fluid / serverless).
   * Set PG_POOL_ALLOW_EXIT_ON_IDLE=false if you run a long-lived Node process and see churn.
   */
  const allowExitOnIdleDefault =
    process.env.VERCEL === '1' || process.env.AWS_LAMBDA_FUNCTION_NAME != null;
  const allowExitOnIdle =
    process.env.PG_POOL_ALLOW_EXIT_ON_IDLE === 'true'
      ? true
      : process.env.PG_POOL_ALLOW_EXIT_ON_IDLE === 'false'
        ? false
        : allowExitOnIdleDefault;

  const pool = new Pool({
    connectionString,
    max,
    connectionTimeoutMillis,
    idleTimeoutMillis,
    allowExitOnIdle,
  });

  pool.on('error', (err) => {
    logger.error({ err }, 'PostgreSQL pool client error');
  });

  return pool;
}

function createPrismaClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      'DATABASE_URL is missing. Copy .env.example and configure PostgreSQL.'
    );
  }

  const poolUrl = normalizeDatabaseUrlForPgPool(connectionString);

  const pool =
    globalForPrisma.pgPool ?? createPgPool(poolUrl);
  globalForPrisma.pgPool = pool;

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

function getPrisma(): PrismaClient {
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = createPrismaClient();
  }
  return globalForPrisma.prisma;
}

/**
 * Lazy singleton: importing server-action modules must not eagerly open DB pools or
 * require DATABASE_URL until an actual query runs (e.g. GET /login only registers actions).
 */
export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop, receiver) {
    const client = getPrisma();
    const value = Reflect.get(client, prop, receiver);
    if (typeof value === 'function') {
      return value.bind(client);
    }
    return value;
  },
}) as PrismaClient;
