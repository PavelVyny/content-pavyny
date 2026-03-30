# Stack Research: SQLite to Supabase Migration

**Domain:** Database migration — SQLite (better-sqlite3) to Supabase (PostgreSQL) in existing Next.js 16 + Drizzle ORM app
**Researched:** 2026-03-30
**Confidence:** HIGH

## Current Stack (What We Have)

| Package | Version | Role |
|---------|---------|------|
| `better-sqlite3` | ^12.8.0 | SQLite driver |
| `@types/better-sqlite3` | ^7.6.13 | Types for SQLite driver |
| `drizzle-orm` | ^0.45.2 | ORM (keeps, version unchanged) |
| `drizzle-kit` | ^0.31.10 | Schema tooling (keeps, version unchanged) |

**Current schema imports:** `drizzle-orm/sqlite-core` (`sqliteTable`, `text`, `integer`)
**Current driver import:** `drizzle-orm/better-sqlite3`
**Current config dialect:** `"sqlite"`

## Recommended Stack Changes

### Add These Packages

| Package | Version | Purpose | Why This One |
|---------|---------|---------|--------------|
| `postgres` | ^3.4.8 | PostgreSQL driver (postgres-js) | Drizzle's recommended driver for Supabase. Faster than `pg` (node-postgres), no native binaries, works in serverless. Official Drizzle + Supabase docs use this exclusively. |

### Remove These Packages

| Package | Why Remove |
|---------|------------|
| `better-sqlite3` | Replaced by `postgres` -- no longer using SQLite |
| `@types/better-sqlite3` | Types for removed package |

### Keep Unchanged

| Package | Version | Notes |
|---------|---------|-------|
| `drizzle-orm` | ^0.45.2 | Supports both SQLite and PostgreSQL. No version bump needed. |
| `drizzle-kit` | ^0.31.10 | Supports both dialects. No version bump needed. |

### Do NOT Add

| Package | Why Not |
|---------|---------|
| `@supabase/supabase-js` | Not needed. Drizzle talks directly to PostgreSQL via `postgres` driver. Supabase JS client is for PostgREST/Auth -- we use neither. All DB access is server-side (Next.js server actions). Adding it would create two competing data access layers. |
| `pg` (node-postgres) | Older driver with native bindings. `postgres` (postgres-js) is faster, zero native deps, and is what Drizzle docs recommend for Supabase. |
| `dotenv` | Next.js already handles `.env.local` loading. No need for a separate dotenv package. |

## Schema Migration: SQLite to PostgreSQL

The schema file (`src/lib/db/schema.ts`) needs a full rewrite of imports and column type definitions. Drizzle does NOT support dialect-agnostic schemas -- you must use dialect-specific table builders.

### Import Changes

```typescript
// BEFORE (SQLite)
import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

// AFTER (PostgreSQL)
import { pgTable, text, integer, serial, jsonb, timestamp } from "drizzle-orm/pg-core";
```

### Column Type Mapping

| SQLite (current) | PostgreSQL (target) | Notes |
|------------------|---------------------|-------|
| `integer("id").primaryKey({ autoIncrement: true })` | `serial("id").primaryKey()` | `serial` = auto-incrementing 4-byte int. Cleaner than `integer().generatedAlwaysAsIdentity()`. |
| `text("title").notNull()` | `text("title").notNull()` | Identical API -- `text()` exists in both dialects. |
| `text("status", { enum: [...] })` | `text("status", { enum: [...] })` | Identical API. Could upgrade to native `pgEnum` but unnecessary complexity for 4 values. |
| `text("hooks", { mode: "json" })` | `jsonb("hooks")` | Use `jsonb` instead of `text` with JSON mode. PostgreSQL-native JSON with indexing support. Keep `.$type<>()` for TypeScript inference. |
| `text("anti_slop_score", { mode: "json" })` | `jsonb("anti_slop_score")` | Same as above -- switch all JSON text columns to `jsonb`. |
| `text("retention_curve", { mode: "json" })` | `jsonb("retention_curve")` | Same pattern. |
| `text("titles", { mode: "json" })` | `jsonb("titles")` | Same pattern. |
| `integer("created_at", { mode: "timestamp" })` | `timestamp("created_at").notNull().defaultNow()` | PostgreSQL has native `timestamp` type. Use `defaultNow()` instead of `$defaultFn(() => new Date())`. |
| `integer("updated_at", { mode: "timestamp" })` | `timestamp("updated_at").notNull().defaultNow()` | Same. For auto-update on modification, handle in application code (Drizzle has no `onUpdate` for PG timestamps). |
| `integer("published_at", { mode: "timestamp" })` | `timestamp("published_at")` | Nullable timestamp, no default. |
| `integer("last_synced_at", { mode: "timestamp" })` | `timestamp("last_synced_at").notNull().defaultNow()` | Same pattern as created_at. |
| `integer("views").notNull().default(0)` | `integer("views").notNull().default(0)` | Identical API. |
| `.references(() => table.id, { onDelete: "cascade" })` | `.references(() => table.id, { onDelete: "cascade" })` | Identical API. Foreign keys work the same way. |
| `.unique()` | `.unique()` | Identical API. |

