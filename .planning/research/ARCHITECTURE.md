# Architecture Patterns

**Domain:** AI-assisted devlog scriptwriting pipeline (Claude Code skill-based)
**Researched:** 2026-03-26

## System Overview

This is NOT a web application. It is a **file-based pipeline** orchestrated by Claude Code skills. The "architecture" is about file organization, skill activation flow, reference document structure, and the feedback loop between published videos and future script generation.

```
+------------------------------------------------------------------+
|                        CLAUDE CODE SESSION                        |
|                                                                   |
|  +-----------------------+     +-----------------------------+    |
|  |   SKILL LAYER         |     |   REFERENCE LAYER           |    |
|  |                       |     |                             |    |
|  | devlog-scriptwriter/  |---->| brand-voice.md              |    |
|  |   SKILL.md (main)     |     | anti-slop-rules.md          |    |
|  |                       |     | metrics-log.md              |    |
|  | stop-slop/            |     | video-formats.md            |    |
|  |   SKILL.md            |     +-----------------------------+    |
|  |                       |              |                         |
|  | humanizer/            |              v                         |
|  |   SKILL.md            |     +-----------------------------+    |
|  +-----------------------+     |   OUTPUT LAYER              |    |
|           |                    |                             |    |
|           v                    | scripts/                    |    |
|  +-----------------------+     |   YYYY-MM-DD-topic.md       |    |
|  |   CONTEXT LAYER       |     |   (generated scripts)       |    |
|  |                       |     +-----------------------------+    |
|  | CLAUDE.md             |              |                         |
|  | PROJECT.md            |              v                         |
|  | videos-1-6-           |     +-----------------------------+    |
|  |   transcription.md    |     |   FEEDBACK LAYER            |    |
|  | game-scenario.md      |     |                             |    |
|  +-----------------------+     | metrics-log.md (updated)    |    |
|                                | pattern-analysis (in skill) |    |
+------------------------------------------------------------------+
                                          |
                                          v
                              +---------------------+
                              |  EXTERNAL WORLD     |
                              |                     |
                              | Pavlo records video |
                              | Uploads to YouTube  |
                              | Reads analytics     |
                              | Enters metrics      |
                              +---------------------+
```

## Component Boundaries

### 1. Skill Layer (`.claude/skills/`)

The skill layer contains Claude Code skills -- markdown files with YAML frontmatter that Claude loads when relevant. Skills are the "executable logic" of the pipeline.

| Component | Location | Responsibility | Invocation |
|-----------|----------|---------------|------------|
| `devlog-scriptwriter` | `.claude/skills/devlog-scriptwriter/SKILL.md` | Main orchestrator: ideation, script generation, feedback analysis | Both user (`/devlog-scriptwriter`) and Claude (auto) |
| `stop-slop` | `~/.claude/skills/stop-slop/SKILL.md` | Score text on 5 dimensions (35+/50 threshold), identify violations, rewrite | Claude auto-invokes during script generation |
| `humanizer` | `~/.claude/skills/humanizer/SKILL.md` | Final pass removing AI writing patterns | Claude auto-invokes after stop-slop |

**Key architectural decision:** The main `devlog-scriptwriter` skill is a **project skill** (committed to repo in `.claude/skills/`). Companion skills (`stop-slop`, `humanizer`) are **personal skills** (in `~/.claude/skills/`) because they are general-purpose and reusable across projects.

**Confidence:** HIGH -- based on official Claude Code skills documentation.

### 2. Reference Layer (`.claude/skills/devlog-scriptwriter/references/`)

Reference files are loaded by the main skill on demand -- not at startup. They provide the knowledge base that shapes script output.

