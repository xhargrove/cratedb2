/** Shared domain and infrastructure types (manual). Prefer inferring from Prisma/Zod where possible. */

export type AppErrorShape = {
  message: string;
  code?: string;
  digest?: string;
};
