# Cratedb — Rebuild readiness report (final hand-off)

This document summarizes the **implemented** codebase at hand-off: architecture, routes, schema, configuration, migrations, security posture, storage, optional integrations, known limitations, and an **honest** production-readiness assessment. It is not a marketing claim.

**Validation at report time:** run `npm run check` (Prettier, ESLint, `tsc`, Vitest, `next build`). Results are recorded in §“Validation results” below.

---

## 1. Architecture summary

- **Framework:** Next.js 15 App Router; React Server Components by default; client components only where needed (forms, enrichment panel).
- **Mutations:** Server Actions (`'use server'`) for auth, records, wantlist, follows, enrichment; route handler for **binary artwork** upload responses.
- **Data:** Single PostgreSQL database; Prisma 7 with `pg` adapter; ownership enforced in queries (`ownerId` + `id` compound patterns).
- **Auth:** Credential sessions — opaque `Session.id` in httpOnly cookie; user id from DB after resolution; **no** trusted client-supplied owner id.
- **Middleware:** Redirects anonymous users away from `/dashboard/*` when session cookie absent; **does not** replace full `requireUser()` validation in layout/pages.

---

## 2. Final route map

| Route                           | Purpose                                                |
| ------------------------------- | ------------------------------------------------------ |
| `/`                             | Landing                                                |
| `/login`, `/signup`             | Auth                                                   |
| `/dashboard`                    | Dashboard home                                         |
| `/dashboard/records`            | Collection list (filters, grid/list)                   |
| `/dashboard/records/new`        | Create record                                          |
| `/dashboard/records/[id]`       | Record detail                                          |
| `/dashboard/records/[id]/edit`  | Edit record (+ optional enrichment UI when configured) |
| `/dashboard/wantlist`           | Wantlist                                               |
| `/dashboard/wantlist/new`       | New wantlist entry                                     |
| `/dashboard/wantlist/[id]/edit` | Edit wantlist entry                                    |
| `/dashboard/stats`              | Owner insights                                         |
| `/u/[id]`                       | Public profile / public collection visibility rules    |
| `GET /api/records/[id]/artwork` | Authenticated artwork bytes                            |

---

## 3. Schema summary (Prisma)

| Model                            | Role                                                                                                                                        |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| **User**                         | Account; password hash; relations                                                                                                           |
| **Profile**                      | 1:1 display + **`collectionPublic`**                                                                                                        |
| **Session**                      | Server-side session rows + expiry                                                                                                           |
| **CollectionRecord** (`records`) | Owned release rows + optional artwork keys + optional **enrichment provenance** (`metadataSource`, `metadataSourceId`, `metadataAppliedAt`) |
| **WantlistItem**                 | Per-user wantlist + **`dedupeKey`** unique per owner                                                                                        |
| **UserFollow**                   | Directed follow edges, unique pair                                                                                                          |

Indexes include `ownerId` on scoped tables and session lookup fields.

---

## 4. Feature completion summary (planned phases)

| Phase theme                     | Status                                        |
| ------------------------------- | --------------------------------------------- |
| Foundation, auth, record domain | Implemented                                   |
| Collection UI + hardening       | Implemented (incl. list cap, facet alignment) |
| Artwork                         | Implemented (local disk + API route)          |
| Wantlist                        | Implemented                                   |
| Follows + public surfaces       | Implemented                                   |
| Stats / insights                | Implemented                                   |
| Optional metadata enrichment    | Implemented (MusicBrainz; env-gated)          |

**Not implemented as product features:** marketplace, DMs/messages, social feed, Spotify add flow, in-app CSV/JSON export, automated legacy JSON import tooling.

---

## 5. Environment / config summary

| Area                   | Mechanism                                                                                                                                                           |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Database**           | `DATABASE_URL` — required at runtime for Prisma (`src/db/client.ts`).                                                                                               |
| **Logging**            | `LOG_LEVEL` optional; Pino (`src/lib/logger.ts`).                                                                                                                   |
| **Strict env helper**  | `getServerEnv()` validates `DATABASE_URL` (+ optional `NODE_ENV`, `LOG_LEVEL`) — used where strict parsing is needed; enrichment uses separate non-throwing config. |
| **Prisma SQL logging** | `PRISMA_QUERY_LOG=true` opt-in (`src/db/client.ts`).                                                                                                                |
| **Artwork root**       | `ARTWORK_STORAGE_ROOT` optional (`src/server/storage/local-artwork-store.ts`).                                                                                      |
| **Enrichment**         | `ENRICHMENT_ENABLED`, `MUSICBRAINZ_CONTACT`, optional `MUSICBRAINZ_USER_AGENT` (`src/server/enrichment/config.ts`).                                                 |

See **`.env.example`** for the canonical list with comments.

---

## 6. Migrations summary

