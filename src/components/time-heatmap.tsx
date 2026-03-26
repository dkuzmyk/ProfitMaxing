"use client";

import { useRef, useState } from "react";

type HeatmapCell = {
  hour: number;
  count: number;
  winRate: number;
  totalPnl: number;
  avgPnl: number;
};

type HeatmapDay = {
  day: number;
  dayLabel: string;
  hours: HeatmapCell[];
};

type Props = {
  data: HeatmapDay[];
};

type HoverState = {
  day: number;
  hour: number;
  x: number;
  y: number;
  flip: boolean;
  flipY: boolean;
};

const W = 860;
const H = 224;
const PAD = { top: 20, right: 16, bottom: 36, left: 44 };
const CW = W - PAD.left - PAD.right; // 800
const CH = H - PAD.top - PAD.bottom; // 168
const DAYS = 7;
const HOURS = 24;
const CELL_W = CW / HOURS;
const CELL_H = CH / DAYS;
const GAP = 2;

const HOUR_TICKS = [
  { hour: 0, label: "12a" },
  { hour: 4, label: "4a" },
  { hour: 8, label: "8a" },
  { hour: 12, label: "12p" },
  { hour: 16, label: "4p" },
  { hour: 20, label: "8p" },
];

function fmtCurrency(v: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(v);
}

function fmtHour(h: number) {
  if (h === 0) return "12:00 AM";
  if (h === 12) return "12:00 PM";
  return h < 12 ? `${h}:00 AM` : `${h - 12}:00 PM`;
}

