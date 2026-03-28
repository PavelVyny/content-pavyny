# Phase 6: Library & Workflow - Context

**Gathered:** 2026-03-28
**Status:** Ready for planning

<domain>
## Phase Boundary

Script library page for browsing all saved scripts, changing their status (draft/ready/recorded), and copying voiceover text to clipboard for recording sessions. Phase ends when all three LIBR requirements are satisfied.

</domain>

<decisions>
## Implementation Decisions

### Script List Layout
- **D-01:** Dedicated `/scripts` route with nav link in header alongside "Generate".
- **D-02:** Table row layout — compact, shows title, format, date, status, anti-slop score at a glance.
- **D-03:** Status change via inline dropdown in table row — quick, no navigation required.
- **D-04:** Sort by creation date (newest first). No additional filters needed for current script volume.

### Copy & Navigation
- **D-05:** Copy icon button in each table row — one click copies voiceover text, no navigation needed.
- **D-06:** Copy content: all beats voiceover text only, one per line, separated by blank lines. Clean recording reference format.
- **D-07:** Header navigation with simple links: "Generate" + "Scripts".
- **D-08:** Script title in table row is a clickable link to `/script/[id]` editor page.

### Claude's Discretion
- Table column widths and responsive behavior
- Copy success feedback (toast notification pattern already exists via sonner)
- Empty state design when no scripts exist
- Status badge colors for draft/ready/recorded states (existing Badge component + statusColor helper)
- Date formatting

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Existing App (Phase 4+5 output)
- `web/src/lib/types.ts` — Script, ScriptBeat, AntiSlopScore interfaces
- `web/src/lib/db/schema.ts` — Drizzle schema (scripts + beats tables, status enum)
- `web/src/lib/db/index.ts` — Database connection
- `web/src/app/actions/generate.ts` — Existing server actions pattern
- `web/src/app/actions/editor.ts` — Server actions from Phase 5
- `web/src/components/script-display.tsx` — scoreColor and statusColor helpers (reuse)
- `web/src/components/ui/badge.tsx` — Badge component
- `web/src/components/ui/select.tsx` — Select component (for status dropdown)
- `web/src/app/layout.tsx` — Layout with header (add nav links here)
- `web/src/app/page.tsx` — Generation page

### Prior Phase Context
- `.planning/phases/04-foundation-generation/04-CONTEXT.md` — Stack decisions
- `.planning/phases/05-script-editor/05-CONTEXT.md` — Editor design decisions

### Next.js Documentation
- `web/node_modules/next/dist/docs/` — Next.js 16 guides

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `scoreColor()` helper in script-display.tsx — green/yellow/red based on score
- `statusColor()` helper — badge variant by script status
- `Badge`, `Button`, `Select` shadcn/ui components
- `Sonner` toast component (already in layout for copy success feedback)
- Drizzle ORM queries in generate.ts/editor.ts — pattern for new queries

### Established Patterns
- Server actions in `app/actions/` with typed results
- `revalidatePath` after mutations
- Client components with `"use client"` for interactive features
- `getDb()` for database access

### Integration Points
- New route: `app/scripts/page.tsx` — list page
- New server action: `updateScriptStatus` in editor.ts or new file
- Layout header: add "Scripts" nav link
- Table rows link to `/script/[id]` (Phase 5 editor page)

</code_context>

<specifics>
## Specific Ideas

- Copy should use `navigator.clipboard.writeText()` with sonner toast confirmation
- Status dropdown should immediately update without page reload (optimistic UI)

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 06-library-workflow*
*Context gathered: 2026-03-28*
