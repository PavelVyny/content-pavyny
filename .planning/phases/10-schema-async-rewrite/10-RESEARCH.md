# Phase 10: Schema & Async Rewrite - Research

**Researched:** 2026-03-30
**Domain:** Drizzle ORM / PostgreSQL / Supabase / Next.js async server components
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** Supabase project already exists (eu-west-1 region). DATABASE_URL will be configured in .env.local. Single instance for everything — no separate dev/prod.
- **D-02:** Connection via Supabase pooler port 6543 with `prepare: false` (from project research).
- **D-03:** Use `postgres-js` driver (not node-postgres) — pure JS, no native compilation, Drizzle-recommended for Supabase.
- **D-04:** Big-bang rewrite — replace schema, connection module, and all call sites in one pass. No dual-driver period.
- **D-05:** Use `drizzle-kit push` to create tables on empty Supabase DB. No migration files for initial schema.
- **D-06:** Write a quick smoke test script to verify each server action works end-to-end after rewrite.
- **D-07:** Let it crash — no retry logic, no connection check on startup. Next.js error boundaries handle DB connection failures.
- **D-08:** Use native PostgreSQL `timestamp` type for all date columns (createdAt, updatedAt, publishedAt, lastSyncedAt). Drizzle handles Date<->timestamp conversion. Phase 11 migration script will convert epoch integers.
- **D-09:** Use native PostgreSQL `jsonb` type for all JSON columns (hooks, titles, antiSlopScore, retentionCurve). Queryable and indexable.
- **D-10:** Use `serial` for primary keys (auto-incrementing integers in PostgreSQL).

### Claude's Discretion

- Connection singleton pattern in db/index.ts — adapt for postgres-js (may need different approach than better-sqlite3 singleton)
- Whether to keep WAL pragma equivalent (not applicable for PostgreSQL)
- Exact async patterns for page server components vs server actions
- Smoke test script structure and coverage

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| SUPA-01 | Supabase project created with DATABASE_URL configured in .env.local on both machines | Supabase pooler URL format documented below; drizzle.config.ts must read from process.env.DATABASE_URL |
| SUPA-02 | PostgreSQL schema matches current SQLite schema — all 4 tables (scripts, beats, videos, videoMetrics) created via Drizzle pgTable | Full SQLite→pgTable type mapping table provided below |
| MIGR-01 | Drizzle schema rewritten from sqliteTable to pgTable with correct type mappings (serial, jsonb, timestamp) | Exact import swaps and column API verified from installed drizzle-orm node_modules |
| MIGR-02 | DB connection module uses postgres-js with prepare: false for Supabase pooler | postgres-js driver API verified; singleton pattern documented |
| MIGR-03 | drizzle.config.ts updated for PostgreSQL dialect with DATABASE_URL | drizzle-kit "postgresql" dialect + `url` credential verified |
| ASYN-01 | All server action files converted from sync to async DB calls (await added to every query) | All 46 .get()/.all()/.run() call sites inventoried; async API verified |
| ASYN-02 | All page server components converted to async DB access | page.tsx (Home) needs async conversion; script/[id]/page.tsx and analytics/page.tsx already async |
| ASYN-03 | No remaining .get(), .all(), .run() terminal methods — all use PostgreSQL Drizzle conventions | Postgres Drizzle queries are Promises — just await instead of .get()/.all()/.run() |
</phase_requirements>

---

## Summary

Phase 10 is a mechanical big-bang rewrite. The project already has `drizzle-orm@0.45.2` installed with the `postgres-js` sub-module available in `node_modules/drizzle-orm/postgres-js/` — no new Drizzle version needed. The only new package to install is `postgres` (the postgres-js driver). All Drizzle query builder expressions (`.select()`, `.insert()`, `.update()`, `.delete()`, `.leftJoin()`, `.where()`, `eq()`, `sql`, etc.) are identical between SQLite and PostgreSQL dialects — the queries don't change, only the terminal methods change from `.get()/.all()/.run()` to `await`.

