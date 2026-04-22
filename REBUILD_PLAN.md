# Cratedb — Rebuild plan (Phase 0 output)

This plan defines how to rebuild **Cratedb** (vinyl collection product) as a production-grade **Next.js + TypeScript + PostgreSQL** application, using the legacy Streamlit app only for **feature parity reference**. It is **not** related to the database product CrateDB.

**Audit source:** `/Users/xavierhargrove/cratedb`  
**Rebuild repo:** `/Users/xavierhargrove/cratedb2`

---

## 1. Chosen architecture

| Layer        | Choice                                                                            | Rationale                                                                             |
| ------------ | --------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| UI           | Next.js (App Router)                                                              | SSR/SSG, routes, deployability, single codebase                                       |
| API          | Next.js Route Handlers + Server Actions                                           | One canonical HTTP/RPC surface; avoid duplicate REST trees                            |
| DB           | PostgreSQL                                                                        | Relational graph (follows), constraints, reporting                                    |
| ORM          | **Prisma** _or_ **Drizzle** (pick one before Phase 1 coding)                      | Migrations + type-safe queries; document final choice in repo README when decided     |
| Validation   | Zod                                                                               | Shared server/client schemas where appropriate                                        |
| Auth         | Production-capable provider (e.g. **Auth.js (Credentials + OAuth)** or **Clerk**) | Sessions, CSRF, scalable identity; **one** system only                                |
| File storage | S3-compatible or Vercel Blob / similar                                            | Avatars and optional artwork caching; **no** silent reliance on `data/avatars/` paths |
| Charts       | **Recharts** or **Chart.js** (via `react-chartjs-2`)                              | Stable, React-friendly; pick one library globally                                     |

**Explicit non-goals for v1:** replicating Streamlit’s in-process session model; file-backed JSON; duplicate profile/settings implementations.

---

## 2. App folder plan (Next.js)

Target layout (adjust names to match ORM choice):

```
cratedb2/
├── src/
│   ├── app/                    # App Router: layouts, pages, route handlers
│   │   ├── (auth)/             # login, register, callbacks
│   │   ├── (app)/              # authenticated shell (dashboard)
│   │   └── api/                # REST/RPC handlers if not using Server Actions only
│   ├── components/             # shared UI (no alternate “v2” folders)
│   ├── lib/
│   │   ├── db.ts               # DB client singleton
│   │   ├── auth.ts             # session helpers
│   │   ├── validations/        # zod schemas per domain
│   │   └── services/           # spotify, future musicbrainz, etc.
│   └── types/
├── prisma/ OR drizzle/
├── tests/                      # e2e + unit for critical flows
├── docs/
│   └── MIGRATION.md
└── REBUILD_PLAN.md
```

Rules: **one** `app/` root; no parallel `src/app` and `app/` duplicates; server/client boundaries explicit (`"use client"` only where needed).

---

## 3. Schema overview (conceptual)

Entities (names illustrative):

- **User** — identity + auth linkage + profile flags
- **Profile** — 1:1 display fields, visibility enums, social URLs
- **Album** — canonical metadata (artist, album title, external IDs optional)
- **CollectionItem** — user ownership, condition, copies, storage, notes, sale fields, timestamps
- **WantlistItem** — user + target album or denormalized keys + optional artwork ref
- **Follow** — follower → followee
- **Message** — inbox model with server-side access checks
- **MediaAsset** (optional) — storage key, mime, owner user id

Indexes: user-scoped queries on collection; follow graph; message inbox by recipient + createdAt.

Full SQL follows from Prisma/Drizzle schema in Phase 1 — not duplicated here to avoid two sources of truth.

---

## 4. Route map (v1)

| Route                           | Purpose                                                          |
| ------------------------------- | ---------------------------------------------------------------- |
| `/`                             | Landing or redirect to dashboard if session                      |
| `/login`, `/register`           | Auth                                                             |
| `/collection`                   | Grid/list collection (filters match legacy: search, genre, sort) |
| `/collection/new`               | Add record (Spotify search + manual)                             |
| `/collection/[id]`              | Edit / delete                                                    |
| `/stats`                        | Statistics charts                                                |
| `/wantlist`                     | Wantlist CRUD                                                    |
| `/feed`                         | Following + discover (tabs)                                      |
| `/marketplace`                  | Browse / manage listings                                         |
| `/messages`                     | Inbox / sent                                                     |
| `/profile/[username]`           | Public profile + follow                                          |
| `/settings`                     | Privacy, account, integrations                                   |
| `/api/*` or Server Actions only | Mutations and external API proxies (Spotify secret server-side)  |

Optional later: `/discover/samples` — only if Spotify analysis slice is prioritized.

---

## 5. Risk list

| Risk                                         | Mitigation                                                                 |
| -------------------------------------------- | -------------------------------------------------------------------------- |
| Migration from JSON typos / missing columns  | Strict import script + dry-run report                                      |
| Spotify API quotas / failure                 | Graceful degradation; cache; user-visible errors                           |
| Auth choice lock-in                          | Abstract `getSession()` + user id in `lib/auth.ts`                         |
| Scope creep (Discogs + MB + Last.fm day one) | Ship Spotify + manual; gate others behind env flags                        |
| Artwork licensing / hotlink breakage         | Prefer stored blobs for user-facing avatars; document policy for album art |
| Duplicate features (profile vs settings)     | Single PRD checklist before each phase merge                               |

---

## 6. Execution order (vertical slices)

Do **not** scaffold the full app skeleton in every area before wiring. Suggested phases after Phase 0:

| Phase  | Slice                   | Done when                                                     |
| ------ | ----------------------- | ------------------------------------------------------------- |
| **1**  | Foundation              | DB, ORM, Zod base, auth, CI (lint, typecheck, build)          |
| **2**  | Collection MVP          | CRUD, list/grid, empty states, authorization on all mutations |
| **3**  | Spotify + manual add    | Server-only credentials; search; store external IDs           |
| **4**  | Stats                   | Parity charts + metrics                                       |
| **5**  | Wantlist                | Full flow + dedupe                                            |
| **6**  | Follows + feed          | Visibility rules tested                                       |
| **7**  | Marketplace             | For-sale listings; contact path; condition/price validated    |
| **8**  | Messages                | Send/receive; inbox; no cross-user leakage in tests           |
| **9**  | Export + profile polish | CSV/JSON export; avatar upload to blob storage                |
| **10** | Optional integrations   | MusicBrainz / Discogs / enhanced discovery                    |

Each phase: inspect → plan → implement → wire → validate → test → self-audit → merge.

---

## 7. Gates before marking “done”

For each phase and for release:

1. **Lint** — ESLint clean (project rules).
2. **Typecheck** — `tsc --noEmit`.
3. **Tests** — unit + e2e for critical paths (auth, CRUD, follow, message isolation).
4. **Build** — `next build` succeeds.
5. **Manual** — scripted smoke checklist for the phase’s routes.

---

## 8. Phase 0 status

- [x] Legacy repo audited (`/Users/xavierhargrove/cratedb`).
- [x] `docs/MIGRATION.md` produced.
- [x] `REBUILD_PLAN.md` produced.
- **Stop rule:** application coding for Phase 1 **does not start** until stakeholders accept this plan (this document).

---

_Next step: Phase 1 — scaffold Next.js in `cratedb2`, choose ORM + auth provider, implement schema and auth slice only._
