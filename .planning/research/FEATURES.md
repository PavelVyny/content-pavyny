# Feature Landscape

**Domain:** AI-assisted devlog scriptwriting pipeline for YouTube Shorts
**Researched:** 2026-03-26

## Table Stakes

Features users expect. Missing = pipeline feels incomplete and no better than raw ChatGPT prompting.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| **Script generation with format templates** | Without structured formats (The Bug, The Satisfaction, Before/After, etc.), you're just asking ChatGPT to "write a script." Templates encode proven devlog patterns. | Low | 7 proven formats identified from channel analysis. Each template = hook structure + beat sequence + CTA pattern. |
| **Brand voice profile** | Generic AI output is the #1 reason scripts sound fake. A voice profile (tone, vocabulary, sentence rhythm, speech patterns) is the minimum bar for personalization. | Medium | Requires 5 components: persona definition, tone dimensions on a scale, vocabulary rules (use/avoid lists), structural rules, and on-brand/off-brand examples. 500+ words of sample content recommended. Pavlo's transcripts provide this. |
| **Anti-slop scoring pass** | AI-generated scripts that sound like AI are worse than no script at all. Every pipeline needs a quality gate. 60+ banned phrases, structural pattern detection. | Medium | Score 5 dimensions (vocabulary, structure, specificity, rhythm, authenticity) on 10-point scales. Threshold: 35/50. Scripts below threshold get rewritten, not polished. |
| **Hook-first script structure** | First 3 seconds determine everything in Shorts. 70%+ intro retention is the benchmark. Pre-hook (visual) + Question + Deliver is the proven formula. | Low | Pavlo's data confirms: videos #3 and #6 had strong visual hooks and performed 2-3x better. Script must specify both audio AND visual for the hook. |
| **One idea per script enforcement** | Shorts that try to cover multiple ideas lose viewers. This is a structural constraint, not a suggestion. | Low | Simple rule: if "and another thing" or second topic appears, split into two scripts. Automated detection possible. |
| **Visual-audio dual-track format** | Devlog Shorts are screen recordings with voiceover. Script must specify what's on screen alongside what's said. Pavlo's best videos (#3, #6) had detailed visual planning. | Low | Two-column or interleaved format: Visual (what viewer sees) + Audio (voiceover text). This is what separates a Shorts script from a blog post read aloud. |
| **Ideation session (topic generation)** | Weekly content needs a systematic way to generate 5-7 angles from current dev progress. Without this, creator stalls on "what should I make next." | Low | Input: what Pavlo worked on this week. Output: 5-7 angles mapped to proven formats. Should consider unreleased content backlog. |
| **Metrics log and tracking** | Can't improve without data. Per-video: views, engaged views, avg duration, stayed %, subs gained. Manual entry is fine at 1/week cadence. | Low | Simple markdown table. Already have data for 6 videos as baseline. Key metrics: stayed-to-watch %, subscriber conversion, view count. |

## Differentiators

Features that set this pipeline apart from "just prompting ChatGPT." Not expected, but transform the tool from generic to personalized.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **Metrics-driven feedback loop** | Most creators generate scripts and forget. Feeding performance data back into generation is the superpower -- it turns a generic tool into a personalized engine that learns what works for THIS channel. | Medium | After 48h post-publish, record metrics. After 10+ videos, pattern analysis: which formats perform best, which hooks retain, which topics convert subscribers. Feed patterns into script generation preferences. |
| **Pronunciation optimization for non-native speakers** | Pavlo is learning English. Scripts with tongue-twisters, complex consonant clusters, or unusual stress patterns become awkward voiceovers. No mainstream AI tool does this. | Medium | Rules: avoid consecutive consonant clusters (e.g., "strengths"), prefer shorter words over polysyllabic alternatives, flag words with ambiguous stress, avoid homophones that confuse non-native speakers. Ukrainian-specific: flag English sounds that don't exist in Ukrainian (th, w vs v). Provide phonetic hints for tricky words. |
| **Style anchor system** | Upload transcript of best-performing video as a "style anchor." AI uses it as the reference point for tone, rhythm, and vocabulary. Better than abstract voice descriptions. | Low | Pavlo's video #6 transcript is the obvious anchor -- highest views, highest retention, highest subscriber gain. System compares generated scripts against anchor for style drift. |
| **Anti-slop rewrite (not just scoring)** | Scoring alone tells you "this is bad" but doesn't fix it. A rewrite pass that specifically targets flagged phrases and structures, replacing them with Pavlo-voice alternatives, closes the loop. | Medium | Two-pass system: (1) Score and flag specific lines/phrases. (2) Rewrite flagged sections using brand voice profile as reference. Human reviews the diff, not the whole script. |
| **Format performance ranking** | Over time, data shows which of the 7 formats (Bug, Satisfaction, Before/After, etc.) work best for Pavlo's channel. System should surface this: "Before/After has 3x your average retention -- consider this format." | Low | Requires 10+ videos with format tags in metrics log. Simple aggregation: average stayed-% by format. Low complexity once metrics log exists. |
| **Specificity injection** | Generic: "I worked on physics." Specific: "I rewrote collision detection three times this week." AI tends toward generic -- a specificity pass that detects vague statements and prompts for concrete details (numbers, names, timeframes) makes scripts credible. | Low | Pattern detection for vague gamedev language ("worked on," "improved," "added some") and replacement prompts asking for specifics. Can be part of anti-slop scoring dimension. |
| **Visual suggestion engine** | Script says "show the troll smashing crates" -- but the best Shorts have creative visual moments (slow-mo, reverse, side-by-side, code overlay). Suggesting visual techniques alongside the script elevates production. | Medium | Library of visual techniques: slow-mo impact, reverse reveal, before/after split-screen, code snippet overlay, diagram/schema explanation, zoom-to-detail. Map techniques to script beats. |
| **Hook A/B variants** | Generate 2-3 hook variants for the same script body. Creator picks the strongest or tests them. First 3 seconds are worth optimizing harder than anything else. | Low | Same script body, different opening 3 seconds. Vary: visual hook type, opening line approach (question vs statement vs mid-action), text overlay copy. |

