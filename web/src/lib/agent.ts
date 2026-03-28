import { query } from "@anthropic-ai/claude-agent-sdk";
import path from "path";
import fs from "fs";

// Types for script output
export interface HookVariant {
  variant: string;
  visual: string;
  voiceover: string;
}

export interface ScriptBeat {
  visual: string;
  voiceover: string;
  duration?: string;
}

export interface AntiSlopScore {
  directness: number;
  rhythm: number;
  trust: number;
  authenticity: number;
  density: number;
  total: number;
  notes: string;
}

export interface ScriptOutput {
  hooks: HookVariant[];
  beats: ScriptBeat[];
  titles: string[];
  thumbnail: string;
  duration_estimate: string;
  anti_slop_score: AntiSlopScore;
}

// Project root where .claude/skills/ lives (up from web/ to content-pavyny/)
const PROJECT_ROOT = path.resolve(process.cwd(), "..");
const REFS_DIR = path.resolve(PROJECT_ROOT, ".claude/skills/devlog-scriptwriter/references");

function loadRef(filename: string): string {
  try {
    return fs.readFileSync(path.join(REFS_DIR, filename), "utf-8");
  } catch {
    return "";
  }
}

function extractFormatSection(videoFormats: string, format: string): string {
  for (const header of [
    `## The ${format.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")}`,
    `## ${format.split("-").map(w => w === "after" ? "After" : w.charAt(0).toUpperCase() + w.slice(1)).join("/")}`,
  ]) {
    const idx = videoFormats.indexOf(header);
    if (idx >= 0) {
      const nextSection = videoFormats.indexOf("\n## ", idx + 1);
      return videoFormats.slice(idx, nextSection > 0 ? nextSection : undefined);
    }
  }
  return `Format: ${format}`;
}

/**
 * Generate a devlog script using the Claude Agent SDK.
 *
 * The prompt replicates the FULL logic of SKILL.md Script Generation mode:
 * - Hook structure (pre-hook visual → opening line → deliver)
 * - Script body rules (sentence length, signature phrases, contractions, transitions)
 * - Script ending rules (forward momentum, no "thanks for watching")
 * - Anti-slop scoring with rewrite loop (if < 35, rewrite and rescore)
 * - One-idea enforcement (flag and trim if multiple topics)
 * - Voice checklist (9-point final pass)
 * - All reference files injected in full
 *
 * Output: pure JSON matching ScriptOutput interface.
 */
