# Stack Research

**Domain:** YouTube Analytics integration into existing Next.js scriptwriting app
**Researched:** 2026-03-29
**Confidence:** HIGH

## Important Context

This is a SUBSEQUENT MILESTONE (v2.1). The web app is already built and running with:
- Next.js 16.2.1, React 19.2.4, TypeScript 5.x, Tailwind CSS 4.x, shadcn/ui v4
- SQLite (better-sqlite3 12.8.0) + Drizzle ORM 0.45.2
- Claude Agent SDK 0.2.86 for AI generation
- Zod 4.3.6 for validation

This research covers ONLY new packages needed for YouTube Analytics API integration, metrics dashboard, and data-aware generation. The existing stack is validated and unchanged.

**Architecture decision already made:** Use `googleapis` npm package directly from server actions. NOT an MCP server. See ARCHITECTURE.md for full rationale.

---

## New Dependencies

### Core: YouTube API Integration

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| `googleapis` | ^171.4.0 | Official Google Node.js client for YouTube Data API v3 + YouTube Analytics API | Google's maintained monorepo client. Single package provides typed access to both APIs needed: `google.youtube("v3")` for listing channel videos and `google.youtubeAnalytics("v2")` for metrics/retention data. Bundles `google-auth-library` ^10.2.0 as a dependency, so OAuth2 token management (including auto-refresh) comes included. No need to install `google-auth-library` separately. |

### Dashboard: Charts

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| `recharts` | ^3.8.1 | Retention curve and metrics trend charts | React-native charting library built on D3. Composes as React components, which fits the existing shadcn/ui + Server Components architecture. Only needed for one chart type (retention curve line chart, possibly a bar chart for views comparison). At this data scale (6-50 videos, 100-point retention curves), any chart library works -- Recharts is chosen because it is the de facto standard for React dashboards, has first-class React 19 support, and requires zero configuration for basic line/area charts. |

### That's It

No other new packages are needed. Here is why:

| Capability | Handled By | Already Installed |
|------------|-----------|-------------------|
| OAuth2 token management | `google-auth-library` (bundled inside `googleapis`) | No -- comes with googleapis |
| Database tables for metrics | Drizzle ORM + better-sqlite3 | Yes |
| Schema migrations | drizzle-kit | Yes |
| UI components (cards, buttons, badges) | shadcn/ui | Yes |
| Form validation | Zod | Yes |
| Toast notifications | sonner | Yes |
| Icons | lucide-react | Yes |
| AI generation with metrics context | Claude Agent SDK | Yes (modify existing `agent.ts`) |

---

## Installation

```bash
cd web

# New dependencies (only 2 packages)
npm install googleapis recharts

# Dev dependency for recharts types (included in recharts 3.x, not needed separately)
# No new dev dependencies required
```

**Total addition:** 2 npm packages. `googleapis` is large (~50MB in node_modules due to type definitions for all Google APIs) but tree-shakes in production builds since only `youtube` and `youtubeAnalytics` submodules are imported.

---

## Package Details

### googleapis

**What it provides:**

```typescript
import { google } from "googleapis";

// YouTube Data API v3 -- list channel videos
const youtube = google.youtube("v3");
const videos = await youtube.search.list({
  auth: oauth2Client,
  forMine: true,
  type: ["video"],
  part: ["snippet"],
  maxResults: 50,
});

// YouTube Analytics API v2 -- get metrics per video
const ytAnalytics = google.youtubeAnalytics("v2");
const report = await ytAnalytics.reports.query({
  auth: oauth2Client,
  ids: "channel==MINE",
  startDate: "2025-01-01",
  endDate: "2026-03-29",
  metrics: "views,likes,subscribersGained,averageViewPercentage",
  filters: "video==VIDEO_ID",
});
```

**OAuth2 client from bundled google-auth-library:**

```typescript
const oauth2Client = new google.auth.OAuth2(
  process.env.YOUTUBE_CLIENT_ID,
  process.env.YOUTUBE_CLIENT_SECRET,
  process.env.YOUTUBE_REDIRECT_URI
);

// Set stored tokens -- auto-refreshes when access token expires
oauth2Client.setCredentials({
  refresh_token: storedRefreshToken,
  access_token: storedAccessToken,
});

// Listen for token refresh events to persist new tokens
oauth2Client.on("tokens", (tokens) => {
  // Save to data/.youtube-tokens.json
});
```

**Key facts:**
- Bundles `google-auth-library` ^10.2.0 (do NOT install separately)
- OAuth2 client auto-refreshes access tokens when expired
- `on("tokens")` event fires when refresh happens -- use this to persist new tokens to file
- All API methods return typed responses
- Supports both promise and callback patterns (use promises)

### recharts

**What it provides for this project:**

```tsx
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

// Retention curve -- 100 data points
function RetentionChart({ data }: { data: number[] }) {
  const chartData = data.map((ratio, i) => ({
    position: `${i}%`,
    retention: Math.round(ratio * 100),
  }));

  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={chartData}>
        <XAxis dataKey="position" tick={false} />
        <YAxis domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
        <Tooltip formatter={(v: number) => `${v}%`} />
        <Line type="monotone" dataKey="retention" stroke="#3b82f6" dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}
```

