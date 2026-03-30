# Feature Research

**Domain:** SQLite to Supabase (PostgreSQL) database migration for existing Next.js scriptwriting app
**Researched:** 2026-03-30
**Confidence:** HIGH

This research focuses on the v3.0 milestone: migrating from local SQLite (better-sqlite3) to Supabase PostgreSQL. The existing app has 4 tables (scripts, beats, videos, videoMetrics), 4 server action files + 2 pages that call `getDb()`, all using Drizzle ORM with SQLite dialect. The primary motivation is multi-device access (Windows PC + MacBook Air M1) without manual DB file copying.

**Important context:** This is a single-user tool with ~10 rows across all tables. The migration is driven by convenience (work from any device), not by scale or performance needs. Supabase offers many features beyond PostgreSQL -- this research identifies which are relevant at this stage and which are anti-features.

## Feature Landscape

### Table Stakes (Users Expect These)

Features that any SQLite-to-Supabase migration must include. Missing any of these means the migration is incomplete or broken.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| **PostgreSQL schema equivalent** | All 4 tables (scripts, beats, videos, videoMetrics) must exist in Supabase with identical semantics. If any data is lost or any column behaves differently, the migration failed. | LOW | Drizzle ORM makes this straightforward: rewrite `schema.ts` using `pgTable` instead of `sqliteTable`. Key type changes: `integer` -> `integer`/`serial`, `text({mode:"json"})` -> `jsonb` (native JSON support), `integer({mode:"timestamp"})` -> `timestamp`. Drizzle handles the mapping. Use `serial` for auto-increment PKs (Postgres convention). |
| **Data migration script** | Existing scripts, beats, videos, and metrics must transfer to Supabase without loss. At ~10 rows total this is trivial, but it must be explicitly handled -- not "re-enter your data." | LOW | One-shot Node.js script: read all rows from SQLite via better-sqlite3, insert into Supabase via Drizzle PostgreSQL client. Run once, verify counts match, done. Could also export SQLite to JSON and import, but a script is more reliable for type coercion (timestamps, JSON columns). |
| **Drizzle config switch to PostgreSQL** | `drizzle.config.ts` must point to Supabase with `dialect: "postgresql"`. All Drizzle Kit commands (generate, migrate, push) must work against Supabase. | LOW | Change dialect, swap `dbCredentials` from `{url: "./data/scripts.db"}` to `{url: process.env.DATABASE_URL}`. Use Supabase connection pooler URL (Transaction mode) with `?prepare=false` in Drizzle config since Transaction mode does not support prepared statements. |
| **Connection module rewrite** | `src/lib/db/index.ts` must replace `better-sqlite3` with a PostgreSQL client. The `getDb()` singleton pattern must work with async connections. | LOW | Replace `better-sqlite3` import with `postgres` (node-postgres alternative) or `@neondatabase/serverless` (works with Supabase pooler). Drizzle's `drizzle(client, {schema})` API is nearly identical for pg. The singleton pattern stays, but connection string comes from env var instead of file path. Use Supabase's connection pooler URL for serverless-friendly pooling. |
| **All server actions work unchanged** | The 4 action files (generate.ts, editor.ts, library.ts, metrics.ts) and 2 pages (page.tsx, script/[id]/page.tsx) that call `getDb()` must work without changes to their query logic. | LOW | Drizzle's query API is dialect-agnostic for basic operations (select, insert, update, delete, where, join). The existing queries use standard Drizzle patterns. The only potential issue is SQLite-specific syntax in raw SQL (if any) -- but the codebase uses Drizzle's query builder exclusively. Verify with a grep for `sql` tagged template usage. |
| **Environment variable management** | `DATABASE_URL` must be configurable per environment (dev, prod) without hardcoding. Both machines (Windows + Mac) need the same connection string. | LOW | Single `.env.local` with `DATABASE_URL=postgresql://...`. Both machines point to the same Supabase instance. Add `.env.local` to `.gitignore` (likely already there). Document the required env var in README or CLAUDE.md. |
| **Remove better-sqlite3 dependency** | The native `better-sqlite3` package causes build issues across platforms (needs node-gyp, Python, C++ compiler). Removing it is an explicit project goal. | LOW | `npm uninstall better-sqlite3 @types/better-sqlite3`. Remove WAL pragma and foreign key pragma from db/index.ts (PostgreSQL handles these natively). Delete local `data/scripts.db` file and `data/` directory. Clean up drizzle migration files that reference SQLite. |
| **Foreign key and cascade behavior preserved** | Scripts -> beats (cascade delete), scripts -> videos (set null on delete), videos -> videoMetrics (cascade delete). These relationships must work identically in PostgreSQL. | LOW | Drizzle's `.references()` with `onDelete` options translate directly to PostgreSQL foreign key constraints. PostgreSQL enforces foreign keys by default (no pragma needed unlike SQLite). Test cascade behavior after migration. |

