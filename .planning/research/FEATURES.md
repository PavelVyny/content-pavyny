# Feature Research

**Domain:** YouTube Analytics integration, metrics dashboard, and data-aware generation for existing Next.js scriptwriting app
**Researched:** 2026-03-29
**Confidence:** HIGH

This research focuses on NEW features for the v2.1 milestone. The existing app (v2.0) already has: script generation with 7 formats, dual-track beat editor, hook variant switching, per-beat AI regeneration, anti-slop scoring, script library with status workflow, and voiceover clipboard copy. This milestone adds YouTube metrics pull, dashboard display, and data-aware generation.

**Important context:** Channel has 6 videos and 55 subscribers. "Data-aware" means the AI sees raw metrics as context -- NOT statistical analysis (sample too small). User already has YouTube Data API v3 key. OAuth2 required for Analytics API (retention curves). Channel is under a Brand Account.

## Feature Landscape

### Table Stakes (Users Expect These)

Features that any YouTube analytics integration needs to feel complete. Missing these makes the integration feel half-baked.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| **YouTube OAuth connection flow** | Must connect the channel before anything else works. User expects a single "Connect YouTube" button, Google consent screen, and done. | MEDIUM | One-time setup. Needs: settings page, OAuth2 redirect handler, token storage, connection status indicator. The complexity is in Google's OAuth requirements (consent screen setup, redirect URIs, token refresh), not in the UI. Must handle token expiry gracefully -- show banner, never interrupt active work. |
| **Video list auto-discovery** | After connecting, user expects to see their videos without manually entering IDs or URLs. The app should know what videos exist on the channel. | LOW | YouTube Data API v3 `search.list` with `forMine=true` and `type=video`. Returns video IDs, titles, publish dates. At 6 videos this is a single API call. Store in `videos` table. |
| **Basic metrics per video** | Views, likes, comments, subscriber change. The minimum someone expects when they connect YouTube analytics. These are the numbers YouTube Studio shows at a glance. | LOW | YouTube Analytics API `reports.query` with `metrics=views,likes,comments,subscribersGained`. One call per video or batch by date range. Store as time-series snapshots in `video_metrics` table. |
| **Retention curve per video** | The single most valuable metric for Shorts creators. Shows exactly where viewers drop off. YouTube Studio displays this prominently -- any analytics tool that lacks it feels incomplete. | MEDIUM | Requires separate API call per video: `audienceWatchRatio` with `dimensions=elapsedVideoTimeRatio`. Returns 100 data points. Must be fetched one video at a time (API limitation). Cache aggressively -- retention for old videos does not change. Display as a sparkline or small line chart. |
| **Manual sync button** | At 1 video/week, auto-sync is unnecessary. User expects to click "Sync" and see fresh data. Must show "last synced" timestamp so the user knows if data is stale. | LOW | Button triggers fetch of all video metadata + metrics. Shows spinner during sync. Updates "Last synced: X minutes ago" on completion. Color-code staleness: green (<1h), yellow (<24h), red (>24h). |
| **Connection status indicator** | User must know at a glance whether YouTube is connected, when data was last fetched, and if there is a problem (expired token, API error). | LOW | Persistent indicator in settings and/or dashboard header. States: disconnected (gray), connected (green), token expired (red with "Reconnect" action), syncing (spinner). Non-blocking banner for token expiry -- never redirect away from active work. |
| **Script-to-video linking** | The whole point of data-aware generation is knowing which script became which video. User needs to connect them. | LOW | Dropdown on script detail page showing unlinked YouTube videos. Select one to link. `videos.scriptId` foreign key. At 1 video/week, manual linking takes 2 seconds and avoids unreliable auto-matching by title. |
| **Metrics display alongside scripts** | The feedback loop only works if metrics are visible in the same context as scripts. Seeing the script library with zero performance data defeats the purpose. | MEDIUM | Mini metrics card per script in the library view (when linked to a video). Shows: views, retention %, subs gained. Clicking expands to full metrics + retention curve. On the script editor page, linked video metrics appear in a sidebar or panel. |

### Differentiators (Competitive Advantage)

