# Post-deploy smoke test (Cratedb)

Run on a **staging** or **production** URL after the first (or any) deploy.  
Assumes `DATABASE_URL` is set, migrations are applied, and the app is reachable over **HTTPS** in production (for the session cookie `secure` flag).

Check off each step. If a step fails, note the URL, account used, and error (UI, network, or server log).

| #   | Check                                                                                                                                                                                                                   | Pass |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---- |
| 1   | **Sign up** — create a new account (unique email).                                                                                                                                                                      | ☐    |
| 2   | **Log in** — existing or new account.                                                                                                                                                                                   | ☐    |
| 3   | **Log out** — session cleared; `/dashboard` redirects to login when unauthenticated.                                                                                                                                    | ☐    |
| 4   | **Create album record** — `/dashboard/records/new`; save with artist + title.                                                                                                                                           | ☐    |
| 5   | **Create single (45)** — `/dashboard/singles/new`; save with artist + title.                                                                                                                                            | ☐    |
| 6   | **Upload artwork** — add image to a record or single (within size/type limits); image appears after save/reload.                                                                                                        | ☐    |
| 7   | **Edit record** — change a field on `/dashboard/records/[id]/edit`; save succeeds.                                                                                                                                      | ☐    |
| 8   | **Wantlist** — add an item (`/dashboard/wantlist/new`); remove or edit from list.                                                                                                                                       | ☐    |
| 9   | **Public profile** — open `/u/[yourUserId]` while logged out or in another browser; header loads; collection visibility matches **Profile → collection public** setting.                                                | ☐    |
| 10  | **Follow / unfollow** — second test user follows first; counts update; unfollow works (use `followError` query handling if needed).                                                                                     | ☐    |
| 11  | **Stats** — `/dashboard/stats` loads without error for the owner.                                                                                                                                                       | ☐    |
| 12  | **Enrichment disabled** — with `ENRICHMENT_ENABLED` unset or not `true`, record edit shows enrichment unavailable (no crash). If enrichment is intentionally on in prod, skip or verify enabled path separately.        | ☐    |
| 13  | **Spotify disabled** — with `SPOTIFY_CLIENT_ID` / `SPOTIFY_CLIENT_SECRET` unset, album/track search panels show unavailable (no crash). If Spotify is intentionally on in prod, skip or verify enabled path separately. | ☐    |
| 14  | **Auth abuse resistance** — trigger repeated bad login attempts from one client and verify generic auth failure responses continue without leaking account existence.                                                   | ☐    |

### Optional operational checks

- **Object storage health** — verify previously uploaded artwork still resolves after restart/deploy (`GET` artwork URLs return 200) with `ARTWORK_STORAGE_BACKEND=s3`.
- **Local→object migration** — if migrating old local files, run `npm run migrate:artwork:to-object -- --dry-run` first, then real run; confirm logs show expected migrated/skipped counts.
- **Migrations** — Confirm deploy pipeline ran `npm run db:deploy` (or equivalent) so schema matches code.
- **Startup env guard** — Confirm deployment fails fast when required env is missing (for example `DATABASE_URL`) and succeeds once corrected.

### Out of scope for this checklist

Public **singles** listing on `/u/[id]` (album LPs only there today), import/export, Discogs, mobile layouts — not required for this pass.