### Differentiators (What Supabase Enables Beyond Remote Access)

Features that become possible or trivially easy with Supabase but were impractical with local SQLite. These are not required for v3.0 launch but represent the strategic value of the migration.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **Multi-device access without sync** | The primary motivation. Work on Windows PC at home, continue on MacBook at a cafe. No file copying, no git-based DB sync, no conflicts. Both devices hit the same Supabase instance over HTTPS. | FREE (built-in) | This is the migration itself. Once Supabase is the backend, multi-device access is automatic. Zero additional code needed. The connection pooler handles concurrent access from both devices safely. |
| **Native JSONB queries** | SQLite stores JSON as text blobs -- you cannot query inside them without parsing. PostgreSQL `jsonb` allows queries like "find scripts where antiSlopScore.total > 35" directly in SQL. Enables future features like filtering scripts by score threshold, searching hooks by keyword. | LOW | Changing `text({mode:"json"})` to `jsonb()` in the schema is the migration work. Drizzle supports `jsonb` operators for PostgreSQL. Immediate use case: filter library by anti-slop score range. Future: search within hooks, filter by beat content. |
| **Supabase Dashboard for data inspection** | Supabase provides a web-based table editor, SQL editor, and log viewer. Replaces the need for a local SQLite browser (DB Browser for SQLite, etc.). Accessible from any device with a browser. | FREE (built-in) | No code needed. After migration, Pavlo can inspect data, run ad-hoc queries, and fix data issues directly in the Supabase dashboard at app.supabase.com. Useful for debugging without opening the app. |
| **Automatic backups** | SQLite on local disk has no backups unless manually configured. Supabase Pro plan includes daily backups. Even on the free plan, the data is on managed infrastructure (not a single laptop disk). | FREE (built-in) | On Free plan: no automated backups, but data survives a laptop crash. On Pro plan ($25/mo): daily backups with point-in-time recovery. For ~10 rows of data, the risk is minimal, but the safety net is real. |
| **Row Level Security (RLS) foundation** | Not needed now (single user), but if Pavlo ever shares the tool or adds collaborators, RLS policies can restrict data access per user at the database level. Supabase Auth + RLS is the standard pattern. | MEDIUM (if activated) | Do NOT enable RLS in v3.0. Supabase requires explicit RLS policies on every table once enabled -- missing a policy means locked-out data. For a single-user local tool, RLS adds complexity with zero benefit. Mark as future consideration if multi-user is ever needed. |
| **Supabase Auth (future)** | If the app is ever deployed (not just localhost), Supabase Auth provides login, session management, and JWT tokens out of the box. No need to build auth from scratch. | MEDIUM (if activated) | Not needed for v3.0 (local tool, single user). But having Supabase as the backend means auth is one `createClient()` call away if deployment happens later. The YouTube OAuth tokens could be stored in Supabase Auth metadata instead of local storage. |
| **Edge Functions for background jobs** | Supabase Edge Functions could run scheduled YouTube metric syncs without the app being open. Currently, metrics sync only when Pavlo clicks "Sync" in the app. | MEDIUM | Not for v3.0, but a natural future step. A scheduled Edge Function could sync YouTube metrics daily, so dashboards always show fresh data. Requires moving the YouTube API token to Supabase secrets. |
| **Realtime subscriptions (future)** | If the tool ever supports collaborative editing or live dashboard updates, Supabase Realtime pushes database changes to connected clients via WebSocket. | HIGH (if activated) | Irrelevant for v3.0 (single user). Listing for completeness. Would only matter if: (a) the tool is deployed as a web app, (b) multiple users edit scripts simultaneously, or (c) a background sync triggers dashboard updates. All are v4.0+ territory at earliest. |

