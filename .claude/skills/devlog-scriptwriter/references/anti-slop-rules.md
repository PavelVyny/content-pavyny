# Anti-Slop Rules

Merged from 4 ecosystem sources: stop-slop (5-dimension scoring), humanizer (24-category AI pattern taxonomy), slop-radar (200+ buzzwords), anti-slop-writing (vocabulary banlist with detection metrics).

## Scoring Rubric

Score each dimension 1-10 after generating a script. Total must be **35+/50**.

| Dimension | 1-3 (Bad) | 4-6 (OK) | 7-10 (Good) | Key Question |
|-----------|-----------|----------|-------------|--------------|
| **Directness** | Announcements, throat-clearing, buildup before the point | Gets there but meanders | Direct statements, point-first, no filler lead-ins | "Is this a statement or an announcement?" |
| **Rhythm** | Every sentence same length, metronomic cadence | Some variation | Punchy mix of short and medium, fragments alongside full sentences | "Read it aloud -- does it sound like a person or a metronome?" |
| **Trust** | Over-explains, tells viewer what to think, spells out the obvious | Moderate hand-holding | Respects viewer intelligence, lets visuals carry meaning | "Am I explaining or showing?" |
| **Authenticity** | Sounds generated, could be any channel, no personality | Has some personality | Sounds like Pavlo -- specific, self-deprecating, honest | "Would Pavlo say this out loud without cringing?" |
| **Density** | Padding, filler phrases, words that add nothing | Mostly tight | Every word earns its place, nothing cuttable | "Can I cut any word without losing meaning?" |

### Scoring Examples

**Score 8-10 (Directness):** "The throw was broken. Force hit one bone, spun the whole body."
**Score 2-3 (Directness):** "So today I wanted to share with you something really interesting that happened while I was working on the throw mechanic."

**Score 8-10 (Rhythm):** "Grabbed him by the head. Threw. He spun wildly off-screen. Yeah... it was easier with the crates."
**Score 2-3 (Rhythm):** "I grabbed the enemy by the head. I threw the enemy forward. The enemy spun wildly off the screen. It was definitely easier when I was throwing crates."

## Banned Phrases

### AI Vocabulary (use = instant AI tell)

| Banned | Why | Use Instead |
|--------|-----|-------------|
| journey | AI favorite | "process", "the last 3 weeks", or just cut it |
| dive into / deep dive | AI cliche | "look at", "try", "check out", or just start |
| game-changer | hype slop | say what actually changed |
| landscape | metaphorical use | "scene", "space", or be specific |
| realm | AI fantasy word | cut entirely |
| leverage | corporate AI | "use" |
| utilize | corporate AI | "use" |
| harness | AI verb | "use", "take" |
| optimize | corporate | "fix", "make faster", "improve" |
| elevate | promotional AI | "improve", "make better" |
| empower | corporate AI | cut entirely |
| seamless | AI adjective | "smooth", "clean", or describe what's smooth |
| robust | AI adjective | "solid", "strong" |
| streamline | corporate | "simplify", "clean up" |
| innovative | promotional | describe the innovation instead |
| cutting-edge | hype | be specific about what's new |
| delve | AI verb | "look at", "check" |
| navigate (metaphorical) | AI verb | "figure out", "deal with" |
| ecosystem (non-tech) | AI noun | "space", "world" |
| testament | AI filler | cut entirely |
| underscores | AI verb | "shows" |
| facilitates | corporate | "helps", "makes possible" |
| bolster | AI verb | "strengthen", "help" |
| pivotal | AI adjective | "key", "important" |
| myriad | AI adjective | "lots of", "many" |
| plethora | AI adjective | "lots of", "a bunch of" |
| nuanced | AI adjective | "tricky", "complicated" |
| comprehensive | AI adjective | "full", "complete" |
| intricacies | AI noun | "details", "tricky parts" |
| paradigm | corporate AI | cut entirely or be specific |
| synergy | corporate AI | cut entirely |
| catalyst | AI metaphor | "reason", "thing that started it" |

### Filler Phrases (add nothing, cut entirely)

- "It's worth noting that"
- "One thing to keep in mind"
- "At the end of the day"
- "When it comes to"
- "In terms of"
- "The thing is" (exception: Pavlo actually uses this -- keep if natural)
- "As a matter of fact"
- "Needless to say"
- "It goes without saying"
- "All things considered"
- "For what it's worth"
- "Let's be honest" / "Let's be real"
- "I have to say"
- "To be fair"
- "Not gonna lie"
- "Here's the thing"
- "The reality is"
- "Truth be told"
- "In many ways"
- "On the other hand"

### Hype Language (inflated emotion, replace with specifics)

