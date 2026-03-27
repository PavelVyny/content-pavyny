# Phase 1: Foundation - Research

**Researched:** 2026-03-27
**Domain:** Claude Code skill architecture, brand voice extraction, anti-slop tooling
**Confidence:** HIGH

## Summary

Phase 1 builds three things: an ecosystem audit report, a brand voice profile, and a working Claude Code skill with companion quality tools. The research below focuses on **implementation details** -- how to structure SKILL.md files according to official 2026 Anthropic documentation, how to extract brand voice from existing transcripts, and how skill chaining actually works (and where it fails).

The official Claude Code skill docs confirm the architecture already designed in project-level research is correct: SKILL.md under 500 lines, reference files one level deep, frontmatter with name/description. Key new finding: skill chaining is NOT guaranteed -- Claude decides when to invoke skills based on context matching, not deterministic sequencing. This means the main skill MUST embed critical anti-slop rules rather than depending on companion skills firing.

**Primary recommendation:** Build the main devlog-scriptwriter skill with embedded anti-slop rules as the primary quality gate. Install stop-slop and humanizer as supplementary passes. Test chaining reliability before relying on it.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Clone each identified skill/tool and review code (SKILL.md, rules, scoring logic) -- but do NOT test them in production. Code review depth, not end-to-end testing.
- **D-02:** Conduct a broad search beyond already-identified tools -- GitHub, MCPMarket, Reddit, community sources. Full 2026 landscape analysis, not just the 6 tools from CLAUDE.md.
- **D-03:** Output is a report with verdicts (use/adapt/skip) per tool. Pavlo reviews the report BEFORE any integration happens -- report first, then Pavlo decides what to integrate.
- **D-04:** Two-step interview: (1) Claude analyzes all 6 existing transcripts from videos-1-6-transcription.md to extract speech patterns, then (2) presents findings to Pavlo for confirmation/correction with targeted follow-up questions on gaps.
- **D-05:** Style anchors: use BOTH video #3 ("I Broke Physics") and #6 ("Troll throw people") transcripts -- the two best performers by retention and subscriber conversion.
- **D-06:** Voice profile must capture ALL 4 dimensions: Pavlo-isms ("so I...", "turns out...", "let's..."), tone/humor (self-deprecating, casual, honest about mistakes), sentence rhythm (short sentences, pauses, delivery tempo), and banned words/phrases (things Pavlo would never say).
- **D-07:** Skill lives in project scope: `.claude/skills/devlog-scriptwriter/` -- committed to repo.
- **D-08:** 4 reference files required: brand-voice.md, anti-slop-rules.md, video-formats.md, metrics-log.md.
- **D-09:** Test skill chaining (main -> stop-slop -> humanizer) first before deciding fallback strategy. If chaining works reliably, use it. If not, embed critical rules in main skill.
- **D-10:** Companion skill installation approach is Claude's discretion -- decide after ecosystem audit reveals which tools are worth integrating and how.

### Claude's Discretion
- Skill structure decision (single multi-mode SKILL.md vs separate skills) -- Claude decides based on ecosystem audit findings and official Anthropic skill architecture best practices.
- Companion skill installation method (clone repos vs extract rules vs hybrid) -- Claude decides based on audit results and what actually works.

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| ECOS-01 | Audit all identified Claude Code skills (stop-slop, humanizer, viral-reel-generator, script-writer, last30days, video-toolkit) | Ecosystem Audit section: repo structure, scoring logic, file contents for each tool |
| ECOS-02 | Broader ecosystem search for scriptwriting/content skills and MCP servers not yet discovered | Broader Search Patterns section: search queries, sources to check |
| ECOS-03 | Evaluate agentic workflow approaches (skill chaining, MCP integrations, automation patterns) | Skill Chaining section: how it works, reliability concerns, fallback strategy |
| ECOS-04 | Integrate best-of-ecosystem components into the custom pipeline | Don't Hand-Roll section: what to extract from each tool |
| VOIC-01 | Conduct brand voice interview with Pavlo to extract speech patterns | Brand Voice Extraction section: transcript analysis methodology, interview questions |
| VOIC-02 | Create brand-voice.md with persona definition, tone dimensions, vocabulary rules | Brand Voice File Structure section: exact format and content template |
| VOIC-03 | Embed transcript excerpt from best-performing videos as style anchor | Style Anchoring section: which excerpts, how to embed |
| SKIL-01 | Create custom devlog-scriptwriter skill in .claude/skills/ with SKILL.md under 500 lines | SKILL.md Architecture section: official structure, frontmatter, size limits |
| SKIL-02 | Install stop-slop companion skill globally in ~/.claude/skills/ | Companion Installation section: clone command, file verification |
| SKIL-03 | Install humanizer companion skill globally in ~/.claude/skills/ | Companion Installation section: clone command, file verification |
| SKIL-04 | Verify skill chaining works (main skill -> stop-slop -> humanizer) | Skill Chaining section: test approach, fallback strategy |
</phase_requirements>

