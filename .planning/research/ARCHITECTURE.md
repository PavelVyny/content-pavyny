# Architecture: SQLite to Supabase Migration

**Domain:** Database migration (SQLite -> Supabase PostgreSQL)
**Researched:** 2026-03-30
**Confidence:** HIGH

## Current Architecture Snapshot

### Data Flow (SQLite, synchronous)

```
Browser -> Server Component/Action -> getDb() -> better-sqlite3 (sync) -> data/scripts.db
                                                                      -> data/.youtube-tokens.json (filesystem)
```

All database calls are **synchronous**. Drizzle wraps better-sqlite3 and exposes `.get()`, `.all()`, `.run()`, `.returning().get()` -- all return values directly (no await). Server actions are declared `async` but DB calls inside them are synchronous.

### Files That Touch the Database (Complete Inventory)

| File | Role | Sync DB Calls | Migration Action |
|------|------|---------------|------------------|
| `src/lib/db/index.ts` | Connection singleton | `new Database()`, `.pragma()` | **Full rewrite** |
| `src/lib/db/schema.ts` | 4 table definitions | N/A (schema only) | **Full rewrite** |
| `drizzle.config.ts` | Drizzle Kit config | N/A (config only) | **Full rewrite** |
| `src/app/actions/metrics.ts` | Video discovery, sync, analytics | 15x `.run()/.get()/.all()` | **Add await to all DB calls** |
| `src/app/actions/editor.ts` | Beat/hook editing, AI regen | 14x `.run()/.get()/.all()` | **Add await to all DB calls** |
| `src/app/actions/library.ts` | Script listing, status, voiceover | 5x `.run()/.get()/.all()` | **Add await to all DB calls** |
| `src/app/actions/generate.ts` | Script generation, deletion | 9x `.run()/.get()/.returning().get()` | **Add await to all DB calls** |
| `src/app/page.tsx` | Home page (sync server component) | 1x `.get()` | **Make component async, add await** |
| `src/app/script/[id]/page.tsx` | Script editor page (already async) | 2x `.get()/.all()` | **Add await** |
| `next.config.ts` | External packages config | N/A | **Remove better-sqlite3 entry** |
| `package.json` | Dependencies | N/A | **Remove better-sqlite3, add postgres** |

**Total: 11 files change. ~46 individual DB call sites gain `await`.**

### Current Schema (4 Tables)

| Table | Columns | JSON-as-Text Columns | FK References |
|-------|---------|---------------------|---------------|
| `scripts` | 12 | `hooks`, `titles`, `antiSlopScore` | None |
| `beats` | 5 | None | `scriptId -> scripts.id` (cascade) |
| `videos` | 8 | None | `scriptId -> scripts.id` (set null) |
| `videoMetrics` | 12 | `retentionCurve` | `videoId -> videos.id` (cascade, unique) |

## Post-Migration Architecture

### Data Flow (PostgreSQL, async)

```
Browser -> Server Component/Action -> db (export) -> postgres-js (async) -> Supabase PostgreSQL
                                                                         -> data/.youtube-tokens.json (filesystem, unchanged)
```

### Connection Architecture

```
Next.js Server (dev/prod)
  |
  postgres-js client (prepare: false)
  |
  Supabase Supavisor (port 6543, Transaction mode)
  |
  PostgreSQL (Supabase-managed)
```

**Why `prepare: false`:** Supabase Supavisor pooler runs in Transaction mode. Each query may hit a different PostgreSQL backend connection. Prepared statements are per-connection, so they break when the pooler reassigns connections. Disabling prevents intermittent `prepared statement does not exist` errors.

**Why pooler (port 6543) not direct (port 5432):** Next.js dev server with hot reload creates many connections. Direct connections have a limit (~60 on Supabase free tier). The pooler multiplexes many client connections onto fewer database connections.

## The Core Migration Pattern: Sync to Async

### Terminal Method Translation

| SQLite (better-sqlite3) | PostgreSQL (postgres-js) | Notes |
|--------------------------|--------------------------|-------|
| `.get()` | `await ...` then `[0]` | PG driver always returns arrays |
| `.all()` | `await ...` | PG returns array by default |
| `.run()` | `await ...` | No return value needed, just execute |
| `.returning().get()` | `const [row] = await ...returning()` | Destructure first element |

### Schema Type Translation