| File | Purpose | Updated By | Update Frequency |
|------|---------|-----------|------------------|
| `brand-voice.md` | Pavlo's speaking patterns, vocabulary, rhythm, personality traits | Human (after interview) | Rarely -- when voice evolves |
| `anti-slop-rules.md` | 60+ banned phrases, structural rules, scoring rubric | Human + skill refinement | Occasionally -- when new AI patterns emerge |
| `video-formats.md` | The 7 tested formats (The Bug, The Satisfaction, Before/After, The Decision, The Trick, The Fail, The Number) with templates | Human | When new formats are discovered |
| `metrics-log.md` | Per-video analytics: views, retention, subs, what worked/didn't | Human (manual entry from YouTube Studio) | After each video publish (+48h) |

**Why separate files, not inline in SKILL.md:** Claude Code loads skill descriptions at startup but only reads full content when invoked. Reference files are loaded on-demand within the skill. This keeps startup context lean. The official docs recommend keeping SKILL.md under 500 lines and moving detailed reference material to separate files.

**Confidence:** HIGH -- directly from Claude Code skill architecture docs.

### 3. Context Layer (project root)

Files that provide project context but are NOT part of the skill system. Claude reads these via CLAUDE.md instructions or when exploring the project.

| File | Purpose |
|------|---------|
| `CLAUDE.md` | Project instructions, background, principles |
| `game-scenario.md` | Full game design document -- source of truth for game details |
| `videos-1-6-transcription.md` | Existing video transcripts with analytics -- style anchor |
| `.planning/PROJECT.md` | Project requirements and constraints |

### 4. Output Layer (`scripts/`)

Generated scripts land here. Each script is a standalone markdown file.

```
scripts/
  2026-03-28-gorilla-sprint.md
  2026-04-02-interactive-vegetation.md
  2026-04-09-dragon-reveal.md
```

**Script file structure:**

```markdown
# [Title]

**Format:** The Satisfaction
**Hook type:** Pre-hook -> Question -> Deliver
**Anti-slop score:** 42/50
**Duration target:** 30-45 seconds

## Visual + Voiceover Script

| Timestamp | Visual (what viewer sees) | Voiceover (what Pavlo says) |
|-----------|--------------------------|----------------------------|
| 0:00-0:03 | [hook visual]            | [hook line]                |
| 0:03-0:08 | [context visual]         | [context line]             |
| ...       | ...                      | ...                        |

## Notes for Recording
- [pronunciation tips]
- [specific screen recording instructions]
- [timing notes]
```

**Why this format:** Videos #3 and #6 (the best performers at 68.8% and 75.7% retention) both had detailed visual planning alongside voiceover. The two-column format enforces the "visuals drive, voice follows" principle from PROJECT.md.

### 5. Feedback Layer (loop back into Reference Layer)

Not a separate directory -- it is the process of updating `metrics-log.md` and having the skill analyze patterns to adjust future generation.

```
Publish video -> Wait 48h -> Enter metrics in metrics-log.md
                                      |
                                      v
                    Skill reads metrics-log.md on next ideation
                                      |
                                      v
                    Pattern analysis: which formats/hooks/topics work
                                      |
                                      v
                    Weighted preferences in next script generation
```

## Data Flow: Ideation to Feedback

### Phase 1: Weekly Ideation

```
INPUT:  Pavlo describes this week's dev progress (free text)
      + game-scenario.md (what exists in the game)
      + metrics-log.md (what performed well/poorly)

SKILL:  devlog-scriptwriter (ideation mode)

OUTPUT: 5-7 topic angles, each tagged with:
        - Format (The Bug, The Satisfaction, etc.)
        - Why this angle (based on metrics patterns)
        - Visual potential (what screen recording would show)
        - Estimated difficulty (recording complexity)
```

### Phase 2: Script Generation

```
INPUT:  Chosen topic angle from ideation
      + brand-voice.md (how Pavlo talks)
      + video-formats.md (format template)
      + anti-slop-rules.md (what to avoid)

SKILL:  devlog-scriptwriter (generation mode)

OUTPUT: Draft script in two-column format
```

### Phase 3: Quality Pass