Migrations live under **`prisma/migrations/`** (timestamped folders). Evolution (high level):

1. Init / auth domain
2. Records table
3. Artwork columns
4. Wantlist items
5. Follows + profile `collectionPublic`
6. Enrichment metadata columns on `records`

**Apply:**

- **Development:** `npm run db:migrate` → `prisma migrate dev`
- **Production / CI:** `npx prisma migrate deploy`

There is **no** shipped script that imports legacy Streamlit JSON into Postgres — see [docs/MIGRATION.md](docs/MIGRATION.md) (audit / manual guidance only).

---

## 7. Security review summary

- **Ownership:** Record and wantlist mutations query/update with **`ownerId`** from authenticated session, not from client body trust alone.
- **Public surface:** `/u/[id]` does not expose email; collection visibility respects **`collectionPublic`**.
- **Artwork:** Served through the API route (not `/public`). Owners always; non-owners only when `collectionPublic` is true (else 403). Unauthenticated viewers may receive artwork URLs when the collection is public — same caveat as any “public image” URL.
- **Enrichment outbound requests:** Fixed MusicBrainz base URL + query param only — no user-supplied URLs (`src/server/enrichment/providers/musicbrainz-fetch.ts`). Timeouts enforced.
- **Enrichment when disabled:** Server actions **`findMetadataCandidatesAction`** and **`applyMetadataCandidateAction`** both check **`getEnrichmentConfig()`** — applying metadata cannot bypass disabled config via crafted requests.

Residual risks are operational (secrets handling, HTTPS in production, rate limits to MusicBrainz when enrichment is on).

---

## 8. Storage strategy summary

- **Database:** Relational metadata only; **no** album image blobs in Postgres.
- **Artwork:** Files on local filesystem under configurable **`ARTWORK_STORAGE_ROOT`**; DB stores relative key + MIME + timestamp.
- **Caveat:** Serverless/ephemeral disks lose files on redeploy unless persistence or external object storage is introduced — **not** implemented here.

---

## 9. Optional integrations summary

- **MusicBrainz** release search for optional metadata on **record edit** only; **opt-in** via env; merge vs replace semantics documented in UI; bounded candidate count.
- **Discogs / Spotify / Last.fm:** not integrated in this codebase.

---

## 10. Known issues / caveats

- **Legacy data import:** No first-class JSON→SQL importer in-repo; operators must script or manually migrate if needed.
- **Collection list:** Hard cap **500** rows per request — by design until pagination exists.
- **Insights:** Top-N breakdowns; bar widths are relative within the displayed list, not “% of entire library” unless interpreted carefully (see stats UI copy).
- **MusicBrainz:** Rate limits (~1 req/s etiquette); manual trigger only; search JSON may omit tags/labels often.
- **Production artwork:** Requires persistent disk or different storage — **documented in README**, not auto-solved.

---

## 11. Deployment caveats

- Set **`DATABASE_URL`** and run **`prisma migrate deploy`** before traffic.
- Ensure **`ARTWORK_STORAGE_ROOT`** points at **persistent** storage if using artwork in production.
- Use **HTTPS** so session cookie `secure` in production behaves correctly (`src/server/auth/session-cookie.ts`).
- Enrichment: set contact + `ENRICHMENT_ENABLED=true` only if you accept outbound calls to MusicBrainz.

---

## 12. Production-ready vs not (explicit)

| Aspect                                                                 | Assessment                                                                                                                                                                                                                       |
| ---------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Core auth + collection + wantlist + follows + public rules + stats** | **Suitable for production** on a normal Node host with Postgres, assuming env/migrations and HTTPS are correct. Artwork is production-viable **only** with a **persistent** filesystem or a planned migration to object storage. |
| **Optional enrichment**                                                | **Production-optional** — disable by omitting env; no dependency for core flows.                                                                                                                                                 |
| **Legacy parity**                                                      | **Not** a goal of this repo; marketplace/messages/feed/export are **out of scope**.                                                                                                                                              |

**Bottom line:** The app is **hand-off ready** as a **documented, tested, buildable** personal-collection product **within the stated scope**. It is **not** “everything the legacy Streamlit app ever did,” and it is **not** production-complete for operators who need marketplace/messaging or cloud artwork without configuration work.

---

## Validation results

Full gate: **`npm run check`** (Prettier check, ESLint, TypeScript, Vitest, production build).

| Step                    | Result (last run)                       |
| ----------------------- | --------------------------------------- |
| **`npm run check`**     | **Exit code 0**                         |
| **`npm run test`**      | **26** test files, **109** tests passed |
| **`npm run lint`**      | No ESLint warnings or errors            |
| **`npm run typecheck`** | Passed (`tsc --noEmit`)                 |
| **`npm run build`**     | Next.js production build succeeded      |

Re-run before any release; environment and data may differ.

---

_End of readiness report._
