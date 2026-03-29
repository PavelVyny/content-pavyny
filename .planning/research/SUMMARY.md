# Project Research Summary

**Project:** Devlog Scriptwriter Pipeline — YouTube Analytics Integration (v2.1)
**Domain:** YouTube Analytics API + data-aware AI script generation for existing Next.js local app
**Researched:** 2026-03-29
**Confidence:** HIGH

## Executive Summary

This milestone adds YouTube Analytics integration to an already-running Next.js scriptwriting app (v2.0). The existing app has script generation with 7 formats, a dual-track beat editor, anti-slop scoring, and a script library. The v2.1 addition closes the feedback loop: Pavlo can connect his YouTube channel via OAuth2, sync video metrics on demand, view retention curves alongside his scripts, and have the AI use past performance data as context during new script generation. The architecture decision is settled: use the `googleapis` npm package directly from Next.js server actions — not an MCP server. This keeps the integration simple, server-side, and consistent with patterns already established in the codebase.

The key innovation of v2.1 is a closed feedback loop that no existing scriptwriting tool provides. YouTube Studio shows metrics but has no concept of "script." Subscribr generates scripts from viral trends but does not track your own performance. This integration is the only one where script format, video metrics, and AI generation form a closed loop. The implementation scope is deliberately narrow: two new npm packages (`googleapis` + `recharts`), two new database tables, three new files, and modifications to three existing ones.

The most important risk is not technical — it is the temptation to have the AI draw strategic conclusions from 6 videos. With N=6, any detected pattern is noise dressed as signal. The AI prompt must explicitly forbid trend analysis; metrics are for specificity only (referencing actual numbers), not recommendations. A second significant risk is the OAuth 7-day token expiry in Google's "Testing" consent mode — this must be resolved at setup time by switching the consent screen to Production mode and creating fresh credentials. Discovering this a week into production use means a 30-minute fix on a broken app.

## Key Findings

### Recommended Stack

The entire milestone adds exactly two npm packages to the validated existing stack. `googleapis` (^171.4.0) is Google's official Node.js monorepo client — it provides typed access to both YouTube Data API v3 (listing channel videos) and YouTube Analytics API v2 (metrics and retention curves), and bundles `google-auth-library` with auto-refreshing OAuth2 support. Do not install `google-auth-library` separately — it is already a direct dependency of `googleapis` and installing it separately risks version conflicts. `recharts` (^3.8.1) provides React-native SVG charts for the retention curve visualization with full React 19 support.

**Core technologies:**
- `googleapis` ^171.4.0: YouTube Data API v3 + Analytics API v2 access — single package, fully typed, includes OAuth2 auto-refresh via bundled `google-auth-library`
- `recharts` ^3.8.1: Retention curve line charts — React component model fits existing architecture, React 19 compatible, zero configuration for basic line charts
- Existing stack unchanged: Next.js 16.2.1, React 19.2.4, TypeScript 5.x, Tailwind CSS 4.x, shadcn/ui v4, SQLite (better-sqlite3 12.8.0), Drizzle ORM 0.45.2, Claude Agent SDK 0.2.86, Zod 4.3.6

**What NOT to use:**
- `google-auth-library` (separate install) — already bundled in `googleapis`; separate install causes version conflicts
- `@googleapis/youtube` + `@googleapis/youtubeanalytics` (individual packages) — more boilerplate, same result; monorepo tree-shakes in production
- YouTube MCP servers (Python-based, 40+ tools) — designed for LLM agent access, not direct API calls from a web app; adds cross-language process management for zero benefit
- `node-cron` for scheduled sync — at 1 video/week, a "Sync Now" button is sufficient; auto-sync adds complexity without need
- `@tanstack/react-query` — metrics are fetched from YouTube API, stored in SQLite, then read from SQLite for display; no client-side API caching is needed
- SaaS analytics tools (VidIQ, TubeBuddy) — subscriptions, generic features, not integrated with scripts

### Expected Features

The feature set is organized around a hard dependency chain: OAuth connection enables video discovery, video discovery enables metrics fetch, metrics fetch enables dashboard display, and script-to-video linking enables data-aware generation. All P1 features form a complete end-to-end working loop. P2 features add depth once the loop is validated with real usage.