export function TimeHeatmap({ data }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [hovered, setHovered] = useState<HoverState | null>(null);

  let maxAbsAvgPnl = 0;
  let hasData = false;

  for (const dayData of data) {
    for (const cell of dayData.hours) {
      if (cell.count > 0) {
        hasData = true;
        if (Math.abs(cell.avgPnl) > maxAbsAvgPnl) {
          maxAbsAvgPnl = Math.abs(cell.avgPnl);
        }
      }
    }
  }

  if (!hasData) {
    return (
      <div className="flex h-48 items-center justify-center rounded-[24px] border border-white/8 bg-[#1e1f22] text-sm text-[#949ba4]">
        No trade data in this range yet.
      </div>
    );
  }

  function handleMouseMove(e: React.MouseEvent<SVGSVGElement>) {
    if (!svgRef.current || !containerRef.current) return;
    const svgRect = svgRef.current.getBoundingClientRect();
    const svgX = ((e.clientX - svgRect.left) / svgRect.width) * W;
    const svgY = ((e.clientY - svgRect.top) / svgRect.height) * H;

    if (svgX < PAD.left || svgX > W - PAD.right || svgY < PAD.top || svgY > H - PAD.bottom) {
      setHovered(null);
      return;
    }

    const hour = Math.max(0, Math.min(HOURS - 1, Math.floor((svgX - PAD.left) / CELL_W)));
    const day = Math.max(0, Math.min(DAYS - 1, Math.floor((svgY - PAD.top) / CELL_H)));

    const dayData = data[day];
    const cell = dayData?.hours[hour];
    if (!cell || cell.count === 0) {
      setHovered(null);
      return;
    }

    const containerRect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - containerRect.left;
    const y = e.clientY - containerRect.top;
    setHovered({
      day,
      hour,
      x,
      y,
      flip: x > containerRect.width * 0.55,
      flipY: y > containerRect.height * 0.6,
    });
  }

  const hDay = hovered !== null ? data[hovered.day] : null;
  const hCell = hDay?.hours[hovered?.hour ?? -1] ?? null;

  return (
    <div ref={containerRef} className="relative rounded-[24px] border border-white/8 bg-[#1e1f22] p-4 sm:p-5">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        className="h-[224px] w-full"
        role="img"
        aria-label="Time of day heatmap"
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHovered(null)}
      >
        {/* Day labels */}
        {data.map((dayData) => (
          <text
            key={`day-${dayData.day}`}
            x={PAD.left - 6}
            y={PAD.top + dayData.day * CELL_H + CELL_H / 2 + 4}
            textAnchor="end"
            fontSize="10"
            fill={hovered?.day === dayData.day ? "rgba(255,255,255,0.9)" : "rgba(148,155,164,0.85)"}
          >
            {dayData.dayLabel}
          </text>
        ))}

        {/* Hour labels */}
        {HOUR_TICKS.map(({ hour, label }) => (
          <text
            key={`hour-${hour}`}
            x={PAD.left + hour * CELL_W + CELL_W / 2}
            y={H - 10}
            textAnchor="middle"
            fontSize="10"
            fill={hovered?.hour === hour ? "rgba(255,255,255,0.9)" : "rgba(148,155,164,0.85)"}
          >
            {label}
          </text>
        ))}

        {/* Cells */}
        {data.map((dayData) =>
          dayData.hours.map((cell) => {
            const x = PAD.left + cell.hour * CELL_W + GAP / 2;
            const y = PAD.top + dayData.day * CELL_H + GAP / 2;
            const w = CELL_W - GAP;
            const h = CELL_H - GAP;
            const isHovered = hovered?.day === dayData.day && hovered?.hour === cell.hour;

            if (cell.count === 0) {
              return (
                <rect
                  key={`${dayData.day}-${cell.hour}`}
                  x={x} y={y}
                  width={w} height={h}
                  fill="rgba(255,255,255,0.03)"
                  rx="2"
                />
              );
            }

            const intensity =
              maxAbsAvgPnl > 0
                ? Math.min(1, Math.abs(cell.avgPnl) / maxAbsAvgPnl)
                : 0;
            const opacity = isHovered ? 1 : 0.18 + intensity * 0.72;
            const fill = cell.avgPnl >= 0 ? "#34d399" : "#fb7185";

            return (
              <rect
                key={`${dayData.day}-${cell.hour}`}
                x={x} y={y}
                width={w} height={h}
                fill={fill}
                opacity={opacity}
                rx="2"
                stroke={isHovered ? fill : "none"}
                strokeWidth={isHovered ? 1 : 0}
                strokeOpacity={0.8}
              />
            );
          }),
        )}
      </svg>

      {/* Tooltip */}
      {hovered && hCell && hDay && (
        <div
          className="pointer-events-none absolute z-20 min-w-[170px] rounded-[14px] border border-white/10 bg-[#0d0e10] px-3 py-2.5 shadow-2xl"
          style={{
            left: hovered.x,
            top: hovered.y,
            transform: `translate(${hovered.flip ? "calc(-100% - 14px)" : "14px"}, ${hovered.flipY ? "calc(-100% - 10px)" : "10px"})`,
          }}
        >
          <p className="mb-0.5 text-[11px] font-medium text-white">{hDay.dayLabel}</p>
          <p className="mb-1.5 text-[10px] text-[#6d7278]">{fmtHour(hovered.hour)}</p>
          <div className="space-y-1">
            <div className="flex items-center justify-between gap-4">
              <span className="text-[11px] text-[#6d7278]">Trades</span>
              <span className="text-[12px] font-medium text-[#b5bac1]">{hCell.count}</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-[11px] text-[#6d7278]">Avg P&L</span>
              <span className={`text-[12px] font-semibold tabular-nums ${hCell.avgPnl >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                {hCell.avgPnl >= 0 ? "+" : ""}{fmtCurrency(hCell.avgPnl)}
              </span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-[11px] text-[#6d7278]">Total P&L</span>
              <span className={`text-[12px] font-medium tabular-nums ${hCell.totalPnl >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                {hCell.totalPnl >= 0 ? "+" : ""}{fmtCurrency(hCell.totalPnl)}
              </span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-[11px] text-[#6d7278]">Win rate</span>
              <span className="text-[12px] font-medium text-[#b5bac1]">
                {Math.round(hCell.winRate * 100)}%
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
