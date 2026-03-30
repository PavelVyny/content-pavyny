---
phase: 08-metrics-dashboard
plan: 02
subsystem: ui
tags: [recharts, sparkline, retention-chart, sync-button, expandable-rows]

# Dependency graph
requires:
  - phase: 08-01
    provides: "Server actions (discoverVideos, syncSingleVideo, getScriptsWithMetrics, getLastSyncTime), types (ScriptWithVideo, VideoMetricsData)"
provides:
  - "RetentionChart component (sparkline + expanded modes)"
  - "MetricsCard component (views, retention, subs, likes, comments)"
  - "SyncButton component (count-based progress, staleness badge)"
  - "Expandable scripts table rows with chevron toggle"
  - "Scripts page wired to metrics data source"
affects: [08-03]

# Tech tracking
tech-stack:
  added: [recharts]
  patterns: [expandable-table-rows, sparkline-to-expanded-chart, count-based-sync-progress, staleness-badge]

key-files:
  created:
    - src/components/retention-chart.tsx
    - src/components/metrics-card.tsx
    - src/components/sync-button.tsx
  modified:
    - src/components/scripts-table.tsx
    - src/app/scripts/page.tsx
    - src/app/actions/metrics.ts

key-decisions:
  - "Staleness uses Intl.RelativeTimeFormat for human-readable relative time"
  - "Sparkline click toggles expanded chart inline (no modal)"
  - "Copy button fully removed from scripts table, replaced by chevron per D-03"

patterns-established:
  - "Expandable table rows: React.Fragment wrapping data row + conditional expanded row"
  - "Chart modes: same component renders sparkline or expanded based on prop"
  - "Count-based progress: discover phase then per-item sync with N/M counter"

requirements-completed: [SYNC-05, DASH-01, DASH-02, DASH-03]

# Metrics
duration: 4min
completed: 2026-03-29
---

# Phase 8 Plan 02: Sync UI & Metrics Display Summary

**Recharts retention charts, sync button with count-based progress, and expandable metric rows on scripts page**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-29T18:06:35Z
- **Completed:** 2026-03-29T18:10:21Z
- **Tasks:** 2 auto + 1 checkpoint (pending)
- **Files modified:** 6

## Accomplishments
- Installed recharts and built RetentionChart with sparkline (100px, no axes) and expanded (full width, with axes and tooltip) modes
- Created MetricsCard showing views, avg retention %, subs gained, likes, comments with clickable sparkline toggle
- Built SyncButton with two-phase sync (discover then per-video), count-based progress "Syncing N/M videos...", and colored staleness badge (green/yellow/red)
- Replaced copy button in scripts table with chevron expand/collapse toggle per D-03
- Scripts page now sources data from getScriptsWithMetrics() with full video and metrics joins

## Task Commits

Each task was committed atomically:

1. **Task 1: Install recharts and create chart + metrics components** - `35682c0` (feat)
2. **Task 2: Modify scripts table for expandable rows and update scripts page** - `9db3651` (feat)
3. **Task 3: Verify sync and metrics display on scripts page** - checkpoint:human-verify (pending)

## Files Created/Modified
- `src/components/retention-chart.tsx` - Sparkline and expanded recharts LineChart for retention curves
- `src/components/metrics-card.tsx` - Horizontal metrics display with clickable sparkline
- `src/components/sync-button.tsx` - Sync Now button with count progress and staleness indicator
- `src/components/scripts-table.tsx` - Expandable rows with chevron toggle, MetricsCard rendering
- `src/app/scripts/page.tsx` - Server component now calls getScriptsWithMetrics + getLastSyncTime
- `src/app/actions/metrics.ts` - Fixed nullable type assertions for left-join video fields

## Decisions Made
- Used Intl.RelativeTimeFormat for staleness display (no date-fns dependency needed)
- Sparkline click toggles to expanded chart inline within the table row (no popup/modal)
- Fully removed copy button and getVoiceoverText import from scripts table per D-03

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed nullable type assertions in metrics.ts**
- **Found during:** Task 1 (TypeScript compilation)
- **Issue:** Left-join on videos table produces nullable youtubeId/title in Drizzle despite notNull() schema, causing TS2322
- **Fix:** Added non-null assertions (!) for videoYoutubeId and videoTitle since they are notNull() in schema and guarded by videoId null check
- **Files modified:** src/app/actions/metrics.ts
- **Verification:** TypeScript compiles cleanly
- **Committed in:** 35682c0

**2. [Rule 1 - Bug] Fixed recharts Tooltip formatter type mismatch**
- **Found during:** Task 1 (TypeScript compilation)
- **Issue:** recharts Tooltip formatter/labelFormatter expect `unknown` parameter types, not `number`
- **Fix:** Changed parameter types to `unknown` with Number() conversion
- **Files modified:** src/components/retention-chart.tsx
- **Verification:** TypeScript compiles cleanly
- **Committed in:** 35682c0

---

**Total deviations:** 2 auto-fixed (2 bugs)
**Impact on plan:** Both fixes required for TypeScript compilation. No scope creep.

## Issues Encountered
None beyond the type fixes documented above.

## User Setup Required
None - no external service configuration required.

## Known Stubs
None - all components are wired to real data sources from Plan 08-01 server actions.

## Next Phase Readiness
- Task 3 (checkpoint:human-verify) pending user visual verification
- All UI components built and TypeScript-clean
- Ready for Plan 08-03 (video linking on editor page) after verification

---
*Phase: 08-metrics-dashboard*
*Completed: 2026-03-29*