### Key Differences That Matter

1. **JSON columns:** SQLite stores JSON as text with a `mode: "json"` hint. PostgreSQL has native `jsonb` -- use it. Better query performance, can index JSON fields later if needed.

2. **Timestamps:** SQLite stores timestamps as integers (epoch). PostgreSQL has native `timestamp` type. The `defaultNow()` method is PostgreSQL-native and cleaner than `$defaultFn()`.

3. **Auto-increment:** SQLite uses `integer().primaryKey({ autoIncrement: true })`. PostgreSQL uses `serial().primaryKey()`. Under the hood, `serial` creates a sequence.

4. **No breaking query changes:** All Drizzle query builder calls (`eq()`, `desc()`, `inArray()`, etc.) are dialect-agnostic. Server actions that use `db.select()`, `db.insert()`, `db.update()`, `db.delete()` need zero changes.

5. **`updatedAt` behavior:** Current SQLite schema uses `$defaultFn(() => new Date())` which only sets the value on INSERT, not UPDATE. PostgreSQL's `defaultNow()` has the same INSERT-only behavior. The application code that explicitly sets `updatedAt: new Date()` on updates continues to work unchanged.

## Connection Setup

### New `src/lib/db/index.ts`

```typescript
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

// Supabase connection pooler (Transaction mode) requires prepare: false
const client = postgres(process.env.DATABASE_URL!, { prepare: false });

export const db = drizzle(client, { schema });
```

**Why `prepare: false`:** Supabase's default connection pooler uses Transaction mode (via PgBouncer). Transaction mode does not support prepared statements. Without this flag, queries will fail with cryptic errors about unnamed prepared statements.

**Why no singleton pattern:** The current SQLite setup uses a module-level singleton with lazy init (`getDb()`) to survive Next.js hot reload. With `postgres-js`, the module-level `client` already acts as a connection pool. No need for the `getDb()` wrapper -- just export `db` directly. This is the pattern shown in all Drizzle + Supabase documentation.

**Export change:** Current code exports `getDb()` function. New code exports `db` constant. All call sites need updating from `getDb()` to `db`.

### New `drizzle.config.ts`

```typescript
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

### Environment Variable

```env
# .env.local
DATABASE_URL=postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres
```

The connection string comes from Supabase Dashboard > Project Settings > Database > Connection String > URI (with connection pooling enabled, port 6543).

## Installation Commands

```bash
cd web

# Add PostgreSQL driver
npm install postgres

