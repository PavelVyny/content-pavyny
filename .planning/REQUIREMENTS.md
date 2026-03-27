# Requirements: Devlog Scriptwriter Pipeline

**Defined:** 2026-03-27
**Core Value:** Scripts must sound like Pavlo — natural, specific, with real dev details — never like AI-generated content.

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Ecosystem Audit

- [x] **ECOS-01**: Audit all identified Claude Code skills (stop-slop, humanizer, viral-reel-generator, script-writer, last30days, video-toolkit) — verify which actually work, what's worth integrating, what to discard
- [x] **ECOS-02**: Broader ecosystem search for scriptwriting/content skills and MCP servers not yet discovered — 2026 landscape analysis
- [x] **ECOS-03**: Evaluate agentic workflow approaches (skill chaining, MCP integrations, automation patterns) for content creation pipelines
- [ ] **ECOS-04**: Integrate best-of-ecosystem components into the custom pipeline — adopt proven patterns, skip reinventing

### Brand Voice

- [ ] **VOIC-01**: Conduct brand voice interview with Pavlo to extract speech patterns, tone, vocabulary, Pavlo-isms
- [ ] **VOIC-02**: Create brand-voice.md with persona definition, tone dimensions, vocabulary rules (use/avoid), structural rules, on-brand/off-brand examples
- [ ] **VOIC-03**: Embed transcript excerpt from best-performing video (#6 "Troll throw people", 75.7% stayed) as style anchor

### Skill Setup

- [ ] **SKIL-01**: Create custom devlog-scriptwriter skill in .claude/skills/ with SKILL.md under 500 lines
- [ ] **SKIL-02**: Install stop-slop companion skill globally in ~/.claude/skills/
- [ ] **SKIL-03**: Install humanizer companion skill globally in ~/.claude/skills/
- [ ] **SKIL-04**: Verify skill chaining works (main skill → stop-slop → humanizer) — embed critical anti-slop rules in main skill as fallback

### Script Generation

- [ ] **SCRP-01**: Generate scripts using 7 proven format templates (The Bug, The Satisfaction, Before/After, The Decision, The Trick, The Fail, The Number)
- [ ] **SCRP-02**: Scripts output in visual-audio dual-track format (what viewer sees + what Pavlo says)
- [ ] **SCRP-03**: Hook-first structure applied to every script: Pre-hook visual → Question → Deliver (first 3 seconds)
- [ ] **SCRP-04**: One-idea-per-script enforcement — structural check prevents cramming multiple topics
- [ ] **SCRP-05**: Generate 2-3 hook variants (A/B) for each script — different visual + opening line approaches
- [ ] **SCRP-06**: Generate 3 title options + thumbnail frame concept alongside every script

### Quality Gates

- [ ] **QUAL-01**: Anti-slop scoring pass on every script (5 dimensions: Directness, Rhythm, Trust, Authenticity, Density) with 35+/50 threshold
- [ ] **QUAL-02**: Anti-slop rewrite pass — flagged phrases/structures automatically rewritten using brand voice profile, human reviews diff
- [ ] **QUAL-03**: Anti-slop rules reference file with 60+ banned phrases and structural patterns

### Analytics & Feedback

- [ ] **ANLT-01**: Metrics log (metrics-log.md) captures per-video: format used, hook type, topic category, views, engaged views, avg duration, stayed %, swiped %, subscribers gained
- [ ] **ANLT-02**: Pattern analysis runs every 3 published videos — produces concrete rules about which formats/hooks/topics perform best
- [ ] **ANLT-03**: Feedback rules injected into script generation as preferences (e.g., "The Satisfaction format averages 70%+ retention — weight this format higher")
- [ ] **ANLT-04**: Pre-populate metrics log with existing 6 videos baseline data

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Personalization Passes

- **PERS-01**: Pronunciation optimization for Ukrainian-English speaker (flag hard consonant clusters, prefer short words, mandatory contractions)
- **PERS-02**: Specificity injection — detect vague gamedev language ("worked on", "improved"), prompt for concrete numbers/names/timeframes
- **PERS-03**: Ideation sessions generating 5-7 angles from weekly dev progress mapped to proven formats
- **PERS-04**: Visual suggestion engine — recommend visual techniques (slow-mo, reverse, split-screen) mapped to script beats

### Advanced Analytics

- **ADVN-01**: Format performance ranking — aggregate stayed-% by format tag after 10+ videos
- **ADVN-02**: Hook A/B testing framework — track which hook variant was used, compare performance

### External Integrations

- **EXTL-01**: YouTube MCP integration for automated metrics collection
- **EXTL-02**: last30days trend research skill for external context
- **EXTL-03**: FFmpeg subtitle burn-in automation
- **EXTL-04**: Text overlay on hook (first 3 seconds) via FFmpeg

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| TTS / AI voiceover | Pavlo's voice IS the brand. AI voice destroys authenticity. |
| Automated YouTube publishing | 1 video/week, manual upload takes 2 minutes. Automation removes final quality check. |
| Full video generation (Remotion) | Premature complexity. Script quality is the bottleneck, not video rendering. |
| Multi-platform adaptation | YouTube Shorts only. Same format works if cross-posted. |
| SEO keyword optimization | Shorts discovery is algorithm-driven by engagement, not keywords. Would make scripts corporate. |
| Trend-chasing automation | Devlog content comes from actual dev work, not social media trends. |
| Collaboration / team features | Solo creator pipeline. |
| Script length optimization | Duration follows content. Best videos range 30-47s naturally. |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| ECOS-01 | Phase 1 | Complete |
| ECOS-02 | Phase 1 | Complete |
| ECOS-03 | Phase 1 | Complete |
| ECOS-04 | Phase 1 | Pending |
| VOIC-01 | Phase 1 | Pending |
| VOIC-02 | Phase 1 | Pending |
| VOIC-03 | Phase 1 | Pending |
| SKIL-01 | Phase 1 | Pending |
| SKIL-02 | Phase 1 | Pending |
| SKIL-03 | Phase 1 | Pending |
| SKIL-04 | Phase 1 | Pending |
| SCRP-01 | Phase 2 | Pending |
| SCRP-02 | Phase 2 | Pending |
| SCRP-03 | Phase 2 | Pending |
| SCRP-04 | Phase 2 | Pending |
| SCRP-05 | Phase 2 | Pending |
| SCRP-06 | Phase 2 | Pending |
| QUAL-01 | Phase 2 | Pending |
| QUAL-02 | Phase 2 | Pending |
| QUAL-03 | Phase 2 | Pending |
| ANLT-01 | Phase 3 | Pending |
| ANLT-02 | Phase 3 | Pending |
| ANLT-03 | Phase 3 | Pending |
| ANLT-04 | Phase 3 | Pending |

**Coverage:**
- v1 requirements: 24 total
- Mapped to phases: 24
- Unmapped: 0

---
*Requirements defined: 2026-03-27*
*Last updated: 2026-03-26 after roadmap creation*