Features that make this tool genuinely better than just checking YouTube Studio and writing scripts separately. These justify the integration effort.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **Data-aware script generation** | When generating a new script, the AI sees metrics from past videos as context. It naturally gravitates toward patterns that worked (destruction content, physics humor) without being told "make more of X." No other scriptwriting tool does this. | MEDIUM | Query SQLite for latest metrics per video, format as readable text, inject into Claude prompt. Must explicitly instruct AI: "small sample, do NOT draw conclusions." The AI uses numbers for specificity ("your last video got 8.7K views") and lets patterns inform creative choices subconsciously. This is the core innovation of v2.1. |
| **Format-to-performance mapping** | Dashboard shows which script formats (The Bug, The Satisfaction, etc.) correlate with which metrics. Not AI conclusions -- raw data: "The Bug: 2 videos, avg 5.4K views. The Satisfaction: 1 video, 8.7K views." Pavlo draws his own conclusions. | LOW | Group metrics by `scripts.format` via SQL join. Display as a simple table or grouped bar chart. Trivial query once script-video linking exists. Becomes more valuable as video count grows. |
| **Retention curve overlay with beat timestamps** | Show retention curve with vertical markers where each script beat transitions. Reveals which BEAT caused drop-offs or spikes. YouTube Studio shows retention but cannot map it to script structure. | HIGH | Requires knowing beat durations (not currently tracked). Would need Pavlo to enter approximate timestamps post-recording, or infer from video duration / beat count. Defer to v2.2 unless beat timing is easy to add. The concept is unique -- no competitor connects script structure to retention data. |
| **Metrics trend over time** | For each video, show how metrics changed: 48h views vs 7d views vs 30d views. Time-series snapshots reveal whether a video is still growing or peaked. | LOW | Already built into the architecture (time-series `video_metrics` table with `fetchedAt`). Display as a mini sparkline per metric. At 1 sync/day, each video accumulates 30 data points in a month. Trivial to render. |
| **"Generate like my best video"** | One-click generation that automatically uses the same format and similar context as the highest-performing video. Shortcut for "more of what works." | LOW | Query: find video with highest `averageViewPercentage`, get linked script's format and context, pre-fill the generation form. Button on dashboard: "Generate like #6 (8.7K views)." Simple DB query + form pre-fill, zero AI complexity. |
| **Metrics context toggle on generation** | Checkbox on the generation form: "Include channel metrics as context." When off, generation works exactly as v2.0. When on, injects metrics. Lets Pavlo A/B test whether data-aware generation actually improves scripts. | LOW | Boolean flag passed to `generateScript()`. When true, calls `getMetricsContextForGeneration()` and appends to prompt. Default: on. Important for Pavlo to feel in control and to evaluate whether the feature helps. |

### Anti-Features (Commonly Requested, Often Problematic)

