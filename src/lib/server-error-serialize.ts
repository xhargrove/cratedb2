/**
 * Normalize unknown errors for structured logs (Vercel / Pino). Safe on Edge if needed.
 */

export type SerializedServerError = {
  errorName: string;
  errorMessage: string;
  digest?: string;
  stackPreview?: string;
  prismaCode?: string;
  prismaMeta?: Record<string, unknown>;
  /** Rough classification for dashboards / alerts */
  category:
    | 'auth_session'
    | 'database'
    | 'env_config'
    | 'storage'
    | 'validation'
    | 'unknown';
};

function prismaShape(e: unknown): { code?: string; meta?: unknown } {
  if (typeof e !== 'object' || e === null) return {};
  const rec = e as Record<string, unknown>;
  const code = typeof rec.code === 'string' ? rec.code : undefined;
  return { code, meta: rec.meta };
}

function categorize(
  msg: string,
  prismaCode?: string,
  errorName?: string
): SerializedServerError['category'] {
  if (errorName === 'SessionBackendUnavailableError') return 'auth_session';
  const m = msg.toLowerCase();
  if (
    prismaCode?.startsWith('P') ||
    m.includes('prisma') ||
    m.includes('postgres') ||
    m.includes('database_url') ||
    m.includes('connection')
  ) {
    return 'database';
  }
  if (
    m.includes('invalid server environment') ||
    m.includes('database_url is missing') ||
    (m.includes('s3') && m.includes('missing'))
  ) {
    return 'env_config';
  }
  if (
    m.includes('sessionbackendunavailable') ||
    m.includes('session_backend_unavailable')
  ) {
    return 'auth_session';
  }
  if (m.includes('artwork') && (m.includes('s3') || m.includes('storage'))) {
    return 'storage';
  }
  return 'unknown';
}

export function serializeUnknownError(e: unknown): SerializedServerError {
  if (e === null || e === undefined) {
    return {
      errorName: 'EmptyError',
      errorMessage: String(e),
      category: 'unknown',
    };
  }

  const { code: prismaCode, meta } = prismaShape(e);
  const err =
    e instanceof Error
      ? e
      : new Error(typeof e === 'string' ? e : JSON.stringify(e));

  const digest =
    typeof (err as Error & { digest?: unknown }).digest === 'string'
      ? (err as Error & { digest: string }).digest
      : undefined;

  const stack = err.stack ?? '';
  const stackPreview =
    stack.length > 800 ? `${stack.slice(0, 800)}…` : stack || undefined;

  const category = categorize(err.message, prismaCode, err.name);

  const out: SerializedServerError = {
    errorName: err.name,
    errorMessage: err.message || '(no message)',
    digest,
    stackPreview,
    prismaCode: prismaCode?.startsWith('P') ? prismaCode : undefined,
    category,
  };
  if (meta !== undefined && prismaCode?.startsWith('P')) {
    try {
      out.prismaMeta =
        typeof meta === 'object' && meta !== null
          ? (meta as Record<string, unknown>)
          : { value: meta as unknown };
    } catch {
      /* ignore */
    }
  }
  return out;
}
