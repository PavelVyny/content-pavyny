---
phase: 07-oauth-schema
verified: 2026-03-29T16:00:00Z
status: gaps_found
score: 7/9 must-haves verified
re_verification: false
gaps:
  - truth: "videos and video_metrics tables exist in SQLite and accept inserts"
    status: failed
    reason: "drizzle-kit push was not successfully applied — tables are defined in schema.ts but absent from data/scripts.db. Direct SQL queries confirm: no such table: videos / video_metrics."
    artifacts:
      - path: "web/src/lib/db/schema.ts"
        issue: "File is correct and substantive (tables defined), but push to SQLite never ran or failed silently"
      - path: "web/data/scripts.db"
        issue: "Database only contains scripts and beats tables. videos and video_metrics are missing."
    missing:
      - "Run cd web && npx drizzle-kit push to apply the schema to the SQLite database"
  - truth: "TypeScript compiles without errors"
    status: failed
    reason: "youtube-connect-card.tsx line 34 has a type error: getChannelInfoAction() returns Promise<ChannelInfo | null | undefined> but setChannel expects SetStateAction<ChannelInfo | null>. undefined is not assignable."
    artifacts:
      - path: "web/src/components/youtube-connect-card.tsx"
        issue: "Line 34: setChannel(info) — info can be undefined (from StoredTokens['channel']) but setChannel state type is ChannelInfo | null"
    missing:
      - "Change line 34 from setChannel(info) to setChannel(info ?? null) to handle undefined return from getChannelInfoAction()"
human_verification:
  - test: "End-to-end OAuth flow (regression check after gap fixes)"
    expected: "Connect YouTube -> Google consent -> channel card appears, header icon turns red. Disconnect -> card reverts, icon goes gray. Script generation still works."
    why_human: "Requires live browser interaction with Google OAuth consent screen and a configured GCP project. Already verified once per 07-02-SUMMARY.md — quick regression check recommended after TypeScript fix."
---

# Phase 7: OAuth & Schema Verification Report

**Phase Goal:** Pavlo can connect his YouTube channel via OAuth2 from a settings page, see connection status at all times, and the database is ready to store video metrics
**Verified:** 2026-03-29T16:00:00Z
**Status:** gaps_found
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| #  | Truth | Status | Evidence |
|----|-------|--------|----------|
| 1  | videos and video_metrics tables exist in SQLite and accept inserts | FAILED | sqlite_master shows only scripts/beats. Direct SQL: "no such table: videos" |
| 2  | OAuth2 client can generate a consent URL with correct scopes | VERIFIED | getAuthUrl() in youtube-client.ts uses access_type:"offline", prompt:"consent", both scopes present |
| 3  | Token file read/write/delete works at data/.youtube-tokens.json | VERIFIED | loadTokens/saveTokens/deleteTokens all use TOKEN_PATH = data/.youtube-tokens.json with fs.existsSync guards |
| 4  | googleapis package is installed and importable | VERIFIED | package.json has "googleapis": "^171.4.0"; node -e "require('googleapis')" exits 0 |
| 5  | Clicking Connect YouTube redirects to Google consent screen | VERIFIED | handleConnect() calls getAuthUrlAction() then sets window.location.href; human-verified per 07-02 summary |
| 6  | After Google consent, app receives tokens and redirects to settings with connected status | VERIFIED | callback/route.ts exchanges code for tokens via getToken(), saves them, redirects to /settings?connected=true |
| 7  | YouTube icon in header shows correct color for connected/disconnected/expired states | VERIFIED | YouTubeStatusIcon renders #FF0000/zinc-400/#FF0000+amber-dot; layout.tsx calls getQuickConnectionStatus() and passes result as prop |
| 8  | Settings page shows channel card with name, avatar, sub count, video count when connected | VERIFIED | YouTubeConnectCard renders channel.title, thumbnailUrl, subscriberCount, videoCount when status === "connected" |
| 9  | Clicking Disconnect revokes token and clears connection | VERIFIED | disconnectYouTube() calls revokeToken, deleteTokens, resetOAuth2Client, revalidatePath |

