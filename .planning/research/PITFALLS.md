# Domain Pitfalls

**Domain:** AI-assisted YouTube Shorts devlog scriptwriting pipeline
**Researched:** 2026-03-26

## Critical Pitfalls

Mistakes that cause rewrites, wasted effort, or audience damage.

---

### Pitfall 1: AI Slop That Sounds "Professional" But Not Human

**What goes wrong:** The AI generates scripts that are grammatically perfect, use varied vocabulary, and follow proper narrative structure -- but sound nothing like Pavlo. They sound like a tech journalist or corporate explainer. Words like "dive into," "journey," "elevate," "craft," "embark," "leverage" leak in. Sentences become longer and more complex than spoken English. The script reads like writing, not talking.

**Why it happens:** LLMs default to the statistical average of their training data, which is predominantly polished written content. Without aggressive anchoring to a specific voice, every generation drifts toward "internet average" -- authoritative, smooth, and generic. The anti-slop word list catches obvious offenders but misses structural slop: overly balanced sentences, rhetorical questions that nobody actually asks, transitions that sound like essay writing.

**Consequences:** Viewers detect AI-generated content within seconds. Consumer trust drops approximately 50% when content is perceived as AI-generated, regardless of actual quality. For a channel at 55 subscribers, losing trust means losing the ability to grow. YouTube's 2025-2026 policies also flag repetitive AI-sounding content for reduced recommendations.

**Warning signs:**
- Script "feels" polished on first read but awkward when read aloud
- Sentences average more than 12 words
- Script uses words Pavlo would never say in conversation
- Every paragraph has perfect topic-sentence-support-conclusion structure
- Hook sounds like a clickbait template rather than a person talking

**Prevention:**
- Brand voice profile (brand-voice.md) must include: banned words, sentence length cap (10-12 words average), mandatory speech patterns ("so I...", "turns out...", "let's..."), and a real transcript as style anchor
- Anti-slop scoring on EVERY generated script, no exceptions (35+/50 threshold)
- Read-aloud test before recording: if any sentence makes Pavlo stumble or pause, rewrite it
- Include 3-5 "Pavlo-isms" that must appear naturally in every script (drawn from transcript analysis)

**Detection:** Compare generated script sentence-by-sentence against Pavlo's actual transcript. If more than 30% of sentences "feel different" -- the voice has drifted.

**Phase mapping:** Must be addressed in Phase 1 (Brand Voice Setup + Skill Installation). Cannot generate scripts without this foundation.

---

### Pitfall 2: Mid-Session Voice Drift

**What goes wrong:** The AI starts a script matching Pavlo's voice, but by the middle or end of the script, it reverts to generic AI tone. Opening line sounds like a person; closing line sounds like a press release. This is especially dangerous in iterative sessions where multiple scripts are generated back-to-back -- each generation gets progressively more generic.

**Why it happens:** LLMs generate text sequentially. As the AI writes, its own output becomes part of the context window. Generic phrasing in sentence 3 pulls sentence 4 further toward average. Over a long conversation, the brand voice instructions get diluted by the volume of generated text. This is a well-documented phenomenon called "mid-piece voice drift."

**Consequences:** Scripts have inconsistent tone. The hook sounds authentic but the payoff sounds robotic. Viewer feels a subtle "uncanny valley" effect -- something is off but they can't pinpoint it.

**Warning signs:**
- Last 3 sentences of script sound different from first 3
- In batch generation, script #4 sounds noticeably different from script #1
- AI starts using longer sentences toward the end of scripts

**Prevention:**
- Generate scripts one at a time, not in batches within the same conversation
- For each script, re-anchor the brand voice by including a transcript snippet in the prompt
- Keep scripts SHORT (45-60 seconds = 90-120 words). Less room for drift
- Post-generation pass: read the last sentence first -- does it still sound like Pavlo?

**Detection:** Score the first half and second half of each script independently against brand voice criteria. If scores diverge by more than 5 points, the script drifted.

**Phase mapping:** Address in Phase 1 (Skill design). The skill's script generation phase should include re-anchoring instructions.

---

