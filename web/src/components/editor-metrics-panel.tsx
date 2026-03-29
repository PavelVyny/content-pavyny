"use client";

import type { VideoMetricsData } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { RetentionChart } from "./retention-chart";

interface EditorMetricsPanelProps {
  metrics: VideoMetricsData;
  videoTitle: string;
}

function MetricItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-0.5">
      <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className="text-sm font-medium tabular-nums">{value}</p>
    </div>
  );
}

export function EditorMetricsPanel({
  metrics,
  videoTitle,
}: EditorMetricsPanelProps) {
  return (
    <Card size="sm">
      <CardContent className="space-y-4">
        <p className="font-medium text-sm">{videoTitle}</p>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          <MetricItem
            label="Views"
            value={metrics.views.toLocaleString()}
          />
          <MetricItem
            label="Retention"
            value={`${Math.round(metrics.averageViewPercentage)}%`}
          />
          <MetricItem
            label="Subs gained"
            value={`+${metrics.subscribersGained}`}
          />
          <MetricItem
            label="Likes"
            value={metrics.likes.toLocaleString()}
          />
          <MetricItem
            label="Comments"
            value={metrics.comments.toLocaleString()}
          />
        </div>

        {metrics.retentionCurve && metrics.retentionCurve.length >= 10 ? (
          <RetentionChart data={metrics.retentionCurve} expanded />
        ) : (
          <p className="text-sm text-muted-foreground">
            Not enough retention data yet
          </p>
        )}
      </CardContent>
    </Card>
  );
}
