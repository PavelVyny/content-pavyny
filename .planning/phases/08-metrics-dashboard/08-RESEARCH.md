# Phase 8: Metrics & Dashboard - Research

**Researched:** 2026-03-29
**Domain:** YouTube Analytics sync engine, metrics display in scripts UI, retention charts, script-video linking
**Confidence:** HIGH

## Summary

Phase 8 builds the sync engine that fetches YouTube video data and metrics, displays them inline on the existing `/scripts` page via expandable rows, renders retention curves with recharts, and enables script-to-video linking on the editor page. The OAuth2 connection and database schema already exist from Phase 7 -- this phase adds the data-fetching methods to `youtube-client.ts`, creates server actions for sync operations, modifies `scripts-table.tsx` for expandable metric cards, and adds a video-linking dropdown to the script editor.

The main technical considerations are: (1) using `playlistItems.list` instead of `search.list` for video discovery (100x cheaper API quota), (2) fetching retention curves one-at-a-time per video (API limitation), (3) recharts sparkline pattern for inline retention display, and (4) careful modification of the existing scripts table to add expandable rows without breaking the current UX.

**Primary recommendation:** Build in order: youtube-client sync methods, server actions for sync, scripts page sync UI (button + staleness), expandable metrics cards in table, retention chart components, then video linking dropdown on editor page. Each layer depends on the previous.

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** No new page. Metrics extend the existing `/scripts` page. No new nav link needed.
- **D-02:** Each script row in the table gets an expandable metrics card below it. Click chevron to expand, click again to collapse.
- **D-03:** Replace the existing copy-to-clipboard action button with a chevron (down/up) expand/collapse toggle. Chevron is an arrow without tail (pure triangle/caret).
- **D-04:** Expanded card shows: views, retention %, subs gained, likes, comments, and a retention sparkline. Only visible for scripts linked to a video.
- **D-05:** "Sync Now" button lives on the `/scripts` page (not settings). Near the top, next to the staleness indicator.
- **D-06:** Sync progress shows count: "Syncing 3/6 videos..." with a progress indicator. Not just a spinner.
- **D-07:** Staleness indicator: green (<1h), yellow (<24h), red (>24h). Shows "Last synced: X ago" text.
- **D-08:** Sync button disabled while already syncing. Error state shows brief message, doesn't block the page.
- **D-09:** Small sparkline (~100px wide) inside the expanded metrics card. Shows the retention curve shape at a glance.
- **D-10:** Click sparkline to expand to full-size chart (full card width). X-axis = video %, Y-axis = retention %.
- **D-11:** Use recharts `<LineChart>` / `<ResponsiveContainer>` for both sparkline and expanded views.
- **D-12:** Link/unlink dropdown on the script editor page (`/script/[id]`), not on the scripts list.
- **D-13:** Dropdown shows unlinked YouTube videos (title + publish date). Selecting one creates the link (sets `scriptId` FK on videos table).
- **D-14:** Unlink option available when already linked. Unlink sets `scriptId` to null.

### Claude's Discretion
- Sync implementation details: how youtube-client.ts methods are structured for batch video fetch + per-video metrics
- API call ordering: batch basic metrics first, then per-video retention curves
- Expanded card layout and spacing within the scripts table
- Error handling patterns for API failures during sync

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope.

</user_constraints>

<phase_requirements>

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| SYNC-01 | User can click "Sync Now" to fetch all channel videos and metrics | Server action `syncMetrics()` calls youtube-client methods; button on scripts page with progress state |
| SYNC-02 | Video list auto-discovered from channel (no manual entry) | `channels.list` for uploads playlist ID, then `playlistItems.list` for video IDs (1 quota unit vs 100 for search.list) |
| SYNC-03 | Basic metrics fetched per video (views, likes, comments, subs gained, avg view %) | YouTube Analytics API `reports.query` with `dimensions=video`, single call for all videos |
| SYNC-04 | Retention curve fetched per video (100-point audienceWatchRatio) | Per-video `reports.query` with `dimensions=elapsedVideoTimeRatio`; must iterate one-at-a-time (API limitation) |
| SYNC-05 | Sync staleness indicator (green <1h, yellow <24h, red >24h) | Compute from `lastSyncedAt` in videoMetrics table; display as colored badge with relative time text |
| DASH-01 | Per-video metrics cards in dashboard view (views, retention %, subs gained) | Expandable row below each script in scripts-table.tsx; data from videoMetrics table via Drizzle join |
| DASH-02 | Retention curve chart per video (line chart with recharts) | recharts `<LineChart>` sparkline (100px, no axes) + expanded view (full width, with axes) |
| DASH-03 | Metrics mini-cards on script library page (for linked videos) | Expandable card shows metrics when script has a linked video via `videos.scriptId` FK |
| DASH-04 | Metrics detail panel on script editor page (when script linked to video) | Read videoMetrics for linked video, display in a Card component below the back link |
| LINK-01 | User can link a script to a YouTube video via dropdown selector | shadcn/ui Select on `/script/[id]` page; lists unlinked videos; updates `videos.scriptId` |
| LINK-02 | User can unlink a script from a video | Same dropdown with unlink option; sets `videos.scriptId` to null |

