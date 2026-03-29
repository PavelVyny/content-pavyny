# Phase 7: OAuth & Schema - Research

**Researched:** 2026-03-29
**Domain:** Google OAuth2 integration + Drizzle ORM schema for YouTube video metrics
**Confidence:** HIGH

## Summary

Phase 7 connects Pavlo's YouTube channel to the app via Google OAuth2, stores tokens persistently, shows connection status in the header, and creates the `videos` + `video_metrics` database tables. No metrics fetching or dashboard -- that is Phase 8.

The implementation is straightforward: `googleapis` npm package handles OAuth2 token exchange and auto-refresh, tokens persist in a local JSON file, the callback is a standard Next.js route handler, and Drizzle schema additions follow the exact patterns already established in the codebase. The primary risk is the 7-day token expiry in Google's "Testing" consent screen mode, but CONTEXT.md confirms the consent screen is already in Production mode, which eliminates this issue.

**Primary recommendation:** Build in order: schema tables first, then youtube-client.ts (OAuth2 + token file), then callback route handler, then settings page UI, then header status icons. Each step is independently testable.

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Settings page accessed via gear icon in header nav (not text link). Gear icon placed next to existing Generate/Scripts nav links.
- **D-02:** Settings page uses sectioned layout -- YouTube Integration section now, with structure ready for future sections. No empty placeholder sections.
- **D-03:** After connecting, settings shows a card with channel details: channel name, avatar, subscriber count, video count, last sync time, and Disconnect button.
- **D-04:** YouTube logo icon in the header (separate from gear icon). Clickable -- navigates to settings page.
- **D-05:** Three states: connected = YouTube red (#FF0000) icon, disconnected = gray icon, token expired = red icon with warning indicator.
- **D-06:** Icon is always visible in the header layout, next to the nav area.
- **D-07:** When token expires, YouTube icon goes to expired state (red with warning). No banner or modal -- minimal disruption.
- **D-08:** Clicking the expired-state icon navigates to settings where user can reconnect with one click.
- **D-09:** App remains fully functional when disconnected -- metrics features simply show "not connected" state. Never block script generation.
- **D-10:** `scriptId` FK on videos table (video points to its script). Videos are discovered from YouTube, then optionally linked to scripts.
- **D-11:** `video_metrics` stores latest aggregates per video (one row per video, overwritten on sync). YouTube Analytics API provides daily breakdowns via `dimensions=day` -- no need to duplicate time-series in DB.
- **D-12:** Retention curve data stored as JSON text column in video_metrics (100-point array from audienceWatchRatio).

### Claude's Discretion
- FK direction: `scriptId` on videos table chosen because videos are discovered from YouTube independently, then linked to scripts. Videos exist without scripts; scripts exist without videos.
- Metrics storage: latest aggregates per video (not time-series snapshots). YouTube Analytics API provides daily breakdowns natively via `dimensions=day` queries.
- Token storage: local JSON file (`data/.youtube-tokens.json`) per architecture research recommendation.
- OAuth callback route: `app/api/youtube/callback/route.ts` -- standard Next.js API route for server-side token exchange.

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope.

</user_constraints>

<phase_requirements>

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| YTUB-01 | User can connect YouTube channel via OAuth2 with one-click "Connect YouTube" button | OAuth2 flow via `googleapis` package; consent URL generation + callback handler pattern documented below |
| YTUB-02 | OAuth2 tokens persist in local file with auto-refresh (not 7-day expiry) | File-based token storage at `data/.youtube-tokens.json`; `oauth2Client.on("tokens")` event for persistence; Production consent screen avoids 7-day expiry |
| YTUB-03 | Connection status indicator visible at all times (disconnected/connected/expired) | YouTube icon component in layout header; three-state logic based on token file existence + token validity check |
| YTUB-04 | User can disconnect YouTube channel from settings | Delete token file + call Google revocation endpoint + revalidate UI state |
| YTUB-05 | Database schema has `videos` and `video_metrics` tables | Drizzle ORM schema additions following existing `scripts`/`beats` patterns; `drizzle-kit push` for dev migration |

</phase_requirements>

## Project Constraints (from CLAUDE.md)

- Communicate with Pavlo in Russian; scripts in English
- Anti-slop is the primary quality gate (not directly relevant to this phase but do not break existing pipeline)
- App is desktop-only, localhost-only, light theme, max-w-4xl layout
- GSD workflow enforcement: use `/gsd:execute-phase` for planned work
- **web/AGENTS.md warning:** "This is NOT the Next.js you know" -- read `node_modules/next/dist/docs/` before writing code. Next.js 16 may have breaking changes from training data.

## Standard Stack

### Core (NEW for this phase)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `googleapis` | 171.4.0 | Google OAuth2 client + YouTube Data API v3 access | Official Google Node.js client. Bundles `google-auth-library` ^10.2.0 with auto-refresh. Single package for both OAuth2 flow and YouTube API calls. Verified current on npm. |

### Already Installed (used in this phase)

| Library | Purpose in Phase 7 |
|---------|---------------------|
| `drizzle-orm` 0.45.2 | Schema definition for `videos` + `video_metrics` tables |
| `drizzle-kit` | `drizzle-kit push` for dev-mode schema sync |
| `better-sqlite3` 12.8.0 | SQLite database engine |
| `lucide-react` | Settings gear icon, warning badge icon |
| shadcn/ui components | Card, Button, Badge for settings page |
| `sonner` | Toast notifications for connect/disconnect feedback |

### NOT Needed This Phase

| Library | Why Not |
|---------|---------|
| `recharts` | Charts are Phase 8 (dashboard). Do not install yet. |
| `google-auth-library` (separate) | Already bundled inside `googleapis`. Installing separately risks version conflicts. |
| `@tanstack/react-query` | No client-side API caching needed. Server actions read from file/DB directly. |

### Installation

```bash
cd web
npm install googleapis
```

**Version verified:** `npm view googleapis version` returns 171.4.0 (checked 2026-03-29).

## Architecture Patterns

### Recommended Project Structure (new/modified files only)

```
web/src/
  app/
    api/youtube/callback/route.ts   # NEW: OAuth2 callback handler
    settings/page.tsx               # NEW: YouTube connection settings
    actions/youtube.ts              # NEW: OAuth actions (connect URL, disconnect, status)
    layout.tsx                      # MODIFIED: add gear icon + YouTube status icon to header
  components/
    youtube-status-icon.tsx         # NEW: three-state YouTube icon (client component)
    youtube-connect-card.tsx        # NEW: connect button + channel card (client component)
  lib/
    youtube-client.ts               # NEW: OAuth2 client singleton, token file read/write
    db/schema.ts                    # MODIFIED: add videos + videoMetrics tables
web/data/
  .youtube-tokens.json              # NEW: OAuth2 tokens (gitignored)
```

### Pattern 1: File-Based Token Storage

**What:** Store OAuth2 tokens in `data/.youtube-tokens.json` alongside the SQLite database file.
**Why this pattern:** Single-user local app. Tokens are sensitive credentials that should NOT be in the same SQLite file as content data. File-based storage is easy to gitignore, easy to debug (human-readable JSON), and easy to delete for "disconnect."

```typescript
// lib/youtube-client.ts
import { google } from "googleapis";
import fs from "fs";
import path from "path";

const TOKEN_PATH = path.join(process.cwd(), "data", ".youtube-tokens.json");

let oauth2Client: InstanceType<typeof google.auth.OAuth2> | null = null;

export function getOAuth2Client() {
  if (!oauth2Client) {
    oauth2Client = new google.auth.OAuth2(
      process.env.YOUTUBE_CLIENT_ID,
      process.env.YOUTUBE_CLIENT_SECRET,
      process.env.YOUTUBE_REDIRECT_URI
    );

    // Load stored tokens if they exist
    const tokens = loadTokens();
    if (tokens) {
      oauth2Client.setCredentials(tokens);
    }

    // Persist refreshed tokens automatically
    oauth2Client.on("tokens", (newTokens) => {
      const existing = loadTokens() || {};
      saveTokens({ ...existing, ...newTokens });
    });
  }
  return oauth2Client;
}

function loadTokens(): Record<string, unknown> | null {
  try {
    if (fs.existsSync(TOKEN_PATH)) {
      return JSON.parse(fs.readFileSync(TOKEN_PATH, "utf-8"));
    }
  } catch {
    // Corrupted file -- treat as disconnected
  }
  return null;
}

function saveTokens(tokens: Record<string, unknown>) {
  fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokens, null, 2));
}
```

**Critical detail:** The `on("tokens")` event fires when `google-auth-library` auto-refreshes an expired access token. The callback receives ONLY the new access token (not the refresh token). Must merge with existing tokens, not overwrite -- otherwise the refresh token is lost.

### Pattern 2: OAuth2 Flow via Route Handler

**What:** Standard Authorization Code flow. Server action generates consent URL, browser redirects to Google, Google redirects back to `/api/youtube/callback`, route handler exchanges code for tokens.

```
User clicks "Connect YouTube"
  -> Server action: getAuthUrl()
  -> Returns Google consent URL with scopes
  -> Browser redirects to Google
  -> User approves
  -> Google redirects to /api/youtube/callback?code=XXX
  -> Route handler: exchange code for tokens
  -> Save tokens to file
  -> Redirect to /settings with success
```

**Route handler pattern (Next.js 16):**

```typescript
// app/api/youtube/callback/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getOAuth2Client, storeTokens } from "@/lib/youtube-client";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  if (!code) {
    return NextResponse.redirect(new URL("/settings?error=no_code", request.url));
  }

  const client = getOAuth2Client();
  const { tokens } = await client.getToken(code);
  storeTokens(tokens);
  client.setCredentials(tokens);

  return NextResponse.redirect(new URL("/settings?connected=true", request.url));
}
```

### Pattern 3: Connection Status Detection (Three States)

**What:** Check token file existence and token validity to determine one of three states.
**Logic:**

| State | Condition | Icon |
|-------|-----------|------|
| Disconnected | Token file does not exist | Gray YouTube icon |
| Connected | Token file exists AND access token is valid or refreshable | Red (#FF0000) YouTube icon |
| Expired | Token file exists BUT refresh fails (revoked or 7-day expiry) | Red icon + warning badge |

**Detection approach:**

```typescript
// In youtube.ts server action
export async function getConnectionStatus(): Promise<"disconnected" | "connected" | "expired"> {
  const tokens = loadTokens();
  if (!tokens) return "disconnected";

  // Try a lightweight API call to verify tokens are valid
  try {
    const client = getOAuth2Client();
    const youtube = google.youtube("v3");
    await youtube.channels.list({
      auth: client,
      part: ["snippet"],
      mine: true,
      maxResults: 1,
    });
    return "connected";
  } catch (error: any) {
    if (error.code === 401 || error.message?.includes("invalid_grant")) {
      return "expired";
    }
    // Network error or other issue -- assume connected (token file exists)
    return "connected";
  }
}
```

**Important:** Do NOT call the YouTube API on every page load just to check status. Check token file existence for quick status. Only verify with API call on settings page load or when explicitly checking.

**Lightweight status check (for header icon on every page):**

```typescript
export async function getQuickConnectionStatus(): Promise<"disconnected" | "connected" | "expired"> {
  const tokens = loadTokens();
  if (!tokens) return "disconnected";

  // Check if access token expiry is past AND refresh token exists
  const expiryDate = tokens.expiry_date as number | undefined;
  if (expiryDate && Date.now() > expiryDate && tokens.refresh_token) {
    // Token expired but refresh token exists -- likely still valid
    // Actual refresh happens on next API call
    return "connected";
  }
  if (!tokens.refresh_token) return "expired";
  return "connected";
}
```

### Pattern 4: YouTube Icon Component

**What:** Custom SVG YouTube logo icon with three color states. Must be the actual YouTube play-button logo shape, not a generic video icon.

The YouTube logo icon is NOT in lucide-react. Options:
1. **Custom SVG component** (recommended) -- inline the YouTube logo path as a React component
2. **react-icons** package -- has `FaYoutube` but adds a full dependency for one icon

```tsx
// components/youtube-status-icon.tsx
"use client";

import Link from "next/link";

type Status = "disconnected" | "connected" | "expired";

export function YouTubeStatusIcon({ status }: { status: Status }) {
  const colors: Record<Status, string> = {
    disconnected: "#a1a1aa", // zinc-400
    connected: "#FF0000",    // YouTube red
    expired: "#FF0000",      // YouTube red (with warning badge)
  };

  return (
    <Link href="/settings" className="relative" title="YouTube connection">
      <svg viewBox="0 0 24 24" className="w-5 h-5" fill={colors[status]}>
        {/* YouTube play button logo path */}
        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
      </svg>
      {status === "expired" && (
        <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-500 rounded-full border border-white" />
      )}
    </Link>
  );
}
```

### Pattern 5: Drizzle Schema Addition

**What:** Add `videos` and `videoMetrics` tables following the exact pattern of existing `scripts` and `beats` tables.

```typescript
// Addition to lib/db/schema.ts

export const videos = sqliteTable("videos", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  youtubeId: text("youtube_id").notNull().unique(),
  title: text("title").notNull(),
  description: text("description"),
  thumbnailUrl: text("thumbnail_url"),
  publishedAt: integer("published_at", { mode: "timestamp" }),
  channelTitle: text("channel_title"),
  scriptId: integer("script_id").references(() => scripts.id, { onDelete: "set null" }),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const videoMetrics = sqliteTable("video_metrics", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  videoId: integer("video_id")
    .notNull()
    .references(() => videos.id, { onDelete: "cascade" })
    .unique(),  // One row per video (overwritten on sync per D-11)
  views: integer("views").notNull().default(0),
  engagedViews: integer("engaged_views"),
  likes: integer("likes").default(0),
  comments: integer("comments").default(0),
  shares: integer("shares").default(0),
  subscribersGained: integer("subscribers_gained").default(0),
  subscribersLost: integer("subscribers_lost").default(0),
  averageViewPercentage: integer("average_view_percentage"),
  averageViewDuration: integer("average_view_duration"),
  retentionCurve: text("retention_curve", { mode: "json" }).$type<number[]>(),
  lastSyncedAt: integer("last_synced_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});
```

**Key design notes per CONTEXT.md decisions:**
- `videoMetrics` has a `unique()` constraint on `videoId` -- one row per video, overwritten on sync (D-11)
- `retentionCurve` is a JSON text column storing a 100-point array (D-12)
- `scriptId` FK on `videos` table with `onDelete: "set null"` -- deleting a script does not delete the video record (D-10)
- No `fetchedAt` time-series -- single row overwritten. `lastSyncedAt` tracks when data was last refreshed.

**Migration:** Run `npx drizzle-kit push` after schema changes. This is the existing pattern (no migration files in dev mode).

### Anti-Patterns to Avoid

- **Do NOT import `googleapis` in any `"use client"` file.** OAuth2 credentials must stay server-side. Next.js enforces this boundary at build time.
- **Do NOT call YouTube API on every page load for status check.** Use file existence check for the header icon. Only call API for full validation on the settings page.
- **Do NOT store tokens in SQLite.** Decision is locked: file-based at `data/.youtube-tokens.json`.
- **Do NOT install `google-auth-library` separately.** It is bundled inside `googleapis`.
- **Do NOT use time-series snapshots for metrics.** Decision D-11: one row per video, overwritten.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| OAuth2 token exchange | Manual HTTP requests to Google token endpoint | `oauth2Client.getToken(code)` from googleapis | Handles PKCE, error codes, token format parsing |
| Access token refresh | Manual refresh logic checking expiry timestamps | `googleapis` auto-refresh via `google-auth-library` | Transparently refreshes on API call; fires `on("tokens")` event |
| YouTube API calls | Raw `fetch()` to YouTube REST endpoints | `google.youtube("v3")` and `google.youtubeAnalytics("v2")` typed clients | Typed responses, automatic pagination, error handling |
| YouTube logo SVG | Install `react-icons` for one icon | Inline SVG path in a component | One icon does not justify a 400KB dependency |
| Token revocation on disconnect | Just delete the file | Call `oauth2Client.revokeToken()` THEN delete the file | Leaving valid tokens on Google's side is a security gap |

## Common Pitfalls

### Pitfall 1: 7-Day Token Expiry in Testing Mode

**What goes wrong:** Refresh tokens expire after exactly 7 days when GCP consent screen is in "Testing" mode.
**Why it happens:** Google's default OAuth consent screen status is "Testing." Most developers never switch.
**How to avoid:** CONTEXT.md confirms consent screen is already in Production mode. Verify this during implementation: the settings page setup instructions should remind Pavlo to confirm Production status. If credentials were created while in Testing mode, they must be regenerated after switching to Production.
**Warning signs:** Token works for a week then `invalid_grant` error appears.
**Confidence:** HIGH -- verified via official Google docs and community reports.

### Pitfall 2: Losing Refresh Token on Auto-Refresh

**What goes wrong:** `on("tokens")` callback receives only the new access token (not the refresh token). If you overwrite the stored file with just the new tokens, the refresh token is lost. Next time access token expires, there is no refresh token to use.
**Why it happens:** Google only sends the refresh token on the initial authorization. Subsequent token refreshes only return a new access token.
**How to avoid:** Merge new tokens with existing stored tokens: `{ ...existing, ...newTokens }`. Never replace the entire file.
**Warning signs:** App works for 1 hour, then breaks permanently until re-authorization.
**Confidence:** HIGH -- documented in google-auth-library source.

### Pitfall 3: OAuth2 Client Singleton Stale After Token Update

**What goes wrong:** The `oauth2Client` singleton loads tokens at creation time. If tokens are updated (via callback or refresh), the singleton still holds old credentials in memory.
**Why it happens:** Node.js module-level singletons persist across requests in dev mode (Next.js hot reload) but may not pick up file changes.
**How to avoid:** After storing new tokens in the callback, also call `oauth2Client.setCredentials(tokens)` on the existing singleton. The `on("tokens")` handler already persists to file; make sure the in-memory client is also updated.
**Warning signs:** First API call after connect/refresh fails, but restarting the app fixes it.
**Confidence:** HIGH.

### Pitfall 4: redirect_uri_mismatch Error

**What goes wrong:** Google returns `redirect_uri_mismatch` when the callback URL in the consent request does not exactly match what is registered in GCP console.
**Why it happens:** Mismatch between `http://localhost:3000` and `http://127.0.0.1:3000`, or trailing slash differences, or HTTPS vs HTTP.
**How to avoid:** Use `YOUTUBE_REDIRECT_URI=http://localhost:3000/api/youtube/callback` in `.env`. Register the exact same URL in GCP console. Do NOT use HTTPS for localhost -- Google explicitly allows HTTP for loopback.
**Warning signs:** OAuth consent screen loads fine but callback fails with 400 error.
**Confidence:** HIGH.

### Pitfall 5: `access_type: "offline"` Must Be Set Explicitly

**What goes wrong:** Google returns an access token but NO refresh token. The token works for 1 hour then expires permanently.
**Why it happens:** By default, Google OAuth returns only an access token. To get a refresh token, you must pass `access_type: "offline"` when generating the consent URL. Some developers also need `prompt: "consent"` to force the consent screen to appear even if the user previously authorized the app (required to get a NEW refresh token).
**How to avoid:**

```typescript
const authUrl = oauth2Client.generateAuthUrl({
  access_type: "offline",
  prompt: "consent",
  scope: [
    "https://www.googleapis.com/auth/yt-analytics.readonly",
    "https://www.googleapis.com/auth/youtube.readonly",
  ],
});
```

**Warning signs:** Token file has `access_token` but no `refresh_token` field.
**Confidence:** HIGH -- documented in Google OAuth2 reference.

### Pitfall 6: Channel Data Requires Separate API Call

**What goes wrong:** After OAuth, the app tries to display channel name/avatar/stats but has no data because OAuth only gives tokens, not channel info.
**Why it happens:** OAuth2 token exchange returns credentials, not YouTube data. Channel details require a separate `youtube.channels.list({ mine: true })` call.
**How to avoid:** After successful OAuth callback, immediately fetch channel info and store it (either in the token file or in a separate channel-info file). Display this cached data on the settings page.
**Warning signs:** Settings page shows "Connected" but no channel name or avatar.
**Confidence:** HIGH.

## Code Examples

### OAuth Consent URL Generation (Server Action)

```typescript
// app/actions/youtube.ts
"use server";

import { google } from "googleapis";
import { getOAuth2Client, loadTokens, deleteTokens } from "@/lib/youtube-client";

const SCOPES = [
  "https://www.googleapis.com/auth/yt-analytics.readonly",
  "https://www.googleapis.com/auth/youtube.readonly",
];

export async function getAuthUrl(): Promise<string> {
  const client = getOAuth2Client();
  return client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: SCOPES,
  });
}

export async function disconnectYouTube(): Promise<{ success: boolean }> {
  const tokens = loadTokens();
  if (tokens?.access_token) {
    try {
      const client = getOAuth2Client();
      await client.revokeToken(tokens.access_token as string);
    } catch {
      // Token may already be revoked -- continue with local cleanup
    }
  }
  deleteTokens();
  // Reset singleton so next getOAuth2Client() starts fresh
  resetOAuth2Client();
  return { success: true };
}
```

### Channel Info Fetch (for settings card)

```typescript
// In youtube-client.ts or youtube.ts action
export async function getChannelInfo() {
  const client = getOAuth2Client();
  const youtube = google.youtube("v3");
  const response = await youtube.channels.list({
    auth: client,
    part: ["snippet", "statistics"],
    mine: true,
  });

  const channel = response.data.items?.[0];
  if (!channel) return null;

  return {
    title: channel.snippet?.title ?? "",
    thumbnailUrl: channel.snippet?.thumbnails?.default?.url ?? "",
    subscriberCount: Number(channel.statistics?.subscriberCount ?? 0),
    videoCount: Number(channel.statistics?.videoCount ?? 0),
  };
}
```

### Header Layout Integration

```tsx
// In layout.tsx -- add to nav area
<nav className="flex items-center gap-4">
  <Link href="/" className="text-sm text-muted-foreground hover:text-primary transition-colors">
    Generate
  </Link>
  <Link href="/scripts" className="text-sm text-muted-foreground hover:text-primary transition-colors">
    Scripts
  </Link>
  <YouTubeStatusIcon status={connectionStatus} />
  <Link href="/settings" className="text-muted-foreground hover:text-primary transition-colors">
    <Settings className="w-4 h-4" />
  </Link>
</nav>
```

**Note on layout.tsx:** The header is in the root layout (Server Component). The YouTube status icon needs dynamic state. Two approaches:
1. **Server Component approach:** Call `getQuickConnectionStatus()` directly in `layout.tsx` (checks file existence, fast, no API call). This works because `layout.tsx` is a Server Component.
2. **Client Component approach:** Wrap the icon in a client component that fetches status via a server action on mount.

Recommended: Server Component approach for simplicity. The file existence check is synchronous and fast.

## OAuth2 Scopes

| Scope | Required For | Notes |
|-------|-------------|-------|
| `yt-analytics.readonly` | YouTube Analytics API: metrics, retention curves | Phase 8 needs this for `reports.query()` |
| `youtube.readonly` | YouTube Data API v3: list channel videos, get channel info | Needed in Phase 7 for channel card; Phase 8 for video discovery |

**Both scopes must be requested during Phase 7 OAuth flow**, even though Analytics API calls happen in Phase 8. This avoids requiring a second authorization later.

## Environment Variables

Already configured in `.env`:

```
YOUTUBE_CLIENT_ID=***REDACTED***
YOUTUBE_CLIENT_SECRET=***REDACTED***
```

**Missing from .env (must add):**

```
YOUTUBE_REDIRECT_URI=http://localhost:3000/api/youtube/callback
```

## Files to Gitignore

Add to `web/.gitignore`:

```
# YouTube OAuth tokens
data/.youtube-tokens.json
```

The existing `.gitignore` already covers `data/*.db` files but not JSON files in `data/`.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Everything | Yes | (existing, runs Next.js) | -- |
| `googleapis` npm | OAuth2 + YouTube API | Not yet installed | 171.4.0 on npm | `npm install googleapis` |
| GCP OAuth credentials | OAuth2 flow | Yes (in .env) | -- | -- |
| GCP consent screen in Production | Token persistence >7 days | Per CONTEXT.md: yes | -- | Re-auth weekly if still in Testing |
| YouTube Data API v3 enabled | Channel listing | Per CONTEXT.md: yes | -- | -- |
| YouTube Analytics API enabled | Metrics (Phase 8) | Needs verification | -- | Enable in GCP console |

**Missing dependencies with no fallback:** None -- all prerequisites met per CONTEXT.md.

**Missing dependencies with fallback:**
- `googleapis` not yet installed -- install via `npm install googleapis` as first task.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `yt-analytics.readonly` scope only | Both `yt-analytics.readonly` AND `youtube.readonly` required | 2025 | Google changed scope requirements for `reports.query()` |
| `views` = engaged views for Shorts | `views` = play+replay; `engagedViews` = new metric | March 2025 | Fetch BOTH metrics; distinguish in UI |
| Testing mode: no token expiry | Testing mode: 7-day refresh token expiry | ~2024 | Must use Production consent screen |

## Open Questions

1. **Brand Account behavior**
   - What we know: Pavlo's channel may be a Brand Account (common for YouTube creators). `channels.list({ mine: true })` works for personal channels.
   - What's unclear: Brand Account channels may require different listing approach or additional scope.
   - Recommendation: Test during implementation. If `mine: true` returns empty, try listing channels and selecting the correct one.

2. **Token file vs channel info caching**
   - What we know: Channel info (name, avatar, stats) is needed for the settings card.
   - What's unclear: Whether to store channel info in the token JSON file alongside tokens, or in a separate file, or in SQLite.
   - Recommendation: Store in the token JSON file as a `channel` nested object. Keeps it simple -- one file for all YouTube connection state. If tokens are deleted (disconnect), channel info is also cleared.

## Sources

### Primary (HIGH confidence)
- `googleapis` npm v171.4.0 -- verified version on npm registry
- `recharts` npm v3.8.1 -- verified version (Phase 8 only)
- [YouTube Analytics API metrics reference](https://developers.google.com/youtube/analytics/metrics) -- available metrics
- [Google OAuth2 for web server apps](https://developers.google.com/youtube/v3/guides/auth/server-side-web-apps) -- OAuth flow pattern
- [google-auth-library OAuth2Client source](https://github.com/googleapis/google-auth-library-nodejs) -- token refresh behavior, `on("tokens")` event
- Next.js 16 route handlers docs (from `node_modules/next/dist/docs/01-app/01-getting-started/15-route-handlers.md`) -- route handler conventions

### Secondary (MEDIUM confidence)
- [jwz: YouTube OAuth API fuckery (Feb 2026)](https://www.jwz.org/blog/2026/02/youtube-oauth-api-fuckery/) -- 7-day token expiry in testing mode
- [Nango: Google OAuth invalid_grant explained](https://www.nango.dev/blog/google-oauth-invalid-grant-token-has-been-expired-or-revoked) -- token expiry troubleshooting
- [Google OAuth2 refresh token discussion](https://discuss.google.dev/t/oauth2-refresh-token-expiration-and-youtube-api-v3/160874) -- community reports on token behavior

### Codebase (HIGH confidence)
- `web/src/lib/db/schema.ts` -- existing Drizzle schema patterns (integer timestamps, JSON text columns, FK references)
- `web/src/lib/db/index.ts` -- database singleton pattern
- `web/src/app/actions/library.ts` -- server action patterns (`"use server"`, Drizzle queries)
- `web/src/app/layout.tsx` -- header layout structure
- `web/src/components/providers.tsx` -- client providers pattern
- `web/drizzle.config.ts` -- Drizzle config (SQLite at `./data/scripts.db`)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- `googleapis` 171.4.0 verified on npm, official Google package
- Architecture: HIGH -- follows existing codebase patterns exactly (server actions, Drizzle schema, file-based data in `data/`)
- Pitfalls: HIGH -- OAuth2 pitfalls verified via official Google docs and multiple community sources
- Schema design: HIGH -- decisions locked in CONTEXT.md, follows existing `scripts`/`beats` table patterns

**Research date:** 2026-03-29
**Valid until:** 2026-04-28 (googleapis stable, OAuth2 protocol stable)
