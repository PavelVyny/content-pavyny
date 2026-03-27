# Ecosystem Audit Report

**Date:** 2026-03-27
**Scope:** Claude Code skills and tools for scriptwriting, anti-slop detection, and content creation
**Method:** Code review depth per D-01 (clone repos, read SKILL.md/rules/scoring logic, assign verdicts). No end-to-end testing.

---

## Identified Tools (from CLAUDE.md)

### 1. stop-slop (drm-collab)

- **Source:** [github.com/drm-collab/stop-slop](https://github.com/drm-collab/stop-slop)
- **Structure:** Single `SKILL.md` (223 lines) + `feedback.log`. No reference files. Clean, self-contained.
- **Key content:**
  - 5 scoring dimensions (Directness, Rhythm, Trust, Authenticity, Density) rated 1-10, threshold 35/50
  - 8 core rules (cut filler, break formulaic structures, active voice, be specific, put reader in room, vary rhythm, trust readers, cut quotables)
  - Comprehensive banned phrase lists organized by category: throat-clearing openers, emphasis crutches, business jargon, adverbs, filler phrases, meta-commentary, vague declaratives
  - Structural patterns to avoid: binary contrasts, negative listing, dramatic fragmentation, rhetorical setups, false agency, narrator-from-distance, passive voice, rhythm patterns
  - Quick checks checklist for final review
  - 5 before/after examples
  - `feedback.log` learning mechanism: reads corrections from previous sessions, appends new ones. This is the learning loop that makes it improve over time.
- **Quality:** Based on hardikpandya/stop-slop (MIT). Single commit, clean implementation. The drm-collab fork adds the feedback.log mechanism which is the key differentiator.
- **Skill description:** "Remove AI writing patterns from prose. Scores on 5 dimensions, rewrites to sound human." -- Clear trigger words, would match scriptwriting context.
- **Verdict:** ADAPT
- **Rationale:** The 5-dimension scoring rubric and 8 core rules are exactly what the custom skill needs. Extract these into `anti-slop-rules.md`. Also install as companion for explicit `/stop-slop` invocation as a second pass.
- **What to extract:** Scoring rubric (5 dimensions with questions), 8 core rules, banned phrase lists, structural patterns, quick checks. The feedback.log mechanism is worth replicating in the custom skill.

### 2. humanizer (abnahid/claude-humanizer)

- **Source:** [github.com/abnahid/claude-humanizer](https://github.com/abnahid/claude-humanizer)
- **Structure:** Single `SKILL.md` (488 lines) + `README.md`. No reference files. Near the 500-line recommended limit.
- **Key content:**
  - 24 pattern categories organized in 6 groups:
    1. **Content Patterns** (6): significance inflation, notability name-dropping, superficial -ing analyses, promotional language, vague attributions, formulaic challenges/prospects
    2. **Language Patterns** (6): AI vocabulary overuse, copula avoidance ("serves as" instead of "is"), negative parallelisms, rule of three, synonym cycling, false ranges
    3. **Style Patterns** (6): em dash overuse, boldface overuse, inline-header lists, title case headings, emojis, curly quotes
    4. **Communication Patterns** (3): chatbot artifacts, knowledge-cutoff disclaimers, sycophantic tone
    5. **Filler and Hedging** (3): filler phrases, excessive hedging, generic conclusions
  - Multi-pass approach: initial rewrite, then "What makes this obviously AI?" audit, then final rewrite
  - Personality/soul section: advice on adding opinions, varying rhythm, acknowledging complexity, using first person
  - Full before/after example demonstrating all 24 patterns
  - Based on Wikipedia's WikiProject AI Cleanup -- sourced from thousands of real AI text instances
- **Quality:** 1,600+ GitHub stars. Single commit but comprehensive content. The Wikipedia sourcing adds credibility -- these patterns were identified by humans reviewing actual AI-generated text at scale.
- **Skill description:** Detailed, lists specific patterns. Would match text editing/review context well.
- **Verdict:** ADAPT
- **Rationale:** The 24-category taxonomy is the most comprehensive AI pattern detection system found in the ecosystem. The "soul" section about adding personality is directly relevant to brand voice work. Extract the most script-relevant patterns (Language Patterns, Filler/Hedging, Communication Patterns) into `anti-slop-rules.md`. Also install as companion for explicit `/humanizer` invocation.
- **What to extract:** AI vocabulary word list, copula avoidance patterns, negative parallelism detection, rule-of-three detection, filler phrase list, the multi-pass audit technique ("What makes this obviously AI?").

### 3. viral-reel-generator (mcpmarket.com)

- **Source:** [mcpmarket.com/tools/skills/viral-reel-generator](https://mcpmarket.com/tools/skills/viral-reel-generator)
- **Structure:** Not available as a Git repo. MCPMarket listing only. Cannot clone or review code directly.
- **Key content (from CLAUDE.md research notes):** Short-form video script generation with anti-AI-slop rules and visual-audio sync.
- **Quality:** Cannot assess -- no source code available for review. MCPMarket listings do not expose full SKILL.md content.
- **Verdict:** SKIP
- **Rationale:** Cannot review code per D-01 requirements. Too generic for devlog-specific needs -- designed for general short-form content, not indie game devlogs. The custom skill already incorporates the relevant concepts (hook formulas, visual-audio sync, anti-slop rules) from project-level research. No unique value to extract that is not already covered by stop-slop and humanizer.

### 4. script-writer (ailabs-393)

- **Source:** Referenced as "ailabs-393" in CLAUDE.md research notes. No GitHub repo found.
- **Structure:** Cannot review -- no accessible repository.
- **Key content (from CLAUDE.md research notes):** Persistent style database for maintaining consistent writing voice across sessions.
- **Quality:** Cannot assess -- no source code available.
- **Verdict:** SKIP
- **Rationale:** Cannot review code per D-01 requirements. The persistent style database concept is valuable but the custom skill achieves this via `brand-voice.md` (voice profile) and `metrics-log.md` (feedback loop). The concept is already incorporated into the custom skill design.

### 5. last30days (mvanhorn)

- **Source:** [github.com/mvanhorn/last30days-skill](https://github.com/mvanhorn/last30days-skill)
- **Structure:** `SKILL.md` (747 lines -- exceeds 500-line recommendation), `.claude-plugin/` directory with marketplace metadata, `scripts/` directory. Full ClawHub plugin structure.
- **Key content:**
  - Deep research engine covering 10+ sources: Reddit, X/Twitter, YouTube, TikTok, Instagram, Hacker News, Polymarket, Bluesky, Truth Social, web search
  - AI synthesis of findings into grounded, cited reports
  - YouTube transcript extraction via yt-dlp when installed
  - Reddit comment analysis for "gems" (high-signal comments)
  - Requires SCRAPECREATORS_API_KEY (mandatory), plus optional keys for OpenAI, XAI, Brave, Apify, and social media auth tokens
- **Quality:** Actively maintained (multiple commits), versioned (v2.9.5), published on ClawHub marketplace. Well-structured with proper frontmatter and tool permissions.
- **Verdict:** SKIP (for Phase 1)
- **Rationale:** Useful tool but not relevant to the current pipeline. At 1 video/week with game dev content to share, topic ideation comes from Pavlo's actual dev work, not trend research. The API key requirement (SCRAPECREATORS_API_KEY) adds setup friction without proportional value for the current cadence. Revisit if Pavlo needs external topic inspiration beyond his own dev progress.

### 6. claude-code-video-toolkit (digitalsamba)

- **Source:** [github.com/digitalsamba/claude-code-video-toolkit](https://github.com/digitalsamba/claude-code-video-toolkit)
- **Structure:** Large toolkit with 11+ internal skills (remotion, elevenlabs, ffmpeg, playwright-recording, qwen-edit, ltx2, acestep, runpod, frontend-design, remotion-official), 12+ commands (video, setup, brand, design, template, etc.), Python tools for AI voiceover/image gen/music.
- **Key content:**
  - Full video production workspace for Claude Code
  - Remotion-based rendering pipeline (React components -> MP4)
  - ElevenLabs and Qwen3-TTS integration for AI voiceover
  - FFmpeg skills for editing
  - Cloud GPU deployment (Modal, RunPod)
  - Brand management commands
  - Template system for video types
- **Quality:** Actively maintained (v0.13.2), detailed README with author note. Comprehensive but complex -- designed for autonomous AI video production, not scriptwriting.
- **Verdict:** SKIP
- **Rationale:** Out of scope per PROJECT.md. This is a video production toolkit, not a scriptwriting tool. Pavlo records screen + voiceover himself -- the pipeline handles writing, not rendering. ElevenLabs TTS, Remotion rendering, and cloud GPU deployment are explicitly listed as "What NOT to Use" in STACK.md. No components relevant to the scriptwriting pipeline.

---

## Broader Search Findings

### Search Queries Used

| Source | Query | Results |
|--------|-------|---------|
| GitHub (cloned) | `slop-radar` (renefichtmueller) | Found -- CLI tool with 200+ buzzwords, 14 structural patterns, scoring 0-100 |
| GitHub (cloned) | `anti-slop-writing` (adenaufal) | Found -- comprehensive system prompt with vocabulary banlist and structural rules |
| GitHub (cloned) | `anthropics/skills` (official) | Found -- 17 official skills, none for scriptwriting/content. Relevant: `doc-coauthoring`, `skill-creator` |
| CLAUDE.md research | mcpmarket.com content/video skills | Checked -- `viral-reel-generator` and `youtube-content-creator` found, both too generic |
| STACK.md alternatives | Various humanizer alternatives | Checked -- `humanizer` (blader) and `avoid-ai-writing` (conorbronsdon) noted as inferior to abnahid's version |
| STACK.md alternatives | `anti-slop-skill` (DataWhisker) | Noted -- focuses on code quality, not prose. Not relevant. |

### Newly Discovered Tools

#### slop-radar (renefichtmueller)

- **Source:** [github.com/renefichtmueller/slop-radar](https://github.com/renefichtmueller/slop-radar)
- **Type:** CLI tool (npm package) + Claude Code skill
- **Structure:** TypeScript source in `src/`, skill in `skill/SKILL.md`, also has `superpowers-skill/` directory
- **Key content:**
  - 200+ English AI buzzwords (larger list than stop-slop)
  - 120+ German AI phrases
  - 14 structural patterns (em-dash abuse, "Let me" starters, bullet overload, passive voice density, etc.)
  - Fuzzy matching to catch variations
  - Scoring 0-100 (90-100 = HUMAN, 70-89 = MOSTLY CLEAN, 50-69 = SUSPICIOUS, 30-49 = LIKELY AI, 0-29 = PURE SLOP)
  - Can run via `npx slop-radar score` without installation
  - Live demo at slop-radar-demo.pages.dev
- **Verdict:** ADAPT
- **Rationale:** The 200+ buzzword database is the largest found in the ecosystem. Useful as a reference when building the custom skill's banned phrase list. The CLI tool provides a quick independent second opinion via `npx slop-radar score`. Do not install as a skill -- use stop-slop for scoring (it has the feedback loop), use slop-radar's word list as a reference.
- **What to extract:** Buzzword categories (filler, hype, corporate, connectors, openers, actions) to cross-reference against stop-slop's banned phrases and fill gaps.

#### anti-slop-writing (adenaufal)

- **Source:** [github.com/adenaufal/anti-slop-writing](https://github.com/adenaufal/anti-slop-writing)
- **Type:** Claude Code skill + system prompt (also has Gemini version)
- **Structure:** English and Indonesian versions, `references/` directory with `vocabulary-banlist.md` and `structural-patterns.md`, separate `system-prompt.md`
- **Key content:**
  - Most comprehensive vocabulary banlist found: organized by category (significance puffers, analytical verbs, poetic nouns, promotional adjectives, puffery adverbs, formal connectives, opening/closing crutches, copula-avoidance constructions, vague attributions, promotional phrases, formulaic patterns, fake authenticity signals, filler phrases, passive hedging, chat artifacts)
  - Replacement strategy with concrete alternatives
  - 9 structural rules with rationale tied to detection metrics (perplexity, burstiness, stylometry)
  - Cites actual research: median AI perplexity 21.2 vs human 35.9, burstiness as most reliable separator, Turnitin 2026 using 31 linguistic features
  - Practical: "Don't swap for synonym -- restructure the sentence"
- **Verdict:** ADAPT
- **Rationale:** The vocabulary banlist is the most thorough and well-organized found in the ecosystem. The detection metric explanations (perplexity, burstiness, stylometry) provide scientific grounding for the rules. Extract the banlist categories and structural rules into `anti-slop-rules.md`, merging with stop-slop's scoring and humanizer's patterns.
- **What to extract:** Complete vocabulary banlist (categorized), structural rules with detection metric rationale, replacement strategy approach.

#### Anthropic Official Skills (anthropics/skills)

- **Source:** [github.com/anthropics/skills](https://github.com/anthropics/skills)
- **Type:** Official Anthropic skill repository
- **Structure:** 17 skills including `skill-creator`, `doc-coauthoring`, `internal-comms`, `brand-guidelines`, `canvas-design`, etc.
- **Relevant skills reviewed:**
  - `doc-coauthoring`: 3-phase workflow (Context Gathering, Refinement, Reader Testing). Useful pattern for structuring the scriptwriting skill's modes.
  - `skill-creator`: Official reference for how to build Claude Code skills. Confirms frontmatter patterns and best practices.
  - `internal-comms`: Communication writing patterns. Not directly applicable but confirms skill architecture patterns.
  - `brand-guidelines`: Brand consistency enforcement. Relevant concept for brand-voice.md enforcement.
- **Verdict:** SKIP (as direct installation)
- **Rationale:** No scriptwriting or content creation skills in the official repo. However, the architectural patterns (multi-mode workflow from `doc-coauthoring`, brand enforcement from `brand-guidelines`) inform how to structure the custom skill. These are reference patterns, not installable components.

### Search Coverage

**What was searched:** GitHub repositories (7 cloned and reviewed), MCPMarket listings (2 evaluated from research notes), official Anthropic skills repo (17 skills reviewed), STACK.md alternatives table (9 alternatives evaluated).

**What was NOT found:** No Claude Code skill specifically designed for YouTube Shorts scriptwriting, game devlog scripting, or video content creator workflows with anti-slop integration exists in the current ecosystem. The closest tools are generic short-form generators (viral-reel-generator) that lack brand voice persistence, feedback loops, and devlog-specific format templates.

**Confidence in coverage:** HIGH. The ecosystem for Claude Code skills is still relatively small (2025-2026). The major repositories, marketplaces, and community lists have been checked. The finding that no devlog-specific scriptwriting skill exists confirms the rationale for building a custom one.

---

## Skill Chaining Assessment

### Mechanism

Based on code review of stop-slop and humanizer SKILL.md files, and research from official Anthropic documentation:

1. Claude Code loads skill descriptions into context at session start (consuming from a 2% context window budget).
2. When a task matches a skill's description keywords, Claude MAY auto-invoke that skill.
3. There is no deterministic API for chaining skills. Claude's model decides based on context relevance.
4. The main skill can instruct Claude to "score this text using stop-slop methodology" but whether Claude actually invokes the stop-slop skill depends on description matching.

### Description Analysis

| Skill | Description | Trigger Words | Would Match Scriptwriting? |
|-------|-------------|---------------|---------------------------|
| stop-slop | "Remove AI writing patterns from prose. Scores on 5 dimensions, rewrites to sound human." | writing, patterns, prose, scores, human | MAYBE -- "prose" and "writing patterns" could match after script generation |
| humanizer | "Remove signs of AI-generated writing from text. Use when editing or reviewing text to make it sound more natural and human-written." | editing, reviewing, text, natural, human-written | MAYBE -- "editing text" could match during revision pass |

### Reliability Assessment

**Can we depend on auto-chaining?** NO.

Evidence:
1. Both skills' descriptions use general terms ("prose", "text") rather than script-specific triggers
2. Auto-invocation is probabilistic -- it works when Claude judges the context relevant, which varies by session
3. No retry mechanism exists if a companion skill fails to trigger
4. The official documentation confirms this is context-matching, not deterministic sequencing
5. With only 2-3 skills installed, context budget is not a concern, but triggering reliability remains probabilistic

### Recommendation

**Embed critical rules in the main skill. Use companions as explicit manual passes.**

Concrete strategy for SKIL-04:

1. **Primary defense (embedded):** The custom `devlog-scriptwriter` skill's `anti-slop-rules.md` reference file contains the combined best rules from stop-slop (scoring rubric, 8 rules), humanizer (24 patterns), slop-radar (200+ buzzwords), and anti-slop-writing (vocabulary banlist). The SKILL.md process includes a mandatory self-scoring step before outputting any script.

2. **Secondary defense (explicit invocation):** Install stop-slop and humanizer as companion skills in `~/.claude/skills/`. Users can explicitly invoke `/stop-slop` or `/humanizer` as manual second passes after script generation.

3. **Do NOT rely on auto-chaining:** The main skill must be self-sufficient for anti-slop quality. If companions trigger automatically, that is a bonus, not a requirement.

4. **Test chaining anyway (per D-09):** During SKIL-04 execution, generate a test script and observe whether companions auto-trigger. Document the result. If chaining is reliable, note it as a bonus. If not, the embedded approach already handles it.

---

## Summary Table

| Tool | Verdict | What to Extract | For Plan 03 |
|------|---------|-----------------|-------------|
| stop-slop (drm-collab) | ADAPT | 5-dimension scoring rubric, 8 core rules, banned phrases, structural patterns, feedback.log mechanism | Embed scoring + rules in anti-slop-rules.md. Install as companion in ~/.claude/skills/ |
| humanizer (abnahid) | ADAPT | 24-category AI pattern taxonomy, multi-pass audit technique, soul/personality guidance | Merge relevant patterns into anti-slop-rules.md. Install as companion in ~/.claude/skills/ |
| viral-reel-generator (mcpmarket) | SKIP | Nothing -- cannot review code | N/A |
| script-writer (ailabs-393) | SKIP | Nothing -- cannot review code | N/A |
| last30days (mvanhorn) | SKIP | Nothing for Phase 1 | Revisit if external trend research needed |
| video-toolkit (digitalsamba) | SKIP | Nothing -- out of scope | N/A |
| slop-radar (renefichtmueller) | ADAPT | 200+ buzzword database, structural pattern list | Cross-reference buzzwords with anti-slop-rules.md. Use CLI for spot-checks |
| anti-slop-writing (adenaufal) | ADAPT | Vocabulary banlist (categorized), structural rules with detection metrics | Merge banlist into anti-slop-rules.md |
| Anthropic official skills | SKIP | Architectural patterns only | Reference for skill structure, not installation |

---

## Recommendations for Integration (Plan 03)

Prioritized list for Pavlo to review:

### Priority 1: Build anti-slop-rules.md by merging best of ecosystem

Combine into one reference file:
- **stop-slop:** 5-dimension scoring rubric (Directness, Rhythm, Trust, Authenticity, Density) with 35/50 threshold + 8 core rules
- **humanizer:** Top patterns from 24 categories (focus on Language Patterns, Filler/Hedging, Communication Patterns)
- **anti-slop-writing:** Complete vocabulary banlist (categorized) + structural rules
- **slop-radar:** Cross-reference 200+ buzzword database to fill gaps

This is the single most valuable output of the audit. Three independent tools have cataloged 300+ AI patterns from different angles. Merging them produces a comprehensive defense that no single tool provides alone.

### Priority 2: Install stop-slop and humanizer as companion skills

```bash
git clone https://github.com/drm-collab/stop-slop.git ~/.claude/skills/stop-slop
git clone https://github.com/abnahid/claude-humanizer.git ~/.claude/skills/humanizer
```

These provide explicit `/stop-slop` and `/humanizer` commands for manual second passes. They are supplementary to the embedded rules, not primary defenses.

### Priority 3: Replicate the feedback.log learning mechanism

stop-slop's `feedback.log` is simple but effective: read corrections before each session, append new ones. The custom skill should have a similar mechanism -- when Pavlo gives feedback on a generated script ("this sounds too formal", "don't use that phrase"), log it and apply it next time. This is the feedback loop that turns a generic tool into a personalized engine.

### Priority 4: Use slop-radar CLI for independent spot-checks

No installation needed -- `npx slop-radar score "script text"` provides a 0-100 score as an independent second opinion. Useful during development and calibration of the custom skill's anti-slop rules.

### Not recommended for integration

- **viral-reel-generator and script-writer:** Cannot review code, too generic
- **last30days:** Not needed at current cadence (1 video/week from own dev work)
- **video-toolkit:** Out of scope (video production, not scriptwriting)
- **Auto-chaining as primary strategy:** Too unreliable. Embed critical rules instead.
