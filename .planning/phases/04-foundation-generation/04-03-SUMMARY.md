---
phase: 04-foundation-generation
plan: 03
subsystem: generation-ui
tags: [nextjs, shadcn, react-client, server-actions, agent-sdk, json-output]

# Dependency graph
requires:
  - phase: 04-foundation-generation
    plan: 01
    provides: Next.js app scaffold, SQLite schema, shared types, reference reader
  - phase: 04-foundation-generation
    plan: 02
    provides: Agent SDK wrapper (generateScript), Server Actions, ScriptOutputSchema
provides:
  - GenerateForm component (format selector + dev context input + generate button)
  - FormatCard component (selectable card for each of 7 formats)
  - LoadingState component (elapsed time counter during generation)
  - ScriptDisplay component (beats/hooks/titles/score in Notion-style layout)
  - GenerationPage client wrapper wiring form state and script display
  - Home page (server component) passing formats and latest script to client
affects: [05-script-editor, 06-library-workflow]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Server component passes data to client wrapper (GenerationPage)
    - useRouter().refresh() after generation to reload server-fetched script
    - JSON prompt approach in agent.ts replacing markdown-parsing strategy
    - Delete + new script actions for debugging and re-generation flows

key-files:
  created:
    - src/components/generate-form.tsx
    - src/components/format-card.tsx
    - src/components/loading-state.tsx
    - src/components/script-display.tsx
    - src/components/generation-page.tsx
  modified:
    - src/app/page.tsx
    - src/lib/agent.ts
    - src/app/actions/generate.ts

key-decisions:
  - "Rewrote agent.ts from markdown-parsing to JSON-prompt approach after checkpoint revealed parsing failures"
  - "Added deleteScript and newScript server actions during debugging to support full re-generation cycle"
  - "GenerationPage client component wraps form + display state, home page remains server component"

patterns-established:
  - "JSON prompt: instruct Claude to output raw JSON only, parse with JSON.parse() + try/catch, no markdown stripping needed"
  - "useRouter().refresh() triggers server re-render to load newly persisted script after generation"
  - "FormatCard selected state: border-primary bg-primary/5 ring, unselected: hover:border-muted-foreground/30"

requirements-completed: [GENR-01, GENR-02, GENR-03]

# Metrics
duration: ~90min
completed: 2026-03-28
---

# Phase 4 Plan 03: Generation UI Summary

**Complete generation UI with format selector, dev context input, loading state with timer, and structured script display — after agent.ts was rewritten from markdown-parsing to JSON-prompt approach during Pavlo's checkpoint test**

## Performance

- **Duration:** ~90 min
- **Completed:** 2026-03-28
- **Tasks:** 3 (2 auto + 1 checkpoint:human-verify)
- **Files created:** 5
- **Files modified:** 3

## Accomplishments

- Created `FormatCard` — selectable shadcn Card with format name, description, beat count badge; selected state uses `border-primary bg-primary/5`
- Created `LoadingState` — centered card with animated pulse, "Generating your script..." message, elapsed time counter via `setInterval`
- Created `GenerateForm` — client component with format grid, dev context textarea, generate button; shows `LoadingState` during generation, calls `generateNewScript` server action on submit
- Created `ScriptDisplay` — client component rendering 7 sections: Header, Title Options, Hook Variants (3), Script Beats (ordered), Anti-Slop Score (5-dimension breakdown), Thumbnail Concept, Actions (Re-generate)
- Created `GenerationPage` — client wrapper managing form/display state, wires `onScriptGenerated` to `router.refresh()` and `onRegenerate` back to form
- Updated `src/app/page.tsx` — server component fetching formats + latest script, rendering GenerationPage with props
- Rewrote `src/lib/agent.ts` — switched from markdown-parsing strategy to JSON-prompt strategy; Claude prompted to output raw JSON block only, parsed with `JSON.parse()` inside try/catch
- Added `deleteScript` and `newScript` server actions to `generate.ts` to support delete-then-regenerate flow discovered during end-to-end testing

