# Pitfalls Research

**Domain:** SQLite-to-Supabase (PostgreSQL) migration for a Next.js + Drizzle ORM app
**Researched:** 2026-03-30
**Confidence:** HIGH

## Critical Pitfalls

### Pitfall 1: Synchronous-to-Async API Shift

**What goes wrong:**
Every database call in the current codebase uses better-sqlite3's synchronous Drizzle methods: `.run()`, `.get()`, `.all()`. These return values directly. PostgreSQL drivers (postgres.js, node-postgres) are async-only -- every query returns a Promise. When you swap the Drizzle driver from `drizzle-orm/better-sqlite3` to `drizzle-orm/postgres-js`, every call chain that currently does `db.select().from(x).get()` must become `await db.select().from(x)` (PostgreSQL Drizzle has no `.get()` -- it returns arrays, and you use `[0]` or `.limit(1)` for single rows).

**Why it happens:**
better-sqlite3 is the only popular Node.js database driver that is fully synchronous. Developers forget that `.get()` and `.all()` are SQLite-specific Drizzle methods, not universal. The codebase has ~30+ call sites using `.run()`, `.get()`, `.all()` across 5 action files (editor.ts, library.ts, metrics.ts, generate.ts, youtube callback).

**How to avoid:**
1. Search the entire codebase for `.run()`, `.get()`, `.all()` on db calls -- every single one needs conversion.
2. PostgreSQL Drizzle uses: `.execute()` for mutations (replaces `.run()`), returns arrays for selects (replaces `.all()`), and has no `.get()` equivalent -- use `const [row] = await db.select()...` or `.limit(1)` + array destructuring.
3. All server actions are already `async` functions but they call db synchronously without `await`. Add `await` to every db operation.
4. The `generate.ts` file does multiple sequential db calls (insert placeholder -> generate -> update). These MUST be awaited sequentially -- parallel promises would break the flow.

**Warning signs:**
- TypeScript errors about `.get()` or `.all()` not existing on the PostgreSQL drizzle instance
- Runtime "Cannot read properties of undefined" when the Promise object is used as if it were a result row
- Server actions that silently succeed but write nothing (un-awaited promises)

**Phase to address:**
Phase 1 (Schema Rewrite) -- this is the single largest mechanical change in the migration.

---

### Pitfall 2: `.returning().get()` Does Not Exist in PostgreSQL Drizzle

**What goes wrong:**
`generate.ts` line 47-56 uses `.returning().get()` to insert a script placeholder and immediately get the row back with its auto-generated ID. In PostgreSQL Drizzle, `.returning()` returns an array, not a single row. There is no `.get()` method.

**Why it happens:**
`.returning().get()` is a SQLite-specific Drizzle convenience. The PostgreSQL driver always returns arrays from `.returning()`.

**How to avoid:**
Replace:
```typescript
const script = db.insert(scripts).values({...}).returning().get();
```
With:
```typescript
const [script] = await db.insert(scripts).values({...}).returning();
```
This is used in `generateNewScript()` and is critical -- the returned `script.id` is used for all subsequent beat insertions.

**Warning signs:**
- TypeError: `.get is not a function` at runtime
- `script` is an array instead of an object, causing `script.id` to be undefined

**Phase to address:**
Phase 1 (Schema Rewrite) -- must be caught during the action file conversion.

---

### Pitfall 3: Integer Timestamps Become PostgreSQL `timestamp` -- Data Conversion Required

**What goes wrong:**
SQLite schema stores all dates as `integer("...", { mode: "timestamp" })` which Drizzle serializes as Unix epoch seconds (integer). PostgreSQL uses native `timestamp` type. During data migration, raw integer values (e.g., `1711756800`) inserted into a PostgreSQL `timestamp` column will either fail or produce garbage dates like "+54191-06-21".

**Why it happens:**
Drizzle's SQLite `mode: "timestamp"` stores seconds-since-epoch as integers. PostgreSQL's `timestamp` type expects `'2024-03-30 00:00:00'` format strings or `to_timestamp()` calls. The schema rewrite changes the column type, but the data migration script must handle the conversion separately.

Affected columns (8 total):
- `scripts.createdAt`, `scripts.updatedAt`
- `videos.publishedAt`, `videos.createdAt`, `videos.updatedAt`
- `video_metrics.lastSyncedAt`

