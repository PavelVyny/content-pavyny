"use client";

import { useState } from "react";

interface GrowthPoint {
  date: string;
  timestamp: number;
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
  const [hovered, setHovered] = useState<number | null>(null);

  if (data.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-8 text-center">
        No data yet. Sync your YouTube videos first.
      </p>
    );
  }

  const W = 600;
  const H = 220;
  const PAD = { top: 20, right: 20, bottom: 30, left: 50 };
  const cw = W - PAD.left - PAD.right;
  const ch = H - PAD.top - PAD.bottom;

  const maxVal = Math.max(...data.map((d) => d.cumulativeViews));
  const niceMax = Math.ceil(maxVal / 1000) * 1000 || 1000;

  const tMin = data[0].timestamp;
  const tMax = data[data.length - 1].timestamp;
  const tRange = tMax - tMin || 1;
  const x = (i: number) => PAD.left + ((data[i].timestamp - tMin) / tRange) * cw;
  const y = (v: number) => PAD.top + ch - (v / niceMax) * ch;

  // Build smooth cubic Bézier path
  const pts = data.map((d, i) => ({ x: x(i), y: y(d.cumulativeViews) }));
  function smoothPath(points: { x: number; y: number }[]): string {
    if (points.length < 2) return `M${points[0].x},${points[0].y}`;
    let d = `M${points[0].x},${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[Math.max(0, i - 1)];
      const p1 = points[i];
      const p2 = points[i + 1];
      const p3 = points[Math.min(points.length - 1, i + 2)];
      const tension = 0.3;
      const cp1x = p1.x + (p2.x - p0.x) * tension;
      const cp1y = p1.y + (p2.y - p0.y) * tension;
      const cp2x = p2.x - (p3.x - p1.x) * tension;
      const cp2y = p2.y - (p3.y - p1.y) * tension;
      d += `C${cp1x},${cp1y} ${cp2x},${cp2y} ${p2.x},${p2.y}`;
    }
    return d;
  }
  const linePath = smoothPath(pts);
  const areaPath = `${linePath}L${pts[pts.length - 1].x},${y(0)}L${pts[0].x},${y(0)}Z`;

  // Y ticks
  const tickCount = 4;
  const yTicks = Array.from({ length: tickCount + 1 }, (_, i) =>
    Math.round((niceMax / tickCount) * i)
  );

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
        {/* Grid lines */}
        {yTicks.map((tick) => (
          <line
            key={tick}
            x1={PAD.left}
            y1={y(tick)}
            x2={W - PAD.right}
            y2={y(tick)}
            stroke="#f0f0f0"
            strokeDasharray="3 3"
          />
        ))}

        {/* Area fill */}
        <path d={areaPath} fill="hsl(160, 60%, 35%)" fillOpacity={0.12} />

        {/* Line */}
        <path
          d={linePath}
          fill="none"
          stroke="hsl(160, 60%, 35%)"
          strokeWidth={2.5}
          strokeLinejoin="round"
        />

        {/* Dots */}
        {data.map((d, i) => (
          <circle
            key={i}
            cx={x(i)}
            cy={y(d.cumulativeViews)}
            r={hovered === i ? 6 : 4}
            fill="hsl(160, 60%, 35%)"
            stroke="#fff"
            strokeWidth={2}
            className="cursor-pointer transition-all duration-150"
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(null)}
          />
        ))}

        {/* Y axis labels */}
        {yTicks.map((tick) => (
          <text
            key={tick}
            x={PAD.left - 8}
            y={y(tick) + 4}
            textAnchor="end"
            fontSize={11}
            fill="#a1a1aa"
          >
            {formatViews(tick)}
          </text>
        ))}

        {/* X axis labels */}
        {data.map((d, i) => (
          <text
            key={i}
            x={x(i)}
            y={H - 6}
            textAnchor="middle"
            fontSize={11}
            fill="#a1a1aa"
          >
            {d.date}
          </text>
        ))}
      </svg>

      {/* Tooltip */}
      {hovered !== null && (
        <div
          className="absolute bg-white border rounded-lg shadow-md px-3 py-2 text-sm pointer-events-none z-10"
          style={{
            left: `${(x(hovered) / W) * 100}%`,
            top: `${(y(data[hovered].cumulativeViews) / H) * 100 - 12}%`,
            transform: "translate(-50%, -100%)",
          }}
        >
          <p className="font-medium text-zinc-900">{data[hovered].title}</p>
          <p className="text-muted-foreground text-xs mt-0.5">
            {data[hovered].date}
          </p>
          <div className="flex gap-4 mt-1.5">
            <span className="text-xs">
              <span className="font-semibold">
                {formatViews(data[hovered].views)}
              </span>{" "}
              views
            </span>
            <span className="text-xs">
              <span className="font-semibold">
                {formatViews(data[hovered].cumulativeViews)}
              </span>{" "}
              total
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
