import { getDb } from "@/lib/db";
import { scripts, beats } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ScriptEditor } from "@/components/script-editor";
import { getVideoForScript, getUnlinkedVideos } from "@/app/actions/metrics";
import { VideoLinkSelector } from "@/components/video-link-selector";
import { EditorMetricsPanel } from "@/components/editor-metrics-panel";
import { DeleteScriptButton } from "@/components/delete-script-button";

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

  const videoData = await getVideoForScript(scriptId);
  const unlinkedVideos = await getUnlinkedVideos();

  // Serialize Date objects for client components
  const serializedLinkedVideo = videoData
    ? {
        ...videoData.video,
        publishedAt: videoData.video.publishedAt
          ? videoData.video.publishedAt.toISOString()
          : null,
      }
    : null;

  const serializedUnlinkedVideos = unlinkedVideos.map((v) => ({
    ...v,
    publishedAt: v.publishedAt ? v.publishedAt.toISOString() : null,
  }));

  const serializedMetrics = videoData
    ? {
        ...videoData.metrics,
        lastSyncedAt: videoData.metrics.lastSyncedAt.toISOString(),
      }
    : null;

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <div className="flex items-center justify-between mb-3">
        <Link
          href="/scripts"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          &larr; Back
        </Link>
        <DeleteScriptButton scriptId={scriptId} />
      </div>
      {videoData && serializedMetrics && (
        <div className="mb-4">
          <EditorMetricsPanel
            metrics={serializedMetrics as any}
            videoTitle={videoData.video.title}
          />
        </div>
      )}
      <ScriptEditor
        script={{ ...script, beats: scriptBeats }}
        videoLinkSlot={
          <VideoLinkSelector
            scriptId={scriptId}
            linkedVideo={serializedLinkedVideo as any}
            unlinkedVideos={serializedUnlinkedVideos as any}
          />
        }
      />
    </main>
  );
}
