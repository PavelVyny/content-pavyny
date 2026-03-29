# Pitfalls Research

**Domain:** YouTube Analytics API integration + data-aware AI generation for local Next.js app
**Researched:** 2026-03-29
**Confidence:** HIGH (OAuth and API limitations verified through official docs and community reports)

> This document covers pitfalls specific to the v2.1 YouTube Analytics milestone.
> For v2.0 Web UI pitfalls (streaming, editor, SQLite, anti-slop UX), see git history of this file.

## Critical Pitfalls

### Pitfall 1: Refresh Tokens Expire After 7 Days in "Testing" Mode

**What goes wrong:**
OAuth2 integration works perfectly during development. One week later, Pavlo opens the app and all YouTube data fails with `invalid_grant: Token has been expired or revoked`. The app looks broken. He has to re-authorize every single week.

**Why it happens:**
Google Cloud Console OAuth consent screen has two publishing statuses: "Testing" and "In production." In Testing mode, refresh tokens expire after exactly 7 days. Most developers start in Testing mode (the default) and never switch because production mode requires Google verification -- a homepage URL, privacy policy, and branding review that feels like overkill for a local single-user tool.

Worse: if you switch from Testing to Production, you must generate NEW OAuth credentials. Reusing the old client ID/secret from Testing mode will still produce 7-day tokens.

