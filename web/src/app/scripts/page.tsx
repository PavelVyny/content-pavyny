import {
  getScriptsWithMetrics,
  getLastSyncTime,
} from "@/app/actions/metrics";
import { ScriptsTable } from "@/components/scripts-table";
import { SyncButton } from "@/components/sync-button";

export default async function ScriptsPage() {
  const scripts = await getScriptsWithMetrics();
  const lastSyncedAt = await getLastSyncTime();

  return (
    <div className="space-y-8">
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
    </div>
  );
}
