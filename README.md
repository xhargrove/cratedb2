# Cratedb

Cratedb is a **personal vinyl collection** web app: sign in, catalogue releases you own, track a wantlist, optionally share a **public profile** URL, follow other collectors, and view **insights** derived from your data.  
It is **not** related to [CrateDB](https://cratedb.com/) the database product.

This repository is a **PostgreSQL-backed** rebuild (legacy Streamlit + JSON lives elsewhere; see [docs/MIGRATION.md](docs/MIGRATION.md) for audit notes only).

---

## Feature set (current scope)

| Area           | What ships                                                                                                                                                                                                                                                               |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Auth**       | Email/password, Argon2id hashing, opaque session id in httpOnly cookie, server-side session rows                                                                                                                                                                         |
| **Collection** | CRUD for owned records (`artist`, `title`, optional `year`, `genre`, storage, notes); search, genre/storage facets, sort; list/grid; **hard cap** 500 rows per request with UI notice                                                                                    |
| **Artwork**    | Optional image per record; stored **on local disk** under configurable root; served via **`GET /api/records/[id]/artwork`** — **owners** always; **other viewers** only if that owner’s **`collectionPublic`** is true (otherwise **403**), not as files under `/public` |
| **Wantlist**   | Separate list with dedupe key (artist/title/year rules); conflicts with owned records rejected server-side                                                                                                                                                               |
| **Social**     | Follow/unfollow users; follower counts on dashboard insights                                                                                                                                                                                                             |
| **Public**     | **`/u/[id]`** public profile page; **`Profile.collectionPublic`** hides collection rows when false (email never shown publicly)                                                                                                                                          |
| **Insights**   | **`/dashboard/stats`** — owner-only counts, genre/artist/year breakdowns, artwork coverage                                                                                                                                                                               |
| **Spotify**    | **Optional** album search when adding/editing a record (Web API client credentials); prefills fields; stores optional **`spotifyAlbumId`** — off unless `SPOTIFY_*` env is set                                                                                           |
| **Enrichment** | **Optional** MusicBrainz lookup on record **edit** — off unless env enables it                                                                                                                                                                                           |

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

## Setup

```bash
cp .env.example .env
# Set DATABASE_URL to your Postgres connection string.

npm install
npm run db:migrate
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

- **Development DB:** `npm run db:migrate` runs **`prisma migrate dev`** (creates/applies migrations interactively).
- **Production / CI:** apply pending migrations with  
  **`npx prisma migrate deploy`**  
  (requires `DATABASE_URL`; does not prompt for migration names).

---

## Scripts

| Command                | Description                                                      |
| ---------------------- | ---------------------------------------------------------------- |
| `npm run dev`          | Dev server (Turbopack)                                           |
| `npm run build`        | Production build                                                 |
| `npm run start`        | Serve production build                                           |
| `npm run lint`         | ESLint                                                           |
| `npm run typecheck`    | `tsc --noEmit`                                                   |
| `npm run test`         | Vitest once                                                      |
| `npm run format`       | Prettier write                                                   |
| `npm run format:check` | Prettier check                                                   |
| `npm run check`        | format:check + lint + typecheck + test + **build**               |
| `npm run db:generate`  | `prisma generate`                                                |
| `npm run db:migrate`   | `prisma migrate dev`                                             |
| `npm run db:push`      | `prisma db push` (prototype only — prefer migrate for real envs) |
| `npm run db:studio`    | Prisma Studio                                                    |

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

| Variable                   | Behavior                                                                                                                                                                                             |
| -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`ARTWORK_STORAGE_ROOT`** | Absolute directory for album artwork files. **Default:** `<project>/storage/artwork` resolved from cwd. Stored in DB as a relative key `{ownerId}/{recordId}.{ext}` — blobs are **not** in Postgres. |

**Privacy / behaviour:** Artwork is not served from `/public`. The API route allows the **record owner** always; **unauthenticated or other logged-in users** receive bytes only when that owner’s collection is **public** (`Profile.collectionPublic`); otherwise non-owners get **403**. When public, responses may use `Cache-Control: public` (see route handler).

**Deployment caveat:** On **ephemeral** filesystems (many PaaS containers), disk is wiped on redeploy unless you mount persistent storage or switch to object storage — artwork would need a **storage strategy change** for production beyond a single persistent disk.

### Optional — metadata enrichment (MusicBrainz)

Enrichment is **disabled by default**. Core record CRUD never requires it.

| Variable                     | Behavior                                                                                                                                        |
| ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| **`ENRICHMENT_ENABLED`**     | Must be **`true`** to enable lookup/apply actions.                                                                                              |
| **`MUSICBRAINZ_CONTACT`**    | Required when enabled — contact string for MusicBrainz [API etiquette](https://musicbrainz.org/doc/MusicBrainz_API/Rate_Limiting) (e.g. email). |
| **`MUSICBRAINZ_USER_AGENT`** | Optional full `User-Agent` header override (otherwise built from app name + contact).                                                           |

When disabled, the record edit screen shows why enrichment is unavailable.

### Optional — Spotify Web API (album search)

Uses the **client credentials** flow only. Set both variables from the [Spotify Developer Dashboard](https://developer.spotify.com/dashboard) (app → Client ID and Client secret). No Spotify user login is required to search; the user still picks a result and can edit fields before saving.

| Variable                    | Behavior                                                                        |
| --------------------------- | ------------------------------------------------------------------------------- |
| **`SPOTIFY_CLIENT_ID`**     | Required together with secret for album search UI.                              |
| **`SPOTIFY_CLIENT_SECRET`** | Required together with Client ID — **server only**, never expose to the client. |

Quotas and rate limits apply per [Spotify’s policies](https://developer.spotify.com/policy). Search is **bounded** (query length and result count).

When unset, **new/edit record** screens show Spotify search as unavailable with a short explanation (same pattern as MusicBrainz enrichment).

---

## Privacy & public profile

- **`Profile.collectionPublic`** (default `true`): when **`false`**, **`/u/[id]`** hides collection rows (header may still appear). Artwork API returns **403** for non-owners viewing that owner’s records when applicable.
- Public profile routes **never** expose account email.

---

## Documentation

| Doc                                                        | Contents                                                                                 |
| ---------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| [docs/MIGRATION.md](docs/MIGRATION.md)                     | Legacy Streamlit + JSON **audit** and conceptual mapping — **not** an automated importer |
| [REBUILD_PLAN.md](REBUILD_PLAN.md)                         | Original phased plan + **final status** note                                             |
| [REBUILD_READINESS_REPORT.md](REBUILD_READINESS_REPORT.md) | Hand-off: routes, schema, security, caveats, production readiness                        |

---

## Validation

```bash
npm run check
```

Runs Prettier check, ESLint, TypeScript, Vitest, and production build.