</phase_requirements>

## Project Constraints (from CLAUDE.md)

- Communicate with Pavlo in Russian; scripts in English
- Anti-slop is the primary quality gate (not directly relevant to this phase but do not break existing pipeline)
- App is desktop-only, localhost-only, light theme
- GSD workflow enforcement
- **web/AGENTS.md warning:** "This is NOT the Next.js you know" -- read `node_modules/next/dist/docs/` before writing code. Next.js 16 may have breaking changes from training data.
- shadcn/ui v4 uses `@base-ui/react` (not `@radix-ui`); Select component already installed

## Standard Stack

### Core (NEW for this phase)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `recharts` | 3.8.1 | Retention curve sparkline + expanded chart | Decision D-11 locks recharts. Mature React charting library. SVG-based, tree-shakeable. Only dependency needed for charts. |

### Already Installed (used in this phase)

| Library | Purpose in Phase 8 |
|---------|---------------------|
| `googleapis` 171.4.0 | YouTube Data API v3 (video listing) + YouTube Analytics API (metrics, retention) |
| `drizzle-orm` 0.45.2 | Query videos + videoMetrics tables (schema from Phase 7) |
| `better-sqlite3` 12.8.0 | SQLite engine |
| shadcn/ui Select (`@base-ui/react`) | Video linking dropdown on editor page |
| shadcn/ui Card, Badge, Button | Metrics card UI, staleness badge, sync button |
| `lucide-react` | ChevronDown/ChevronUp icons for expandable rows |
| `sonner` | Toast notifications for sync success/error |

### NOT Needed This Phase

| Library | Why Not |
|---------|---------|
| `@tanstack/react-query` | No client-side caching needed. Server actions read from SQLite. Sync is manual, not polling. |
| `react-sparklines` | recharts handles sparklines natively with a minimal `<LineChart>` (no axes, small size). No extra library. |
| `date-fns` / `dayjs` | Staleness computation is simple subtraction (`Date.now() - lastSyncedAt`). Use Intl.RelativeTimeFormat for "X ago" text. |

### Installation

```bash
cd web
npm install recharts
```

**Version verified:** `npm view recharts version` returns 3.8.1 (checked 2026-03-29).

## Architecture Patterns

### Recommended Project Structure (new/modified files)

```
src/
  app/
    actions/
      metrics.ts              # NEW: syncMetrics, getScriptsWithMetrics, linkVideo, unlinkVideo
    scripts/page.tsx           # MODIFIED: pass metrics data + sync state to ScriptsTable
    script/[id]/page.tsx       # MODIFIED: query linked video, pass metrics + unlinked videos
  components/
    scripts-table.tsx          # MODIFIED: expandable rows with chevron, metrics cards
    metrics-card.tsx           # NEW: expanded metrics display (views, retention, subs, etc.)
    retention-chart.tsx        # NEW: sparkline + expanded recharts LineChart
    video-link-selector.tsx    # NEW: dropdown for linking/unlinking video on editor page
    sync-button.tsx            # NEW: "Sync Now" button with progress + staleness indicator
  lib/
    youtube-client.ts          # MODIFIED: add listChannelVideos, getVideoMetrics, getRetentionData
```

### Pattern 1: Video Discovery via Uploads Playlist (NOT search.list)

