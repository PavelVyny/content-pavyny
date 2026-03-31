"use client";

import { AreaChart } from "@tremor/react";

interface GrowthPoint {
  date: string;
  title: string;
  views: number;
  cumulativeViews: number;
}

interface GrowthChartProps {
  data: GrowthPoint[];
}

function formatViews(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return String(n);
}

export function GrowthChart({ data }: GrowthChartProps) {
  if (data.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-8 text-center">
        No data yet. Sync your YouTube videos first.
      </p>
    );
  }

  return (
    <AreaChart
      className="h-64"
      data={data}
      index="date"
      categories={["cumulativeViews"]}
      colors={["emerald"]}
      valueFormatter={formatViews}
      showLegend={false}
      showGridLines={true}
      curveType="monotone"
      customTooltip={({ payload, active }) => {
        if (!active || !payload?.[0]) return null;
        const d = payload[0].payload as GrowthPoint;
        return (
          <div className="bg-white border rounded-lg shadow-md px-3 py-2 text-sm">
            <p className="font-medium text-zinc-900">{d.title}</p>
            <p className="text-muted-foreground text-xs mt-0.5">{d.date}</p>
            <div className="flex gap-4 mt-1.5">
              <span className="text-xs">
                <span className="font-semibold">{formatViews(d.views)}</span> views
              </span>
              <span className="text-xs">
                <span className="font-semibold">{formatViews(d.cumulativeViews)}</span> total
              </span>
            </div>
          </div>
        );
      }}
    />
  );
}
