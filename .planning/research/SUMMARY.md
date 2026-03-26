# Project Research Summary

**Project:** Devlog Scriptwriter Pipeline
**Domain:** AI-assisted YouTube Shorts scriptwriting for indie game devlog
**Researched:** 2026-03-26
**Confidence:** HIGH

## Executive Summary

This project is not a web application — it is a file-based AI workflow built entirely on Claude Code skills, markdown reference documents, and CLI validation tools. The recommended approach is a custom `devlog-scriptwriter` skill that orchestrates 4 phases (ideation, script generation, quality scoring, feedback analysis) rather than stitching together generic off-the-shelf skills. No existing skill covers all the requirements: devlog-specific formats, brand voice persistence, anti-slop scoring with a learning mechanism, and pronunciation filtering for a non-native speaker. The architecture is a 5-layer pipeline: Skill Layer (executable logic) → Reference Layer (brand voice, formats, metrics) → Output Layer (generated scripts) → External World (Pavlo records, uploads) → Feedback Layer (metrics flow back into generation).

The highest-leverage recommendation from combined research is to treat brand voice as the critical path. Everything — script generation, anti-slop scoring, rewrite passes — depends on a filled-out `brand-voice.md` that includes real transcript excerpts from best-performing videos (#3 "I Broke Physics" at 68.8% retention and #6 "Troll throw people" at 75.7% retention). Without this, all generation produces internet-average AI text. The three-layer anti-slop defense (embedded rules in the skill + `stop-slop` 5-dimension scoring at 35/50 threshold + `claude-humanizer` Wikipedia-based pattern detection) is what separates this pipeline from raw ChatGPT prompting, and it must be active from the first script generated.

The main risk is over-engineering the pipeline before proving the core. YouTube MCP integrations, auto-subtitle generation, Remotion rendering, and trend research tools are explicitly out of scope until 5+ videos have been published using the basic pipeline. YouTube Shorts decay significantly after 30 days, which means shipping a good script quickly is worth more than building a perfect pipeline slowly. The feedback loop — where per-video metrics (format, hook type, retention %, subscriber conversion) are logged and analyzed after every 3 videos — is the "superpower" that eventually transforms this from a generic tool into a personalized engine, but it only becomes meaningful after 10+ data points.

---

## Key Findings

### Recommended Stack

The entire "stack" consists of Claude Code skills and markdown files — no servers, no databases, no deployment. The core is a custom `devlog-scriptwriter` skill in `.claude/skills/` (project-scoped, committed to repo), flanked by two personal companion skills installed globally in `~/.claude/skills/`: `stop-slop` (drm-collab fork with learning via `feedback.log`) and `claude-humanizer` (1,600+ GitHub stars, Wikipedia-sourced AI pattern detection). Metrics are tracked manually in a markdown table — at 1 video/week cadence, this takes 2 minutes and avoids OAuth2/API maintenance overhead that has no proportional value.

**Core technologies:**
- Custom `devlog-scriptwriter` skill: Central orchestration — ideation, generation, quality pass, pattern analysis. No existing skill covers devlog specifics + brand voice + feedback loop together.
- `stop-slop` (drm-collab): 5-dimension quantitative scoring (Directness, Rhythm, Trust, Authenticity, Density), 35/50 minimum threshold, learning via `feedback.log`. Primary quality gate.
- `claude-humanizer` (abnahid): Wikipedia-based AI writing pattern detection across 24 categories. Final polish pass catching what stop-slop misses.
- `references/brand-voice.md`: Persistent voice profile with real transcript anchors. Foundation that all generation depends on.
- `references/metrics-log.md`: Structured markdown table for per-video analytics. Manual entry, feeds the feedback loop.

**What NOT to use:** ElevenLabs TTS (destroys authenticity), Remotion (premature complexity), YouTube MCP (overkill at 1/week), `viral-reel-generator` (too generic), n8n/Zapier (no integration points that need automation).

### Expected Features

**Must have (table stakes):**
- Brand voice profile with real transcript anchors — foundation for all generation
- 7 proven format templates (The Bug, The Satisfaction, Before/After, The Decision, The Trick, The Fail, The Number)
- Script generation with visual-audio dual-track output (two-column format: what viewer sees + what Pavlo says)
- Anti-slop scoring at 35+/50 threshold — every script, no exceptions
- Hook-first structure: Pre-hook visual → Question → Deliver (first 3 seconds)
- One-idea enforcement — structural check prevents cramming multiple topics

**Should have (differentiators):**
- Metrics-driven feedback loop: format + hook type + retention % + sub conversion tracked per video, pattern analysis every 3 videos, concrete rules injected into generation
- Pronunciation optimization: flag words over 3 syllables (non-technical), prefer Anglo-Saxon over Latin/Greek derivatives, mandatory contractions, one-breath sentence length cap
- Style anchor system: video #6 transcript embedded in brand-voice.md as concrete style reference
- Anti-slop rewrite pass (not just scoring): targeted rewrite of flagged sections, human reviews the diff
- Specificity injection: detect vague gamedev language ("worked on," "improved"), prompt for numbers/names/timeframes
- Title + thumbnail concept output: 3 title options + thumbnail frame suggestion alongside every script

**Defer to Phase 3+ (after 10+ videos):**
- Format performance ranking (requires sufficient data)
- Hook A/B variants
- Visual suggestion engine
- `last30days` trend research (optional, requires SCRAPECREATORS_API_KEY)

**Defer indefinitely (anti-features):**
- Automated YouTube publishing, TTS voiceover, full video generation, multi-platform adaptation, SEO keyword optimization, collaboration features

### Architecture Approach

The pipeline has 5 layers: (1) Skill Layer — executable logic in SKILL.md files under 500 lines each, following official Anthropic architecture rules; (2) Reference Layer — one-purpose-per-file knowledge base loaded on-demand (brand-voice.md, anti-slop-rules.md, video-formats.md, metrics-log.md); (3) Output Layer — generated scripts as dated markdown files in `scripts/`; (4) Feedback Layer — metrics-log.md updated post-publish feeds back into ideation; (5) Context Layer — CLAUDE.md, game-scenario.md, transcription file provide project-wide context. The main skill is project-scoped (committed to repo); companion skills are personal-scoped (in `~/.claude/skills/`). Skill chaining is NOT deterministic — critical anti-slop rules must be embedded in the main skill's references, with companion skills as supplementary passes.

**Major components:**
1. `devlog-scriptwriter/SKILL.md` — Multi-mode orchestrator (ideation mode, generation mode, analysis mode). Under 500 lines, references named files at each step.
2. `references/` directory — 4 reference files: brand-voice (filled via Pavlo interview + transcript), anti-slop-rules (60+ banned phrases + scoring rubric), video-formats (7 templates), metrics-log (per-video analytics table).
3. `scripts/` directory — dated output files in two-column visual/audio format with metadata header (format, hook type, anti-slop score, duration target).
4. Companion skills — `stop-slop` and `humanizer` installed globally, invoked as second and third quality passes after main skill scores the script.
5. Feedback cycle — manual metrics entry after each publish, pattern analysis every 3 videos, concrete format/hook preference rules updated in skill.

### Critical Pitfalls

1. **AI slop that sounds "professional" but not Pavlo** — Prevention: brand-voice.md must contain real transcript excerpts (not just descriptions), sentence length cap at 10-12 words average, mandatory Pavlo-isms ("so I...", "turns out..."), 35+/50 anti-slop threshold enforced every time. Detection: read aloud — if any sentence sounds like a tech journalist, rewrite.

2. **Feedback loop that never improves anything** — Prevention: every metrics entry must include format used, hook type, topic category, visual content. Every 3 videos, run pattern analysis that produces concrete rules ("The Satisfaction averages 70%+ retention; The Decision averages below 50%"). Rules injected as generation constraints. Track retention % and subscriber conversion, not view counts.

3. **Over-engineering before proving the core** — Prevention: Phase 1 scope is ruthlessly minimal — brand voice interview + one skill file + one generated script. "Done" means Pavlo recorded a video using an AI script, not "all tools installed." YouTube MCP, Remotion, auto-subtitles are explicitly blocked until 5+ published videos.

4. **Pronunciation-hostile scripts for a Ukrainian English speaker** — Prevention: flag words over 3 syllables (non-technical), prefer short Anglo-Saxon words, mandatory contractions, one-breath sentence length. Maintain a "hard words" ban list updated after every recording session. Prevention must be built into Phase 1 skill design, not added later.

5. **Mid-session voice drift** — Prevention: generate scripts one at a time (not in batches), re-anchor brand voice at start of each generation by including a transcript snippet in the prompt. Post-generation: read the last 3 sentences first — do they still sound like Pavlo?

---

## Implications for Roadmap

Based on combined research, the dependency graph is clear: brand voice is the bottleneck that everything else waits on, the skill cannot be validated without at least one published video, and the feedback loop requires 10+ data points before yielding actionable patterns. This drives a 3-phase structure.

### Phase 1: Foundation — Brand Voice, Skill, First Script

**Rationale:** Brand voice is the critical path (ARCHITECTURE.md, PITFALLS.md Pitfall 4). Every other component — script generation, anti-slop scoring, rewrite passes — depends on a filled-out voice profile. The skill cannot be meaningfully tested without it. Companion skills (`stop-slop`, `humanizer`) should be installed but the core skill validated first.

**Delivers:** Working pipeline that produces one publishable script. Pavlo records it, publishes it, collects first metrics.

**Addresses (from FEATURES.md):** Brand Voice Profile (P0), Format Templates (P0), Script Generation (P0), Anti-Slop Scoring (P0), Hook-First Structure (P0), Visual-Audio Dual Track (P0), One Idea Enforcement (P0).

**Avoids (from PITFALLS.md):** Pitfall 1 (AI slop), Pitfall 2 (voice drift), Pitfall 4 (over-engineering), Pitfall 5 (pronunciation), Pitfall 8 (visuals-script mismatch).

**Phase Warning:** The brand voice interview with Pavlo is a human dependency — it cannot be skipped or replaced with placeholder text. Pitfall 1 recovery (scripts sound too AI) is most likely here. Build in explicit read-aloud validation before declaring Phase 1 done.

### Phase 2: Personalization — Ideation, Style Anchoring, Pronunciation, Rewrites

**Rationale:** After 3-5 published videos, there is enough evidence to validate that the core pipeline works. Phase 2 adds features that make the pipeline meaningfully better than Phase 1 — systematic topic generation, concrete style anchors from best performers, pronunciation filtering, and automated rewrite (not just scoring). These depend on Phase 1 being validated.

**Delivers:** A pipeline that is noticeably more personalized than raw AI generation. Ideation sessions produce 5-7 grounded angles per week. Scripts require fewer manual polishing rounds. Recording sessions shorten due to pronunciation filtering.

**Addresses (from FEATURES.md):** Ideation Session (P1), Style Anchor System (P1), Pronunciation Optimization (P1), Anti-Slop Rewrite (P1), Specificity Injection (P1), Title + Thumbnail output (Pitfall 10 prevention).

**Avoids (from PITFALLS.md):** Pitfall 6 (template fatigue — format rotation built into ideation), Pitfall 7 (one-idea rule enforced structurally), Pitfall 9 (optimizing for algorithm over audience).

**Phase Warning:** Style anchor selection matters — use video #6 transcript, not an aspirational voice description. Pitfall 6 (template fatigue) starts becoming visible here — ensure format rotation is tracked and enforced.

### Phase 3: Learning — Metrics Feedback Loop, Format Analysis, Optimization

**Rationale:** Feedback loop value is directly proportional to data volume. Meaningful pattern analysis requires 10+ videos (PITFALLS.md Pitfall 3). Phase 3 operationalizes the "superpower": logged metrics produce concrete format and hook preference rules that change future generation. This phase cannot start before 10+ videos are published and 10+ metrics entries exist.

**Delivers:** A pipeline that improves over time. Format performance rankings inform ideation. Hook A/B variants optimize the highest-leverage 3 seconds. Concrete rules ("The Satisfaction format averages 70%+ retention") are injected into script generation as preferences. The pipeline becomes a personalized engine, not a generic tool with a spreadsheet attached.

**Addresses (from FEATURES.md):** Metrics Log (P2), Feedback Loop (P2), Format Performance Ranking (P2), Hook A/B Variants (P2), Visual Suggestion Engine (P2).

**Avoids (from PITFALLS.md):** Pitfall 3 (dead feedback loop), Pitfall 9 (optimizing for algorithm — authenticity check during pattern analysis). Pitfall 11 (30-day decay) reinforces consistent cadence over individual video perfection.

**Phase Warning:** Pitfall 3 is the dominant risk here. Metrics must include qualitative annotations (what format, what hook type, what was visually on screen), not just view counts. Draw no conclusions from fewer than 5 data points. Install `last30days` for trend research only if Pavlo wants external context — it is optional and should not delay Phase 3 core work.

### Phase Ordering Rationale

- Brand voice is a human bottleneck with no technical workaround — it gates everything. Phase 1 starts and ends with this.
- The skill chaining caveat (ARCHITECTURE.md Anti-Pattern 2) means critical anti-slop rules must be embedded in the main skill before companion skills are relied upon.
- Companion skill installation (`stop-slop`, `humanizer`) is parallelizable with reference file creation — install them in Phase 1 but validate the main skill first.
- Feedback loop requires temporal separation: metrics logged 48 hours post-publish, pattern analysis after every 3 videos, strategy changes only after 5+ videos. This determines Phase 3's start condition.
- YouTube's 30-day decay (Pitfall 11) means each phase should be time-boxed: Phase 1 goal is first published video within 5 working days of project start.

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 1 — Brand Voice Interview:** No template exists for conducting a brand voice interview with a non-native English speaker who is also the on-camera talent. Needs a structured interview guide that extracts speech patterns, vocabulary constraints, and Pavlo-isms from actual transcripts.
- **Phase 2 — Pronunciation Filter Implementation:** Ukrainian-specific English difficulties (th sounds, w/v confusion, consonant clusters) need a concrete rule list. This is a niche area; existing research is thin. May need Pavlo's direct input on which words cause stumbles.

Phases with standard patterns (skip research-phase):
- **Phase 1 — Skill Installation:** Well-documented in official Anthropic Claude Code skills docs. Standard directory structure, frontmatter rules, and companion skill setup are confirmed.
- **Phase 1 — Anti-Slop Rules:** Content from `stop-slop`, `claude-humanizer`, and `anti-slop-writing` skills is already researched and available. No additional research needed.
- **Phase 3 — Metrics Pattern Analysis:** Simple aggregation of a structured markdown table. Standard data analysis pattern, no novel technical work required.

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Official Anthropic docs confirm skill architecture. Companion skill repos verified (drm-collab/stop-slop, abnahid/claude-humanizer). Decision to skip YouTube API is well-reasoned and matches project scope constraints. |
| Features | HIGH | Feature list grounded in Pavlo's actual channel data (6 videos, real retention numbers). Dependencies and MVP sequencing verified against architecture constraints. Anti-features explicitly justified. |
| Architecture | HIGH | Official Claude Code skills documentation directly addresses skill structure, SKILL.md size limits, reference file loading, and frontmatter rules. Multi-mode skill pattern confirmed as standard. |
| Pitfalls | HIGH | Pitfalls sourced from multiple external research sources plus analysis of Pavlo's own channel performance data. Recovery strategies are concrete and tested patterns. |

**Overall confidence:** HIGH

### Gaps to Address

- **Brand voice interview methodology:** No standard template for extracting voice profile from a non-native English speaker creator. Resolve in Phase 1 by designing a structured interview guide before meeting with Pavlo.
- **Pronunciation ban list completeness:** The Ukrainian-English specific difficulty words are inferred from general ESL research, not from Pavlo's actual stumble history. The list will be incomplete until Pavlo records 2-3 scripts and marks problem words. Design the skill to accept ongoing ban list additions.
- **Skill chaining reliability:** ARCHITECTURE.md flags that skill chaining (main skill → stop-slop → humanizer) is MEDIUM confidence — not a guaranteed behavior in Claude Code. Mitigation is already in the design (embed critical rules in main skill), but actual reliability should be validated during Phase 1 with the first script generation.
- **Stop-slop feedback.log effectiveness:** The learning mechanism in `drm-collab/stop-slop` accumulates corrections over time, but how quickly it adapts to Pavlo's specific patterns is untested. Monitor after 5+ uses.

---

## Sources

### Primary (HIGH confidence)
- [Claude Code Skills Documentation](https://code.claude.com/docs/en/skills) — skill architecture, directory structure, frontmatter reference, invocation control
- [Skill Authoring Best Practices](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices) — progressive disclosure, conciseness, testing guidelines
- [drm-collab/stop-slop](https://github.com/drm-collab/stop-slop) — 5-dimension scoring with feedback learning
- [abnahid/claude-humanizer](https://github.com/abnahid/claude-humanizer) — Wikipedia-based AI pattern detection (1,600+ stars)
- Pavlo's channel data: `videos-1-6-transcription.md` — 6 videos analyzed with real retention and subscriber data

### Secondary (MEDIUM confidence)
- [mvanhorn/last30days-skill](https://github.com/mvanhorn/last30days-skill) — multi-platform trend research (value depends on usage pattern)
- [renefichtmueller/slop-radar](https://github.com/renefichtmueller/slop-radar) — CLI slop detector with 245 buzzwords
- [YouTube Shorts Best Practices 2026 - JoinBrands](https://joinbrands.com/blog/youtube-shorts-best-practices/) — retention benchmarks and hook formulas
- [YouTube Shorts Retention Rate 2026 - Shortimize](https://www.shortimize.com/blog/youtube-shorts-retention-rate) — 70%+ intro retention benchmark
- [Brand Voice AI Prompt Template - Atom Writer](https://www.atomwriter.com/blog/brand-voice-ai-prompt-template/) — voice profile structure
- [How to Stop Content From Sounding Like AI Slop - 1up.ai](https://1up.ai/blog/ai-slop-guidelines/) — anti-slop methodology
- [YouTube for Indie Games: Devlog Success Story](https://freakingcoolindies.com/1-2/) — format performance data

### Tertiary (LOW confidence)
- [MCPMarket: Viral Reel Generator](https://mcpmarket.com/tools/skills/viral-reel-generator) — reference for hook patterns (not used)
- [YouTube Demonetization Policy 2026 (ShortVids)](https://shortvids.co/youtube-ai-content-demonetization-policy/) — AI content policy context
- [Indie Games Go-to-Market Playbook 2025 (Medium)](https://medium.com/design-bootcamp/entering-indie-games-in-2025-a-senior-engineers-go-to-market-playbook-cdc507f3bf0f) — devlog format recommendations

---
*Research completed: 2026-03-26*
*Ready for roadmap: yes*
