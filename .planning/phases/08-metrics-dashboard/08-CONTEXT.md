# Phase 8: Metrics & Dashboard - Context

**Gathered:** 2026-03-29
**Status:** Ready for planning

<domain>
## Phase Boundary

Deliver sync engine to fetch YouTube video data and metrics, display them alongside scripts on the existing scripts page, show retention curves, and enable script-to-video linking. No separate dashboard page — metrics extend the existing scripts experience.

</domain>

<decisions>
## Implementation Decisions

### Dashboard Layout
- **D-01:** No new page. Metrics extend the existing `/scripts` page. No new nav link needed.
- **D-02:** Each script row in the table gets an expandable metrics card below it. Click chevron (▼) to expand, click again to collapse.
- **D-03:** Replace the existing copy-to-clipboard action button with a chevron (▼/▲) expand/collapse toggle. Chevron is an arrow without tail (pure triangle/caret).
- **D-04:** Expanded card shows: views, retention %, subs gained, likes, comments, and a retention sparkline. Only visible for scripts linked to a video.

### Sync UX
- **D-05:** "Sync Now" button lives on the `/scripts` page (not settings). Near the top, next to the staleness indicator.
- **D-06:** Sync progress shows count: "Syncing 3/6 videos..." with a progress indicator. Not just a spinner.
- **D-07:** Staleness indicator: green (<1h), yellow (<24h), red (>24h). Shows "Last synced: X ago" text.
- **D-08:** Sync button disabled while already syncing. Error state shows brief message, doesn't block the page.

### Retention Chart
- **D-09:** Small sparkline (~100px wide) inside the expanded metrics card. Shows the retention curve shape at a glance.
- **D-10:** Click sparkline to expand to full-size chart (full card width). X-axis = video %, Y-axis = retention %.
- **D-11:** Use recharts `<LineChart>` / `<ResponsiveContainer>` for both sparkline and expanded views.

### Script-Video Linking
- **D-12:** Link/unlink dropdown on the script editor page (`/script/[id]`), not on the scripts list.
- **D-13:** Dropdown shows unlinked YouTube videos (title + publish date). Selecting one creates the link (sets `scriptId` FK on videos table).
- **D-14:** Unlink option available when already linked. Unlink sets `scriptId` to null.

### Claude's Discretion
- Sync implementation details: how youtube-client.ts methods are structured for batch video fetch + per-video metrics
- API call ordering: batch basic metrics first, then per-video retention curves
- Expanded card layout and spacing within the scripts table
- Error handling patterns for API failures during sync

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Existing Codebase (Phase 7 outputs)
- `web/src/lib/youtube-client.ts` — OAuth2 client singleton, token management. Needs new methods: listChannelVideos, getVideoMetrics, getRetentionData
- `web/src/lib/db/schema.ts` — videos + videoMetrics tables (Phase 7). Sync writes here.
- `web/src/app/actions/youtube.ts` — Existing server actions for YouTube. Add sync actions here.
- `web/src/components/scripts-table.tsx` — Current scripts table. Modify to add expandable rows + metrics cards.
- `web/src/components/score-panel.tsx` — Existing pattern for detail panels in the editor.
- `web/src/app/script/[id]/page.tsx` or `web/src/components/script-editor.tsx` — Script editor page. Add video linking dropdown here.

### Research
- `.planning/research/ARCHITECTURE.md` — System diagram, data flows, API call patterns
- `.planning/research/FEATURES.md` — Feature landscape, dependency chain, anti-features
- `.planning/research/PITFALLS.md` — Retention per-video limitation, data suppression, API confusion

### Environment
- `web/.env` — YouTube API credentials
- `web/AGENTS.md` — Next.js 16 breaking changes warning

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `youtube-client.ts` — Already has OAuth2, token management, getChannelInfo(). Needs sync methods added.
- `scripts-table.tsx` — Current table with status dropdown. Expand to add chevron + metrics row.
- `components/ui/` — shadcn/ui Button, Card, Badge for metrics display.
- Drizzle ORM — existing query patterns in `app/actions/` for DB operations.

### Established Patterns
- Server actions in `app/actions/` for mutations
- `revalidatePath` after data changes (fixed in Phase 7)
- `drizzle-kit push` for schema sync
- Status dropdown pattern (native HTML select) from scripts table

### Integration Points
- `scripts-table.tsx` — add expandable row with metrics card
- `youtube-client.ts` — add API methods for video listing + metrics
- `app/actions/` — new `metrics.ts` for sync operations
- `script editor page` — add video linking dropdown
- `recharts` — new dependency for retention charts (install in this phase)

</code_context>

<specifics>
## Specific Ideas

- Chevron (▼/▲) replaces the copy-to-clipboard button on scripts table rows. Pure caret/triangle without tail.
- Expanded metrics card should feel lightweight — not a full separate card, more like an expanded detail row.
- Sync progress: "Syncing 3/6 videos..." text updates as each video completes.
- Retention sparkline: small, clean, no axes visible. Just the line shape. Click to see full chart with axes.
- Video linking dropdown: show video title + date so user can identify which video is which.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 08-metrics-dashboard*
*Context gathered: 2026-03-29*