**Must have (P1 — table stakes, loop must work end-to-end):**
- YouTube OAuth connection flow — settings page, Google consent screen, token file storage; blocks everything else
- Video list auto-discovery — all channel videos appear after connecting, no manual entry
- Basic metrics per video — views, engaged views, likes, comments, subs gained, average view percentage; stored as time-series snapshots
- Retention curve per video — 100-point `audienceWatchRatio` data, displayed as sparkline; fetched per-video (API limitation, cannot be batched)
- Manual sync button with staleness indicator — "Sync Now" + last-synced timestamp, color-coded: green (<1h), yellow (<24h), red (>24h)
- Connection status indicator — disconnected / connected / expired states, visible at all times; non-blocking banner when token expires
- Script-to-video linking — manual dropdown on script page; automatic matching is unreliable (title differences, date gaps)
- Metrics display alongside scripts — mini cards in library view, detail panel in editor view
- Data-aware script generation — metrics injected into Claude prompt with explicit "small sample, do NOT draw conclusions" guardrail
- Metrics context toggle — checkbox on generation form to enable/disable injection; default on; lets Pavlo A/B test impact

**Should have (P2 — add after 3+ videos used with the feedback loop):**
- Format-to-performance mapping — which script formats correlate with which metrics; SQL join on existing data, no API calls
- Metrics trend sparklines — views/retention change across sync snapshots over time
- "Generate like my best video" — pre-fill generation form from highest-performing video (query + form pre-fill)
- Auto-sync on dashboard load when data is stale >24h

**Defer (v2.2+):**
- Retention curve overlay with beat timestamps — requires beat timing data that does not yet exist; HIGH complexity; unique concept but not ready
- AI content recommendations — harmful until 20+ videos; revisit with explicit "N=X, not statistically significant" disclaimer
- Demographic breakdowns — YouTube suppresses below undocumented thresholds; at 55 subscribers these queries return empty results
- Impressions/CTR as primary metrics — less meaningful signal for Shorts than `averageViewPercentage`

**Confirmed anti-features (do not build):**
"Viewed vs Swiped Away" metric (only in Studio UI, not in API); real-time streaming analytics (YouTube has 24-48h processing delay); multi-channel competitor comparison (demoralizing and actionless at 55 subs); full YouTube Studio replacement (100+ features, not the goal).

### Architecture Approach

The integration slots into existing patterns without introducing new layers or abstractions. A new `youtube-client.ts` service module wraps the `googleapis` OAuth2 client and API calls, following the same pattern as the existing `agent.ts`. Two new server action files handle OAuth flow and metrics sync. Two new Drizzle ORM tables extend the existing SQLite schema. The `agent.ts` AI service accepts one new optional parameter. Token storage uses a local JSON file (`data/.youtube-tokens.json`, gitignored) separate from the SQLite database — consistent with the single-user local tool nature of the app.

**Major components:**
1. `lib/youtube-client.ts` (NEW) — OAuth2 client singleton, token file read/write/isConnected check, `googleapis` wrappers for `listChannelVideos()`, `getVideoMetrics()`, `getRetentionData()`
2. `app/actions/youtube.ts` (NEW) — server actions for OAuth flow initiation and connection status
3. `app/actions/metrics.ts` (NEW) — server actions for `syncAllMetrics()` and per-video metrics queries
4. `app/api/youtube/callback/route.ts` (NEW) — OAuth2 redirect handler; only new API route in the app
5. `lib/metrics-query.ts` (NEW) — SQLite queries that format stored metrics as readable text for AI context injection
6. `lib/db/schema.ts` (MODIFIED) — adds `videos` table (youtubeId, title, publishedAt, scriptId FK) and `video_metrics` table (time-series snapshots with views, retention, subs)
7. `lib/agent.ts` (MODIFIED) — accepts optional `metricsContext` string, inserts it into prompt with small-sample guardrail
8. Dashboard UI: `components/metrics-card.tsx`, `components/retention-chart.tsx`, `components/metrics-dashboard.tsx`, `app/settings/page.tsx` (all NEW)

**Key data flows:**
- OAuth setup: user clicks Connect → consent URL generated → Google redirect → callback handler exchanges code for tokens → stored to file → settings page shows Connected
- Metrics sync: user clicks Sync → `listChannelVideos()` → upsert to `videos` table → `getVideoMetrics()` per video → INSERT snapshot to `video_metrics` → `getRetentionData()` per video → store 100-point array as JSON column
- Data-aware generation: `getMetricsContextForGeneration()` queries latest metrics per video joined with script format → formats as text string → passed to `agent.ts` → injected into Claude prompt with guardrail

### Critical Pitfalls