## Task Commits

1. **Task 1: Generation form with format selector and loading state** - `9109b30` (feat)
2. **Task 2: Script display component with beats, hooks, titles, and score** - `568dcdb` (feat)
3. **Task 3 checkpoint + fixes: Rewrite agent.ts for JSON output, add actions, fix UI state** - `f75aa0e` (fix)

## Files Created

- `src/components/format-card.tsx` - Selectable format card: shadcn Card, selected ring style, onClick handler
- `src/components/loading-state.tsx` - Loading indicator: animated pulse, elapsed seconds counter via setInterval
- `src/components/generate-form.tsx` - Generation form: 7-card grid, dev context textarea, generate/regenerate button, loading state swap
- `src/components/script-display.tsx` - Script display: header, title options, hook variants (3), beats (visual+voiceover grid), anti-slop score, thumbnail, re-generate action
- `src/components/generation-page.tsx` - Client state wrapper: form vs display mode, router.refresh() after generation

## Decisions Made

- Rewrote `agent.ts` from markdown-parsing to JSON-prompt approach: the original implementation tried to extract JSON from markdown code fences which failed reliably; new approach instructs Claude to output only raw JSON, parsed directly with `JSON.parse()`
- Added `deleteScript` and `newScript` to `generate.ts` during debugging — these became part of the permanent API supporting clean re-generation cycles
- `GenerationPage` client component owns form/display toggle state while `page.tsx` stays as a server component that fetches formats and latest script

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Rewrote agent.ts from markdown-parsing to JSON-prompt approach**
- **Found during:** Task 3 checkpoint — Pavlo tested end-to-end generation and reported parsing failures
- **Issue:** Original `agent.ts` attempted to strip markdown fences from Claude output and parse the resulting string as JSON. Claude's responses included varied formatting (extra text, different fence styles) causing `JSON.parse()` to throw on most responses.
- **Fix:** Rewrote the system prompt and user prompt in `agent.ts` to instruct Claude to output only a raw JSON object with no surrounding text or markdown. Response is parsed directly with `JSON.parse()` in a try/catch block. If parsing fails, the script is marked as `failed` in the DB.
- **Files modified:** `src/lib/agent.ts`
- **Commit:** f75aa0e

**2. [Rule 2 - Missing Functionality] Added deleteScript and newScript server actions**
- **Found during:** Task 3 checkpoint — debugging required ability to delete a broken script and start fresh
- **Issue:** No way to clear broken generated scripts or start a new generation without the form being locked to the last result
- **Fix:** Added `deleteScript(scriptId: number)` and `newScript()` server actions to `generate.ts`; wired into `GenerationPage` UI for delete/new buttons
- **Files modified:** `src/app/actions/generate.ts`, `src/components/generate-form.tsx`, `src/components/generation-page.tsx`
- **Commit:** f75aa0e

---

**Total deviations:** 2 auto-fixed (1 bug, 1 missing functionality)
**Impact on plan:** Core agent parsing was a critical fix. New actions add permanent utility beyond debugging.

## Checkpoint

**Task 3: Verify end-to-end generation flow**
- Pavlo tested: selected format, entered dev context, triggered generation
- Found: parsing errors caused generation to fail silently
- Agent: rewrote agent.ts (fix commit f75aa0e)
- Outcome: Pavlo approved after fixes — generation flow works end-to-end

## Known Stubs

None — all UI sections wire to real data from the database. Anti-slop score, beats, hooks, titles, and thumbnail all render from actual AI-generated output stored in SQLite.

## Next Phase Readiness

- Phase 05 (Script Editor) can import `ScriptDisplay` as a read-only baseline and extend with editable beat cards
- The `regenerateScript` server action is ready; `deleteScript` and `newScript` are available for editor flows
- `GenerationPage` pattern (client wrapper + server data fetch) can be reused in Phase 06 library view

## Self-Check: PASSED