**How to avoid:**
1. In the new PostgreSQL schema, use `timestamp("created_at").defaultNow()` -- Drizzle handles Date objects natively.
2. In the data migration script, convert integer values: `to_timestamp(integer_value)` in SQL, or `new Date(integerValue * 1000)` in JS before inserting.
3. Verify: Drizzle SQLite `mode: "timestamp"` stores seconds (not milliseconds). Double-check by reading one row from existing SQLite DB. If values are ~1.7 billion, they're seconds. If ~1.7 trillion, they're milliseconds.
4. The `getLastSyncTime()` function in metrics.ts already has a comment about this: "raw sql<number> bypasses Drizzle's conversion -- multiply by 1000". This raw SQL pattern will need a different fix in PostgreSQL.

**Warning signs:**
- Dates showing as year 54191 or 1970-01-01 after migration
- `getLastSyncTime()` returning wrong values (it uses raw `sql<number>` which bypasses Drizzle's type mapping)

**Phase to address:**
Phase 2 (Data Migration Script) -- conversion logic must be baked into the migration script.

---

### Pitfall 4: JSON Text Columns Become `jsonb` -- Silent Behavior Differences

**What goes wrong:**
The current schema stores JSON in `text("...", { mode: "json" })` columns (hooks, titles, antiSlopScore, retentionCurve). PostgreSQL should use `jsonb()` instead. While Drizzle handles serialization/deserialization, two differences bite:

1. **Ordering/whitespace:** SQLite stores JSON as-is (preserving key order, whitespace). PostgreSQL `jsonb` normalizes: removes whitespace, may reorder keys. Tests comparing JSON string equality will break.
2. **`onConflictDoUpdate` with `excluded`:** The metrics.ts upsert uses `sql\`excluded.retention_curve\`` -- in PostgreSQL, the `excluded` row reference works but the column is now `jsonb`, not `text`. The raw SQL `excluded.retention_curve` is fine, but any code that does string operations on it will fail.

**Why it happens:**
SQLite has no native JSON type -- everything is text. PostgreSQL's `jsonb` is a binary format with different semantics. Drizzle abstracts the read/write but raw `sql` template literals bypass the abstraction.

**How to avoid:**
1. Replace all `text("...", { mode: "json" })` with `jsonb("...").$type<...>()` in the PostgreSQL schema.
2. Audit all raw `sql` template literals that reference JSON columns -- there are 2 in metrics.ts (`excluded.retention_curve` is one). These should work as-is but test them.
3. Do NOT use `json()` -- use `jsonb()`. The `json` type in PostgreSQL does not support indexing and has fewer operators.

**Warning signs:**
- Type errors when reading JSON columns (getting string instead of parsed object, or vice versa)
- Upsert operations failing silently on JSON columns

**Phase to address:**
Phase 1 (Schema Rewrite) -- mechanical replacement, low risk if done consistently.

---

### Pitfall 5: `onConflictDoUpdate` Syntax Difference (SQLite `excluded.` vs PostgreSQL)

**What goes wrong:**
The metrics.ts file has two `onConflictDoUpdate` blocks using `sql\`excluded.column_name\`` syntax. While both SQLite and PostgreSQL support the `excluded` pseudo-table, Drizzle's PostgreSQL API has subtle differences:
- SQLite Drizzle uses `where` for conflict conditions
- PostgreSQL Drizzle separates into `targetWhere` (for partial indexes) and `setWhere`
- The `target` must reference the actual unique constraint column(s)

**Why it happens:**
The `excluded.column_name` raw SQL works in both databases at the SQL level. But the Drizzle API wrapper differs. If you simply change the import from `sqliteTable` to `pgTable` without reviewing the `onConflictDoUpdate` calls, you might miss API-level differences.

**How to avoid:**
1. The two upsert call sites (video discovery, metric sync) both use `target:` with a column reference -- this is compatible.
2. Verify that `sql\`excluded.column_name\`` syntax still works with the PostgreSQL driver. In most cases it does, but consider using Drizzle's typed approach: `set: { views: sql\`excluded.${videoMetrics.views.name}\` }` for safety.
3. If any upsert uses a `where` clause (none currently do), split it into `targetWhere`/`setWhere` for PostgreSQL.

**Warning signs:**
- Upsert silently does nothing (no error, no update) -- data appears stale
- PostgreSQL syntax error mentioning `ON CONFLICT`

**Phase to address:**
Phase 1 (Schema Rewrite) -- review during action file conversion.

---

### Pitfall 6: Supabase RLS Blocks All Queries by Default

**What goes wrong:**
You enable Row Level Security on tables (Supabase encourages this), add no policies, and every query returns empty arrays. The app looks like it works -- no errors -- but shows no data. Or worse: you skip RLS entirely, and your data is exposed to anyone with the Supabase anon key.

**Why it happens:**
This is a single-user local app being moved to a cloud database. There is no auth system. Supabase tables have RLS disabled by default, but the Supabase dashboard warns you to enable it. If you enable it without policies, all queries return empty. If you leave it disabled and use the anon key in client-side code, the data is publicly readable.

**How to avoid:**
Since this is a single-user app with no auth, the simplest secure approach:
1. Connect to Supabase using the **service role key** (bypasses RLS) in server actions only.
2. NEVER expose the service role key to the client (Next.js server actions keep it server-side).
3. Do NOT enable RLS -- it adds complexity for zero benefit in a single-user, server-action-only app.
4. Keep the service role key in `.env.local`, not `.env` (never committed to git).
5. Consider enabling RLS with a blanket `USING (true)` policy only if you plan to add auth later.

**Warning signs:**
- All queries return `[]` after migration even though data exists
- Supabase dashboard shows data in tables but app shows nothing
- "permission denied for table" errors

**Phase to address:**
Phase 1 (Supabase Project Setup) -- decide the RLS strategy before writing any queries.

---

### Pitfall 7: `autoIncrement` Does Not Exist in PostgreSQL -- Use `serial` or Identity Columns

**What goes wrong:**
All 4 tables use `integer("id").primaryKey({ autoIncrement: true })`. PostgreSQL has no `AUTOINCREMENT` keyword. The schema must use `serial("id").primaryKey()` or the modern `integer("id").primaryKey().generatedAlwaysAsIdentity()`.

**Why it happens:**
`autoIncrement` is SQLite syntax. Drizzle's `pgTable` does not support it. The TypeScript compiler will catch this (it's a type error), but if you're doing a find-and-replace migration, you might miss the semantic difference.