**Score:** 7/9 truths verified

---

### Required Artifacts

#### Plan 01 Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `web/src/lib/db/schema.ts` | videos and videoMetrics table definitions | WIRED | File exists, exports `videos` and `videoMetrics`, imported via `* as schema` in db/index.ts. Tables NOT yet in SQLite. |
| `web/src/lib/youtube-client.ts` | OAuth2 client singleton, token persistence, channel info fetch | VERIFIED | 181 lines, all 9 exported functions present, null-strip token merge, both scopes, access_type:"offline", prompt:"consent" |

#### Plan 02 Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `web/src/app/api/youtube/callback/route.ts` | OAuth2 callback handler | VERIFIED | Exports GET, imports from @/lib/youtube-client, redirects to /settings?connected=true on success |
| `web/src/app/actions/youtube.ts` | Server actions for connect URL, disconnect, status | VERIFIED | "use server", exports all 5 expected actions including disconnectYouTube with revokeToken |
| `web/src/app/settings/page.tsx` | Settings page with YouTube integration section | VERIFIED | Renders YouTubeConnectCard, has "Settings" heading, "YouTube Integration" section |
| `web/src/components/youtube-status-icon.tsx` | Three-state YouTube icon for header | VERIFIED | "use client", YouTube SVG (23.498 path), #FF0000/zinc-400 colors, amber dot for expired state |
| `web/src/components/youtube-connect-card.tsx` | Connect button or channel details card | STUB (TS error) | Functionally complete but has TypeScript error on line 34 (undefined not assignable to ChannelInfo \| null) |
| `web/src/app/layout.tsx` | Header with gear icon and YouTube status icon | VERIFIED | Imports YouTubeStatusIcon + getQuickConnectionStatus + Settings from lucide-react, nav has items-center |

---

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| web/src/lib/db/schema.ts | web/src/lib/db/index.ts | import * as schema in drizzle() | WIRED | db/index.ts line 3: `import * as schema from "./schema"` |
| web/src/lib/youtube-client.ts | data/.youtube-tokens.json | fs read/write | WIRED | TOKEN_PATH defined as `path.join(process.cwd(), "data", ".youtube-tokens.json")` |
| web/src/app/api/youtube/callback/route.ts | web/src/lib/youtube-client.ts | getOAuth2Client, saveTokens, getChannelInfo imports | WIRED | Line 3-7: `import { getOAuth2Client, saveTokens, getChannelInfo } from "@/lib/youtube-client"` |
| web/src/app/actions/youtube.ts | web/src/lib/youtube-client.ts | all youtube-client functions | WIRED | Lines 4-13 import all 8 functions from @/lib/youtube-client |
| web/src/app/layout.tsx | web/src/components/youtube-status-icon.tsx | YouTubeStatusIcon component | WIRED | Line 6: `import { YouTubeStatusIcon }` used on line 54: `<YouTubeStatusIcon status={connectionStatus} />` |
| web/src/app/settings/page.tsx | web/src/app/actions/youtube.ts | server action calls | WIRED | youtube-connect-card.tsx (used by settings page) imports getAuthUrlAction, disconnectYouTube, getConnectionStatus, getChannelInfoAction |

---

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|---------------|--------|--------------------|--------|
| youtube-connect-card.tsx | `status`, `channel` | getConnectionStatus() -> getFullConnectionStatus() -> googleapis API call | Yes — makes live YouTube API call | FLOWING |
| youtube-status-icon.tsx | `status` prop | getQuickConnectionStatus() in layout.tsx — synchronous file check | Yes — reads real token file | FLOWING |
| callback/route.ts | `tokens` | client.getToken(code) — real Google OAuth exchange | Yes — live token exchange | FLOWING |

