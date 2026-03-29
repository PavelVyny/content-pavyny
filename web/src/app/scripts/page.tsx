import {
  getScriptsWithMetrics,
  getLastSyncTime,
  getAllVideosWithMetrics,
} from "@/app/actions/metrics";
import { ScriptsTable } from "@/components/scripts-table";
import { SyncButton } from "@/components/sync-button";
import { VideoGrid } from "@/components/video-grid";

export default async function ScriptsPage() {
  const scripts = await getScriptsWithMetrics();
  const lastSyncedAt = await getLastSyncTime();
  const allVideos = await getAllVideosWithMetrics();

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-semibold text-zinc-900 mb-1">Scripts</h2>
          <p className="text-sm text-muted-foreground">
            Browse and manage your scripts.
          </p>
        </div>
        <SyncButton
          lastSyncedAt={lastSyncedAt ? lastSyncedAt.toISOString() : null}
        />
      </div>

      <ScriptsTable scripts={scripts} />

      <div>
        <h2 className="text-xl font-semibold text-zinc-900 mb-1">Videos</h2>
        <p className="text-sm text-muted-foreground mb-4">
          All YouTube videos from your channel.
        </p>
        <VideoGrid videos={allVideos} />
      </div>
    </div>
  );
}