**What:** Use `channels.list` to get the uploads playlist ID, then `playlistItems.list` to get all video IDs.
**Why:** `search.list` costs 100 quota units per call. `playlistItems.list` costs 1 unit. At 6 videos, this is 1 API call vs 1, but at 50+ videos with pagination, the savings are massive.

```typescript
// In youtube-client.ts
export async function listChannelVideos() {
  const client = getOAuth2Client();
  const youtube = google.youtube("v3");

  // Step 1: Get uploads playlist ID (1 quota unit)
  const channelResponse = await youtube.channels.list({
    auth: client,
    part: ["contentDetails"],
    mine: true,
  });
  const uploadsPlaylistId =
    channelResponse.data.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;
  if (!uploadsPlaylistId) return [];

  // Step 2: Get all videos from uploads playlist (1 quota unit per 50 videos)
  const videos: Array<{
    youtubeId: string;
    title: string;
    description: string;
    thumbnailUrl: string;
    publishedAt: string;
  }> = [];

  let pageToken: string | undefined;
  do {
    const response = await youtube.playlistItems.list({
      auth: client,
      part: ["snippet"],
      playlistId: uploadsPlaylistId,
      maxResults: 50,
      pageToken,
    });

    for (const item of response.data.items ?? []) {
      videos.push({
        youtubeId: item.snippet?.resourceId?.videoId ?? "",
        title: item.snippet?.title ?? "",
        description: item.snippet?.description ?? "",
        thumbnailUrl: item.snippet?.thumbnails?.medium?.url ?? "",
        publishedAt: item.snippet?.publishedAt ?? "",
      });
    }

    pageToken = response.data.nextPageToken ?? undefined;
  } while (pageToken);

  return videos;
}
```

**Quota cost:** 1 unit (channels.list) + 1 unit per 50 videos (playlistItems.list) = 2 units total for 6 videos.

### Pattern 2: Batch Basic Metrics via Analytics API

**What:** Fetch basic metrics for ALL videos in a single Analytics API call using `dimensions=video`.
**Why:** One API call returns views, likes, comments, subscribersGained, averageViewPercentage for all videos at once. No need to iterate per-video for basic metrics.

```typescript
// In youtube-client.ts
export async function getVideoMetrics(videoIds: string[], channelStartDate: string) {
  const client = getOAuth2Client();
  const analytics = google.youtubeAnalytics("v2");

  const today = new Date().toISOString().split("T")[0];

  const response = await analytics.reports.query({
    auth: client,
    ids: "channel==MINE",
    startDate: channelStartDate, // e.g., "2024-01-01"
    endDate: today,
    dimensions: "video",
    metrics: "views,likes,comments,shares,subscribersGained,subscribersLost,averageViewPercentage,averageViewDuration,engagedViews",
    filters: `video==${videoIds.join(",")}`, // Comma-separated video IDs
    sort: "-views",
  });

  // response.data.rows is an array of arrays:
  // [[videoId, views, likes, comments, shares, subsGained, subsLost, avgViewPct, avgViewDuration, engagedViews], ...]
  return response.data.rows ?? [];
}
```

**Important:** The `filters` parameter for the video dimension DOES support comma-separated video IDs in the `dimensions=video` report. This is different from the retention report which requires a single video ID.

### Pattern 3: Per-Video Retention Curve

**What:** Fetch `audienceWatchRatio` with `dimensions=elapsedVideoTimeRatio` for each video individually.
**Why:** The YouTube Analytics API does NOT support batch retention queries. One video at a time only. This is an API limitation, not a design choice.

```typescript
// In youtube-client.ts
export async function getRetentionData(videoId: string, channelStartDate: string) {
  const client = getOAuth2Client();
  const analytics = google.youtubeAnalytics("v2");

  const today = new Date().toISOString().split("T")[0];

  const response = await analytics.reports.query({
    auth: client,
    ids: "channel==MINE",
    startDate: channelStartDate,
    endDate: today,
    dimensions: "elapsedVideoTimeRatio",
    metrics: "audienceWatchRatio,relativeRetentionPerformance",
    filters: `video==${videoId};audienceType==ORGANIC`,
    maxResults: 200,
  });

  // Returns 100 rows: [[0.01, watchRatio, relativeRetention], [0.02, ...], ...]
  // watchRatio can exceed 1.0 (rewatches)
  const retentionCurve = (response.data.rows ?? []).map(
    (row: (string | number)[]) => Number(row[1]) // audienceWatchRatio
  );

  return retentionCurve;
}
```

