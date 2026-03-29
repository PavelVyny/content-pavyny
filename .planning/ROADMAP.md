# Roadmap: Devlog Scriptwriter Pipeline

## Milestones

- ✅ **v1.0 CLI Pipeline** - Phases 1-3 (shipped 2026-03-27, Phase 3 paused)
- ✅ **v2.0 Web UI** - Phases 4-6 (shipped 2026-03-28)
- 🚧 **v2.1 YouTube Analytics** - Phases 7-9 (in progress)

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

<details>
<summary>✅ v1.0 CLI Pipeline (Phases 1-3) - SHIPPED 2026-03-27</summary>

- [x] **Phase 1: Foundation** - Audit ecosystem, extract brand voice, build and install the custom skill with companions
- [x] **Phase 2: Script Generation** - Generate publish-ready scripts with format templates, hook structure, and anti-slop quality gates
- [ ] **Phase 3: Feedback Loop** - Track per-video metrics and feed performance patterns back into script generation (paused, needs 3+ videos)

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

</details>

<details>
<summary>✅ v2.0 Web UI (Phases 4-6) - SHIPPED 2026-03-28</summary>

- [x] **Phase 4: Foundation & Generation** - Next.js app with AI backend, database, and end-to-end script generation flow
- [x] **Phase 5: Script Editor** - Dual-track beat editor with inline editing, hook variants, per-beat regeneration, and anti-slop scoring
- [x] **Phase 6: Library & Workflow** - Script browsing, status management, and clipboard export for recording

### Phase 4: Foundation & Generation
**Goal**: Pavlo can open the web app, pick a script format, enter dev context, and receive a fully structured script saved to the database
**Depends on**: Phase 2 (working CLI skill with reference files)
**Requirements**: APFN-01, APFN-02, APFN-03, APFN-04, GENR-01, GENR-02, GENR-03
**Success Criteria** (what must be TRUE):
  1. Running `npm run dev` launches the Next.js app at localhost with no errors
  2. Pavlo can select one of the 7 script formats, type dev progress context, and click Generate to produce a script
  3. The generated script appears as structured beats (visual + voiceover pairs) with hook variants, title options, and anti-slop score — not raw text
  4. Generated scripts persist in SQLite and survive page refresh
  5. Reference files (brand-voice.md, anti-slop-rules.md, video-formats.md) are loaded from .claude/skills/ at generation time — not duplicated
**Plans**: 3 plans
**UI hint**: yes

Plans:
- [x] 04-01-PLAN.md — Scaffold Next.js 16 app with shadcn/ui, SQLite/Drizzle schema, types, and reference file reader
- [x] 04-02-PLAN.md — Agent SDK wrapper with structured output and server actions for generation
- [x] 04-03-PLAN.md — Generation form UI, script display, and end-to-end verification

### Phase 5: Script Editor
**Goal**: Pavlo can view and edit any generated script as visual/voiceover beat blocks, switch hook variants, regenerate individual beats, and see anti-slop quality scoring
**Depends on**: Phase 4
**Requirements**: EDIT-01, EDIT-02, EDIT-03, EDIT-04, EDIT-05
**Success Criteria** (what must be TRUE):
  1. Each script displays as a vertical list of beat cards, each card showing visual description and voiceover text side by side
  2. Clicking any text in a beat card switches it to an editable field — changes save without a separate save button
  3. Pavlo can switch between 2-3 hook variants for the first beat without regenerating the rest of the script
  4. Pavlo can regenerate a single beat (AI re-generates just that beat using the same context) without losing edits to other beats
  5. Anti-slop score panel shows the total score and 5-dimension breakdown, updating when beat text is edited
**Plans**: 2 plans
**UI hint**: yes

Plans:
- [x] 05-01-PLAN.md — Editor page route, server actions, click-to-edit beat cards, and hook variant tabs
- [x] 05-02-PLAN.md — Beat regeneration, anti-slop rescoring, score panel, and Edit link from generation page

### Phase 6: Library & Workflow
**Goal**: Pavlo can browse all saved scripts, track their status from draft to recorded, and copy the voiceover text for recording sessions
**Depends on**: Phase 5
**Requirements**: LIBR-01, LIBR-02, LIBR-03
**Success Criteria** (what must be TRUE):
  1. A script list page shows all saved scripts with title, format type, creation date, status, and anti-slop score
  2. Pavlo can change a script's status (draft -> ready -> recorded) and the list reflects the current status
  3. One click copies the voiceover-only text (all beats, voiceover column only) to clipboard in clean format ready for recording reference