**How to avoid:**
Replace all `integer("id").primaryKey({ autoIncrement: true })` with `serial("id").primaryKey()` in the PostgreSQL schema. This is the simplest 1:1 equivalent.

For data migration: existing IDs must be preserved. After inserting migrated data, reset the sequence:
```sql
SELECT setval('scripts_id_seq', (SELECT MAX(id) FROM scripts));
```
Without this, the next insert will start at 1 and collide with existing rows.

**Warning signs:**
- TypeScript error: `autoIncrement` is not a valid option on PostgreSQL integer
- "duplicate key value violates unique constraint" on first insert after migration

**Phase to address:**
Phase 1 (Schema Rewrite) -- mechanical replacement, but sequence reset is Phase 2 (Data Migration).

---

### Pitfall 8: YouTube OAuth Tokens in Local JSON File

**What goes wrong:**
YouTube OAuth tokens are stored in `data/.youtube-tokens.json` on the local filesystem. After migrating the database to Supabase, the app works from any device for scripts/metrics, but YouTube OAuth only works on the machine where the tokens are stored. Switching between Windows PC and MacBook means re-authenticating on each machine.

**Why it happens:**
The token storage was designed for a local-only app. The migration focuses on the database but forgets about filesystem state.

**How to avoid:**
Three options, in order of recommendation:
1. **Move tokens to Supabase:** Create a `settings` or `oauth_tokens` table. Store encrypted tokens there. Both machines can access them.
2. **Move tokens to environment variables:** Less secure for refresh tokens, but simpler. Works if only one machine runs the app at a time.
3. **Accept the limitation:** If Pavlo primarily uses one machine for recording, this might not matter. Document it as a known limitation.

**Warning signs:**
- YouTube features work on one machine but not another
- "Token has been expired or revoked" errors on the second machine

