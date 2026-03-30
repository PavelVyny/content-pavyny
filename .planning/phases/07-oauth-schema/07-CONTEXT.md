# Phase 7: OAuth & Schema - Context

**Gathered:** 2026-03-29
**Status:** Ready for planning

<domain>
## Phase Boundary

Deliver YouTube OAuth2 connection flow from a new settings page, persistent token storage, connection status visible across the app, and database schema for videos and metrics. No metrics fetching or dashboard — that's Phase 8.

</domain>

<decisions>
## Implementation Decisions

### Settings Page Design
- **D-01:** Settings page accessed via gear icon in header nav (not text link). Gear icon placed next to existing Generate/Scripts nav links.
- **D-02:** Settings page uses sectioned layout — YouTube Integration section now, with structure ready for future sections. No empty placeholder sections.
- **D-03:** After connecting, settings shows a card with channel details: channel name, avatar, subscriber count, video count, last sync time, and Disconnect button.

### Connection Status Indicator
- **D-04:** YouTube logo icon in the header (separate from gear icon). Clickable — navigates to settings page.
- **D-05:** Three states: connected = YouTube red (#FF0000) icon, disconnected = gray icon, token expired = red icon with warning indicator.
- **D-06:** Icon is always visible in the header layout, next to the nav area.

### Token Expiry Handling
- **D-07:** When token expires, YouTube icon goes to expired state (red with warning). No banner or modal — minimal disruption.
- **D-08:** Clicking the expired-state icon navigates to settings where user can reconnect with one click.
- **D-09:** App remains fully functional when disconnected — metrics features simply show "not connected" state. Never block script generation.

### DB Schema
- **D-10:** `scriptId` FK on videos table (video points to its script). Claude's discretion based on query patterns — videos are discovered from YouTube, then optionally linked to scripts.
- **D-11:** `video_metrics` stores latest aggregates per video (one row per video, overwritten on sync). YouTube Analytics API provides daily breakdowns via `dimensions=day` — no need to duplicate time-series in DB. Historical charts query the API directly.
- **D-12:** Retention curve data stored as JSON text column in video_metrics (100-point array from audienceWatchRatio).

### Claude's Discretion
- FK direction: `scriptId` on videos table chosen because videos are discovered from YouTube independently, then linked to scripts. Videos exist without scripts; scripts exist without videos.
- Metrics storage: latest aggregates per video (not time-series snapshots). YouTube Analytics API provides daily breakdowns natively via `dimensions=day` queries — historical charts in Phase 8 will query the API directly instead of duplicating data in SQLite.
- Token storage: local JSON file (`data/.youtube-tokens.json`) per architecture research recommendation. Separate from SQLite — simpler for OAuth token lifecycle.
- OAuth callback route: `app/api/youtube/callback/route.ts` — standard Next.js API route for server-side token exchange.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Existing Codebase
- `src/lib/db/schema.ts` — Current Drizzle schema (scripts + beats tables). New tables must follow same patterns.
- `src/app/layout.tsx` — Header layout with nav links. YouTube icon and gear icon integrate here.
- `src/app/actions/` — Server actions pattern. OAuth and YouTube actions follow this.
- `drizzle.config.ts` — Drizzle config for schema push.
- `web/AGENTS.md` — Next.js 16 breaking changes warning. Read Next.js docs before writing code.

### Research
- `.planning/research/ARCHITECTURE.md` — Full architecture: googleapis setup, OAuth flow, schema design, build order
- `.planning/research/PITFALLS.md` — Critical: 7-day token expiry, wrong API choice, retention API limitations
- `.planning/research/STACK.md` — googleapis ^171.4.0 + recharts ^3.8.1 (recharts is Phase 8, not this phase)

### Environment
- `.env` — YouTube API key and OAuth client ID/secret already configured

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `components/ui/` — shadcn/ui components (Button, Card, etc.) for settings page
- `components/providers.tsx` — React context providers wrapper
- `lib/db/` — Drizzle ORM setup with better-sqlite3

### Established Patterns
- Server actions in `app/actions/` for data mutations
- `drizzle-kit push` for dev-mode schema sync (no migration files)
- JetBrains Mono font, max-w-4xl layout, zinc color scheme
- Light theme only, desktop-focused

### Integration Points
- Header nav in `layout.tsx` — add gear icon + YouTube status icon
- `lib/db/schema.ts` — add videos + video_metrics tables
- New route: `app/settings/page.tsx`
- New API route: `app/api/youtube/callback/route.ts`
- New lib: `lib/youtube-client.ts` (OAuth2 client, token management)

</code_context>

<specifics>
## Specific Ideas

- YouTube icon must use the actual YouTube logo shape, not a generic video icon
- Connected state: YouTube brand red (#FF0000)
- Disconnected state: gray (zinc-400 or similar)
- Token expired: YouTube red with small warning badge/indicator
- Channel card on settings page should feel like a mini YouTube Studio widget — avatar, name, stats

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 07-oauth-schema*
*Context gathered: 2026-03-29*