```
INPUT:  Draft script

SKILL:  stop-slop -> score 5 dimensions
        If score < 35/50: rewrite and re-score
        humanizer -> final natural language pass

OUTPUT: Polished script with score annotation
```

### Phase 4: Human Polish

```
INPUT:  Polished script

ACTOR:  Pavlo (human)
        - Read aloud for pronunciation check
        - Adjust phrasing to personal comfort
        - Mark recording notes

OUTPUT: Final recording-ready script
```

### Phase 5: Record and Publish

```
INPUT:  Final script + screen recording

ACTOR:  Pavlo (human)
        - Record screen in UE5
        - Record voiceover
        - Edit and upload to YouTube

OUTPUT: Published YouTube Short
```

### Phase 6: Metrics Collection (48h post-publish)

```
INPUT:  YouTube Studio analytics (manual read)

ACTOR:  Pavlo (human)
        - Open YouTube Studio
        - Copy key metrics into metrics-log.md

OUTPUT: Updated metrics-log.md with new entry:
        | Video | Date | Views | Retention | Subs | Format | Hook | Notes |
```

### Phase 7: Pattern Analysis (feeds back to Phase 1)

```
INPUT:  metrics-log.md (all entries)

SKILL:  devlog-scriptwriter (analysis mode)

OUTPUT: Insights fed into next ideation:
        - "The Satisfaction format averages 70% retention vs 45% for showcase"
        - "Physics/destruction hooks get 3x more views"
        - "Videos over 40 seconds lose 15% retention vs under 35 seconds"
```

## Recommended Project Structure

```
content-pavyny/
|
+-- CLAUDE.md                              # Project instructions for Claude
+-- game-scenario.md                       # Game design document (context)
+-- videos-1-6-transcription.md            # Historical transcripts (style anchor)
|
+-- .claude/
|   +-- skills/
|       +-- devlog-scriptwriter/           # Main skill (PROJECT scope)
|           +-- SKILL.md                   # Orchestrator: 4 modes
|           +-- references/
|               +-- brand-voice.md         # Pavlo's voice profile
|               +-- anti-slop-rules.md     # Banned phrases + scoring rubric
|               +-- video-formats.md       # 7 format templates
|               +-- metrics-log.md         # Per-video analytics journal
|
+-- scripts/                               # Generated scripts (output)
|   +-- 2026-03-28-gorilla-sprint.md
|   +-- ...
|
+-- .planning/                             # GSD planning files
    +-- PROJECT.md
    +-- research/
    +-- roadmap/
```

**Personal skills (not in repo):**
```
~/.claude/skills/
+-- stop-slop/
|   +-- SKILL.md                           # Anti-slop scoring
+-- humanizer/
    +-- SKILL.md                           # AI pattern removal
```

## Patterns to Follow

### Pattern 1: Multi-Mode Skill

**What:** A single SKILL.md that supports multiple modes (ideation, generation, analysis) via argument passing.

**When:** The main devlog-scriptwriter skill needs to do different things at different pipeline stages.

**How:**

```yaml
---
name: devlog-scriptwriter
description: Generate devlog scripts for YouTube Shorts. Handles ideation (topic angles), script generation, and metrics analysis. Use when writing video scripts, brainstorming video ideas, or analyzing video performance.
---

# Devlog Scriptwriter

Based on the request, operate in one of these modes:

## Mode: Ideation
When asked for ideas/topics/angles:
1. Read `references/metrics-log.md` for performance patterns
2. Ask about this week's dev progress
3. Generate 5-7 angles using formats from `references/video-formats.md`

## Mode: Script Generation
When asked to write a script:
1. Read `references/brand-voice.md` for voice profile
2. Read `references/anti-slop-rules.md` for constraints
3. Generate script in two-column format
4. Self-score against anti-slop rubric

## Mode: Analysis
When asked to analyze metrics/performance:
1. Read `references/metrics-log.md`
2. Identify patterns across format, hook type, topic, duration
3. Generate recommendations for next cycle
```

