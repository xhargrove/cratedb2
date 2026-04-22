# Cratedb

Product-grade rebuild of **Cratedb** — a personal vinyl collection app (not related to [CrateDB](https://cratedb.com/) the database).

## Stack

- **Next.js** (App Router) · **TypeScript** · **Tailwind CSS**
- **PostgreSQL** via **Prisma 7** with **`pg` + `@prisma/adapter-pg`** (migrations in `prisma/migrations`)
- **Zod** for validation · **Pino** for server logging
- **Vitest** for unit tests · **ESLint** + **Prettier**

## Prerequisites

- Node.js 20+
- PostgreSQL 14+ (local or hosted)

## Setup

```bash
cp .env.example .env
# Edit DATABASE_URL to match your Postgres instance.

npm install
npm run db:migrate   # applies migrations (development); includes Phase 2 auth + `records` table
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

**Auth:** email/password signup and login store **Argon2id** hashes on `User`; sessions are opaque ids in an **httpOnly** cookie mapped to rows in `Session`. Protected UI lives under `/dashboard` (`(app)` route group). Apply pending migrations before first auth use if upgrading from Phase 1 only.

**Records (Phase 3):** full **CRUD** for `CollectionRecord` with server ownership on every call. UI entry points: `/dashboard/records`, `/dashboard/records/new`, `/dashboard/records/[id]`, `/dashboard/records/[id]/edit`. The client never sends a trusted `ownerId` — it always comes from `requireUser()`.

## Scripts

| Command                | Description                   |
| ---------------------- | ----------------------------- |
| `npm run dev`          | Dev server (Turbopack)        |
| `npm run build`        | Production build              |
| `npm run start`        | Serve production build        |
| `npm run lint`         | ESLint                        |
| `npm run typecheck`    | TypeScript (`tsc --noEmit`)   |
| `npm run format`       | Prettier write                |
| `npm run format:check` | Prettier check                |
| `npm run test`         | Vitest once                   |
| `npm run db:migrate`   | Create/apply migrations (dev) |
| `npm run db:studio`    | Prisma Studio                 |

## Project layout

```
src/app/        App Router (routes, layouts, error boundaries)
src/components/ Shared UI
src/db/         Prisma client singleton
src/lib/        Env helpers, logger, future validations/services
src/server/     Actions, auth/session helpers, domain queries (no client imports)
src/types/      Shared TS types
tests/          Vitest specs
prisma/         Schema + migrations
docs/           Migration notes and planning
```

Prisma Client is generated into `src/generated/prisma` on `npm install` (`postinstall`: `prisma generate`). Do not edit generated files.

## Environment

Copy `.env.example` to `.env` or `.env.local`. Required for database access:

- `DATABASE_URL` — PostgreSQL connection string

Optional:

- `LOG_LEVEL` — Pino log level (`info`, `debug`, …)

Logs are JSON lines on stdout; optional: `npm run dev 2>&1 | npx pino-pretty`.

## Documentation

- [docs/MIGRATION.md](docs/MIGRATION.md) — legacy audit
- [REBUILD_PLAN.md](REBUILD_PLAN.md) — architecture and phases

## Validation

```bash
npm run check
```

Runs Prettier check, ESLint, TypeScript, Vitest, and production build.