### Pitfall 3: Feedback Loop That Doesn't Actually Improve Anything

**What goes wrong:** Metrics are collected diligently in metrics-log.md after every video. Views, retention, subscribers gained -- all logged. But the data never meaningfully changes what scripts get generated. The "loop" is actually a dead-end archive. Six months later, metrics-log.md has 25 entries and script quality is identical to day one.

**Why it happens:** Three failure modes: (1) Vanity metrics -- tracking views and likes but not retention curve shape or drop-off points, which are the only metrics that tell you what's wrong with the script. (2) No hypothesis testing -- the log records outcomes but never records what was different about each script (format, hook type, topic category, visual style). (3) No actionable rules -- "video #6 got 8.7K views" doesn't tell the AI anything useful. "Videos using The Bug format with physics visuals average 75%+ retention" does.

**Consequences:** The entire feedback loop -- described as the project's "superpower" -- becomes busywork. Pavlo spends time logging metrics that produce no insight. The pipeline never becomes a "personalized engine" -- it stays a generic tool with a spreadsheet attached.

**Warning signs:**
- After 5+ videos, script generation instructions haven't changed
- Metrics log has numbers but no "what was different" annotations
- Can't answer: "which hook type works best for this channel?"
- AI generates the same distribution of formats regardless of past performance

**Prevention:**
- Every metrics-log.md entry must include: format used (The Bug, The Satisfaction, etc.), hook type, topic category, and what was visually on screen
- After every 3 videos, run a pattern analysis that produces concrete rules: "The Satisfaction format averages 70%+ retention; The Decision format averages below 50%"
- Rules get injected into the script generation prompt as constraints
- Track retention percentage and subscriber conversion, NOT views (views are noise at this scale)

**Detection:** After 5 logged videos, ask: "What 3 concrete things has the feedback loop changed about how scripts are generated?" If the answer is vague or nothing -- the loop is broken.

**Phase mapping:** Design the metrics schema in Phase 1. But the actual feedback analysis only becomes meaningful after Phase 2 (first 3-5 scripts generated and recorded). Phase 3+ should include periodic "pattern analysis" sessions.

---

### Pitfall 4: Over-Engineering the Pipeline Before Proving the Core

**What goes wrong:** Weeks spent setting up YouTube MCP integrations, auto-subtitle pipelines, Remotion rendering, trend research tools, companion skills -- before generating a single usable script. The pipeline becomes a project in itself. Pavlo is now a pipeline maintainer instead of a game developer who makes videos.

**Why it happens:** Technical people (especially fullstack developers) are drawn to building systems. Installing tools feels productive. Configuring integrations feels like progress. But none of it produces a video. The real bottleneck -- "can the AI write a script that sounds like Pavlo?" -- gets buried under tooling work.

**Consequences:** Weeks of setup with zero videos published. Motivation drops. The channel stalls at 55 subscribers while the "perfect pipeline" is being assembled. By the time it's ready, the momentum is gone.

**Warning signs:**
- More than 3 days pass between "project started" and "first script generated"
- Time spent on tooling exceeds time spent on content by 3:1 or more
- Companion skills installed but brand-voice.md still empty
- Discussing "what tools to add" instead of "what video to make next"

**Prevention:**
- Phase 1 scope: brand voice interview + one skill file + generate first script. That's it.
- YouTube MCP, auto-subtitles, Remotion: explicitly Out of Scope until 5+ videos published using the basic pipeline
- The PROJECT.md already correctly scopes these out -- enforce this boundary
- "Working" = "Pavlo recorded a video using an AI-generated script" not "all tools are installed"

**Detection:** Track days-to-first-script. If it exceeds 5 working days, the pipeline is over-engineered.

**Phase mapping:** Phase 1 must be ruthlessly minimal. Tooling expansion belongs in Phase 3+ only after the core script generation is validated.

---

### Pitfall 5: Pronunciation-Hostile Scripts for Non-Native Speaker

**What goes wrong:** The AI generates scripts with words and phrases that are difficult for a Ukrainian English learner to pronounce naturally. Tongue-twisters, uncommon consonant clusters, words with silent letters, or phrases that require specific English rhythm patterns. Pavlo stumbles during recording, does multiple takes, and the final voiceover sounds strained rather than natural.