Features that seem logical for a YouTube analytics integration but create problems at this scale or in this context.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| **AI-generated content recommendations** | "Based on your analytics, you should make more destruction content." Seems like the obvious use of data + AI. | With 6 videos, any "recommendation" is noise dressed as signal. AI will confidently identify patterns in random variation. Pavlo changes content strategy based on meaningless correlations. PROJECT.md explicitly forbids this. | Show raw data. Let Pavlo interpret. Revisit AI recommendations at 20+ videos with a disclaimer about sample size. |
| **"Viewed vs Swiped Away" metric** | Key Shorts metric in YouTube Studio. Shows what percentage of Shorts feed viewers chose to watch vs scroll past. Directly measures hook effectiveness. | NOT available through the YouTube Analytics API. This metric exists only in YouTube Studio's web and mobile UI. Building the feature would require scraping Studio (fragile, against ToS) or manual entry (defeats automation). | Display `averageViewPercentage` and `engagedViews` as proxies. Note in the UI that "Viewed vs Swiped Away" is only available in YouTube Studio. Link directly to Studio for that metric. |
| **Real-time analytics streaming** | "See views update live as they come in." Dashboard auto-refreshes every minute. | YouTube Analytics data has a 24-48 hour processing delay. Real-time polling wastes API quota on stale data. Creates false expectation of freshness. At 1 video/week, checking once daily is plenty. | Manual sync button with "last synced" timestamp. Consider auto-sync on dashboard load if data is >24h stale. |
| **Demographic breakdowns (age, gender, country)** | Standard in enterprise analytics dashboards. Seems like useful audience insight. | YouTube suppresses demographic data below undocumented thresholds. At 55 subscribers, most dimension queries return empty results. Building a demographics panel that shows "No data" for everything erodes trust in the tool. | Skip entirely. Focus on metrics that work at small scale: views, retention, subs, engagement. Revisit demographics at 1K+ subscribers. |
| **Automated posting schedule optimization** | "Post at the optimal time based on your audience activity." | Zero statistical significance with 6 videos. YouTube does not expose audience online-time data via API for small channels. Optimal posting time for Shorts is largely irrelevant -- the Shorts shelf serves content algorithmically, not chronologically. | Pavlo posts when the video is ready. No scheduling needed at this cadence. |
| **Multi-channel / competitor comparison** | "Compare your metrics against similar channels." | Requires YouTube Data API access to other channels (limited to public data). Comparing a 55-subscriber channel to established devlog channels is demoralizing and actionless. The gap is too large for meaningful comparison. | Focus on self-comparison: "This video vs your previous video." Personal growth trajectory is motivating and actionable. |
| **Impressions and CTR metrics** | Standard YouTube metrics. Show how many times the thumbnail was shown and click-through rate. | For Shorts, impressions work differently than for regular videos. Shorts are served in the Shorts shelf where CTR is not the primary discovery mechanism (viewers swipe, not click). The `impressions` metric via API may undercount Shorts shelf impressions. | Fetch and store if available, but do not make it a primary dashboard metric. `averageViewPercentage` is a better performance signal for Shorts. |
| **Automatic script-video matching** | "App should automatically detect which YouTube video corresponds to which script." | Script titles and video titles often differ. Matching by date is unreliable (script created days before upload). Fuzzy matching creates false links. Wrong links corrupt the feedback loop. | Manual dropdown linking. Takes 2 seconds at 1 video/week. Reliable and explicit. |
| **Full YouTube Studio replacement** | "Since we're pulling data, show everything Studio shows." | YouTube Studio has 100+ features built by hundreds of engineers. Recreating even 10% is months of work. The goal is not to replace Studio -- it is to put key metrics next to scripts. | Show the 5 metrics that matter for scriptwriting (views, retention, subs, engaged views, avg view %). Link to YouTube Studio for everything else. |

## Feature Dependencies

```
YouTube OAuth Connection
    |
    +--enables--> Video List Auto-Discovery
    |                 |
    |                 +--enables--> Basic Metrics Fetch
    |                 |                 |
    |                 |                 +--enables--> Retention Curve Fetch
    |                 |                 |
    |                 |                 +--enables--> Metrics Display (dashboard + cards)
    |                 |                 |                 |
    |                 |                 |                 +--enables--> Metrics Trend Over Time
    |                 |                 |                 |
    |                 |                 |                 +--enables--> Format-to-Performance Mapping
    |                 |                 |
    |                 |                 +--enables--> Data-Aware Script Generation
    |                 |                                   |
    |                 |                                   +--enhances--> Metrics Context Toggle
    |                 |                                   |
    |                 |                                   +--enhances--> "Generate Like My Best"
    |                 |
    |                 +--enables--> Script-to-Video Linking
    |                                   |
    |                                   +--required-by--> Data-Aware Generation
    |                                   |                   (needs to know which metrics
    |                                   |                    go with which format/script)
    |                                   |
    |                                   +--required-by--> Format-to-Performance Mapping

Connection Status Indicator
    +--independent-- (always visible, shows state of OAuth)

Manual Sync Button
    +--requires--> YouTube OAuth Connection
    +--triggers--> Video List + Metrics Fetch
```

### Dependency Notes

- **Data-Aware Generation requires Script-to-Video Linking:** The AI needs to know which format produced which performance. Without linking, metrics are just channel-level numbers with no script context. Linking must be built before data-aware generation can be meaningful.
- **Retention Curves require separate API calls:** Cannot be batched with basic metrics. Must be fetched per-video. This means the sync flow has two stages: batch basic metrics, then iterate for retention. Dashboard should show basic metrics immediately while retention loads.
- **Format-to-Performance Mapping requires both Linking and Metrics:** This is a derived feature -- a SQL JOIN between scripts (format column) and video_metrics. No additional API calls, just a query. But both tables must be populated and linked.
- **Connection Status is independent:** Shows OAuth state regardless of whether data has been fetched. Should work even when YouTube API is down.

