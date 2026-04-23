# Cratedb — deployment readiness report

This document summarizes **implemented behavior**, **deployment risks**, and **honest limits** for operators. It was refreshed for **deployment-hardening** documentation (env, migrations, filesystem artwork, smoke testing) — not as a promise of SaaS-grade multi-tenant operations unless you configure the stack accordingly.

**Operators should also read:** [README.md](README.md), [.env.example](.env.example), [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md), [docs/DEPLOY_SMOKE_TEST.md](docs/DEPLOY_SMOKE_TEST.md).

---

## Validation results (report time)

Full gate:

```bash
npm run format:check && npm run lint && npm run typecheck && npm run test && npm run build
```

_(Same checks as `npm run check`; run after edits and before release.)_

| Step                       | Result (last full gate)             |
| -------------------------- | ----------------------------------- |
| **`npm run format:check`** | **Pass** — all files Prettier-clean |
| **`npm run lint`**         | **Pass** — no ESLint issues         |
| **`npm run typecheck`**    | **Pass** — `tsc --noEmit`           |
| **`npm run test`**         | **Pass** — 35 files, 133 tests      |
| **`npm run build`**        | **Pass** — Next.js production build |

---

## 1. Architecture (unchanged summary)

- **Framework:** Next.js 15 App Router; server actions for mutations; route handlers for artwork bytes.
- **Data:** PostgreSQL + Prisma 7 (`pg` adapter). Ownership enforced with `ownerId` in queries.
- **Auth:** Session id in httpOnly cookie; full validation in server layouts/actions.
- **Middleware:** Redirects unauthenticated users from `/dashboard/*` when the session cookie is absent.

---

## 2. Routes (inventory)

| Route                                                                                 | Purpose                                                                                        |
| ------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| `/`                                                                                   | Landing                                                                                        |
| `/login`, `/signup`                                                                   | Auth                                                                                           |
| `/dashboard`                                                                          | Hub                                                                                            |
| `/dashboard/profile`                                                                  | Profile settings (display name, bio, vibe, collection visibility)                              |
| `/dashboard/records`, `/dashboard/records/new`, `/dashboard/records/[id]`, `.../edit` | Album collection                                                                               |
| `/dashboard/singles`, `/dashboard/singles/new`, `/dashboard/singles/[id]`, `.../edit` | 45 RPM singles                                                                                 |
| `/dashboard/wantlist`, `/dashboard/wantlist/new`, `/dashboard/wantlist/[id]/edit`     | Wantlist                                                                                       |
| `/dashboard/stats`                                                                    | Owner insights                                                                                 |
| `/u/[id]`                                                                             | Public profile — **album rows only** when collection is public (singles not listed here today) |
| `GET /api/records/[id]/artwork`                                                       | Artwork bytes (privacy rules apply)                                                            |
| `GET /api/singles/[id]/artwork`                                                       | Single artwork bytes (same privacy rules)                                                      |

---

## 3. Schema / migrations

**Migration chain** lives under `prisma/migrations/` (ordered timestamps). Evolution includes: init/auth, records, artwork columns, wantlist, follows + `collectionPublic`, enrichment columns, Spotify ids, **collection singles**, singles Spotify track id, **profile bio + ProfileVibe enum**.

| Environment     | Command                                           | Notes                                             |
| --------------- | ------------------------------------------------- | ------------------------------------------------- |
| Local dev       | `npm run db:migrate` → `prisma migrate dev`       | Interactive; **do not use against production DB** |
| Production / CI | **`npm run db:deploy`** → `prisma migrate deploy` | Non-interactive; requires `DATABASE_URL`          |

**If migrations are skipped:** Prisma errors at runtime (missing relations/tables/columns). There is **no** automatic migration on app boot.

**`prisma db push`:** Documented as **prototype-only** in README — bypasses migration history; **avoid** on shared/production databases where disciplined migration history matters.

---

## 4. Environment variables (code vs docs)

