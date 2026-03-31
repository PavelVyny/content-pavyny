"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { discoverVideos, syncSingleVideo } from "@/app/actions/metrics";

interface SyncButtonProps {
  lastSyncedAt: string | null;
  connected?: boolean;
}

function getStalenessLabel(lastSyncedAt: string | null): string {
  if (!lastSyncedAt) return "Never synced";

  const diff = Date.now() - new Date(lastSyncedAt).getTime();
  const hourMs = 60 * 60 * 1000;
  const dayMs = 24 * hourMs;
  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

  if (diff < hourMs) {
    return rtf.format(-Math.round(diff / 60000), "minute");
  } else if (diff < dayMs) {
    return rtf.format(-Math.round(diff / hourMs), "hour");
  } else {
    return rtf.format(-Math.round(diff / dayMs), "day");
  }
}

export function SyncButton({ lastSyncedAt, connected = true }: SyncButtonProps) {
  const [syncing, setSyncing] = useState(false);
  const [progress, setProgress] = useState<{
    current: number;
    total: number;
  } | null>(null);
  const [result, setResult] = useState<{
    videoCount?: number;
    error?: string;
  } | null>(null);

  // Clear result messages after timeout
  useEffect(() => {
    if (!result) return;
    const timeout = result.error ? 5000 : 3000;
    const timer = setTimeout(() => setResult(null), timeout);
    return () => clearTimeout(timer);
  }, [result]);

  async function handleSync() {
    setSyncing(true);
    setProgress({ current: 0, total: 0 });
    setResult(null);

    try {
      const discovered = await discoverVideos();
      if (!discovered.success) {
        setSyncing(false);
        setProgress(null);
        setResult({ error: discovered.error ?? "Failed to discover videos" });
        return;
      }

      const total = discovered.videos.length;
      setProgress({ current: 0, total });

      for (let i = 0; i < discovered.videos.length; i++) {
        const video = discovered.videos[i];
        const syncResult = await syncSingleVideo(video.youtubeId);
        if (!syncResult.success) {
          // Continue syncing other videos even if one fails
        }
        setProgress({ current: i + 1, total });
      }

      setSyncing(false);
      setProgress(null);
      setResult({ videoCount: total });
    } catch (err: unknown) {
      setSyncing(false);
      setProgress(null);
      const message =
        err instanceof Error ? err.message : "Sync failed";
      setResult({ error: message });
    }
  }

  const stalenessLabel = getStalenessLabel(lastSyncedAt);

  let buttonText = "Sync Now";
  if (syncing && progress) {
    if (progress.total === 0) {
      buttonText = "Discovering videos...";
    } else {
      buttonText = `Syncing ${progress.current}/${progress.total} videos...`;
    }
  }

  if (!connected) {
    return (
      <Link href="/settings">
        <Button variant="outline" size="sm">
          Connect YT
        </Button>
      </Link>
    );
  }

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-3">
        <span className="text-xs text-muted-foreground">
          {stalenessLabel}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={handleSync}
          disabled={syncing}
        >
          {buttonText}
        </Button>
      </div>

      {result?.error && (
        <p className="text-xs text-red-600">{result.error}</p>
      )}
      {result?.videoCount !== undefined && !result.error && (
        <p className="text-xs text-green-600">
          Synced {result.videoCount} videos
        </p>
      )}
    </div>
  );
}
