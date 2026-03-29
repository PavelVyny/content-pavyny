"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { discoverVideos, syncSingleVideo } from "@/app/actions/metrics";

interface SyncButtonProps {
  lastSyncedAt: string | null;
}

function getStaleness(lastSyncedAt: string | null): {
  color: string;
  label: string;
} {
  if (!lastSyncedAt) {
    return { color: "bg-red-100 text-red-800", label: "Never synced" };
  }

  const diff = Date.now() - new Date(lastSyncedAt).getTime();
  const hourMs = 60 * 60 * 1000;
  const dayMs = 24 * hourMs;

  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

  let label: string;
  if (diff < hourMs) {
    const minutes = Math.round(diff / 60000);
    label = rtf.format(-minutes, "minute");
  } else if (diff < dayMs) {
    const hours = Math.round(diff / hourMs);
    label = rtf.format(-hours, "hour");
  } else {
    const days = Math.round(diff / dayMs);
    label = rtf.format(-days, "day");
  }

  if (diff < hourMs) {
    return { color: "bg-green-100 text-green-800", label };
  }
  if (diff < dayMs) {
    return { color: "bg-yellow-100 text-yellow-800", label };
  }
  return { color: "bg-red-100 text-red-800", label };
}

export function SyncButton({ lastSyncedAt }: SyncButtonProps) {
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

  const staleness = getStaleness(lastSyncedAt);

  let buttonText = "Sync Now";
  if (syncing && progress) {
    if (progress.total === 0) {
      buttonText = "Discovering videos...";
    } else {
      buttonText = `Syncing ${progress.current}/${progress.total} videos...`;
    }
  }

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-3">
        <span
          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${staleness.color}`}
        >
          {staleness.label}
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
