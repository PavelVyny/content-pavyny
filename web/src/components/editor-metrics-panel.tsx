"use client";

import type { VideoMetricsData } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { RetentionChart } from "./retention-chart";

interface EditorMetricsPanelProps {
  metrics: VideoMetricsData;
  videoTitle: string;
}

// Same color logic as metrics-card.tsx
function retentionColor(pct: number): string {
  if (pct >= 75) return "text-green-600";
  if (pct >= 60) return "text-emerald-600";
  if (pct >= 40) return "text-zinc-700";
  return "text-red-600";
}

function engagedColor(pct: number): string {
  if (pct >= 65) return "text-green-600";
  if (pct >= 55) return "text-emerald-600";
  if (pct >= 45) return "text-zinc-700";
  return "text-red-600";
}

function formatCompact(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return n.toLocaleString();
}

export function EditorMetricsPanel({
  metrics,
  videoTitle,
}: EditorMetricsPanelProps) {
  const engagedPct =
    metrics.engagedViews && metrics.views > 0
      ? Math.round((metrics.engagedViews / metrics.views) * 100)
      : null;

  return (
    <Card size="sm">
      <CardContent className="space-y-4">
        <p className="font-medium text-sm">{videoTitle}</p>

        <div className="flex flex-wrap gap-6">
          <div>
            <div className="text-sm font-semibold">
              {formatCompact(metrics.views)}
              {metrics.engagedViews > 0 && (
                <>
                  {" / "}
                  <span className={engagedPct !== null ? engagedColor(engagedPct) : ""}>
                    {formatCompact(metrics.engagedViews)}
                  </span>
                </>
              )}
            </div>
            <div className="text-xs text-muted-foreground">
              Views / Engaged
              {engagedPct !== null && (
                <span className={`ml-1 ${engagedColor(engagedPct)}`}>
                  ({engagedPct}%)
                </span>
              )}
            </div>
          </div>
          <MetricItem
            label="Avg Retention"
            value={`${metrics.averageViewPercentage}%`}
            className={retentionColor(metrics.averageViewPercentage ?? 0)}
          />
          <MetricItem label="Subs" value={`+${metrics.subscribersGained}`} />
          <MetricItem label="Likes" value={metrics.likes.toLocaleString()} />
          <MetricItem label="Comments" value={String(metrics.comments)} />
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