**Key detail:** `maxResults` must be set to 200 or less for retention reports. The response returns ~100 data points (one per 1% of video duration).

### Pattern 4: Sync Flow with Progress Reporting

**What:** The sync server action iterates through videos, updating progress state that the client can poll.
**Why:** Decision D-06 requires "Syncing 3/6 videos..." progress, not just a spinner.

**Recommended approach:** Since this is a server action (not streaming), use a pragmatic pattern:
1. Server action fetches video list, then iterates through metrics + retention
2. Return the complete result when done
3. The client shows "Syncing..." state with a simple count that increments via intermediate `revalidatePath` calls, OR accept the simpler approach of showing "Syncing..." with a spinner during the action, then showing the count on completion

**Simpler alternative (recommended for v1):** Since there are only 6 videos and sync takes 2-5 seconds total, show "Syncing..." → "Synced 6 videos" on completion. Progress count is nice-to-have but adds complexity. If the user decides this is insufficient, add streaming progress in a follow-up.

**For true progress:** Use Server-Sent Events (SSE) via a route handler at `api/sync/route.ts` that streams progress events. The client reads via `EventSource`. This is more complex but gives real-time "Syncing 3/6 videos..." updates.

### Pattern 5: Expandable Table Rows

**What:** Modify `scripts-table.tsx` to add a collapsible row below each script row. Chevron replaces the copy button.

```tsx
// In scripts-table.tsx
const [expandedId, setExpandedId] = useState<number | null>(null);

// In the table body:
{scripts.map((script) => (
  <React.Fragment key={script.id}>
    <tr className="border-b hover:bg-zinc-50">
      {/* ... existing columns ... */}
      <td className="py-3 px-2">
        {script.linkedVideo ? (
          <button
            onClick={() => setExpandedId(expandedId === script.id ? null : script.id)}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            {expandedId === script.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        ) : (
          <span className="text-muted-foreground text-xs">No video</span>
        )}
      </td>
    </tr>
    {expandedId === script.id && script.linkedVideo && (
      <tr>
        <td colSpan={6} className="py-3 px-2 bg-zinc-50/50">
          <MetricsCard metrics={script.linkedVideo.metrics} />
        </td>
      </tr>
    )}
  </React.Fragment>
))}
```

**Note:** ChevronDown/ChevronUp from `lucide-react` are the correct icons. Decision D-03 says "pure triangle/caret" but lucide's ChevronDown is a standard downward-pointing angle bracket (caret shape) without a tail, which matches the intent.

### Pattern 6: Recharts Sparkline

**What:** Small 100px-wide retention curve with no axes, labels, or grid. Just the line shape.

```tsx
// In retention-chart.tsx
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

interface RetentionChartProps {
  data: number[]; // 100-point retention curve
  expanded?: boolean;
}

export function RetentionChart({ data, expanded = false }: RetentionChartProps) {
  const chartData = data.map((value, index) => ({
    pct: index,
    retention: value,
  }));

  if (!expanded) {
    // Sparkline: small, no axes, no labels
    return (
      <div className="w-[100px] h-[32px] cursor-pointer">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <Line
              type="monotone"
              dataKey="retention"
              stroke="#3b82f6"
              strokeWidth={1.5}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    );
  }

  // Expanded: full width with axes
  return (
    <div className="w-full h-[200px]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="pct"
            tickFormatter={(v: number) => `${v}%`}
            tick={{ fontSize: 11 }}
          />
          <YAxis
            tickFormatter={(v: number) => `${Math.round(v * 100)}%`}
            tick={{ fontSize: 11 }}
            domain={[0, "auto"]}
          />
          <Tooltip
            formatter={(value: number) => `${Math.round(value * 100)}%`}
            labelFormatter={(label: number) => `${label}% of video`}
          />
          <Line
            type="monotone"
            dataKey="retention"
            stroke="#3b82f6"
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
```

**Key detail:** `audienceWatchRatio` values can exceed 1.0 (rewatches). The Y-axis domain should be `[0, "auto"]` to handle this. For sparkline display, this is fine -- the shape matters, not the absolute values.

### Pattern 7: Video Link Selector

**What:** shadcn/ui Select on the script editor page showing unlinked videos. Selecting links the video to the script.

