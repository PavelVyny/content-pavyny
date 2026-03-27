# Phase 1: Foundation - Context

**Gathered:** 2026-03-27
**Status:** Ready for planning

<domain>
## Phase Boundary

Audit the Claude Code skills/tools ecosystem for scriptwriting, extract Pavlo's brand voice from existing transcripts + interview, and build/install the custom devlog-scriptwriter skill with companion quality tools. Phase ends when the skill produces output using Pavlo's voice profile — not generic AI text.

</domain>

<decisions>
## Implementation Decisions

### Ecosystem Audit
- **D-01:** Clone each identified skill/tool and review code (SKILL.md, rules, scoring logic) — but do NOT test them in production. Code review depth, not end-to-end testing.
- **D-02:** Conduct a broad search beyond already-identified tools — GitHub, MCPMarket, Reddit, community sources. Full 2026 landscape analysis, not just the 6 tools from CLAUDE.md.
- **D-03:** Output is a report with verdicts (use/adapt/skip) per tool. Pavlo reviews the report BEFORE any integration happens — report first, then Pavlo decides what to integrate.

### Brand Voice
- **D-04:** Two-step interview: (1) Claude analyzes all 6 existing transcripts from videos-1-6-transcription.md to extract speech patterns, then (2) presents findings to Pavlo for confirmation/correction with targeted follow-up questions on gaps.
- **D-05:** Style anchors: use BOTH video #3 ("I Broke Physics") and #6 ("Troll throw people") transcripts — the two best performers by retention and subscriber conversion.
- **D-06:** Voice profile must capture ALL 4 dimensions: Pavlo-isms ("so I...", "turns out...", "let's..."), tone/humor (self-deprecating, casual, honest about mistakes), sentence rhythm (short sentences, pauses, delivery tempo), and banned words/phrases (things Pavlo would never say).

### Skill Architecture
- **D-07:** Skill lives in project scope: `.claude/skills/devlog-scriptwriter/` — committed to repo.
- **D-08:** 4 reference files required: brand-voice.md, anti-slop-rules.md, video-formats.md, metrics-log.md.

### Claude's Discretion
- Skill structure decision (single multi-mode SKILL.md vs separate skills) — Claude decides based on ecosystem audit findings and official Anthropic skill architecture best practices.
- Companion skill installation method (clone repos vs extract rules vs hybrid) — Claude decides based on audit results and what actually works.

### Companion Tools
- **D-09:** Test skill chaining (main → stop-slop → humanizer) first before deciding fallback strategy. If chaining works reliably, use it. If not, embed critical rules in main skill.
- **D-10:** Companion skill installation approach is Claude's discretion — decide after ecosystem audit reveals which tools are worth integrating and how.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project Context
- `CLAUDE.md` — Full project context, research findings, workflow design, and principles from previous chat
- `.planning/PROJECT.md` — Project definition, core value, requirements, constraints
- `.planning/REQUIREMENTS.md` — v1 requirements with REQ-IDs (ECOS-01..04, VOIC-01..03, SKIL-01..04)

### Research
- `.planning/research/STACK.md` — Recommended stack (skills, tools, anti-slop layers)
- `.planning/research/FEATURES.md` — Feature landscape with table stakes/differentiators/anti-features
- `.planning/research/ARCHITECTURE.md` — Pipeline architecture, component boundaries, data flow
- `.planning/research/PITFALLS.md` — Critical pitfalls and prevention strategies
- `.planning/research/SUMMARY.md` — Synthesized research with roadmap implications

### Content Assets
- `videos-1-6-transcription.md` — All 6 video transcripts with analytics data (source material for brand voice extraction)
- `game-scenario.md` — Full game scenario (context for ideation and script generation)

### External Skills to Audit
- `github.com/drm-collab/stop-slop` — 5-dimension scoring, feedback.log learning
- `github.com/abnahid/claude-humanizer` — Wikipedia-based AI pattern detection
- `mcpmarket.com` viral-reel-generator — short-form anti-AI-slop rules
- `ailabs-393` script-writer — persistent style database
- `github.com/mvanhorn/last30days-skill` — Reddit/X/YouTube trend research
- `github.com/digitalsamba/claude-code-video-toolkit` — Remotion + FFmpeg

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- No existing skill files in the project
- `~/.claude/skills/` contains only GSD companion skills (find-skills, frontend-design, pixel-perfect-audit) — none related to scriptwriting

### Established Patterns
- No established patterns — greenfield skill development

### Integration Points
- `videos-1-6-transcription.md` — primary data source for brand voice extraction
- `game-scenario.md` — context the skill will reference during ideation
- `CLAUDE.md` — contains detailed research findings from previous chat that inform skill design

</code_context>

<specifics>
## Specific Ideas

- Use video #3 and #6 as style anchors because they have the highest retention AND subscriber conversion
- Video #6 has detailed visual descriptions alongside voiceover — this is the gold standard for dual-track format
- Pavlo's unreleased content (interactive vegetation, gorilla-sprint, dragon model, river) is immediate material for ideation — the skill should know about the game's current state
- The 35/50 anti-slop threshold from stop-slop may need calibration for conversational devlog style (it might score differently than formal prose)

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 01-foundation*
*Context gathered: 2026-03-27*
