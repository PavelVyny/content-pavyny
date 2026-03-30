# Project Research Summary

**Project:** Devlog Scriptwriter Pipeline — SQLite to Supabase Migration (v3.0)
**Domain:** Database migration — SQLite (better-sqlite3) to Supabase PostgreSQL in Next.js 16 + Drizzle ORM
**Researched:** 2026-03-30
**Confidence:** HIGH

## Executive Summary

This migration replaces a local SQLite file-based database with Supabase-hosted PostgreSQL so that the devlog scriptwriting tool works identically on both Windows PC and MacBook Air M1 without manual file copying. The scope is deliberately narrow: swap the driver and dialect, rewrite the schema, convert ~46 synchronous DB call sites to async, migrate ~10 existing rows, and remove the native `better-sqlite3` dependency that causes cross-platform build friction. All application logic — script generation, anti-slop scoring, YouTube OAuth, UI components — is untouched. The migration is a driver-layer swap, not an application rewrite.

The recommended approach uses `postgres` (postgres-js) as the PostgreSQL driver connected through Supabase's connection pooler (port 6543) with `prepare: false`. Drizzle ORM stays at current versions and handles both dialects with the same query API; only the schema file imports and terminal methods change. This is a well-documented, low-risk migration with guidance sourced entirely from official Drizzle and Supabase documentation.

The single most dangerous pitfall is the synchronous-to-async API shift. `better-sqlite3` is the only popular Node.js database driver that is fully synchronous. Every `.get()`, `.all()`, and `.run()` call across 5 action files and 2 page files must gain `await` and change terminal method syntax. A systematic grep-and-convert approach is required — missing even one call produces silent data loss (un-awaited Promises are always truthy, TypeScript may not catch the error). Timestamp conversion during data migration is the second trap: SQLite stores dates as integer epoch seconds, PostgreSQL expects native `timestamp` objects, and leaving the `* 1000` multiplication in `getLastSyncTime()` produces dates in year ~64000.

## Key Findings

### Recommended Stack

The stack change is minimal by design. One package is added (`postgres@^3.4.8`), two are removed (`better-sqlite3`, `@types/better-sqlite3`). Drizzle ORM and Drizzle Kit stay at current versions unchanged. The `@supabase/supabase-js` client is explicitly excluded — it would create a competing data-access layer over HTTP while the app already has direct SQL access via Drizzle.

**Core technologies:**
- `postgres` (postgres-js): PostgreSQL driver — Drizzle's recommended driver for Supabase; pure JS (no native compilation), works on both Windows and macOS, supports the pooler's transaction mode via `prepare: false`
- `drizzle-orm@0.45.2`: ORM stays — query API is dialect-agnostic; only schema imports and config change
- `drizzle-kit@0.31.10`: Schema tooling stays — supports both dialects; only config dialect changes
- Supabase connection pooler (port 6543, Transaction mode): handles Next.js hot-reload connection churn within free tier's ~60 connection limit

**What NOT to add:**
- `@supabase/supabase-js` — creates a competing data-access layer; PostgREST HTTP adds latency vs direct SQL; all DB access is server-side already
- `pg` (node-postgres) — has native C bindings causing cross-platform build issues; postgres-js is faster and pure JS
- `dotenv` — Next.js handles `.env.local` automatically

### Expected Features

All P1 work is migration completeness — nothing new is being built. The migration is done when every existing feature works identically against Supabase.

**Must have (v3.0 blockers):**
- Supabase project created with correct region and `DATABASE_URL` in `.env.local`
- PostgreSQL schema via Drizzle: all 4 tables (`scripts`, `beats`, `videos`, `videoMetrics`) rewritten with `pgTable`, JSON columns as `jsonb`, timestamps as `timestamp`
- Connection module rewrite: `getDb()` function replaced with direct `db` export using `postgres-js`
- All 4 server action files and 2 pages verified working end-to-end
- One-shot data migration script: reads SQLite, converts types, writes to Supabase, verifies row counts, resets serial sequences
- Environment variable documented on both machines
- `better-sqlite3` removed from dependencies; `serverExternalPackages` removed from `next.config.ts`
- Verified working from both Windows PC and MacBook Air against same Supabase instance

**Should have (add post-validation, v3.x):**
- JSONB-powered script filtering — filter library by anti-slop score range once 15+ scripts accumulate
- Supabase Edge Function for scheduled metric sync — when manual Sync button becomes tedious at 3+ videos/week

