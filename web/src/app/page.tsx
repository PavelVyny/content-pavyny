import { getFormatList } from "@/lib/references";
import { getDb } from "@/lib/db";
import { scripts, beats } from "@/lib/db/schema";
import { desc, eq } from "drizzle-orm";
import { GenerationPage } from "@/components/generation-page";
import type { Script, ScriptBeat } from "@/lib/types";

export default function Home() {
  const formats = getFormatList();
  const db = getDb();

  // Load the most recent script (if any) with its beats
  const latestScript = db
    .select()
    .from(scripts)
    .orderBy(desc(scripts.createdAt))
    .limit(1)
    .get();

  let scriptWithBeats: (Script & { beats: ScriptBeat[] }) | null = null;

  if (latestScript && latestScript.status !== "generating") {
    const scriptBeats = db
      .select()
      .from(beats)
      .where(eq(beats.scriptId, latestScript.id))
      .orderBy(beats.order)
      .all();

    scriptWithBeats = {
      ...latestScript,
      hooks: latestScript.hooks as Script["hooks"],
      titles: latestScript.titles as Script["titles"],
      antiSlopScore: latestScript.antiSlopScore as Script["antiSlopScore"],
      status: latestScript.status as Script["status"],
      createdAt: new Date(latestScript.createdAt),
      updatedAt: new Date(latestScript.updatedAt),
      beats: scriptBeats.map((b) => ({
        ...b,
        createdAt: undefined,
        updatedAt: undefined,
      })) as ScriptBeat[],
    };
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-semibold text-zinc-900 mb-1">
          Generate Script
        </h2>
        <p className="text-sm text-muted-foreground">
          Select a format and describe your dev progress.
        </p>
      </div>

      <GenerationPage formats={formats} latestScript={scriptWithBeats} />
    </div>
  );
}