1. **OAuth 7-day token expiry in "Testing" mode** — Google refresh tokens expire after 7 days when the consent screen is in Testing status. Must switch to "In production" before first use AND create new OAuth credentials after switching (old credentials still produce 7-day tokens even after the switch). For personal Gmail, "Internal" user type is not available. Prevention: Production mode + new credentials on day one. Show clear "YouTube disconnected" banner with one-click reconnect when this happens.

2. **Using the wrong API (Data API v3 for analytics)** — YouTube Data API v3 returns video metadata and view/like counts but NOT retention curves, subscriber change, or watch percentage. Those are YouTube Analytics API (`youtubeAnalytics.reports.query`) only. Prevention: choose the correct API before designing the data layer. The data model is fundamentally different (date ranges, dimensions, filters) and cannot be patched in later.

3. **Retention curves require one API call per video** — the `audienceRetention` report does not support batch requests or multi-video filters. Must iterate per video. Cache in SQLite aggressively — historical retention data does not change. Never fetch all retention curves on page load. Prevention: design fetch layer for per-video iteration from the start; display basic metrics immediately while retention loads per-video.

4. **AI drawing conclusions from 6 videos** — LLMs are pattern-matching machines. Given N=6 data points they will confidently identify patterns that are pure noise. Prevention: prepend metrics context with explicit instructions: "small sample (N=6), do NOT make recommendations, do NOT identify trends, do NOT say 'your audience prefers X'." Test: shuffle metrics order in the context string and verify AI script output does not change directionally.

5. **Analytics data threshold suppression** — YouTube silently suppresses granular breakdowns (demographics, geography, traffic source) for small channels; the API returns empty or zero rows without an error. Prevention: only query dimensions that work reliably at this scale (`day`, `video`, `elapsedVideoTimeRatio`). Build UI to show "Not enough data yet" for empty responses, not zeros or errors.

## Implications for Roadmap

Based on the hard dependency chain in FEATURES.md and the build order in ARCHITECTURE.md, implementation splits into three sequential phases. No phase can be reordered — each depends on the previous.

### Phase 1: OAuth Foundation and Database Schema

**Rationale:** Everything else is blocked on this. Without OAuth tokens, no API calls work. Without the schema, no data can be stored. These two tracks (GCP setup + schema migration) can be built in parallel within the phase but must both complete before Phase 2 begins. This is also where the most critical pitfalls live — 7-day token expiry, wrong API choice, redirect URI mismatch — which are cheap to prevent at the start and expensive to fix in production.

**Delivers:** A connected YouTube channel with working OAuth2 flow, auto-refreshing tokens stored in `data/.youtube-tokens.json`, a `settings/page.tsx` with Connect/Disconnect UI, and the complete `videos` + `video_metrics` Drizzle schema migrated to SQLite. After this phase, running `syncAllMetrics()` from a REPL should work even before any dashboard UI exists.

**Addresses:** YouTube OAuth connection flow, connection status indicator
**Avoids:** 7-day token expiry (Production mode + new credentials on day one), redirect URI mismatch (both `localhost` and `127.0.0.1` registered in GCP, `http` not `https`), MCP security surface (no MCP server, direct googleapis)

**GCP checklist before writing code:**
- Enable YouTube Data API v3 AND YouTube Analytics API (both required)
- Set OAuth consent screen to External + "In production" status (not Testing)
- Create OAuth 2.0 Web Application credentials (NOT API key)
- Add `http://localhost:3000/api/youtube/callback` as authorized redirect URI
- Add own email as test user on consent screen

### Phase 2: Metrics Sync and Dashboard

**Rationale:** With OAuth working and schema in place, the next step is populating the database and making the data visible. The fetch layer must be designed correctly before any UI is built on top of it: basic metrics can be batched, retention must be fetched per-video and cached. Building the dashboard against real data from Pavlo's channel immediately surfaces API response format issues before they become hard-to-debug UI problems.

**Delivers:** A working "Sync Now" button that fetches all channel videos and their metrics into SQLite. A metrics dashboard showing per-video cards with views, retention %, and subs gained. A retention curve sparkline for each video. Script-to-video linking via dropdown in the script editor. Metrics mini-cards on the script library page. After this phase, Pavlo can see his YouTube performance data alongside his scripts.

**Addresses:** Video list auto-discovery, basic metrics per video, retention curve per video, manual sync button, connection status indicator, script-to-video linking, metrics display alongside scripts
**Avoids:** Batch retention anti-pattern (per-video with SQLite cache), data threshold suppression (graceful "No data" UI states), API calls on every page load (display always reads from SQLite, never directly from YouTube API)
**Uses:** `googleapis` (listChannelVideos, getVideoMetrics, getRetentionData), `recharts` (retention curve LineChart), Drizzle ORM (time-series INSERT and latest-per-video queries)