| SQLite (`drizzle-orm/sqlite-core`) | PostgreSQL (`drizzle-orm/pg-core`) | Notes |
|------------------------------------|------------------------------------|-------|
| `sqliteTable` | `pgTable` | Direct swap |
| `integer("id").primaryKey({ autoIncrement: true })` | `serial("id").primaryKey()` | `serial` = auto-increment int |
| `text("col")` | `text("col")` | Same API |
| `text("col", { mode: "json" }).$type<T>()` | `jsonb("col").$type<T>()` | Native JSONB, indexable |
| `integer("col", { mode: "timestamp" })` | `timestamp("col")` | Native timestamp type |
| `.$defaultFn(() => new Date())` | `.defaultNow()` | DB-level default |
| `text("status", { enum: [...] })` | `text("status", { enum: [...] })` | Same, or use `pgEnum` |

## File-by-File Change Specification

### 1. `src/lib/db/schema.ts` -- FULL REWRITE

All imports change from `drizzle-orm/sqlite-core` to `drizzle-orm/pg-core`. Every table definition changes.

**Before (scripts table example):**
```typescript
import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const scripts = sqliteTable("scripts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  status: text("status", { enum: ["generating", "draft", "ready", "done"] })
    .notNull().default("draft"),
  hooks: text("hooks", { mode: "json" }).$type<HookVariant[]>(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull().$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull().$defaultFn(() => new Date()),
});
```

**After:**
```typescript
import { pgTable, serial, text, jsonb, timestamp, integer } from "drizzle-orm/pg-core";

export const scripts = pgTable("scripts", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  status: text("status", { enum: ["generating", "draft", "ready", "done"] })
    .notNull().default("draft"),
  hooks: jsonb("hooks").$type<HookVariant[]>(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
```

**Column changes across all 4 tables:**
- 4 primary keys: `integer().primaryKey({ autoIncrement: true })` -> `serial().primaryKey()`
- 4 JSON columns: `text({ mode: "json" })` -> `jsonb()`
- 6 timestamp columns: `integer({ mode: "timestamp" })` -> `timestamp()`
- All `$defaultFn(() => new Date())` -> `defaultNow()`
- Plain `integer()` columns (views, likes, etc.) stay as `integer()` -- same in pg-core

### 2. `src/lib/db/index.ts` -- FULL REWRITE

**Before:**
```typescript
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";
import path from "path";

const DB_PATH = path.join(process.cwd(), "data", "scripts.db");
let _db: ReturnType<typeof drizzle> | null = null;

export function getDb() {
  if (!_db) {
    const sqlite = new Database(DB_PATH);
    sqlite.pragma("journal_mode = WAL");
    sqlite.pragma("foreign_keys = ON");
    _db = drizzle(sqlite, { schema });
  }
  return _db;
}
```

**After:**
```typescript
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const client = postgres(process.env.DATABASE_URL!, { prepare: false });
export const db = drizzle({ client, schema });
```

**What disappears:** File path, `path` import, WAL pragma, foreign keys pragma, singleton pattern. PostgreSQL enforces FKs by default. `postgres-js` manages its own connection pool internally.

**Export change:** `getDb()` function -> direct `db` export. All 8 consumer files update their import from `const db = getDb()` to `import { db } from "@/lib/db"`. Alternatively, keep `getDb()` as a wrapper that returns `db` to minimize downstream changes -- but direct export is cleaner.

### 3. `drizzle.config.ts` -- FULL REWRITE

**Before:**
```typescript
export default defineConfig({
  schema: "./src/lib/db/schema.ts",
  out: "./drizzle",
  dialect: "sqlite",
  dbCredentials: { url: "./data/scripts.db" },
});
```

**After:**
```typescript
export default defineConfig({
  schema: "./src/lib/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: { url: process.env.DATABASE_URL! },
});
```

### 4. `src/app/actions/editor.ts` -- ADD AWAIT (14 sites)

All functions are already `async`. Every `db.` chain ending in `.run()`, `.get()`, or `.all()` gains `await` and the terminal method changes.

**Example transformation:**
```typescript
// Before
db.update(beats).set({ [field]: value }).where(eq(beats.id, beatId)).run();

// After
await db.update(beats).set({ [field]: value }).where(eq(beats.id, beatId));
```

```typescript
// Before
const script = db.select().from(scripts).where(eq(scripts.id, scriptId)).get();

// After
const [script] = await db.select().from(scripts).where(eq(scripts.id, scriptId)).limit(1);
```

### 5. `src/app/actions/library.ts` -- ADD AWAIT (5 sites)

Same mechanical pattern. `.all()` becomes just `await`, `.get()` becomes `await ... .limit(1)` then `[0]`.

