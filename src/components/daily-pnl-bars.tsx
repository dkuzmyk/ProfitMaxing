"use client";

import { useEffect, useRef, useState } from "react";

import type { DailyPnlPoint } from "@/lib/trade-metrics";

type DailyPnlBarsProps = {
  points: DailyPnlPoint[];
};

type HoverState = {
  point: DailyPnlPoint;
  x: number;
  y: number;
  flip: boolean;
};

const PAD = { top: 14, right: 16, bottom: 38, left: 68 };
const Y_TICKS = 5;

function fmtDate(date: string) {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(
    new Date(date + "T12:00:00"),
  );
}

function fmtCurrency(v: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(v);
}

function fmtAxisVal(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: Math.abs(value) >= 10000 ? "compact" : "standard",
    maximumFractionDigits: Math.abs(value) >= 10000 ? 1 : 0,
  }).format(value);
}

export function DailyPnlBars({ points }: DailyPnlBarsProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [hovered, setHovered] = useState<HoverState | null>(null);
  const [dims, setDims] = useState({ w: 860, h: 200 });

  useEffect(() => {
    if (!svgRef.current) return;
    const ro = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      if (width > 0 && height > 0) setDims({ w: Math.round(width), h: Math.round(height) });
    });
    ro.observe(svgRef.current);
    return () => ro.disconnect();
  }, []);

  if (points.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center rounded-[24px] border border-white/8 bg-[#1e1f22] text-sm text-[#949ba4]">
        No closed trading days in this range yet.
      </div>
    );
  }

  const { w, h } = dims;
  const CW = w - PAD.left - PAD.right;
  const CH = h - PAD.top - PAD.bottom;

  const visible = points.slice(-90);
  const N = visible.length;

  const rawMax = Math.max(0, ...visible.map((p) => p.pnl));
  const rawMin = Math.min(0, ...visible.map((p) => p.pnl));
  const rawRange = rawMax - rawMin || 1;
  const paddedMax = rawMax + rawRange * 0.1;
  const paddedMin = rawMin - rawRange * 0.1;
  const paddedRange = paddedMax - paddedMin;

  function yToSvg(v: number) {
    return PAD.top + ((paddedMax - v) / paddedRange) * CH;
  }

  const zeroY = yToSvg(0);

  const yTicks = Array.from({ length: Y_TICKS }, (_, i) => {
    const ratio = i / (Y_TICKS - 1);
    const value = paddedMax - ratio * paddedRange;
    return { value, y: PAD.top + ratio * CH };
  });

  const slotW = CW / N;
  const barW = Math.max(3, Math.min(36, slotW * 0.74));

  const maxXLabels = Math.min(N, 8);
  const xLabelIndexes =
    N <= maxXLabels
      ? Array.from({ length: N }, (_, i) => i)
      : Array.from({ length: maxXLabels }, (_, i) =>
          Math.round((i / (maxXLabels - 1)) * (N - 1)),
        );

  function handleMouseMove(e: React.MouseEvent<SVGSVGElement>) {
    if (!svgRef.current || !containerRef.current) return;

    const svgRect = svgRef.current.getBoundingClientRect();
    const svgX = e.clientX - svgRect.left;
    const svgY = e.clientY - svgRect.top;

    if (svgX < PAD.left || svgX > w - PAD.right || svgY < PAD.top || svgY > h - PAD.bottom) {
      setHovered(null);
      return;
    }

    const slotIdx = Math.floor((svgX - PAD.left) / slotW);
    const clampedIdx = Math.max(0, Math.min(N - 1, slotIdx));
    const containerRect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - containerRect.left;
    const y = e.clientY - containerRect.top;

    setHovered({
      point: visible[clampedIdx],
      x,
      y,
      flip: x > containerRect.width * 0.55,
    });
  }

  const hoveredIdx = hovered
    ? visible.findIndex((p) => p.date === hovered.point.date)
    : -1;

  return (
    <div ref={containerRef} className="relative rounded-[24px] border border-white/8 bg-[#1e1f22] p-4 sm:p-5">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${w} ${h}`}
        className="h-48 w-full"
        role="img"
        aria-label="Daily profit and loss bar chart"
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHovered(null)}
      >
        {/* Grid lines */}
        {yTicks.map((tick) => (
          <g key={tick.y}>
            <line
              x1={PAD.left} y1={tick.y}
              x2={w - PAD.right} y2={tick.y}
              stroke="rgba(255,255,255,0.06)" strokeWidth="1"
            />
            <text x={PAD.left - 8} y={tick.y + 4} textAnchor="end" fontSize="11" fill="rgba(148,155,164,0.85)">
              {fmtAxisVal(tick.value)}
            </text>
          </g>
        ))}

        {/* Zero baseline */}
        <line
          x1={PAD.left} y1={zeroY}
          x2={w - PAD.right} y2={zeroY}
          stroke="rgba(255,255,255,0.18)" strokeWidth="1"
        />

        {/* Hover column highlight */}
        {hoveredIdx >= 0 && (
          <rect
            x={PAD.left + hoveredIdx * slotW}
            y={PAD.top}
            width={slotW}
            height={CH}
            fill="rgba(255,255,255,0.04)"
            rx="2"
          />
        )}

        {/* Bars */}
        {visible.map((point, i) => {
          const cx = PAD.left + (i + 0.5) * slotW;
          const bx = cx - barW / 2;
          const positive = point.pnl >= 0;
          const barHeight = Math.max(1, Math.abs(yToSvg(point.pnl) - zeroY));
          const by = positive ? zeroY - barHeight : zeroY;
          const fill = positive ? "#34d399" : "#fb7185";
          const isHovered = i === hoveredIdx;

          return (
            <rect
              key={point.date}
              x={bx}
              y={by}
              width={barW}
              height={barHeight}
              fill={fill}
              rx="2"
              opacity={isHovered ? 1 : 0.75}
              stroke={isHovered ? fill : "none"}
              strokeWidth={isHovered ? 1 : 0}
              strokeOpacity={0.5}
            />
          );
        })}

        {/* X axis labels */}
        {xLabelIndexes.map((i) => {
          const cx = PAD.left + (i + 0.5) * slotW;
          return (
            <text
              key={visible[i].date}
              x={cx} y={h - 10}
              textAnchor="middle" fontSize="11"
              fill="rgba(148,155,164,0.85)"
            >
              {fmtDate(visible[i].date)}
            </text>
          );
        })}
      </svg>

      {/* Tooltip */}
      {hovered && (
        <div
          className="pointer-events-none absolute z-20 min-w-[160px] rounded-[14px] border border-white/10 bg-[#0d0e10] px-3 py-2.5 shadow-2xl"
          style={{
            left: hovered.x,
            top: hovered.y,
            transform: `translate(${hovered.flip ? "calc(-100% - 14px)" : "14px"}, -50%)`,
          }}
        >
          <p className="mb-1.5 text-[11px] font-medium text-white">
            {fmtDate(hovered.point.date)}
          </p>
          <div className="space-y-1">
            <div className="flex items-center justify-between gap-4">
              <span className="text-[11px] text-[#6d7278]">Daily P&L</span>
              <span className={`text-[12px] font-semibold tabular-nums ${hovered.point.pnl >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                {hovered.point.pnl >= 0 ? "+" : ""}{fmtCurrency(hovered.point.pnl)}
              </span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-[11px] text-[#6d7278]">Trades</span>
              <span className="text-[12px] font-medium text-[#b5bac1]">
                {hovered.point.tradeCount}
              </span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-[11px] text-[#6d7278]">Avg per trade</span>
              <span className={`text-[12px] font-medium tabular-nums ${hovered.point.pnl >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                {fmtCurrency(hovered.point.pnl / Math.max(1, hovered.point.tradeCount))}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