The three files that change fundamentally are: `db/schema.ts` (import swap + column type swap), `db/index.ts` (driver swap + new singleton), and `drizzle.config.ts` (dialect + credentials). Everything else is mechanical `await` additions. One special case exists: `getLastSyncTime()` in `metrics.ts` uses a raw `sql<number>` for `MAX(lastSyncedAt)` with an epoch-conversion hack — after migration to PostgreSQL `timestamp`, `MAX()` returns a Date directly, so the `* 1000` multiplication must be removed.

**Primary recommendation:** Install `postgres`, rewrite `db/index.ts` and `db/schema.ts`, update `drizzle.config.ts`, run `drizzle-kit push`, then mechanically add `await` to all 46 terminal call sites. The `home` page component needs `async` added to its function signature. Fix the `getLastSyncTime` raw SQL return type.

---

## Standard Stack

### Core

| Library | Version (installed) | Purpose | Why Standard |
|---------|---------------------|---------|--------------|
| `drizzle-orm` | 0.45.2 (already installed) | ORM — schema definition, query builder | Already in use; postgres-js module already present in node_modules |
| `postgres` | 3.4.8 (latest) | postgres-js driver — pure JS PostgreSQL client | Drizzle-recommended for Supabase; no native compilation; works on both Windows and macOS |
| `drizzle-kit` | 0.31.10 (already installed) | Schema push + migrations | Already in use; supports "postgresql" dialect |

### Packages to Swap

| Remove | Add | Why |
|--------|-----|-----|
| `better-sqlite3@^12.8.0` | `postgres@^3.4.8` | SQLite driver → PostgreSQL driver |
| `@types/better-sqlite3@^7.6.13` | (nothing) | postgres-js is TypeScript-native, no @types needed |

**Note:** `better-sqlite3` is NOT removed in Phase 10 — it stays until Phase 11 cleanup (CLEN-01). Only add `postgres`; the removal is explicitly Phase 11 scope.

**Installation:**
```bash
cd web && npm install postgres
```

**Version verification (confirmed 2026-03-30):**
- `postgres` latest: 3.4.8
- `drizzle-orm` installed: 0.45.2 (postgres-js module already bundled)
- `drizzle-kit` installed: 0.31.10

---

## Architecture Patterns

### Type Mapping: SQLite → PostgreSQL

| SQLite Column | Import Source | PostgreSQL Column | Import Source |
|---------------|--------------|-------------------|--------------|
| `integer("id").primaryKey({ autoIncrement: true })` | `drizzle-orm/sqlite-core` | `serial("id").primaryKey()` | `drizzle-orm/pg-core` |
| `integer("col")` | `drizzle-orm/sqlite-core` | `integer("col")` | `drizzle-orm/pg-core` |
| `text("col")` | `drizzle-orm/sqlite-core` | `text("col")` | `drizzle-orm/pg-core` |
| `text("col", { mode: "json" }).$type<T>()` | `drizzle-orm/sqlite-core` | `jsonb("col").$type<T>()` | `drizzle-orm/pg-core` |
| `integer("col", { mode: "timestamp" }).$defaultFn(() => new Date())` | `drizzle-orm/sqlite-core` | `timestamp("col").defaultNow()` | `drizzle-orm/pg-core` |
| `sqliteTable("name", {...})` | `drizzle-orm/sqlite-core` | `pgTable("name", {...})` | `drizzle-orm/pg-core` |

**Key import change:**
```typescript
// Before
import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

// After
import { pgTable, text, integer, serial, jsonb, timestamp } from "drizzle-orm/pg-core";
```

### Pattern 1: Schema Rewrite

**What:** Replace every column definition using the type mapping above.