### Anti-Features (Commonly Requested, Often Problematic)

Features that seem like natural additions during a Supabase migration but create problems at this stage.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| **Enable RLS on all tables** | "Best practice" for Supabase. Every tutorial recommends it. Supabase dashboard shows warnings about tables without RLS. | Single-user local tool. RLS requires writing policies for every table and every operation (SELECT, INSERT, UPDATE, DELETE). Missing a policy = data locked out. Debugging RLS issues is non-trivial. Adds ~20 policy definitions for zero security benefit when only one person uses the app. | Disable RLS explicitly on all tables. Add a comment in schema: "Enable RLS when multi-user support is added." Suppress dashboard warnings by acknowledging them. |
| **Use Supabase client SDK instead of Drizzle** | Supabase's `@supabase/supabase-js` provides a built-in query API (`supabase.from('scripts').select('*')`). Seems simpler than maintaining Drizzle. | The entire app is built on Drizzle ORM with typed schemas, relations, and query builders. Switching to the Supabase SDK means rewriting every query in every action file. Drizzle provides type safety, migration tooling, and database-agnostic queries. The Supabase SDK is less type-safe and ties queries to Supabase-specific API patterns. | Keep Drizzle ORM. Connect Drizzle directly to Supabase's PostgreSQL connection string. The Supabase SDK is for browser-side or serverless usage where direct PostgreSQL access is not available -- Next.js server actions have direct DB access. |
| **Supabase Storage for video thumbnails** | "While migrating, also move thumbnail storage to Supabase Storage." Seems efficient to consolidate. | Thumbnails are fetched from YouTube's CDN and stored as URLs (text column), not as files. There is nothing to migrate to Storage. Adding Supabase Storage introduces a new dependency (S3-compatible bucket, RLS policies on storage, upload/download logic) for a feature that does not exist. | Keep thumbnail URLs as text columns. YouTube CDN serves them. No local file storage exists or is needed. |
| **Supabase Auth for YouTube OAuth** | "Move YouTube OAuth token management to Supabase Auth." Centralizes auth. | YouTube OAuth is a server-side concern (token refresh, API calls). Supabase Auth is designed for user authentication (login/signup). Mixing the two creates confusion: Supabase Auth manages "who is the user" while YouTube OAuth manages "what can the app access." They solve different problems. The YouTube token is stored server-side and never exposed to the client. | Keep YouTube OAuth tokens in a dedicated table or env var, managed by the existing server-side flow. Supabase Auth is for user login if the app is ever deployed publicly. |
| **Deploy the app (Vercel/Supabase hosting)** | "Now that the DB is remote, deploy the app too so you can access it from anywhere." Logical next step after DB migration. | Deployment introduces: custom domain, HTTPS certificates, environment management, build pipeline, cold starts, CORS configuration, rate limiting, and authentication (anyone on the internet could generate scripts). The app is a personal tool -- `localhost:3000` on any machine with the repo cloned is sufficient. | Run locally on both machines. `git pull && npm run dev` takes 10 seconds. Deployment is a separate milestone if ever needed. |
| **Connection pooling with PgBouncer** | "Use Supabase's PgBouncer for connection pooling." Recommended for production apps. | The app is a Next.js dev server running locally with at most 1-2 concurrent connections. PgBouncer's session/transaction modes add complexity (prepared statement limitations, connection state issues). Direct connection to Supabase's PostgreSQL endpoint is sufficient for single-user usage. | Use Supabase's **direct connection** string for simplicity. If using `drizzle-kit push/migrate`, direct connection is required anyway. Only switch to pooler if connection limit issues arise (Supabase free tier allows 60 direct connections -- more than enough). Actually, Supabase's Supavisor pooler is now the default and handles this transparently. Use the pooler URL with `?prepare=false` in Drizzle config for maximum compatibility. |
| **Migrate SQLite WAL mode optimizations** | "Port the WAL mode and pragma settings to PostgreSQL equivalents." | PostgreSQL does not use WAL pragma the same way. Its WAL is always on and managed by the server. The `journal_mode = WAL` and `foreign_keys = ON` pragmas are SQLite-specific. PostgreSQL enforces foreign keys by default and manages its own WAL. Attempting to set these on PostgreSQL is either a no-op or an error. | Delete the pragma lines from `db/index.ts` entirely. PostgreSQL handles this at the server level. |
| **Full-text search with Supabase** | "Add search across scripts now that we have PostgreSQL." PostgreSQL has built-in full-text search via `tsvector`. | Over-engineering for ~10 scripts. JavaScript `filter()` on the client side handles search at this scale with zero latency. Adding `tsvector` columns, GIN indexes, and search queries adds complexity for a dataset that fits in memory. | Use client-side filtering in the script library. Revisit PostgreSQL full-text search if the library exceeds 100+ scripts (which would take 2+ years at current pace). |

