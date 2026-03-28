# Devlog Scriptwriter Pipeline

## What This Is

An AI-assisted pipeline for writing YouTube Shorts devlog scripts for Pavlo's indie game (UE5 Action RPG about a Troll). The pipeline generates natural-sounding English scripts, tracks video performance metrics, and feeds analytics back into script generation to continuously improve quality. Pavlo records screen + voiceover; this tool handles the writing side.

## Core Value

Scripts must sound like Pavlo — natural, specific, with real dev details — never like AI-generated content. A slightly awkward but authentic script beats a polished but obviously generated one.

## Requirements

### Validated

- ✓ Custom scriptwriting skill installed and operational — Phase 1
- ✓ Brand voice profile created through interview (brand-voice.md) — Phase 1
- ✓ Anti-slop rules integrated (90+ banned phrases from 4 sources) — Phase 1
- ✓ Script generation produces ready-to-record scripts in 7 tested formats — Phase 2
- ✓ Scripts follow "one Short = one idea" principle — Phase 2
- ✓ Scripts follow "visuals drive, voice follows" principle — Phase 2
- ✓ Hook formula applied with 2-3 variants — Phase 2
- ✓ Anti-slop scoring pass on every script (35+/50) with auto-rewrite — Phase 2
- ✓ Companion skills (stop-slop, humanizer) installed — Phase 1

### Active

- [ ] Metrics log captures per-video analytics after publish (Phase 3 — paused, needs 3+ videos)
- [ ] Feedback loop: metrics patterns feed back into generation (Phase 3 — paused)

## Current Milestone: v2.0 Web UI for Scriptwriting

**Goal:** Local web application for the scriptwriting workflow with visual script editor and library.

**Target features:**
- Script generation via web interface (format selection, context input → ready script)
- Visual script editor — beats split into blocks (visual | voiceover), each editable inline
- Script library — store, browse, search generated scripts
- Anti-slop scoring integrated in UI (show score, highlight problems)

**Stack:** Next.js (React + TypeScript), simple local database
**AI Backend:** Requires research — must work with Claude Max subscription without additional costs

### Out of Scope

- YouTube MCP integration for auto-metrics — adds complexity, manual entry sufficient for 1 video/week
- AI video editing (subtitles, overlay, auto-cut) — separate initiative, not core to scriptwriting
- Remotion programmatic rendering — experimental, defer until scripts pipeline proven
- ElevenLabs TTS — Pavlo records voiceover himself
- Multi-language scripts — English only
- Automated publishing — Pavlo uploads manually

## Context

**The game:** UE5 Action RPG about a Troll who lives in a cave and guards a bridge. A dragon destroys the bridge, pulling the Troll into an adventure. Features: destructible objects, ragdoll physics, throw mechanics (crates, enemies, wolves), interactive vegetation, gorilla-sprint animation, dragon boss.

**Channel state (as of 2026-03):** 6 videos, 55 subscribers. Performance range:
- Best: #6 "Troll throw people" — 8.7K views, 75.7% stayed, +16 subs
- Best: #3 "I Broke Physics" — 7.7K views, 68.8% stayed, +21 subs
- Worst: #1 "Making a Troll Game" — 3K views, 39.4% stayed, +5 subs
- Worst: #2 "Episode 2" — 2.1K views, 45.8% stayed, +2 subs

**Patterns from data:**
- Videos with strong visual hooks (satisfying destruction, funny physics fails) perform 2-3x better
- Problem→solution format consistently outperforms simple showcase
- Specific technical details + humor work (ragdoll chaos, physics bugs)
- Short titles with personality beat generic "Episode N" titles
- Videos #3 and #6 had detailed visual planning (screen descriptions alongside voiceover) — correlated with better performance

**Unreleased content ready for videos:**
- Interactive vegetation (grass/bushes react to player) via Prismatiscape plugin
- Basic level design and landscape
- River with Troll interaction
- Dragon model with animations (purchased, needs fire + boss AI)
- Gorilla-sprint animation (Troll runs on all fours)

**Pavlo's voice (from transcripts):**
- Casual, slightly self-deprecating humor
- Short sentences, conversational rhythm
- Mixes technical terms with simple language
- Often uses "so I..." / "let's..." / "turns out..."
- References to classic games (Max Payne 2, The Last of Us) when explaining concepts
- Honest about struggles ("I'm new to all of this", "fun and painful at the same time")

**Target cadence:** 1 video per week

**Technical setup:**
- Windows PC (WezTerm) + MacBook Air M1 (Ghostty)
- Claude Code in terminal (not Cursor extension)
- Subscriptions: Cursor, Claude Max/Pro, Antigravity
- Pavlo is learning English with IT tutor — scripts must be pronounceable

## Constraints

- **Anti-slop**: Every script must pass anti-slop scoring (35+/50). AI-sounding output is worse than no output.
- **Pronunciation**: Scripts must avoid complex English constructions that are hard for non-native speakers.
- **One idea per video**: If a script contains "and another thing" — that's a second video.
- **Visuals-first**: Voiceover never describes what isn't on screen. Script assumes screen recording exists.
- **Authenticity**: Use real numbers, real struggles, real details from Pavlo's actual dev work. No generic gamedev platitudes.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Custom skill over existing skills | No single skill covers devlog + anti-slop + feedback loop; combine best of all | — Pending |
| Manual metrics over YouTube MCP | 1 video/week doesn't justify API setup; manual entry in metrics-log.md sufficient | — Pending |
| English scripts only | Target audience is global gamedev community; Pavlo records English voiceover | — Pending |
| Brand voice via interview (not transcript) | No ready transcripts to extract style from; interview establishes voice profile | ✓ Good |
| Merge anti-slop from 4 sources | stop-slop + humanizer + slop-radar + anti-slop-writing = 90+ patterns | ✓ Good |
| Skill chaining unreliable — embed rules | Auto-chaining is probabilistic; critical rules embedded in main skill | ✓ Good |
| Phase 3 paused until 3 videos | Feedback loop needs data; skip to Web UI milestone | — Pending |
| Web UI as milestone v2 | CLI pipeline works; web interface for better workflow experience | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd:transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd:complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-03-27 after milestone v2.0 start*
