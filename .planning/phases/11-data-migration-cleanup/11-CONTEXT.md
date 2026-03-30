# Phase 11: Data Migration & Cleanup - Context

**Gathered:** 2026-03-30
**Status:** Ready for planning

<domain>
## Phase Boundary

Migrate all existing data from the local SQLite database (data/scripts.db) to Supabase PostgreSQL, remove the SQLite dependency completely, and verify the app works identically from both of Pavlo's machines (Windows PC and MacBook Air M1) against the same Supabase instance.

</domain>

<decisions>
## Implementation Decisions

### Timestamp Conversion
- **D-01:** Auto-detect epoch format — migration script inspects each timestamp column, detects whether values are seconds or milliseconds based on magnitude, converts to proper PostgreSQL timestamps. Handles mixed formats safely.
- **D-02:** Post-migration output shows just row counts per table. No sample rows, no full validation — trust the conversion logic.

### Cross-Machine Verification
- **D-03:** Manual verification on both machines — Pavlo opens the app on Windows PC and MacBook Air M1, creates a script on one, confirms it appears on the other.
- **D-04:** MacBook Air M1 already has the repo cloned and npm installed. Only needs .env.local with DATABASE_URL and npm install to pick up postgres-js.

### SQLite Cleanup
- **D-05:** Keep SQLite files as backup temporarily — add data/ to .gitignore but keep on disk. Pavlo deletes manually once confident Supabase is stable.
- **D-06:** Do NOT delete scripts.db, .db-shm, .db-wal during this phase. Just gitignore them.

### Migration Approach (Claude's Discretion)
- Migration script reads SQLite directly (better-sqlite3 as a devDependency or via CLI) and writes to Supabase via postgres-js
- One-shot script — run once, verify counts, done
- Reset serial sequences after import to prevent PK conflicts

### Claude's Discretion
- Whether to use better-sqlite3 as a temporary devDependency for the migration script or use sqlite3 CLI to export
- Exact epoch detection threshold (e.g., values > 1e12 are milliseconds, otherwise seconds)
- Migration script file location and naming
- Whether to wrap migration in a transaction

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Current Schema & Connection (Phase 10 output)
- `src/lib/db/schema.ts` — PostgreSQL schema with pgTable (serial PKs, jsonb, timestamp)
- `src/lib/db/index.ts` — postgres-js connection module with Supabase pooler
- `drizzle.config.ts` — PostgreSQL dialect config

### SQLite Source Data
- `data/scripts.db` — Source SQLite database (16KB, 4 tables: scripts, beats, videos, videoMetrics)

### Phase 10 Context (prior decisions)
- `.planning/phases/10-schema-async-rewrite/10-CONTEXT.md` — Type conversion decisions (D-08: timestamp, D-09: jsonb, D-10: serial)

### Smoke Test
- `scripts/smoke-test.ts` — Existing Supabase CRUD smoke test (from Phase 10)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `scripts/smoke-test.ts` — Already verifies Supabase CRUD for all 4 tables, can be run post-migration
- `src/lib/db/index.ts` — postgres-js connection module, reusable for migration script's write side

### Established Patterns
- postgres-js with `prepare: false` for Supabase pooler
- Drizzle ORM pgTable schema defines target structure
- `getDb()` wrapper pattern for connection access

### Integration Points
- Migration script reads from SQLite file, writes to Supabase using same connection as app
- After migration: run existing smoke-test.ts to verify
- .gitignore needs data/ entry

</code_context>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches for the migration script.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 11-data-migration-cleanup*
*Context gathered: 2026-03-30*