## Feature Dependencies

```
Schema Rewrite (sqliteTable -> pgTable)
    |
    +--enables--> Drizzle Config Switch (dialect: "postgresql")
    |                 |
    |                 +--enables--> drizzle-kit push/migrate to Supabase
    |
    +--enables--> Connection Module Rewrite (better-sqlite3 -> postgres)
    |                 |
    |                 +--enables--> Server Actions Work (getDb() returns pg client)
    |                                   |
    |                                   +--enables--> Data Migration Script (reads SQLite, writes Supabase)
    |
    +--enables--> Native JSONB Queries (text -> jsonb columns)

Environment Variable Setup (DATABASE_URL)
    +--required-by--> Connection Module Rewrite
    +--required-by--> Drizzle Config Switch
    +--required-by--> Data Migration Script

Supabase Project Creation
    +--required-by--> Environment Variable Setup
    +--required-by--> Schema Push

Remove better-sqlite3
    +--requires--> All server actions verified working with PostgreSQL
    +--requires--> Data migration completed and verified
```

### Dependency Notes

- **Schema rewrite is the foundation:** Everything depends on having a valid PostgreSQL schema in Drizzle. This must be done first and validated with `drizzle-kit push` before any other work.
- **Data migration requires both old and new connections:** The migration script reads from local SQLite (keeping better-sqlite3 temporarily) and writes to Supabase. Remove better-sqlite3 only AFTER migration is verified.
- **Environment setup is a prerequisite for everything remote:** The Supabase project must exist and the connection string must be in `.env.local` before any PostgreSQL work begins.
- **JSONB is a schema-level change, not a separate feature:** Converting `text({mode:"json"})` to `jsonb()` happens during the schema rewrite. No additional work needed -- Drizzle handles serialization/deserialization.

## MVP Definition

### Launch With (v3.0 Core)

The minimum migration -- every existing feature works identically but backed by Supabase instead of local SQLite.

- [ ] **Supabase project created** -- Free tier, region closest to Pavlo (EU West or similar)
- [ ] **PostgreSQL schema via Drizzle** -- All 4 tables rewritten with `pgTable`, JSON columns as `jsonb`, timestamps as `timestamp`
- [ ] **Connection module rewrite** -- `getDb()` returns Drizzle PostgreSQL client connected to Supabase
- [ ] **All server actions verified** -- generate, editor, library, metrics actions pass manual testing
- [ ] **Data migration script** -- One-shot script that copies all existing data from SQLite to Supabase
- [ ] **Environment variable setup** -- `DATABASE_URL` in `.env.local`, documented in CLAUDE.md
- [ ] **Remove better-sqlite3** -- Uninstall native dependency, delete local DB file, clean up SQLite artifacts
- [ ] **Both devices tested** -- App works from Windows PC and MacBook Air connecting to same Supabase instance

### Add After Validation (v3.x)

Features to add once the migration is stable and Pavlo has used it from both devices.