**Confidence:** HIGH -- multi-mode skills are standard Claude Code skill pattern.

### Pattern 2: Chained Skill Invocation

**What:** The main skill generates a script, then Claude automatically invokes stop-slop and humanizer as quality gates.

**When:** Every script generation must pass quality checks before being considered complete.

**How:** This happens naturally in Claude Code. When the main skill's SKILL.md instructs "after generating a script, score it using the stop-slop methodology," Claude will invoke the stop-slop skill if its description matches. The key is having the main skill reference the quality pass explicitly in its instructions.

**Important caveat:** Claude Code does not guarantee skill chaining order. The main skill should contain the core anti-slop rules inline (or reference them from its own references/) rather than depending on external skills being invoked in sequence. Use companion skills as supplementary quality gates, not as the only quality gate.

**Confidence:** MEDIUM -- skill chaining works in practice but is not a formally guaranteed behavior.

### Pattern 3: Style Anchoring via Transcript

**What:** Include real transcript excerpts in brand-voice.md as concrete examples of the target style.

**When:** Always. Abstract voice descriptions ("casual, short sentences") are insufficient. Real examples anchor the style.

**How:** From `videos-1-6-transcription.md`, extract the best-performing scripts (#3 "I Broke Physics" and #6 "Troll throw people") and embed them in brand-voice.md as reference examples. The skill reads these when generating and mimics the rhythm, vocabulary, and structure.

**Why this matters:** Videos #3 and #6 have distinct qualities -- short punchy sentences, self-deprecating humor, technical terms mixed with casual language, "turns out" transitions. These are Pavlo's actual patterns, not AI-imagined ones.

**Confidence:** HIGH -- this is standard practice in any voice-matching task.

### Pattern 4: Metrics-Driven Preference Weighting

**What:** The metrics-log.md contains structured data that the skill reads to weight future generation preferences.

**When:** During ideation mode, every session.

**How:** The metrics log uses a structured format that enables pattern extraction:

```markdown
## Video Log

| # | Title | Date | Views | Retention% | Subs | Format | Hook Type | Duration | Notes |
|---|-------|------|-------|-----------|------|--------|-----------|----------|-------|
| 1 | Making a Troll Game | 2025-XX | 2980 | 39.4 | +5 | Showcase | Weak | 0:20 | Generic title |
| 3 | I Broke Physics | 2025-XX | 7740 | 68.8 | +21 | The Bug | Pre-hook+Question | 0:34 | Destruction visual |
| 6 | Troll throw people | 2025-XX | 8760 | 75.7 | +16 | The Satisfaction | Slow-mo hook | 0:43 | Ragdoll comedy |
```

The skill reads this and infers: "The Bug and The Satisfaction formats with strong visual hooks average 72% retention vs 42% for Showcase. Prefer these formats. Physics/destruction themes outperform by 3x."

**Confidence:** HIGH -- straightforward data analysis pattern.

## Anti-Patterns to Avoid

### Anti-Pattern 1: Monolithic SKILL.md

**What:** Putting everything -- anti-slop rules, brand voice, format templates, metrics analysis logic -- in one giant SKILL.md file.

**Why bad:** Claude Code loads full skill content into context when invoked. A 2000-line skill wastes context window and makes the skill slower to load. The official recommendation is under 500 lines for SKILL.md.

**Instead:** Keep SKILL.md as an orchestrator (under 500 lines) with references to separate files in `references/`. Claude reads those files on demand.

### Anti-Pattern 2: Depending on Skill Chain Order

**What:** Assuming stop-slop will always run after the main skill, or that humanizer will always run last.

**Why bad:** Claude Code skill invocation is not deterministic sequencing. Claude decides when to invoke skills based on context. If the quality gate lives entirely in an external skill, it might not fire.

**Instead:** Embed the critical anti-slop rules (the banned phrases list, the scoring rubric) in the main skill's references. Use companion skills as additional passes, not the only pass.

### Anti-Pattern 3: Over-Automating Metrics Collection

**What:** Building YouTube API integration, OAuth flows, MCP servers for automated metrics.

**Why bad:** At 1 video/week cadence, the engineering effort vastly exceeds the time saved. Manual entry takes 2 minutes. API setup takes hours and creates maintenance burden.

**Instead:** Simple markdown table in metrics-log.md. Pavlo opens YouTube Studio, reads 5 numbers, types them in. The feedback loop works the same whether data entry is manual or automated.

### Anti-Pattern 4: Generic Voice Description Without Anchors

**What:** Describing brand voice as "casual, conversational, with humor" without real examples.

**Why bad:** Every AI can write "casual and conversational." Without concrete transcript anchors, the generated voice will be generic-casual, not Pavlo-casual.

**Instead:** Include 2-3 real transcript excerpts from best-performing videos as style anchors in brand-voice.md. Let Claude match the specific rhythm, not an abstract description.

## Integration Points

### Skill-to-Reference Integration

The main skill's SKILL.md must explicitly reference supporting files so Claude knows they exist and when to load them:

```markdown
## Additional resources

- For Pavlo's voice profile and style examples, see [brand-voice.md](references/brand-voice.md)
- For banned phrases and scoring rubric, see [anti-slop-rules.md](references/anti-slop-rules.md)
- For video format templates, see [video-formats.md](references/video-formats.md)
- For historical performance data, see [metrics-log.md](references/metrics-log.md)
```

### CLAUDE.md to Skill Integration

CLAUDE.md should reference the skill and its principles but NOT duplicate skill content:

```markdown
## Scriptwriting

Use the `/devlog-scriptwriter` skill for all script work.
Key principles (enforced by the skill):
- Anti-slop score must be 35+/50
- One Short = one idea
- Visuals drive, voice follows
```

### Context Files to Skill Integration

The main skill should instruct Claude to read context files when relevant:

- `game-scenario.md` -- read during ideation to know what game features exist
- `videos-1-6-transcription.md` -- read during brand voice setup (one-time) and as needed for style reference

## Build Order (Dependencies)

The components have clear dependency relationships that dictate build order:

```
1. brand-voice.md          (no dependencies -- requires human interview)
   |
2. anti-slop-rules.md      (no dependencies -- can be assembled from existing skills)
   |
3. video-formats.md        (no dependencies -- based on research already done)
   |
4. metrics-log.md          (depends on: existing video data from transcription file)
   |
5. SKILL.md (main)         (depends on: all reference files existing so it can reference them)
   |
6. Stop-slop install       (no dependency on main skill -- independent)
   |
7. Humanizer install       (no dependency on main skill -- independent)
   |
8. First script generation (depends on: 1-7 all complete)
   |
9. First feedback cycle    (depends on: 8 published + 48h metrics)
```

**Parallelizable:** Steps 1-4 and steps 6-7 can happen in parallel. Step 5 depends on 1-4 being at least drafted. Steps 6-7 are independent of everything else.

**Critical path:** brand-voice.md (step 1) is the bottleneck because it requires a human interview with Pavlo. Everything else can be pre-built with placeholder content.

## Sources

- [Claude Code Skills Documentation](https://code.claude.com/docs/en/skills) -- skill structure, frontmatter, supporting files, invocation control
- [stop-slop skill](https://github.com/drm-collab/stop-slop) -- anti-slop scoring methodology (5 dimensions, 35/50 threshold)
- [humanizer skill](https://github.com/blader/humanizer) -- AI pattern removal
- [Claude Code Skills Structure Guide (GitHub Gist)](https://gist.github.com/mellanon/50816550ecb5f3b239aa77eef7b8ed8d) -- best practices for skill development
- Project context: `videos-1-6-transcription.md` -- real performance data driving architectural decisions
