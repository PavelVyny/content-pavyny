"use server";

import { getDb } from "@/lib/db";
import { beats, scripts } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function updateBeat(
  beatId: number,
  field: "visual" | "voiceover",
  value: string
): Promise<{ success: boolean }> {
  const db = getDb();
  db.update(beats)
    .set({ [field]: value })
    .where(eq(beats.id, beatId))
    .run();
  return { success: true };
}

export async function updateHook(
  scriptId: number,
  variant: string,
  field: "visual" | "voiceover",
  value: string
): Promise<{ success: boolean }> {
  const db = getDb();
  const script = db
    .select()
    .from(scripts)
    .where(eq(scripts.id, scriptId))
    .get();
  if (!script || !script.hooks) return { success: false };

  const hooks = script.hooks as {
    variant: string;
    visual: string;
    voiceover: string;
  }[];
  const hookIndex = hooks.findIndex((h) => h.variant === variant);
  if (hookIndex === -1) return { success: false };

  hooks[hookIndex] = { ...hooks[hookIndex], [field]: value };
  db.update(scripts)
    .set({ hooks, updatedAt: new Date() })
    .where(eq(scripts.id, scriptId))
    .run();
  return { success: true };
}

export async function selectHook(
  scriptId: number,
  variant: string
): Promise<{ success: boolean }> {
  const db = getDb();
  db.update(scripts)
    .set({ selectedHook: variant, updatedAt: new Date() })
    .where(eq(scripts.id, scriptId))
    .run();
  return { success: true };
}
