"use client";

import { useState } from "react";
import { GrowthChart } from "./growth-chart";
import { TopPerformersGrid } from "./top-performers";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface GrowthPoint {
  date: string;
  timestamp: number;
  title: string;
  views: number;
  cumulativeViews: number;
  thumbnailUrl?: string | null;
}

interface TopVideo {
  title: string;
  thumbnailUrl: string | null;
  badge: string;
  stat: string;
}

interface ChannelStats {
  totalViews: number;
  subscriberCount: number;
  videoCount: number;
}

interface AnalyticsPageProps {
  stats: ChannelStats;
  timeline: GrowthPoint[];
  topPerformers: TopVideo[];
}

const PERIODS = [
  { value: "all", label: "All time" },
  { value: "6m", label: "6 months" },
  { value: "3m", label: "3 months" },
  { value: "1m", label: "1 month" },
  { value: "2w", label: "2 weeks" },
  { value: "1w", label: "1 week" },
] as const;

function getPeriodCutoff(period: string): number {
  const now = Date.now();
  const day = 86400000;
  switch (period) {
    case "1w": return now - 7 * day;
    case "2w": return now - 14 * day;
    case "1m": return now - 30 * day;
    case "3m": return now - 90 * day;
    case "6m": return now - 180 * day;
    default: return 0;
  }
}

function formatBig(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return String(n);
}

export function AnalyticsPage({ stats, timeline, topPerformers }: AnalyticsPageProps) {
  const [period, setPeriod] = useState("all");

  // Precompute which periods have data
  const periodHasData = Object.fromEntries(
    PERIODS.map((p) => {
      const c = getPeriodCutoff(p.value);
      return [p.value, timeline.some((d) => d.timestamp >= c)];
    })
  );

  const cutoff = getPeriodCutoff(period);
  const filtered = timeline.filter((d) => d.timestamp >= cutoff);

  // Recalculate cumulative views for filtered data
  const filteredWithCumulative = (() => {
    let cumulative = 0;
    return filtered.map((d) => {
      cumulative += d.views;
      return { ...d, cumulativeViews: cumulative };
    });
  })();

  // Filtered stats
  const filteredViews = filtered.reduce((sum, d) => sum + d.views, 0);
  const displayStats = period === "all" ? stats : {
    ...stats,
    totalViews: filteredViews,
    videoCount: filtered.length,
  };

  // Previous period comparison
  // "all" → compare last 30 days vs 30 days before that
  // other → same duration shifted back
  const comparison = (() => {
    const day = 86400000;
    const now = Date.now();
    let currentCutoff: number;
    let prevCutoff: number;

    if (period === "all") {
      // Find the most recent period that has data
      // Try 30d, 60d, 90d, 180d — use the first with at least 1 video in both halves
      for (const days of [30, 60, 90, 180]) {
        const cc = now - days * day;
        const pc = now - days * 2 * day;
        const cur = timeline.filter((d) => d.timestamp >= cc);
        const pre = timeline.filter((d) => d.timestamp >= pc && d.timestamp < cc);
        if (cur.length > 0 && pre.length > 0) {
          return {
            currentViews: cur.reduce((s, d) => s + d.views, 0),
            prevViews: pre.reduce((s, d) => s + d.views, 0),
            currentVideos: cur.length,
            prevVideos: pre.length,
          };
        }
      }
      // No meaningful comparison found
      return { currentViews: 0, prevViews: 0, currentVideos: 0, prevVideos: 0 };
    } else {
      currentCutoff = cutoff;
      const duration = now - cutoff;
      prevCutoff = cutoff - duration;
    }

    const current = timeline.filter((d) => d.timestamp >= currentCutoff);
    const prev = timeline.filter((d) => d.timestamp >= prevCutoff && d.timestamp < currentCutoff);
    return {
      currentViews: current.reduce((sum, d) => sum + d.views, 0),
      prevViews: prev.reduce((sum, d) => sum + d.views, 0),
      currentVideos: current.length,
      prevVideos: prev.length,
    };
  })();

  function getDelta(current: number, previous: number): { value: string; positive: boolean } | null {
    if (previous === 0) return current > 0 ? { value: `+${formatBig(current)}`, positive: true } : null;
    const diff = current - previous;
    const pct = Math.round((diff / previous) * 100);
    if (pct === 0) return null;
    return { value: `${pct > 0 ? "+" : ""}${pct}%`, positive: pct > 0 };
  }

  const viewsDelta = getDelta(comparison.currentViews, comparison.prevViews);
  const videosDelta = getDelta(comparison.currentVideos, comparison.prevVideos);

  return (
    <div className="space-y-8">
      {/* Hero Stats */}
      <div className="grid grid-cols-3 gap-4">
        <HeroStat value={formatBig(displayStats.totalViews)} label="Total Views" delta={viewsDelta} />
        <HeroStat value={String(displayStats.subscriberCount)} label="Subscribers" />
        <HeroStat value={String(displayStats.videoCount)} label="Videos" delta={videosDelta} />
      </div>

      {/* Growth Timeline */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-zinc-900">
            Growth Timeline
          </h2>
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger size="sm" className="w-auto cursor-pointer">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PERIODS.map((p) => (
                <SelectItem
                  key={p.value}
                  value={p.value}
                  disabled={!periodHasData[p.value]}
                >
                  {p.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {filteredWithCumulative.length > 0 ? (
          <GrowthChart data={filteredWithCumulative} />
        ) : (
          <p className="text-sm text-muted-foreground py-8 text-center">
            No videos in this period.
          </p>
        )}
      </section>

      {/* Best Performers */}
      {topPerformers.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold text-zinc-900 mb-3">
            Best Performers
          </h2>
          <TopPerformersGrid videos={topPerformers} />
        </section>
      )}
    </div>
  );
}

function HeroStat({ value, label, delta }: {
  value: string;
  label: string;
  delta?: { value: string; positive: boolean } | null;
}) {
  return (
    <div className="text-center py-6 rounded-lg border">
      <div className="flex items-center justify-center gap-2">
        <p className="text-3xl font-bold text-zinc-900">{value}</p>
        {delta && (
          <span className={`text-xs font-medium ${delta.positive ? "text-emerald-600" : "text-red-500"}`}>
            {delta.positive ? "↑" : "↓"} {delta.value}
          </span>
        )}
      </div>
      <p className="text-sm text-muted-foreground mt-1">{label}</p>
    </div>
  );
}