export async function generateScript(
  format: string,
  devContext: string
): Promise<ScriptOutput> {
  const brandVoice = loadRef("brand-voice.md");
  const antiSlop = loadRef("anti-slop-rules.md");
  const videoFormats = loadRef("video-formats.md");
  const formatSection = extractFormatSection(videoFormats, format);

  const prompt = `You are the devlog-scriptwriter for Pavlo's YouTube Shorts game devlog. Generate a script following ALL rules below.

=== FORMAT TEMPLATE ===
${formatSection}

=== DEV CONTEXT (what Pavlo worked on) ===
${devContext}

=== BRAND VOICE PROFILE ===
${brandVoice}

=== ANTI-SLOP RULES ===
${antiSlop}

=== SCRIPT GENERATION PROCESS ===

Follow these steps IN ORDER:

STEP 1 — GENERATE HOOK (First 3 Seconds)
Every script MUST open with:
1. Pre-hook visual (0-1s): The most satisfying/funny/broken visual moment (can be from later in the video, reversed or slowed)
2. Opening line (1-3s): A statement or question that creates curiosity. NOT "In this video" or "Hey guys"
3. Deliver (3s+): The story begins
Generate exactly 3 hook variants (A, B, C). Each variant has BOTH a visual description AND a voiceover line.

STEP 2 — GENERATE SCRIPT BEATS
Follow the format template's beat structure. For each beat provide:
- visual: concrete description of what appears on screen ("troll grabs enemy by head" NOT "gameplay footage")
- voiceover: what Pavlo says over this visual

Script body rules:
- Follow Pavlo's sentence rules (max ~15 words per sentence, fragments OK, no subordinate clauses)
- Use signature phrases naturally: "so I...", "turns out...", "let's...", "okay..."
- Technical terms get immediate simple explanation (or the visual explains it)
- Voiceover comments on what viewer SEES — never describes what is not on screen
- Contractions ALWAYS ("I'm" not "I am", "don't" not "do not")
- Start sentences with "And," "But," "So" freely
- No formal transitions ("however", "furthermore", "additionally")

Script ending:
- End with forward momentum — tease what comes next, ask a question, or land a surprise visual
- NEVER: "Thanks for watching", "Don't forget to like and subscribe", formal summary

STEP 3 — GENERATE TITLES AND THUMBNAIL
- 3 title options (short, personality-driven — never "Episode N")
- 1 thumbnail frame concept (which moment makes the best thumbnail)
- Duration estimate (target 30-47 seconds)

STEP 4 — ANTI-SLOP SCORING
Score the script on 5 dimensions (1-10 each):
- Directness: "Is this a statement or an announcement?" Point-first, no filler lead-ins.
- Rhythm: "Read aloud — does it sound like a person or a metronome?" Punchy mix of lengths.
- Trust: "Am I explaining or showing?" Respect viewer intelligence.
- Authenticity: "Would Pavlo say this out loud without cringing?" Specific, self-deprecating, honest.
- Density: "Can I cut any word without losing meaning?" Every word earns its place.
Minimum threshold: 35/50.
If score < 35: identify weak dimensions, REWRITE those sections using brand voice, re-score. Repeat until 35+.

STEP 5 — ONE-IDEA ENFORCEMENT
Check: does this script contain more than one distinct topic or idea?
If yes: trim to ONE idea. The second idea becomes a suggestion for another video.

STEP 6 — VOICE CHECKLIST (Final Pass)
Verify ALL of these are true:
- Opens with a story/situation, not an announcement
- Sentences under 15 words on average
- At least one Pavlo signature phrase used naturally
- Specific detail present (number, tool name, game reference)
- Voiceover describes what IS on screen
- Would Pavlo say this out loud without cringing
- Ends with forward momentum
- Zero banned words from NEVER USE list
- Could a viewer tell this is Pavlo and not any other gamedev channel

=== OUTPUT FORMAT ===

Respond with ONLY a valid JSON object. No markdown, no explanation, no wrapping.

{
  "hooks": [
    { "variant": "A", "visual": "pre-hook visual description (0-1s)", "voiceover": "opening line (1-3s)" },
    { "variant": "B", "visual": "...", "voiceover": "..." },
    { "variant": "C", "visual": "...", "voiceover": "..." }
  ],
  "beats": [
    { "visual": "what viewer sees on screen", "voiceover": "what Pavlo says" },
    { "visual": "...", "voiceover": "..." }
  ],
  "titles": ["Title 1", "Title 2", "Title 3"],
  "thumbnail": "description of thumbnail frame",
  "duration_estimate": "30-45 seconds",
  "anti_slop_score": {
    "directness": 8,
    "rhythm": 8,
    "trust": 7,
    "authenticity": 9,
    "density": 8,
    "total": 40,
    "notes": "scoring notes for each dimension"
  }
}

Requirements:
- hooks: exactly 3 variants with both visual AND voiceover filled
- beats: 3-7 beats matching the format template structure, each with concrete visual AND voiceover
- titles: exactly 3, short and personality-driven
- anti_slop_score: all dimensions scored 1-10, total 35+/50, notes explaining the scores
- ALL text must pass the voice checklist and anti-slop rules
- Output ONLY the JSON object`;

  for await (const message of query({
    prompt,
    options: {
      cwd: PROJECT_ROOT,
      settingSources: ["project"],
      maxTurns: 3,
      permissionMode: "dontAsk",
      allowedTools: [],
      disallowedTools: ["Read", "Write", "Edit", "Bash", "Glob", "Grep"],
    },
  })) {
    if (message.type === "result") {
      if (message.subtype === "success") {
        const resultText = (message as Record<string, unknown>).result as string | undefined;
        console.log(
          `[agent] Generation complete: ${message.num_turns} turns, $${message.total_cost_usd.toFixed(4)}`
        );

        if (!resultText) {
          throw new Error("Generation succeeded but empty result");
        }

        // Extract JSON — handle possible markdown wrapping
        let jsonStr = resultText.trim();
        const codeBlockMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
        if (codeBlockMatch) {
          jsonStr = codeBlockMatch[1].trim();
        }
        const firstBrace = jsonStr.indexOf("{");
        const lastBrace = jsonStr.lastIndexOf("}");
        if (firstBrace >= 0 && lastBrace > firstBrace) {
          jsonStr = jsonStr.slice(firstBrace, lastBrace + 1);
        }

        try {
          const parsed = JSON.parse(jsonStr) as ScriptOutput;

          if (!parsed.hooks || !parsed.beats || !parsed.titles) {
            throw new Error("Missing required fields in output");
          }

          if (parsed.anti_slop_score) {
            const s = parsed.anti_slop_score;
            if (!s.total) {
              s.total = (s.directness || 0) + (s.rhythm || 0) + (s.trust || 0) +
                        (s.authenticity || 0) + (s.density || 0);
            }
          }

          console.log(
            `[agent] Parsed: ${parsed.hooks.length} hooks, ${parsed.beats.length} beats, ${parsed.titles.length} titles, score ${parsed.anti_slop_score?.total}/50`
          );
          return parsed;
        } catch (parseErr) {
          console.error("[agent] JSON parse failed. Raw (first 1000):", jsonStr.slice(0, 1000));
          throw new Error(
            `Failed to parse JSON: ${parseErr instanceof Error ? parseErr.message : "unknown"}`
          );
        }
      }

      const errorResult = message as { subtype: string; errors?: string[] };
      throw new Error(
        `Generation failed (${errorResult.subtype}): ${errorResult.errors?.join(", ") ?? "unknown"}`
      );
    }
  }

  throw new Error("No result message received from Agent SDK");
}

