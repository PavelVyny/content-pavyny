# Phase 10: Schema & Async Rewrite - Context

**Gathered:** 2026-03-30
**Status:** Ready for planning

<domain>
## Phase Boundary

Replace local SQLite (better-sqlite3) with Supabase PostgreSQL. Rewrite Drizzle schema from sqliteTable to pgTable, swap the connection module to postgres-js, and convert all synchronous DB call sites (.get(), .all(), .run()) to async/await. The app must be functionally identical to current behavior but running against a remote Supabase database.

</domain>

<decisions>
## Implementation Decisions

### Supabase Setup
- **D-01:** Supabase project already exists (eu-west-1 region). DATABASE_URL will be configured in .env.local. Single instance for everything — no separate dev/prod.
- **D-02:** Connection via Supabase pooler port 6543 with `prepare: false` (from project research).
- **D-03:** Use `postgres-js` driver (not node-postgres) — pure JS, no native compilation, Drizzle-recommended for Supabase.

### Migration Strategy
- **D-04:** Big-bang rewrite — replace schema, connection module, and all call sites in one pass. No dual-driver period.
- **D-05:** Use `drizzle-kit push` to create tables on empty Supabase DB. No migration files for initial schema.
- **D-06:** Write a quick smoke test script to verify each server action works end-to-end after rewrite.

### Error Handling
- **D-07:** Let it crash — no retry logic, no connection check on startup. Next.js error boundaries handle DB connection failures. Simplest approach for a local tool over stable internet.

### Type Conversions
- **D-08:** Use native PostgreSQL `timestamp` type for all date columns (createdAt, updatedAt, publishedAt, lastSyncedAt). Drizzle handles Date<->timestamp conversion. Phase 11 migration script will convert epoch integers.
- **D-09:** Use native PostgreSQL `jsonb` type for all JSON columns (hooks, titles, antiSlopScore, retentionCurve). Queryable and indexable.
- **D-10:** Use `serial` for primary keys (auto-incrementing integers in PostgreSQL).

### Claude's Discretion
- Connection singleton pattern in db/index.ts — adapt for postgres-js (may need different approach than better-sqlite3 singleton)
- Whether to keep WAL pragma equivalent (not applicable for PostgreSQL)
- Exact async patterns for page server components vs server actions
- Smoke test script structure and coverage

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Current Schema & DB
- `web/src/lib/db/schema.ts` — Current SQLite schema with all 4 tables (scripts, beats, videos, videoMetrics)
- `web/src/lib/db/index.ts` — Current better-sqlite3 connection module (singleton pattern, WAL mode)
- `web/drizzle.config.ts` — Current Drizzle config (SQLite dialect)

### Server Actions (all DB call sites)
- `web/src/app/actions/generate.ts` — Script generation and regeneration (~12 .get()/.all()/.run() calls)
- `web/src/app/actions/editor.ts` — Beat editing, hook selection, anti-slop rescoring (~16 .get()/.all()/.run() calls)
- `web/src/app/actions/library.ts` — Script listing, status changes, clipboard export (~4 .get()/.all()/.run() calls)
- `web/src/app/actions/metrics.ts` — YouTube sync, video metrics, linking (~18 .get()/.all()/.run() calls)

### Page Server Components (async conversion needed)
- `web/src/app/page.tsx` — Home page with DB access
- `web/src/app/script/[id]/page.tsx` — Script editor page
- `web/src/app/analytics/page.tsx` — Analytics dashboard

### Project Research
- `.planning/STATE.md` — Key decisions section has v3.0 research findings (postgres-js, pooler port, no supabase-js)

No external specs — requirements fully captured in decisions above.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- Drizzle ORM already in use — schema rewrite is type-level change (sqliteTable -> pgTable), not a framework swap
- All DB access goes through `getDb()` singleton in `db/index.ts` — single point of change for connection module
- Server actions already use `"use server"` directive — async conversion is mechanical (add await)

### Established Patterns
- All DB queries use Drizzle query builder (no raw SQL) — PostgreSQL compatibility is automatic for queries
- JSON columns use Drizzle's `{ mode: "json" }` with `$type<>()` — pgTable's `jsonb()` with `.$type<>()` is equivalent
- Timestamps use `{ mode: "timestamp" }` with `$defaultFn(() => new Date())` — pgTable's `timestamp()` with `.defaultNow()` replaces this

### Integration Points
- `db/index.ts` is imported by all 4 server action files and 3 page components — changing the export signature affects all consumers
- `drizzle.config.ts` needs dialect change from "sqlite" to "postgresql" and new connection string
- `package.json` needs `better-sqlite3` replaced with `postgres` (postgres-js package)
- `next.config.ts` has `serverExternalPackages: ["better-sqlite3"]` — remove after migration (Phase 11 cleanup)

</code_context>

<specifics>
## Specific Ideas

- Supabase project is in eu-west-1 region (AWS)
- Existing SQLite DB has real script data that must be preserved (Phase 11 handles data migration)
- YouTube OAuth tokens remain in local JSON file — not part of this DB migration

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 10-schema-async-rewrite*
*Context gathered: 2026-03-30*
