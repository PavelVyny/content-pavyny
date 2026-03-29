---
phase: 07-oauth-schema
plan: 01
subsystem: database, api
tags: [googleapis, drizzle, sqlite, oauth2, youtube-api]

# Dependency graph
requires:
  - phase: 05-api-library
    provides: Drizzle schema patterns, SQLite database, db singleton
provides:
  - videos and video_metrics Drizzle tables in SQLite
  - youtube-client.ts OAuth2 singleton with token persistence
  - googleapis npm package installed
affects: [07-02-oauth-flow, 08-metrics-sync, 09-ui-dashboard]

# Tech tracking
tech-stack:
  added: [googleapis]
  patterns: [token-merge-on-refresh, file-based-token-storage, quick-vs-full-status-check]

key-files:
  created:
    - web/src/lib/youtube-client.ts
  modified:
    - web/src/lib/db/schema.ts
    - web/package.json
    - web/.gitignore

key-decisions:
  - "Token merge pattern: on('tokens') merges with existing file to preserve refresh_token"
  - "Quick vs full status: file-check for header, API call for settings page only"
  - "Channel info cached in token file alongside OAuth tokens"

patterns-established:
  - "Token persistence: JSON file at data/.youtube-tokens.json, gitignored"
  - "OAuth2 singleton with on('tokens') listener for automatic refresh_token preservation"
  - "video_metrics unique constraint on videoId: one metrics row per video, overwritten on sync"

requirements-completed: [YTUB-02, YTUB-05]

# Metrics
duration: 4min
completed: 2026-03-29
---

# Phase 7 Plan 01: OAuth & Schema Foundation Summary

**googleapis installed, videos/video_metrics tables in SQLite, OAuth2 client with token-merge persistence and dual status checks**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-29T15:06:54Z
- **Completed:** 2026-03-29T15:11:11Z
- **Tasks:** 3
- **Files modified:** 5

## Accomplishments
- googleapis package installed with YouTube OAuth redirect URI configured
- videos table (10 cols) and video_metrics table (13 cols) added to Drizzle schema and pushed to SQLite
- youtube-client.ts with 9 exported functions: OAuth2 singleton, token CRUD, auth URL generation, quick/full status checks, channel info fetch with caching

## Task Commits

Each task was committed atomically:

1. **Task 1: Install googleapis and add YOUTUBE_REDIRECT_URI to .env** - `853e5fd` (chore)
2. **Task 2: Add videos and videoMetrics tables to Drizzle schema and push** - `a40c8ff` (feat)
3. **Task 3: Create youtube-client.ts with OAuth2 singleton and token persistence** - `058b2c3` (feat)

## Files Created/Modified
- `web/src/lib/youtube-client.ts` - OAuth2 client singleton, token persistence, status checks, channel info
- `web/src/lib/db/schema.ts` - Added videos and videoMetrics table definitions
- `web/package.json` - Added googleapis dependency
- `web/.gitignore` - Added data/.youtube-tokens.json exclusion
- `web/.env` - Added YOUTUBE_REDIRECT_URI (gitignored, not committed)

## Decisions Made
- Token merge pattern on `on("tokens")` event: strip nulls from googleapis response, merge with existing to preserve refresh_token (per RESEARCH.md Pitfall 2)
- Quick status check (synchronous file read) vs full status check (API call) -- quick for header icon, full for settings page
- Channel info cached in token file to avoid redundant API calls
- Both scopes (youtube.readonly + yt-analytics.readonly) requested upfront so Phase 8 metrics sync needs no re-auth

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed TypeScript type mismatch in token merge callback**
- **Found during:** Task 3 (youtube-client.ts creation)
- **Issue:** googleapis `on("tokens")` callback returns tokens with nullable fields (`null | undefined`) which don't match the `StoredTokens` interface
- **Fix:** Added null-stripping loop before merge, cast merged result as `StoredTokens`
- **Files modified:** web/src/lib/youtube-client.ts
- **Verification:** `npx tsc --noEmit` passes with zero youtube-client.ts errors
- **Committed in:** 058b2c3 (Task 3 commit)

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Essential for TypeScript compilation. No scope creep.

## Issues Encountered
None beyond the type fix documented above.

## Known Stubs
None - all functions are fully implemented with real logic.

## Next Phase Readiness
- Schema ready: videos and video_metrics tables accept inserts
- OAuth2 client ready: Plan 02 can import `getOAuth2Client`, `getAuthUrl`, `saveTokens`, `deleteTokens`
- Token file path gitignored and data/ directory exists
- GCP credentials still needed in web/.env before OAuth flow will work (user setup)

## Self-Check: PASSED

All 4 created/modified files verified on disk. All 3 task commits verified in git log.

---
*Phase: 07-oauth-schema*
*Completed: 2026-03-29*