```typescript
// Source: verified from node_modules/drizzle-orm/pg-core/columns/
import { pgTable, text, integer, serial, jsonb, timestamp } from "drizzle-orm/pg-core";

export const scripts = pgTable("scripts", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  format: text("format").notNull(),
  status: text("status", {
    enum: ["generating", "draft", "ready", "done"],
  }).notNull().default("draft"),
  hooks: jsonb("hooks").$type<{ variant: string; visual: string; voiceover: string; }[]>(),
  selectedHook: text("selected_hook"),
  titles: jsonb("titles").$type<string[]>(),
  thumbnail: text("thumbnail"),
  durationEstimate: text("duration_estimate"),
  antiSlopScore: jsonb("anti_slop_score").$type<{
    directness: number; rhythm: number; trust: number;
    authenticity: number; density: number; total: number; notes: string;
  }>(),
  devContext: text("dev_context"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
```

**Note on `updatedAt`:** SQLite schema uses `$defaultFn(() => new Date())` for both `createdAt` and `updatedAt`. In pgTable, use `.defaultNow()` for `createdAt`. For `updatedAt`, `.defaultNow()` sets the default at INSERT time but does NOT auto-update on UPDATE — this is the same behavior as the current SQLite schema (code manually sets `updatedAt: new Date()` in every update call). Keep this pattern unchanged.

### Pattern 2: Connection Module (db/index.ts)

**What:** Replace better-sqlite3 singleton with postgres-js + Drizzle postgres-js driver.

```typescript
// Source: verified from node_modules/drizzle-orm/postgres-js/driver.d.ts
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "./schema";

// postgres-js creates its own internal connection pool
// prepare: false required for Supabase pooler (pgBouncer transaction mode)
const client = postgres(process.env.DATABASE_URL!, { prepare: false });

export const db = drizzle(client, { schema });

// Export as function to match existing call pattern across 7 consumer files
export function getDb() {
  return db;
}
```

**Why `prepare: false`:** Supabase pooler uses pgBouncer in transaction mode. Prepared statements require session persistence. Setting `prepare: false` disables prepared statements so every query works correctly through the pooler. This is the official Supabase + Drizzle recommendation (confirmed from project STATE.md research notes).

**Singleton approach:** postgres-js manages its own connection pool internally. Unlike better-sqlite3 which needs a module-level singleton to avoid multiple file opens, postgres-js is safe to call `postgres(url, opts)` once at module load. The module-level `client` + `db` constants replace the `_db` lazy-init pattern. The `getDb()` wrapper is kept to avoid changing all 7 import consumers.

**No WAL equivalent:** PostgreSQL does not need WAL pragma — it uses WAL by default. No replacement needed.

### Pattern 3: drizzle.config.ts Update

```typescript
// Source: verified from node_modules/drizzle-kit/index.d.ts
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/lib/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
```

**Note:** `dialect: "postgresql"` (not `"postgres"`) — verified from drizzle-kit type definition which uses the literal string `"postgresql"`.

### Pattern 4: Async Conversion — Server Actions

**What:** PostgreSQL Drizzle queries return Promises. Replace terminal sync methods with `await`.

```typescript
// Before (SQLite sync)
const script = db.select().from(scripts).where(eq(scripts.id, id)).get();
const rows = db.select().from(scripts).all();
db.insert(beats).values(beatValues).run();
db.update(scripts).set({ title: "x" }).where(eq(scripts.id, id)).run();
db.delete(beats).where(eq(beats.scriptId, id)).run();

// After (PostgreSQL async)
const script = await db.select().from(scripts).where(eq(scripts.id, id)).then(rows => rows[0] ?? null);
const rows = await db.select().from(scripts);
await db.insert(beats).values(beatValues);
await db.update(scripts).set({ title: "x" }).where(eq(scripts.id, id));
await db.delete(beats).where(eq(beats.scriptId, id));
```