**Why it happens:** LLMs optimize for written impact, not spoken ease. Words like "thoroughly," "specifically," "simultaneously," "particularly" score well in text but are pronunciation obstacles. English contractions, linking sounds, and stress patterns are invisible in text but critical in speech. The AI has no model of what's hard to pronounce for a Ukrainian speaker.

**Consequences:** Recording sessions take 3x longer. Pavlo's delivery sounds forced. The natural, casual tone that makes devlogs engaging is lost. Worse: Pavlo may unconsciously avoid recording because the script feels hard to deliver.

**Warning signs:**
- Pavlo needs more than 2 takes per sentence
- Script contains words with 4+ syllables that aren't technical terms
- Script uses idioms that require native-speaker rhythm ("at the end of the day," "the thing is though")
- Words with 'th', 'w/v' confusion, or complex consonant clusters appear frequently

**Prevention:**
- Add a pronunciation filter to the skill: flag any word over 3 syllables that isn't a common game dev term
- Prefer short Anglo-Saxon words over long Latin/Greek derivatives ("use" not "utilize," "fix" not "rectify," "break" not "malfunction")
- Include a "say it out loud" step in the script generation phase -- explicitly instruct the AI to prefer speakable words
- Maintain a personal "hard words" list for Pavlo: words he's struggled with in past recordings, banned from future scripts
- Contractions are mandatory: "I'm" not "I am," "didn't" not "did not" (contractions are easier to pronounce naturally)
- Keep sentences to one breath: if you can't say the sentence in one breath, it's too long

**Detection:** Before recording, Pavlo reads the script aloud once. Any word he stumbles on gets replaced. Track these words in a running list.

**Phase mapping:** Must be built into Phase 1 (Skill design). The pronunciation filter is part of the core script generation, not an add-on.

---

## Moderate Pitfalls

### Pitfall 6: Template Fatigue -- Same Format, Different Topic

**What goes wrong:** After the first few successful videos using "The Bug" or "The Satisfaction" format, every script starts following the same structure. Open with shock/surprise hook, show the problem, reveal the solution, end with "and that's how I..." wrap-up. Viewers who watch multiple videos notice the repetition. YouTube's algorithm also penalizes repetitive content patterns.

**Prevention:**
- Rotate formats deliberately: track which format was used last and don't repeat the same format for 3 consecutive videos
- The ideation phase should generate angles across at least 3 different formats
- Periodically introduce experimental formats not on the original list
- Study what other successful devlog channels are doing for format inspiration

**Phase mapping:** Phase 2 (script generation) should enforce format rotation. Phase 3+ should review format distribution in metrics analysis.

---

### Pitfall 7: Ignoring the "One Idea = One Video" Rule Under Pressure

**What goes wrong:** Pavlo has a productive dev week with 3-4 interesting things to show. The script tries to cover all of them in 60 seconds. The result: a rushed montage with no emotional arc, no hook that lands, and viewers who don't remember anything specific.

**Prevention:**
- Skill must enforce a hard check: does this script contain more than one core idea? If yes, split.
- Better to have 4 scripts banked for next month than 1 cramped script this week
- Each script should pass the "what's this video about in 5 words?" test

**Phase mapping:** Built into Phase 1 skill design as a structural rule.

---

### Pitfall 8: Visuals-Script Mismatch

**What goes wrong:** The script describes or implies visuals that don't exist in Pavlo's screen recordings. "Watch how the dragon's fire engulfs the bridge" -- but the dragon doesn't have fire effects yet. Or worse: the script is written without knowing what footage is available, so Pavlo has to record new gameplay just to match the script.

**Prevention:**
- Script generation must start with "what footage exists or can be easily captured?" not "what's a cool story?"
- Include a "visual inventory" step: before writing, list 3-5 specific moments from recent dev work that are visually interesting
- Every script line should have a parenthetical [SCREEN: what viewer sees] annotation
- If the visual doesn't exist, the line gets cut

