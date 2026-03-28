"use client";

import { useEffect, useRef, useState } from "react";

type WeekdayPoint = {
  day: number;
  dayLabel: string;
  totalPnl: number;
  avgPnl: number;
  totalTrades: number;
  closedTrades: number;
  winRate: number;
};

type Props = {
  data: WeekdayPoint[];
};

type HoverState = {
  idx: number;
  x: number;
  y: number;
  flip: boolean;
};

const PAD = { top: 20, right: 16, bottom: 44, left: 60 };
const Y_TICKS = 5;

function fmtCurrency(v: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(v);
}

function fmtAxis(v: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: Math.abs(v) >= 10000 ? "compact" : "standard",
    maximumFractionDigits: Math.abs(v) >= 10000 ? 1 : 0,
  }).format(v);
}

export function WeekdayChart({ data }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [hovered, setHovered] = useState<HoverState | null>(null);
  const [dims, setDims] = useState({ w: 560, h: 220 });

  useEffect(() => {
    if (!svgRef.current) return;
    const ro = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      if (width > 0 && height > 0) setDims({ w: Math.round(width), h: Math.round(height) });
    });
    ro.observe(svgRef.current);
    return () => ro.disconnect();
  }, []);

  const hasAnyData = data.some((d) => d.closedTrades > 0);

  if (!hasAnyData) {
    return (
      <div className="flex h-[220px] items-center justify-center rounded-[24px] border border-white/8 bg-[#1e1f22] text-sm text-[#949ba4]">
        No closed trades in this range yet.
      </div>
    );
  }

  const { w, h } = dims;
  const CW = w - PAD.left - PAD.right;
  const CH = h - PAD.top - PAD.bottom;
  const N = data.length;
  const slotW = CW / N;
  const barW = Math.max(8, slotW * 0.55);

  const rawMax = Math.max(0, ...data.map((d) => d.totalPnl));
  const rawMin = Math.min(0, ...data.map((d) => d.totalPnl));
  const rawRange = Math.max(rawMax - rawMin, 1);
  const paddedMax = rawMax + rawRange * 0.12;
  const paddedMin = rawMin - rawRange * 0.12;
  const totalRange = paddedMax - paddedMin;

  const zeroY = PAD.top + CH * (1 - (0 - paddedMin) / totalRange);

  function toY(v: number) {
    return PAD.top + CH * (1 - (v - paddedMin) / totalRange);
  }

  // Y-axis ticks
  const tickStep = rawRange / (Y_TICKS - 1) || 1;
  const yTicks = Array.from({ length: Y_TICKS }, (_, i) => {
    const v = rawMin + tickStep * i;
    return Math.round(v / (tickStep / 2)) * (tickStep / 2);
  });

  function handleMouseMove(e: React.MouseEvent<SVGSVGElement>) {
    if (!svgRef.current || !containerRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const svgX = e.clientX - rect.left;
    if (svgX < PAD.left || svgX > w - PAD.right) { setHovered(null); return; }
    const idx = Math.max(0, Math.min(N - 1, Math.floor((svgX - PAD.left) / slotW)));
    if (data[idx].closedTrades === 0) { setHovered(null); return; }
    const cRect = containerRef.current.getBoundingClientRect();
    setHovered({
      idx,
      x: e.clientX - cRect.left,
      y: e.clientY - cRect.top,
      flip: svgX > w * 0.6,
    });
  }

  return (
    <div ref={containerRef} className="relative rounded-[24px] border border-white/8 bg-[#1e1f22] p-4 sm:p-5">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${w} ${h}`}
        className="h-[220px] w-full"
        role="img"
        aria-label="P&L by weekday"
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHovered(null)}
      >
        {/* Grid lines + Y labels */}
        {yTicks.map((v, i) => {
          const y = toY(v);
          const isZero = Math.abs(v) < tickStep * 0.01;
          return (
            <g key={i}>
              <line
                x1={PAD.left} y1={y}
                x2={w - PAD.right} y2={y}
                stroke={isZero ? "rgba(255,255,255,0.14)" : "rgba(255,255,255,0.06)"}
                strokeWidth={isZero ? 1.2 : 1}
                strokeDasharray={isZero ? "none" : "none"}
              />
              <text
                x={PAD.left - 7}
                y={y + 4}
                textAnchor="end"
                fontSize="10"
                fill="rgba(148,155,164,0.8)"
              >
                {fmtAxis(v)}
              </text>
            </g>
          );
        })}

        {/* Zero line (if not already in ticks) */}
        {rawMin < 0 && rawMax > 0 && (
          <line
            x1={PAD.left} y1={zeroY}
            x2={w - PAD.right} y2={zeroY}
            stroke="rgba(255,255,255,0.18)"
            strokeWidth={1}
          />
        )}

        {/* Hover column highlight */}
        {hovered !== null && (
          <rect
            x={PAD.left + hovered.idx * slotW}
            y={PAD.top}
            width={slotW}
            height={CH}
            fill="rgba(255,255,255,0.04)"
          />
        )}

        {/* Bars */}
        {data.map((d, i) => {
          const cx = PAD.left + i * slotW + slotW / 2;
          const bx = cx - barW / 2;
          const isHovered = hovered?.idx === i;

          if (d.closedTrades === 0) {
            // Ghost bar for empty days
            return (
              <g key={d.dayLabel}>
                <rect
                  x={bx} y={zeroY - 2}
                  width={barW} height={4}
                  fill="rgba(255,255,255,0.07)"
                  rx="2"
                />
                <text
                  x={cx} y={h - 24}
                  textAnchor="middle"
                  fontSize="11"
                  fill="rgba(148,155,164,0.4)"
                >
                  {d.dayLabel}
                </text>
              </g>
            );
          }

          const positive = d.totalPnl >= 0;
          const fill = positive ? "#34d399" : "#fb7185";
          const barTop = positive ? toY(d.totalPnl) : zeroY;
          const barHeight = Math.abs(toY(d.totalPnl) - zeroY);

          return (
            <g key={d.dayLabel}>
              <rect
                x={bx}
                y={barTop}
                width={barW}
                height={Math.max(2, barHeight)}
                fill={fill}
                rx="3"
                opacity={isHovered ? 1 : 0.78}
              />
              {/* Day label */}
              <text
                x={cx} y={h - 24}
                textAnchor="middle"
                fontSize="11"
                fontWeight={isHovered ? "600" : "400"}
                fill={isHovered ? "rgba(255,255,255,0.9)" : "rgba(148,155,164,0.85)"}
              >
                {d.dayLabel}
              </text>
              {/* Trade count below label */}
              <text
                x={cx} y={h - 10}
                textAnchor="middle"
                fontSize="9.5"
                fill="rgba(109,114,120,0.85)"
              >
                {d.closedTrades}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Tooltip */}
      {hovered !== null && data[hovered.idx].closedTrades > 0 && (() => {
        const d = data[hovered.idx];
        return (
          <div
            className="pointer-events-none absolute z-20 min-w-[168px] rounded-[14px] border border-white/10 bg-[#0d0e10] px-3 py-2.5 shadow-2xl"
            style={{
              left: hovered.x,
              top: hovered.y,
              transform: `translate(${hovered.flip ? "calc(-100% - 14px)" : "14px"}, -50%)`,
            }}
          >
            <p className="mb-1.5 text-[12px] font-semibold text-white">{d.dayLabel}</p>
            <div className="space-y-1">
              <div className="flex items-center justify-between gap-4">
                <span className="text-[11px] text-[#6d7278]">Total P&L</span>
                <span className={`text-[12px] font-semibold tabular-nums ${d.totalPnl >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                  {d.totalPnl >= 0 ? "+" : ""}{fmtCurrency(d.totalPnl)}
                </span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-[11px] text-[#6d7278]">Avg P&L</span>
                <span className={`text-[12px] font-medium tabular-nums ${d.avgPnl >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                  {d.avgPnl >= 0 ? "+" : ""}{fmtCurrency(d.avgPnl)}
                </span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-[11px] text-[#6d7278]">Win rate</span>
                <span className="text-[12px] font-medium text-[#b5bac1]">
                  {Math.round(d.winRate * 100)}%
                </span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-[11px] text-[#6d7278]">Trades</span>
                <span className="text-[12px] font-medium text-[#b5bac1]">{d.closedTrades}</span>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