**The `.get()` replacement:** In SQLite Drizzle, `.get()` returns the first row or `undefined`. In PostgreSQL Drizzle, `.select()...` returns `Promise<Row[]>`. To replicate `.get()`: `await db.select()...then(r => r[0] ?? null)` or just `(await db.select(...))[0] ?? null`.

**The `.returning().get()` replacement:** In `generate.ts`, the script insert uses `.returning().get()` to get the inserted row. In PostgreSQL: `.returning()` returns `Promise<Row[]>` — use `(await db.insert(...).values(...).returning())[0]`.

```typescript
// Before
const script = db.insert(scripts).values({...}).returning().get();

// After
const [script] = await db.insert(scripts).values({...}).returning();
```

**The `.all()` replacement:** Direct `await` — PostgreSQL `.select()` already returns an array.

**The `.run()` replacement:** Plain `await` — PostgreSQL mutation queries return a Promise; just await without capturing the result.

### Pattern 5: Async Conversion — Page Server Components

Two of three pages already have `async` on the function:
- `src/app/script/[id]/page.tsx` — already `async`, uses `.get()` and `.all()` directly (no await). Needs `await` added.
- `src/app/analytics/page.tsx` — already `async`, calls only server actions (which are already async). No DB calls directly in page — no change needed to this page.
- `src/app/page.tsx` — **NOT async**. The home page calls `getDb()` and uses `.get()` synchronously. Must add `async` to the component function AND add `await`.

```typescript
// Before: src/app/page.tsx (line 8)
export default function Home() {

// After
export default async function Home() {
```

### Pattern 6: `onConflictDoUpdate` with `excluded`

The current SQLite code uses `sql` template literals with `excluded.column_name`:

```typescript
// metrics.ts — discoverVideos()
.onConflictDoUpdate({
  target: videos.youtubeId,
  set: {
    title: sql`excluded.title`,
    description: sql`excluded.description`,
    thumbnailUrl: sql`excluded.thumbnail_url`,
    updatedAt: new Date(),
  },
})
```

This pattern is valid PostgreSQL SQL and works identically with the pgTable Drizzle driver. The `excluded` pseudo-table is a PostgreSQL native concept. No change needed to the upsert logic — the `sql` template literals pass through to the PostgreSQL engine unchanged.

### Pattern 7: `getLastSyncTime` — Raw SQL MAX Fix

**Critical:** This function has a SQLite-specific epoch hack that must be fixed for PostgreSQL:

```typescript
// CURRENT (wrong after PG migration):
const result = db
  .select({ maxSync: sql<number>`MAX(${videoMetrics.lastSyncedAt})` })
  .from(videoMetrics)
  .get();
return new Date(result.maxSync * 1000); // SQLite epoch hack

// FIXED for PostgreSQL (timestamp columns return Date objects):
const result = await db
  .select({ maxSync: sql<Date>`MAX(${videoMetrics.lastSyncedAt})` })
  .from(videoMetrics)
  .then(r => r[0] ?? null);
if (!result?.maxSync) return null;
return result.maxSync; // PostgreSQL timestamp already returns Date
```

**Why:** SQLite stores timestamps as integers (Unix epoch seconds). When `sql<number>` bypasses Drizzle's column mapper, the raw value requires `* 1000` to create a valid Date. PostgreSQL `timestamp` columns return actual Date objects — no epoch multiplication needed.

### Pattern 8: Smoke Test Script

Per D-06, write a Node.js script at `scripts/smoke-test.ts` (or `.js`) that:
1. Imports `getDb` and all 4 schema tables
2. Runs one SELECT on each table (verifies connection + schema)
3. Inserts a test script row, reads it back, deletes it (verifies write round-trip)
4. Exits with code 0 on success, code 1 on any error