**Phase mapping:** Phase 1 skill design. The "visuals drive, voice follows" principle from PROJECT.md must be operationalized as a concrete step in the generation workflow.

---

### Pitfall 9: Optimizing for Algorithm Instead of Audience

**What goes wrong:** Scripts start chasing trending formats, clickbait hooks, and engagement-bait endings ("comment what you think!") because metrics suggest these boost numbers. The channel loses its authentic devlog character and becomes indistinguishable from hundreds of generic "gamedev tips" channels.

**Prevention:**
- Brand voice profile should include "what this channel is NOT" -- explicitly define anti-patterns
- Metrics analysis should track subscriber conversion rate, not just views. High views + low subs = wrong audience.
- Pavlo's best-performing videos (#3 and #6) succeeded because of authentic content, not algorithm tricks. Double down on what already works.

**Phase mapping:** Phase 3+ during feedback analysis. Include an "authenticity check" in pattern analysis sessions.

---

## Minor Pitfalls

### Pitfall 10: Neglecting Title and Thumbnail in the Pipeline

**What goes wrong:** The pipeline focuses entirely on script quality but ignores that title and thumbnail determine whether anyone clicks. A great script with a bad title gets zero views.

**Prevention:**
- Script generation should output: script + 3 title options + thumbnail concept (what single frame to capture)
- Titles should follow patterns from best performers: short, personality-driven, specific ("Troll throw people" > "Making a Troll Game")

**Phase mapping:** Add to Phase 2 as part of script output format.

---

### Pitfall 11: Not Accounting for YouTube's 30-Day Shorts Decay

**What goes wrong:** Pavlo publishes once a week but expects each video to accumulate views over months. YouTube Shorts older than roughly 30 days receive significantly fewer recommendations. Content effectively expires.

**Prevention:**
- Accept the decay: each Short is a 30-day asset, not an evergreen investment
- This reinforces the need for consistent cadence (1/week minimum) rather than perfecting individual videos
- Don't over-invest in any single script. Good enough and published beats perfect and delayed.

**Phase mapping:** Context for Phase 1 priority-setting. Reinforces "ship fast" over "build perfect pipeline."

---

### Pitfall 12: YouTube Monetization Policy Violations with AI Content

**What goes wrong:** YouTube's updated policies (July 2025) require AI-generated content to be "significantly original, authentic, and transformed." If scripts and delivery feel templated or mass-produced, the channel risks demonetization or reduced recommendations even at small scale.

**Prevention:**
- Always record with Pavlo's real voice (never TTS) -- this is already the plan
- Scripts must be personalized to his actual dev experience, not generic gamedev advice
- The anti-slop system directly addresses this: authentic scripts pass YouTube's guidelines naturally
- When the channel grows, be aware of disclosure requirements for AI-assisted content

**Phase mapping:** Background consideration for all phases. No specific phase needed since the anti-slop + real voiceover approach inherently complies.

---

## "Looks Done But Isn't" Checklist

These items appear complete but have hidden failure modes:

| Item | Looks Done When... | Actually Done When... |
|------|-------------------|----------------------|
| Brand voice profile | brand-voice.md has content | Profile tested against 3+ generated scripts and Pavlo confirms "that sounds like me" |
| Anti-slop rules | Word list is installed | Scripts consistently score 35+/50 AND sound natural when read aloud |
| Feedback loop | Metrics are being logged | Logged metrics have produced at least 2 concrete rule changes to script generation |
| Skill installation | Files exist in .claude/skills/ | A script generated using the skill passes both anti-slop scoring and Pavlo's read-aloud test |
| Pronunciation filter | Rule says "use simple words" | Pavlo has recorded 2+ scripts without pronunciation stumbles on AI-chosen words |
| Format rotation | Multiple formats listed | Last 5 videos used at least 3 different formats |

---

## Recovery Strategies

### If scripts sound too AI-generated (Pitfalls 1, 2)
1. Stop generating new scripts
2. Take Pavlo's best video transcript and use it as the ONLY style reference
3. Generate one 5-sentence script and compare line-by-line with transcript
4. Adjust brand voice profile based on specific differences found
5. Regenerate and repeat until Pavlo says "that sounds like me"