/**
 * Helper to run a query and extract JSON from the result.
 * Reuses the same JSON extraction logic as generateScript.
 */
async function queryForJson<T>(prompt: string): Promise<T> {
  for await (const message of query({
    prompt,
    options: {
      cwd: PROJECT_ROOT,
      settingSources: ["project"],
      maxTurns: 3,
      permissionMode: "dontAsk",
      allowedTools: [],
      disallowedTools: ["Read", "Write", "Edit", "Bash", "Glob", "Grep"],
    },
  })) {
    if (message.type === "result") {
      if (message.subtype === "success") {
        const resultText = (message as Record<string, unknown>).result as string | undefined;
        console.log(
          `[agent] Query complete: ${message.num_turns} turns, $${message.total_cost_usd.toFixed(4)}`
        );

        if (!resultText) {
          throw new Error("Query succeeded but empty result");
        }

        let jsonStr = resultText.trim();
        const codeBlockMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
        if (codeBlockMatch) {
          jsonStr = codeBlockMatch[1].trim();
        }
        const firstBrace = jsonStr.indexOf("{");
        const lastBrace = jsonStr.lastIndexOf("}");
        if (firstBrace >= 0 && lastBrace > firstBrace) {
          jsonStr = jsonStr.slice(firstBrace, lastBrace + 1);
        }

        try {
          return JSON.parse(jsonStr) as T;
        } catch (parseErr) {
          console.error("[agent] JSON parse failed. Raw (first 1000):", jsonStr.slice(0, 1000));
          throw new Error(
            `Failed to parse JSON: ${parseErr instanceof Error ? parseErr.message : "unknown"}`
          );
        }
      }

      const errorResult = message as { subtype: string; errors?: string[] };
      throw new Error(
        `Query failed (${errorResult.subtype}): ${errorResult.errors?.join(", ") ?? "unknown"}`
      );
    }
  }

  throw new Error("No result message received from Agent SDK");
}

/**
 * Regenerate a single beat's text using full script context.
 * Returns new visual + voiceover for the target beat only.
 */
