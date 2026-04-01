---
created: 2026-03-31T13:53:15.522Z
updated: 2026-04-01T23:20:00.000Z
title: "video_metrics writes silently dropped from Next.js server actions"
area: database
priority: high
files:
  - src/app/actions/metrics.ts:88-116
  - src/lib/db/index.ts
  - src/lib/db/schema.ts:73-90
---

## Problem

**ALL writes** (INSERT, UPDATE, DELETE) to the `video_metrics` table silently fail when executed from Next.js server actions. The operation completes without error, Drizzle logger shows the SQL query, server returns 200, `{ success: true }` — but **nothing persists to Supabase**.

**Current state:** `video_metrics` table is EMPTY. All data was lost during debugging when DELETE worked but INSERT didn't persist.

### What works
- Writes to ALL other tables (`youtube_tokens`, `videos`, `scripts`, `beats`) work fine from the same server actions, same `getDb()`, same pooler connection
- Raw `INSERT INTO video_metrics ...` from standalone Node.js scripts works perfectly
- Raw `UPDATE video_metrics ...` from standalone Node.js scripts works perfectly
- Drizzle ORM `db.update(videoMetrics)` from standalone tsx scripts works
- SELECTs from `video_metrics` work everywhere

### What was tried (all failed)
1. **Drizzle `onConflictDoUpdate`** — mixed `sql` literals + JS values → JS values silently ignored
2. **Drizzle explicit `db.update().set()`** — query logged correctly, doesn't persist
3. **Drizzle `db.insert()`** — query logged, doesn't persist
4. **Drizzle `db.delete()` + `db.insert()`** — DELETE persists(!), INSERT doesn't
5. **Raw postgres-js via shared `getRawClient()`** — doesn't persist
6. **Raw postgres-js via fresh `postgres()` connection per call** — doesn't persist
7. **Direct connection (port 5432, no pooler)** — doesn't persist
8. **Update by primary key (`where id =`) instead of foreign key** — doesn't persist
9. **`sql\`NOW()\`` instead of `new Date()`** — persists but uses UTC (3h offset); was only workaround that partially worked, later stopped working too

### Key clue
The ONLY differentiator is being called from a Next.js server action. The exact same code running as a standalone script persists. This points to Next.js Turbopack or server action runtime silently rolling back or not committing transactions for this specific table.

### Not the cause
- **RLS** — RLS is enabled but with no policies; `postgres` user bypasses RLS; other RLS-enabled tables write fine
- **Supabase pooler** — other tables write through the same pooler
- **Schema issue** — table was created correctly, manual writes work
- **Connection issue** — same connection instance writes to other tables
- **Drizzle version** — drizzle-orm@0.45.2, works for all other tables

## Impact

- YouTube video metrics (views, likes, retention, subs gained) cannot be synced
- Analytics page shows 0 Total Views
- Video cards show no metrics
- Growth Timeline chart has no data

## Solution

**Approach 1 (recommended):** Create a dedicated API route (`/api/sync-metrics`) that writes to video_metrics. Call it from the Sync button via fetch instead of server action. API routes may not have the same implicit transaction behavior.

**Approach 2:** Write a standalone sync script (`scripts/sync-metrics.ts`) that runs via cron or manual execution, bypassing Next.js entirely.

**Approach 3:** Deep investigation — enable postgres-js debug logging (`debug: console.log` option), compare TCP traffic between server action writes and standalone script writes. May need to check Supabase transaction logs.

**Approach 4:** Check if `unique()` constraint on `video_id` column causes silent failures with specific Drizzle/postgres-js versions. Try temporarily removing the unique constraint and testing.

## Workaround for now

`getLastSyncTime()` reads from `youtube_tokens.updated_at` (which does persist). Subscriber count updates via `getChannelInfo(true)`. Only video-level metrics (views, likes, retention curves) are broken.
