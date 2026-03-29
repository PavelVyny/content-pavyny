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

### Analytics & Feedback (Superseded by v2.1)

- [x] **ANLT-01**: ~~Metrics log with format/hook/topic tags~~ → replaced by YTUB-05 (automated via API)
- [x] **ANLT-02**: ~~Pattern analysis every 3 videos~~ → replaced by DATA-01 (data-aware generation)
- [x] **ANLT-03**: ~~Feedback rules injected into generation~~ → replaced by DATA-01/DATA-03
- [x] **ANLT-04**: ~~Pre-populate with existing 6 videos baseline~~ → replaced by SYNC-01 (auto-sync)

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
- [x] **EDIT-04**: Quick beat re-generate — re-generate a single beat without regenerating the whole script — Phase 5
- [x] **EDIT-05**: Anti-slop score display — 5 dimensions table with total score, updates on edit — Phase 5

### Script Library

- [x] **LIBR-01**: Script list view — all saved scripts with title, format, date, status, anti-slop score — Phase 6
- [x] **LIBR-02**: Script status workflow — draft → ready → recorded — Phase 6
- [x] **LIBR-03**: Copy-to-clipboard — export ready script as clean text for recording reference — Phase 6

## v2.1 Requirements — YouTube Analytics

Requirements for milestone v2.1. Each maps to roadmap phases.

### YouTube Integration

- [ ] **YTUB-01**: User can connect YouTube channel via OAuth2 with one-click "Connect YouTube" button — Phase 7
- [x] **YTUB-02**: OAuth2 tokens persist in local file with auto-refresh (not 7-day expiry) — Phase 7
- [ ] **YTUB-03**: Connection status indicator visible at all times (disconnected/connected/expired) — Phase 7
- [ ] **YTUB-04**: User can disconnect YouTube channel from settings — Phase 7
- [x] **YTUB-05**: Database schema has `videos` and `video_metrics` tables with time-series snapshots — Phase 7

### Metrics Sync

- [x] **SYNC-01**: User can click "Sync Now" to fetch all channel videos and metrics — Phase 8
- [x] **SYNC-02**: Video list auto-discovered from channel (no manual entry) — Phase 8
- [x] **SYNC-03**: Basic metrics fetched per video (views, likes, comments, subs gained, avg view %) — Phase 8
- [x] **SYNC-04**: Retention curve fetched per video (100-point audienceWatchRatio) — Phase 8
- [x] **SYNC-05**: Sync staleness indicator (green <1h, yellow <24h, red >24h) — Phase 8

### Metrics Dashboard

- [x] **DASH-01**: Per-video metrics cards in dashboard view (views, retention %, subs gained) — Phase 8
- [x] **DASH-02**: Retention curve chart per video (line chart with recharts) — Phase 8
- [x] **DASH-03**: Metrics mini-cards on script library page (for linked videos) — Phase 8
- [x] **DASH-04**: Metrics detail panel on script editor page (when script linked to video) — Phase 8

### Script-Video Linking

- [x] **LINK-01**: User can link a script to a YouTube video via dropdown selector — Phase 8
- [x] **LINK-02**: User can unlink a script from a video — Phase 8

### Data-Aware Generation

- [ ] **DATA-01**: Metrics context injected into AI prompt during generation (raw data, not conclusions) — Phase 9
- [ ] **DATA-02**: Toggle checkbox on generation form to enable/disable metrics context — Phase 9
- [ ] **DATA-03**: AI prompt includes explicit small-sample guardrail (no recommendations at N<20) — Phase 9

## v2.1 Future Requirements

Deferred until 20+ published videos or v2.2+.

### Smart Feedback

- **SMRT-01**: AI-generated content format recommendations based on performance patterns
- **SMRT-02**: Format-to-performance mapping dashboard (which formats correlate with which metrics)
- **SMRT-03**: "Generate like my best video" one-click pre-fill
- **SMRT-04**: Metrics trend sparklines (48h vs 7d vs 30d per video)
- **SMRT-05**: Auto-sync on dashboard load when data >24h stale

### Advanced Analytics

- **ADVN-01**: Retention curve overlay with beat timestamps
- **ADVN-02**: Demographic breakdowns (deferred until 1K+ subscribers)

## v2.1 Out of Scope

| Feature | Reason |
|---------|--------|
| AI content recommendations | N=6 videos, any pattern is noise — defer to 20+ videos |
| "Viewed vs Swiped Away" metric | Not available via YouTube Analytics API, only in Studio UI |
| Real-time analytics streaming | YouTube has 24-48h processing delay |
| Demographic breakdowns | YouTube suppresses data below undocumented thresholds at 55 subs |
| Multi-channel competitor comparison | Demoralizing and actionless at 55 subs |
| Automated posting schedule | Zero significance with 6 videos; Shorts shelf is algorithmic |
| Automatic script-video matching | Unreliable (title differences, date gaps); manual linking is 2 seconds |
| YouTube MCP server | Python-based overkill; `googleapis` npm is simpler and native |
| Streaming AI response | Deferred from v2.0; still nice-to-have |

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

### v2.0 Web UI

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
| EDIT-04 | Phase 5 | Complete |
| EDIT-05 | Phase 5 | Complete |
| LIBR-01 | Phase 6 | Complete |
| LIBR-02 | Phase 6 | Complete |
| LIBR-03 | Phase 6 | Complete |

### v2.1 YouTube Analytics

| Requirement | Phase | Status |
|-------------|-------|--------|
| YTUB-01 | Phase 7 | Pending |
| YTUB-02 | Phase 7 | Complete |
| YTUB-03 | Phase 7 | Pending |
| YTUB-04 | Phase 7 | Pending |
| YTUB-05 | Phase 7 | Complete |
| SYNC-01 | Phase 8 | Complete |
| SYNC-02 | Phase 8 | Complete |
| SYNC-03 | Phase 8 | Complete |
| SYNC-04 | Phase 8 | Complete |
| SYNC-05 | Phase 8 | Complete |
| DASH-01 | Phase 8 | Complete |
| DASH-02 | Phase 8 | Complete |
| DASH-03 | Phase 8 | Complete |
| DASH-04 | Phase 8 | Complete |
| LINK-01 | Phase 8 | Complete |
| LINK-02 | Phase 8 | Complete |
| DATA-01 | Phase 9 | Pending |
| DATA-02 | Phase 9 | Pending |
| DATA-03 | Phase 9 | Pending |

**Coverage:**
- v2.0 requirements: 15/15 mapped (all complete)
- v2.1 requirements: 19/19 mapped (all pending)
- Unmapped: 0

---
*Requirements defined: 2026-03-27*
*Last updated: 2026-03-29 after v2.1 roadmap creation*
