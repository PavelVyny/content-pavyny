"use client";

import { useState } from "react";

interface RetentionChartProps {
  data: number[];
  expanded?: boolean;
}

export function RetentionChart({ data, expanded = false }: RetentionChartProps) {
  const [hovered, setHovered] = useState<number | null>(null);

  if (!data || data.length < 10 || !expanded) {
    return (
      <span className="text-xs text-muted-foreground">Not enough data</span>
    );
  }

  const W = 600;
  const H = 180;
  const PAD = { top: 10, right: 10, bottom: 25, left: 45 };
  const cw = W - PAD.left - PAD.right;
  const ch = H - PAD.top - PAD.bottom;

  const maxVal = Math.max(...data.map((v) => Math.round(v * 100)));
  const niceMax = Math.ceil(maxVal / 20) * 20 || 100;

  const x = (i: number) => PAD.left + (i / (data.length - 1)) * cw;
  const y = (v: number) => PAD.top + ch - (v / niceMax) * ch;

  // Build smooth path
  const pts = data.map((v, i) => ({ x: x(i), y: y(Math.round(v * 100)) }));

  function smoothPath(points: { x: number; y: number }[]): string {
    if (points.length < 2) return `M${points[0].x},${points[0].y}`;
    let d = `M${points[0].x},${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[Math.max(0, i - 1)];
      const p1 = points[i];
      const p2 = points[i + 1];
      const p3 = points[Math.min(points.length - 1, i + 2)];
      const tension = 0.25;
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
  const yTicks = Array.from({ length: 5 }, (_, i) => Math.round((niceMax / 4) * i));

  // X ticks: 0%, 25%, 50%, 75%, 100%
  const xTicks = [0, 25, 50, 75, 100].filter((v) => v < data.length);

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
        {/* Grid */}
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

        {/* Area */}
        <path d={areaPath} fill="hsl(217, 91%, 60%)" fillOpacity={0.15} />

        {/* Line */}
        <path
          d={linePath}
          fill="none"
          stroke="hsl(217, 91%, 60%)"
          strokeWidth={2}
          strokeLinejoin="round"
        />

        {/* Hover detection — invisible wide rects for each data point */}
        {data.map((_, i) => (
          <rect
            key={i}
            x={x(i) - cw / data.length / 2}
            y={PAD.top}
            width={cw / data.length}
            height={ch}
            fill="transparent"
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(null)}
          />
        ))}

        {/* Hover dot */}
        {hovered !== null && (
          <circle
            cx={x(hovered)}
            cy={y(Math.round(data[hovered] * 100))}
            r={4}
            fill="hsl(217, 91%, 60%)"
            stroke="#fff"
            strokeWidth={2}
            className="pointer-events-none"
          />
        )}

        {/* Y labels */}
        {yTicks.map((tick) => (
          <text
            key={tick}
            x={PAD.left - 6}
            y={y(tick) + 4}
            textAnchor="end"
            fontSize={10}
            fill="#a1a1aa"
          >
            {tick}%
          </text>
        ))}

        {/* X labels */}
        {xTicks.map((tick) => (
          <text
            key={tick}
            x={x(tick)}
            y={H - 4}
            textAnchor="middle"
            fontSize={10}
            fill="#a1a1aa"
          >
            {tick}%
          </text>
        ))}
      </svg>

      {/* Tooltip */}
      {hovered !== null && (
        <div
          className="absolute bg-white border rounded-lg shadow-md px-2 py-1 text-xs pointer-events-none z-10"
          style={{
            left: `${(x(hovered) / W) * 100}%`,
            top: `${(y(Math.round(data[hovered] * 100)) / H) * 100 + 4}%`,
            transform: "translate(-50%, 0)",
          }}
        >
          <span className="font-semibold">{Math.round(data[hovered] * 100)}%</span>
          <span className="text-muted-foreground ml-1">at {hovered}%</span>
        </div>
      )}
    </div>
  );
}
