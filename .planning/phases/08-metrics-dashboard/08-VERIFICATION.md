---
phase: 08-metrics-dashboard
verified: 2026-03-29T18:45:00Z
status: human_needed
score: 12/12 must-haves verified
re_verification: false
human_verification:
  - test: "Click Sync Now on /scripts page with YouTube connected"
    expected: "Button disables, shows 'Discovering videos...', then 'Syncing 1/N videos...' through 'Syncing N/N videos...', then staleness badge turns green with relative time"
    why_human: "Requires live YouTube OAuth tokens and real API responses; cannot simulate in static analysis"
  - test: "Expand a script row that has a linked video with synced metrics"
    expected: "Chevron click reveals MetricsCard showing views, avg retention %, subs gained, likes, comments, and a 100px sparkline; sparkline click expands to full chart with axes"
    why_human: "Expandable row state interaction and recharts rendering require browser"
  - test: "Link a video on the script editor page"
    expected: "Dropdown shows unlinked videos as 'title — date'; selecting one creates the link and EditorMetricsPanel appears above ScriptEditor with 5-metric grid and full retention chart"
    why_human: "useTransition pending state and conditional render require browser verification"
  - test: "Unlink a video from the editor page"
    expected: "Choosing 'Unlink video' from the dropdown removes EditorMetricsPanel; back on /scripts the row shows 'No video' instead of chevron"
    why_human: "Requires verifying revalidatePath cross-page cache invalidation in running app"
---

# Phase 8: Metrics Dashboard Verification Report

**Phase Goal:** Pavlo can sync his YouTube channel data with one click, see per-video metrics and retention curves in the app, and link scripts to their published videos
**Verified:** 2026-03-29T18:45:00Z
**Status:** human_needed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Calling `discoverVideos()` fetches all channel videos, upserts them, and returns list with total count | VERIFIED | `discoverVideos()` calls `listChannelVideos()`, loops with `onConflictDoUpdate`, returns `{ success, videos: [...] }` — metrics.ts:15-59 |
| 2 | Calling `syncSingleVideo()` fetches basic metrics and retention curve for one video and upserts to video_metrics | VERIFIED | Calls `getVideoMetrics([youtubeId])` + `getRetentionData()`, upserts with `onConflictDoUpdate` — metrics.ts:61-130 |
| 3 | The client calls `discoverVideos()` then `syncSingleVideo()` per video to show count-based progress | VERIFIED | SyncButton implements exact two-phase pattern; button text shows `Syncing ${current}/${total} videos...` — sync-button.tsx:65-101 |
| 4 | Repeated sync calls upsert (not duplicate) both videos and video_metrics rows | VERIFIED | Both `videos` and `videoMetrics` inserts use `onConflictDoUpdate` — metrics.ts:35, 104 |
| 5 | Pavlo can click Sync Now and see count-based progress "Syncing N/M videos..." | VERIFIED | `buttonText = \`Syncing ${progress.current}/${progress.total} videos...\`` — sync-button.tsx:110 |
| 6 | Staleness indicator shows green/yellow/red with relative time text | VERIFIED | `getStaleness()` uses `Intl.RelativeTimeFormat`, green <1h, yellow <24h, red ≥24h — sync-button.tsx:11-44 |
| 7 | Each script row has a chevron that expands to show metrics when a video is linked | VERIFIED | `ChevronDown`/`ChevronUp` toggle with `expandedId` state, MetricsCard rendered in colSpan=6 tr — scripts-table.tsx:131-158 |
| 8 | Expanded metrics card shows views, retention %, subs gained, likes, comments, and a sparkline | VERIFIED | MetricsCard renders all 5 metrics + `<RetentionChart data={metrics.retentionCurve ?? []} expanded={expanded} />` — metrics-card.tsx:17-36 |
| 9 | Clicking the sparkline expands it to a full retention curve chart with axes | VERIFIED | `onClick={() => setExpanded(!expanded)}` wrapper on RetentionChart; expanded mode renders CartesianGrid + XAxis + YAxis — retention-chart.tsx:30-65 |
| 10 | Pavlo can link a script to a YouTube video via a dropdown on the editor page | VERIFIED | `VideoLinkSelector` with native select renders unlinked videos; `onChange` calls `linkVideo(scriptId, videoId)` — video-link-selector.tsx:30-44 |
| 11 | Pavlo can unlink a script from a video using the same dropdown | VERIFIED | "Unlink video" option calls `unlinkVideo(linkedVideo.id)` — video-link-selector.tsx:35-37 |
| 12 | When a script is linked, the editor page shows a metrics detail panel with views, retention %, subs, likes, comments and a retention chart | VERIFIED | `EditorMetricsPanel` conditionally renders when `videoData && serializedMetrics`; shows 5-metric grid + `<RetentionChart expanded />` — script/[id]/page.tsx:81-88 |

