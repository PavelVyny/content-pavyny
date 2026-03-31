"use client";

import { AreaChart } from "@tremor/react";

interface RetentionChartProps {
  data: number[];
  expanded?: boolean;
}

export function RetentionChart({ data, expanded = false }: RetentionChartProps) {
  if (!data || data.length < 10 || !expanded) {
    return (
      <span className="text-xs text-muted-foreground">Not enough data</span>
    );
  }

  const chartData = data.map((value, index) => ({
    position: `${index}%`,
    retention: Math.round(value * 100),
  }));

  // Show ticks at 0%, 25%, 50%, 75%, 100%
  const tickIndices = [0, 25, 50, 75, 100];
  const filteredData = chartData.filter((_, i) =>
    tickIndices.includes(i) || i === chartData.length - 1
  );

  return (
    <AreaChart
      className="h-44"
      data={chartData}
      index="position"
      categories={["retention"]}
      colors={["blue"]}
      valueFormatter={(v) => `${v}%`}
      showLegend={false}
      showGridLines={true}
      curveType="monotone"
      showAnimation={false}
    />
  );
}
