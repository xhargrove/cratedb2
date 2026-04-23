# Deployment runbook (Cratedb)

This file is a **short operator runbook**. Full variable reference and feature notes live in **[README.md](../README.md)** and **[.env.example](../.env.example)**.

## First-time production deploy (order)

1. **Provision PostgreSQL** and obtain a connection string (`DATABASE_URL`).
2. **Set environment variables** on the host or secret store (at minimum `DATABASE_URL`; see README for optional integrations).
3. **Install dependencies:** `npm ci` (or `npm install` in controlled contexts).
4. **Generate Prisma Client** — runs automatically via **`postinstall`** (`prisma generate`). If `postinstall` is skipped in CI, run `npm run db:generate` explicitly before build.
5. **Apply migrations (production):**  
   **`npm run db:deploy`**  
   This runs `prisma migrate deploy`. Do **not** use `npm run db:migrate` (`migrate dev`) against production — that command is for local development and can create or rename migrations interactively.
6. **Build:** `npm run build`
7. **Start:** `npm run start` (or your process manager wrapping `next start`). Set `NODE_ENV=production` as usual for Next.js.

## If migrations are missing or stale

The app expects the database schema to match the migration history. If migrations were not applied:

- API routes and server actions that touch the DB may throw **Prisma errors** (unknown table/column, migration pending, etc.).
- There is **no** runtime auto-migrate in production — operators must run **`npm run db:deploy`** as part of deploy.

## Artwork storage (filesystem)

- Cratedb stores artwork **on the local filesystem** under **`ARTWORK_STORAGE_ROOT`**, defaulting to `<cwd>/storage/artwork`.
- **Albums and singles** share this root; paths in the DB are relative keys, not blobs in Postgres.
- **Ephemeral/serverless** platforms often lose disk on redeploy — configure a **mounted volume** or accept that artwork will disappear unless you move to external storage later.

See README § “Optional — artwork” for privacy rules (API `403` when collection is private).

## After deploy

Run the **[post-deploy smoke checklist](./DEPLOY_SMOKE_TEST.md)** against your base URL.

## Validation before release

From the repo root:

```bash
npm run check
```

See **[REBUILD_READINESS_REPORT.md](../REBUILD_READINESS_REPORT.md)** for scope honesty and caveats.

---

## `DATABASE_URL` not working (“invalid” or connection refused)

The app and Prisma expect a **single PostgreSQL URL** string. Problems usually come from **format**, **encoding**, or **SSL**, not from Cratedb logic.

### 1. Confirm the variable is actually set where you run commands

Migration CLI reads **`prisma.config.ts`**, which loads **`.env`** from the **current working directory** via `dotenv/config`.

- Run **`npm run db:deploy`** from the **repository root** (where `package.json` lives), **or**
- Export `DATABASE_URL` in the shell before migrating, **or**
- Set it in your host’s environment (Vercel/Railway/Fly dashboard, etc.).

Quick check from repo root (does **not** print your password):

```bash
node -r dotenv/config -e "const u=process.env.DATABASE_URL; if(!u){console.error('DATABASE_URL is unset'); process.exit(1)} try{new URL(u); console.log('DATABASE_URL parses as a URL OK (length', u.length, ')')} catch(e){console.error('Not a valid URL string:', e.message); process.exit(1)}"
```

### 2. Special characters in the password (most common “invalid URL” fix)

Anything in the password like **`@ : / ? # & %`** breaks the URL unless **percent-encoded**.

Example: password `p@ss:word` → encode only the password → `p%40ss%3Aword`, then:

`postgresql://myuser:p%40ss%3Aword@host.example:5432/dbname?schema=public`

Use your language’s URL encoder on **the password only**, or paste the **full connection string** from your host’s dashboard (they usually encode it for you).

### 3. Hosted Postgres (Neon, Supabase, RDS, etc.)

- Use the **exact** connection string your provider gives for **serverless / pooled / direct** as documented (direct vs pooler hostnames differ).
- SSL: follow the provider’s query string (e.g. `sslmode=require` or `sslmode=verify-full`). This repo normalizes some legacy `sslmode` values for the `pg` pool (see `src/db/normalize-database-url.ts`); if the driver still warns, switch to the mode your host documents.

### 4. `.env` file formatting

- One line: `DATABASE_URL="postgresql://..."` — **no** trailing spaces after the closing quote.
- Avoid smart quotes (`"` `"`) — use plain ASCII `"`.
- Do **not** commit `.env`; keep secrets only in `.env`, `.env.local`, or the host’s secret store.

### 5. Still failing?

Run (from repo root, after `DATABASE_URL` is set):

```bash
npx prisma migrate status
```

Read the **exact** Prisma/pg error (timeout, refused, TLS, authentication failed). That message points to network/firewall vs credentials vs SSL — paste **only the error text**, not your URL, if you need help interpreting it.