**Key facts:**
- React 19 compatible (v3.x)
- Renders as SVG (crisp on all screens)
- `ResponsiveContainer` handles resize
- Lightweight for our use: only importing LineChart + AreaChart components
- No configuration files needed
- Works in both Server and Client Components (chart components must be Client Components due to interactivity)

---

## Environment Variables (NEW)

```bash
# Add to web/.env.local
YOUTUBE_CLIENT_ID=<from Google Cloud Console>
YOUTUBE_CLIENT_SECRET=<from Google Cloud Console>
YOUTUBE_REDIRECT_URI=http://localhost:3000/api/youtube/callback
```

**Setup prerequisite:** Pavlo has already created a YouTube Data API v3 key in GCP and enabled the YouTube API. For v2.1, he needs to:
1. Enable YouTube Analytics API (in addition to Data API v3)
2. Create OAuth 2.0 Web Application credentials (not just API key)
3. Add `http://localhost:3000/api/youtube/callback` as authorized redirect URI
4. Set consent screen to External + Testing mode (add his own email as test user)

---

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| `googleapis` (monorepo) | `@googleapis/youtube` + `@googleapis/youtubeanalytics` (individual packages) | If the 50MB node_modules size of the monorepo is a concern. Individual packages are ~2MB each. However, they share the same auth setup and importing two packages vs one is more boilerplate for no runtime benefit. The monorepo tree-shakes in production. Stick with `googleapis`. |
| `googleapis` | `youtube-mcp-server` (Python MCP) | Never for this project. MCP adds cross-language complexity (Python subprocess from Node.js app), process management overhead, and is designed for LLM tool access -- not direct API calls from a web app. See ARCHITECTURE.md. |
| `recharts` | `chart.js` + `react-chartjs-2` | If you need canvas-based rendering (better for 10,000+ data points). Our retention curves have exactly 100 points. Chart.js has a smaller initial bundle (11KB gzipped) but requires a wrapper library for React integration. Recharts' native React component model is cleaner for this codebase. |
| `recharts` | No chart library (plain CSS/SVG) | If retention curves are deferred. A simple bar chart of views/retention could be done with Tailwind CSS divs. But retention curve visualization specifically benefits from proper axis scaling, tooltips, and responsive sizing that a chart library provides for free. |
| `recharts` | `visx` (Airbnb) | If you want maximum control with low-level D3 primitives. visx is "un-opinionated" -- you build everything from atoms. For one line chart and one bar chart, this is overengineering. |
| File-based token storage | SQLite column for tokens | If you want tokens backed up with the database. But tokens are sensitive credentials that should NOT be in the same file as content data. File-based storage with `.gitignore` is the standard pattern for OAuth tokens in local tools. |

---

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| `google-auth-library` (separate install) | Already bundled as a dependency of `googleapis`. Installing separately risks version conflicts between the bundled version and your explicit version. | Access via `google.auth.OAuth2` from the `googleapis` import |
| `@googleapis/youtube` + `@googleapis/youtubeanalytics` (individual packages) | Two imports, two auth setups, same result. The monorepo `googleapis` provides both through a single import and shared auth client. | `googleapis` monorepo package |
| YouTube MCP servers (pauling-ai, veygo) | Python-based, 40+ tools, designed for LLM agent access. This is a web app making direct API calls. MCP adds process management, cross-language debugging, and protocol overhead for zero benefit. | Direct `googleapis` import in `youtube-client.ts` |
| `node-cron` / `cron` packages for scheduled sync | Premature optimization. At 6 videos, Pavlo clicks "Sync" once. Adding a cron scheduler to a local dev tool that runs intermittently adds complexity for a feature that is not needed yet. | Manual "Sync Metrics" button. Revisit at 20+ videos if auto-sync on page load is wanted. |
| `@tanstack/react-query` for API caching | Metrics are fetched from YouTube API, stored in SQLite, then read from SQLite for display. There is no client-side API caching needed. React Server Components read directly from the database. | Direct Drizzle ORM queries in Server Components |
| `d3` (raw) | Full D3 is 230KB+ and requires imperative DOM manipulation that fights React's declarative model. | `recharts` (built on D3 internally, exposes React components) |
| SaaS analytics tools (VidIQ, TubeBuddy, SocialBlade) | External services with subscriptions, designed for power YouTubers. At 55 subscribers and 6 videos, the YouTube Analytics API provides everything needed for free. | YouTube Analytics API via `googleapis` |

---

## Version Compatibility

