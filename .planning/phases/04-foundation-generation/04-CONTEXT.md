# Phase 4: Foundation & Generation - Context

**Gathered:** 2026-03-27
**Status:** Ready for planning

<domain>
## Phase Boundary

Scaffold a Next.js 16 web app with SQLite database, Claude Agent SDK integration (Max subscription), and end-to-end script generation flow. Phase ends when Pavlo can open the app, select a format, enter dev progress, generate a script, and see it saved in the database.

</domain>

<decisions>
## Implementation Decisions

### AI Backend (locked from earlier discussion)
- **D-01:** Use Claude Agent SDK (`@anthropic-ai/claude-agent-sdk`) which spawns Claude Code CLI as subprocess. This uses Pavlo's Max subscription — zero additional API cost.
- **D-02:** The Agent SDK automatically loads the devlog-scriptwriter skill from `.claude/skills/` because it spawns Claude Code in the project directory.
- **D-03:** No streaming — full response with loading state. Agent SDK returns complete result, web app parses structured output.

### Design (locked from earlier discussion)
- **D-04:** Clean light theme, Notion-style. shadcn/ui v4 components.
- **D-05:** No dark mode toggle — single theme.

### Stack (locked from research)
- **D-06:** Next.js 16 with App Router, Tailwind CSS, TypeScript.
- **D-07:** SQLite with Drizzle ORM and better-sqlite3. Scripts stored as structured beats (separate rows/JSON column), not text blobs.
- **D-08:** Reference files (brand-voice.md, anti-slop-rules.md, video-formats.md) read from `.claude/skills/devlog-scriptwriter/references/` at runtime via `fs.readFileSync`. Shared source of truth with CLI.

### Claude's Discretion
- Project structure (root vs subfolder vs monorepo) — Claude decides based on best practices
- Generation form layout and UX — Claude designs based on the requirements
- Prompt construction for Agent SDK — Claude decides how to build prompts that trigger the skill
- Database schema details (column types, indexes) — Claude decides based on data model needs
- Loading/error state UI — Claude designs appropriate states
- Output parsing strategy — Claude decides how to extract structured beats from AI response

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Research
- `.planning/research/STACK.md` — Stack recommendations (Next.js 16, Drizzle, Agent SDK)
- `.planning/research/FEATURES.md` — Feature landscape and MVP definition
- `.planning/research/ARCHITECTURE.md` — System architecture, component boundaries, data flow
- `.planning/research/PITFALLS.md` — Critical pitfalls (structured beats not blobs, Agent SDK auth, loading states)
- `.planning/research/SUMMARY.md` — Synthesized findings, resolved contradictions

### Existing Skill (integration target)
- `.claude/skills/devlog-scriptwriter/SKILL.md` — The skill that Agent SDK will invoke (3 modes, output format)
- `.claude/skills/devlog-scriptwriter/references/brand-voice.md` — Voice profile loaded at runtime
- `.claude/skills/devlog-scriptwriter/references/anti-slop-rules.md` — Scoring rubric and banned phrases
- `.claude/skills/devlog-scriptwriter/references/video-formats.md` — 7 format templates

### Prior Phase Context
- `.planning/phases/01-foundation/01-CONTEXT.md` — Skill architecture decisions
- `.planning/phases/02-script-generation/02-CONTEXT.md` — Verification approach

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- No existing web app code — this is a greenfield Next.js project
- Existing skill files provide the AI integration contract (SKILL.md defines expected input/output)
- `scripts/007-dead-world-to-living-forest.md` — example of expected script output format

### Established Patterns
- Dual-track format: `| VISUAL | VOICEOVER |` table from SKILL.md
- Anti-slop score: 5-dimension table (Directness, Rhythm, Trust, Authenticity, Density) out of 50
- Hook variants: 2-3 options (A, B, C) with pre-hook/opening/deliver structure
- Output extras: 3 titles + thumbnail concept + duration estimate

### Integration Points
- Agent SDK spawns Claude Code → Claude Code reads `.claude/skills/devlog-scriptwriter/` → skill generates script
- Web app reads reference files from `.claude/skills/devlog-scriptwriter/references/` via filesystem
- Scripts saved to SQLite via Drizzle ORM

</code_context>

<specifics>
## Specific Ideas

- The web app wraps the existing CLI skill — output should be identical to CLI usage
- Agent SDK auth: do NOT set ANTHROPIC_API_KEY (switches to per-token billing). Use default Max subscription OAuth from system keychain.
- better-sqlite3 may need node-gyp/build tools on Windows — have sql.js as fallback if native module fails
- Structured output parsing: the AI response is markdown with tables — parser needs to extract beats, hooks, titles, score from markdown format

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 04-foundation-generation*
*Context gathered: 2026-03-27*