export async function regenerateBeatText(
  format: string,
  devContext: string,
  allBeats: { order: number; visual: string; voiceover: string }[],
  hooks: { variant: string; visual: string; voiceover: string }[],
  targetBeatOrder: number
): Promise<{ visual: string; voiceover: string }> {
  const brandVoice = loadRef("brand-voice.md");
  const antiSlop = loadRef("anti-slop-rules.md");

  const beatsContext = allBeats
    .map((b) => `Beat #${b.order}:\n  Visual: ${b.visual}\n  Voiceover: ${b.voiceover}`)
    .join("\n\n");

  const hooksContext = hooks
    .map((h) => `Hook ${h.variant}:\n  Visual: ${h.visual}\n  Voiceover: ${h.voiceover}`)
    .join("\n\n");

  const prompt = `You are the devlog-scriptwriter for Pavlo's YouTube Shorts game devlog.

Your task: regenerate ONLY beat #${targetBeatOrder} with a fresh angle and phrasing. Keep the same topic/moment but find a different way to describe the visual and write the voiceover.

=== FORMAT ===
${format}

=== DEV CONTEXT ===
${devContext}

=== HOOK VARIANTS ===
${hooksContext}

=== ALL SCRIPT BEATS (for context) ===
${beatsContext}

=== BRAND VOICE PROFILE ===
${brandVoice}

=== ANTI-SLOP RULES ===
${antiSlop}

=== INSTRUCTIONS ===
- Regenerate beat #${targetBeatOrder} ONLY
- Keep it consistent with surrounding beats (don't repeat what adjacent beats say)
- Follow all brand voice rules: short sentences, Pavlo's signature phrases, contractions, no banned words
- Visual must describe concrete on-screen action (not "gameplay footage")
- Voiceover comments on what viewer SEES

Respond with ONLY a JSON object: { "visual": "...", "voiceover": "..." }`;

  const result = await queryForJson<{ visual: string; voiceover: string }>(prompt);

  if (!result.visual || !result.voiceover) {
    throw new Error("Regeneration result missing visual or voiceover");
  }

  console.log(`[agent] Regenerated beat #${targetBeatOrder}`);
  return { visual: result.visual, voiceover: result.voiceover };
}

/**
 * Re-score a script's text on the 5 anti-slop dimensions.
 * Returns a full AntiSlopScore object.
 */
export async function rescoreScriptText(
  allBeats: { visual: string; voiceover: string }[],
  hooks: { variant: string; visual: string; voiceover: string }[],
  selectedHook: string
): Promise<AntiSlopScore> {
  const brandVoice = loadRef("brand-voice.md");
  const antiSlop = loadRef("anti-slop-rules.md");

  const selectedHookText = hooks.find((h) => h.variant === selectedHook);
  const scriptText = [
    selectedHookText ? selectedHookText.voiceover : "",
    ...allBeats.map((b) => b.voiceover),
  ]
    .filter(Boolean)
    .join("\n\n");

  const prompt = `You are the anti-slop scorer for Pavlo's YouTube Shorts devlog scripts.

Score this script on 5 anti-slop dimensions (1-10 each): directness, rhythm, trust, authenticity, density.

=== SCRIPT TEXT (selected hook + all beats voiceover) ===
${scriptText}

=== BRAND VOICE PROFILE ===
${brandVoice}

=== ANTI-SLOP SCORING RUBRIC ===
${antiSlop}

=== INSTRUCTIONS ===
Score each dimension 1-10:
- Directness: "Is this a statement or an announcement?" Point-first, no filler lead-ins.
- Rhythm: "Read aloud -- does it sound like a person or a metronome?" Punchy mix of lengths.
- Trust: "Am I explaining or showing?" Respect viewer intelligence.
- Authenticity: "Would Pavlo say this out loud without cringing?" Specific, self-deprecating, honest.
- Density: "Can I cut any word without losing meaning?" Every word earns its place.

Include total (sum of 5 dimensions) and notes explaining the scores.

Respond with ONLY JSON: { "directness": N, "rhythm": N, "trust": N, "authenticity": N, "density": N, "total": N, "notes": "..." }`;

  const result = await queryForJson<AntiSlopScore>(prompt);

  // Compute total if not present or incorrect
  const computed = (result.directness || 0) + (result.rhythm || 0) + (result.trust || 0) +
                   (result.authenticity || 0) + (result.density || 0);
  if (!result.total || result.total !== computed) {
    result.total = computed;
  }

  console.log(`[agent] Rescored: ${result.total}/50`);
  return result;
}