## MVP Definition

### Launch With (v2.1 Core)

Minimum viable analytics integration -- the feedback loop must be functional end-to-end.

- [ ] **YouTube OAuth connection flow** -- Settings page, connect button, Google consent, token storage. Without this, nothing else works.
- [ ] **Video list auto-discovery** -- After connecting, all channel videos appear in the app. No manual entry.
- [ ] **Basic metrics per video** -- Views, likes, comments, subs gained, average view percentage. Stored as snapshots.
- [ ] **Retention curve per video** -- Fetched per-video, displayed as a small line chart. Cached in SQLite.
- [ ] **Manual sync button** -- "Sync Now" with last-synced timestamp and staleness indicator.
- [ ] **Connection status indicator** -- Visible on dashboard. Shows connected/disconnected/expired states.
- [ ] **Script-to-video linking** -- Dropdown on script page to link to a YouTube video.
- [ ] **Metrics display alongside scripts** -- Mini cards in library view, detail panel in editor view.
- [ ] **Data-aware script generation** -- Metrics injected into Claude prompt with "small sample" guardrail.
- [ ] **Metrics context toggle** -- Checkbox on generation form to enable/disable metrics injection.

### Add After Validation (v2.1.x)

Features to add once the core feedback loop is running and Pavlo has used it for 3+ videos.

- [ ] **Format-to-performance mapping** -- trigger: when 10+ videos exist with linked scripts, the grouping becomes meaningful
- [ ] **Metrics trend sparklines** -- trigger: when 3+ sync snapshots exist per video, trends become visible
- [ ] **"Generate like my best video"** -- trigger: when Pavlo has a clear best-performer and wants to replicate the approach
- [ ] **Auto-sync on dashboard load** -- trigger: when manual sync becomes a chore (if stale >24h, auto-trigger)

### Future Consideration (v2.2+)

Features to defer until the feedback loop proves valuable and video count grows.

- [ ] **Retention curve overlay with beat timestamps** -- defer because: requires beat timing data that does not exist yet, HIGH complexity
- [ ] **AI content recommendations** -- defer until: 20+ videos published, explicit unlock with sample-size disclaimer
- [ ] **Demographic breakdowns** -- defer until: 1K+ subscribers where data thresholds are reliably met
- [ ] **Impressions/CTR display** -- defer because: less meaningful for Shorts than for regular videos

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| YouTube OAuth connection | HIGH (blocker) | MEDIUM | P1 |
| Video list auto-discovery | HIGH (blocker) | LOW | P1 |
| Basic metrics per video | HIGH | LOW | P1 |
| Retention curve per video | HIGH | MEDIUM | P1 |
| Manual sync button + staleness | MEDIUM | LOW | P1 |
| Connection status indicator | MEDIUM | LOW | P1 |
| Script-to-video linking | HIGH (blocker for data-aware) | LOW | P1 |
| Metrics display alongside scripts | HIGH | MEDIUM | P1 |
| Data-aware script generation | HIGH (core innovation) | MEDIUM | P1 |
| Metrics context toggle | MEDIUM | LOW | P1 |
| Format-to-performance mapping | MEDIUM | LOW | P2 |
| Metrics trend sparklines | LOW | LOW | P2 |
| "Generate like my best video" | MEDIUM | LOW | P2 |
| Auto-sync on dashboard load | LOW | LOW | P2 |
| Retention + beat timestamp overlay | HIGH (unique) | HIGH | P3 |
| AI content recommendations | MEDIUM | LOW (code), HIGH (risk) | P3 |
| Demographic breakdowns | LOW | MEDIUM | P3 |

**Priority key:**
- P1: Must have for v2.1 -- the analytics integration is pointless without these
- P2: Should have, add after the feedback loop is validated with real usage
- P3: Nice to have, defer until channel growth justifies the effort or complexity

## Competitor Feature Analysis