Run with: `cd web && npx tsx scripts/smoke-test.ts`

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| PostgreSQL connection pool | Custom pool manager | `postgres` (postgres-js) internal pool | postgres-js handles pool sizing, reconnect, idle timeout automatically |
| Prepared statement management | Manual prepare/unprepare | `prepare: false` in postgres-js config | Supabase pooler (pgBouncer) manages this — application must opt out |
| Schema creation | Raw `CREATE TABLE` SQL | `drizzle-kit push` | Generates correct DDL from TypeScript schema including FK constraints, indexes |
| Upsert logic | Manual SELECT + INSERT/UPDATE | `.onConflictDoUpdate()` | Already used; PostgreSQL `ON CONFLICT DO UPDATE` is native |
| Type mapping | Manual JSON parse/stringify | `jsonb().$type<T>()` | Drizzle handles serialization/deserialization of jsonb automatically |

---

## Common Pitfalls

### Pitfall 1: `.get()` returns undefined vs null
**What goes wrong:** SQLite `.get()` returns `undefined` for no-match. After migration, `(await db.select(...))[0]` also returns `undefined`. But existing code checks for falsy with `if (!script)` which works for both. Do NOT change to strict null checks — existing pattern is already safe.
**How to avoid:** Keep `if (!script)` checks unchanged. Do not introduce `?? null` unless the TypeScript type requires it.

### Pitfall 2: Home page not async — runtime crash
**What goes wrong:** `src/app/page.tsx` has `export default function Home()` (no `async`). With PostgreSQL, DB queries return Promises. If `async` is forgotten, the component will silently return `undefined` for the DB result instead of crashing at the type level.
**How to avoid:** Add `async` to the Home component function signature as part of the page async conversion task.

### Pitfall 3: `getLastSyncTime` epoch multiplication
**What goes wrong:** The comment in the current code explicitly says "raw sql<number> bypasses Drizzle's conversion — multiply by 1000". With PostgreSQL `timestamp`, this would multiply an already-correct Date's timestamp by 1000, producing a date ~48 years in the future.
**How to avoid:** Change `sql<number>` to `sql<Date>` and remove the `* 1000` multiplication.

### Pitfall 4: `prepare: false` forgotten
**What goes wrong:** Supabase uses pgBouncer in transaction mode. Without `prepare: false`, queries that use prepared statements will fail with `ERROR: prepared statement "..." does not exist` on the second request after a new pooler connection is assigned.
**Warning signs:** Works on first request, fails on second. Error message mentions prepared statement.
**How to avoid:** `prepare: false` in postgres-js config is locked per D-02.

