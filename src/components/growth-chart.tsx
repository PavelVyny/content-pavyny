"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

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

function CustomTooltip({ active, payload }: any) {
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
    <div style={{ width: "100%", height: 260 }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ left: -10, right: 10, top: 5, bottom: 0 }}>
          <defs>
            <linearGradient id="viewsGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(160, 60%, 35%)" stopOpacity={0.2} />
              <stop offset="100%" stopColor="hsl(160, 60%, 35%)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11 }}
            tickLine={false}
          />
          <YAxis
            tickFormatter={formatViews}
            tick={{ fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            width={45}
            domain={[0, "auto"]}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="cumulativeViews"
            stroke="hsl(160, 60%, 35%)"
            strokeWidth={2}
            fill="url(#viewsGradient)"
            dot={{ r: 4, fill: "hsl(160, 60%, 35%)", stroke: "#fff", strokeWidth: 2 }}
            activeDot={{ r: 6, fill: "hsl(160, 60%, 35%)", stroke: "#fff", strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
