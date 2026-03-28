# Devlog Scriptwriter Pipeline

## What This Is

An AI-assisted pipeline for writing YouTube Shorts devlog scripts for Pavlo's indie game (UE5 Action RPG about a Troll). The pipeline generates natural-sounding English scripts, tracks video performance metrics, and feeds analytics back into script generation to continuously improve quality. Pavlo records screen + voiceover; this tool handles the writing side.

## Core Value

Scripts must sound like Pavlo — natural, specific, with real dev details — never like AI-generated content. A slightly awkward but authentic script beats a polished but obviously generated one.

## Requirements

### Validated

- ✓ Custom scriptwriting skill installed and operational — v1.0
- ✓ Brand voice profile created through interview (brand-voice.md) — v1.0
- ✓ Anti-slop rules integrated (90+ banned phrases from 4 sources) — v1.0
- ✓ Script generation produces ready-to-record scripts in 7 tested formats — v1.0
- ✓ Scripts follow "one Short = one idea" principle — v1.0
- ✓ Scripts follow "visuals drive, voice follows" principle — v1.0
- ✓ Hook formula applied with 2-3 variants — v1.0
- ✓ Anti-slop scoring pass on every script (35+/50) with auto-rewrite — v1.0
- ✓ Companion skills (stop-slop, humanizer) installed — v1.0
- ✓ Web-based script generation (format selection, context input, structured output) — v2.0
- ✓ Dual-track beat editor with click-to-edit and save-on-blur — v2.0
- ✓ Hook variant switching (A/B/C tabs) — v2.0
- ✓ Per-beat AI regeneration with full script context — v2.0
- ✓ Anti-slop score panel with stale indicator and manual rescore — v2.0
- ✓ Script library with status workflow (draft/ready/recorded) — v2.0
- ✓ Voiceover-only clipboard copy for recording sessions — v2.0

### Active

- [ ] Metrics log captures per-video analytics after publish (Phase 3 — paused, needs 3+ videos)
- [ ] Feedback loop: metrics patterns feed back into generation (Phase 3 — paused)

## Shipped: v2.0 Web UI

**Delivered:** Local Next.js web application wrapping the CLI scriptwriting pipeline with visual editor, script library, and anti-slop scoring.

**Stack:** Next.js 16, TypeScript, Tailwind CSS, shadcn/ui v4, SQLite (better-sqlite3), Drizzle ORM, Claude Agent SDK
**Code:** 32 files, ~3,100 LOC TypeScript

### Out of Scope

- YouTube MCP integration for auto-metrics — manual entry sufficient for 1 video/week
- AI video editing (subtitles, overlay, auto-cut) — separate initiative
- Remotion programmatic rendering — deferred
- ElevenLabs TTS — Pavlo records voiceover himself
- Multi-language scripts — English only
- Automated publishing — Pavlo uploads manually
- Streaming AI response — deferred to v2.1
- Anti-slop inline highlighting — deferred, high complexity
- Beat drag & drop reordering — numbered beats sufficient
- Mobile responsive — desktop-only local tool

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
| Custom skill over existing skills | No single skill covers devlog + anti-slop + feedback loop; combine best of all | ✓ Good |
| Manual metrics over YouTube MCP | 1 video/week doesn't justify API setup; manual entry in metrics-log.md sufficient | ✓ Good |
| English scripts only | Target audience is global gamedev community; Pavlo records English voiceover | ✓ Good |
| Brand voice via interview (not transcript) | No ready transcripts to extract style from; interview establishes voice profile | ✓ Good |
| Merge anti-slop from 4 sources | stop-slop + humanizer + slop-radar + anti-slop-writing = 90+ patterns | ✓ Good |
| Skill chaining unreliable — embed rules | Auto-chaining is probabilistic; critical rules embedded in main skill | ✓ Good |
| Phase 3 paused until 3 videos | Feedback loop needs data; skip to Web UI milestone | ✓ Good |
| Web UI as milestone v2 | CLI pipeline works; web interface for better workflow experience | ✓ Good |
| Claude Agent SDK over Anthropic API | Uses Max subscription auth, zero API cost, auto-loads skills | ✓ Good |
| SQLite with separate beats table | Structured beats (not blob) enable per-beat editing and regeneration | ✓ Good |
| Click-to-edit over always-editable | Notion-style clean UI, save on blur, no save button | ✓ Good |
| Manual rescore over auto-rescore | Avoids constant AI calls during editing, stale indicator shows when needed | ✓ Good |

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
*Last updated: 2026-03-28 after v2.0 Web UI milestone shipped*