| Package | Compatible With | Notes |
|---------|-----------------|-------|
| `googleapis` ^171.4.0 | Node.js 18+ | Uses ESM internally but works with CommonJS via Next.js bundler. The `google.auth.OAuth2` class handles token refresh automatically. |
| `googleapis` ^171.4.0 | Next.js 16.x Server Actions | Import in server-side code only (actions, route handlers, lib/). Never import in Client Components -- OAuth credentials must stay server-side. |
| `recharts` ^3.8.1 | React 19.x | Full React 19 support since recharts 3.0. Uses React's `use` hook internally. |
| `recharts` ^3.8.1 | Next.js 16.x | Chart components must be Client Components (`"use client"` directive) due to DOM interaction. Wrap in a Client Component, pass data from Server Component. |
| `recharts` ^3.8.1 | Tailwind CSS 4.x | No conflicts. Recharts uses inline SVG styling. Tailwind classes apply to wrapper divs. |

### googleapis + Next.js Server Components Note

The `googleapis` package must only be imported in server-side code:
- `lib/youtube-client.ts` (service layer)
- `app/actions/youtube.ts` and `app/actions/metrics.ts` (server actions)
- `app/api/youtube/callback/route.ts` (API route handler)

Never import `googleapis` in files with `"use client"`. The OAuth2 client holds secrets that must not reach the browser. Next.js automatically enforces this boundary -- a server-only import in a Client Component causes a build error.

---

## Integration Points with Existing Stack

| Existing Code | How It Changes | New Dependency Involved |
|---------------|----------------|------------------------|
| `lib/db/schema.ts` | Add `videos` and `videoMetrics` tables | None (Drizzle ORM already installed) |
| `lib/agent.ts` | Accept optional `metricsContext` string parameter | None (Claude Agent SDK already installed) |
| `app/actions/generate.ts` | Query metrics from DB, pass to agent | None (Drizzle already installed) |
| `app/scripts/page.tsx` | Add metrics mini-cards alongside script cards | `recharts` for sparkline/retention chart |
| New: `lib/youtube-client.ts` | OAuth2 client, token storage, API wrappers | `googleapis` |
| New: `app/api/youtube/callback/route.ts` | OAuth2 redirect handler | `googleapis` (for token exchange) |
| New: `components/retention-chart.tsx` | Retention curve visualization | `recharts` |
| New: `app/settings/page.tsx` | YouTube connection UI | None (shadcn/ui already installed) |

---

## Token Storage Details

Tokens are stored in `web/data/.youtube-tokens.json` (same `data/` directory as the SQLite database).

```json
{
  "access_token": "ya29.a0...",
  "refresh_token": "1//0d...",
  "scope": "https://www.googleapis.com/auth/yt-analytics.readonly https://www.googleapis.com/auth/youtube.readonly",
  "token_type": "Bearer",
  "expiry_date": 1711756800000
}
```

**Security:**
- Add `web/data/.youtube-tokens.json` to `.gitignore` (critical)
- File permissions: readable only by the app process (local machine, single user)
- Access token expires in 1 hour, auto-refreshed by `google-auth-library` inside `googleapis`
- Refresh token: long-lived in production apps, but **7-day expiry in Google's "Testing" consent screen mode**

**The 7-day token expiry issue:**
Google OAuth apps in "Testing" mode (up to 100 test users, no verification) expire refresh tokens after 7 days. Options:
1. **Accept it** -- re-auth weekly takes 10 seconds, matches Pavlo's 1 video/week cadence
2. **Set app to "Internal"** -- only works if Pavlo has Google Workspace (not a consumer Gmail)
3. **Publish the app** -- requires Google verification (overkill for a personal local tool)

Recommendation: Accept 7-day expiry. Show clear "YouTube disconnected" status in the UI when tokens expire, with a one-click re-connect button.

---

## Sources

### Official Documentation (HIGH confidence)
- [googleapis npm](https://www.npmjs.com/package/googleapis) -- v171.4.0, bundles google-auth-library ^10.2.0
- [googleapis GitHub - package.json](https://github.com/googleapis/google-api-nodejs-client/blob/main/package.json) -- confirmed google-auth-library is a direct dependency, not peer
- [google-auth-library npm](https://www.npmjs.com/package/google-auth-library) -- v10.6.2, OAuth2 with auto-refresh
- [recharts npm](https://www.npmjs.com/package/recharts) -- v3.8.1, React 19 compatible
- [YouTube Analytics API - Metrics](https://developers.google.com/youtube/analytics/metrics) -- available metrics for Shorts
- [YouTube Analytics API - Authorization](https://developers.google.com/youtube/reporting/guides/authorization) -- OAuth2 required, no API key support for Analytics

### Architecture Research (HIGH confidence)
- [ARCHITECTURE.md](.planning/research/ARCHITECTURE.md) -- decision to use googleapis directly, not MCP; OAuth2 flow; schema design; data flow diagrams

### Community Sources (MEDIUM confidence)
- [Recharts vs Chart.js comparison (2026)](https://www.syncfusion.com/blogs/post/top-5-react-chart-libraries) -- React charting library landscape
- [React chart libraries comparison](https://blog.logrocket.com/best-react-chart-libraries-2025/) -- performance characteristics at different data scales

---
*Stack research for: YouTube Analytics integration (v2.1 milestone)*
*Researched: 2026-03-29*
