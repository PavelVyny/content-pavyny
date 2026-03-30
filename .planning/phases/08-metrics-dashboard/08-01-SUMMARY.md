---
phase: 08-metrics-dashboard
plan: 01
subsystem: api
tags: [youtube-api, googleapis, drizzle, server-actions, analytics]

requires:
  - phase: 07-oauth-schema
    provides: "OAuth2 client, token storage, videos + videoMetrics schema"
provides:
  - "listChannelVideos, getVideoMetrics, getRetentionData in youtube-client.ts"
  - "8 server actions for sync, queries, and video linking in metrics.ts"
  - "VideoMetricsData, VideoData, ScriptWithVideo types"
affects: [08-02, 08-03, 08-04]

tech-stack:
  added: []
  patterns: ["two-phase sync (discoverVideos + syncSingleVideo) for count-based progress", "sql`excluded.*` for upsert conflict resolution in Drizzle"]

key-files:
  created:
    - src/app/actions/metrics.ts
  modified:
    - src/lib/youtube-client.ts
    - src/lib/types.ts

key-decisions:
  - "Single-video sync calls for per-video progress updates (D-06 compliance)"
  - "Channel start date hardcoded to 2024-01-01 for Analytics API queries"
  - "sql`excluded.*` pattern for upsert SET clauses in Drizzle ORM"

patterns-established:
  - "Two-phase sync: discoverVideos returns list, client calls syncSingleVideo per video"
  - "Left join scripts->videos->videoMetrics for enriched script queries"

requirements-completed: [SYNC-01, SYNC-02, SYNC-03, SYNC-04]

duration: 2min
completed: 2026-03-29
---

# Phase 8 Plan 1: Sync Engine Backend Summary

**YouTube API methods and 8 server actions for video discovery, metrics sync with per-video progress, and script-video linking queries**

## What Was Built

### YouTube Client Methods (youtube-client.ts)
- `listChannelVideos()`: Discovers all channel videos via uploads playlist (1 quota unit vs 100 for search.list). Handles pagination with nextPageToken loop.
- `getVideoMetrics(videoIds, channelStartDate)`: Batch fetches basic metrics (views, likes, comments, shares, subs, retention %) via YouTube Analytics API.
- `getRetentionData(videoId, channelStartDate)`: Fetches per-video 100-point retention curve (audienceWatchRatio). API limitation requires one-at-a-time calls.

### Server Actions (metrics.ts)
- `discoverVideos()`: Phase 1 of sync -- fetches all channel videos, upserts to DB, returns list with count for progress tracking.
- `syncSingleVideo(youtubeId)`: Phase 2 of sync -- fetches metrics + retention for one video, upserts to videoMetrics. Called per-video by client for D-06 progress display.
- `getScriptsWithMetrics()`: Left join scripts -> videos -> videoMetrics for scripts page with inline metrics.
- `getLastSyncTime()`: MAX(lastSyncedAt) from videoMetrics for staleness indicator.
- `linkVideo(scriptId, videoId)`: Sets scriptId FK on video row.
- `unlinkVideo(videoId)`: Clears scriptId FK.
- `getUnlinkedVideos()`: Videos with no scriptId for linking dropdown.
- `getVideoForScript(scriptId)`: Video + metrics for script editor page.

### Types (types.ts)
- `VideoMetricsData`: All metric fields including retention curve.
- `VideoData`: Video identity and metadata.
- `ScriptWithVideo`: Script extended with optional video and metrics.

## Deviations from Plan

None -- plan executed exactly as written.

## Commits

| Task | Commit | Description |
|------|--------|-------------|
| 1 | a055935 | YouTube API methods: listChannelVideos, getVideoMetrics, getRetentionData |
| 2 | c69f3b1 | Server actions + types: 8 actions, 3 interfaces |

## Self-Check: PASSED
