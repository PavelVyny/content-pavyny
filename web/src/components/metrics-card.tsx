"use client";

import { useState } from "react";
import { RetentionChart } from "./retention-chart";
import type { VideoMetricsData } from "@/lib/types";

interface MetricsCardProps {
  metrics: VideoMetricsData;
}

// YouTube Shorts retention benchmarks (industry data):
// Avg Retention (averageViewPercentage — average % of video watched):
//   <40% poor | 40-60% average | 60-75% good | >75% excellent
// Stayed (% who watched to the end — last point of retention curve):
//   <20% poor | 20-35% average | 35-50% good | >50% excellent
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
        {metrics.engagedViews > 0 && (
          <MetricItem
            label="Engaged"
            value={metrics.engagedViews.toLocaleString()}
          />
        )}
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
