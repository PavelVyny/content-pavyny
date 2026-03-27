# Roadmap: Devlog Scriptwriter Pipeline

## Overview

This pipeline delivers AI-assisted scriptwriting for Pavlo's YouTube Shorts devlog in three phases. Phase 1 builds the foundation: auditing the ecosystem, extracting Pavlo's brand voice, and assembling the custom skill with companion tools. Phase 2 delivers the core capability: generating publish-ready scripts with quality gates. Phase 3 closes the feedback loop: tracking metrics and feeding performance data back into generation so the pipeline improves with every video.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Foundation** - Audit ecosystem, extract brand voice, build and install the custom skill with companions
- [x] **Phase 2: Script Generation** - Generate publish-ready scripts with format templates, hook structure, and anti-slop quality gates
- [ ] **Phase 3: Feedback Loop** - Track per-video metrics and feed performance patterns back into script generation

## Phase Details

### Phase 1: Foundation
**Goal**: Pavlo has a working, installed scriptwriting skill backed by his real voice profile and the best available companion tools
**Depends on**: Nothing (first phase)
**Requirements**: ECOS-01, ECOS-02, ECOS-03, ECOS-04, VOIC-01, VOIC-02, VOIC-03, SKIL-01, SKIL-02, SKIL-03, SKIL-04
**Success Criteria** (what must be TRUE):
  1. Ecosystem audit document exists with verdict on each identified skill/tool (use, adapt, skip) and any newly discovered tools evaluated
  2. brand-voice.md contains Pavlo's speech patterns, vocabulary rules, tone dimensions, and a transcript excerpt from video #6 as style anchor
  3. Custom devlog-scriptwriter skill is installed in .claude/skills/ and responds to ideation/generation/analysis modes
  4. Companion skills (stop-slop, humanizer) are installed globally and the main skill can invoke them as quality passes
  5. Invoking the skill in generation mode produces output (even if rough) that uses brand voice profile — not generic AI text
**Plans**: 3 plans

Plans:
- [x] 01-01-PLAN.md — Ecosystem audit: clone and review identified skills, broader search, skill chaining assessment
- [x] 01-02-PLAN.md — Brand voice extraction: transcript analysis and interview with Pavlo
- [x] 01-03-PLAN.md — Skill build: create SKILL.md with reference files, install companions, verify pipeline

### Phase 2: Script Generation
**Goal**: Pavlo can generate a publish-ready script for any of the 7 proven formats, with hook variants and anti-slop scoring, and record it without heavy editing
**Depends on**: Phase 1
**Requirements**: SCRP-01, SCRP-02, SCRP-03, SCRP-04, SCRP-05, SCRP-06, QUAL-01, QUAL-02, QUAL-03
**Success Criteria** (what must be TRUE):
  1. Running the skill in generation mode produces a script in visual-audio dual-track format (what viewer sees alongside what Pavlo says)
  2. Every generated script includes a hook in the first 3 seconds (pre-hook visual, question, deliver) with 2-3 variant options
  3. Every generated script scores 35+/50 on anti-slop scoring across all 5 dimensions, with flagged phrases automatically rewritten using brand voice
  4. Script output includes 3 title options and a thumbnail frame concept
  5. One-idea enforcement prevents scripts from containing multiple topics — structural check catches violations before output
**Plans**: 1 plan

Plans:
- [x] 02-01-PLAN.md — Requirements verification: confirm all SCRP and QUAL requirements satisfied by Phase 1 deliverables

### Phase 3: Feedback Loop
**Goal**: The pipeline learns from published video performance and adjusts script generation preferences based on real data
**Depends on**: Phase 2 (and requires 3+ published videos with metrics logged)
**Requirements**: ANLT-01, ANLT-02, ANLT-03, ANLT-04
**Success Criteria** (what must be TRUE):
  1. metrics-log.md contains structured data for all 6 existing videos plus any new ones, with format used, hook type, topic category, views, retention %, and subscriber conversion
  2. Pattern analysis (run every 3 videos) produces concrete rules about which formats and hooks perform best — not vague observations but actionable preferences
  3. Generated scripts reflect feedback rules as weighted preferences (e.g., "The Satisfaction format averages 70%+ retention — prioritize this format")
**Plans**: TBD

Plans:
- [ ] 03-01: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 -> 2 -> 3

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation | 3/3 | Complete | 2026-03-26 |
| 2. Script Generation | 1/1 | Complete | 2026-03-27 |
| 3. Feedback Loop | 0/1 | Not started | - |