**Implementation order within the phase:**
1. `lib/youtube-client.ts` API methods
2. `app/actions/metrics.ts` sync logic
3. Dashboard components (metrics-card, retention-chart, metrics-dashboard)
4. Modify `app/scripts/page.tsx` (mini-cards) and `app/script/[id]/page.tsx` (detail panel)
5. Script-to-video linking (dropdown + FK write)

### Phase 3: Data-Aware Generation

**Rationale:** This phase is last because it requires Phase 2 to be complete: OAuth tokens must exist, videos must be in the database, scripts must be linked to videos, and metrics must be stored as snapshots. Only then does `getMetricsContextForGeneration()` have meaningful data to query. This is also the highest-risk phase for the AI over-interpreting small samples — prompt engineering is the primary deliverable, not the code changes.

**Delivers:** Script generation that uses real channel performance data as context, with a toggle checkbox to enable/disable. The AI references actual view counts and retention percentages in script framing without making strategic recommendations. After this phase, Pavlo can generate a script and the AI will naturally say "your last video got 8.7K views" rather than generic opener lines.

**Addresses:** Data-aware script generation, metrics context toggle
**Avoids:** AI drawing conclusions from N=6 (explicit "do NOT make recommendations" instruction in prompt, tested by shuffling metrics order), full retention curve in prompt (send summarized key numbers only: peak retention %, drop-off point, average — not all 100 data points)

**Implementation:**
1. `lib/metrics-query.ts`: `getMetricsContextForGeneration()` — queries latest metrics per video joined with linked script format, returns formatted text string
2. Modify `lib/agent.ts`: add optional `metricsContext` parameter, insert metrics section with small-sample guardrail
3. Modify `app/actions/generate.ts`: call `getMetricsContextForGeneration()` when toggle is on, pass to agent
4. Add toggle checkbox to generation form UI
5. Test: generate WITH and WITHOUT metrics context; verify AI uses numbers but makes no recommendations
6. Test: shuffle metrics order; verify AI output does not change directionally

### Phase Ordering Rationale

- Phase 1 must come first: OAuth tokens and schema are unblockable prerequisites; every feature depends on them. The GCP configuration pitfalls (7-day expiry, wrong credentials) are cheapest to fix before any code exists.
- Phase 2 before Phase 3: `getMetricsContextForGeneration()` returns empty or misleading results if videos are not synced and linked to scripts. Building the AI integration before the data layer is populated would require mocking, then rebuilding.
- Script-to-video linking belongs in Phase 2, not Phase 3: it populates the FK that Phase 3's query depends on. Keeping linking in Phase 2 means Phase 3 can be built and tested against real linked data immediately.
- P2 features (format-to-performance mapping, trend sparklines, "generate like my best") are deferred until the core loop is validated with 3+ real videos. They require data volume that does not exist yet and should not block the primary feedback loop.

### Research Flags

Phases needing deeper research during planning:
- **Phase 1 (GCP OAuth Setup):** The 7-day token expiry issue has multiple solution paths depending on whether Pavlo has Google Workspace. Worth spending 15 minutes verifying the exact GCP console steps before coding. The Production mode switch requires creating new credentials — this step is easy to miss.
- **Phase 2 (Retention API format):** The exact response format for `audienceWatchRatio` + `elapsedVideoTimeRatio` should be verified with a real API call against Pavlo's channel before building the chart component. The 100-point array assumption holds for most videos but may vary for very short Shorts. Consider adding a one-off "verify API response" exploratory task at the start of Phase 2.

Phases with standard well-documented patterns (skip research-phase):
- **Phase 3 (Data-Aware Generation):** Injecting a context string into an existing `agent.ts` prompt follows a clear established pattern. The prompt engineering constraint is already specified. No novel patterns needed.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Only 2 new packages. Both are official/Google-maintained. `googleapis` is the canonical Node.js client. `recharts` has verified React 19 support. Existing stack is already validated in production. |
| Features | HIGH | Feature list is grounded in official YouTube Analytics API docs. Anti-features are backed by documented API limitations (retention batch restriction, data thresholds, "Viewed vs Swiped Away" API unavailability). Competitor analysis confirms unique feedback loop positioning. |
| Architecture | HIGH | No-MCP decision is well-justified against evaluated alternatives. Build order is dependency-accurate and matches existing codebase patterns precisely. Time-series schema is correct for the use case. |
| Pitfalls | HIGH | All critical pitfalls sourced from official Google documentation and confirmed community reports. 7-day token expiry is a widely reported real problem with documented fix. No speculative pitfalls included. |