**Plans**: 1 plan
**UI hint**: yes

Plans:
- [x] 06-01-PLAN.md — Scripts list page with table layout, inline status dropdown, clipboard copy, and header navigation

</details>

### 🚧 v2.1 YouTube Analytics (In Progress)

**Milestone Goal:** Automatic YouTube metrics collection, in-app display alongside scripts, and data-aware generation where AI sees metrics as context without drawing conclusions on small sample sizes.

- [ ] **Phase 7: OAuth & Schema** - YouTube OAuth2 connection flow, token persistence, connection status UI, and database schema for videos and metrics
- [ ] **Phase 8: Metrics & Dashboard** - Sync engine, metrics dashboard with retention curves, script-video linking, and metrics display across app pages
- [ ] **Phase 9: Data-Aware Generation** - Inject metrics context into AI prompts with small-sample guardrails and user toggle

## Phase Details

### Phase 7: OAuth & Schema
**Goal**: Pavlo can connect his YouTube channel via OAuth2 from a settings page, see connection status at all times, and the database is ready to store video metrics
**Depends on**: Phase 6 (existing Next.js app with SQLite/Drizzle)
**Requirements**: YTUB-01, YTUB-02, YTUB-03, YTUB-04, YTUB-05
**Success Criteria** (what must be TRUE):
  1. Pavlo can click "Connect YouTube" on the settings page, complete Google OAuth consent, and return to the app with a confirmed connection
  2. OAuth tokens persist across app restarts and auto-refresh without Pavlo re-authenticating (no 7-day expiry)
  3. Connection status indicator (disconnected/connected/expired) is visible from any page in the app
  4. Pavlo can disconnect YouTube from the settings page and the status updates immediately
  5. Database has `videos` and `video_metrics` tables migrated and queryable (verified by running a test insert from REPL)
**Plans**: TBD
**UI hint**: yes

### Phase 8: Metrics & Dashboard
**Goal**: Pavlo can sync his YouTube channel data with one click, see per-video metrics and retention curves in the app, and link scripts to their published videos
**Depends on**: Phase 7
**Requirements**: SYNC-01, SYNC-02, SYNC-03, SYNC-04, SYNC-05, DASH-01, DASH-02, DASH-03, DASH-04, LINK-01, LINK-02
**Success Criteria** (what must be TRUE):
  1. Clicking "Sync Now" fetches all channel videos and their metrics (views, retention %, likes, comments, subs gained) into the database without manual entry
  2. A metrics dashboard shows per-video cards with key numbers and a retention curve line chart for each video
  3. Sync staleness indicator shows how fresh the data is (green under 1 hour, yellow under 24 hours, red over 24 hours)
  4. Pavlo can link any script to a YouTube video via a dropdown, and unlink it — linked scripts show metrics mini-cards in the library and a detail panel in the editor
**Plans**: TBD
**UI hint**: yes

### Phase 9: Data-Aware Generation
**Goal**: Pavlo's script generation uses real channel performance data as context, referencing actual numbers without the AI making strategic recommendations from a small sample
**Depends on**: Phase 8
**Requirements**: DATA-01, DATA-02, DATA-03
**Success Criteria** (what must be TRUE):
  1. When generating a script with metrics enabled, the AI naturally references real view counts and retention percentages (e.g., "your last video got 8.7K views") instead of generic openers
  2. A toggle checkbox on the generation form lets Pavlo enable or disable metrics context injection — default is on
  3. The AI never makes recommendations like "your audience prefers X" or "you should do more Y" — it uses numbers for specificity only, with an explicit small-sample guardrail (N<20)
**Plans**: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 7 -> 8 -> 9

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. Foundation | v1.0 | 3/3 | Complete | 2026-03-26 |
| 2. Script Generation | v1.0 | 1/1 | Complete | 2026-03-27 |
| 3. Feedback Loop | v1.0 | 0/1 | Paused | - |
| 4. Foundation & Generation | v2.0 | 3/3 | Complete | 2026-03-28 |
| 5. Script Editor | v2.0 | 2/2 | Complete | 2026-03-28 |
| 6. Library & Workflow | v2.0 | 1/1 | Complete | 2026-03-28 |
| 7. OAuth & Schema | v2.1 | 0/? | Not started | - |
| 8. Metrics & Dashboard | v2.1 | 0/? | Not started | - |
| 9. Data-Aware Generation | v2.1 | 0/? | Not started | - |
