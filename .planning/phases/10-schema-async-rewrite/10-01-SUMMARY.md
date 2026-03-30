---
phase: 10-schema-async-rewrite
plan: "01"
subsystem: database
tags: [postgres, supabase, drizzle, postgres-js, async]

# Dependency graph
requires:
  - phase: 08-metrics-dashboard
    provides: SQLite schema with 4 tables, server actions, page components
provides:
  - PostgreSQL schema via Drizzle pgTable (scripts, beats, videos, videoMetrics)
  - postgres-js connection module with Supabase pooler support
  - Fully async server actions and page components
  - Smoke test script for DB verification
affects: [11-data-migration-cleanup]

# Tech tracking
tech-stack:
  added: [postgres (postgres-js)]
  patterns: [async DB calls with await, array destructuring for single-row queries, pgTable schema definitions]

key-files:
  created:
    - .env.local.example
    - scripts/smoke-test.ts
  modified:
    - src/lib/db/schema.ts
    - src/lib/db/index.ts
    - drizzle.config.ts
    - src/app/actions/generate.ts
    - src/app/actions/editor.ts
    - src/app/actions/library.ts
    - src/app/actions/metrics.ts
    - src/app/page.tsx
    - src/app/script/[id]/page.tsx
    - next.config.ts
    - package.json

key-decisions:
  - "Array destructuring [row] for single-row queries instead of .get() -- PostgreSQL Drizzle returns arrays"
  - "getLastSyncTime uses sql<string> with direct Date constructor -- PostgreSQL returns proper timestamps, no epoch multiplication"
  - "Module-level db singleton without lazy init -- postgres-js handles connection pooling internally"

patterns-established:
  - "Async DB pattern: const [row] = await db.select().from(table).where(...)"
  - "Insert with return: const [row] = await db.insert(table).values({...}).returning()"
  - "Update/delete without terminal method: await db.update(table).set({...}).where(...)"

requirements-completed: [SUPA-01, SUPA-02, MIGR-01, MIGR-02, MIGR-03, ASYN-01, ASYN-02, ASYN-03]

# Metrics
duration: 8min
completed: 2026-03-30
---

# Phase 10 Plan 01: Schema & Async Rewrite Summary

**Full SQLite-to-PostgreSQL migration: Drizzle pgTable schema, postgres-js connection with Supabase pooler, and async conversion of all 50+ DB call sites across 7 files**

## Performance

- **Duration:** 8 min
- **Started:** 2026-03-30T19:31:10Z
- **Completed:** 2026-03-30T19:39:08Z
- **Tasks:** 6
- **Files modified:** 12

## Accomplishments
- Replaced better-sqlite3 with postgres-js for Supabase PostgreSQL connectivity
- Rewrote Drizzle schema from sqliteTable to pgTable with correct type mappings (serial, jsonb, timestamp)
- Converted all 50+ synchronous DB calls across 4 server action files and 2 page components to async/await
- Zero SQLite references remain in source code -- verified by grep

## Task Commits

Each task was committed atomically:

1. **Task 1: Install postgres-js** - `60b73e7` (chore)
2. **Task 2: Rewrite Drizzle schema** - `9028e11` (feat)
3. **Task 3: Rewrite DB connection** - `11cc540` (feat)
4. **Task 4: Convert server actions** - `d255d5e` (feat)
5. **Task 5: Convert page components** - `d15c53c` (feat)
6. **Task 6: Smoke test script** - `42689b7` (feat)

**Plan metadata:** `4381105` (docs: plan file)

## Files Created/Modified
- `src/lib/db/schema.ts` - PostgreSQL schema with pgTable, serial, jsonb, timestamp
- `src/lib/db/index.ts` - postgres-js connection with prepare: false for Supabase pooler
- `drizzle.config.ts` - PostgreSQL dialect with DATABASE_URL
- `src/app/actions/generate.ts` - Async script generation and deletion
- `src/app/actions/editor.ts` - Async beat editing, hook management, anti-slop rescoring
- `src/app/actions/library.ts` - Async script listing, status changes, voiceover export
- `src/app/actions/metrics.ts` - Async YouTube sync, metrics queries, video linking
- `src/app/page.tsx` - Async home page with DB access
- `src/app/script/[id]/page.tsx` - Async script editor page
- `next.config.ts` - Removed better-sqlite3 from serverExternalPackages
- `package.json` - Swapped better-sqlite3 for postgres
- `.env.local.example` - DATABASE_URL template
- `scripts/smoke-test.ts` - CRUD smoke test for all 4 tables

## Decisions Made
- Used array destructuring `const [row] = await ...` for single-row queries, replacing `.get()` -- cleanest pattern for PostgreSQL Drizzle
- Fixed `getLastSyncTime` to use `sql<string>` instead of `sql<number>` -- PostgreSQL returns proper timestamps, no epoch multiplication needed
- Kept module-level db singleton without lazy init -- postgres-js manages its own connection pool internally, no need for the better-sqlite3 lazy pattern
- Removed `serverExternalPackages: ["better-sqlite3"]` from next.config.ts -- no native modules needed with postgres-js (pure JS)

## Deviations from Plan

None - plan executed exactly as written.

## Known Stubs

None - all data paths are wired to the Supabase connection.

## Issues Encountered
- 4 pre-existing TypeScript errors in UI components (scripts-table.tsx, truncated-text.tsx, video-link-selector.tsx, youtube-status-icon.tsx) related to shadcn/ui v4 type changes -- not caused by this migration, not fixed (out of scope)

## User Setup Required

Pavlo must configure DATABASE_URL before the app will work:
1. Copy `.env.local.example` to `.env.local`
2. Set `DATABASE_URL` to the Supabase pooler connection string (port 6543)
3. Run `npx drizzle-kit push` to create tables in Supabase
4. Run `npx tsx scripts/smoke-test.ts` to verify connectivity

## Next Phase Readiness
- Schema and async rewrite complete -- ready for Phase 11 (data migration)
- Tables need to be created in Supabase via `drizzle-kit push` before data migration
- Existing SQLite data is untouched -- Phase 11 will handle data transfer

## Self-Check: PASSED

- All 12 created/modified files exist on disk
- All 7 commit hashes found in git log

---
*Phase: 10-schema-async-rewrite*
*Completed: 2026-03-30*
