import {
  getScriptsWithMetrics,
  getLastSyncTime,
  getAllVideosWithMetrics,
} from "@/app/actions/metrics";
import { ScriptsTable } from "@/components/scripts-table";
import { SyncButton } from "@/components/sync-button";
import { VideoGrid } from "@/components/video-grid";
import { getQuickConnectionStatus } from "@/lib/youtube-client";

export default async function ScriptsPage() {
  const [scripts, lastSyncedAt, allVideos, ytStatus] = await Promise.all([
    getScriptsWithMetrics(),
    getLastSyncTime(),
    getAllVideosWithMetrics(),
    getQuickConnectionStatus(),
  ]);

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
          connected={ytStatus === "connected"}
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
