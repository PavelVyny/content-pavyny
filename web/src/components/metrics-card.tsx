"use client";

import { useState } from "react";
import { RetentionChart } from "./retention-chart";
import type { VideoMetricsData } from "@/lib/types";

interface MetricsCardProps {
  metrics: VideoMetricsData;
}

export function MetricsCard({ metrics }: MetricsCardProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-4">
        <MetricItem label="Views" value={metrics.views.toLocaleString()} />
        <MetricItem
          label="Avg Retention"
          value={`${metrics.averageViewPercentage}%`}
        />
        <MetricItem
          label="Subs"
          value={`+${metrics.subscribersGained}`}
        />
        <MetricItem label="Likes" value={metrics.likes.toLocaleString()} />
        <MetricItem label="Comments" value={String(metrics.comments)} />
      </div>

      <div onClick={() => setExpanded(!expanded)}>
        <RetentionChart
          data={metrics.retentionCurve ?? []}
          expanded={expanded}
        />
      </div>
    </div>
  );
}

function MetricItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-sm font-semibold">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}
