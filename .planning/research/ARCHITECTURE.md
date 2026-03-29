# Architecture Research

**Domain:** YouTube Analytics integration into existing Next.js scriptwriting app
**Researched:** 2026-03-29
**Confidence:** HIGH

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                      Next.js App (existing)                      │
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────────────┐  │
│  │ Script Editor │  │ Script List  │  │ Metrics Dashboard     │  │
│  │  (existing)   │  │  (existing)  │  │  (NEW)                │  │
│  └──────┬───────┘  └──────┬───────┘  └───────────┬───────────┘  │
│         │                 │                       │              │
├─────────┴─────────────────┴───────────────────────┴──────────────┤
│                      Server Actions Layer                        │
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────────────┐  │
│  │ editor.ts    │  │ library.ts   │  │ metrics.ts (NEW)      │  │
│  │ generate.ts  │  │  (existing)  │  │ youtube.ts (NEW)      │  │
│  │ (MODIFIED)   │  │              │  │                       │  │
│  └──────┬───────┘  └──────┬───────┘  └───────────┬───────────┘  │
│         │                 │                       │              │
├─────────┴─────────────────┴───────────────────────┴──────────────┤
│                      Service Layer                               │
│                                                                  │
│  ┌──────────────┐  ┌───────────────────┐  ┌──────────────────┐  │
│  │ agent.ts     │  │ youtube-client.ts  │  │ metrics-query.ts │  │
│  │ (MODIFIED)   │  │ (NEW)             │  │ (NEW)            │  │
│  └──────┬───────┘  └─────────┬─────────┘  └────────┬─────────┘  │
│         │                    │                      │            │
├─────────┴────────────────────┴──────────────────────┴────────────┤
│                      Data Layer                                  │
│                                                                  │
│  ┌──────────────┐  ┌───────────────────┐  ┌──────────────────┐  │
│  │ scripts      │  │ videos (NEW)      │  │ video_metrics    │  │
│  │ beats        │  │                   │  │ (NEW)            │  │
│  │ (existing)   │  │                   │  │                  │  │
│  └──────────────┘  └───────────────────┘  └──────────────────┘  │
│                                                                  │
│                      SQLite + Drizzle ORM                        │
└──────────────────────┬───────────────────────────────────────────┘
                       │
        ┌──────────────┴──────────────┐
        │   Google OAuth2 Tokens      │
        │   (file-based, local-only)  │
        └──────────────┬──────────────┘
                       │
        ┌──────────────┴──────────────┐
        │   YouTube Analytics API     │
        │   YouTube Data API v3       │
        └─────────────────────────────┘
