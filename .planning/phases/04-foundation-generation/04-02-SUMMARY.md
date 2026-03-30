---
phase: 04-foundation-generation
plan: 02
subsystem: ai-backend
tags: [claude-agent-sdk, zod, structured-output, server-actions, drizzle]

# Dependency graph
requires:
  - phase: 04-foundation-generation
    plan: 01
    provides: Next.js app scaffold, SQLite schema (scripts + beats), shared types, reference reader
provides:
  - Agent SDK wrapper (generateScript) with structured JSON output via json_schema
  - Server Actions (generateNewScript, regenerateScript) for generation and DB persistence
  - ScriptOutputSchema Zod schema for validating AI output
affects: [04-03, 05-script-editor, 06-library-workflow]

# Tech tracking
tech-stack:
  added: []
  patterns: [Agent SDK query() with structured output, Server Action with placeholder-then-update pattern, drizzle returning().get() for single-row insert]

key-files:
  created:
    - src/lib/agent.ts
    - src/app/actions/generate.ts
  modified: []

key-decisions:
  - "Used z.toJSONSchema() to convert Zod schema to JSON Schema for Agent SDK outputFormat"
  - "Used drizzle returning().get() instead of destructured array for SQLite single-row insert"

patterns-established:
  - "Agent SDK wrapper: query() with settingSources, systemPrompt preset, allowedTools, outputFormat, permissionMode"
  - "Placeholder-then-update: insert with status 'generating', update on success or mark as failed on error"
  - "Re-generation: delete old beats, re-run agent, save new results to same script row"

requirements-completed: [APFN-03, GENR-02]

# Metrics
duration: 3min
completed: 2026-03-28
---

# Phase 4 Plan 02: AI Generation Backend Summary

**Agent SDK wrapper with structured JSON output and server actions for script generation, persistence, and re-generation**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-28T10:23:09Z
- **Completed:** 2026-03-28T10:25:36Z
- **Tasks:** 2
- **Files created:** 2

## Accomplishments

- Created Agent SDK wrapper (`generateScript`) that spawns Claude Code with devlog-scriptwriter skill access, configured with settingSources: ["project"], structured JSON output via outputFormat, Read-only tool permissions, and 5-turn limit
- Created Server Action `generateNewScript` that validates input, inserts a placeholder row with "generating" status, calls the agent, and persists hooks/beats/titles/score to the database
- Created Server Action `regenerateScript` that deletes existing beats, re-runs generation, and updates the script row (satisfies GENR-03)
- Both files compile cleanly with TypeScript (skipLibCheck for third-party SDK type issues)

## Task Commits

1. **Task 1: Agent SDK wrapper with structured output** - `df8209d` (feat)
2. **Task 2: Server Action for generation and DB persistence** - `809837e` (feat)

## Files Created

- `src/lib/agent.ts` - Agent SDK wrapper: ScriptOutputSchema (Zod), generateScript() with query(), structured output validation
- `src/app/actions/generate.ts` - Server Actions: generateNewScript (FormData), regenerateScript (scriptId + params), placeholder-then-update pattern, error handling

## Decisions Made

- Used `z.toJSONSchema()` (available in Zod v4) to convert the Zod schema to JSON Schema format for the Agent SDK's `outputFormat` option
- Used `returning().get()` instead of destructured `[script]` for the placeholder insert, since Drizzle's SQLite driver returns a query builder that needs explicit execution

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed drizzle returning() API usage**
- **Found during:** Task 2 (verification)
- **Issue:** Plan showed `const [script] = db.insert(scripts).values({...}).returning()` but Drizzle's SQLite driver returns a query builder from `.returning()`, not an iterable array
- **Fix:** Changed to `.returning().get()` which executes the query and returns a single row
- **Files modified:** `src/app/actions/generate.ts`
- **Committed in:** 809837e (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Minor API correction. No scope creep.

## Known Stubs

None - both files are complete implementations. The agent.ts wrapper will produce real output when called with a valid Max subscription auth. The server actions correctly wire agent output to database persistence.

## Next Phase Readiness

- Plan 04-03 can build the generation form UI that calls `generateNewScript` via form action
- The `regenerateScript` function is ready for the script editor in Phase 5
- ScriptOutputSchema can be imported by any component that needs to understand the AI output shape

## Self-Check: PASSED