| Variable                                                              | Required?                           | Used in                                                                                                  |
| --------------------------------------------------------------------- | ----------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `DATABASE_URL`                                                        | **Yes** (for any DB-backed route)   | `src/db/client.ts`, `prisma.config.ts`                                                                   |
| `NODE_ENV`                                                            | Set by tooling                      | Cookie `secure`, Prisma log level, logger                                                                |
| `LOG_LEVEL`                                                           | Optional                            | `src/lib/logger.ts`                                                                                      |
| `PRISMA_QUERY_LOG`                                                    | Optional (`true` = SQL in dev logs) | `src/db/client.ts`                                                                                       |
| `ARTWORK_STORAGE_ROOT`                                                | Optional                            | `src/server/storage/local-artwork-store.ts`                                                              |
| `ENRICHMENT_ENABLED`, `MUSICBRAINZ_CONTACT`, `MUSICBRAINZ_USER_AGENT` | Enrichment optional                 | `src/server/enrichment/config.ts` — **fail closed** unless `ENRICHMENT_ENABLED=true` **and** contact set |
| `SPOTIFY_CLIENT_ID`, `SPOTIFY_CLIENT_SECRET`                          | Spotify optional                    | `src/server/spotify/config.ts` — **both** required together or integration off                           |
| `FIGMA_ACCESS_TOKEN`                                                  | Optional (CLI only)                 | Documented in `.env.example`; **not** read by Next.js runtime                                            |

Canonical comments: **`.env.example`**.

---

## 5. Artwork storage — deployment reality

- **Implementation:** Local filesystem only. `ensureParentDir` + `writeFile` on upload; `readArtworkFile` on GET; missing file → **404**.
- **Default path:** `path.join(process.cwd(), 'storage', 'artwork')` — **`cwd` is whatever the host sets**, not necessarily your repo root unless the process starts there.
- **Production:** Persistent disk or mount **required** if artwork must survive redeploys. Ephemeral containers **will** lose files; DB keys may remain → **404** on image URLs until re-upload or cleanup.
- **Second storage backend:** **Not** shipped; object storage remains **out of scope** until a future project explicitly adds it.

---

## 6. Optional integrations — disabled behavior

- **Spotify:** Search panels show “unavailable” messaging when credentials missing or invalid — **no crash**.
- **MusicBrainz enrichment:** Disabled unless explicit opt-in env; server actions gate on `getEnrichmentConfig()` — **cannot bypass via crafted requests alone**.

---

## 7. Security summary ( brief )

- Ownership enforced server-side for mutations.
- Public routes do not expose email.
- Artwork gated by owner + `collectionPublic` for non-owners.
- MusicBrainz requests use fixed origin + timeouts; enrichment outbound only when enabled.

Residual: operational secrets handling, HTTPS in production, MusicBrainz etiquette when enrichment is on.

---

## 8. Dependency / audit hygiene

- **`npm audit`** may report transitive issues (e.g. tooling pulled in by `prisma` CLI or `@figma/code-connect`). Last check: **5** findings (**3** moderate, **2** high); fixes suggested by **`npm audit fix --force`** can imply **breaking** major-version downgrades — **do not** apply blindly in CI.
- Run **`npm audit`** periodically; address **high** severity when practical without breaking the stack. This sprint **does not** mandate a dependency-upgrade campaign unless a deploy blocker appears.
- Deprecation warnings from transitive deps during `npm install` are backlog unless CI fails.

---

## 9. What is “ready” vs deferred

| Ready within scope                                                    | Requires operator configuration                                                | Intentionally deferred                                                      |
| --------------------------------------------------------------------- | ------------------------------------------------------------------------------ | --------------------------------------------------------------------------- |
| Auth, collection, singles, wantlist, follows, stats, profile settings | Postgres URL, **`npm run db:deploy`**, HTTPS host, persistent disk for artwork | Object storage, public singles grid on `/u/[id]`, Discogs, import/export UX |
| Optional Spotify / enrichment                                         | Env toggles                                                                    | Multi-region HA, CDN for artwork                                            |

**Bottom line:** Suitable for production **only** when operators accept **filesystem artwork caveats**, run **migrations**, set **`DATABASE_URL`**, and use **HTTPS** for sessions. Not a turnkey SaaS offering for arbitrary serverless hosts without storage planning.

---

_End of report._