**Defer (v4+):**
- Supabase Auth + Row Level Security — only if multi-user or public deployment is considered
- Supabase Realtime — only if collaborative editing is ever needed
- Full-text search — client-side filtering sufficient until 100+ scripts

### Architecture Approach

The post-migration data flow changes from synchronous local file access to async network calls: `Browser -> Server Component/Action -> db (module export) -> postgres-js (async) -> Supabase Supavisor (pooler) -> PostgreSQL`. The `getDb()` function-based singleton disappears; `db` is exported as a module-level constant (postgres-js manages its own connection pool internally). YouTube OAuth tokens remain on the local filesystem unchanged — that is out of scope for v3.0.

The change scope is precisely bounded: 11 files change, ~46 individual DB call sites gain `await`. Every file outside the DB layer is unaffected.

**Major components:**
1. `src/lib/db/schema.ts` — full rewrite: `sqliteTable` to `pgTable`, 4 PKs to `serial`, 4 JSON-text columns to `jsonb`, 6 timestamp columns to `timestamp`, all `$defaultFn(() => new Date())` to `defaultNow()`
2. `src/lib/db/index.ts` — full rewrite: 15-line singleton to 4-line direct export using `postgres-js` with `prepare: false`
3. `drizzle.config.ts` — dialect `sqlite` to `postgresql`, credentials from file path to `DATABASE_URL` env var
4. 4 action files + 2 pages (8 files) — mechanical async conversion: ~46 call sites gain `await`, terminal methods removed or changed per PostgreSQL Drizzle conventions
5. One-time ETL migration script — standalone Node.js: reads SQLite, converts timestamps (epoch seconds -> Date) and JSON (text -> parsed objects), writes in FK-safe order (scripts -> beats -> videos -> videoMetrics), resets sequences, verifies row counts

**Key type mappings:**
- `integer().primaryKey({ autoIncrement: true })` -> `serial().primaryKey()`
- `text({ mode: "json" }).$type<T>()` -> `jsonb().$type<T>()`
- `integer({ mode: "timestamp" })` -> `timestamp()`
- `.$defaultFn(() => new Date())` -> `.defaultNow()`
- `.get()` terminal method -> `const [row] = await ...` with `.limit(1)`
- `.all()` terminal method -> `await ...` (array by default)
- `.run()` terminal method -> `await ...` (execute without return)
- `.returning().get()` -> `const [row] = await ...returning()`

### Critical Pitfalls