- incredible, amazing, awesome, insane, crazy, epic (as hype)
- "This changes everything"
- "You won't believe"
- "I was blown away"
- "absolutely [adjective]" (exception: Pavlo uses "absolutely terrible" -- keep that one)
- "truly [adjective]"
- "literally" (as emphasis, not literally)
- "game-changing"
- "mind-blowing" (exception: Pavlo used once for Max Payne 2 nostalgia)
- "next level"
- "so satisfying" (show it, don't say it)

### YouTuber Cliches (never use)

- "Hey guys!" / "What's up everyone!" / any greeting
- "Don't forget to like and subscribe"
- "Smash that like button"
- "In this video I'll show you" / "Today we're going to"
- "Without further ado"
- "Let me know in the comments"
- "Before we get started"
- "Make sure to hit that bell"
- "That's it for today"
- "Thanks for watching"

### Corporate Speak (wrong register for devlog)

- Furthermore, moreover, additionally, consequently, nevertheless
- "It is important to note"
- "As previously mentioned"
- "In conclusion"
- "Moving forward"
- "With that being said"
- "Having said that"
- "That said" (borderline -- usually cuttable)
- "Respective" / "respectively"
- "Various" (vague -- name them)

### Promotional Language (sounds like marketing)

- "Excited to share"
- "Thrilled to announce"
- "Proud to present"
- "I'm happy to report"
- "Stay tuned for"
- "You don't want to miss"

### Copula Avoidance (AI writes around "is/are")

AI avoids simple "is/are" and uses fancy alternatives. Use the simple form:

| AI Writes | Just Write |
|-----------|-----------|
| "serves as" | "is" |
| "stands as" | "is" |
| "represents" | "is" |
| "constitutes" | "is" |
| "functions as" | "is" |
| "acts as" | "is" (unless literally acting) |
| "proves to be" | "is" |

## Structural Rules

8 rules merged from stop-slop and anti-slop-writing, filtered for script relevance:

### 1. Cut filler phrases
Every word must earn its place. If you can remove a phrase without losing meaning, remove it.

### 2. Break formulaic structures
Avoid patterns that signal AI:
- **Binary contrasts:** "Not just X, it's Y" / "More than X, it's Y"
- **Rule of three:** "X, Y, and Z" lists (one or two is fine, three in a row is AI cadence)
- **Negative listing:** "It's not about X. It's about Y."
- **Dramatic fragmentation:** "And then. It happened." (unless genuinely Pavlo's natural pause)
- **Rhetorical setup:** "What if I told you..." / "Here's why that matters..."

### 3. Use active voice
"I broke the physics" not "The physics were broken by my changes."
Exception: passive is fine when the agent is genuinely unknown or irrelevant.

### 4. Be specific
Numbers, names, timeframes. "I rewrote collision detection 3 times" not "I spent a long time on physics."
- Name the tools: "Unreal's fracture tool" not "the tool I used"
- Name the games: "like in The Last of Us" not "like in other games"
- Count the iterations: "47 attempts" not "many tries"

### 5. Put viewer in the room
Describe what is happening, not what happened in summary.
- GOOD: "Troll grabs the bandit. Throws. Bandit spins off-screen."
- BAD: "I implemented a throw mechanic that allows the player to grab and throw enemies."

### 6. Vary rhythm
Mix sentence lengths. Short. Then a medium one with a detail. Then short again. Never let three consecutive sentences have similar word counts.

### 7. Trust viewer intelligence
Don't explain the joke. Don't summarize what the viewer just watched. Don't tell the viewer how to feel. Let the visuals carry the meaning.

### 8. Cut quotables
Remove any phrase that sounds "crafted" or "tweetable." Devlog scripts should sound improvised, not written. If a line sounds like it belongs on a motivational poster, rewrite it.

## Detection Patterns

Top AI writing patterns from humanizer's 24-category taxonomy, filtered for script relevance:

### Significance Inflation
AI makes everything sound important. Watch for: "crucial", "vital", "essential", "key", "fundamental", "groundbreaking", "revolutionary." In a devlog, most things are just... things you did this week.

### Promotional Language
AI writes like a press release. Watch for: announcing features instead of telling stories, using superlatives, treating development updates like product launches.

### Synonym Cycling
AI avoids repeating words by cycling through synonyms ("the mechanic", "the feature", "the system", "the implementation"). Pavlo would just say "it" or "the throw" repeatedly -- repetition is natural in speech.

### Sycophantic Tone
AI compliments the user and their work. A devlog script should not praise Pavlo's own game excessively. Self-deprecation is on-brand; self-congratulation is not.

### Generic Conclusions
AI wraps up with grand statements. "Game development is a journey of discovery and perseverance." Cut these. End with a tease or a surprise, not a lesson.

### Filler Phrases
AI pads content with phrases that add zero information. "It's worth noting that" = cut. "Interestingly enough" = cut. "As it turns out" = only if Pavlo would naturally say "turns out..."

### False Ranges
AI creates fake spectrum phrases: "from X to Y", "whether X or Y", "both X and Y." Unless the range is real and specific, cut it.

## Quick Checks (Before Finalizing)

Run these checks on every script:

1. **Read it aloud.** Does it sound like a person talking? Or like text being read?
2. **The cringe test.** Would Pavlo cringe reading any line? If yes, rewrite.
3. **The "any channel" test.** Could this script be from ANY gamedev channel? If yes, it needs more Pavlo personality.
4. **Word count.** Are sentences averaging under 15 words?
5. **Banned word scan.** Ctrl+F every banned phrase above. Zero tolerance.
6. **Filler scan.** Can any phrase be cut without losing meaning? If yes, cut it.
7. **Specificity scan.** Are there at least 3 specific details (numbers, tool names, game references)?