```

## Decision: Direct googleapis Client, Not MCP Server

**Recommendation:** Use the `googleapis` npm package directly from server actions. Do NOT use an MCP server for YouTube Analytics.

**Rationale:**

1. **MCP adds unnecessary indirection.** MCP servers are designed to give LLM agents access to tools. This app needs to fetch metrics on a schedule or button press and display them in a dashboard. That is a standard API call, not an agent tool invocation.

2. **Existing MCP servers are Python-based.** The best YouTube Analytics MCP server (pauling-ai/youtube-mcp-server) is Python + FastMCP. Running a Python subprocess from a Node.js/Next.js app adds cross-language complexity, process management, and debugging pain for zero architectural benefit.

3. **The googleapis npm package is mature.** `@googleapis/youtubeanalytics` provides typed access to `reports.query()` with built-in token refresh via `google-auth-library`. This is Google's officially maintained client. One `npm install` vs. managing a separate Python process.

4. **Data-aware generation only needs DB access.** The AI agent (Claude Agent SDK) already runs in Node.js. Feeding metrics into generation means querying SQLite for stored metrics and injecting them into the prompt string -- no MCP needed.

**When MCP would make sense (and does not here):**
- If Claude needed to dynamically query YouTube during generation (it does not -- metrics are fetched separately and stored)
- If multiple LLM agents needed YouTube access (single user, single agent)
- If the app were a Claude Desktop plugin (it is a Next.js web app)

**Confidence:** HIGH -- this matches the existing pattern where the app uses `googleapis` via server actions, same as any other API integration.

### Component Responsibilities

| Component | Responsibility | Status |
|-----------|----------------|--------|
| `youtube-client.ts` | OAuth2 flow, token storage/refresh, API wrapper for Analytics + Data API | NEW |
| `metrics.ts` (action) | Fetch/sync metrics, expose to UI components | NEW |
| `youtube.ts` (action) | OAuth setup flow, connection status check | NEW |
| `videos` table | Store video metadata (YouTube ID, title, publish date, linked script) | NEW |
| `video_metrics` table | Store time-series metrics snapshots per video | NEW |
| `agent.ts` | Generate scripts with optional metrics context injected into prompt | MODIFIED |
| `generate.ts` | Pass metrics context to agent when generating/regenerating | MODIFIED |
| Metrics Dashboard | Display per-video metrics cards alongside script library | NEW |

## Recommended Project Structure

New and modified files only (existing structure preserved):

```
web/src/
├── app/
│   ├── actions/
│   │   ├── editor.ts         # (existing, unchanged)
│   │   ├── generate.ts       # (MODIFIED: inject metrics context)
│   │   ├── library.ts        # (existing, unchanged)
│   │   ├── metrics.ts        # (NEW: sync metrics, get metrics for video)
│   │   └── youtube.ts        # (NEW: OAuth flow, connection status)
│   ├── scripts/page.tsx      # (MODIFIED: add metrics mini-cards)
│   ├── script/[id]/page.tsx  # (MODIFIED: show linked video metrics)
│   ├── settings/page.tsx     # (NEW: YouTube connection, OAuth setup)
│   └── api/
│       └── youtube/
│           └── callback/
│               └── route.ts  # (NEW: OAuth2 callback handler)
├── components/
│   ├── metrics-card.tsx      # (NEW: mini metrics display per video)
│   ├── metrics-dashboard.tsx # (NEW: overview of all video metrics)
│   ├── youtube-connect.tsx   # (NEW: OAuth connect button + status)
│   └── retention-chart.tsx   # (NEW: simple retention curve display)
├── lib/
│   ├── agent.ts              # (MODIFIED: accept metrics context param)
│   ├── youtube-client.ts     # (NEW: googleapis wrapper + token management)
│   ├── metrics-query.ts      # (NEW: SQLite queries for metrics data)
│   └── db/
│       ├── index.ts          # (existing, unchanged)
│       └── schema.ts         # (MODIFIED: add videos + video_metrics tables)
```

### Structure Rationale

- **youtube-client.ts in lib/:** Service layer, same pattern as `agent.ts`. Handles OAuth tokens and API calls. No UI logic.
- **metrics.ts + youtube.ts as separate actions:** Metrics actions (fetch/display data) are used frequently. YouTube actions (OAuth setup) are used once. Separate files keep imports clean.
- **api/youtube/callback/route.ts:** OAuth2 requires a redirect URI. This is the only API route needed. Google redirects here after consent, the handler exchanges code for tokens and stores them.
- **settings/page.tsx:** One-time OAuth setup lives separate from daily workflow pages.

## Architectural Patterns

### Pattern 1: File-Based OAuth Token Storage

**What:** Store OAuth2 refresh token in a local JSON file (`web/data/.youtube-tokens.json`), not in SQLite.
**When to use:** Single-user local-only apps where tokens are sensitive but don't need relational queries.
**Trade-offs:** Simpler than DB column, easy to gitignore, but does not survive if `data/` is wiped.

```typescript
// lib/youtube-client.ts
import { google } from "googleapis";
import fs from "fs";
import path from "path";

const TOKEN_PATH = path.join(process.cwd(), "data", ".youtube-tokens.json");
const SCOPES = [
  "https://www.googleapis.com/auth/yt-analytics.readonly",
  "https://www.googleapis.com/auth/youtube.readonly",
];

// OAuth2 client singleton
let oauth2Client: InstanceType<typeof google.auth.OAuth2> | null = null;

export function getOAuth2Client() {
  if (!oauth2Client) {
    oauth2Client = new google.auth.OAuth2(
      process.env.YOUTUBE_CLIENT_ID,
      process.env.YOUTUBE_CLIENT_SECRET,
      process.env.YOUTUBE_REDIRECT_URI // http://localhost:3000/api/youtube/callback
    );
    // Load stored tokens if they exist
    if (fs.existsSync(TOKEN_PATH)) {
      const tokens = JSON.parse(fs.readFileSync(TOKEN_PATH, "utf-8"));
      oauth2Client.setCredentials(tokens);
    }
  }
  return oauth2Client;
}

