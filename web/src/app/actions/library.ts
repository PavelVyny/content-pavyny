"use server";

import { getDb } from "@/lib/db";
import { beats, scripts } from "@/lib/db/schema";
import { eq, asc, desc, ne } from "drizzle-orm";
import type { Script, HookVariant } from "@/lib/types";

export async function getAllScripts(): Promise<Script[]> {
  const db = getDb();
  const rows = db
    .select()
    .from(scripts)
    .where(ne(scripts.status, "generating"))
    .orderBy(desc(scripts.createdAt))
    .all();

  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    format: row.format,
    status: row.status as Script["status"],
    hooks: (row.hooks as HookVariant[] | null) ?? null,
    selectedHook: row.selectedHook,
    titles: (row.titles as string[] | null) ?? null,
    thumbnail: row.thumbnail,
    durationEstimate: row.durationEstimate,
    antiSlopScore: row.antiSlopScore ?? null,
    devContext: row.devContext,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }));
}

export async function updateScriptStatus(
  scriptId: number,
  status: "draft" | "ready" | "recorded"
): Promise<{ success: boolean }> {
  const db = getDb();
  db.update(scripts)
    .set({ status, updatedAt: new Date() })
    .where(eq(scripts.id, scriptId))
    .run();
  return { success: true };
}

export async function getVoiceoverText(
  scriptId: number
): Promise<{ success: boolean; text?: string }> {
  const db = getDb();

  const script = db
    .select()
    .from(scripts)
    .where(eq(scripts.id, scriptId))
    .get();
  if (!script) return { success: false };

  const scriptBeats = db
    .select()
    .from(beats)
    .where(eq(beats.scriptId, scriptId))
    .orderBy(asc(beats.order))
    .all();

  const parts: string[] = [];

  // Add selected hook voiceover first
  const hooks = (script.hooks as HookVariant[] | null) ?? [];
  const selected = script.selectedHook;
  if (selected && hooks.length > 0) {
    const hook = hooks.find((h) => h.variant === selected);
    if (hook?.voiceover) {
      parts.push(hook.voiceover);
    }
  }

  // Add each beat's voiceover
  for (const beat of scriptBeats) {
    if (beat.voiceover) {
      parts.push(beat.voiceover);
    }
  }

  return { success: true, text: parts.join("\n\n") };
}
