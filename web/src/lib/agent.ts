import { query } from "@anthropic-ai/claude-agent-sdk";
import { z } from "zod";
import path from "path";

// Schema for structured output from the devlog-scriptwriter skill
export const ScriptOutputSchema = z.object({
  hooks: z.array(
    z.object({
      variant: z.string(), // "A", "B", "C"
      visual: z.string(),
      voiceover: z.string(),
    })
  ),
  beats: z.array(
    z.object({
      visual: z.string(),
      voiceover: z.string(),
      duration: z.string().optional(), // "2-3s"
    })
  ),
  titles: z.array(z.string()),
  thumbnail: z.string(),
  duration_estimate: z.string(),
  anti_slop_score: z.object({
    directness: z.number(),
    rhythm: z.number(),
    trust: z.number(),
    authenticity: z.number(),
    density: z.number(),
    total: z.number(),
    notes: z.string(),
  }),
});

export type ScriptOutput = z.infer<typeof ScriptOutputSchema>;

// Project root where .claude/skills/ lives (up from web/ to content-pavyny/)
const PROJECT_ROOT = path.resolve(process.cwd(), "..");

/**
 * Generate a devlog script using the Claude Agent SDK.
 * Spawns Claude Code as subprocess with devlog-scriptwriter skill access.
 * Returns structured JSON output matching ScriptOutputSchema.
 *
 * Auth: Uses Max subscription via system keychain (do NOT set ANTHROPIC_API_KEY).
 */
export async function generateScript(
  format: string,
  devContext: string
): Promise<ScriptOutput> {
  const prompt = `Generate a devlog script using the "${format}" format.\n\nDev context: ${devContext}`;

  for await (const message of query({
    prompt,
    options: {
      cwd: PROJECT_ROOT,
      // MANDATORY: loads CLAUDE.md and skills from project directory
      settingSources: ["project"],
      // Use Claude Code's system prompt which knows how to load skills
      systemPrompt: {
        type: "preset",
        preset: "claude_code",
        append:
          "Use the devlog-scriptwriter skill in Script Generation mode.",
      },
      // Auto-approve reading reference files
      allowedTools: ["Read"],
      // Prevent file modifications during generation
      disallowedTools: ["Write", "Edit", "Bash"],
      // Get structured JSON output matching the schema
      outputFormat: {
        type: "json_schema",
        schema: z.toJSONSchema(ScriptOutputSchema) as Record<
          string,
          unknown
        >,
      },
      // Bound response time
      maxTurns: 5,
      // Deny anything not in allowedTools
      permissionMode: "dontAsk",
    },
  })) {
    if (message.type === "result") {
      if (message.subtype === "success") {
        // Log cost and turns for monitoring
        console.log(
          `[agent] Generation complete: ${message.num_turns} turns, $${message.total_cost_usd.toFixed(4)}`
        );

        if (message.structured_output) {
          const parsed = ScriptOutputSchema.safeParse(
            message.structured_output
          );
          if (parsed.success) {
            return parsed.data;
          }
          throw new Error(
            `Structured output validation failed: ${parsed.error.message}`
          );
        }
        throw new Error(
          "Generation succeeded but no structured output received"
        );
      }

      // Error result
      const errorResult = message as { subtype: string; errors?: string[] };
      const errorDetails = errorResult.errors?.join(", ") ?? "unknown error";
      throw new Error(
        `Generation failed (${errorResult.subtype}): ${errorDetails}`
      );
    }
  }

  throw new Error("No result message received from Agent SDK");
}
