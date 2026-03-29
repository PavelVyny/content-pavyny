"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface RetentionChartProps {
  data: number[];
  expanded?: boolean;
}

export function RetentionChart({ data, expanded = false }: RetentionChartProps) {
  if (!data || data.length < 10) {
    return (
      <span className="text-xs text-muted-foreground">Not enough data</span>
    );
  }

  const chartData = data.map((value, index) => ({
    pct: index,
    retention: value,
  }));

  if (expanded) {
    return (
      <div style={{ width: "100%", height: 200 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="pct"
              tickFormatter={(v: number) => `${v}%`}
              tick={{ fontSize: 11 }}
              label={{ value: "Progress", position: "insideBottom", offset: -2, fontSize: 10, fill: "#a1a1aa" }}
            />
            <YAxis
              domain={[0, "auto"]}
              tickFormatter={(v: number) => `${Math.round(v * 100)}%`}
              tick={{ fontSize: 11 }}
              label={{ value: "Watching", angle: -90, position: "insideLeft", offset: 10, fontSize: 10, fill: "#a1a1aa" }}
            />
            <Tooltip
              formatter={(value: unknown) => [
                `${Math.round(Number(value) * 100)}%`,
                "Retention",
              ]}
              labelFormatter={(label: unknown) =>
                `${label}% of video`
              }
            />
            <Line
              type="monotone"
              dataKey="retention"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    );
  }

  // Sparkline: 400px, mini axis labels
  return (
    <div style={{ width: 400, height: 56 }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ left: 2, right: 2, bottom: 12, top: 2 }}>
          <XAxis
            dataKey="pct"
            tick={false}
            axisLine={{ stroke: "#d4d4d8", strokeWidth: 0.5 }}
            label={{ value: "Progress", position: "insideBottom", offset: 0, fontSize: 9, fill: "#a1a1aa" }}
          />
          <YAxis
            hide
            domain={[0, "auto"]}
          />
          <Line
            type="monotone"
            dataKey="retention"
            stroke="#3b82f6"
            strokeWidth={1.5}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
