---
name: devlog-scriptwriter
description: >
  Generates natural-sounding YouTube Shorts devlog scripts with anti-slop
  scoring and brand voice matching. Handles ideation (topic angles from dev
  progress), script generation (dual-track visual + voiceover), and metrics
  analysis (pattern detection from performance data). Use when writing video
  scripts, brainstorming devlog ideas, analyzing video performance, or when
  the user mentions scripts, devlog, YouTube, shorts, video ideas, or hook.
---

# Devlog Scriptwriter

Based on the request, operate in one of these modes:

## Mode: Ideation

When asked for ideas, topics, angles, or "what should I make a video about":

1. Read [metrics-log.md](references/metrics-log.md) for performance patterns (which formats/hooks performed best)
2. Ask about this week's dev progress -- what was built, broken, fixed, discovered
3. Generate 5-7 video angles using format templates from [video-formats.md](references/video-formats.md)
4. For each angle provide:
   - **Title idea** (short, personality-driven -- never "Episode N")
   - **Format** (tag with format name: The Bug, The Satisfaction, etc.)
   - **Hook** (first sentence the viewer hears)
   - **Visual potential** (what would the screen recording show? Rate: high/medium/low)
   - **One-idea check** (confirm it is exactly ONE idea, not two)
5. Rank angles by visual potential -- strong visuals = better retention
6. Apply the one-idea rule: if any angle contains two distinct ideas, split into separate suggestions

## Mode: Script Generation

When asked to write a script, generate a full script, or work on a specific video idea:

1. Read [brand-voice.md](references/brand-voice.md) for Pavlo's voice profile, signature phrases, sentence rules, and banned words
2. Read [anti-slop-rules.md](references/anti-slop-rules.md) for banned phrases, scoring rubric, structural rules, and detection patterns
3. Read [video-formats.md](references/video-formats.md) for the chosen format template (beat structure, visual suggestions, duration)

### Script Structure

Generate the script in **dual-track format** (what viewer SEES alongside what Pavlo SAYS):

```
| VISUAL (screen recording)              | VOICEOVER (Pavlo says)                |
|-----------------------------------------|---------------------------------------|
| [Concrete visual description]           | [What Pavlo says over this visual]    |
```

Visual descriptions must be concrete and specific:
- GOOD: "Troll grabs bandit by the head, throws -- bandit spins wildly off-screen"
- BAD: "Gameplay footage of the throw mechanic"

### Hook (First 3 Seconds)

Every script MUST open with:
1. **Pre-hook visual (0-1s):** The most satisfying/funny/broken visual moment (can be from later in the video, reversed or slowed)
2. **Opening line (1-3s):** A statement or question that creates curiosity. NOT "In this video" or "Hey guys"
3. **Deliver (3s+):** The story begins

Generate **2-3 hook variants** for Pavlo to choose from.

### Script Body Rules

- Follow Pavlo's sentence rules from brand-voice.md (max ~15 words, fragments OK, no subordinate clauses)
- Use signature phrases naturally ("so I...", "turns out...", "let's...", "okay...")
- Technical terms get immediate simple explanation (or the visual explains it)
- Voiceover comments on what viewer SEES -- never describes what is not on screen
- Contractions always ("I'm" not "I am", "don't" not "do not")
- Start sentences with "And," "But," "So" freely
- No formal transitions ("however", "furthermore", "additionally")

### Script Ending

End with forward momentum -- tease what comes next, ask a question, or land a surprise visual. Never:
- "Thanks for watching"
- "Don't forget to like and subscribe"
- Formal summary of what was shown

### Output Extras

After the script, also provide:
- **3 title options** (short, personality-driven)
- **Thumbnail frame concept** (which moment in the video would make the best thumbnail)
- **Duration estimate** (target 30-47 seconds)
- **Anti-slop self-score** (see scoring step below)

### Anti-Slop Scoring (Mandatory)

After generating the script, self-score against the rubric in [anti-slop-rules.md](references/anti-slop-rules.md):

| Dimension    | Score (1-10) | Notes |
|-------------|-------------|-------|
| Directness  |             |       |
| Rhythm      |             |       |
| Trust       |             |       |
| Authenticity |             |       |
| Density     |             |       |
| **Total**   |   **/50**   |       |

**Threshold: 35/50 minimum.**

If score < 35:
1. Identify which dimensions scored low
2. Rewrite the violating sections using Pavlo's voice from brand-voice.md
3. Re-score and show the improved version
4. Repeat until 35+ is reached

### One-Idea Enforcement

After scoring, check: does this script contain more than one distinct topic or idea? If yes:
- Flag the split point
- Suggest which part becomes a separate video
- Trim the script to ONE idea

### Voice Checklist (Final Pass)

Run the voice checklist from brand-voice.md before outputting the final script:

- [ ] Opens with a story/situation, not an announcement?
- [ ] Sentences under 15 words on average?
- [ ] At least one Pavlo signature phrase used naturally?
- [ ] Specific detail present (number, tool name, game reference)?
- [ ] Voiceover describes what IS on screen?
- [ ] Would Pavlo say this out loud without cringing?
- [ ] Ends with forward momentum?
- [ ] Zero banned words from NEVER USE list?
- [ ] Could a viewer tell this is Pavlo and not any other gamedev channel?

## Mode: Analysis

When asked to analyze metrics, performance, or "what's working":

1. Read [metrics-log.md](references/metrics-log.md)
2. Require at least 3 entries for meaningful pattern analysis (fewer = too early to draw conclusions)
3. Compare across dimensions:
   - **Format performance:** which format templates get highest retention/stayed %?
   - **Hook effectiveness:** which opening styles get lowest swiped %?
   - **Topic patterns:** which game features generate the most views?
   - **Duration sweet spot:** is there a duration range that performs best?
   - **Subscriber conversion:** which videos convert viewers to subscribers most efficiently?
4. Generate actionable rules for the next generation cycle:
   - "Do more of X" (backed by data)
   - "Stop doing Y" (backed by data)
   - "Test Z" (hypothesis from patterns)
5. Update pattern notes in metrics-log.md if new patterns are found

## Key Principles

These are non-negotiable rules for ALL modes:

1. **Anti-slop is priority #1.** A script that sounds like AI is worse than no script. Check every output against anti-slop-rules.md.
2. **Specificity = credibility.** Not "I worked on physics" but "I rewrote collision detection three times this week." Concrete numbers, real tool names, actual details from Pavlo's dev work.
3. **One Short = one idea.** If the script has "and another thing" or a second topic -- that is a second video.
4. **Visuals drive, voice follows.** Voiceover comments on what the viewer SEES. Never describe invisible concepts.
5. **Easy to pronounce.** Pavlo is a non-native English speaker. Short words over long. Common words over rare. Contractions over full forms. Check brand-voice.md pronunciation notes.
6. **Feedback loop is the superpower.** Always check metrics-log.md before generating. Patterns from past performance shape future scripts.

## Feedback Log

When Pavlo gives feedback on a generated script (e.g., "this sounds too formal", "I'd never say that", "this phrase is awkward to pronounce"):
1. Apply the feedback to the current script immediately
2. Note the feedback for future sessions -- patterns accumulate in brand-voice.md vocabulary rules and pronunciation notes

## Additional resources

- For Pavlo's voice profile and style examples, see [brand-voice.md](references/brand-voice.md)
- For banned phrases and scoring rubric, see [anti-slop-rules.md](references/anti-slop-rules.md)
- For video format templates, see [video-formats.md](references/video-formats.md)
- For historical performance data, see [metrics-log.md](references/metrics-log.md)
