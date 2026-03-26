# Technology Stack

**Project:** Devlog Scriptwriter Pipeline
**Domain:** AI-assisted content scriptwriting for YouTube Shorts devlogs
**Researched:** 2026-03-26
**Overall confidence:** HIGH

## Important Context

This is NOT a traditional software application. There is no web server, no database, no deployment. The "stack" is Claude Code skills (SKILL.md files), markdown reference documents, and CLI tools that together form a scriptwriting workflow. Every component below lives in the filesystem and runs through Claude Code.

---

## Recommended Stack

### Core: Custom Devlog Scriptwriter Skill

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Custom `devlog-scriptwriter` skill | N/A | Central orchestration skill for script generation | No single existing skill covers devlog + anti-slop + feedback loop + brand voice. Combine best patterns from `viral-reel-generator`, `script-writer`, and `stop-slop` into one custom skill. Custom skill matches Pavlo's exact workflow: ideation, format selection (The Bug, The Satisfaction, etc.), hook formula, anti-slop pass, pronunciation check. | HIGH |

**Architecture:** Follow official Anthropic skill architecture (verified via [Claude Code docs](https://code.claude.com/docs/en/skills) and [Skill best practices](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices)):

```
.claude/skills/devlog-scriptwriter/
  SKILL.md                    # Process steps only (<500 lines)
  references/
    anti-slop-rules.md        # 60+ banned phrases, structural constraints
    brand-voice.md            # Pavlo's voice profile (filled via interview)
    metrics-log.md            # Per-video analytics journal
    video-formats.md          # The Bug, The Satisfaction, Before/After, etc.
    hook-formulas.md          # Pre-hook -> Question -> Deliver patterns
    pronunciation-guide.md   # Words/constructions to avoid for non-native speaker
```

**Key architectural principle:** Process goes in SKILL.md, context goes in reference files. SKILL.md explicitly names which reference file to load at each step. Keep references one level deep (no references-to-references). This is the official Anthropic recommendation and prevents Claude from partially reading nested files.

### Anti-Slop Layer

| Tool | Source | Purpose | Why | Confidence |
|------|--------|---------|-----|------------|
| `stop-slop` (drm-collab) | [github.com/drm-collab/stop-slop](https://github.com/drm-collab/stop-slop) | 5-dimension scoring (directness, rhythm, trust, authenticity, density), 35/50 threshold, auto-rewrite | The scoring system is exactly what this project needs: quantifiable quality gate that blocks AI-sounding scripts. Learning capability via `feedback.log` means it improves over time. Based on hardikpandya/stop-slop (MIT). | HIGH |
| `claude-humanizer` (abnahid) | [github.com/abnahid/claude-humanizer](https://github.com/abnahid/claude-humanizer) | Wikipedia-based AI writing pattern detection, 24 pattern categories | Uses Wikipedia's "Signs of AI writing" guide from WikiProject AI Cleanup -- sourced from thousands of real AI text instances. Catches patterns stop-slop might miss. 1,600+ GitHub stars, actively maintained. | HIGH |
| Anti-slop rules in custom skill | Embedded in `references/anti-slop-rules.md` | 60+ banned phrases baked into the scriptwriter skill itself | First line of defense. Stop-slop and humanizer are second-pass validators. Having rules in the custom skill prevents slop from being generated in the first place, rather than just detecting it after. | HIGH |

**Why TWO anti-slop tools plus embedded rules:** Three layers with different detection approaches:
1. **Embedded rules** (prevention) -- stop AI patterns from being generated
2. **stop-slop** (quantitative scoring) -- numeric quality gate with learning
3. **humanizer** (pattern matching) -- Wikipedia-sourced detection for what slips through

This is not redundant -- each catches different patterns. The 35/50 scoring threshold from stop-slop is the hard gate; humanizer is the final polish pass.

### Trend Research (Optional)

| Tool | Source | Purpose | Why | Confidence |
|------|--------|---------|-----|------------|
| `last30days` (mvanhorn) | [github.com/mvanhorn/last30days-skill](https://github.com/mvanhorn/last30days-skill) | Research topics across Reddit, X, YouTube, HN for recent 30 days | Discovers trending topics in indie gamedev community. When yt-dlp is installed, automatically searches YouTube and extracts transcripts from top videos -- useful for understanding what devlog formats are currently performing well. Requires SCRAPECREATORS_API_KEY. | MEDIUM |

**Why MEDIUM confidence:** The tool itself is well-built, but its value depends on whether Pavlo actually needs trend research. At 1 video/week with specific game dev content to share, topic ideation from his own dev work may be sufficient. Install it but treat as optional enhancement, not core workflow.

### Metrics and Feedback Loop

| Approach | Format | Purpose | Why | Confidence |
|----------|--------|---------|-----|------------|
| Manual entry in `metrics-log.md` | Markdown table | Track per-video analytics: views, retention %, subs gained, hook type, format used | At 1 video/week, manual entry takes 2 minutes and avoids YouTube API setup complexity. The PROJECT.md explicitly scopes out YouTube MCP integration. The feedback loop (analyzing which formats/hooks perform best) is the superpower, not the data collection method. | HIGH |

**Metrics to track per video:**

```markdown
| # | Title | Format | Hook Type | Views (48h) | Retention % | Subs | Notes |
|---|-------|--------|-----------|-------------|-------------|------|-------|
```

**Why NOT YouTube API / MCP integration:**
- 1 video/week does not justify OAuth2 setup, API key management, and MCP server maintenance
- YouTube Studio already shows all needed metrics in a browser tab
- The value is in the analysis pattern, not automation of data entry
- PROJECT.md explicitly lists this as Out of Scope
- Can revisit if publishing cadence increases to 3+ videos/week

### Content Scoring System

| Component | Method | Threshold | Confidence |
|-----------|--------|-----------|------------|
| stop-slop 5-dimension score | Directness, Rhythm, Trust, Authenticity, Density (1-10 each) | 35/50 minimum | HIGH |
| slop-radar (optional CLI) | 245 English buzzwords + 14 structural patterns + fuzzy matching | Scores 0-100, flag below 80 | MEDIUM |

**Scoring workflow:**
1. Generate script via custom skill (anti-slop rules embedded)
2. Run `/stop-slop` -- score must be 35+/50
3. If score < 35, automatic rewrite with violations fixed, re-score
4. Run `/humanizer` for final AI-pattern sweep
5. Human read-aloud test (Pavlo reads script, marks awkward spots)

**Why stop-slop is the primary scorer:** It has a learning mechanism (`feedback.log`) that accumulates corrections over time. The more Pavlo uses it, the better it gets at matching his preferences. slop-radar is a useful supplementary CLI tool but does not have the same feedback loop.

### Supplementary Tools

| Tool | Source | Purpose | When to Use | Confidence |
|------|--------|---------|-------------|------------|
| `slop-radar` | [github.com/renefichtmueller/slop-radar](https://github.com/renefichtmueller/slop-radar) | CLI-based slop detection with 245 buzzwords + 14 structural patterns | Quick spot-checks via `npx slop-radar score`. Useful as independent second opinion alongside stop-slop. | MEDIUM |
| `anti-slop-writing` (adenaufal) | [github.com/adenaufal/anti-slop-writing](https://github.com/adenaufal/anti-slop-writing) | Universal system prompt for eliminating AI style tells | Consider embedding key rules from this into CLAUDE.md or the custom skill's anti-slop-rules.md. Works across Claude Code, Cursor, and other tools. | MEDIUM |
| `viral-reel-generator` | [mcpmarket.com](https://mcpmarket.com/tools/skills/viral-reel-generator) | Short-form video script generation with anti-slop rules and visual-audio sync | Reference for hook patterns and visual sync techniques when building custom skill. Do NOT install as primary tool -- too generic for devlog-specific needs. | LOW |

---

## Alternatives Considered

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| Anti-slop scoring | `stop-slop` (drm-collab) | `stop-slop` (hardikpandya) | drm-collab version adds learning via feedback.log; hardikpandya is the original but lacks feedback loop |
| Anti-slop scoring | `stop-slop` | `anti-slop-skill` (DataWhisker) | DataWhisker focuses on code quality, not prose/script writing |
| Humanizer | `claude-humanizer` (abnahid) | `humanizer` (blader) | abnahid has broader Wikipedia-sourced pattern database and more community traction |
| Humanizer | `claude-humanizer` (abnahid) | `avoid-ai-writing` (conorbronsdon) | conorbronsdon is good but abnahid's Wikipedia basis is more comprehensive |
| Trend research | `last30days` (mvanhorn) | Manual Reddit/YouTube browsing | last30days automates what would take 30+ minutes of manual browsing; worth the API key setup |
| Script generation | Custom skill | `viral-reel-generator` (mcpmarket) | mcpmarket skill is generic short-form; custom skill is devlog-specific with brand voice, game context, and feedback loop |
| Script generation | Custom skill | `youtube-content-creator` (mcpmarket) | Too generic, no anti-slop integration, no feedback loop |
| Metrics collection | Manual markdown | YouTube Data API v3 MCP | Overkill for 1 video/week; adds OAuth2 complexity without proportional value |
| Metrics collection | Manual markdown | VidIQ / TubeAnalytics | SaaS tools add cost and are designed for channels with much higher volume |

---

## What NOT to Use

| Tool/Approach | Why Avoid |
|---------------|-----------|
| **ElevenLabs TTS** | Pavlo records his own voiceover. TTS defeats the authenticity goal. |
| **Remotion programmatic rendering** | Experimental, adds massive technical complexity. Defer until script pipeline is proven and running. |
| **FFmpeg subtitle burn-in / auto-cut** | Out of scope per PROJECT.md. Separate initiative from scriptwriting. |
| **ChatGPT / GPT-4o for scripts** | Claude Code skills provide tighter integration, learning feedback loops, and embedded anti-slop. Switching tools fragments the workflow. |
| **Jasper / Copy.ai / KoalaWriter** | SaaS script generators are generic, have no feedback loop, no brand voice persistence, and no anti-slop scoring. They solve a different problem (content farms, not authentic devlogs). |
| **YouTube API MCP servers** | Over-engineered for current cadence. Manual metrics entry is 2 minutes/week. Revisit at 3+ videos/week. |
| **Multiple SaaS analytics tools** | YouTube Studio's built-in analytics provides everything needed. No need for Sprout Social, Planable, etc. at 55 subscribers. |
| **n8n / Zapier automation workflows** | Adding automation orchestration is premature. The workflow is: Claude Code generates script -> Pavlo records -> Pavlo enters metrics. No integration points that need automation. |

---

## Installation

### Phase 1: Core skill setup

```bash
# Create skill directory structure
mkdir -p ~/.claude/skills/devlog-scriptwriter/references

# Install anti-slop companion skills
git clone https://github.com/drm-collab/stop-slop.git ~/.claude/skills/stop-slop
git clone https://github.com/abnahid/claude-humanizer.git ~/.claude/skills/humanizer
```

### Phase 2: Optional enhancements

```bash
# Trend research (requires SCRAPECREATORS_API_KEY)
git clone https://github.com/mvanhorn/last30days-skill.git ~/.claude/skills/last30days

# CLI slop detector (run ad-hoc, no installation needed)
npx slop-radar score "your text here"
```

### Phase 3: Verify skills load

```bash
# In Claude Code, check available skills
# Type / and look for: devlog-scriptwriter, stop-slop, humanizer
# Ask: "What skills are available?"
```

---

## Skill Architecture Reference

Based on [official Anthropic documentation](https://code.claude.com/docs/en/skills) and [best practices](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices):

### SKILL.md Structure

```yaml
---
name: devlog-scriptwriter
description: Generates natural-sounding YouTube Shorts devlog scripts with anti-slop scoring, brand voice matching, and visual-audio sync. Use when writing scripts, brainstorming video ideas, or analyzing video performance patterns.
disable-model-invocation: false
---

# Process steps here (under 500 lines)
# Each step explicitly names which reference file to load
# Example: "Read references/brand-voice.md for tone and vocabulary"
```

### Key Architecture Rules

1. **SKILL.md < 500 lines** -- process steps only, no reference content
2. **Reference files: one purpose per file** -- anti-slop-rules.md is ONLY rules, brand-voice.md is ONLY voice profile
3. **Explicit file loading** -- each step names the file: "Read references/hook-formulas.md"
4. **One level deep** -- SKILL.md references files directly, files do not reference other files
5. **Forward slashes in all paths** -- even on Windows
6. **Description in third person** -- "Generates scripts..." not "I generate scripts..."
7. **No time-sensitive content** -- no "as of March 2026" in skill files

### Frontmatter Fields That Matter

| Field | Value | Rationale |
|-------|-------|-----------|
| `name` | `devlog-scriptwriter` | Lowercase, hyphens, descriptive |
| `description` | See above | Includes triggers: "writing scripts", "brainstorming", "video ideas" |
| `disable-model-invocation` | `false` | Claude should auto-activate when script/video topics come up |
| `allowed-tools` | (omit) | No special tool restrictions needed |

---

## Sources

### Official Documentation (HIGH confidence)
- [Claude Code Skills Documentation](https://code.claude.com/docs/en/skills) -- skill architecture, directory structure, frontmatter reference
- [Skill Authoring Best Practices](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices) -- progressive disclosure, conciseness, testing guidelines

### GitHub Repositories (HIGH confidence)
- [drm-collab/stop-slop](https://github.com/drm-collab/stop-slop) -- 5-dimension scoring with feedback learning
- [abnahid/claude-humanizer](https://github.com/abnahid/claude-humanizer) -- Wikipedia-based AI pattern detection (1,600+ stars)
- [mvanhorn/last30days-skill](https://github.com/mvanhorn/last30days-skill) -- Multi-platform trend research
- [renefichtmueller/slop-radar](https://github.com/renefichtmueller/slop-radar) -- CLI slop detector with 245 buzzwords
- [adenaufal/anti-slop-writing](https://github.com/adenaufal/anti-slop-writing) -- Universal anti-slop system prompt

### Community Resources (MEDIUM confidence)
- [MCPMarket: Viral Reel Generator](https://mcpmarket.com/tools/skills/viral-reel-generator) -- reference for hook patterns
- [MindStudio: Skills Architecture](https://www.mindstudio.ai/blog/claude-code-skills-architecture-skill-md-reference-files) -- process vs. context separation
- [Hardik Pandya: Stop Slop](https://hardik.substack.com/p/new-claude-skill-stop-ai-slop-in) -- original stop-slop concept and rationale

### YouTube Analytics (HIGH confidence, not used in stack)
- [YouTube Analytics API](https://developers.google.com/youtube/analytics) -- verified available but scoped out for current project