- [ ] **JSONB-powered script filtering** -- Filter library by anti-slop score range, search within hooks. Trigger: when Pavlo has 15+ scripts and scrolling becomes tedious.
- [ ] **Supabase Edge Function for scheduled metric sync** -- Trigger: when manual "Sync" button feels like a chore (likely at 3+ videos/week).

### Future Consideration (v4+)

Features to defer until the tool's scope changes fundamentally.

- [ ] **Supabase Auth + RLS** -- Defer until: multi-user or public deployment is considered
- [ ] **Supabase Realtime** -- Defer until: collaborative editing or live dashboards are needed
- [ ] **Full-text search** -- Defer until: 100+ scripts where client-side filtering is slow
- [ ] **Public deployment** -- Defer until: Pavlo wants access without cloning the repo on a device

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Supabase project + env setup | HIGH (blocker) | LOW | P1 |
| PostgreSQL schema rewrite | HIGH (blocker) | LOW | P1 |
| Connection module rewrite | HIGH (blocker) | LOW | P1 |
| Server action verification | HIGH (blocker) | LOW | P1 |
| Data migration script | HIGH | LOW | P1 |
| Remove better-sqlite3 | MEDIUM (DX improvement) | LOW | P1 |
| Both-device verification | HIGH (the whole point) | LOW | P1 |
| JSONB-powered filtering | MEDIUM | LOW | P2 |
| Edge Function metric sync | LOW | MEDIUM | P3 |
| Supabase Auth + RLS | LOW (single user) | MEDIUM | P3 |
| Supabase Realtime | LOW (single user) | HIGH | P3 |
| Full-text search | LOW (~10 scripts) | MEDIUM | P3 |

**Priority key:**
- P1: Must have for v3.0 -- the migration is incomplete without these
- P2: Should have, add when the feature gap becomes noticeable
- P3: Nice to have, defer until tool scope changes

## Migration-Specific Considerations

### SQLite to PostgreSQL Type Mapping

| SQLite (current) | PostgreSQL (target) | Notes |
|-------------------|---------------------|-------|
| `integer().primaryKey({autoIncrement: true})` | `serial().primaryKey()` | PostgreSQL uses `serial` (auto-incrementing integer) |
| `text("col")` | `text("col")` | Identical |
| `text("col", {mode: "json"})` | `jsonb("col")` | Native JSON with query support |
| `integer("col", {mode: "timestamp"})` | `timestamp("col")` | Native timestamp type |
| `integer("col")` | `integer("col")` | Identical |
| `text("status", {enum: [...]})` | `text("status")` with check constraint, or `pgEnum` | Can use Drizzle's `pgEnum` for type safety, or keep as text with app-level validation |

### What Does NOT Change

- Drizzle query API (select, insert, update, delete, where, join, relations)
- Server action file structure and logic
- UI components (they call server actions, not the database directly)
- YouTube OAuth flow (independent of database)
- Anti-slop scoring logic (independent of database)
- Script generation flow (independent of database)

## Sources

- [Drizzle ORM: Get Started with Supabase](https://orm.drizzle.team/docs/get-started/supabase-new) -- official Drizzle + Supabase setup guide (HIGH confidence)
- [Drizzle ORM: Supabase in existing project](https://orm.drizzle.team/docs/get-started/supabase-existing) -- migration path for existing Drizzle projects (HIGH confidence)
- [Supabase Docs: Drizzle integration](https://supabase.com/docs/guides/database/drizzle) -- Supabase-side Drizzle guide (HIGH confidence)
- [Supabase: Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security) -- RLS documentation (HIGH confidence)
- [Supabase: Database Size and Limits](https://supabase.com/docs/guides/platform/database-size) -- free tier: 500 MB, pauses after 1 week inactivity (HIGH confidence)
- [Supabase Pricing (UI Bakery analysis)](https://uibakery.io/blog/supabase-pricing) -- free tier breakdown: 500 MB DB, 1 GB storage, 50K MAUs (MEDIUM confidence)
- [Drizzle ORM: Migrations](https://orm.drizzle.team/docs/migrations) -- migration workflow with drizzle-kit (HIGH confidence)

---
*Feature research for: SQLite to Supabase migration for Devlog Scriptwriter Pipeline (v3.0)*
*Researched: 2026-03-30*