### 6. `src/app/actions/generate.ts` -- ADD AWAIT (9 sites)

Special case -- `returning().get()`:
```typescript
// Before
const script = db.insert(scripts).values({...}).returning().get();

// After
const [script] = await db.insert(scripts).values({...}).returning();
```

### 7. `src/app/actions/metrics.ts` -- ADD AWAIT (15 sites)

Largest file. Additional concern beyond mechanical await:

**Timestamp behavior change in `getLastSyncTime()`:**
```typescript
// Before (SQLite stores timestamps as integer seconds)
return new Date(result.maxSync * 1000);

// After (PostgreSQL timestamp returns proper Date or ISO string)
// The * 1000 MUST be removed or dates will be in year ~64000
return result.maxSync ? new Date(result.maxSync) : null;
```

**`onConflictDoUpdate` with `sql\`excluded.column\``:** This syntax works identically in PostgreSQL -- it is standard SQL UPSERT syntax, not SQLite-specific. No changes needed.

**Raw SQL aggregations:** `COALESCE(SUM(...), 0)` and `MAX(...)` work identically. No changes.

### 8. `src/app/page.tsx` -- MAKE ASYNC

Currently a **synchronous** server component. Must become async:
```typescript
// Before
export default function Home() {
  const db = getDb();
  const latestScript = db.select()...get();

// After
export default async function Home() {
  const [latestScript] = await db.select()...limit(1);
```

### 9. `src/app/script/[id]/page.tsx` -- ADD AWAIT (2 sites)

Already `async`. Two DB calls gain `await`:
```typescript
// Before
const script = db.select().from(scripts).where(eq(scripts.id, scriptId)).get();
const scriptBeats = db.select().from(beats).where(eq(beats.scriptId, scriptId)).orderBy(beats.order).all();

// After
const [script] = await db.select().from(scripts).where(eq(scripts.id, scriptId)).limit(1);
const scriptBeats = await db.select().from(beats).where(eq(beats.scriptId, scriptId)).orderBy(beats.order);
```

### 10. `next.config.ts` -- REMOVE ENTRY

```typescript
// Before
const nextConfig: NextConfig = {
  serverExternalPackages: ["better-sqlite3"],
};

// After
const nextConfig: NextConfig = {};
```

### 11. `package.json` -- DEPENDENCY SWAP

**Remove:**
- `"better-sqlite3": "^12.8.0"` from dependencies
- `"@types/better-sqlite3": "^7.6.13"` from devDependencies

**Add:**
- `"postgres": "^3.4.5"` to dependencies

### 12. `.env.local` -- ADD DATABASE_URL

```env
DATABASE_URL=postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres
```

## Files That Do NOT Change

| File | Why Unaffected |
|------|---------------|
| `src/lib/youtube-client.ts` | Reads/writes tokens to filesystem. No DB dependency. |
| `src/lib/agent.ts` | AI generation logic. No DB calls. |
| `src/lib/types.ts` | TypeScript interfaces. DB-agnostic. |
| `src/lib/references.ts` | Reads skill reference files. No DB. |
| All `src/components/*.tsx` | Client components. Never touch DB directly. |
| `src/app/analytics/page.tsx` | Calls server actions from metrics.ts. No direct DB access. |

## Data Migration Strategy

### Approach: One-Time ETL Script

A standalone Node.js script that reads from SQLite and writes to Supabase PostgreSQL. Runs once, then gets deleted.

**Why a script, not Drizzle migrations:** Drizzle migrations create/alter schemas. They do not move data between different databases. Data migration is a separate concern.

### Key Transformations

| Data Type | SQLite Storage | PostgreSQL Storage | Transform |
|-----------|---------------|-------------------|-----------|
| Timestamps | Integer (unix seconds) | `timestamp` (native) | `new Date(value * 1000)` |
| JSON columns | Text string | JSONB (native object) | `JSON.parse(value)` |
| Auto-increment IDs | INTEGER PRIMARY KEY | SERIAL | Insert with explicit IDs |

### Sequence Reset After Bulk Insert

After inserting rows with explicit IDs, PostgreSQL serial sequences are out of sync. Must reset:
```sql
SELECT setval('scripts_id_seq', (SELECT COALESCE(MAX(id), 0) FROM scripts));
SELECT setval('beats_id_seq', (SELECT COALESCE(MAX(id), 0) FROM beats));
SELECT setval('videos_id_seq', (SELECT COALESCE(MAX(id), 0) FROM videos));
SELECT setval('video_metrics_id_seq', (SELECT COALESCE(MAX(id), 0) FROM video_metrics));
```