# Remove SQLite driver and types
npm uninstall better-sqlite3 @types/better-sqlite3
```

That is it. Two packages removed, one added. `drizzle-orm` and `drizzle-kit` stay at current versions.

## Files That Need Changes

| File | Change | Scope |
|------|--------|-------|
| `src/lib/db/schema.ts` | Rewrite: `sqlite-core` imports to `pg-core`, column types | Medium -- mechanical type mapping |
| `src/lib/db/index.ts` | Rewrite: `better-sqlite3` driver to `postgres-js` driver, `getDb()` to `db` export | Small -- 5 lines total |
| `drizzle.config.ts` | Update: dialect `sqlite` to `postgresql`, dbCredentials to URL | Small -- 2 line changes |
| `package.json` | Add `postgres`, remove `better-sqlite3` + types | Via npm install/uninstall |
| `.env.local` | Add `DATABASE_URL` | New env var |
| All files importing `getDb` | Change `getDb()` calls to `db` import | Find-and-replace |

### Files That Do NOT Need Changes

- Server action query logic (select, insert, update, delete) -- Drizzle query API is dialect-agnostic
- React components -- no DB imports
- API routes using googleapis -- no DB interaction changes
- Claude Agent SDK integration -- no DB layer changes
- Any non-DB utility code

## Alternatives Considered

| Recommended | Alternative | Why Not |
|-------------|-------------|---------|
| `postgres` (postgres-js) | `pg` (node-postgres) | `pg` has native C bindings (build issues on some platforms), slower, older API design. Drizzle + Supabase official docs recommend `postgres`. |
| `postgres` (postgres-js) | `@supabase/supabase-js` | JS client uses PostgREST (HTTP), not direct SQL. Loses Drizzle's type-safe query builder, adds latency per query, creates competing data access patterns. |
| `jsonb` for JSON columns | `json` (without binary) | `jsonb` is PostgreSQL best practice: faster reads, supports indexing, negligible write overhead for small objects. |
| `serial` for PKs | `integer().generatedAlwaysAsIdentity()` | `serial` is simpler, widely understood, and sufficient. `generatedAlwaysAsIdentity` is SQL-standard but more verbose with no practical benefit here. |
| `text` with enum for status | `pgEnum` | Native enum requires a separate `CREATE TYPE` and migration step if values change. `text` with TypeScript enum inference is simpler and equally type-safe at the application layer. |
| Connection pooler (port 6543) | Direct connection (port 5432) | Pooler handles connection limits (Supabase free tier has limited connections). Direct is fine for single-user local dev but pooler is safer default. |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| `@supabase/supabase-js` | Creates competing data access layer alongside Drizzle. PostgREST adds HTTP overhead vs direct SQL. | `postgres` driver with Drizzle ORM |
| `pg` (node-postgres) | Native C bindings cause build issues, especially cross-platform (Windows + Mac). Slower than postgres-js. | `postgres` (postgres-js) -- pure JS, no native deps |
| `dotenv` | Next.js handles `.env.local` automatically. Adding dotenv creates duplicate env loading. | Built-in Next.js env loading |
| `@supabase/ssr` | Auth middleware for Supabase Auth. This project uses YouTube OAuth2 via googleapis, not Supabase Auth. | Not needed -- no Supabase Auth |
| Supabase Edge Functions | App runs locally as Next.js. No need for serverless functions on Supabase's infrastructure. | Next.js server actions |

## Version Compatibility

| Package | Compatible With | Notes |
|---------|-----------------|-------|
| `drizzle-orm@0.45.2` | `postgres@3.4.x` | Tested and documented by Drizzle team for Supabase |
| `drizzle-kit@0.31.10` | `drizzle-orm@0.45.x` | Same release cycle, verified compatible |
| `postgres@3.4.8` | Supabase PostgreSQL 15 | postgres-js supports PG 12+ |
| `next@16.2.1` | `postgres@3.4.x` | No conflicts -- postgres-js is pure JS, no native modules |
| `postgres@3.4.8` | Windows + macOS | Pure JavaScript, no native compilation needed. Solves the cross-platform issue that motivated this migration. |

## Data Migration Approach (Summary)

Existing SQLite data (scripts, beats, videos, videoMetrics) needs a one-time migration script:

1. Keep `better-sqlite3` temporarily as a devDependency during migration only
2. Read all rows from SQLite
3. Transform timestamps: SQLite epoch integers to JavaScript `Date` objects (PostgreSQL `timestamp` handles Date objects natively)
4. Write to Supabase via `postgres` driver using Drizzle insert
5. Verify row counts match
6. Remove `better-sqlite3` after successful migration

This is a separate one-off script, not an ongoing concern.

## Sources

### Official Documentation (HIGH confidence)
- [Drizzle + Supabase existing project guide](https://orm.drizzle.team/docs/get-started/supabase-existing) -- setup steps, package list
- [Drizzle Supabase connection reference](https://orm.drizzle.team/docs/connect-supabase) -- connection pooling, `prepare: false`
- [Drizzle PostgreSQL column types](https://orm.drizzle.team/docs/column-types/pg) -- `serial`, `jsonb`, `timestamp` definitions
- [Supabase Drizzle guide](https://supabase.com/docs/guides/database/drizzle) -- official Supabase perspective
- [Drizzle + Supabase tutorial](https://orm.drizzle.team/docs/tutorials/drizzle-with-supabase) -- end-to-end walkthrough

### Package Registries (HIGH confidence)
- [postgres npm](https://www.npmjs.com/package/postgres) -- v3.4.8, latest stable

### Community Sources (MEDIUM confidence)
- [MakerKit: Drizzle with Supabase in Next.js](https://makerkit.dev/blog/tutorials/drizzle-supabase) -- confirms no need for @supabase/supabase-js when using Drizzle directly

---
*Stack research for: SQLite to Supabase migration (v3.0 milestone)*
*Researched: 2026-03-30*
