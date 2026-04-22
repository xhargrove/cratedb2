import pino from 'pino';

/**
 * Server-side structured logging (JSON to stdout).
 * Import only from server code — not from Client Components.
 *
 * Note: Avoid `pino-pretty` transport here; worker threads conflict with Next.js/Turbopack dev.
 * Pipe logs through `npx pino-pretty` locally if human-readable output is needed.
 */
const isDev = process.env.NODE_ENV === 'development';

export const logger = pino({
  level: process.env.LOG_LEVEL ?? (isDev ? 'debug' : 'info'),
});
