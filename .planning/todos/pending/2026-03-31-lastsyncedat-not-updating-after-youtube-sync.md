---
created: 2026-03-31T13:53:15.522Z
title: lastSyncedAt not updating after YouTube sync
area: database
files:
  - src/app/actions/metrics.ts:86-119
  - src/lib/db/schema.ts:89
---

## Problem

After YouTube sync completes (all 6 `syncSingleVideo` calls succeed with 200), `video_metrics.last_synced_at` in Supabase remains at the old value (March 29). The UI shows stale "2 days ago" / "3 hours ago" instead of "just now".

What was tried:
1. Drizzle `onConflictDoUpdate` with `lastSyncedAt: new Date()` — JS Date ignored in set clause when mixed with `sql` template literals
2. `lastSyncedAt: sql\`NOW()\`` — updates but uses server UTC (3h offset from user's UTC+3)
3. `lastSyncedAt: sql\`excluded.last_synced_at\`` — no effect, upsert set clause not executing
4. Replaced upsert with explicit `select` + `update`/`insert` — still not persisting

Manual `UPDATE video_metrics SET last_synced_at = NOW()` via raw postgres works fine. Manual Drizzle `db.update().set({ lastSyncedAt: new Date() })` via tsx script also works.

Suspicion: Next.js Turbopack dev server caches the module and doesn't pick up the updated code, OR there's a transaction/connection issue where the update succeeds locally but doesn't commit to Supabase pooler.

## Solution

TBD — needs deep investigation:
- Enable Drizzle query logging (`logger: true` in drizzle config) to see actual SQL sent
- Check if Supabase pooler with `prepare: false` affects UPDATE behavior
- Try running sync from a standalone script (bypass Next.js) to isolate
- Check if `.next` cache corruption persists across restarts