**Phase to address:**
Phase 3 (Cleanup) or defer -- this is not a migration blocker but a UX gap.

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Skip RLS entirely | No auth complexity, simpler queries | Data exposed if anon key leaks, harder to add auth later | Acceptable now (single-user, service key only, no client-side DB access) |
| Use `serial` over identity columns | 1:1 replacement for autoIncrement, minimal diff | `serial` is considered legacy in PostgreSQL; identity columns are modern standard | Acceptable for migration -- can be upgraded later without data changes |
| Keep YouTube tokens in local JSON | No additional migration work | Multi-device access requires re-auth | Acceptable if Pavlo uses one primary machine |
| Use raw `sql` template literals for aggregates | Quick, works now | Bypasses Drizzle type safety, may break on schema changes | Acceptable for `getLastSyncTime()` and `getChannelStats()` -- just 2 call sites |

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Supabase connection pooling (PgBouncer) | Using prepared statements with transaction pool mode | Set `{ prepare: false }` in postgres.js client options when using Supabase's pooler |
| Supabase connection string | Using the "direct" connection URL for serverless/edge | Use the "pooler" URL for Next.js server actions; direct URL for migrations only |
| Drizzle + Supabase | Importing from wrong dialect package | Replace ALL imports: `drizzle-orm/better-sqlite3` -> `drizzle-orm/postgres-js`, `drizzle-orm/sqlite-core` -> `drizzle-orm/pg-core` |
| Environment variables | Committing `.env` with database credentials | Use `.env.local` (gitignored by default in Next.js), store `DATABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` there |
| Next.js hot reload | Creating new database connections on every hot reload | Current singleton pattern in `db/index.ts` must be adapted -- postgres.js pool handles this differently than better-sqlite3 singleton |

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| No connection pooling | Cold start on every server action (300-500ms overhead) | Use Supabase's built-in PgBouncer pooler URL, not direct connection | Immediately -- every page load is slower |
| N+1 queries during data migration | Migration script inserts one row at a time in a loop | Batch inserts: `db.insert(beats).values([...allBeats])` in single call | With >50 rows -- the current dataset is small (~30 rows total) but good practice |
| Missing indexes on foreign keys | Joins on `beats.script_id` or `video_metrics.video_id` scan full table | PostgreSQL does NOT auto-create indexes on foreign keys (SQLite does) -- add explicit indexes | At 100+ scripts with many beats |
| Raw SQL aggregate bypasses Drizzle caching | `getLastSyncTime()` uses `sql<number>MAX(...)` | In PostgreSQL, this returns a proper timestamp, not an integer -- the `* 1000` multiplication in the current code will produce wrong results | Immediately after migration |

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| Exposing `SUPABASE_SERVICE_ROLE_KEY` in client-side code | Full database read/write access to anyone | Only use service role key in server actions; never prefix env vars with `NEXT_PUBLIC_` |
| Storing YouTube OAuth tokens in a Supabase table without encryption | Token theft if database is compromised | Encrypt tokens at rest using a server-side encryption key, or store only in env vars |
| Using Supabase anon key for database operations | Data accessible to anyone who finds the key (it's meant to be public) | Use service role key for server-side operations; anon key is for client-side with RLS |
| Committing `data/.youtube-tokens.json` to git | OAuth credentials in version control | Already in `.gitignore` (verify), keep it that way |

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Database queries now have network latency | Every page load is 100-300ms slower than local SQLite | Add loading states to all pages; consider ISR/SSG for the analytics page |
| Migration script fails midway, partial data | Some scripts visible, others missing, confusing state | Run migration in a transaction; verify row counts before and after |
| YouTube OAuth flow redirects to wrong URL | OAuth callback was `localhost:3000` -- if deployed remotely, callback breaks | Update Google Cloud Console OAuth redirect URIs if deployment URL changes |

## "Looks Done But Isn't" Checklist

- [ ] **Schema rewrite:** All `sqliteTable` -> `pgTable`, all `text({mode:"json"})` -> `jsonb()`, all `integer({mode:"timestamp"})` -> `timestamp()` -- verify by searching for any remaining `sqlite` imports
- [ ] **Async conversion:** Every `.run()`, `.get()`, `.all()` replaced with `await` + array returns -- verify no un-awaited db calls remain
- [ ] **Sequence reset:** After data migration, all `serial` sequences reset to `MAX(id)` + 1 -- verify by inserting a new script and checking its ID
- [ ] **Raw SQL audit:** The 2 raw `sql` calls in metrics.ts (`MAX(last_synced_at)`, `COALESCE(SUM(...))`) must work with PostgreSQL timestamp/numeric types, not SQLite integer types
- [ ] **Connection pooling:** `prepare: false` set if using Supabase pooler -- verify by making 10+ rapid requests without connection errors
- [ ] **Foreign key indexes:** Explicit indexes on `beats.script_id`, `videos.script_id`, `video_metrics.video_id` -- PostgreSQL does NOT auto-create these
- [ ] **Environment variables:** `.env.local` has `DATABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` -- neither committed to git
- [ ] **Data integrity:** Row counts match between SQLite source and Supabase target for all 4 tables
- [ ] **YouTube tokens:** Decision made on where tokens live (local file vs. Supabase table vs. env var)

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Corrupted timestamps during migration | LOW | Re-run migration script with corrected conversion; existing SQLite DB is untouched (read-only source) |
| Missing `await` causes silent data loss | MEDIUM | Add `await`, re-test all server actions; lost data requires re-generation of affected scripts |
| RLS blocks all queries | LOW | Disable RLS: `ALTER TABLE scripts DISABLE ROW LEVEL SECURITY` or add permissive policy |
| Sequence not reset after data migration | LOW | `SELECT setval('tablename_id_seq', (SELECT MAX(id) FROM tablename))` for each table |
| Connection pool exhaustion | LOW | Restart app; check for connection leaks (missing pool.end() or unclosed connections in hot reload) |
| Wrong connection string (direct vs pooler) | LOW | Swap URL in `.env.local`; direct URL works but creates too many connections under load |

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Sync-to-async API shift | Phase 1: Schema + Actions Rewrite | Zero TypeScript errors; all server actions return correct data |
| `.returning().get()` removal | Phase 1: Schema + Actions Rewrite | `generateNewScript()` returns valid script ID |
| Integer timestamp conversion | Phase 2: Data Migration | All dates display correctly in UI; `getLastSyncTime()` returns valid Date |
| JSON text -> jsonb | Phase 1: Schema Rewrite | Hooks, titles, antiSlopScore, retentionCurve render correctly in editor |
| `onConflictDoUpdate` syntax | Phase 1: Actions Rewrite | Video discovery and metric sync upserts work without errors |
| Supabase RLS strategy | Phase 1: Project Setup | Queries return data; no permission errors |
| autoIncrement -> serial | Phase 1: Schema Rewrite | New scripts get auto-incremented IDs |
| Sequence reset after migration | Phase 2: Data Migration | First new insert after migration gets ID = MAX(existing) + 1 |
| YouTube OAuth tokens | Phase 3: Cleanup (or defer) | YouTube features work on both Windows and Mac |
| Foreign key indexes | Phase 1: Schema Rewrite | `EXPLAIN` on join queries shows index scans, not seq scans |
| Connection pooling config | Phase 1: Project Setup | No "too many connections" errors under normal use |
| Raw SQL aggregate fix | Phase 1: Actions Rewrite | `getLastSyncTime()` and `getChannelStats()` return correct values |

## Sources

- [Drizzle ORM: PostgreSQL column types](https://orm.drizzle.team/docs/column-types/pg) -- serial, timestamp, jsonb definitions
- [Drizzle ORM: SQLite column types](https://orm.drizzle.team/docs/column-types/sqlite) -- integer mode:timestamp, text mode:json
- [Drizzle ORM: Upsert Guide](https://orm.drizzle.team/docs/guides/upsert) -- onConflictDoUpdate syntax for both dialects
- [Drizzle ORM: Drizzle with Supabase](https://orm.drizzle.team/docs/tutorials/drizzle-with-supabase) -- connection setup, pooler config
- [Drizzle ORM: Connect Supabase](https://orm.drizzle.team/docs/connect-supabase) -- prepare: false requirement for transaction pooling
- [Supabase Docs: Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security) -- RLS behavior when enabled without policies
- [Supabase Docs: Drizzle integration](https://supabase.com/docs/guides/database/drizzle) -- official integration guide
- [Medium: PostgreSQL Migration That Corrupted Every Timestamp](https://medium.com/@rudra910203/the-postgresql-migration-that-corrupted-every-timestamp-26bf21b6dd7f) -- real-world timestamp conversion failure
- [pgloader: SQLite integer timestamp conversion issues](https://github.com/dimitri/pgloader/issues/1177) -- seconds vs milliseconds gotcha
- [Drizzle ORM: Insert returning](https://orm.drizzle.team/docs/insert) -- .returning() behavior per dialect

---
*Pitfalls research for: SQLite-to-Supabase PostgreSQL migration (Next.js + Drizzle ORM)*
*Researched: 2026-03-30*