### Migration Order (FK-aware)

1. `scripts` (no dependencies)
2. `beats` (depends on scripts)
3. `videos` (depends on scripts)
4. `videoMetrics` (depends on videos)

### Data Volume

Current dataset is small: ~10 scripts, ~50 beats, ~6 videos, ~6 metrics rows. Migration will complete in under 1 second. No batching or streaming needed.

## Anti-Patterns to Avoid

### Anti-Pattern 1: Using Supabase JS client instead of Drizzle
**What:** Replacing Drizzle queries with `@supabase/supabase-js` `from().select()` calls.
**Why bad:** Rewrites every query in a different API. Loses Drizzle's type safety, migration tooling, and the ability to switch databases again later. The entire codebase (8 files, 46 call sites) uses Drizzle.
**Instead:** Keep Drizzle ORM. Only change the driver layer (better-sqlite3 -> postgres-js). All query logic stays identical except for terminal methods.

### Anti-Pattern 2: Direct connection without pooler
**What:** Using port 5432 (direct) instead of 6543 (pooler) in DATABASE_URL.
**Why bad:** Next.js dev server hot reload opens many connections. Direct connections exhaust the ~60 connection limit on Supabase free tier within minutes of development.
**Instead:** Always use the pooler URL (port 6543) with `prepare: false`.

### Anti-Pattern 3: Forgetting `prepare: false`
**What:** Connecting postgres-js without disabling prepared statements.
**Why bad:** Works fine locally with direct connection, then intermittent `prepared statement "s1" does not exist` errors in production or with pooler. Hard to debug because it is intermittent.
**Instead:** Always pass `{ prepare: false }` when using Supabase connection pooler.

### Anti-Pattern 4: Incomplete await migration
**What:** Missing `await` on some DB calls after converting to async driver.
**Why bad:** Returns `Promise` objects instead of data. TypeScript may not catch this if the variable is typed as `any` or the result is used in a truthy check (Promise is always truthy).
**Instead:** Systematic grep for `.get()`, `.all()`, `.run()` and verify every instance has `await`. The terminal methods themselves disappear in postgres-js.

### Anti-Pattern 5: Keeping SQLite timestamp math
**What:** Leaving `result.maxSync * 1000` in `getLastSyncTime()` after migration.
**Why bad:** PostgreSQL returns proper Date objects for timestamp columns. Multiplying by 1000 produces dates in year ~64000.
**Instead:** Remove all `* 1000` timestamp conversions. Drizzle + pg-core handles timestamp serialization/deserialization natively.

### Anti-Pattern 6: Running schema push instead of migrations
**What:** Using `drizzle-kit push` to sync schema to Supabase instead of generating migration files.
**Why bad:** Push is destructive -- it can drop columns to match schema. No rollback, no audit trail.
**Instead:** Use `drizzle-kit generate` to create migration SQL files, review them, then `drizzle-kit migrate` to apply. Keep migration files in version control.

## Environment Variables

| Variable | Value Pattern | Used By |
|----------|--------------|---------|
| `DATABASE_URL` | `postgresql://postgres.[ref]:[pass]@aws-0-[region].pooler.supabase.com:6543/postgres` | `lib/db/index.ts`, `drizzle.config.ts` |

YouTube OAuth credentials (`YOUTUBE_CLIENT_ID`, `YOUTUBE_CLIENT_SECRET`) remain unchanged. YouTube tokens remain in filesystem (`data/.youtube-tokens.json`) -- migrating them to Supabase is a separate future concern.

## Rollback Strategy

Keep `data/scripts.db` intact throughout migration. If Supabase migration fails:
1. `git revert` the migration commit
2. `npm install` to restore better-sqlite3
3. App works exactly as before with local SQLite
4. No data loss -- SQLite file was never modified or deleted

## Sources

- [Drizzle ORM + Supabase connection guide](https://orm.drizzle.team/docs/connect-supabase) -- HIGH confidence
- [Drizzle with Supabase Database tutorial](https://orm.drizzle.team/docs/tutorials/drizzle-with-supabase) -- HIGH confidence
- [Get Started with Drizzle and Supabase (existing project)](https://orm.drizzle.team/docs/get-started/supabase-existing) -- HIGH confidence
- [Supabase Database connection docs](https://supabase.com/docs/guides/database/connecting-to-postgres) -- HIGH confidence
- [Supabase Drizzle integration guide](https://supabase.com/docs/guides/database/drizzle) -- HIGH confidence
