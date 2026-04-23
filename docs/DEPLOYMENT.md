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

### Runtime startup guard (fail-fast env)

- Cratedb validates required server env during Node runtime registration (`src/instrumentation.ts`).
- If required env is missing/invalid (for example `DATABASE_URL`), startup fails immediately instead of failing later on first DB call.
- Treat this as a deployment gate, not a warning.

## If migrations are missing or stale

The app expects the database schema to match the migration history. If migrations were not applied:

- API routes and server actions that touch the DB may throw **Prisma errors** (unknown table/column, migration pending, etc.).
- There is **no** runtime auto-migrate in production — operators must run **`npm run db:deploy`** as part of deploy.

## Artwork storage (S3-compatible)

- Production target is **`ARTWORK_STORAGE_BACKEND=s3`** with S3-compatible object storage.
- Required when backend is `s3`: `S3_BUCKET`, `S3_REGION`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`.
- Optional for S3-compatible providers: `S3_ENDPOINT`, `S3_FORCE_PATH_STYLE`.
- DB continues storing relative keys (`artworkKey`) and metadata only; artwork bytes stay outside Postgres.
- Local backend (`ARTWORK_STORAGE_BACKEND=local`) exists for development and migration support.

**Derivatives / storage footprint:** Each collection artwork upload stores the **original** plus two **WebP** objects (thumbnail and medium) at predictable sibling keys. Expect roughly **3× object count** for new uploads versus originals-only legacy data. **Sharp** runs at upload time in the app process (CPU); no separate image worker is required. Missing derivatives fall back to the original at read time until the row is re-saved or a backfill is run.

**HTTP:** `GET /api/records|singles|twelve-inch/[id]/artwork?size=thumb|medium|full` — privacy rules unchanged; **`full`** if `size` is omitted.

See README § “Artwork storage (S3-compatible object storage)” for privacy and key details.

## Container QR codes (derived physical slots)

- “Containers” are **virtual**: one card per distinct non-`NONE` physical storage assignment across **albums**, **45s (singles)**, and **12-inch singles** (shelf row/column, crate number, or box preset/custom). There is no separate container table.
- Each QR encodes the **absolute** URL to `/dashboard/containers/[slotKey]` where `slotKey` is an opaque base64url payload (dashboard auth). Scanning opens the live slot page after sign-in; only the URL is encoded, not inventory data.
- In production, set **`NEXT_PUBLIC_APP_URL`** to your canonical public origin (for example `https://your-domain.com`) so QR targets stay correct behind reverse proxies. If unset, the app derives the origin from incoming request headers when possible.

### Migrating existing local artwork objects

If rows already reference local files, run:

```bash
npm run migrate:artwork:to-object -- --dry-run
npm run migrate:artwork:to-object
```

- Script is idempotent by default (skips keys that already exist in object storage).
- Add `--force` to re-upload existing objects.

## Session reliability (dashboard)

- The dashboard uses an HttpOnly cookie (`cratedb_session`) validated against Postgres each request (`resolveAuth` → `resolveSessionForToken`).
- **Transient Postgres errors** during session lookup **must not** clear the cookie or send users to `/login`; the UI may show “Could not verify your session” with **Try again** instead.
- Structured logs use `auth_event` (for example `auth_no_cookie`, `auth_session_not_found`, `auth_session_expired`, `auth_session_lookup_error`, `auth_require_user_redirect`, `auth_require_user_blocked_backend`). Spikes in `auth_session_lookup_error` usually mean DB connectivity stress, not mass logout.

## Auth abuse protection assumptions

- App-level rate limiting is enforced in server actions for `loginAction` and `signupAction` (request fingerprint + email, fixed window).
- This limiter is in-process memory by design for this sprint. In multi-instance deployments it is best-effort per instance.
- Production should still enforce edge/WAF controls (for example CDN/WAF per-IP throttle and bot protection).

## Baseline security headers

Middleware applies baseline headers on app responses:

- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Strict-Transport-Security` only when request protocol is HTTPS

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