### If the feedback loop is dead (Pitfall 3)
1. Review all logged metrics and annotate: what format, what hook type, what visual content
2. Sort by retention percentage (ignore views)
3. Write 3 concrete rules: "Format X works. Format Y doesn't. Hook type Z gets best retention."
4. Inject these rules into the script generation prompt
5. Generate next script using the rules and see if output changes

### If the pipeline is over-engineered (Pitfall 4)
1. Stop installing tools
2. Open brand-voice.md. Is it filled out? If not, do that first.
3. Generate ONE script using just the core skill
4. Have Pavlo record it
5. Publish. Collect metrics. Only then consider adding tools.

### If pronunciation is blocking recording (Pitfall 5)
1. Pavlo reads the problem script aloud and marks every stumble word
2. Add all stumble words to the "hard words" ban list
3. Regenerate the script with the updated ban list
4. If systemic: add a rule to the skill -- "maximum 2-syllable words unless it's a game dev term"

---

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|---------------|------------|
| Brand Voice Setup | Profile is too generic/aspirational instead of grounded in real speech | Use actual transcript excerpts, not descriptions of desired tone |
| Skill Installation | Installing companion skills before core skill works | Install core skill only. Validate with one script. Then add companions. |
| First Script Generation | Generating 5 scripts instead of 1, optimizing before validating | Generate 1 script. Record it. Publish it. Learn from it. Then batch. |
| Metrics Collection | Logging views instead of retention and sub conversion | Define the 3 metrics that matter BEFORE first publish. Ignore everything else initially. |
| Feedback Analysis | Drawing conclusions from fewer than 5 data points | Wait for 5+ videos before changing strategy. Note patterns but don't act on sample size < 5. |
| Format Expansion | Adding new formats before validating existing ones work | Master 2-3 formats that work before experimenting with new ones |
| Pipeline Scaling | Adding automation (MCP, auto-subtitles) to a pipeline that produces 1 video/week | At 1 video/week, manual processes are fine. Automate only when cadence exceeds 3/week. |

---

## Sources

- [YouTube's AI Slop Problem (Search Engine Journal)](https://www.searchenginejournal.com/youtubes-ai-slop-problem-and-how-marketers-can-compete/567297/)
- [YouTube Demonetization Policy 2026 (ShortVids)](https://shortvids.co/youtube-ai-content-demonetization-policy/)
- [YouTube AI Monetisation Policy 2026 (Boss Wallah)](https://bosswallah.com/blog/creator-hub/youtube-ai-monetisation-policy-2026-what-changes-whats-allowed-and-whats-banned/)
- [YouTube's AI Problem Is Worse Than You Think (AdwaitX)](https://www.adwaitx.com/youtube-shorts-ai-generated-content-problem/)
- [How to Maintain Brand Voice with AI Content (Stridec)](https://www.stridec.com/blog/brand-voice-consistency-ai-content-strategic-framework/)
- [AI Brand Voice Guidelines (Oxford College of Marketing)](https://blog.oxfordcollegeofmarketing.com/2025/08/04/ai-brand-voice-guidelines-keep-your-content-on-brand-at-scale/)
- [You Can't Automate Brand Voice (MarTech)](https://martech.org/you-cant-automate-brand-voice-but-you-can-train-ai-to-respect-it/)
- [Content Marketing ROI 2026: Only 19% Track AI KPIs (Digital Applied)](https://www.digitalapplied.com/blog/content-marketing-roi-2026-19-percent-track-ai-kpis/)
- [Indie Games Go-to-Market Playbook 2025 (Medium)](https://medium.com/design-bootcamp/entering-indie-games-in-2025-a-senior-engineers-go-to-market-playbook-cdc507f3bf0f)
- [YouTube Algorithm Updates 2026 (OutlierKit)](https://outlierkit.com/resources/youtube-algorithm-updates/)
- [How to Make YouTube Videos in English as Non-Native Speaker (Gold Jetto)](https://goldjetto.com/youtube-videos-english-non-native/)