**Overall confidence:** HIGH

### Gaps to Address

- **Brand Account channel listing:** Pavlo's YouTube channel is under a Brand Account. The `search.list` API with `forMine: true` may behave differently for Brand Accounts vs personal channels — sometimes requires listing managed channels first via `channels.list` with `managedByMe: true`. Verify which channel ID is returned during Phase 1 API testing and confirm it matches the devlog channel before building the video discovery logic.

- **Retention curve point count for short Shorts:** The `audienceWatchRatio` API returns 100 evenly-spaced points for most videos. For a 30-second Short, this is ~0.3s per point. Whether YouTube actually returns 100 points for very short content needs to be verified with a real API call. Handle fewer-than-100-points gracefully in the schema (column is `text` JSON array) and in the chart component (ResponsiveContainer handles variable length).

- **`engagedViews` for pre-March-2025 videos:** The `engagedViews` metric was added for Shorts in March 2025. Pavlo's existing 6 videos — depending on their publish dates — may have null `engagedViews`. Schema column should be nullable; UI should display "N/A" not zero for this metric on older videos.

- **Google Workspace vs personal Gmail:** If Pavlo has Google Workspace (even a paid personal account), the "Internal" user type on the OAuth consent screen eliminates the 7-day token expiry entirely with no verification required. Worth a 30-second check before creating the consent screen.

## Sources

### Primary (HIGH confidence)
- [googleapis npm](https://www.npmjs.com/package/googleapis) — v171.4.0, confirms bundled google-auth-library
- [googleapis GitHub package.json](https://github.com/googleapis/google-api-nodejs-client/blob/main/package.json) — google-auth-library as direct dependency, not peer
- [YouTube Analytics API metrics reference](https://developers.google.com/youtube/analytics/metrics) — available metrics, Shorts-specific notes, March 2025 changes
- [YouTube Analytics API channel reports](https://developers.google.com/youtube/analytics/channel_reports) — retention report format, per-video limitation
- [YouTube Analytics API data model](https://developers.google.com/youtube/analytics/data_model) — data thresholds for small channels
- [YouTube Analytics API sample requests](https://developers.google.com/youtube/analytics/sample-requests) — request format, dimensions, filters
- [YouTube Analytics API OAuth2 authorization](https://developers.google.com/youtube/reporting/guides/authorization) — required scopes, no API key support for Analytics
- [Google OAuth2 official docs](https://developers.google.com/identity/protocols/oauth2) — Testing vs Production mode, 7-day token expiry
- [recharts npm](https://www.npmjs.com/package/recharts) — v3.8.1, React 19 support confirmed
- [YouTube Analytics API revision history](https://developers.google.com/youtube/reporting/revision_history) — March 2025 Shorts metrics change

### Secondary (MEDIUM confidence)
- [jwz: YouTube OAuth API fuckery (Feb 2026)](https://www.jwz.org/blog/2026/02/youtube-oauth-api-fuckery/) — real-world confirmation of 7-day token expiry pain in practice
- [Nango: Google OAuth invalid_grant explained](https://www.nango.dev/blog/google-oauth-invalid-grant-token-has-been-expired-or-revoked) — root causes and recovery for invalid_grant errors
- [OAuth2 refresh token expiration discussion](https://discuss.google.dev/t/oauth2-refresh-token-expiration-and-youtube-api-v3/160874) — community confirmation of Testing mode behavior
- [Buffer: Creator's Guide to YouTube Shorts Analytics](https://buffer.com/resources/the-creators-guide-to-youtube-shorts-analytics/) — Shorts-specific metrics guidance
- [MCP Server Security Best Practices 2026](https://toolradar.com/blog/mcp-server-security-best-practices) — security rationale for not using third-party MCP servers

### Tertiary (LOW confidence — evaluated and rejected as architecture options)
- [pauling-ai/youtube-mcp-server](https://github.com/pauling-ai/youtube-mcp-server) — Python-based MCP server, reviewed and rejected
- [YouTube MCP Server Comparison 2026](https://www.ekamoira.com/blog/youtube-mcp-server-comparison-2026-which-one-should-you-use) — reference for what was rejected

---
*Research completed: 2026-03-29*
*Ready for roadmap: yes*