---

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| googleapis importable | `node -e "require('googleapis')"` | exits 0 | PASS |
| videos table queryable | `db.prepare('SELECT COUNT(*) FROM videos').get()` | "no such table: videos" | FAIL |
| video_metrics table queryable | `db.prepare('SELECT COUNT(*) FROM video_metrics').get()` | "no such table: video_metrics" | FAIL |
| TypeScript compilation | `npx tsc --noEmit` | 1 error in youtube-connect-card.tsx:34 | FAIL |

---

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| YTUB-01 | 07-02 | Connect YouTube channel via OAuth2 with one-click button | SATISFIED | Settings page has "Connect YouTube" button; OAuth flow human-verified per 07-02-SUMMARY |
| YTUB-02 | 07-01 | OAuth2 tokens persist in local file with auto-refresh | SATISFIED | on("tokens") listener merges tokens preserving refresh_token; file-based persistence at data/.youtube-tokens.json |
| YTUB-03 | 07-02 | Connection status indicator visible at all times | SATISFIED | YouTubeStatusIcon in layout.tsx header, three states: gray/red/red+amber-dot |
| YTUB-04 | 07-02 | User can disconnect YouTube channel from settings | SATISFIED | Disconnect button in YouTubeConnectCard calls disconnectYouTube() which revokes token + deletes file + resets singleton |
| YTUB-05 | 07-01 | Database schema has videos and video_metrics tables | BLOCKED | Tables defined in schema.ts but NOT present in data/scripts.db — drizzle-kit push was not applied |

**Orphaned requirements:** None. All 5 YTUB requirements (YTUB-01 through YTUB-05) are claimed by plans in this phase.

**Note on REQUIREMENTS.md status:** The file marks YTUB-01, YTUB-03, YTUB-04 as "Pending" and YTUB-02, YTUB-05 as "Complete" in the traceability table. Based on actual codebase verification: YTUB-01/03/04 are functionally complete (human-verified), YTUB-02 is complete, and YTUB-05 is incomplete (schema code exists, SQLite tables missing).

---

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| web/src/components/youtube-connect-card.tsx | 34 | TypeScript error: `setChannel(info)` where info can be `undefined` | Warning | Compilation fails; at runtime undefined is passed where null expected, though behavior may be the same since both are falsy |

No TODO/FIXME/placeholder comments found in phase 7 files. No empty return stubs. All handler functions contain real logic.

---

### Human Verification Required

#### 1. OAuth Flow Regression Check

**Test:** After fixing the TypeScript error and running drizzle-kit push, run `cd web && npm run dev`, navigate to http://localhost:3000/settings, connect YouTube, and verify the channel card appears with real data.
**Expected:** Channel card shows Pavlo's channel name, avatar thumbnail, subscriber count, video count. Header icon turns red. Disconnect clears everything.
**Why human:** Requires live browser interaction with Google OAuth consent screen and valid GCP credentials.

---

### Gaps Summary

Two gaps block full goal achievement:

**Gap 1 — Missing SQLite tables (blocker for YTUB-05):** The `videos` and `video_metrics` Drizzle schema definitions exist in `web/src/lib/db/schema.ts` and are correct, but `npx drizzle-kit push` was not successfully executed against the live database. The `data/scripts.db` file contains only the original `scripts` and `beats` tables from Phase 4. Phase 8 (metrics sync) cannot proceed until these tables exist.

**Gap 2 — TypeScript compilation error (code quality):** `web/src/components/youtube-connect-card.tsx` line 34 passes the return value of `getChannelInfoAction()` directly to `setChannel()`. Since `getChannelInfo()` returns `StoredTokens["channel"] | null` and `StoredTokens["channel"]` is optional (hence can be `undefined`), TypeScript rejects the assignment. The fix is a single-character change: `setChannel(info ?? null)`. This does not affect runtime behavior (undefined and null are both falsy), but the project should compile clean.

Both gaps are trivial to fix — one shell command and one source edit. The OAuth2 connection flow itself was human-verified as working end-to-end per 07-02-SUMMARY.md.

---

_Verified: 2026-03-29T16:00:00Z_
_Verifier: Claude (gsd-verifier)_
