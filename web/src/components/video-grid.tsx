"use client";

import { useState } from "react";
import { RetentionChart } from "./retention-chart";
import type { VideoMetricsData, VideoData } from "@/lib/types";

interface VideoWithMetrics {
  video: VideoData;
  metrics: VideoMetricsData | null;
  linkedScriptTitle: string | null;
}

function formatCompact(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return n.toLocaleString();
}

function engagedColor(pct: number): string {
  if (pct >= 65) return "text-green-600";
  if (pct >= 55) return "text-emerald-600";
  if (pct >= 45) return "text-zinc-700";
  return "text-red-600";
}

function retentionColor(pct: number): string {
  if (pct >= 75) return "text-green-600";
  if (pct >= 60) return "text-emerald-600";
  if (pct >= 40) return "text-zinc-700";
  return "text-red-600";
}

function cleanTitle(title: string): string {
  return title.replace(/\s*[|].*$/, "").replace(/\s*#\w+/g, "").trim();
}

function formatDate(date: Date | string | null): string {
  if (!date) return "";
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

interface VideoGridProps {
  videos: VideoWithMetrics[];
}

export function VideoGrid({ videos }: VideoGridProps) {
  const [expandedId, setExpandedId] = useState<number | null>(null);

  if (videos.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-4">
        No videos synced yet. Click "Sync Now" to fetch your YouTube videos.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {videos.map((item) => {
        const { video, metrics, linkedScriptTitle } = item;
        const isExpanded = expandedId === video.id;
        const engagedPct =
          metrics && metrics.engagedViews && metrics.views > 0
            ? Math.round((metrics.engagedViews / metrics.views) * 100)
            : null;

        return (
          <div
            key={video.id}
            className="border rounded-lg overflow-hidden hover:border-zinc-400 transition-colors"
          >
            <button
              onClick={() => setExpandedId(isExpanded ? null : video.id)}
              className="w-full text-left cursor-pointer"
            >
              <div className="flex gap-3 p-3">
                {video.thumbnailUrl && (
                  <img
                    src={video.thumbnailUrl}
                    alt=""
                    className="w-28 h-20 rounded object-cover shrink-0"
                  />
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">
                    {cleanTitle(video.title)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(video.publishedAt)}
                  </p>
                  {metrics && (
                    <div className="flex gap-3 mt-1 text-xs">
                      <span className="font-medium">{formatCompact(metrics.views)} views</span>
                      {engagedPct !== null && (
                        <span className={engagedColor(engagedPct)}>
                          {engagedPct}% engaged
                        </span>
                      )}
                      <span className={retentionColor(metrics.averageViewPercentage ?? 0)}>
                        {metrics.averageViewPercentage}% ret
                      </span>
                    </div>
                  )}
                  {linkedScriptTitle && (
                    <span className="inline-block mt-1 text-[10px] px-1.5 py-0.5 bg-emerald-100 text-emerald-700 rounded">
                      Linked
                    </span>
                  )}
                </div>
              </div>
            </button>

            {isExpanded && metrics && (
              <div className="px-3 pb-3 border-t bg-zinc-50/50">
                <div className="flex flex-wrap gap-4 py-3 text-xs">
                  <div>
                    <span className="font-semibold">{formatCompact(metrics.views)}</span>
                    {metrics.engagedViews > 0 && (
                      <>
                        {" / "}
                        <span className={engagedPct !== null ? engagedColor(engagedPct) : ""}>
                          {formatCompact(metrics.engagedViews)}
                        </span>
                      </>
                    )}
                    <div className="text-muted-foreground">
                      Views / Engaged
                      {engagedPct !== null && (
                        <span className={`ml-1 ${engagedColor(engagedPct)}`}>({engagedPct}%)</span>
                      )}
                    </div>
                  </div>
                  <div>
                    <span className={`font-semibold ${retentionColor(metrics.averageViewPercentage ?? 0)}`}>
                      {metrics.averageViewPercentage}%
                    </span>
                    <div className="text-muted-foreground">Avg Retention</div>
                  </div>
                  <div>
                    <span className="font-semibold">+{metrics.subscribersGained}</span>
                    <div className="text-muted-foreground">Subs</div>
                  </div>
                  <div>
                    <span className="font-semibold">{metrics.likes}</span>
                    <div className="text-muted-foreground">Likes</div>
                  </div>
                </div>
                <RetentionChart data={metrics.retentionCurve ?? []} expanded />
                {linkedScriptTitle && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Linked to: {linkedScriptTitle}
                  </p>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
