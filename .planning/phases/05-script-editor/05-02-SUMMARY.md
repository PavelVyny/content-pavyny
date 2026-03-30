---
phase: 05-script-editor
plan: 02
subsystem: ui
tags: [next.js, react, claude-agent-sdk, anti-slop, regeneration, scoring, server-actions]

# Dependency graph
requires:
  - phase: 05-script-editor
    provides: "Editor page route, click-to-edit beat cards, hook variant tabs, server actions (updateBeat, updateHook, selectHook)"
provides:
  - "regenerateBeatText and rescoreScriptText AI agent functions"
  - "regenerateBeat and rescoreScript server actions"
  - "ScorePanel component with stale indicator and Rescore button"
  - "Per-beat regenerate buttons on beat cards"
  - "Edit link from generation page ScriptDisplay to /script/[id]"
affects: [06-library-workflow, script-editor]

# Tech tracking
tech-stack:
  added: []
  patterns: ["AI regeneration with full script context for single-beat replacement", "stale score tracking with manual rescore trigger", "onMouseDown preventDefault to avoid blur race condition"]

key-files:
  created:
    - src/components/score-panel.tsx
  modified:
    - src/lib/agent.ts
    - src/app/actions/editor.ts
    - src/components/script-editor.tsx
    - src/components/script-display.tsx

key-decisions:
  - "Score panel scrolls with page (not sticky) to avoid layout complexity on small screens"
  - "Regenerate button always visible on beat cards (not hover-only) for discoverability"
  - "onMouseDown preventDefault on regenerate button prevents blur-firing race condition with active textareas"

patterns-established:
  - "AI context pattern: pass all beats + hooks + format + devContext to Claude for single-beat regeneration, ensuring coherence"
  - "Stale score UX: yellow badge appears after any text edit, cleared only after explicit Rescore action"

requirements-completed: [EDIT-04, EDIT-05]

# Metrics
duration: 8min
completed: 2026-03-28
---

# Phase 5 Plan 02: Beat Regeneration, Anti-Slop Rescoring, and Score Panel Summary

**Per-beat AI regeneration with full script context, 5-dimension anti-slop score panel with stale/rescore workflow, and Edit link bridging generation page to editor**

## Performance

- **Duration:** 8 min (continuation from checkpoint approval)
- **Started:** 2026-03-28T15:27:07Z
- **Completed:** 2026-03-28T15:35:00Z
- **Tasks:** 3 (2 auto + 1 checkpoint)
- **Files modified:** 5

## Accomplishments
- Two AI agent functions (regenerateBeatText, rescoreScriptText) that use full script context for coherent single-beat regeneration and 5-dimension anti-slop rescoring
- ScorePanel component with live total, 5-dimension grid, stale indicator badge, and Rescore button with spinner feedback
- Regenerate icon button on every beat card -- replaces that beat's text via AI while preserving all other beats
- Edit link on ScriptDisplay bridging the generation page to the editor at /script/[id]
- All 5 EDIT requirements (EDIT-01 through EDIT-05) now satisfied across Plans 01 and 02

## Task Commits

Each task was committed atomically:

1. **Task 1: Agent functions and server actions for regeneration and rescoring** - `bac7afa` (feat)
2. **Task 2: Score panel component, regenerate buttons, and Edit link** - `7636888` (feat)
3. **Task 3: Verify complete editor workflow** - checkpoint approved (no commit, human verification)

**Plan metadata:** TBD (docs: complete plan)

## Files Created/Modified
- `src/lib/agent.ts` - Added regenerateBeatText and rescoreScriptText functions using Claude Agent SDK
- `src/app/actions/editor.ts` - Added regenerateBeat and rescoreScript server actions with DB persistence
- `src/components/score-panel.tsx` - New component: 5-dimension anti-slop score display with stale badge and Rescore button
- `src/components/script-editor.tsx` - Added regenerate buttons on beat cards, wired ScorePanel, added localScore state
- `src/components/script-display.tsx` - Added Edit link to /script/[id] via Next.js Link

## Decisions Made
- Score panel scrolls with page (not sticky) to keep layout simple on small screens
- Regenerate button always visible (not hover-only) for better discoverability
- Used onMouseDown with preventDefault on regenerate button to prevent blur race condition with active textareas

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All 5 EDIT requirements complete -- Phase 5 (Script Editor) is done
- Ready to proceed to Phase 6 (Library & Workflow): script list page, status management, clipboard export
- Editor provides the foundation for any future enhancements (batch regeneration, version history)

## Self-Check: PASSED

All 5 created/modified files verified present. Both task commits (bac7afa, 7636888) verified in git log.

---
*Phase: 05-script-editor*
*Completed: 2026-03-28*