## Anti-Features

Features to explicitly NOT build. These seem useful but add complexity, reduce authenticity, or solve the wrong problem.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| **Automated YouTube publishing** | Pavlo uploads manually. Automation removes the human quality check that catches the last 10% of issues. At 1 video/week, manual upload takes 2 minutes. | Keep manual. Focus pipeline energy on script quality, not distribution automation. |
| **TTS / AI voiceover generation** | Pavlo records his own voice. His accent and delivery ARE the brand. AI voice would destroy authenticity -- the exact opposite of the pipeline's goal. | Optimize scripts for Pavlo's pronunciation instead. His voice is the product. |
| **Full video generation / editing** | Remotion, auto-subtitles, programmatic rendering are separate concerns. Mixing them into the scriptwriting pipeline creates a monolith. Pavlo does screen recording + simple editing. | Keep video production manual for now. Scriptwriting pipeline should output a ready-to-record script document, not a video file. |
| **Multi-platform adaptation** | Rewriting scripts for TikTok, Instagram Reels, etc. adds complexity for zero proven value. Pavlo's audience is on YouTube. | YouTube Shorts only. If Pavlo cross-posts, same script works -- format is identical. |
| **SEO keyword optimization** | Shorts discovery is algorithm-driven (visual engagement, retention), not keyword-driven. SEO optimization in scripts would make them sound corporate and hurt authenticity. | Focus on hook quality and retention metrics instead. Let the algorithm work based on engagement. |
| **Trend-chasing automation** | Tools like last30days that scrape Reddit/X/YouTube for trending topics. Devlog content comes from ACTUAL dev work, not trends. Trend-chasing = generic content. | Ideation should be grounded in what Pavlo actually built this week, not what's trending on social media. Trending topics are for commentary channels, not devlogs. |
| **Script length optimization via AI** | Trying to hit an "optimal" duration algorithmically. Duration should follow content -- when the idea is delivered, the video ends. | Let script naturally end when the single idea is complete. Pavlo's best videos range 30-47 seconds. Don't pad or trim to hit a number. |
| **Collaboration / team features** | Multi-user workflows, approval chains, role-based access. This is a solo creator pipeline. | Single-user Claude Code skill. No team overhead. |

## Feature Dependencies

```
Brand Voice Profile
  |
  +---> Script Generation (requires voice profile to personalize)
  |       |
  |       +---> Anti-Slop Scoring (scores against voice + banned patterns)
  |       |       |
  |       |       +---> Anti-Slop Rewrite (uses voice profile for rewrites)
  |       |
  |       +---> Pronunciation Optimization (post-generation pass)
  |       |
  |       +---> Hook A/B Variants (generates from same script body)
  |
  +---> Style Anchor System (anchors voice profile to real transcript)

Format Templates (independent, needed before generation)
  |
  +---> Script Generation (selects template per topic)

Ideation Session (independent)
  |
  +---> Script Generation (ideation output = generation input)

Metrics Log (independent)
  |
  +---> Feedback Loop (requires 10+ entries for pattern analysis)
  |       |
  |       +---> Format Performance Ranking (aggregates by format tag)
  |       |
  |       +---> Script Generation preferences (informed by what works)

Visual-Audio Dual Track (structural, built into templates)

One Idea Enforcement (validation rule, applied post-generation)

Specificity Injection (can be part of anti-slop or standalone pass)

Visual Suggestion Engine (post-script enhancement, independent)
```