| Feature | YouTube Studio | VidIQ | TubeBuddy | Subscribr | ContentStudio | Our Approach |
|---------|---------------|-------|-----------|-----------|---------------|--------------|
| Retention curves | Full detail, interactive scrub, "typical" overlay | Basic via Studio embed | Basic via Studio embed | Not available | Not available | Sparkline per video, detail view on click. Simpler than Studio but co-located with scripts. |
| Metrics dashboard | Comprehensive, 100+ metrics | Channel-level + competitor tracking | SEO-focused metrics | Video idea scoring, no analytics | Multi-platform dashboard | Minimal: 5 key metrics per video. Not trying to replace Studio. |
| Script connection | None (Studio has no script concept) | None | None | Generates scripts from ideas, no post-publish tracking | None | Script-to-video linking. Only tool that connects what you wrote to how it performed. |
| Data-aware generation | N/A | Keyword suggestions based on trends | Tag/title optimization | Analyzes viral videos for script ideas | AI suggests optimizations from metrics | Injects YOUR channel's raw metrics into generation. Not generic trends -- personal performance data. |
| Performance-to-content feedback | Viewer retention graph + "Key moments" labels | Competitor benchmarking | A/B test thumbnails | Viral score prediction | Pattern suggestions | Format-to-performance mapping. Which script FORMAT works best, not just which video. |
| Small channel focus | Generic (same UI for 55 and 55M subs) | Mostly targets growth-stage channels | Mostly targets growth-stage channels | Targets idea generation | Targets marketing teams | Purpose-built for small creator: no empty dashboards, no suppressed data panels, honest "not enough data yet" messaging. |

**Key insight:** No existing tool connects script content to video performance in a feedback loop. YouTube Studio shows metrics but has no concept of "script." Subscribr generates scripts from viral trends but does not track YOUR performance. Our integration is the only one where script format + metrics + AI generation form a closed loop.

## Sources

- [YouTube Analytics API metrics reference (official)](https://developers.google.com/youtube/analytics/metrics) -- metric definitions and availability (HIGH confidence)
- [YouTube Analytics channel reports (official)](https://developers.google.com/youtube/analytics/channel_reports) -- report types including retention (HIGH confidence)
- [YouTube Analytics data model (official)](https://developers.google.com/youtube/analytics/data_model) -- data thresholds for small channels (HIGH confidence)
- [YouTube Studio: Measure key moments for audience retention](https://support.google.com/youtube/answer/9314415) -- how Studio displays retention curves (HIGH confidence)
- [YouTube Content tab analytics - Shorts](https://support.google.com/youtube/answer/12942217) -- Shorts-specific metrics in Studio (HIGH confidence)
- [YouTube Blog: 4 metrics to help grow your channel](https://blog.youtube/creator-and-artist-stories/master-these-4-metrics/) -- YouTube's own metric recommendations (HIGH confidence)
- [TubeBuddy: YouTube Analytics for Small Channels](https://www.tubebuddy.com/blog/youtube-analytics-for-small-channels-which-ones-matter-and-what-they-mean) -- which metrics matter under 1K subs (MEDIUM confidence)
- [Joyspace: YouTube Shorts Analytics 2026 - 3 Metrics That Predict Growth](https://joyspace.ai/youtube-shorts-analytics-metrics-growth) -- APV thresholds for Shorts (MEDIUM confidence)
- [Buffer: The Creator's Guide to YouTube Shorts Analytics](https://buffer.com/resources/the-creators-guide-to-youtube-shorts-analytics/) -- Shorts analytics overview (MEDIUM confidence)
- [TubeBuddy: YouTube Shorts View Count Update](https://www.tubebuddy.com/blog/youtube-shorts-view-count-update-what-creators-need-to-know-about-the-new-metrics/) -- March 2025 views vs engaged views change (MEDIUM confidence)
- [Zapier: 14 YouTube Metrics You Should Focus On in 2026](https://zapier.com/blog/youtube-metrics/) -- metric prioritization guidance (MEDIUM confidence)
- [VidIQ: YouTube Shorts Algorithm 2026](https://vidiq.com/blog/post/youtube-shorts-algorithm/) -- algorithm signals for Shorts (MEDIUM confidence)
- [Virvid: How to Read Retention Graphs 2026](https://virvid.ai/blog/retention-graphs-how-to-read-youtube-analytics-2026) -- retention graph UX patterns (MEDIUM confidence)

---
*Feature research for: YouTube Analytics integration into Devlog Scriptwriter Pipeline (v2.1)*
*Researched: 2026-03-29*
