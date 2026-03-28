import { getDb } from "@/lib/db";
import { scripts, beats } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ScriptEditor } from "@/components/script-editor";

export default async function ScriptPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const scriptId = parseInt(id, 10);

  if (isNaN(scriptId)) {
    notFound();
  }

  const db = getDb();
  const script = db
    .select()
    .from(scripts)
    .where(eq(scripts.id, scriptId))
    .get();

  if (!script) {
    notFound();
  }

  const scriptBeats = db
    .select()
    .from(beats)
    .where(eq(beats.scriptId, scriptId))
    .orderBy(beats.order)
    .all();

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <Link
        href="/"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
      >
        &larr; Back
      </Link>
      <h1 className="text-xl font-semibold mb-6">{script.title}</h1>
      <ScriptEditor script={{ ...script, beats: scriptBeats }} />
    </main>
  );
}