```tsx
// In video-link-selector.tsx
"use client";

import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";

interface Video {
  id: number;
  youtubeId: string;
  title: string;
  publishedAt: Date | null;
}

interface VideoLinkSelectorProps {
  scriptId: number;
  linkedVideo: Video | null;
  unlinkedVideos: Video[];
  onLink: (videoId: number) => void;
  onUnlink: () => void;
}
```

**Note:** The shadcn/ui v4 Select uses `@base-ui/react` internally, NOT `@radix-ui/react-select`. The component is already installed and follows Base UI patterns.

### Anti-Patterns to Avoid

- **Do NOT use `search.list` for video discovery.** It costs 100 quota units per call. Use `playlistItems.list` (1 unit).
- **Do NOT try to batch retention curve requests.** The API requires one video per request. Iterate.
- **Do NOT fetch metrics on every page load.** Read from SQLite. Only fetch from YouTube API on manual "Sync Now" click.
- **Do NOT install `react-sparklines` or any additional charting library.** recharts handles sparklines natively.
- **Do NOT create a separate `/dashboard` or `/metrics` page.** Decision D-01 locks metrics to the `/scripts` page.
- **Do NOT put the video linking dropdown on the scripts list page.** Decision D-12 says it goes on the editor page (`/script/[id]`).

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Retention curve rendering | Canvas-based custom chart | recharts `<LineChart>` with sparkline config | SVG, responsive, tooltip support out of box |
| Relative time display ("2 hours ago") | Custom date math + string formatting | `Intl.RelativeTimeFormat` (built-in) | Native browser API, no dependency, handles i18n |
| Video list pagination | Manual nextPageToken loop with fetch | `google.youtube("v3").playlistItems.list()` with pageToken | Typed responses, auto-parsing, error handling |
| YouTube API authentication per request | Manual header injection | `auth: client` parameter on googleapis calls | Auto-refresh, token management, error codes |
| Expandable table rows | Custom accordion component | HTML `<tr>` with colSpan + React state toggle | Simple pattern, no extra component needed |

## Common Pitfalls

### Pitfall 1: Using search.list Instead of playlistItems.list

**What goes wrong:** Video discovery consumes 100 quota units per call instead of 1. At scale, this eats the 10,000 daily quota quickly.
**Why it happens:** Most YouTube API tutorials show `search.list` as the primary way to find videos. `playlistItems.list` via uploads playlist is less well-known.
**How to avoid:** Use the two-step pattern: `channels.list({ part: ["contentDetails"], mine: true })` to get uploads playlist ID, then `playlistItems.list({ playlistId })` for video IDs.
**Warning signs:** High quota usage warnings in GCP console; quota exceeded errors.

### Pitfall 2: Retention Curve Returns Empty for New/Very Low-View Videos

**What goes wrong:** `audienceWatchRatio` report returns empty rows for videos with very few views. The chart shows nothing.
**Why it happens:** YouTube suppresses retention data below an undocumented view threshold. Videos with <100 views may have partial or no retention data.
**How to avoid:** Handle empty retention arrays gracefully. Show "Not enough data yet" text instead of an empty chart. Only show the sparkline when retention data has 10+ points.
**Warning signs:** Retention curve array is empty or has fewer than 100 points.

### Pitfall 3: Analytics API Requires startDate and endDate (No "All Time")

**What goes wrong:** Developer omits date range or uses invalid format. API returns error.
**Why it happens:** The Analytics API has no "all time" option. Every `reports.query` requires explicit `startDate` and `endDate` in `YYYY-MM-DD` format.
**How to avoid:** Use the channel creation date (or a known early date like "2024-01-01") as startDate. Use today's date as endDate. Store the startDate as a config value to avoid hardcoding.
**Warning signs:** API error mentioning missing or invalid date parameters.

### Pitfall 4: Stale SQLite Data After Sync

**What goes wrong:** Sync writes new metrics to SQLite, but the scripts page still shows old data because `revalidatePath` was not called.
**Why it happens:** Next.js caches server component renders. After a server action mutates data, the UI does not automatically re-render unless the path is revalidated.
**How to avoid:** Call `revalidatePath("/scripts")` at the end of the sync server action. This is the established pattern from Phase 7.
**Warning signs:** Sync completes successfully but metrics do not update on the page until manual browser refresh.

