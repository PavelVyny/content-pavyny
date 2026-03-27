# Phase 1: Foundation - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-27
**Phase:** 1-foundation
**Areas discussed:** Ecosystem audit, Brand voice, Skill design, Companion tools

---

## Ecosystem Audit

### Audit Depth
| Option | Description | Selected |
|--------|-------------|----------|
| Clone + test | Clone each repo, study code, try in practice — max info, slow | |
| Code review only | Clone and study SKILL.md / code, but don't test (faster) | ✓ |
| Docs + README | Only README/docs — quick screening, dig deeper into promising ones | |

**User's choice:** Code review only
**Notes:** Fast enough for assessment, deep enough to judge quality

### New Tools Search
| Option | Description | Selected |
|--------|-------------|----------|
| Broad search | GitHub, MCPMarket, Reddit, community — full 2026 landscape | ✓ |
| Targeted search | Search only for specific gaps (pronunciation, metrics) | |
| Skip new search | Enough found — focus on integrating what we have | |

**User's choice:** Broad search
**Notes:** Full landscape analysis, not limited to already-identified tools

### Output Format
| Option | Description | Selected |
|--------|-------------|----------|
| Report + action | Document with verdicts + immediately integrate best tools | |
| Report only | Report first, Pavlo decides what to integrate | ✓ |

**User's choice:** Report only
**Notes:** Pavlo wants to review audit results before integration decisions

---

## Brand Voice

### Interview Method
| Option | Description | Selected |
|--------|-------------|----------|
| Transcript first | Claude analyzes transcripts, extracts patterns, shows for confirmation | |
| Q&A live | Claude asks questions live: tone, humor, marker words, taboos | |
| Both | First analyze transcripts, then clarifying questions on gaps | ✓ |

**User's choice:** Both
**Notes:** Maximum coverage — data-driven extraction + human validation

### Style Anchor
| Option | Description | Selected |
|--------|-------------|----------|
| #6 (Recommended) | Troll throw people — 8.7K views, 75.7% stayed, +16 subs | |
| #3 | I Broke Physics — 7.7K views, 68.8% stayed, +21 subs | |
| Both #3 + #6 | Use both as anchors — more data for voice profile | ✓ |
| All 6 | All transcripts as corpus — maximum patterns | |

**User's choice:** Both #3 + #6
**Notes:** Best performers by both retention and subscriber metrics

### Voice Dimensions
| Option | Description | Selected |
|--------|-------------|----------|
| Pavlo-isms | Characteristic phrases: "so I...", "turns out...", "let's..." | ✓ |
| Tone/humor | Self-irony, casual, honesty about mistakes | ✓ |
| Sentence rhythm | Short sentences, pauses, delivery tempo | ✓ |
| Banned words | Words/phrases Pavlo would NEVER say | ✓ |

**User's choice:** All 4 dimensions
**Notes:** Full voice profile — no dimension skipped

---

## Skill Design

### Structure
| Option | Description | Selected |
|--------|-------------|----------|
| Single multi-mode | One SKILL.md with 3 modes (ideation/generation/analysis) | |
| Separate skills | 3 separate skills — simpler each, but reference duplication | |
| You decide | Claude decides based on ecosystem audit results | ✓ |

**User's choice:** You decide (Claude's discretion)
**Notes:** Decision deferred to after audit reveals best practices

### Scope
| Option | Description | Selected |
|--------|-------------|----------|
| Project (Recommended) | .claude/skills/ — tied to this project, committed to repo | ✓ |
| Personal | ~/.claude/skills/ — available everywhere, not in repo | |

**User's choice:** Project scope
**Notes:** Project-scoped, version-controlled

### Reference Files
| Option | Description | Selected |
|--------|-------------|----------|
| brand-voice.md | Pavlo's voice profile | ✓ |
| anti-slop-rules.md | 60+ banned phrases, structural rules | ✓ |
| video-formats.md | 7 format templates (Bug, Satisfaction, etc.) | ✓ |
| metrics-log.md | Per-video metrics table | ✓ |

**User's choice:** All 4 reference files
**Notes:** Full reference set from day one

---

## Companion Tools

### Installation Method
| Option | Description | Selected |
|--------|-------------|----------|
| Clone repos | Clone full repos to ~/.claude/skills/ — get updates via git pull | |
| Extract rules | Extract only useful parts (banned phrases, scoring) into our skill | |
| You decide | Claude decides based on audit results | ✓ |

**User's choice:** You decide (Claude's discretion)
**Notes:** Decision depends on audit findings

### Fallback Strategy
| Option | Description | Selected |
|--------|-------------|----------|
| Embed critical | Embed critical anti-slop rules in main skill, companions as bonus | |
| Self-contained | Main skill fully self-contained, companions optional | |
| Test first | First test if chaining works, then decide fallback approach | ✓ |

**User's choice:** Test first
**Notes:** Empirical approach — test chaining reliability before deciding architecture

---

## Claude's Discretion

- Skill structure (single multi-mode vs separate) — decide after ecosystem audit
- Companion installation method (clone vs extract) — decide after audit
- Fallback strategy implementation — decide after testing skill chaining

## Deferred Ideas

None — discussion stayed within phase scope
