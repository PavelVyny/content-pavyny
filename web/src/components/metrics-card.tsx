"use client";

import { useState } from "react";
import { RetentionChart } from "./retention-chart";
import type { VideoMetricsData } from "@/lib/types";

interface MetricsCardProps {
  metrics: VideoMetricsData;
}

// YouTube Shorts retention benchmarks (based on industry data):
// <40% = poor (most viewers leave early)
// 40-60% = average (typical for Shorts)
// 60-75% = good (strong hook + content)
// >75% = excellent (viral-tier retention)
function retentionColor(pct: number): string {
  if (pct >= 75) return "text-green-600";
  if (pct >= 60) return "text-emerald-600";
  if (pct >= 40) return "text-zinc-700";
  return "text-red-600";
}

export function MetricsCard({ metrics }: MetricsCardProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-6">
        <MetricItem label="Views" value={metrics.views.toLocaleString()} />
        <MetricItem
          label="Avg Retention"
          value={`${metrics.averageViewPercentage}%`}
          className={retentionColor(metrics.averageViewPercentage ?? 0)}
        />
        <MetricItem
          label="Subs"
          value={`+${metrics.subscribersGained}`}
        />
        <MetricItem label="Likes" value={metrics.likes.toLocaleString()} />
        <MetricItem label="Comments" value={String(metrics.comments)} />
      </div>

      <div
        onClick={() => setExpanded(!expanded)}
        className="cursor-pointer"
      >
        <div className="text-[10px] text-muted-foreground mb-1 uppercase tracking-wider">
          Retention curve {expanded ? "▲" : "▼"}
        </div>
        <RetentionChart
          data={metrics.retentionCurve ?? []}
          expanded={expanded}
        />
      </div>
    </div>
  );
}

function MetricItem({
  label,
  value,
  className = "",
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div>
      <div className={`text-sm font-semibold ${className}`}>{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}