### Pitfall 5: Overwriting Metrics Instead of Upserting

**What goes wrong:** Sync inserts a new `video_metrics` row but the `videoId` unique constraint throws an error because a row already exists.
**Why it happens:** Decision D-11 specifies one row per video (overwritten on sync). INSERT alone will fail on second sync.
**How to avoid:** Use Drizzle's `.onConflictDoUpdate()` (upsert) on the `videoId` column. This matches the "latest aggregates per video" design.

```typescript
db.insert(videoMetrics)
  .values({ videoId, views, likes, ... })
  .onConflictDoUpdate({
    target: videoMetrics.videoId,
    set: { views, likes, ..., lastSyncedAt: new Date() },
  })
  .run();
```

**Warning signs:** "UNIQUE constraint failed" error in console after second sync.

### Pitfall 6: ChevronDown Replacing Copy Button Loses Functionality

**What goes wrong:** The copy-to-clipboard action is removed but users still need it.
**Why it happens:** Decision D-03 says replace the copy button with a chevron. But copy-to-clipboard (LIBR-03) was a v2.0 requirement.
**How to avoid:** Move the copy action into the expanded metrics card or make it available via another UI element (e.g., on the editor page where the full script is visible). The chevron replaces the BUTTON, but the copy FUNCTIONALITY should remain accessible somewhere.
**Warning signs:** Users ask "where did copy go?"

## Code Examples

### Server Action: syncMetrics

```typescript
// app/actions/metrics.ts
"use server";

import { revalidatePath } from "next/cache";
import { getDb } from "@/lib/db";
import { videos, videoMetrics } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import {
  listChannelVideos,
  getVideoMetrics,
  getRetentionData,
} from "@/lib/youtube-client";

export async function syncMetrics(): Promise<{
  success: boolean;
  videoCount: number;
  error?: string;
}> {
  try {
    const db = getDb();

    // Step 1: Discover videos from channel
    const channelVideos = await listChannelVideos();

    // Step 2: Upsert videos into DB
    for (const v of channelVideos) {
      db.insert(videos)
        .values({
          youtubeId: v.youtubeId,
          title: v.title,
          description: v.description,
          thumbnailUrl: v.thumbnailUrl,
          publishedAt: new Date(v.publishedAt),
        })
        .onConflictDoUpdate({
          target: videos.youtubeId,
          set: { title: v.title, updatedAt: new Date() },
        })
        .run();
    }

    // Step 3: Fetch basic metrics (batch for all videos)
    const videoIds = channelVideos.map((v) => v.youtubeId);
    const metricsRows = await getVideoMetrics(videoIds, "2024-01-01");

    // Step 4: For each video, upsert metrics + fetch retention
    for (const row of metricsRows) {
      const youtubeId = row[0] as string;
      const dbVideo = db
        .select()
        .from(videos)
        .where(eq(videos.youtubeId, youtubeId))
        .get();
      if (!dbVideo) continue;

      const retention = await getRetentionData(youtubeId, "2024-01-01");

      db.insert(videoMetrics)
        .values({
          videoId: dbVideo.id,
          views: Number(row[1]),
          likes: Number(row[2]),
          comments: Number(row[3]),
          shares: Number(row[4]),
          subscribersGained: Number(row[5]),
          subscribersLost: Number(row[6]),
          averageViewPercentage: Number(row[7]),
          averageViewDuration: Number(row[8]),
          engagedViews: Number(row[9]),
          retentionCurve: retention,
          lastSyncedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: videoMetrics.videoId,
          set: {
            views: Number(row[1]),
            likes: Number(row[2]),
            comments: Number(row[3]),
            shares: Number(row[4]),
            subscribersGained: Number(row[5]),
            subscribersLost: Number(row[6]),
            averageViewPercentage: Number(row[7]),
            averageViewDuration: Number(row[8]),
            engagedViews: Number(row[9]),
            retentionCurve: retention,
            lastSyncedAt: new Date(),
          },
        })
        .run();
    }

    revalidatePath("/scripts");
    return { success: true, videoCount: channelVideos.length };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Sync failed";
    return { success: false, videoCount: 0, error: message };
  }
}
```

### Data Query: Scripts with Linked Video Metrics