**Score:** 12/12 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/lib/youtube-client.ts` | listChannelVideos, getVideoMetrics, getRetentionData | VERIFIED | All 3 functions present with full implementation; uses `playlistItems.list` + `youtubeAnalytics("v2")` |
| `src/app/actions/metrics.ts` | 8 server actions + query helpers | VERIFIED | All 8 exports present: discoverVideos, syncSingleVideo, getScriptsWithMetrics, getLastSyncTime, linkVideo, unlinkVideo, getUnlinkedVideos, getVideoForScript |
| `src/lib/types.ts` | VideoMetricsData, VideoData, ScriptWithVideo | VERIFIED | All 3 interfaces exported |
| `src/components/sync-button.tsx` | Sync Now button with count-based progress and staleness badge | VERIFIED | Two-phase sync, "Syncing N/M videos...", colored staleness badge |
| `src/components/metrics-card.tsx` | Expanded metrics display in table row | VERIFIED | 5 metrics + clickable RetentionChart toggle |
| `src/components/retention-chart.tsx` | Sparkline and expanded recharts LineChart | VERIFIED | Dual mode (100px sparkline / full 200px chart with axes), recharts 3.8.1 |
| `src/components/scripts-table.tsx` | Expandable rows with chevron toggle | VERIFIED | ScriptWithVideo prop, ChevronDown/Up, expandedId state, MetricsCard in expanded tr |
| `src/app/scripts/page.tsx` | Server component with metrics data and sync state | VERIFIED | Calls getScriptsWithMetrics + getLastSyncTime, renders SyncButton |
| `src/components/video-link-selector.tsx` | Dropdown for linking/unlinking videos | VERIFIED | Native select, useTransition, linkVideo + unlinkVideo wired |
| `src/components/editor-metrics-panel.tsx` | Metrics detail panel for editor page | VERIFIED | Card with 5-metric grid + RetentionChart in expanded mode |
| `src/app/script/[id]/page.tsx` | Editor page with video linking and metrics panel | VERIFIED | Fetches getVideoForScript + getUnlinkedVideos, renders both components |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `metrics.ts` | `youtube-client.ts` | import listChannelVideos, getVideoMetrics, getRetentionData | WIRED | Lines 7-11 of metrics.ts |
| `metrics.ts` | `db/schema.ts` | Drizzle insert/upsert into videos and videoMetrics tables | WIRED | `onConflictDoUpdate` on both tables, metrics.ts:35, 104 |
| `scripts/page.tsx` | `metrics.ts` | calls getScriptsWithMetrics + getLastSyncTime | WIRED | page.tsx:2-4, 9-10 |
| `scripts-table.tsx` | `metrics-card.tsx` | renders MetricsCard in expanded row | WIRED | scripts-table.tsx:8, 154-158 |
| `metrics-card.tsx` | `retention-chart.tsx` | renders RetentionChart with sparkline/expanded toggle | WIRED | metrics-card.tsx:4, 31 |
| `sync-button.tsx` | `metrics.ts` | calls discoverVideos() then syncSingleVideo() per video | WIRED | sync-button.tsx:5, 71, 84 |
| `script/[id]/page.tsx` | `metrics.ts` | calls getVideoForScript + getUnlinkedVideos | WIRED | page.tsx:7, 41-42 |
| `video-link-selector.tsx` | `metrics.ts` | calls linkVideo and unlinkVideo | WIRED | video-link-selector.tsx:5, 36, 39 |
| `editor-metrics-panel.tsx` | `retention-chart.tsx` | renders RetentionChart in expanded mode | WIRED | editor-metrics-panel.tsx:5, 56 |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|---------------|--------|-------------------|--------|
| `scripts-table.tsx` | `scripts: ScriptWithVideo[]` | `getScriptsWithMetrics()` → left join scripts+videos+videoMetrics → SQLite | Real DB query with left joins | FLOWING |
| `sync-button.tsx` | `progress.current/total` | `discoverVideos()` → `listChannelVideos()` → YouTube API | Real YouTube API; `discovered.videos.length` populates total | FLOWING |
| `metrics-card.tsx` | `metrics: VideoMetricsData` | Passed from scripts-table, sourced from `syncSingleVideo()` → `getVideoMetrics()` + `getRetentionData()` | Real Analytics API data upserted to DB | FLOWING |
| `retention-chart.tsx` | `data: number[]` | `metrics.retentionCurve` from `videoMetrics.retentionCurve` | Stored `audienceWatchRatio` array from YouTube Analytics API | FLOWING |
| `editor-metrics-panel.tsx` | `metrics: VideoMetricsData` | `getVideoForScript()` → join videos+videoMetrics → SQLite | Real DB join query | FLOWING |
| `video-link-selector.tsx` | `unlinkedVideos: VideoData[]` | `getUnlinkedVideos()` → SQLite where scriptId IS NULL | Real DB query | FLOWING |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| TypeScript compiles cleanly | `cd web && npx tsc --noEmit` | No errors | PASS |
| recharts installed | `grep "recharts" package.json` | `"recharts": "^3.8.1"` | PASS |
| All 6 phase commits in git | `git log --oneline` | a055935, c69f3b1, 35682c0, 9db3651, 34eae36, e272992 all present + 709b0b5 fix | PASS |
| discoverVideos export exists | grep check | `export async function discoverVideos` at metrics.ts:15 | PASS |
| syncSingleVideo export exists | grep check | `export async function syncSingleVideo` at metrics.ts:61 | PASS |
| "Syncing N/M videos..." pattern in sync-button | grep check | `Syncing ${progress.current}/${progress.total} videos...` at line 110 | PASS |
| RetentionChart dual-mode | grep check | `expanded` prop branches at retention-chart.tsx:18, 30, 68 | PASS |
| onConflictDoUpdate (upsert, not insert) | grep check | Both videos (line 35) and videoMetrics (line 104) use upsert pattern | PASS |
| Live sync/UI interaction | requires running app + OAuth | — | SKIP — needs human |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| SYNC-01 | 08-01 | User can click "Sync Now" to fetch all channel videos and metrics | SATISFIED | SyncButton + discoverVideos + syncSingleVideo wired end-to-end |
| SYNC-02 | 08-01 | Video list auto-discovered from channel (no manual entry) | SATISFIED | `listChannelVideos()` uses uploads playlist — no manual entry |
| SYNC-03 | 08-01 | Basic metrics fetched per video (views, likes, comments, subs gained, avg view %) | SATISFIED | `getVideoMetrics()` fetches all listed metrics via Analytics API |
| SYNC-04 | 08-01 | Retention curve fetched per video (100-point audienceWatchRatio) | SATISFIED | `getRetentionData()` maps `audienceWatchRatio` index 1 to number[] |
| SYNC-05 | 08-02 | Sync staleness indicator (green <1h, yellow <24h, red >24h) | SATISFIED | `getStaleness()` in sync-button.tsx with Intl.RelativeTimeFormat |
| DASH-01 | 08-02 | Per-video metrics cards in dashboard view (views, retention %, subs gained) | SATISFIED | MetricsCard renders all 5 metrics inline on scripts page |
| DASH-02 | 08-02 | Retention curve chart per video (line chart with recharts) | SATISFIED | RetentionChart with recharts LineChart, sparkline + expanded modes |
| DASH-03 | 08-02 | Metrics mini-cards on script library page (for linked videos) | SATISFIED | MetricsCard in expandable scripts-table rows |
| DASH-04 | 08-03 | Metrics detail panel on script editor page (when script linked to video) | SATISFIED | EditorMetricsPanel conditionally rendered on script/[id]/page.tsx |
| LINK-01 | 08-03 | User can link a script to a YouTube video via dropdown selector | SATISFIED | VideoLinkSelector calls linkVideo() server action |
| LINK-02 | 08-03 | User can unlink a script from a video | SATISFIED | "Unlink video" option calls unlinkVideo() server action |

**Orphaned requirements (Phase 8 in REQUIREMENTS.md not claimed by any plan):** None. All 11 Phase 8 requirements are claimed and verified.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `script/[id]/page.tsx` | 77-78, 84 | `as any` for serialized Date props passed to client components | Info | Deliberate pragmatic choice to avoid duplicate serialized interfaces; documented in 08-03-SUMMARY.md. Dates are correctly serialized via `.toISOString()` before the cast. No runtime impact. |

No TODO/FIXME/HACK markers found across any phase 8 files. No placeholder returns or empty implementations detected.

### Human Verification Required

#### 1. Full Sync Flow

**Test:** Start `npm run dev`, go to `/scripts`, click "Sync Now" with YouTube channel connected.
**Expected:** Button disables immediately, text shows "Discovering videos...", then cycles through "Syncing 1/N videos..." up to "Syncing N/N videos...", then shows green staleness badge with "just now" and brief "Synced N videos" success text.
**Why human:** Live YouTube OAuth tokens required; API quotas and response shapes can only be validated against real YouTube data.

#### 2. Expandable Metrics Row

**Test:** After a sync, click the chevron icon on a script row that has a linked video.
**Expected:** MetricsCard expands inline showing views, avg retention %, subs gained, likes, comments, and a 100px sparkline. Click sparkline to toggle expanded full chart with X/Y axes. Click chevron again to collapse.
**Why human:** React state interaction and recharts canvas rendering must be verified visually in browser.

#### 3. Video Linking on Editor Page

**Test:** Open any script editor (`/script/[id]`), select a video from the "Link to video..." dropdown.
**Expected:** Dropdown disables briefly (useTransition), then EditorMetricsPanel appears below the header row showing 5-metric grid and full retention chart. Dropdown now shows linked video title with "Unlink video" option.
**Why human:** useTransition pending state, conditional metrics panel render, and Date serialization edge cases require browser verification.

#### 4. Unlink and Cross-Page Cache Invalidation

**Test:** After linking a video on the editor page, choose "Unlink video". Then navigate to `/scripts`.
**Expected:** EditorMetricsPanel disappears on the editor page. On the scripts list, the row for that script shows "No video" instead of a chevron.
**Why human:** Verifies that `revalidatePath("/scripts")` and `revalidatePath("/script/[id]")` actually cause Next.js to refetch fresh data on both pages.

### Gaps Summary

No automated gaps found. All 12 truths are VERIFIED, all 11 artifacts pass all 4 levels (exists, substantive, wired, data-flowing), all 11 requirements are SATISFIED. TypeScript compiles cleanly. The phase goal — one-click sync, per-video metrics with retention curves, and script-to-video linking — is fully implemented in code.

The 4 human verification items are behavioral confirmations that require a running app with live YouTube OAuth. They are not blocking gaps; they are final integration tests to confirm the wired code behaves correctly at runtime.

---

_Verified: 2026-03-29T18:45:00Z_
_Verifier: Claude (gsd-verifier)_
