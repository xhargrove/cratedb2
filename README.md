# Cratedb

Cratedb is a **personal vinyl collection** web app: sign in, catalogue releases you own, track a wantlist, optionally share a **public profile** URL, follow other collectors, and view **insights** derived from your data.  
It is **not** related to [CrateDB](https://cratedb.com/) the database product.

This repository is a **PostgreSQL-backed** rebuild (legacy Streamlit + JSON lives elsewhere; see [docs/MIGRATION.md](docs/MIGRATION.md) for audit notes only).

---

## Feature set (current scope)

| Area           | What ships                                                                                                                                                                                                                                                                                                                                     |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Auth**       | Email/password, Argon2id hashing, opaque session id in httpOnly cookie, server-side session rows                                                                                                                                                                                                                                               |
| **Collection** | CRUD for owned records (`artist`, `title`, optional `year`, `genre`, storage, notes); search, genre/storage facets, sort; list/grid; **hard cap** 500 rows per request with UI notice                                                                                                                                                          |
| **Artwork**    | Optional images for **records and singles**; stored **on local disk** under one configurable root; served via **`GET /api/records/[id]/artwork`** and **`GET /api/singles/[id]/artwork`** — **owners** always; **other viewers** only if that owner’s **`collectionPublic`** is true (otherwise **403**); not exposed as files under `/public` |
| **Wantlist**   | Separate list with dedupe key (artist/title/year rules); conflicts with owned records rejected server-side                                                                                                                                                                                                                                     |
| **Social**     | Follow/unfollow users; follower counts on dashboard insights                                                                                                                                                                                                                                                                                   |
| **Public**     | **`/u/[id]`** public profile page; **`Profile.collectionPublic`** hides collection rows when false (email never shown publicly)                                                                                                                                                                                                                |
| **Insights**   | **`/dashboard/stats`** — owner-only counts, genre/artist/year breakdowns, artwork coverage                                                                                                                                                                                                                                                     |
| **Spotify**    | **Optional** album search on records and track search on singles (client credentials); optional **`spotifyAlbumId`** / **`spotifyTrackId`** — off unless both `SPOTIFY_*` vars are set                                                                                                                                                         |
| **Enrichment** | **Optional** MusicBrainz lookup on record **edit** — off unless env enables it                                                                                                                                                                                                                                                                 |

**Intentionally out of scope for this codebase:** marketplace, messaging, activity feed, “login with Spotify” OAuth for users, Spotify audio-features / discovery APIs beyond album search, CSV/JSON export UX, automated legacy JSON→Postgres import scripts, hosted object storage for artwork by default.

---

## Stack

- **Next.js 15** (App Router) · React 19 · TypeScript · Tailwind CSS 4
- **PostgreSQL** · **Prisma 7** · `pg` + `@prisma/adapter-pg`
- **Zod** validation · **Argon2** passwords · **Pino** logging · **Vitest**

Prisma Client is generated to **`src/generated/prisma`** (`postinstall`: `prisma generate`). Do not edit generated files.

---

## Prerequisites

- **Node.js 20+**
- **PostgreSQL 14+** (local or hosted)

---

## Setup (local development)

```bash
cp .env.example .env
# Set DATABASE_URL to your Postgres connection string.

npm install
npm run db:migrate
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

- **Development DB:** `npm run db:migrate` runs **`prisma migrate dev`** (interactive; **never** point this at production).
- **Production / CI:** apply pending migrations with **`npm run db:deploy`** (same as `prisma migrate deploy`). Requires `DATABASE_URL`; does **not** prompt for migration names.

---

## Production deployment (first-time and ongoing)

Use the **[Deployment runbook](docs/DEPLOYMENT.md)** for ordered steps (env → migrations → build → start) and **[post-deploy smoke checklist](docs/DEPLOY_SMOKE_TEST.md)** after go-live.

**Minimum operator actions:**

| Step          | Command / action                                                                                                                               |
| ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| Install       | `npm ci` (recommended in CI/production)                                                                                                        |
| Env           | Set `DATABASE_URL`; optional vars per sections below                                                                                           |
| Prisma Client | Automatic via **`postinstall`** (`prisma generate`). If installs skip `postinstall`, run **`npm run db:generate`** before **`npm run build`**. |
| Schema        | **`npm run db:deploy`** on the target database **before** routing traffic                                                                      |
| Build / run   | **`npm run build`** then **`npm run start`** (with `NODE_ENV=production`)                                                                      |

**If migrations are not applied:** database operations will fail with Prisma errors (missing tables/columns). The app does **not** auto-migrate in production.

**Schema drift:** Avoid `prisma db push` against shared/prod databases; use the migration folders in **`prisma/migrations/`** and **`npm run db:deploy`**.

---

## Scripts

| Command                | Description                                                     |
| ---------------------- | --------------------------------------------------------------- |
| `npm run dev`          | Dev server (Turbopack)                                          |
| `npm run build`        | Production build                                                |
| `npm run start`        | Serve production build                                          |
| `npm run lint`         | ESLint                                                          |
| `npm run typecheck`    | `tsc --noEmit`                                                  |
| `npm run test`         | Vitest once                                                     |
| `npm run format`       | Prettier write                                                  |
| `npm run format:check` | Prettier check                                                  |
| `npm run check`        | format:check + lint + typecheck + test + **build**              |
| `npm run db:generate`  | `prisma generate`                                               |
| `npm run db:migrate`   | `prisma migrate dev` (local dev **only**)                       |
| `npm run db:deploy`    | `prisma migrate deploy` (**production / CI**)                   |
| `npm run db:push`      | `prisma db push` (prototype only — **not** for prod discipline) |
| `npm run db:studio`    | Prisma Studio                                                   |

---

## Environment variables

Copy **`.env.example`** to `.env` or `.env.local`. Next.js loads `.env.local` with precedence over `.env`.

### Required

| Variable           | Purpose                                                     |
| ------------------ | ----------------------------------------------------------- |
| **`DATABASE_URL`** | PostgreSQL URL (required whenever the app talks to the DB). |

**Postgres SSL in development:** If the terminal or browser console shows a **Node `pg` warning** about `sslmode` (`require`, `prefer`, etc.) and future driver behavior, it comes from parsing your URL — not a React bug. Use an **explicit `sslmode`** on the query string that your host recommends (often **`verify-full`** for managed Postgres). See comments in `.env.example`.

### Optional — runtime / ops

| Variable               | Default / behavior                                                                                                                    |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| **`LOG_LEVEL`**        | Pino level (`fatal`, `error`, `warn`, `info`, `debug`, `trace`, `silent`). Default: `debug` in development, `info` in production.     |
| **`NODE_ENV`**         | Set by tooling (`development` / `production` / `test`). Used for cookie `secure`, Prisma logs, logger defaults.                       |
| **`PRISMA_QUERY_LOG`** | Set to **`true`** to log SQL in development. **Off by default** so user-influenced query fragments are not printed unless you opt in. |

### Optional — artwork (local filesystem)

| Variable                   | Behavior                                                                                                                                                                                                                                                                                       |
| -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`ARTWORK_STORAGE_ROOT`** | Absolute directory for **all** cover images (albums **and** singles). **Default:** `<cwd>/storage/artwork` (`cwd` is the Node process working directory). DB stores relative keys only (`{ownerId}/{recordId}.{ext}` or `{ownerId}/singles/{singleId}.{ext}`) — blobs are **not** in Postgres. |

**Privacy / behaviour:** Artwork is not served from `/public`. The artwork API routes allow the **owner** always; **others** receive bytes only when that owner’s collection is **public** (`Profile.collectionPublic`); otherwise **403**. When public, responses may use `Cache-Control: public` (see route handlers).

**Deployment caveat:** On **ephemeral** filesystems (many PaaS / serverless-style containers), local disk is wiped on redeploy unless you attach a **persistent volume** or later adopt object storage. Without persistence, DB rows may still point at keys whose files are **gone** — GET returns **404**. This codebase does **not** ship object storage; operators must plan disk or accept re-upload after redeploy.

### Optional — metadata enrichment (MusicBrainz)

Enrichment is **disabled by default**. Core record CRUD never requires it.

| Variable                     | Behavior                                                                                                                                        |
| ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| **`ENRICHMENT_ENABLED`**     | Must be **`true`** to enable lookup/apply actions.                                                                                              |
| **`MUSICBRAINZ_CONTACT`**    | Required when enabled — contact string for MusicBrainz [API etiquette](https://musicbrainz.org/doc/MusicBrainz_API/Rate_Limiting) (e.g. email). |
| **`MUSICBRAINZ_USER_AGENT`** | Optional full `User-Agent` header override (otherwise built from app name + contact).                                                           |

When disabled, the record edit screen shows why enrichment is unavailable.

### Optional — Spotify Web API (album + track search)

Uses the **client credentials** flow only. Set both variables from the [Spotify Developer Dashboard](https://developer.spotify.com/dashboard) (app → Client ID and Client secret). No Spotify user login is required to search; the user still picks a result and can edit fields before saving. Album search appears on records; track search appears on singles.

| Variable                    | Behavior                                                                        |
| --------------------------- | ------------------------------------------------------------------------------- |
| **`SPOTIFY_CLIENT_ID`**     | Required together with secret for album search UI.                              |
| **`SPOTIFY_CLIENT_SECRET`** | Required together with Client ID — **server only**, never expose to the client. |

Quotas and rate limits apply per [Spotify’s policies](https://developer.spotify.com/policy). Search is **bounded** (query length and result count).

When unset, record and single edit screens show Spotify search as unavailable with a short explanation (same pattern as MusicBrainz enrichment).

---

## Privacy & public profile

- **`Profile.collectionPublic`** (default `true`): when **`false`**, **`/u/[id]`** hides collection rows (header may still appear). Artwork API returns **403** for non-owners viewing that owner’s records when applicable.
- Public profile routes **never** expose account email.

---

## Documentation

| Doc                                                        | Contents                                                                                 |
| ---------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)                   | Production runbook + `DATABASE_URL` troubleshooting (encoding, SSL, env loading)         |
| [docs/DEPLOY_SMOKE_TEST.md](docs/DEPLOY_SMOKE_TEST.md)     | Post-deploy verification checklist                                                       |
| [docs/MIGRATION.md](docs/MIGRATION.md)                     | Legacy Streamlit + JSON **audit** and conceptual mapping — **not** an automated importer |
| [REBUILD_PLAN.md](REBUILD_PLAN.md)                         | Original phased plan + **final status** note                                             |
| [REBUILD_READINESS_REPORT.md](REBUILD_READINESS_REPORT.md) | Scope honesty, caveats, deployment risks, validation gate                                |

---

## Validation

```bash
npm run check
```

Runs Prettier check, ESLint, TypeScript, Vitest, and production build.