```typescript
// In app/actions/metrics.ts
export async function getScriptsWithMetrics() {
  const db = getDb();

  // Get all scripts with their linked video metrics
  const rows = db
    .select({
      script: scripts,
      video: videos,
      metrics: videoMetrics,
    })
    .from(scripts)
    .leftJoin(videos, eq(videos.scriptId, scripts.id))
    .leftJoin(videoMetrics, eq(videoMetrics.videoId, videos.id))
    .where(ne(scripts.status, "generating"))
    .orderBy(desc(scripts.createdAt))
    .all();

  return rows;
}
```

### Staleness Calculation

```typescript
// Utility for staleness indicator
function getStaleness(lastSyncedAt: Date | null): {
  color: "green" | "yellow" | "red";
  text: string;
} {
  if (!lastSyncedAt) return { color: "red", text: "Never synced" };

  const ageMs = Date.now() - lastSyncedAt.getTime();
  const hours = ageMs / (1000 * 60 * 60);

  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
  let text: string;
  if (hours < 1) {
    text = rtf.format(-Math.round(hours * 60), "minute");
  } else if (hours < 24) {
    text = rtf.format(-Math.round(hours), "hour");
  } else {
    text = rtf.format(-Math.round(hours / 24), "day");
  }

  return {
    color: hours < 1 ? "green" : hours < 24 ? "yellow" : "red",
    text: `Last synced ${text}`,
  };
}
```

## YouTube Analytics API Call Reference

| Purpose | API | Method | Quota | Notes |
|---------|-----|--------|-------|-------|
| Get uploads playlist ID | Data API v3 | `channels.list({ part: ["contentDetails"], mine: true })` | 1 unit | Returns `relatedPlaylists.uploads` |
| List all videos | Data API v3 | `playlistItems.list({ playlistId, part: ["snippet"], maxResults: 50 })` | 1 unit/page | Paginated, 50 per page |
| Basic metrics (all videos) | Analytics API v2 | `reports.query({ dimensions: "video", metrics: "views,likes,...", filters: "video==ID1,ID2,..." })` | 1 unit | Batch all videos in one call |
| Retention curve (per video) | Analytics API v2 | `reports.query({ dimensions: "elapsedVideoTimeRatio", metrics: "audienceWatchRatio", filters: "video==ID" })` | 1 unit | ONE video per request |

**Total quota per sync (6 videos):** 1 (channels) + 1 (playlistItems) + 1 (batch metrics) + 6 (retention per video) = 9 units. Daily limit: 10,000 units.

## Existing Codebase Integration Points

### scripts-table.tsx Changes

Current state: Table with columns (Title, Format, Created, Status, Score, Actions). Actions column has a "Copy" button.

Required changes:
1. Replace "Copy" button in Actions column with ChevronDown/ChevronUp toggle
2. Add expandable `<tr>` below each row with `colSpan={6}` for metrics card
3. Component receives scripts WITH linked video metrics data (not just Script[])
4. Only show chevron when script has a linked video with metrics

### scripts/page.tsx Changes

Current state: Fetches all scripts via `getAllScripts()`, renders header + `<ScriptsTable>`.

Required changes:
1. Replace `getAllScripts()` with `getScriptsWithMetrics()` that includes video + metrics data
2. Add sync button + staleness indicator above the table
3. Pass combined data to ScriptsTable

### script/[id]/page.tsx Changes

Current state: Fetches script + beats, renders ScriptEditor.

Required changes:
1. Query the linked video (if any) via `videos.scriptId`
2. Query unlinked videos for the dropdown
3. Pass linked video metrics + unlinked video list to a new `VideoLinkSelector` component
4. Optionally show a small metrics card if video is linked

### youtube-client.ts Changes

Current state: OAuth2 flow, token management, `getChannelInfo()`, `getQuickConnectionStatus()`, `getFullConnectionStatus()`.

Required additions:
1. `listChannelVideos()` -- uploads playlist discovery + video listing
2. `getVideoMetrics(videoIds, startDate)` -- batch basic metrics
3. `getRetentionData(videoId, startDate)` -- per-video retention curve

### Types (lib/types.ts)

Add types for video and metrics data passed to UI components:

```typescript
export interface VideoWithMetrics {
  id: number;
  youtubeId: string;
  title: string;
  publishedAt: Date | null;
  metrics: {
    views: number;
    engagedViews: number | null;
    likes: number | null;
    comments: number | null;
    subscribersGained: number | null;
    averageViewPercentage: number | null;
    retentionCurve: number[] | null;
    lastSyncedAt: Date;
  } | null;
}

export interface ScriptWithVideo extends Script {
  linkedVideo: VideoWithMetrics | null;
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `search.list` for video discovery | `playlistItems.list` via uploads playlist | Always been better, but tutorials still show search.list | 100x quota savings |
| `views` = engaged views for Shorts | `views` = play+replay; `engagedViews` = new metric | March 2025 | Fetch and display BOTH; use `engagedViews` for meaningful comparison |
| recharts v2.x | recharts v3.8.1 | 2025 | Better tree-shaking, new `<ResponsiveContainer>` behavior |

## Open Questions

1. **Batch metrics filter with comma-separated video IDs**
   - What we know: The `dimensions=video` report supports `filters=video==ID1,ID2,...` for basic metrics.
   - What's unclear: Whether this works for ALL Analytics API metrics or has a video count limit.
   - Recommendation: Test with 6 video IDs. If it fails, fall back to per-video basic metrics queries (still cheaper than retention).

2. **Copy-to-clipboard relocation**
   - What we know: D-03 replaces the copy button with a chevron. LIBR-03 requires copy functionality.
   - What's unclear: Where copy should live now.
   - Recommendation: Keep copy accessible on the script editor page (where the full script is already visible). The editor page is the natural place for "copy for recording" action.

3. **Sync progress granularity**
   - What we know: D-06 wants "Syncing 3/6 videos..." progress. Server actions cannot stream progress natively.
   - What's unclear: Whether the user will accept "Syncing..." (no count) for v1 given only 6 videos and 2-5 second sync time.
   - Recommendation: Implement simple "Syncing..." state for v1. Add SSE-based progress if sync takes >5 seconds or video count grows.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| `recharts` npm | Retention charts | Not yet installed | 3.8.1 on npm | `npm install recharts` |
| `googleapis` | YouTube API calls | Installed (Phase 7) | 171.4.0 | -- |
| YouTube Data API v3 | Video listing | Enabled in GCP | -- | -- |
| YouTube Analytics API | Metrics + retention | Enabled in GCP | -- | -- |
| OAuth2 tokens | All API calls | Phase 7 output | -- | Re-auth on settings page |

**Missing dependencies with no fallback:** None.

**Missing dependencies with fallback:**
- `recharts` not yet installed -- install as first task via `npm install recharts`.

## Sources

### Primary (HIGH confidence)
- [YouTube Analytics API: Channel Reports](https://developers.google.com/youtube/analytics/channel_reports) -- report types, retention per-video limitation
- [YouTube Analytics API: Sample Requests](https://developers.google.com/youtube/analytics/sample-requests) -- exact query parameters
- [YouTube Analytics API: Metrics Reference](https://developers.google.com/youtube/analytics/metrics) -- metric definitions, audienceWatchRatio
- [YouTube Data API: PlaylistItems.list](https://developers.google.com/youtube/v3/docs/playlistItems/list) -- 1 quota unit per call
- [YouTube Data API: Search.list](https://developers.google.com/youtube/v3/docs/search/list) -- 100 quota units per call
- [YouTube Data API: Channels.list](https://developers.google.com/youtube/v3/docs/channels/list) -- contentDetails.relatedPlaylists.uploads
- `recharts` npm v3.8.1 -- verified on npm registry 2026-03-29
- Existing codebase: `youtube-client.ts`, `schema.ts`, `scripts-table.tsx`, `library.ts`, `script/[id]/page.tsx`

### Secondary (MEDIUM confidence)
- [recharts GitHub](https://github.com/recharts/recharts) -- sparkline patterns from community examples
- [YouTube API Quota Calculator](https://developers.google.com/youtube/v3/determine_quota_cost) -- quota unit costs

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- recharts 3.8.1 verified, googleapis already installed
- Architecture: HIGH -- follows established codebase patterns; all API calls verified against official docs
- Pitfalls: HIGH -- quota costs, per-video retention limitation, upsert pattern all verified
- UI patterns: HIGH -- expandable table rows, sparkline charts are standard React patterns

**Research date:** 2026-03-29
**Valid until:** 2026-04-28 (YouTube Analytics API stable, recharts stable)
