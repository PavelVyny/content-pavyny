# Phase 5: Script Editor - Context

**Gathered:** 2026-03-28
**Status:** Ready for planning

<domain>
## Phase Boundary

Dual-track beat editor for generated scripts. Pavlo can view and edit any script as visual/voiceover beat blocks, switch hook variants, regenerate individual beats, and see anti-slop quality scoring. Phase ends when all five EDIT requirements are satisfied.

</domain>

<decisions>
## Implementation Decisions

### Edit Interaction
- **D-01:** Click-to-edit — beat text displays as normal text, clicking switches that field to a textarea. Save on blur (no save button). Notion-style.
- **D-02:** Editor lives on a separate page at `/script/[id]`. Generation page (`/`) stays simple. Phase 6 library will link directly to editor.

### Beat Regeneration
- **D-03:** Each beat card has a small icon button (refresh/sparkle) in the top-right corner for regeneration. Always visible, not hover-only.
- **D-04:** When regenerating a single beat, AI receives full script context (all beats + dev context + format) to ensure the regenerated beat fits the flow.

### Hook Variant Switching
- **D-05:** Tab bar (A / B / C) above the beats list. Switching tabs shows that variant's visual+voiceover content. Instant switching, no page reload.
- **D-06:** Hooks stay separate from the beats list — they are NOT beat #1. Hook section sits above the beats section in the editor layout.
- **D-07:** Hook variant content is also click-to-edit (same interaction as beat editing). Edits to hook text save on blur.

### Anti-Slop Score
- **D-08:** Manual rescore — a "Rescore" button next to the score panel. Score shows a "stale" indicator after any beat or hook text is edited. Avoids constant AI calls during editing.
- **D-09:** Score panel scrolls with the page (not sticky sidebar). Simple single-column layout.

### Claude's Discretion
- Loading state during single-beat regeneration (spinner, skeleton, etc.)
- Error handling for failed regeneration or rescoring
- Visual feedback for click-to-edit transitions (border, background change)
- Textarea auto-height behavior
- Server action design for `updateBeat`, `regenerateBeat`, `rescoreScript`, `updateHook`, `selectHook`
- Exact layout proportions and spacing

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Existing App (Phase 4 output)
- `web/src/components/script-display.tsx` — Current read-only beat display (reference for layout patterns, will be superseded by editor)
- `web/src/components/generation-page.tsx` — Client wrapper managing form/display toggle
- `web/src/app/actions/generate.ts` — Existing server actions (generateNewScript, regenerateScript, deleteScript)
- `web/src/lib/types.ts` — Script, ScriptBeat, HookVariant, AntiSlopScore interfaces
- `web/src/lib/db/schema.ts` — Drizzle schema (scripts + beats tables)
- `web/src/lib/agent.ts` — Agent SDK wrapper for script generation
- `web/src/lib/db/index.ts` — Database connection

### UI Components
- `web/src/components/ui/card.tsx` — Card component (used extensively in ScriptDisplay)
- `web/src/components/ui/badge.tsx` — Badge component
- `web/src/components/ui/button.tsx` — Button component
- `web/src/components/ui/textarea.tsx` — Textarea component (needed for editing)

### Reference Files (loaded at runtime)
- `.claude/skills/devlog-scriptwriter/references/brand-voice.md` — Voice profile
- `.claude/skills/devlog-scriptwriter/references/anti-slop-rules.md` — Scoring rubric
- `.claude/skills/devlog-scriptwriter/references/video-formats.md` — 7 format templates

### Prior Phase Context
- `.planning/phases/04-foundation-generation/04-CONTEXT.md` — Stack decisions, design choices, AI backend approach

### Next.js Documentation
- `web/node_modules/next/dist/docs/` — Next.js 16 guides (AGENTS.md warns: read before writing code)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `ScriptDisplay` component — current beat rendering pattern (Card + grid-cols-2 for visual/voiceover). Editor will follow similar layout but add interactivity.
- `Card`, `Badge`, `Button`, `Textarea`, `Separator` shadcn/ui components — all available
- `scoreColor()` helper — green/yellow/red based on total score
- `statusColor()` helper — badge variant by script status
- Anti-slop score panel — already renders 5-dimension grid with total score

### Established Patterns
- Server actions in `app/actions/generate.ts` — use Drizzle ORM, return typed results, call `revalidatePath`
- Client components with `"use client"` directive for interactive features
- `GenerationPage` wraps state management (form/display toggle) as client component
- Agent SDK integration via `generateScript()` in `lib/agent.ts`
- Beats stored as separate rows in `beats` table with `scriptId` foreign key and `order` field

### Integration Points
- New route: `app/script/[id]/page.tsx` — editor page
- New server actions: `updateBeat`, `regenerateBeat`, `rescoreScript`, `updateHook`, `selectHook`
- `ScriptDisplay` will remain for read-only view on generation page; editor is separate
- Phase 6 library page will link to `/script/[id]` for editing

</code_context>

<specifics>
## Specific Ideas

- Hook variants are editable just like beats — same click-to-edit interaction
- "Stale" indicator on score panel gives Pavlo visual cue to rescore after edits
- Full script context sent during single-beat regeneration ensures coherent output
- Tab bar for hooks should feel native — shadcn Tabs component or similar

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 05-script-editor*
*Context gathered: 2026-03-28*
