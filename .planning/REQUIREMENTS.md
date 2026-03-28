# Requirements: Devlog Scriptwriter Pipeline

**Defined:** 2026-03-27
**Core Value:** Scripts must sound like Pavlo — natural, specific, with real dev details — never like AI-generated content.

## v1.0 Requirements (Completed)

### Ecosystem Audit

- [x] **ECOS-01**: Audit all identified Claude Code skills — Phase 1
- [x] **ECOS-02**: Broader ecosystem search for undiscovered skills/tools — Phase 1
- [x] **ECOS-03**: Evaluate agentic workflow approaches for content pipelines — Phase 1
- [x] **ECOS-04**: Integrate best-of-ecosystem into the custom pipeline — Phase 1

### Brand Voice

- [x] **VOIC-01**: Brand voice interview with Pavlo — Phase 1
- [x] **VOIC-02**: Create brand-voice.md with full voice profile — Phase 1
- [x] **VOIC-03**: Embed transcript from best-performing videos as style anchor — Phase 1

### Skill Setup

- [x] **SKIL-01**: Custom devlog-scriptwriter skill under 500 lines — Phase 1
- [x] **SKIL-02**: Install stop-slop companion skill — Phase 1
- [x] **SKIL-03**: Install humanizer companion skill — Phase 1
- [x] **SKIL-04**: Verify skill chaining with fallback — Phase 1

### Script Generation

- [x] **SCRP-01**: 7 format templates — Phase 2
- [x] **SCRP-02**: Visual-audio dual-track output — Phase 2
- [x] **SCRP-03**: Hook-first structure — Phase 2
- [x] **SCRP-04**: One-idea enforcement — Phase 2
- [x] **SCRP-05**: Hook A/B variants — Phase 2
- [x] **SCRP-06**: Title + thumbnail concepts — Phase 2

### Quality Gates

- [x] **QUAL-01**: Anti-slop scoring 35+/50 — Phase 2
- [x] **QUAL-02**: Anti-slop rewrite pass — Phase 2
- [x] **QUAL-03**: Anti-slop rules reference 60+ phrases — Phase 2

### Analytics & Feedback (Paused — needs 3+ videos)

- [ ] **ANLT-01**: Metrics log with format/hook/topic tags
- [ ] **ANLT-02**: Pattern analysis every 3 videos
- [ ] **ANLT-03**: Feedback rules injected into generation
- [ ] **ANLT-04**: Pre-populate with existing 6 videos baseline

## v2.0 Requirements — Web UI for Scriptwriting

Requirements for milestone v2.0. Each maps to roadmap phases.

### App Foundation

- [x] **APFN-01**: Next.js 16 app scaffold with App Router, Tailwind CSS, shadcn/ui v4 — Phase 4
- [x] **APFN-02**: SQLite database with Drizzle ORM — scripts table with structured beats (not blob), status field (draft/ready/recorded) — Phase 4
- [x] **APFN-03**: Claude Agent SDK integration using Max subscription auth — spawns Claude Code with devlog-scriptwriter skill access — Phase 4
- [x] **APFN-04**: Reference file reader — loads brand-voice.md, anti-slop-rules.md, video-formats.md from .claude/skills/ at runtime — Phase 4

### Script Generation UI

- [x] **GENR-01**: Generation form — format selector (7 formats), dev progress text input, generate button — Phase 4
- [x] **GENR-02**: Structured output parsing — dual-track beats, hook variants, titles, thumbnail concept, anti-slop score extracted from AI response — Phase 4
- [x] **GENR-03**: Full script re-generation — re-generate entire script with same or modified input — Phase 4

### Script Editor

- [x] **EDIT-01**: Dual-track beat editor — visual and voiceover as separate editable blocks per beat, clean readable layout — Phase 5
- [x] **EDIT-02**: Inline editing — click any beat segment to edit text directly — Phase 5
- [x] **EDIT-03**: Hook variant selector — UI to switch between 2-3 generated hook variants — Phase 5
- [ ] **EDIT-04**: Quick beat re-generate — re-generate a single beat without regenerating the whole script — Phase 5
- [ ] **EDIT-05**: Anti-slop score display — 5 dimensions table with total score, updates on edit — Phase 5

### Script Library

- [ ] **LIBR-01**: Script list view — all saved scripts with title, format, date, status, anti-slop score — Phase 6
- [ ] **LIBR-02**: Script status workflow — draft → ready → recorded — Phase 6
- [ ] **LIBR-03**: Copy-to-clipboard — export ready script as clean text for recording reference — Phase 6

## v2.0 Out of Scope

| Feature | Reason |
|---------|--------|
| Streaming AI response | Nice-to-have for local tool — defer to v2.1 if generation feels slow |
| Anti-slop inline highlighting | Phase 3+ differentiator — HIGH complexity, cursor/selection edge cases |
| Beat drag & drop reordering | Simple numbered beats sufficient for v2 |
| Analytics/metrics dashboard | Phase 3 (v1) still paused, no data yet |
| Dark mode toggle | One theme sufficient, clean light chosen |
| Collaboration features | Solo creator tool |
| PDF/markdown export | Copy-to-clipboard covers the need |
| Mobile responsive | Desktop-only local tool |
| Deployment/hosting | Localhost only |
| AI chat sidebar | Script generation covers the interaction model |
| Template builder | 7 formats from video-formats.md sufficient |
| Prompt engineering UI | Prompts built from reference files automatically |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| APFN-01 | Phase 4 | Complete |
| APFN-02 | Phase 4 | Complete |
| APFN-03 | Phase 4 | Complete |
| APFN-04 | Phase 4 | Complete |
| GENR-01 | Phase 4 | Complete |
| GENR-02 | Phase 4 | Complete |
| GENR-03 | Phase 4 | Complete |
| EDIT-01 | Phase 5 | Complete |
| EDIT-02 | Phase 5 | Complete |
| EDIT-03 | Phase 5 | Complete |
| EDIT-04 | Phase 5 | Pending |
| EDIT-05 | Phase 5 | Pending |
| LIBR-01 | Phase 6 | Pending |
| LIBR-02 | Phase 6 | Pending |
| LIBR-03 | Phase 6 | Pending |

**Coverage:**
- v2.0 requirements: 15 total
- Mapped to phases: 15
- Unmapped: 0

---
*Requirements defined: 2026-03-27*
*Last updated: 2026-03-26 after v2.0 roadmap creation*