## Project Constraints (from CLAUDE.md)

- Communicate with Pavlo in Russian. Scripts for videos in English.
- Anti-slop is the top priority -- AI script that sounds like AI is worse than no script.
- Feedback loop is the superpower -- feed metrics back into generation.
- Specificity = credibility -- concrete numbers, details, experiences.
- One Short = one idea.
- Visuals drive, voice follows.
- Scripts must be easy to pronounce for non-native English speaker.

## SKILL.md Architecture (Official Anthropic Documentation)

### Verified Structure (HIGH confidence)

Source: [Claude Code Skills Documentation](https://code.claude.com/docs/en/skills) and [Skill Authoring Best Practices](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices)

```
.claude/skills/devlog-scriptwriter/
  SKILL.md                         # Required. Under 500 lines.
  references/
    brand-voice.md                 # Pavlo's voice profile
    anti-slop-rules.md             # Banned phrases + scoring rubric
    video-formats.md               # 7 format templates
    metrics-log.md                 # Per-video analytics journal
```

### Frontmatter Fields

| Field | Value | Notes |
|-------|-------|-------|
| `name` | `devlog-scriptwriter` | Max 64 chars, lowercase + hyphens only. Cannot contain "anthropic" or "claude". |
| `description` | See below | Max 1024 chars. Third person. Include triggers. |
| `disable-model-invocation` | `false` (default) | Claude auto-activates when script/video topics come up. |
| `allowed-tools` | omit | No restrictions needed. |

**Description template (must be third person, under 1024 chars):**

```
Generates natural-sounding YouTube Shorts devlog scripts with anti-slop scoring and brand voice matching. Handles ideation (topic angles from dev progress), script generation (dual-track visual + voiceover), and metrics analysis (pattern detection from performance data). Use when writing video scripts, brainstorming devlog ideas, analyzing video performance, or when the user mentions scripts, devlog, YouTube, shorts, video ideas, or hook.
```

### Key Architecture Rules (Verified)

1. **SKILL.md body under 500 lines** -- process steps only. Detailed reference content goes in separate files.
2. **Reference files one level deep** -- SKILL.md references files directly. Files do NOT reference other files. Claude may only partially read nested references.
3. **Explicit file referencing** -- use markdown links: `See [brand-voice.md](references/brand-voice.md)` so Claude knows what each file contains and when to load it.
4. **Forward slashes in all paths** -- even on Windows. `references/brand-voice.md` not `references\brand-voice.md`.
5. **Description in third person** -- "Generates scripts..." not "I generate scripts..."
6. **No time-sensitive content** -- no "as of March 2026" in skill files.
7. **Progressive disclosure** -- at startup only name+description load into context (consuming system prompt tokens). Full SKILL.md loads only when skill is invoked. Reference files load only when Claude reads them.
8. **String substitution** -- `$ARGUMENTS` for user input, `${CLAUDE_SKILL_DIR}` for skill directory path.

### Skill Resolution Order

When skills share the same name: enterprise > personal > project. Plugin skills use namespaced names and cannot conflict. For this project, `devlog-scriptwriter` in `.claude/skills/` (project scope) will not conflict with anything in `~/.claude/skills/` (personal scope) since they have different names.

### Context Budget

Skill descriptions consume from a budget of 2% of the context window (fallback: 16,000 characters). With few skills installed, this is not a concern. If budget is exceeded, skills get excluded. Check via `/context` command.

## Skill Chaining: How It Actually Works

### Mechanism (MEDIUM confidence)

Claude Code does NOT have a formal skill chaining API. What happens:

1. When the main skill's instructions say "after generating a script, score it using stop-slop methodology," Claude reads this instruction.
2. Claude's model decides whether to invoke the stop-slop skill based on whether stop-slop's **description** matches the current task context.
3. If stop-slop's description mentions "scoring text" and Claude is currently handling text that needs scoring, it MAY auto-invoke stop-slop.
4. This is probabilistic, not deterministic.

### Reliability Concerns

- **Not guaranteed sequencing**: Claude decides when/whether to invoke companion skills.
- **Description matching is fuzzy**: If companion skill descriptions are vague, they may not trigger.
- **Context window pressure**: Each additional skill description consumes system prompt tokens.
- **No error handling**: If a companion skill fails to trigger, there is no retry mechanism.

### Recommended Approach for SKIL-04

1. **Test chaining first** (per D-09): Generate a test script, then observe whether Claude auto-invokes stop-slop and humanizer.
2. **Expected outcome**: Chaining will work SOMETIMES but not reliably every time.
3. **Fallback strategy**: Embed the most critical anti-slop rules (banned phrases, scoring rubric) directly in the main skill's `references/anti-slop-rules.md`. This makes the main skill self-sufficient for the primary quality gate.
4. **Companion skills as bonus passes**: Keep stop-slop and humanizer installed. Users can explicitly invoke `/stop-slop` or `/humanizer` as manual second passes.

### How to Make Chaining More Reliable

- Make companion skill descriptions very specific with clear trigger words
- In the main SKILL.md, explicitly instruct: "After generating the script, invoke the stop-slop skill by asking Claude to score the text"
- The user can also manually trigger: generate script -> `/stop-slop` -> `/humanizer`

## Ecosystem Audit: Tool-by-Tool Implementation Details

### stop-slop (drm-collab)

**Source:** [github.com/drm-collab/stop-slop](https://github.com/drm-collab/stop-slop)

**What to extract:**

The 5 scoring dimensions with their assessment questions:

| Dimension | Question |
|-----------|----------|
| Directness | Statements or announcements? |
| Rhythm | Varied or metronomic? |
| Trust | Respects reader intelligence? |
| Authenticity | Sounds human? |
| Density | Anything cuttable? |

The 8 core rules:
1. Cut filler phrases
2. Break formulaic structures
3. Use active voice
4. Be specific
5. Put reader in the room
6. Vary rhythm
7. Trust readers
8. Cut quotables (remove "tweetable" phrasing that sounds crafted)

**feedback.log mechanism**: The skill reads `feedback.log` before every execution and applies corrections from prior sessions. New corrections get appended. This is the learning loop.

**Installation**: Can be installed as `.claude/commands/stop-slop.md` (simple) or `skills/stop-slop/` (full skill). For this project, use `~/.claude/skills/stop-slop/` (personal scope, per D-07 and architecture decision).

**Verdict recommendation**: ADAPT. Extract the scoring dimensions and rules into our `anti-slop-rules.md`. Also install as companion skill for explicit `/stop-slop` invocation.

### humanizer (abnahid/claude-humanizer)

**Source:** [github.com/abnahid/claude-humanizer](https://github.com/abnahid/claude-humanizer)

**What to extract:**

24 pattern categories organized in 5 groups:

1. **Content Patterns** (6): significance inflation, notability name-dropping, superficial analyses, promotional language, vague attributions, formulaic challenges
2. **Language Patterns** (6): AI vocabulary ("Additionally," "testament," "landscape"), copula avoidance, negative parallelisms ("not just X, it's Y"), rule of three, synonym cycling, false ranges
3. **Style Patterns** (6): em dash overuse, boldface overuse, inline-header lists, title case headings, emojis, curly quotes
4. **Communication Patterns** (3): chatbot artifacts, cutoff disclaimers, sycophantic tone
5. **Filler and Hedging** (3): filler phrases, excessive hedging, generic conclusions

**Multi-pass approach**: Initial rewrite -> audit pass -> second rewrite.

**File structure**: `SKILL.md` + `README.md` + `WARP.md`

**Verdict recommendation**: ADAPT. The 24 pattern categories are gold -- extract the most relevant ones (especially Language Patterns and Filler/Hedging) into our anti-slop-rules.md. Install as companion for explicit `/humanizer` invocation.

### Tools to Audit During Execution (Broader Search)

For ECOS-02 (broader search), the planner should include tasks to search:

1. **GitHub**: `claude skill scriptwriting`, `claude skill youtube`, `claude skill content creator`, `SKILL.md anti-slop`
2. **MCPMarket**: Browse skills category for content/video/script tools
3. **Reddit**: r/ClaudeAI, r/ClaudeCode for skill recommendations
4. **Community lists**: Composio top skills list, OneAway skill directory, FastMCP skill directory

**Known tools from project-level research to audit:**
- `viral-reel-generator` (mcpmarket) -- reference for hook patterns only
- `script-writer` (ailabs-393) -- persistent style database, evaluate relevance
- `last30days` (mvanhorn) -- trend research, likely defer to v2
- `claude-code-video-toolkit` (digitalsamba) -- Remotion/FFmpeg, out of scope for Phase 1
- `slop-radar` (renefichtmueller) -- CLI tool with 245 buzzwords, useful reference
- `anti-slop-writing` (adenaufal) -- universal system prompt rules, extract into anti-slop-rules.md

## Brand Voice Extraction Methodology

### Step 1: Transcript Analysis (Claude performs, before interview)

Analyze all 6 transcripts from `videos-1-6-transcription.md` across these 4 dimensions:

#### Dimension 1: Pavlo-isms (Signature Phrases)

Patterns found in transcripts:

| Pattern | Examples | Frequency |
|---------|----------|-----------|
| "so I..." opener | "so I decided to make a game about a troll" (#1, #3, #5) | 3/6 videos -- signature opener |
| "turns out..." transition | "turns out, the throw impulse was applied to just one body part" (#6) | Present in best video |
| "let's..." invitation | "let's write some code" (#3), "let's add a trajectory arc" (#6), "let's find something that fights back" (#3) | 3+ uses across videos |
| "okay..." reaction | "okay... a bit too strong" (#3), "okay, let's try again" (#3) | Authentic hesitation |
| Self-identification as new | "I'm new to all of this" (#3) | Underdog framing |
| Contrast setup | "I'm pretty good at programming but when it comes to art I'm absolutely terrible" (#1) | Humor through contrast |

#### Dimension 2: Tone and Humor

| Quality | Evidence |
|---------|----------|
| Self-deprecating | "I'm absolutely terrible [at art]" (#1), "yeah... it was easier with the crates" (#6) |
| Honest about struggles | "the process is fun and painful at the same time, like everything in gamedev" (#5) |
| Understated excitement | "every small thing that works feels like a little victory" (#3) |
| Casual technicality | Mixes technical terms with simple language: "physics asset -- it's basically the instruction how each body part can move when it gets hit" (#5) |
| Forward momentum | Almost every video ends with a tease: "next time...", "let's find something that fights back" |

#### Dimension 3: Sentence Rhythm

| Pattern | Evidence |
|---------|----------|
| Very short sentences | "The inputs work." "Time to fix this." "That's the vibe." |
| Fragments are okay | "And every troll needs something to smash." |
| Technical then simple | "The throw impulse was applied to just one body part, creating rotational chaos." -> "So instead of pushing one bone, let's push the whole body." |
| Natural pauses | "okay... a bit too strong", "um... okay" -- these are authentic Pavlo |
| Never complex grammar | No subordinate clauses, no semicolons, no elaborate sentence constructions |
| Maximum ~15 words per sentence | Longest sentences are around 15 words |

#### Dimension 4: Banned Words / Things Pavlo Would Never Say

This dimension requires interview confirmation, but based on transcript analysis, Pavlo DOES NOT use:

| Never Used | AI Would Use |
|------------|-------------|
| "journey" | Common AI slop |
| "dive into" / "deep dive" | Common AI slop |
| "game-changer" | Hype language |
| "incredible" / "amazing" | Inflated adjectives |
| "leverage" / "utilize" | Corporate vocabulary |
| "Hey guys!" / "What's up everyone" | YouTuber cliches |
| "Don't forget to like and subscribe" | CTA spam |
| "In this video I'll show you" | Tutorial framing (Pavlo TELLS a story, doesn't teach) |
| Multi-clause sentences | Grammar too complex for conversational delivery |
| Rhetorical questions to audience | Pavlo talks TO the viewer, not AT them |

### Step 2: Interview Questions for Pavlo (Confirmation + Gaps)

After presenting the analysis above, ask these targeted questions:

1. **Confirm patterns**: "I found these signature phrases in your videos: 'so I...', 'turns out...', 'let's...', 'okay...' -- do these feel right? Any I missed?"
2. **Banned vocabulary**: "Are there specific words or phrases that would make you cringe if you read them in a script? Words that feel too 'YouTuber' or too 'AI'?"
3. **Humor boundaries**: "Your humor is self-deprecating -- is there a line? Things you'd joke about vs things you wouldn't?"
4. **Technical depth**: "How technical can the voiceover get? You explained physics assets in simple terms in video #5 -- is that the right level?"
5. **Pronunciation comfort**: "Are there English words or sounds you find hard to pronounce? Any constructions you avoid when speaking?"
6. **Emotional range**: "Videos #3 and #6 show excitement about things working. Do you also want scripts that show frustration, confusion, or disappointment?"
7. **Future direction**: "Is the 'I'm new to all of this' framing still accurate, or are you growing past that?"

### Brand Voice File Structure

```markdown
# Brand Voice: Pavlo (Devlog Scriptwriter)

## Persona
[2-3 sentences describing who Pavlo is as a content creator]

## Style Anchors
[Embed excerpts from video #3 and #6 as concrete examples]

### Video #3: "I Broke Physics" (68.8% retention, +21 subs)
[Key excerpt with visual descriptions]

### Video #6: "Troll throw people" (75.7% retention, +16 subs)
[Key excerpt with visual descriptions]

## Signature Phrases (USE THESE)
- "so I..." (opener)
- "turns out..." (transition to explanation)
- "let's..." (invitation to next step)
- "okay..." (authentic reaction)
[+ any additions from interview]

## Tone Dimensions
- Self-deprecating humor: [specific boundaries from interview]
- Technical simplicity: [depth level from interview]
- Honest about struggles: [examples]
- Forward momentum: [end every video with a tease]

## Sentence Rules
- Maximum ~15 words per sentence
- Fragments are fine
- No subordinate clauses
- Technical terms require immediate simple explanation
- Natural pauses ("okay...", "um...") are authentic, not errors

## Vocabulary Rules

### USE (Pavlo's actual words)
[List from transcripts + interview]

### NEVER USE (banned)
[List from analysis + interview confirmation]

## Pronunciation Notes
[From interview -- hard consonant clusters to avoid, preferred contractions]

## On-Brand Example
[Full excerpt from video #6 -- the gold standard]

## Off-Brand Example
[AI-generated version of same content -- showing what to avoid]
```

## Anti-Slop Rules File Structure

Combine the best rules from stop-slop (8 core rules + 5 scoring dimensions) and humanizer (24 pattern categories) into a single reference file:

```markdown
# Anti-Slop Rules

## Scoring Rubric (from stop-slop)

Score each dimension 1-10. Total must be 35+/50.

| Dimension | Score 1-3 (Bad) | Score 7-10 (Good) |
|-----------|-----------------|-------------------|
| Directness | Announcements, filler | Direct statements |
| Rhythm | Metronomic, same length | Varied, punchy |
| Trust | Over-explains | Respects intelligence |
| Authenticity | Sounds generated | Sounds human |
| Density | Padding, fluff | Every word earns its place |

## Banned Phrases (60+)
[Organized by category: AI vocabulary, filler, hype, YouTuber cliches]

## Structural Rules
[From stop-slop's 8 rules + humanizer's structural patterns]

## Detection Patterns
[Top patterns from humanizer's 24 categories, filtered for script relevance]
```

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Anti-slop phrase list | Custom banned word list from scratch | Extract from stop-slop (8 rules) + humanizer (24 patterns) + slop-radar (245 buzzwords) | These tools collectively catalog 300+ real AI patterns. Hand-compiling would miss most of them. |
| Scoring rubric | Invent scoring dimensions | Adapt stop-slop's 5-dimension model | The 5 dimensions (directness, rhythm, trust, authenticity, density) are well-tested and map to real AI tells. |
| AI pattern detection | Write custom pattern matching | Extract humanizer's 24-category taxonomy | Based on Wikipedia's WikiProject AI Cleanup -- sourced from thousands of real AI text instances. |
| Skill architecture | Guess at SKILL.md format | Follow official Anthropic docs exactly | Official docs specify frontmatter fields, size limits, resolution order. Deviating causes skills to not trigger. |
| Voice profile format | Invent profile structure | Use the 4-dimension framework from CONTEXT.md | Pavlo-isms, tone/humor, sentence rhythm, banned words are the confirmed dimensions. |

## Common Pitfalls

### Pitfall 1: Monolithic SKILL.md

**What goes wrong:** Putting all rules, voice profile, format templates, and scoring logic in SKILL.md.
**Why it happens:** Seems simpler to have everything in one file.
**How to avoid:** SKILL.md is the orchestrator (under 500 lines). Reference files hold the content. Each step in SKILL.md explicitly names which reference file to load.
**Warning signs:** SKILL.md exceeds 300 lines.

### Pitfall 2: Depending on Skill Chain Firing

**What goes wrong:** Assuming stop-slop will always auto-invoke after script generation.
**Why it happens:** Mental model of skills as a deterministic pipeline.
**How to avoid:** Embed critical anti-slop rules in the main skill's reference files. Companion skills are supplementary, not primary.
**Warning signs:** Generated scripts pass without any quality check when companions don't trigger.

### Pitfall 3: Abstract Voice Description Without Anchors

**What goes wrong:** Describing Pavlo's voice as "casual and conversational" without transcript examples.
**Why it happens:** Easier to write abstract descriptions than extract concrete patterns.
**How to avoid:** Embed real transcript excerpts from videos #3 and #6 in brand-voice.md. Include both "on-brand" and "off-brand" examples.
**Warning signs:** Generated scripts sound generically casual, not specifically like Pavlo.

### Pitfall 4: Over-Broad Ecosystem Search

**What goes wrong:** Spending hours evaluating every Claude Code skill on GitHub.
**Why it happens:** D-02 says "broad search" and D-01 says "clone and review code."
**How to avoid:** Clone and review means: read the SKILL.md, check the rules/scoring logic, decide use/adapt/skip. Not: install, configure, run test scenarios.
**Warning signs:** More than 30 minutes per tool, or auditing tools clearly outside scriptwriting domain.

### Pitfall 5: Skipping the Interview

**What goes wrong:** Assuming transcript analysis is sufficient for brand voice.
**Why it happens:** Claude can extract patterns from text and it seems complete.
**How to avoid:** The interview step (D-04) exists because: transcripts miss pronunciation concerns, humor boundaries, and words Pavlo actively avoids but hasn't had occasion to use in 6 videos.
**Warning signs:** brand-voice.md has no "banned words from Pavlo" section, only "words not found in transcripts."

### Pitfall 6: Companion Skills in Wrong Scope

**What goes wrong:** Installing stop-slop and humanizer in `.claude/skills/` (project scope) instead of `~/.claude/skills/` (personal scope).
**Why it happens:** Copy-paste or assumption that everything goes in project.
**How to avoid:** General-purpose skills (stop-slop, humanizer) go in `~/.claude/skills/` (personal, reusable across projects). Domain-specific skill (devlog-scriptwriter) goes in `.claude/skills/` (project, committed to repo).
**Warning signs:** `.claude/skills/` directory has stop-slop and humanizer alongside devlog-scriptwriter.

## Code Examples

### SKILL.md Frontmatter (Official Pattern)

```yaml
---
name: devlog-scriptwriter
description: >
  Generates natural-sounding YouTube Shorts devlog scripts with anti-slop
  scoring and brand voice matching. Handles ideation (topic angles from dev
  progress), script generation (dual-track visual + voiceover), and metrics
  analysis (pattern detection from performance data). Use when writing video
  scripts, brainstorming devlog ideas, analyzing video performance, or when
  the user mentions scripts, devlog, YouTube, shorts, video ideas, or hook.
---
```

Source: [Claude Code Skills Docs](https://code.claude.com/docs/en/skills) -- frontmatter reference table.

### Multi-Mode Skill Pattern

```markdown
# Devlog Scriptwriter

Based on the request, operate in one of these modes:

## Mode: Ideation
When asked for ideas, topics, or angles:
1. Read [metrics-log.md](references/metrics-log.md) for performance patterns
2. Ask about this week's dev progress
3. Generate 5-7 angles using formats from [video-formats.md](references/video-formats.md)
4. Tag each angle with format name and visual potential

## Mode: Script Generation
When asked to write a script:
1. Read [brand-voice.md](references/brand-voice.md) for voice profile
2. Read [anti-slop-rules.md](references/anti-slop-rules.md) for constraints
3. Read [video-formats.md](references/video-formats.md) for the chosen format template
4. Generate script in dual-track format (visual | voiceover)
5. Self-score against anti-slop rubric (must be 35+/50)
6. If score < 35, rewrite with violations fixed and re-score

## Mode: Analysis
When asked to analyze metrics or performance:
1. Read [metrics-log.md](references/metrics-log.md)
2. Compare formats, hooks, topics, durations
3. Generate actionable rules for next generation cycle
```

Source: Pattern derived from official docs multi-mode examples and existing project architecture research.

### Reference File Linking (Official Pattern)

```markdown
## Additional resources

- For Pavlo's voice profile and style examples, see [brand-voice.md](references/brand-voice.md)
- For banned phrases and scoring rubric, see [anti-slop-rules.md](references/anti-slop-rules.md)
- For video format templates, see [video-formats.md](references/video-formats.md)
- For historical performance data, see [metrics-log.md](references/metrics-log.md)
```

Source: [Claude Code Skills Docs](https://code.claude.com/docs/en/skills) -- "Add supporting files" section. Uses markdown links so Claude knows what each file contains and when to load it.

### Companion Skill Installation

```bash
# Personal scope (reusable across projects)
git clone https://github.com/drm-collab/stop-slop.git ~/.claude/skills/stop-slop
git clone https://github.com/abnahid/claude-humanizer.git ~/.claude/skills/humanizer

# Verify SKILL.md exists
ls ~/.claude/skills/stop-slop/SKILL.md
ls ~/.claude/skills/humanizer/SKILL.md
```

### Skill Chaining Test Protocol

```
1. Generate a test script using /devlog-scriptwriter
2. Observe: did Claude auto-invoke stop-slop?
3. Observe: did Claude auto-invoke humanizer?
4. If YES to both: chaining works, keep companion skills as-is
5. If NO to either: embed critical rules in main skill's anti-slop-rules.md
6. Either way: keep companion skills for explicit /stop-slop and /humanizer invocation
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `.claude/commands/` for custom commands | `.claude/skills/` with SKILL.md + supporting files | 2025-Q4 | Commands still work but skills add frontmatter, supporting files, and auto-invocation |
| Skills as simple markdown files | Skills with YAML frontmatter (name, description, context, allowed-tools) | 2025-Q4 | Frontmatter enables invocation control, subagent execution, and tool restrictions |
| No official size guidance | SKILL.md under 500 lines recommended | 2026-Q1 (best practices doc) | Progressive disclosure pattern with reference files |
| No skill budget awareness | 2% of context window for skill descriptions (fallback 16K chars) | 2026 | Too many skills can cause exclusions; check via /context |
| Implicit skill invocation only | `context: fork` for subagent execution | 2026 | Skills can run in isolated context with specific agent types |

## Open Questions

1. **Skill chaining reliability rate**
   - What we know: Claude CAN invoke multiple skills in sequence, but it's probabilistic
   - What's unclear: What percentage of the time does chaining actually fire without explicit user prompting?
   - Recommendation: Test during SKIL-04, have fallback ready (critical rules embedded in main skill)

2. **Anti-slop score calibration for conversational scripts**
   - What we know: stop-slop uses 35/50 threshold designed for prose
   - What's unclear: Whether conversational devlog scripts (short, fragmented, with "okay..." and "um...") would score differently than formal writing
   - Recommendation: Score video #6 transcript against the rubric as calibration test. Adjust threshold if authentic Pavlo speech scores below 35.

3. **Description length optimization**
   - What we know: Max 1024 chars, used for auto-invocation matching
   - What's unclear: Whether a very detailed description (listing many trigger words) improves or degrades matching
   - Recommendation: Start with medium-length description, iterate based on whether skill triggers when expected

## Sources

### Primary (HIGH confidence)
- [Claude Code Skills Documentation](https://code.claude.com/docs/en/skills) -- complete skill architecture, frontmatter reference, supporting files, invocation control, skill resolution, context budget
- [Skill Authoring Best Practices](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices) -- progressive disclosure, conciseness, naming conventions, description writing, 500-line limit, anti-patterns
- [Anthropic Skills Repository: skill-creator](https://github.com/anthropics/skills/blob/main/skills/skill-creator/SKILL.md) -- official Anthropic patterns for skill development
- [drm-collab/stop-slop](https://github.com/drm-collab/stop-slop) -- 5-dimension scoring, 8 core rules, feedback.log mechanism
- [abnahid/claude-humanizer](https://github.com/abnahid/claude-humanizer) -- 24-category AI pattern detection, multi-pass approach

### Secondary (MEDIUM confidence)
- [Composio: Top Claude Code Skills 2026](https://composio.dev/content/top-claude-skills) -- ecosystem landscape
- [Lee Hanchung: Claude Skills Deep Dive](https://leehanchung.github.io/blogs/2025/10/26/claude-skills-deep-dive/) -- first-principles analysis
- [Mikhail Shilkov: Inside Claude Code Skills](https://mikhail.io/2025/10/claude-code-skills/) -- invocation and structure internals

### Tertiary (LOW confidence)
- Brand voice extraction methodology is based on transcript analysis patterns (no specific authoritative source for "extracting brand voice from YouTube Shorts transcripts" -- methodology is synthesized from standard content analysis techniques)

## Metadata

**Confidence breakdown:**
- SKILL.md architecture: HIGH -- verified against official Anthropic docs (March 2026)
- Ecosystem audit methodology: HIGH -- repos are public, structure is verifiable
- Brand voice extraction: MEDIUM -- methodology is sound but effectiveness depends on interview quality
- Skill chaining: MEDIUM -- mechanism is documented but reliability is probabilistic
- Anti-slop scoring calibration: MEDIUM -- threshold may need adjustment for conversational style

**Research date:** 2026-03-27
**Valid until:** 2026-04-27 (stable domain -- skill architecture unlikely to change within 30 days)
