import { getFormatList } from "@/lib/references";
import { getDb } from "@/lib/db";
import { scripts } from "@/lib/db/schema";
import { desc } from "drizzle-orm";
import { GenerationPage } from "@/components/generation-page";
import type { Script } from "@/lib/types";

export default function Home() {
  const formats = getFormatList();
  const db = getDb();

  // Check if a failed generation exists (to show error banner)
  const latestScript = db
    .select()
    .from(scripts)
    .orderBy(desc(scripts.createdAt))
    .limit(1)
    .get();

  let failedScript: (Script & { beats: never[] }) | null = null;

  if (latestScript?.title === "Generation failed") {
    failedScript = {
      ...latestScript,
      hooks: latestScript.hooks as Script["hooks"],
      titles: latestScript.titles as Script["titles"],
      antiSlopScore: latestScript.antiSlopScore as Script["antiSlopScore"],
      status: latestScript.status as Script["status"],
      createdAt: new Date(latestScript.createdAt),
      updatedAt: new Date(latestScript.updatedAt),
      beats: [],
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

      <GenerationPage formats={formats} latestScript={failedScript} />
    </div>
  );
}
