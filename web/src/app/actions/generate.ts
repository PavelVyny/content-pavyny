"use server";

import { generateScript } from "@/lib/agent";
import { getDb } from "@/lib/db";
import { scripts, beats } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

type GenerateResult =
  | { success: true; scriptId: number }
  | { error: string };

/**
 * Delete a script and its beats.
 */
export async function deleteScript(scriptId: number): Promise<void> {
  const db = getDb();
  await db.delete(beats).where(eq(beats.scriptId, scriptId));
  await db.delete(scripts).where(eq(scripts.id, scriptId));
  revalidatePath("/");
}

/**
 * Generate a new script from format and dev context.
 * Creates a placeholder row with status "generating", calls Agent SDK,
 * then updates with generated data or marks as failed.
 */
export async function generateNewScript(
  formData: FormData
): Promise<GenerateResult> {
  const format = formData.get("format") as string | null;
  const devContext = formData.get("devContext") as string | null;

  if (!format || !devContext) {
    return { error: "Format and dev context are required" };
  }

  if (devContext.length < 10) {
    return {
      error: "Dev context must be at least 10 characters",
    };
  }

  const db = getDb();

  // Insert placeholder so the UI can show "generating" state
  const [script] = await db
    .insert(scripts)
    .values({
      title: "Generating...",
      format,
      status: "generating" as const,
      devContext,
    })
    .returning();

  try {
    const output = await generateScript(format, devContext);

    // Update script with generated data
    await db
      .update(scripts)
      .set({
        title: output.titles[0] ?? "Untitled Script",
        hooks: output.hooks,
        titles: output.titles,
        thumbnail: output.thumbnail,
        durationEstimate: output.duration_estimate,
        antiSlopScore: output.anti_slop_score,
        status: "draft" as const,
        updatedAt: new Date(),
      })
      .where(eq(scripts.id, script.id));

    // Insert beats as separate rows
    const beatValues = output.beats.map((beat, index) => ({
      scriptId: script.id,
      order: index + 1,
      visual: beat.visual,
      voiceover: beat.voiceover,
      duration: beat.duration ?? null,
    }));

    if (beatValues.length > 0) {
      await db.insert(beats).values(beatValues);
    }

    revalidatePath("/");
    return { success: true, scriptId: script.id };
  } catch (error) {
    // Update placeholder to reflect failure
    await db
      .update(scripts)
      .set({
        title: "Generation failed",
        status: "draft" as const,
        updatedAt: new Date(),
      })
      .where(eq(scripts.id, script.id));

    return {
      error:
        error instanceof Error ? error.message : "Generation failed",
    };
  }
}

/**
 * Re-generate a script with the same or modified input.
 * Deletes existing beats, re-runs generation, saves new results.
 * Supports GENR-03: re-generate with same or modified input.
 */
export async function regenerateScript(
  scriptId: number,
  format: string,
  devContext: string
): Promise<GenerateResult> {
  if (!format || !devContext) {
    return { error: "Format and dev context are required" };
  }

  if (devContext.length < 10) {
    return {
      error: "Dev context must be at least 10 characters",
    };
  }

  const db = getDb();

  // Delete existing beats for this script
  await db.delete(beats).where(eq(beats.scriptId, scriptId));

  // Set status to generating
  await db
    .update(scripts)
    .set({
      status: "generating" as const,
      updatedAt: new Date(),
    })
    .where(eq(scripts.id, scriptId));

  try {
    const output = await generateScript(format, devContext);

    // Update script with new generated data
    await db
      .update(scripts)
      .set({
        title: output.titles[0] ?? "Untitled Script",
        hooks: output.hooks,
        titles: output.titles,
        thumbnail: output.thumbnail,
        durationEstimate: output.duration_estimate,
        antiSlopScore: output.anti_slop_score,
        status: "draft" as const,
        devContext,
        format,
        updatedAt: new Date(),
      })
      .where(eq(scripts.id, scriptId));

    // Insert new beats
    const beatValues = output.beats.map((beat, index) => ({
      scriptId,
      order: index + 1,
      visual: beat.visual,
      voiceover: beat.voiceover,
      duration: beat.duration ?? null,
    }));

    if (beatValues.length > 0) {
      await db.insert(beats).values(beatValues);
    }

    revalidatePath("/");
    return { success: true, scriptId };
  } catch (error) {
    // Revert status on failure
    await db
      .update(scripts)
      .set({
        title: "Generation failed",
        status: "draft" as const,
        updatedAt: new Date(),
      })
      .where(eq(scripts.id, scriptId));

    return {
      error:
        error instanceof Error ? error.message : "Re-generation failed",
    };
  }
}
