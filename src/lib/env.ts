import { z } from 'zod';

/**
 * Validates process.env at runtime for server-only code paths.
 * Do not import from Client Components — keep usage in Route Handlers, loaders, server actions, or `instrumentation.ts`.
 */
const serverEnvSchema = z.object({
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  NODE_ENV: z.enum(['development', 'production', 'test']).optional(),
  ARTWORK_STORAGE_BACKEND: z.enum(['local', 's3']).default('local'),
  S3_BUCKET: z.string().optional(),
  S3_REGION: z.string().optional(),
  S3_ENDPOINT: z.string().optional(),
  S3_FORCE_PATH_STYLE: z.enum(['true', 'false']).optional(),
  S3_ACCESS_KEY_ID: z.string().optional(),
  S3_SECRET_ACCESS_KEY: z.string().optional(),
  LOG_LEVEL: z
    .enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'])
    .optional(),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

let cachedEnv: ServerEnv | null = null;

export function getServerEnv(): ServerEnv {
  if (cachedEnv) return cachedEnv;
  const parsed = serverEnvSchema.safeParse(process.env);
  if (!parsed.success) {
    const msg = parsed.error.flatten().fieldErrors;
    throw new Error(`Invalid server environment: ${JSON.stringify(msg)}`);
  }
  if (parsed.data.ARTWORK_STORAGE_BACKEND === 's3') {
    const requiredForS3 = [
      'S3_BUCKET',
      'S3_REGION',
      'S3_ACCESS_KEY_ID',
      'S3_SECRET_ACCESS_KEY',
    ] as const;
    const missing = requiredForS3.filter((k) => {
      const value = parsed.data[k];
      return !value || value.trim().length === 0;
    });
    if (missing.length > 0) {
      throw new Error(
        `Invalid server environment: missing required S3 vars for ARTWORK_STORAGE_BACKEND=s3: ${missing.join(', ')}`
      );
    }
  }
  cachedEnv = parsed.data;
  return parsed.data;
}