## MVP Recommendation

**Phase 1 -- Core Pipeline (must ship first):**

1. **Brand Voice Profile** -- foundation for everything. Interview Pavlo, extract from transcripts, create voice document. Without this, all generation is generic.
2. **Format Templates** -- encode the 7 proven formats as structured templates with beat sequences. This is the skeleton scripts hang on.
3. **Script Generation** -- core capability. Takes: format template + topic + voice profile. Outputs: visual-audio dual-track script with hook-first structure.
4. **Anti-Slop Scoring** -- quality gate. Every script must score 35+/50 before human review. Non-negotiable.
5. **One Idea Enforcement** -- structural validation. Simple rule, high impact.
6. **Hook-First Structure** -- built into templates, not a separate feature.
7. **Visual-Audio Dual Track** -- built into output format, not a separate feature.

**Phase 2 -- Personalization (ship after 3-5 videos):**

8. **Ideation Session** -- systematic topic generation from dev progress.
9. **Style Anchor System** -- use video #6 transcript as reference point.
10. **Pronunciation Optimization** -- post-generation pass for non-native friendliness.
11. **Anti-Slop Rewrite** -- automated fix pass, not just scoring.
12. **Specificity Injection** -- detect and prompt for concrete details.

**Phase 3 -- Learning (ship after 10+ videos):**

13. **Metrics Log** -- start collecting from video #7 onward.
14. **Feedback Loop** -- pattern analysis after 10+ data points.
15. **Format Performance Ranking** -- which formats work for Pavlo's channel.
16. **Hook A/B Variants** -- optimize the highest-leverage 3 seconds.
17. **Visual Suggestion Engine** -- elevate production with technique recommendations.

**Defer indefinitely:** All anti-features listed above. They solve problems Pavlo doesn't have.

## Feature Prioritization Matrix

| Feature | Impact | Complexity | Dependencies | Priority |
|---------|--------|------------|-------------|----------|
| Brand Voice Profile | Critical | Medium | None | P0 |
| Format Templates | High | Low | None | P0 |
| Script Generation | Critical | Medium | Voice + Templates | P0 |
| Anti-Slop Scoring | Critical | Medium | Voice Profile | P0 |
| Hook-First Structure | High | Low | Built into templates | P0 |
| Visual-Audio Dual Track | High | Low | Built into output | P0 |
| One Idea Enforcement | Medium | Low | None | P0 |
| Ideation Session | High | Low | None | P1 |
| Style Anchor System | High | Low | Voice Profile | P1 |
| Pronunciation Optimization | High | Medium | Script Generation | P1 |
| Anti-Slop Rewrite | Medium | Medium | Anti-Slop Scoring + Voice | P1 |
| Specificity Injection | Medium | Low | Script Generation | P1 |
| Metrics Log | Medium | Low | None | P2 |
| Feedback Loop | High | Medium | Metrics Log (10+ entries) | P2 |
| Format Performance Ranking | Medium | Low | Metrics Log + Format Tags | P2 |
| Hook A/B Variants | Medium | Low | Script Generation | P2 |
| Visual Suggestion Engine | Low | Medium | Script Generation | P2 |

## Sources

- [YouTube Shorts Best Practices 2026 - JoinBrands](https://joinbrands.com/blog/youtube-shorts-best-practices/)
- [YouTube Shorts Hook Formulas - OpusClip](https://www.opus.pro/blog/youtube-shorts-hook-formulas)
- [The First 3 Seconds: Hook Structures - virvid.ai](https://virvid.ai/blog/first-3-seconds-hook-faceless-shorts-2026)
- [How to Stop Content From Sounding Like AI Slop - 1up.ai](https://1up.ai/blog/ai-slop-guidelines/)
- [How to Clean Up AI Drafts - Louis Bouchard](https://www.louisbouchard.ai/ai-editing/)
- [Brand Voice AI Prompt Template - Atom Writer](https://www.atomwriter.com/blog/brand-voice-ai-prompt-template/)
- [AI Brand Voice Guidelines - Oxford College of Marketing](https://blog.oxfordcollegeofmarketing.com/2025/08/04/ai-brand-voice-guidelines-keep-your-content-on-brand-at-scale/)
- [YouTube for Indie Games: Devlog Success Story](https://freakingcoolindies.com/1-2/)
- [AI Content Workflow Automation 2026 - GreenMo](https://www.greenmo.space/blogs/post/ai-content-workflow-automation)
- [YouTube Shorts Retention Rate 2026 - Shortimize](https://www.shortimize.com/blog/youtube-shorts-retention-rate)
- Pavlo's channel data: 6 videos analyzed (videos-1-6-transcription.md)
- Project context: .planning/PROJECT.md