**How to avoid:**
1. Create the OAuth consent screen in "Internal" user type if using a Google Workspace account (no verification needed, no token expiry). If using a personal Gmail (likely Pavlo's case), "Internal" is not available.
2. For personal Gmail: set publishing status to "In production" from the start. Since the app requests sensitive scopes (YouTube Analytics), Google will require verification. BUT: apps with fewer than 100 users can request an "unverified app" exception -- Google shows a warning screen during consent but tokens do not expire.
3. After switching to production: delete old OAuth credentials and create new ones. This is the step everyone forgets.
4. Store refresh tokens persistently in SQLite (not just in-memory or session). On app startup, check token validity and trigger re-auth only when truly expired.

**Warning signs:**
- Google Cloud Console shows publishing status "Testing"
- Token works for a few days then stops
- User type is "External" (for personal Gmail accounts) with Testing status
- Same client_id/secret used after switching from Testing to Production

**Phase to address:**
Phase 1 (OAuth Setup) -- this must be resolved during initial Google Cloud Console configuration. Getting it wrong means weekly re-authorization that makes the feature feel unreliable.

**Sources:**
- [Google OAuth2 official docs](https://developers.google.com/identity/protocols/oauth2)
- [Refresh token 7-day expiry discussion](https://discuss.google.dev/t/oauth2-refresh-token-expiration-and-youtube-api-v3/160874)
- [jwz: YouTube OAuth API fuckery (Feb 2026)](https://www.jwz.org/blog/2026/02/youtube-oauth-api-fuckery/)
- [Nango: Google OAuth invalid_grant explained](https://www.nango.dev/blog/google-oauth-invalid-grant-token-has-been-expired-or-revoked)

---

### Pitfall 2: Using the Wrong API (Data API v3 vs Analytics API vs Reporting API)

**What goes wrong:**
Developer uses the YouTube Data API v3 to fetch video stats (views, likes, comments) and assumes retention curves are available there. They are not. Retention data requires the YouTube Analytics API -- a completely separate API with different scopes, different endpoints, different quota, and different response formats. The project gets "basic metrics" working fast but hits a wall when trying to add the key feature: retention curves.

**Why it happens:**
Google has THREE YouTube APIs that overlap confusingly:
1. **YouTube Data API v3** -- video metadata, channel info, playlists. No analytics.
2. **YouTube Analytics API** -- aggregated metrics (views, watch time, retention curves). Query-based, returns data for specific date ranges.
3. **YouTube Reporting API** -- bulk data export as downloadable reports. Designed for content owners with thousands of videos.

The Data API is what most tutorials cover. It returns `statistics` (viewCount, likeCount) but NOT retention, CTR, impressions, or subscriber change per video. Those are Analytics API only.

**How to avoid:**
- Use the YouTube Analytics API (`youtubeAnalytics.reports.query`) for all metrics, NOT the Data API
- Required scope: `https://www.googleapis.com/auth/youtube.readonly` (note: this changed from the older `yt-analytics.readonly` scope -- the new scope is now required for `reports.query`)
- For retention curves specifically: query with `dimensions=elapsedVideoTimeRatio` and `metrics=audienceWatchRatio,relativeRetentionPerformance` with `filters=video==VIDEO_ID`
- The Reporting API (bulk export) is overkill for 6 videos. Skip it entirely.

**Warning signs:**
- Using `youtube/v3/videos?part=statistics` and calling it "analytics"
- No retention curve data in the response
- Scope set to `youtube.readonly` but calling Data API endpoints only
- Confusion between `youtubeAnalytics` and `youtube` in API explorer

**Phase to address:**
Phase 1 (API Integration Design) -- choose the correct API before writing any code. The Analytics API has different request patterns (date ranges, dimensions, filters) that affect the entire data layer design.

**Sources:**
- [YouTube Analytics API metrics reference](https://developers.google.com/youtube/analytics/metrics)
- [YouTube Analytics channel reports](https://developers.google.com/youtube/analytics/channel_reports)
- [YouTube Analytics sample requests](https://developers.google.com/youtube/analytics/sample-requests)
- [YouTube Analytics API scopes (installed apps)](https://developers.google.com/youtube/reporting/guides/authorization/installed-apps)

---

### Pitfall 3: Retention Data Can Only Be Fetched One Video at a Time

**What goes wrong:**
Developer designs the dashboard to batch-fetch retention curves for all videos in a single API call. This is impossible. The `audienceRetention` report requires a single `video==VIDEO_ID` filter -- no comma-separated lists, no "all videos" wildcard. For 6 videos, that is 6 separate API calls. For 20 videos, 20 calls. The dashboard loads slowly or the developer gives up on retention curves entirely.

**Why it happens:**
Most Analytics API reports support filtering by channel (get everything). The audience retention report is a special case documented in a footnote. Developers discover this after building the batch-fetch architecture.

**How to avoid:**
1. Design the fetch layer to iterate over videos, one API call per video
2. Cache retention data in SQLite -- retention curves for published videos do not change after ~7 days
3. Fetch retention data lazily: on first view of a video's detail, or on a manual "sync" button
4. Never fetch all retention curves on page load. Fetch basic metrics (views, subs) in batch via Analytics API, then load retention on-demand per video.

**Warning signs:**
- Trying to pass multiple video IDs to the retention report filter
- Dashboard makes N API calls on every page load (where N = number of videos)
- No caching layer for retention data
- API quota warnings despite small channel

**Phase to address:**
Phase 2 (Data Fetching) -- the per-video limitation dictates the entire caching and loading strategy. Must be known before designing the dashboard data flow.

**Sources:**
- [YouTube Analytics channel reports -- audience retention](https://developers.google.com/youtube/analytics/channel_reports)
- [YouTube Analytics data model](https://developers.google.com/youtube/analytics/data_model)

---

### Pitfall 4: Analytics Data Thresholds Suppress Small-Channel Data

**What goes wrong:**
API call returns empty or partial data. Developer thinks the code is broken but the real issue is that YouTube suppresses analytics data when metrics do not meet a minimum threshold (exact threshold is undocumented). For a channel with 55 subscribers and videos with 2-8K views, some granular breakdowns (country-level, traffic source, demographic) may return no data at all.

**Why it happens:**
YouTube applies data thresholds to protect viewer privacy. Reports for dimensions like `country`, `ageGroup`, `gender`, or `deviceType` may return empty results if the video does not have enough views from that segment. This is not an error -- it is by design. The API does not tell you "data suppressed"; it simply returns fewer rows or zero rows.

**How to avoid:**
1. Only query dimensions that work reliably at small scale: `day` (daily views), `video` (per-video totals), `elapsedVideoTimeRatio` (retention curve)
2. Do NOT build UI around traffic source, demographics, or geography breakdowns -- they will be empty or misleading at 55 subscribers
3. Handle empty API responses gracefully: show "Not enough data yet" instead of zeros or errors
4. Focus on the metrics that actually have signal at this scale: views, retention %, subscriber change, impressions, CTR

**Warning signs:**
- Dashboard shows zeros for metrics that YouTube Studio shows as having data (Studio aggregates differently)
- Building detailed demographic breakdowns for a 55-subscriber channel
- Empty API responses treated as errors instead of expected behavior
- Discrepancies between API data and YouTube Studio data

**Phase to address:**
Phase 2 (Data Fetching) -- define which metrics to fetch and which to skip based on channel size. Revisit when channel reaches 1K+ subscribers.

**Sources:**
- [YouTube Analytics data model -- data thresholds](https://developers.google.com/youtube/analytics/data_model)

---

### Pitfall 5: AI Drawing Statistical Conclusions from 6 Videos

**What goes wrong:**
The AI receives metrics for 6 videos and starts generating advice: "Your audience prefers destruction content (8.7K views) over generic updates (2.1K views). You should make more destruction content." This sounds reasonable but is statistically meaningless. With 6 data points, the "pattern" could be random noise, seasonal variation, or YouTube algorithm experimentation. Pavlo changes his entire content strategy based on AI interpreting noise as signal.

**Why it happens:**
LLMs are pattern-matching machines. Give them 6 numbers and they WILL find patterns and present them confidently. They cannot distinguish between "statistically significant trend" and "random variation in a tiny sample." The PROJECT.md explicitly calls this out as out of scope, but the temptation is strong because it feels like the whole point of the feedback loop.

**How to avoid:**
1. AI receives metrics as RAW CONTEXT ONLY -- prepend with explicit instructions: "Here are metrics for reference. Do NOT make recommendations based on these numbers. Do NOT identify trends. The sample size (N=6) is too small for statistical conclusions."
2. AI should use metrics for SPECIFICITY only: "Your last video got 8.7K views" makes a script intro more authentic. "Your channel averages 4.5K views so you should..." is forbidden.
3. Set the threshold in code: only allow AI to reference individual video metrics, never aggregate statistics, until the channel has 20+ videos
4. Display metrics in the UI for Pavlo to interpret himself -- the human should draw conclusions, not the AI

**Warning signs:**
- AI output contains phrases like "your audience prefers," "based on your analytics," "your best-performing format is"
- Prompt includes instructions to "analyze metrics and recommend"
- AI generates different script recommendations based on which 3 of 6 videos it looks at
- Pavlo starts avoiding formats that had 1-2 low-performing videos

**Phase to address:**
Phase 3 (Data-Aware Generation) -- this is the most important design decision for the AI integration. The prompt engineering must explicitly constrain the AI from drawing conclusions. Test by checking if the AI's script recommendations change when you shuffle the metrics order.

---

### Pitfall 6: OAuth Redirect URI Mismatch Between MCP Server and Web App

**What goes wrong:**
The MCP server handles YouTube API calls. The Next.js web app triggers OAuth flow. But OAuth redirect URIs are configured for one but not the other. The user clicks "Connect YouTube" and gets `redirect_uri_mismatch` error. Or worse: OAuth works for the MCP server but the web app cannot initiate re-auth when tokens expire.

**Why it happens:**
There are two possible architectures for OAuth in this setup:
- **Option A:** Web app handles OAuth, stores tokens, passes them to MCP server
- **Option B:** MCP server handles its own OAuth, web app queries MCP for data

If the architecture is not decided upfront, the redirect URI configuration, token storage location, and re-auth flow become confused. Google Cloud Console requires EXACT redirect URI matches -- `http://localhost:3000/api/auth/callback` is NOT the same as `http://127.0.0.1:3000/api/auth/callback`.

**How to avoid:**
1. Decide the OAuth owner ONCE: the web app should own OAuth (it has a UI for the consent flow, a callback route, and persistent storage in SQLite). The MCP server receives tokens from the web app.
2. Register BOTH `http://localhost:3000` and `http://127.0.0.1:3000` as authorized JavaScript origins
3. Register the exact callback URL: `http://localhost:3000/api/auth/youtube/callback`
4. Use `localhost` consistently, not `127.0.0.1`, in app code -- but register both in Google Console as a safety net
5. Never use HTTPS for localhost OAuth -- Google explicitly allows HTTP for loopback addresses

**Warning signs:**
- `redirect_uri_mismatch` error during OAuth consent
- OAuth works in one context (MCP) but not another (web app)
- Token stored in MCP server's memory but web app cannot access it
- Different ports used by web app and MCP server causing URI mismatch

**Phase to address:**
Phase 1 (OAuth Setup) -- architecture decision about who owns the OAuth flow must be made before any code is written.

**Sources:**
- [Google OAuth for desktop/installed apps](https://developers.google.com/youtube/reporting/guides/authorization/installed-apps)
- [Google OAuth for web server apps](https://developers.google.com/youtube/v3/guides/auth/server-side-web-apps)

---

### Pitfall 7: MCP Server as Security Liability

**What goes wrong:**
An MCP server handling YouTube API calls introduces a new attack surface. A 2026 security scan found that 66% of MCP servers had at least one security finding. In January 2026, a fake MCP server was published to npm that captured API keys from environment variables. Even legitimate servers can have the "approve once, trust forever" problem where behavior changes after initial approval.

**Why it happens:**
MCP is a new protocol (2024-2025). The ecosystem is young, security practices are not standardized, and many servers are hobby projects with minimal auditing. The trust model in most MCP clients does not re-verify servers after initial approval.

**How to avoid:**
1. Build a minimal custom MCP server rather than using a third-party one. For this project, the MCP server only needs to wrap 3-4 YouTube Analytics API calls -- it does not need a full-featured YouTube management server.
2. Never store OAuth tokens or API keys as MCP server environment variables. Store tokens in the web app's SQLite database. The MCP server receives tokens per-request from the web app.
3. Pin MCP server dependencies. Do not use `latest` for any npm packages.
4. Audit the MCP server code before using it -- it should be small enough (under 300 lines) to read entirely.
5. If using a third-party MCP server: verify the GitHub repo, check last commit date, read the source code. Do not install from npm without reviewing.

**Warning signs:**
- Using a third-party MCP server with 50+ dependencies
- MCP server has direct access to Google OAuth credentials via env vars
- MCP server code is too large to audit manually
- Server was last updated 6+ months ago

**Phase to address:**
Phase 1 (MCP Server Setup) -- the MCP server architecture and security model must be established before any YouTube API integration.

**Sources:**
- [MCP Server Security Best Practices 2026](https://toolradar.com/blog/mcp-server-security-best-practices)
- [YouTube MCP Server Comparison 2026](https://www.ekamoira.com/blog/youtube-mcp-server-comparison-2026-which-one-should-you-use)

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Fetching YouTube data on every page load instead of caching | Always fresh data | Wastes API quota, slow dashboard load, redundant calls for static historical data | Never -- retention data for old videos does not change |
| Storing OAuth tokens in a JSON file instead of SQLite | Quick to implement, easy to debug | No encryption, easy to accidentally commit, no migration path, separate from app data | Early prototype only -- migrate to SQLite within first sprint |
| Hardcoding video IDs instead of discovering via API | Skip channel listing logic | Breaks when new video published, manual maintenance forever | Never -- channel listing is 1 API call |
| Fetching all metrics in a single mega-query | One API call | Cannot cache granular data, all-or-nothing refresh, harder to handle partial failures | Never -- separate basic metrics from retention curves |
| Using YouTube Data API for basic stats alongside Analytics API | Familiar, well-documented | Two APIs with different auth, quota, and response formats for data that Analytics API provides in one place | Never once Analytics API is set up -- it provides views, watch time, and more |

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| YouTube Analytics API | Using `yt-analytics.readonly` scope | Use `https://www.googleapis.com/auth/youtube.readonly` -- Google changed the required scope for `reports.query` |
| YouTube Analytics API | Requesting retention for multiple videos in one call | One video per retention request. Batch basic metrics (views, watch time) separately. |
| YouTube Analytics API | Not specifying date range, expecting "all time" | Always pass `startDate` and `endDate`. Use channel creation date as start. No "all time" shortcut. |
| Google OAuth (localhost) | Using `https://localhost:3000` as redirect URI | Use `http://localhost:3000` -- Google allows HTTP for loopback. HTTPS on localhost causes certificate errors. |
| Google OAuth | Keeping Testing mode to "avoid verification hassle" | Switch to Production mode. For <100 users, you get an unverified app warning but tokens do not expire weekly. |
| Google OAuth | Reusing old credentials after switching Testing to Production | Must create NEW OAuth client ID/secret after switching. Old credentials still produce 7-day tokens. |
| MCP Server | Storing YouTube tokens in MCP server env vars | Web app owns tokens in SQLite. Passes to MCP per-request. MCP is stateless regarding auth. |
| MCP Server | Building MCP server that wraps the entire YouTube API | Build minimal server: 3-4 tools max (get_basic_metrics, get_retention_curve, list_videos, get_channel_stats). Less code = less attack surface. |
| SQLite (metrics storage) | Creating a new table per video for metrics | Single `video_metrics` table with `video_id` column. Single `retention_points` table with `video_id` + `elapsed_ratio`. |
| Claude AI context | Sending full retention curve data (100 points per video x N videos) as prompt context | Send summary only: peak retention %, drop-off point, average retention. Raw curves waste tokens and confuse the AI. |

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Fetching retention curves for all videos on dashboard load | Dashboard takes 5-10 seconds, one API call per video | Cache in SQLite, fetch lazily on video detail view, background sync button | Immediately noticeable at 6+ videos |
| No caching layer for Analytics API responses | Repeated identical API calls, quota consumed quickly | Cache with TTL: 1 hour for recent videos, 24 hours for videos older than 7 days | After a few days of development with frequent page reloads |
| Rendering 100-point retention curve with DOM elements | Chart jank, slow render on lower-end devices | Use canvas-based chart library (recharts with SVG is fine at this scale) | Not a real concern at 6 videos, but good practice |
| Sending all video metrics to Claude on every generation | Slow responses, high token count, context pollution | Only send metrics for the 3-5 most recent videos, summarized to key numbers | After 20+ videos with full metrics |

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| Storing Google OAuth client_secret in frontend code | Anyone can impersonate your app's OAuth flow | Client secret stays server-side only. For installed/desktop apps, Google considers the secret "not confidential" but it should still not be in client bundles. |
| OAuth tokens stored unencrypted in SQLite | If `.db` file is shared or committed, full YouTube account access | Encrypt tokens at rest using a machine-specific key. At minimum: add `*.db` to `.gitignore`. |
| Not revoking tokens on "Disconnect YouTube" action | Pavlo disconnects in UI but tokens remain valid, stale data persists | On disconnect: call Google's token revocation endpoint, delete tokens from SQLite, clear cached metrics. |
| MCP server accepting requests from any origin | Other local apps could query YouTube data through the MCP server | MCP server should only accept connections from the registered Claude Code client or the web app. |

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Showing raw API numbers without context | "Impressions: 1,247" means nothing to Pavlo | Show relative context: "1,247 impressions (your average: 890)" or simple trend arrows |
| Dashboard shows metrics but no connection to scripts | User sees data in one tab, writes scripts in another, no link between them | Each script in the library shows its linked video metrics. Generation page shows metrics for recent videos inline. |
| Re-auth flow interrupts workflow | Token expires while Pavlo is writing a script, suddenly redirected to Google consent | Background token refresh. If refresh fails, show non-blocking banner: "YouTube connection expired. Reconnect?" -- never interrupt active work. |
| Showing all 100 retention data points as a table | Unreadable wall of numbers | Retention curve as a sparkline chart. Key callouts: "75% stayed at hook, 45% at midpoint, 30% at end." |
| No "last synced" indicator | Pavlo does not know if metrics are from today or last week | Show "Last synced: 2 hours ago" with manual sync button. Color-code: green (<1h), yellow (<24h), red (>24h). |
| Empty dashboard before first YouTube connect | User sees blank cards, no explanation of what to do | Clear onboarding: "Connect your YouTube channel to see video metrics here" with a single button. |

## "Looks Done But Isn't" Checklist

- [ ] **OAuth persistence:** Close the app entirely, reopen 2 days later -- does YouTube data load without re-auth? Test by checking SQLite for stored refresh token.
- [ ] **Token refresh:** Set access token expiry to 1 minute in dev. Does the app silently refresh without user action?
- [ ] **Retention data:** Verify retention curve has 100 data points for each video. Some videos may return fewer if very short. Handle gracefully.
- [ ] **Empty metrics:** Create a test query for a dimension that returns no data (e.g., country breakdown). Does the UI show "No data" or does it crash?
- [ ] **Data-aware generation:** Generate a script WITH metrics context and WITHOUT. Compare. The WITH version should reference specific numbers but NOT make strategic recommendations.
- [ ] **Metric freshness:** Publish a new video, wait 48 hours, sync. Does the new video appear in the dashboard?
- [ ] **Disconnect flow:** Click "Disconnect YouTube." Verify: tokens deleted from SQLite, Google revocation endpoint called, metrics cache cleared, UI shows "Connect YouTube" state.
- [ ] **MCP server isolation:** Verify MCP server does not store any tokens or credentials persistently. Kill and restart MCP -- it should have no residual state.
- [ ] **Concurrent access:** Open dashboard in two tabs. Trigger sync in one. Does the other tab show updated data on refresh without errors?

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| 7-day token expiry (Testing mode) | LOW | Switch to Production in Google Console. Create new OAuth credentials. Update client ID/secret in app. Re-authorize once. ~30 min. |
| Wrong API (Data API instead of Analytics) | MEDIUM | Rewrite data fetching layer to use Analytics API. Schema likely needs new columns for retention data. ~1 day. |
| AI making statistical conclusions | LOW | Update system prompt to explicitly forbid trend analysis. Add guardrail check on AI output. ~1 hour. |
| OAuth tokens leaked via git | HIGH | Revoke tokens immediately via Google Console. Rotate OAuth client secret. Re-authorize. Scrub git history. ~2 hours. |
| MCP server compromised | MEDIUM | Revoke all tokens. Rebuild MCP server from scratch (should be <300 lines). Re-authorize. Audit what data was accessed. ~half day. |
| Metrics stored in wrong format | MEDIUM | Write migration to restructure tables. If data is in SQLite, transformation is straightforward. ~half day. |

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| 7-day token expiry | Phase 1: OAuth Setup | Google Console shows "In production." New credentials created after switch. Token persists >7 days. |
| Wrong API choice | Phase 1: API Design | First API call uses `youtubeAnalytics.reports.query`, not `youtube/v3/videos`. Retention data returns 100 points. |
| Redirect URI mismatch | Phase 1: OAuth Setup | OAuth consent flow completes without error from `http://localhost:3000`. Both localhost and 127.0.0.1 registered. |
| MCP server security | Phase 1: MCP Setup | MCP server is custom-built, <300 LOC, no persistent token storage. Code fully audited. |
| Per-video retention limitation | Phase 2: Data Fetching | Retention fetched per-video with caching. Dashboard does not make N calls on load. |
| Data threshold suppression | Phase 2: Data Fetching | UI shows "Not enough data" for empty dimension queries instead of zeros or errors. |
| AI drawing conclusions on N=6 | Phase 3: Data-Aware Generation | System prompt explicitly forbids trend analysis. Test: shuffle metrics, verify AI output does not change recommendations. |
| No caching for API responses | Phase 2: Data Fetching | SQLite stores cached metrics with timestamps. Repeated page loads do not trigger API calls. |
| OAuth token not refreshing | Phase 1: OAuth Setup | Manually expire access token, verify silent refresh works without user interaction. |

## Sources

- [YouTube Analytics API metrics reference (official)](https://developers.google.com/youtube/analytics/metrics) -- HIGH confidence
- [YouTube Analytics channel reports (official)](https://developers.google.com/youtube/analytics/channel_reports) -- HIGH confidence
- [YouTube Analytics data model (official)](https://developers.google.com/youtube/analytics/data_model) -- HIGH confidence
- [YouTube Analytics sample requests (official)](https://developers.google.com/youtube/analytics/sample-requests) -- HIGH confidence
- [Google OAuth2 for installed apps (official)](https://developers.google.com/youtube/reporting/guides/authorization/installed-apps) -- HIGH confidence
- [Google OAuth2 overview (official)](https://developers.google.com/identity/protocols/oauth2) -- HIGH confidence
- [jwz: YouTube OAuth API fuckery (Feb 2026)](https://www.jwz.org/blog/2026/02/youtube-oauth-api-fuckery/) -- HIGH confidence
- [Google OAuth invalid_grant explained (Nango)](https://www.nango.dev/blog/google-oauth-invalid-grant-token-has-been-expired-or-revoked) -- MEDIUM confidence
- [OAuth2 refresh token expiration discussion](https://discuss.google.dev/t/oauth2-refresh-token-expiration-and-youtube-api-v3/160874) -- MEDIUM confidence
- [MCP Server Security Best Practices 2026](https://toolradar.com/blog/mcp-server-security-best-practices) -- MEDIUM confidence
- [YouTube MCP Server Comparison 2026](https://www.ekamoira.com/blog/youtube-mcp-server-comparison-2026-which-one-should-you-use) -- MEDIUM confidence
- [YouTube API quota breakdown 2026](https://www.contentstats.io/blog/youtube-api-quota-tracking) -- MEDIUM confidence

---
*Pitfalls research for: YouTube Analytics API integration + data-aware AI generation (v2.1 milestone)*
*Researched: 2026-03-29*
