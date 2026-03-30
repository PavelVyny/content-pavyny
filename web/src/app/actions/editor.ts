"use server";

import { getDb } from "@/lib/db";
import { beats, scripts } from "@/lib/db/schema";
import { eq, asc } from "drizzle-orm";
import { regenerateBeatText, regenerateHookText, rescoreScriptText } from "@/lib/agent";
import type { AntiSlopScore, HookVariant } from "@/lib/types";

export async function updateBeat(
  beatId: number,
  field: "visual" | "voiceover",
  value: string
): Promise<{ success: boolean }> {
  const db = getDb();
  await db
    .update(beats)
    .set({ [field]: value })
    .where(eq(beats.id, beatId));
  return { success: true };
}

export async function updateHook(
  scriptId: number,
  variant: string,
  field: "visual" | "voiceover",
  value: string
): Promise<{ success: boolean }> {
  const db = getDb();
  const [script] = await db
    .select()
    .from(scripts)
    .where(eq(scripts.id, scriptId));
  if (!script || !script.hooks) return { success: false };

  const hooks = script.hooks as {
    variant: string;
    visual: string;
    voiceover: string;
  }[];
  const hookIndex = hooks.findIndex((h) => h.variant === variant);
  if (hookIndex === -1) return { success: false };

  hooks[hookIndex] = { ...hooks[hookIndex], [field]: value };
  await db
    .update(scripts)
    .set({ hooks, updatedAt: new Date() })
    .where(eq(scripts.id, scriptId));
  return { success: true };
}

export async function selectHook(
  scriptId: number,
  variant: string
): Promise<{ success: boolean }> {
  const db = getDb();
  await db
    .update(scripts)
    .set({ selectedHook: variant, updatedAt: new Date() })
    .where(eq(scripts.id, scriptId));
  return { success: true };
}

export async function selectTitle(
  scriptId: number,
  title: string
): Promise<{ success: boolean }> {
  const db = getDb();
  await db
    .update(scripts)
    .set({ title, updatedAt: new Date() })
    .where(eq(scripts.id, scriptId));
  return { success: true };
}

export async function regenerateHook(
  scriptId: number,
  variant: string
): Promise<{ success: boolean; visual?: string; voiceover?: string; error?: string }> {
  const db = getDb();
  const [script] = await db.select().from(scripts).where(eq(scripts.id, scriptId));
  if (!script) return { success: false, error: "Script not found" };

  const scriptBeats = await db.select().from(beats).where(eq(beats.scriptId, scriptId)).orderBy(asc(beats.order));
  const hooks = (script.hooks as HookVariant[] | null) ?? [];

  try {
    const result = await regenerateHookText(
      script.format,
      script.devContext ?? "",
      scriptBeats.map((b) => ({ order: b.order, visual: b.visual, voiceover: b.voiceover })),
      hooks.map((h) => ({ variant: h.variant, visual: h.visual, voiceover: h.voiceover })),
      variant
    );

    const updatedHooks = hooks.map((h) =>
      h.variant === variant ? { ...h, visual: result.visual, voiceover: result.voiceover } : h
    );

    await db
      .update(scripts)
      .set({ hooks: updatedHooks as never, updatedAt: new Date() })
      .where(eq(scripts.id, scriptId));

    return { success: true, visual: result.visual, voiceover: result.voiceover };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Hook regeneration failed" };
  }
}

export async function regenerateBeat(
  beatId: number,
  scriptId: number
): Promise<{ success: boolean; visual?: string; voiceover?: string; error?: string }> {
  try {
    const db = getDb();

    const [script] = await db
      .select()
      .from(scripts)
      .where(eq(scripts.id, scriptId));
    if (!script) return { success: false, error: "Script not found" };

    const allBeats = await db
      .select()
      .from(beats)
      .where(eq(beats.scriptId, scriptId))
      .orderBy(asc(beats.order));

    const targetBeat = allBeats.find((b) => b.id === beatId);
    if (!targetBeat) return { success: false, error: "Beat not found" };

    const hooks = (script.hooks as { variant: string; visual: string; voiceover: string }[]) || [];

    const result = await regenerateBeatText(
      script.format,
      script.devContext || "",
      allBeats.map((b) => ({ order: b.order, visual: b.visual, voiceover: b.voiceover })),
      hooks,
      targetBeat.order
    );

    await db
      .update(beats)
      .set({ visual: result.visual, voiceover: result.voiceover })
      .where(eq(beats.id, beatId));

    return { success: true, visual: result.visual, voiceover: result.voiceover };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[regenerateBeat]", message);
    return { success: false, error: message };
  }
}

export async function rescoreScript(
  scriptId: number
): Promise<{ success: boolean; score?: AntiSlopScore; error?: string }> {
  try {
    const db = getDb();

    const [script] = await db
      .select()
      .from(scripts)
      .where(eq(scripts.id, scriptId));
    if (!script) return { success: false, error: "Script not found" };

    const allBeats = await db
      .select()
      .from(beats)
      .where(eq(beats.scriptId, scriptId))
      .orderBy(asc(beats.order));

    const hooks = (script.hooks as { variant: string; visual: string; voiceover: string }[]) || [];

    const score = await rescoreScriptText(
      allBeats.map((b) => ({ visual: b.visual, voiceover: b.voiceover })),
      hooks,
      script.selectedHook || "A"
    );

    await db
      .update(scripts)
      .set({ antiSlopScore: score, updatedAt: new Date() })
      .where(eq(scripts.id, scriptId));

    return { success: true, score };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[rescoreScript]", message);
    return { success: false, error: message };
  }
}