### Pitfall 5: DATABASE_URL not set at `drizzle-kit push` time
**What goes wrong:** `drizzle-kit push` reads `drizzle.config.ts` which calls `process.env.DATABASE_URL!`. If `.env.local` is not loaded (drizzle-kit doesn't automatically load `.env.local`), the URL is `undefined`.
**How to avoid:** Run push as: `npx dotenv -e .env.local -- drizzle-kit push` OR set `DATABASE_URL` in the shell before running push. Alternatively, install `dotenv` or use `dotenvx`. The simpler option: run `export DATABASE_URL="..."` in the terminal session before pushing.

### Pitfall 6: Returning array vs single row
**What goes wrong:** SQLite `.returning().get()` returns a single object. PostgreSQL `.returning()` returns `Row[]`. Code like `const script = ...returning().get()` that directly accesses `script.id` will break because the PG version returns an array.
**Warning signs:** TypeScript error: "Property 'id' does not exist on type 'Row[]'."
**How to avoid:** Use array destructuring: `const [script] = await db.insert(...).values(...).returning();`

### Pitfall 7: `onConflictDoUpdate` `set` with `new Date()` captured at module init
**What goes wrong:** The current `metrics.ts` upsert sets `updatedAt: new Date()` inside the `set` object. This is fine — it's evaluated at call time, not at module load time. No change needed.
**How to avoid:** No action needed — this pattern is correct.

### Pitfall 8: `next.config.ts` serverExternalPackages
**What goes wrong:** `next.config.ts` has `serverExternalPackages: ["better-sqlite3"]`. This is Phase 11 cleanup (CLEN-02). Do NOT remove it in Phase 10 — better-sqlite3 is still installed and the config is harmless with the new driver.
**How to avoid:** Leave `next.config.ts` unchanged in Phase 10.

---

## Code Examples

### Complete db/index.ts replacement
```typescript
// Source: drizzle-orm/postgres-js/driver.d.ts (verified in node_modules)
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "./schema";

const client = postgres(process.env.DATABASE_URL!, { prepare: false });

const db = drizzle(client, { schema });

export function getDb() {
  return db;
}
```

### Complete drizzle.config.ts replacement
```typescript
// Source: drizzle-kit/index.d.ts — dialect "postgresql" verified
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/lib/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
```

### Running drizzle-kit push with env
```bash
# Option A: export in shell
export DATABASE_URL="postgresql://postgres.xxx:password@aws-0-eu-west-1.pooler.supabase.com:6543/postgres"
npx drizzle-kit push

# Option B: inline (bash)
DATABASE_URL="postgresql://..." npx drizzle-kit push
```

### Async conversion examples for common patterns
```typescript
// Single row fetch (.get() replacement)
const script = (await db.select().from(scripts).where(eq(scripts.id, id)))[0] ?? null;

// Multiple rows (.all() replacement)
const rows = await db.select().from(scripts).orderBy(desc(scripts.createdAt));

// Insert returning (.returning().get() replacement)
const [script] = await db.insert(scripts).values({ title: "...", ... }).returning();

// Mutation (.run() replacement)
await db.update(scripts).set({ status: "draft" }).where(eq(scripts.id, id));
await db.delete(beats).where(eq(beats.scriptId, id));

// Aggregate with raw sql — fixed for PostgreSQL timestamps
const result = (await db.select({ maxSync: sql<Date>`MAX(${videoMetrics.lastSyncedAt})` }).from(videoMetrics))[0];
return result?.maxSync ?? null; // already a Date, no * 1000
```

---

## Call Site Inventory

All `.get()`, `.all()`, `.run()` occurrences found in `src/` (46 total):

| File | `.get()` | `.all()` | `.run()` | Notes |
|------|----------|----------|----------|-------|
| `actions/generate.ts` | 1 | 0 | 10 | `.returning().get()` pattern on line 56 needs `[0]` array destructure |
| `actions/editor.ts` | 4 | 2 | 8 | Standard patterns |
| `actions/library.ts` | 1 | 2 | 1 | Standard patterns |
| `actions/metrics.ts` | 5 | 7 | 6 | `getLastSyncTime` needs raw sql type fix |
| `app/page.tsx` | 1 | 0 | 0 | Page not async — must add `async` to function |
| `app/script/[id]/page.tsx` | 1 | 1 | 0 | Already async function — just add `await` |

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|---------|
| Node.js | Runtime | Yes | 24.14.0 | — |
| npm | Package install | Yes | 11.9.0 | — |
| `postgres` npm package | MIGR-02 | Not yet installed | 3.4.8 available | — |
| `drizzle-orm` (postgres-js module) | MIGR-01 | Yes (in node_modules) | 0.45.2 | — |
| `drizzle-kit` | MIGR-03, drizzle push | Yes | 0.31.10 | — |
| Supabase DATABASE_URL | SUPA-01 | Not in .env.local yet | — | Manual: Pavlo creates .env.local with pooler URL |
| Supabase project (created) | SUPA-01 | Assumed (per D-01) | eu-west-1 | — |

**Missing dependencies with no fallback:**
- `postgres` npm package — must be installed before any code runs
- `DATABASE_URL` in `.env.local` — must be set by Pavlo before `drizzle-kit push` and `npm run dev`

**Missing dependencies with fallback:**
- None beyond the above

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `drizzle-orm/better-sqlite3` sync queries | `drizzle-orm/postgres-js` async queries | This phase | All terminal methods change from `.get()/.all()/.run()` to `await` |
| SQLite epoch integer timestamps | PostgreSQL native `timestamp` | This phase | `getLastSyncTime` raw SQL must change type; Phase 11 migration converts stored data |
| `text("col", { mode: "json" })` | `jsonb("col")` | This phase | PostgreSQL stores as binary JSON, supports GIN indexes |
| `integer().primaryKey({ autoIncrement: true })` | `serial().primaryKey()` | This phase | `serial` is PostgreSQL standard auto-increment |
| File-local SQLite DB (`data/scripts.db`) | Remote Supabase PostgreSQL | This phase | Survives machine reboots, accessible from both Windows and macOS |

---

## Open Questions

1. **Supabase pooler URL format**
   - What we know: Port 6543 is the pgBouncer pooler. The URL format is `postgresql://postgres.[project-ref]:[password]@aws-0-eu-west-1.pooler.supabase.com:6543/postgres`
   - What's unclear: Pavlo must retrieve the exact DATABASE_URL from the Supabase dashboard (Project Settings > Database > Connection string > Transaction pooler)
   - Recommendation: Document in task as "copy Transaction pooler connection string from Supabase dashboard"

2. **Home page (page.tsx) — async Server Component behavior in Next.js 16**
   - What we know: `script/[id]/page.tsx` and `analytics/page.tsx` already use `async` correctly. Home page does not.
   - What's unclear: Next.js 16 is installed (per AGENTS.md: "this is NOT the Next.js you know — APIs may differ"). The `async` Server Component pattern should be identical, but per AGENTS.md, consult `node_modules/next/dist/docs/` before assuming.
   - Recommendation: Keep the conversion mechanical — `async function Home()` is standard React Server Component pattern that predates Next.js 16.

3. **`tsx` for smoke test**
   - What we know: The project uses TypeScript. Running a `.ts` script requires a runner.
   - What's unclear: Whether `tsx` is installed globally or locally.
   - Recommendation: Write smoke test as a `.ts` file; run with `npx tsx scripts/smoke-test.ts` (tsx runs from npx without installation).

---

## Sources

### Primary (HIGH confidence)
- `node_modules/drizzle-orm/postgres-js/driver.d.ts` — postgres-js driver function signature verified locally
- `node_modules/drizzle-orm/pg-core/columns/serial.d.ts` — `serial()` function signature verified
- `node_modules/drizzle-orm/pg-core/columns/jsonb.d.ts` — `jsonb()` function signature verified
- `node_modules/drizzle-orm/pg-core/columns/timestamp.d.ts` — `timestamp()` returns Date verified
- `node_modules/drizzle-orm/pg-core/columns/integer.d.ts` — `integer()` for pg-core verified
- `node_modules/drizzle-kit/index.d.ts` — `dialect: "postgresql"` literal and `url` credential form verified
- Codebase audit — all 46 .get()/.all()/.run() call sites inventoried directly from source files

### Secondary (MEDIUM confidence)
- `.planning/STATE.md` — `prepare: false`, postgres-js, port 6543 decisions from prior v3.0 research session
- `10-CONTEXT.md` — All D-01 through D-10 decisions from prior discussion session

### Tertiary (LOW confidence)
- npm registry — `postgres@3.4.8` latest version (verified via `npm view postgres version`)

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — drizzle-orm postgres-js module verified in installed node_modules; postgres version from npm registry
- Architecture: HIGH — all type mappings verified from .d.ts files in node_modules; all call sites inventoried from actual source
- Pitfalls: HIGH — pitfall 3 (epoch hack) and pitfall 6 (returning array) verified from actual source code; pitfall 4 (prepare:false) from official Supabase+Drizzle guidance in STATE.md

**Research date:** 2026-03-30
**Valid until:** 2026-04-30 (stable library — drizzle-orm 0.45.x API is unlikely to change in 30 days)