1. **Synchronous-to-async API shift** — grep for every `.run()`, `.get()`, `.all()` before starting; convert systematically; TypeScript will catch missing `.get()` (method doesn't exist on pg-core) but NOT missing `await` (Promise is truthy, server actions appear to succeed but write nothing)

2. **Timestamp epoch math left in place** — remove the `* 1000` multiplication in `getLastSyncTime()` and the data migration script; PostgreSQL returns proper Date objects from `timestamp` columns; leaving it produces year ~64000 dates; verify by reading one SQLite row — values ~1.7 billion = seconds (multiply by 1000 for JS Date), values ~1.7 trillion = milliseconds

3. **`prepare: false` omitted on connection** — intermittent "prepared statement does not exist" errors appear only under pooler transaction mode; easy to miss because it works fine with direct connection (port 5432); always set `{ prepare: false }` when using Supabase's port 6543 pooler

4. **Serial sequence not reset after data migration** — after bulk-inserting migrated rows with explicit IDs, all four `serial` sequences still start at 1; first new insert will fail with "duplicate key value violates unique constraint"; run `setval` for each table immediately after migration completes

5. **RLS enabled without policies** — Supabase dashboard nudges you to enable RLS; for a single-user app with server-action-only data access, leave RLS disabled and use the service role key server-side only; enabling RLS without policies makes all queries return empty arrays silently

## Implications for Roadmap

Based on research, dependency analysis, and pitfall mapping, the migration splits into four sequential phases. Phases cannot be reordered — each depends on the previous.

### Phase 1: Project Setup and Schema Rewrite

**Rationale:** The Supabase project and a valid PostgreSQL schema are unblockable prerequisites. Drizzle cannot connect without credentials; action files cannot be converted until imports resolve; nothing can be tested without working tables. This phase also resolves the highest-risk decisions upfront: RLS strategy, connection string format, and `prepare: false` — all cheap to get right at the start and expensive to debug later.
**Delivers:** Supabase project created; `schema.ts` fully rewritten for `pg-core`; `drizzle.config.ts` updated to `postgresql`; `db/index.ts` rewritten with `postgres-js` and `prepare: false`; `drizzle-kit push` succeeds against Supabase; all 4 tables exist in Supabase dashboard; `next.config.ts` cleaned; `npm install postgres && npm uninstall better-sqlite3 @types/better-sqlite3` complete
**Addresses:** PostgreSQL schema equivalent, connection module rewrite, environment variable setup, `better-sqlite3` removal
**Avoids:** RLS blocking all queries (decide: leave disabled, use service role key), `prepare: false` omission, `autoIncrement` -> `serial` type error, `@supabase/supabase-js` creep

### Phase 2: Async Conversion of Action Files and Pages

**Rationale:** With a working connection, the ~46 synchronous DB call sites can be systematically converted. This is the highest-volume mechanical change. It must be done as a complete sweep — partial conversion leaves the app in an inconsistent state where some calls work and others silently fail.
**Delivers:** All 4 action files (`generate.ts`, `editor.ts`, `library.ts`, `metrics.ts`) and 2 pages (`page.tsx`, `script/[id]/page.tsx`) converted to async Drizzle; `Home` server component made `async`; `getDb()` -> `db` import updated across all consumer files; app boots and runs all operations correctly against empty Supabase DB
**Uses:** `const [row] = await db.select().from(x).limit(1)` for single-row selects; `const [row] = await db.insert().values().returning()` for insert-and-return; `await db.update/delete()` for mutations
**Avoids:** Missing `await` silent failures (grep `.run()`, `.get()`, `.all()` to verify zero remaining); `.returning().get()` removal in `generate.ts` (critical — `script.id` feeds all beat insertions); `getLastSyncTime()` raw SQL aggregate fix (remove `* 1000`); `onConflictDoUpdate` syntax review in `metrics.ts`

### Phase 3: Data Migration and Cleanup

**Rationale:** Only after the app works against an empty Supabase DB is it safe to migrate real data. Running migration before Phase 2 risks inserting data that can't be read correctly. The ETL script is a one-off and should be written, run, verified, and deleted — not maintained.
**Delivers:** One-shot ETL script that reads from local SQLite (keeping `better-sqlite3` as temp devDependency), converts epoch integer timestamps to `Date` objects and JSON text to parsed objects, inserts in FK-safe order (scripts -> beats -> videos -> videoMetrics) with batch inserts, runs `setval` sequence resets for all 4 tables, verifies row counts match source; `better-sqlite3` uninstalled after successful migration; `data/scripts.db` and `data/` directory deleted
**Avoids:** Timestamp corruption (convert `intValue * 1000` -> `new Date()` in script; verify year is ~2024-2026 not year 1970 or 64000), sequence collision on first new insert after migration, partial migration failure (run in transaction; SQLite source is read-only so re-running is safe)

### Phase 4: Cross-Device Verification and Documentation

**Rationale:** The entire motivation is multi-device access. The migration is not done until both machines connect to the same Supabase instance and all features work. This phase also resolves the only remaining gap: explicit foreign key indexes (PostgreSQL does not auto-create them unlike SQLite) and the YouTube OAuth token limitation.
**Delivers:** App verified on both Windows PC and MacBook Air; `DATABASE_URL` documented in project (not committed — `.env.local` only); foreign key indexes added to schema (`beats.scriptId`, `videos.scriptId`, `videoMetrics.videoId`); YouTube OAuth token limitation documented as a known gap with remediation options if both machines need YouTube features simultaneously

### Phase Ordering Rationale

- Schema rewrite precedes connection module because Drizzle's TypeScript inference flows from schema definitions to query types
- Connection module precedes action conversion because `getDb()` -> `db` is an import change affecting all consumer files
- Action conversion precedes data migration because you need the full app working before adding real data — a broken query is easier to catch against zero rows than against 10 rows with subtle data issues
- Data migration includes sequence reset — must happen before any new data is inserted post-migration
- Foreign key indexes deferred to Phase 4 because at current data volume (~50 beats, ~6 videos) query performance is irrelevant; correctness and working app come first
- YouTube OAuth token migration is explicitly out of scope for v3.0 — it requires a new `settings` table and is a UX gap, not a migration blocker

### Research Flags

Phases with standard, well-documented patterns (research-phase not needed):
- **Phase 1:** Official Drizzle + Supabase docs cover every step precisely; no ambiguity in the recommended approach
- **Phase 2:** Mechanical transformation with complete before/after patterns enumerated in ARCHITECTURE.md; ~46 sites all follow the same 3-4 conversion patterns
- **Phase 3:** Standard ETL pattern; the only gotcha (timestamp conversion, sequence reset) is explicitly documented with exact SQL

Phases that may benefit from a targeted check during planning:
- **Phase 4:** Drizzle `index()` helper syntax for explicit FK indexes (minor — 2-minute docs check); YouTube OAuth token Supabase storage approach if Pavlo decides to pursue cross-device YouTube features

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Official Drizzle + Supabase docs are the primary source for all package choices; alternatives evaluated and rejected with documented rationale |
| Features | HIGH | Migration scope is clearly bounded; what to include vs defer is explicitly documented with rationale from official Supabase feature docs |
| Architecture | HIGH | File-by-file change inventory with exact before/after code patterns; 11 files and 46 call sites fully enumerated; no speculative changes |
| Pitfalls | HIGH | All critical pitfalls sourced from official Drizzle/Supabase docs, real-world failure reports, and known library behavior differences; all have concrete prevention steps and recovery strategies |

**Overall confidence:** HIGH

### Gaps to Address

- **YouTube OAuth tokens multi-device access:** Three options documented (Supabase table, env var, accept limitation) but no decision made. Recommended default: accept limitation and document it. Revisit only if Pavlo needs YouTube sync from both machines simultaneously.

- **Supabase region selection:** Research recommends EU West or similar for Ukraine-based access but does not verify latency. Low priority — any region works; 20-50ms difference is irrelevant for a personal tool.

- **Foreign key index syntax:** Research identifies the need (PostgreSQL does not auto-create FK indexes) and the tables requiring them, but does not include the exact Drizzle `index()` call for the schema file. A 2-minute docs check resolves this during Phase 4 planning.

- **`getLastSyncTime()` raw SQL pattern:** This function uses a raw `sql<number>` template literal that bypasses Drizzle's type mapping. The exact fix (remove `* 1000`, handle Date vs string return) needs verification against a real PostgreSQL response during Phase 2 execution.

## Sources

### Primary (HIGH confidence)
- [Drizzle + Supabase existing project guide](https://orm.drizzle.team/docs/get-started/supabase-existing) — setup steps, package list, connection module pattern
- [Drizzle Supabase connection reference](https://orm.drizzle.team/docs/connect-supabase) — `prepare: false` requirement, pooler vs direct connection
- [Drizzle PostgreSQL column types](https://orm.drizzle.team/docs/column-types/pg) — `serial`, `jsonb`, `timestamp` definitions and usage
- [Drizzle ORM: Upsert Guide](https://orm.drizzle.team/docs/guides/upsert) — `onConflictDoUpdate` syntax differences per dialect
- [Drizzle ORM: Insert returning](https://orm.drizzle.team/docs/insert) — `.returning()` array behavior in PostgreSQL vs SQLite
- [Drizzle with Supabase tutorial](https://orm.drizzle.team/docs/tutorials/drizzle-with-supabase) — end-to-end walkthrough
- [Supabase Docs: Drizzle integration](https://supabase.com/docs/guides/database/drizzle) — official Supabase-side setup guide
- [Supabase Docs: Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security) — RLS behavior when enabled without policies
- [postgres npm](https://www.npmjs.com/package/postgres) — v3.4.8, latest stable, pure JS

### Secondary (MEDIUM confidence)
- [MakerKit: Drizzle with Supabase in Next.js](https://makerkit.dev/blog/tutorials/drizzle-supabase) — confirms no need for `@supabase/supabase-js` when using Drizzle directly
- [Medium: PostgreSQL Migration That Corrupted Every Timestamp](https://medium.com/@rudra910203/the-postgresql-migration-that-corrupted-every-timestamp-26bf21b6dd7f) — real-world seconds vs milliseconds timestamp corruption failure
- [pgloader: SQLite integer timestamp conversion issues](https://github.com/dimitri/pgloader/issues/1177) — community confirmation of seconds vs milliseconds ambiguity in SQLite timestamp storage

---
*Research completed: 2026-03-30*
*Ready for roadmap: yes*
