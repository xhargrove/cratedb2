# Cratedb — Legacy audit & migration notes

## Rebuild status (this repository)

The **current** app in this repo is a **Next.js + PostgreSQL (Prisma)** implementation. It does **not** use the legacy JSON file layout.

- **Automated JSON → PostgreSQL import:** **not provided** in this codebase. Section 5 below describes a **manual / operator-owned** migration approach for anyone importing historical Streamlit `data/` exports.
- **Parity targets** in §2 mixed future goals with the rebuild; treat this document as **legacy audit + conceptual mapping**, not a checklist of shipped features here.
- **Apply schema changes** in deployments with **`npx prisma migrate deploy`** against the migrations in `prisma/migrations/` (see repo `README.md`).

---

**Product:** Cratedb — personal vinyl collection and social discovery (not [CrateDB](https://cratedb.com/) the database).

**Legacy codebase location audited:** `/Users/xavierhargrove/cratedb` (Python / Streamlit).  
**Rebuild workspace:** `/Users/xavierhargrove/cratedb2` (initially empty; this document lives here).

---

## 1. Legacy feature inventory

| Area         | Feature                    | Implementation notes                                                                                                          | Assessment                                                             |
| ------------ | -------------------------- | ----------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| Auth         | Register / login           | `data/users.json`; PBKDF2-HMAC-SHA256 (100k iterations) + per-user salt; password policy enforced                             | Works locally; not a hosted-session model                              |
| Auth         | Session                    | Streamlit `st.session_state` only                                                                                             | No portable tokens; server is single-user process                      |
| Collection   | CRUD records               | `data/<username>/records.json` → pandas `DataFrame`; backups under `backups/`                                                 | Working                                                                |
| Collection   | Grid / list views          | `collection_view.py`; filters (search, genre), sort options from `utils/constants.py`                                         | Working                                                                |
| Collection   | Export                     | CSV / JSON via download; Excel path uses `ExcelWriter` with questionable buffer handling                                      | CSV/JSON OK; Excel export is fragile                                   |
| Add flow     | Spotify album search       | `add_record.py` + `services/spotify.py` (Spotipy, client credentials)                                                         | Core path; requires env credentials                                    |
| Add flow     | Manual entry               | Forms with shelf/crate location helpers                                                                                       | Working                                                                |
| Add flow     | Batch import               | Present in tabs                                                                                                               | Needs verification against real files                                  |
| Stats        | Dashboard metrics + charts | `statistics.py`; Plotly pie/bar/timeline                                                                                      | Working when data exists                                               |
| Wantlist     | Per-user list              | `data/<username>/wantlist.json`                                                                                               | Working                                                                |
| Follows      | Follow / unfollow          | `following.json` / `followers.json` per user; bilateral update                                                                | Working for current user                                               |
| Feed         | Following + Discover       | `feed_manager.py`; respects `feed_visibility` / `profile_visibility` from user profile                                        | Working with caveats (see below)                                       |
| Home         | Activity widgets           | Personal + “network” recent adds                                                                                              | Working                                                                |
| Marketplace  | Browse / sell              | Aggregates `for_sale` across all users’ `records.json`                                                                        | UI heavy; `listing_date` often synthetic; condition field inconsistent |
| Messages     | Inbox / sent               | `messages.json`; duplicate rows in sender+recipient stores                                                                    | Works as local “mail”                                                  |
| Profile      | Rich profile page          | `components/profile.py` — avatar file upload, bio, links                                                                      | Working; avatars are local filesystem paths                            |
| Profile      | Alternate profile view     | `profile_view.py` references `FollowManager.is_following`, `.follow()`, `DataManager.get_recent_additions()`, wrong stat keys | **Broken / dead** relative to current `FollowManager` / `DataManager`  |
| Settings     | Profile + privacy          | `settings.py`; duplicate overlap with Profile                                                                                 | Working; notifications tab is placeholder                              |
| Settings     | Notifications              | “Coming soon”                                                                                                                 | **Not implemented**                                                    |
| Discovery    | Sample Search              | `SamplesAPI` + Spotify audio features; “connections”, similar tracks, era                                                     | Works if Spotify works; heuristic “samples”                            |
| Integrations | Spotify                    | Used throughout                                                                                                               | **Implemented**                                                        |
| Integrations | MusicBrainz service        | Module exists + session init                                                                                                  | **Barely surfaced in UI** (init only in practice)                      |
| Integrations | Last.fm                    | `LastFMAPI`; `api_key = None` unless wired                                                                                    | **Effectively dormant** unless env extended                            |
| Integrations | Metadata scraper           | Wraps Spotify                                                                                                                 | Partial / Spotify-centric                                              |
| Integrations | Discogs                    | In `requirements.txt`; **no first-class module usage found** in audited paths                                                 | Dependency **promised, not integrated**                                |

---

## 2. Parity targets (rebuild)

Minimum product parity with the legacy _intent_ (not its architecture):

1. Secure auth with real sessions (rebuild stack: Next.js — e.g. Auth.js / Clerk / similar per `REBUILD_PLAN.md`).
2. Collection CRUD with normalized PostgreSQL schema; grid/list; search, genre filter, sort.
3. Wantlist scoped to user.
4. Follow graph and activity feed with visibility rules (public / followers / private).
5. Stats/charts equivalent to Plotly views (replace with chosen chart library).
6. Marketplace listing concept: for-sale flag, price, optional condition; browse across users with authorization.
7. Messaging between users (can start as simpler threading; must be server-enforced).
8. Metadata enrichment: **at least** Spotify-powered add/edit; optional MusicBrainz/Discogs as phased enhancements.
9. Export collection (CSV + JSON minimum).
10. Artwork: migrate from hotlinked URLs + local avatar paths to **explicit storage strategy** (object storage or managed uploads).

---

## 3. Intentional changes (do not replicate)

| Legacy pattern                                                                   | Rebuild direction                                          |
| -------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| File-backed JSON per user                                                        | PostgreSQL single schema; migrations via Prisma or Drizzle |
| Streamlit multi-page state                                                       | Next.js App Router routes, Server Actions / Route Handlers |
| Duplicate profile UIs (`auth_manager.show_profile_page` vs `components/profile`) | One profile surface + one settings area                    |
| `profile_view.py` incompatible APIs                                              | Drop file; replace with one implementation                 |
| Last.fm stub (`api_key = None`)                                                  | Either wire properly or remove from UX until configured    |
| Broad `except:` / silent failures                                                | Structured errors + logging + user-visible states          |
| Artwork as arbitrary URLs only                                                   | Canonical storage + optional external URL fallback         |
| Excel export bug surface                                                         | CSV/JSON first-class; Excel only if tested                 |

---

## 4. Schema mapping (JSON → relational)

### 4.1 Users (`data/users.json`)

| Legacy field                                                  | Proposed SQL concept                                                            |
| ------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| `users[username]` key                                         | `User.id` (cuid/uuid), unique `username` or email as login identifier           |
| `password` (hash)                                             | Delegated to auth provider **or** `passwordHash` column if credentials provider |
| `display_name`, `bio`, `favorite_genres[]`                    | Profile columns / `UserProfile` table                                           |
| `avatar_path`                                                 | `avatarUrl` / `avatarKey` pointing to blob storage                              |
| `profile_visibility`, `feed_visibility`                       | Enums; enforced in queries                                                      |
| `location`, `spotify_url`, `discogs_url` (from profile forms) | Optional profile columns                                                        |
| `created_at`, `last_login`, `failed_login_attempts`           | Preserve semantics if still managing credentials locally                        |

### 4.2 Records (`data/<user>/records.json` array of objects)

Suggested normalized tables (overview):

- **Album** (or **Release**): canonical `artist`, `album`, optional MusicBrainz/Spotify IDs, artwork reference.
- **CollectionItem** (user-owned): FK to user, FK to album/release, `copies`, `notes`, `storage_type`, `location_detail`, `condition`, `for_sale`, `asking_price`, `added_at`, optional `listing_date`.

Legacy columns observed: `artist`, `album`, `year`, `label`, `genre`, `artwork_url`, `spotify_url`, `notes`, `for_sale`, `asking_price`, `added_at`, `storage_type`, `location_detail`, `copies`; marketplace filters expect `condition` which may be missing on Spotify-sourced rows.

### 4.3 Follows (`following.json`, `followers.json`)

Replace with single **`Follow`** table: `followerId`, `followingId`, `createdAt`, unique constraint on pair.

### 4.4 Wantlist (`wantlist.json`)

**WantlistItem**: `userId`, denormalized `artist`/`album` for UX, optional `artworkUrl`, dedupe constraint on (userId, normalized artist, normalized album).

### 4.5 Messages (`messages.json`)

**Message**: `id`, `fromUserId`, `toUserId`, `subject`, `body`, `recordMetadata` JSON nullable, `readAt`, `createdAt`. Avoid duplicating full message blobs in sender/receiver rows unless building inbox patterns intentionally.

---

## 5. JSON-to-database migration plan

1. **Inventory** all `data/*/records.json`, `users.json`, follow/wantlist/message files in a migration script (read-only).
2. **Users first:** create accounts in new auth system or import with forced password reset email flow (preferred for unknown password hashes if algorithm differs).
3. **Records:** parse each JSON array; normalize strings; insert Album + CollectionItem; preserve `added_at`.
4. **Follows:** read following list per user → insert Follow rows (verify reciprocal consistency or rebuild from following side only).
5. **Wantlist:** append-only import per user.
6. **Messages:** import if retaining history; map timestamps.
7. **Assets:** upload avatars and optionally cache artwork to blob storage; rewrite URLs.

Run migration in a transaction per user batch; log failures to a report file.

---

## 6. Migration assumptions

1. Legacy data directory may contain test users and incomplete rows; importer must tolerate missing columns.
2. Usernames in legacy app are alphanumeric; rebuild may adopt email login — mapping table may be needed.
3. Spotify and other API keys are environment-specific and not migrated with user data.
4. Single-machine Streamlit deployment means concurrency was never guaranteed; migrate without assuming ordering beyond `added_at`.

---

## 7. Known unknowns (resolve in Phase 1)

| Topic        | Question                                                                                      |
| ------------ | --------------------------------------------------------------------------------------------- |
| Deployment   | Was legacy ever multi-user concurrent in production, or desktop-only?                         |
| Data volume  | Typical `records.json` size / user count for performance testing                              |
| Batch import | Supported file formats and edge cases in `add_record` batch path                              |
| Marketplace  | Whether any payment / escrow existed outside messaging (audit suggests messaging-only intent) |
| Legal        | Rights for storing Spotify artwork URLs vs hosting copies                                     |

---

## 8. Feature parity matrix (summary)

| Capability             | Legacy                  | Target rebuild                     |
| ---------------------- | ----------------------- | ---------------------------------- |
| Login / register       | ✓ file-backed           | ✓ hosted auth                      |
| Collection CRUD        | ✓                       | ✓                                  |
| Grid / list            | ✓                       | ✓                                  |
| Wantlist               | ✓                       | ✓                                  |
| Follow / feed          | ✓ (feed logic solid)    | ✓                                  |
| Stats                  | ✓                       | ✓                                  |
| Marketplace            | ✓ partial data model    | ✓ normalized                       |
| Messages               | ✓                       | ✓                                  |
| Spotify enrichment     | ✓                       | ✓                                  |
| MusicBrainz            | △ modules only          | ○ Phase 2+                         |
| Last.fm                | ✗ dormant               | ○ optional                         |
| Discogs                | ✗ dependency only       | ○ optional                         |
| Notifications settings | ✗ stub                  | ○ later                            |
| Export                 | ✓ CSV/JSON; Excel risky | ✓ CSV/JSON + tested Excel optional |

Legend: ✓ delivered · △ partial · ○ planned · ✗ missing

---

## 9. Weak architecture (legacy) — rebuild must fix

1. **No real API layer** — all logic in Streamlit callbacks.
2. **Authorization** — filesystem separation by folder name is not an access-control model for the web.
3. **Duplicate / shadowed imports** — e.g. `show_profile_page` imported from two modules in `main.py`; dead or conflicting patterns.
4. **`FollowManager.get_following(username)`** ignores `username` — safe only while always called for current user.
5. **`utils/auth_utils.py`** references `AuthManager()` without import if that branch ran — masked because `init_auth()` pre-populates session.
6. **Integrations** declared in `requirements.txt` but Discogs unused; MusicBrainz/Last.fm mostly idle.
7. **`profile_view.py`** inconsistent with managers — indicates abandoned refactor.

---

_End of migration document — Phase 0 audit._