export function storeTokens(tokens: Record<string, unknown>) {
  fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokens, null, 2));
}

export function isConnected(): boolean {
  return fs.existsSync(TOKEN_PATH);
}
```

### Pattern 2: Time-Series Metrics Snapshots

**What:** Store metrics as dated snapshots, not overwritten values. Each sync creates a new row per video.
**When to use:** When you want to track how metrics change over time (views at 48h vs 7d vs 30d).
**Trade-offs:** More rows in SQLite, but enables trend analysis. At 1 video/week with daily syncs, this is ~365 rows/year -- trivial for SQLite.

```typescript
// In schema.ts (NEW tables)
export const videos = sqliteTable("videos", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  youtubeId: text("youtube_id").notNull().unique(),
  title: text("title").notNull(),
  publishedAt: integer("published_at", { mode: "timestamp" }),
  scriptId: integer("script_id").references(() => scripts.id),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const videoMetrics = sqliteTable("video_metrics", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  videoId: integer("video_id")
    .notNull()
    .references(() => videos.id, { onDelete: "cascade" }),
  fetchedAt: integer("fetched_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  views: integer("views").notNull().default(0),
  engagedViews: integer("engaged_views"),
  likes: integer("likes").default(0),
  comments: integer("comments").default(0),
  shares: integer("shares").default(0),
  subscribersGained: integer("subscribers_gained").default(0),
  subscribersLost: integer("subscribers_lost").default(0),
  averageViewPercentage: integer("average_view_percentage"), // 0-100
  averageViewDuration: integer("average_view_duration"),     // seconds
  // Retention curve as JSON array of percentages at each second
  retentionCurve: text("retention_curve", { mode: "json" })
    .$type<number[]>(),
});
```

### Pattern 3: Metrics Context Injection for Data-Aware Generation

**What:** When generating a new script, query the DB for recent video metrics and inject them as raw data into the Claude prompt. The AI sees numbers but does NOT make statistical conclusions (sample too small).
**When to use:** Exactly this project -- data-aware generation where AI uses patterns from metrics as context.
**Trade-offs:** Adds ~500 tokens to prompt. Worth it for contextual awareness. Must explicitly instruct AI not to over-generalize from 6-10 data points.

```typescript
// In agent.ts (MODIFIED generateScript)
export async function generateScript(
  format: string,
  devContext: string,
  metricsContext?: string  // NEW parameter
): Promise<ScriptOutput> {
  // ... existing code ...

  const metricsSection = metricsContext
    ? `\n=== RECENT VIDEO PERFORMANCE (raw data, small sample) ===
${metricsContext}

NOTE: This is a SMALL sample (under 20 videos). Use these numbers as
context about what Pavlo's audience responds to, but do NOT draw
statistical conclusions or say "your audience prefers X". Just let
the patterns inform your creative choices naturally.`
    : "";

  const prompt = `You are the devlog-scriptwriter...
${metricsSection}
... rest of existing prompt`;
}
```

```typescript
// In metrics-query.ts (NEW)
export function getMetricsContextForGeneration(): string {
  const db = getDb();
  // Get latest metrics snapshot per video, joined with video info
  const rows = db.select({
    title: videos.title,
    format: scripts.format,
    views: videoMetrics.views,
    avgViewPct: videoMetrics.averageViewPercentage,
    subsGained: videoMetrics.subscribersGained,
    publishedAt: videos.publishedAt,
  })
  .from(videoMetrics)
  // ... joins and ordering ...
  .all();

  return rows.map(r =>
    `- "${r.title}" (${r.format}): ${r.views} views, ${r.avgViewPct}% retained, +${r.subsGained} subs`
  ).join("\n");
}
```

## Data Flow

### OAuth2 Setup Flow (one-time)

```
User clicks "Connect YouTube" on Settings page
    ↓
youtube.ts action → getOAuth2Client() → generates consent URL
    ↓
Browser redirects to Google consent screen
    ↓
User approves → Google redirects to /api/youtube/callback?code=XXX
    ↓
route.ts handler → exchanges code for tokens → storeTokens() to file
    ↓
Redirects to /settings with success message
    ↓
Refresh token persists in data/.youtube-tokens.json
(auto-refreshes access token on each API call)
```

### Metrics Sync Flow (on-demand or periodic)

```
User clicks "Sync Metrics" button (or app loads dashboard)
    ↓
metrics.ts action: syncAllMetrics()
    ↓
youtube-client.ts: listChannelVideos()
  → YouTube Data API v3: channels.list + search.list
  → Returns video IDs, titles, publish dates
    ↓
For each video not in DB: INSERT into videos table
    ↓
youtube-client.ts: getVideoMetrics(videoId, startDate, endDate)
  → YouTube Analytics API: reports.query({
      ids: "channel==MINE",
      metrics: "views,engagedViews,likes,comments,shares,
               subscribersGained,subscribersLost,
               averageViewPercentage,averageViewDuration",
      filters: "video==VIDEO_ID",
      startDate, endDate
    })
    ↓
youtube-client.ts: getRetentionData(videoId)
  → YouTube Analytics API: reports.query({
      ids: "channel==MINE",
      metrics: "audienceWatchRatio",
      dimensions: "elapsedVideoTimeRatio",
      filters: "video==VIDEO_ID",
    })
    ↓
INSERT new row into video_metrics with timestamp
    ↓
UI refreshes with latest metrics
```

### Data-Aware Generation Flow

```
User clicks "Generate Script" (existing flow)
    ↓
generate.ts: generateNewScript()
    ↓
NEW: metrics-query.ts: getMetricsContextForGeneration()
  → SELECT latest metrics per video from SQLite
  → Format as readable text string
    ↓
agent.ts: generateScript(format, devContext, metricsContext)
  → Claude Agent SDK prompt now includes metrics section
  → AI uses patterns naturally without over-generalizing
    ↓
... existing flow continues (parse JSON, save to DB)
```

### Key Data Flows Summary

1. **OAuth setup:** One-time browser redirect flow, stores refresh token to file
2. **Metrics sync:** Button-triggered, fetches from YouTube API, writes snapshots to SQLite
3. **Metrics display:** Dashboard reads from SQLite, no API calls needed
4. **Data-aware generation:** Reads stored metrics from SQLite, injects into prompt text

## YouTube Analytics API: Available Metrics for Shorts

**Confidence:** HIGH -- verified against official Google documentation.

| Metric | API Name | What It Shows | Available for Shorts |
|--------|----------|---------------|---------------------|
| Views | `views` | Play/replay count (changed March 2025 for Shorts) | Yes |
| Engaged Views | `engagedViews` | Views past initial seconds (new metric, 2025) | Yes |
| Likes | `likes` | Like count | Yes |
| Comments | `comments` | Comment count | Yes |
| Shares | `shares` | Share count | Yes |
| Subs Gained | `subscribersGained` | New subscribers from this video | Yes |
| Subs Lost | `subscribersLost` | Unsubscribes from this video | Yes |
| Avg View % | `averageViewPercentage` | Percentage of video watched on average | Yes |
| Avg View Duration | `averageViewDuration` | Average seconds watched | Yes |
| Audience Watch Ratio | `audienceWatchRatio` | Per-segment retention curve | Yes |
| Relative Retention | `relativeRetentionPerformance` | 0-1 vs similar-length videos | Yes |

**Important API change (March 2025):** For Shorts, `views` now counts play+replay starts. The old behavior (engaged views only) moved to `engagedViews`. Both should be fetched and stored.

**Retention curve specifics:** `audienceWatchRatio` with `dimensions: "elapsedVideoTimeRatio"` returns an array of ratios at 100 evenly-spaced points through the video. Values can exceed 1.0 (rewatches). For a 30-second Short, each point represents ~0.3 seconds.

## OAuth2 Setup Requirements

**Google Cloud Console setup (one-time by Pavlo):**

1. Create project in Google Cloud Console
2. Enable YouTube Data API v3 + YouTube Analytics API
3. Configure OAuth consent screen (External, Testing mode -- up to 100 test users, no verification needed)
4. Create OAuth 2.0 Desktop/Web client credentials
5. Add `http://localhost:3000/api/youtube/callback` as authorized redirect URI
6. Store client ID and secret in `.env.local`

**Scopes needed:**

| Scope | Why |
|-------|-----|
| `yt-analytics.readonly` | Read analytics data (views, retention, etc.) |
| `youtube.readonly` | List channel videos (titles, IDs, publish dates) |

**Token lifecycle:**
- Access token: expires in 1 hour, auto-refreshed by `google-auth-library`
- Refresh token: long-lived, stored in `data/.youtube-tokens.json`
- If refresh token is revoked: user re-authorizes on Settings page
- Google's "Testing" consent screen: refresh tokens expire after 7 days. Once app is verified (or set to Internal if using Workspace), tokens persist indefinitely. For a local-only personal tool, Internal type is simplest if Pavlo has Google Workspace; otherwise Testing mode with periodic re-auth.

**Confidence on 7-day expiry:** MEDIUM -- Google documentation states test-mode tokens expire in 7 days, but behavior varies. If this is a problem, setting the app to "Internal" (Workspace accounts only) or going through verification (overkill for personal tool) resolves it. Alternatively, just re-auth weekly -- it takes 10 seconds.

## Script-to-Video Linking

Scripts and videos exist independently and need an explicit link. Two approaches:

**Recommended: Manual link via dropdown.** When viewing a script, Pavlo selects which YouTube video it became. This is reliable (no title-matching heuristics) and takes 2 seconds.

**Implementation:** The `videos` table has an optional `scriptId` column. A dropdown on the script editor page shows unlinked videos. Selecting one writes the `scriptId`.

**Why not automatic matching:** Script titles and YouTube video titles often differ. Matching by date is unreliable (script created days before upload). Manual linking is trivial at 1 video/week.

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| 1-20 videos | Current design. Manual sync button. Metrics snapshots in SQLite. |
| 20-50 videos | Add "last synced" timestamp, auto-sync on dashboard load if stale (>24h). Consider cron-like background sync via Next.js middleware or external scheduler. |
| 50+ videos | YouTube API quota (10,000 units/day) becomes relevant. Batch video metrics queries. Add pagination to dashboard. Still fine in SQLite. |

### Scaling Priorities

1. **First concern: API quotas.** YouTube Data API costs 1 unit per search.list call, 1 per channels.list. Analytics API reports.query costs 1 unit. At 6 videos with daily sync: ~12 units/day. 10,000 daily quota is nowhere near a concern at this scale.
2. **Second concern: Token expiry in test mode.** If Pavlo forgets to re-auth, metrics sync silently fails. The UI must clearly show connection status and time since last successful sync.

## Anti-Patterns

### Anti-Pattern 1: Using MCP as a Data Bridge

**What people do:** Set up a YouTube MCP server and have Claude call it during generation to fetch live metrics.
**Why it's wrong:** Adds latency (MCP roundtrip + YouTube API call) to every generation. Metrics don't change minute-to-minute. Generation becomes dependent on YouTube being reachable.
**Do this instead:** Fetch metrics on a separate schedule (sync button / periodic). Store in SQLite. Read from SQLite during generation. Decoupled, fast, offline-capable.

### Anti-Pattern 2: Storing Metrics as JSON Blobs per Script

**What people do:** Fetch metrics once and store them as a JSON column on the scripts table.
**Why it's wrong:** Metrics change over time. A video's 48-hour metrics differ from its 7-day metrics. Overwriting loses history. Storing on scripts table couples video performance to script records.
**Do this instead:** Separate `videos` and `video_metrics` tables. Time-series snapshots. Link scripts to videos via foreign key.

### Anti-Pattern 3: Having AI Analyze Metrics and Make Recommendations

**What people do:** Ask the AI to analyze 6 data points and say "your audience prefers X format."
**Why it's wrong:** 6-10 videos is not a statistically meaningful sample. AI will confidently state patterns that are noise. This erodes trust in the tool.
**Do this instead:** Inject raw metrics as context. Explicitly tell AI "small sample, do not draw conclusions." Let the AI's pattern recognition inform creative choices subconsciously, without it making explicit data claims. Revisit at 20+ videos.

### Anti-Pattern 4: Building a YouTube MCP Server from Scratch

**What people do:** Build a custom MCP server wrapping YouTube APIs "for future flexibility."
**Why it's wrong:** YAGNI. This is a single-user local app. The only consumer of YouTube data is the Next.js server actions and the Claude prompt. MCP adds protocol overhead, process management, and debugging complexity for zero benefit.
**Do this instead:** Direct `googleapis` import in `youtube-client.ts`. If MCP is ever needed (e.g., giving Claude Desktop direct YouTube access), it can wrap the same client later.

## Integration Points

### External Services

| Service | Integration Pattern | Key Gotchas |
|---------|---------------------|-------------|
| YouTube Analytics API | `googleapis` npm, OAuth2 with refresh token | Test-mode tokens expire in 7 days; `engagedViews` metric added 2025; retention curve via `audienceWatchRatio` + `elapsedVideoTimeRatio` dimension |
| YouTube Data API v3 | `googleapis` npm, same OAuth2 client | Needed to list channel videos (IDs, titles, publish dates); shares same auth tokens |
| Claude Agent SDK | `@anthropic-ai/claude-agent-sdk` (existing) | Modified to accept optional `metricsContext` string; no new dependencies |
| Google Cloud Console | Manual setup by Pavlo | OAuth consent screen, API enablement, credentials -- one-time setup documented in settings page |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| UI components <-> Server actions | React Server Components + `"use server"` actions (existing pattern) | Metrics dashboard follows same pattern as script library |
| Server actions <-> youtube-client.ts | Direct function import | Same as agent.ts pattern -- service functions called from actions |
| Server actions <-> SQLite | Drizzle ORM queries (existing pattern) | New tables follow same schema conventions (timestamps, json columns) |
| generate.ts <-> metrics-query.ts | Direct function import | Metrics context is a plain string, injected into prompt |
| OAuth callback route <-> youtube-client.ts | Import storeTokens function | Only API route in the app, handles Google redirect |

## Build Order (Dependency-Aware)

Based on component dependencies, suggested implementation order:

1. **Schema + Migration** -- `videos` and `video_metrics` tables. Everything else depends on this.
2. **youtube-client.ts** -- OAuth2 client, token storage, API wrappers. Depends on nothing except env vars.
3. **OAuth flow** -- Settings page + callback route. Depends on youtube-client.ts.
4. **Metrics sync** -- `metrics.ts` action + sync logic. Depends on youtube-client.ts + schema.
5. **Metrics display** -- Dashboard components + metrics cards. Depends on stored metrics in DB.
6. **Script-video linking** -- Dropdown on script editor. Depends on videos table populated.
7. **Data-aware generation** -- Modify agent.ts + generate.ts. Depends on metrics being in DB and scripts linked to videos.

Steps 1-2 can be done in parallel. Steps 3-4 depend on 1-2. Step 5 depends on 4. Steps 6-7 depend on 5. This ordering means each phase delivers visible value: after step 4, Pavlo can sync and see metrics in the DB (even before UI). After step 5, the dashboard works. After step 7, generation becomes data-aware.

## Environment Variables (NEW)

```
# .env.local (add to existing)
YOUTUBE_CLIENT_ID=...
YOUTUBE_CLIENT_SECRET=...
YOUTUBE_REDIRECT_URI=http://localhost:3000/api/youtube/callback
```

## Files to .gitignore (NEW)

```
# Add to existing .gitignore
web/data/.youtube-tokens.json
```

## Sources

- [YouTube Analytics API - Metrics Reference](https://developers.google.com/youtube/analytics/metrics) -- official metric definitions (HIGH confidence)
- [YouTube Analytics API - OAuth2 Authorization](https://developers.google.com/youtube/reporting/guides/authorization) -- auth requirements, no service accounts (HIGH confidence)
- [googleapis npm package](https://www.npmjs.com/package/googleapis) -- official Google Node.js client (HIGH confidence)
- [@googleapis/youtubeanalytics npm](https://www.npmjs.com/package/@googleapis/youtubeanalytics) -- typed YouTube Analytics client (HIGH confidence)
- [google-auth-library npm](https://www.npmjs.com/package/google-auth-library) -- OAuth2 with auto-refresh (HIGH confidence)
- [pauling-ai/youtube-mcp-server](https://github.com/pauling-ai/youtube-mcp-server) -- evaluated and rejected; Python-based, 40 tools, overkill (HIGH confidence)
- [YouTube API Guide 2026](https://zernio.com/blog/youtube-api) -- quota limits, setup walkthrough (MEDIUM confidence)
- [MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk) -- evaluated for MCP client approach, rejected (HIGH confidence)
- [YouTube Analytics API Revision History](https://developers.google.com/youtube/reporting/revision_history) -- March 2025 Shorts metrics change (HIGH confidence)

---
*Architecture research for: YouTube Analytics integration into Devlog Scriptwriter Pipeline*
*Researched: 2026-03-29*
