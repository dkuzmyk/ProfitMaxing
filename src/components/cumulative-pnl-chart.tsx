"use client";

import { useRef, useState } from "react";

type ChartPoint = {
  id: string;
  symbol: string;
  closedAt: string;
  pnl: number;
  cumulativePnl: number;
};

type CumulativePnlChartProps = {
  points: ChartPoint[];
};

type HoverState = {
  idx: number;
  x: number;
  y: number;
  flip: boolean;
};

const W = 860;
const H = 300;
const PAD = { top: 18, right: 20, bottom: 40, left: 72 };
const CW = W - PAD.left - PAD.right;
const CH = H - PAD.top - PAD.bottom;

function clampRange(minValue: number, maxValue: number) {
  if (minValue === maxValue) {
    return { min: minValue - 1, max: maxValue + 1 };
  }
  const raw = maxValue - minValue;
  const padding = raw * 0.14;
  return { min: minValue - padding, max: maxValue + padding };
}

function formatChartDate(value: string) {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(
    new Date(value),
  );
}

function formatAxisValue(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: Math.abs(value) >= 10000 ? "compact" : "standard",
    maximumFractionDigits: Math.abs(value) >= 10000 ? 1 : 0,
  }).format(value);
}

function fmtCurrency(v: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(v);
}

function getTickIndexes(total: number, max: number) {
  if (total <= max) return Array.from({ length: total }, (_, i) => i);
  const set = new Set<number>();
  const step = (total - 1) / (max - 1);
  for (let i = 0; i < max; i++) set.add(Math.round(i * step));
  return Array.from(set).sort((a, b) => a - b);
}

export function CumulativePnlChart({ points }: CumulativePnlChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [hovered, setHovered] = useState<HoverState | null>(null);

  if (points.length === 0) {
    return (
      <div className="flex h-72 items-center justify-center rounded-[24px] border border-white/8 bg-[#1e1f22] text-sm text-[#949ba4]">
        No closed trades in this date range yet.
      </div>
    );
  }

  const values = points.map((p) => p.cumulativePnl);
  const { min, max } = clampRange(Math.min(...values, 0), Math.max(...values, 0));
  const range = max - min;
  const stepX = points.length > 1 ? CW / (points.length - 1) : 0;
  const yTickCount = 5;
  const yTicks = Array.from({ length: yTickCount }, (_, i) => {
    const ratio = i / (yTickCount - 1);
    return { value: max - ratio * range, y: PAD.top + ratio * CH };
  });
  const xTickIndexes = getTickIndexes(points.length, 6);
  const baselineY = PAD.top + CH - ((0 - min) / range) * CH;
  const clampedBaselineY = Math.max(PAD.top, Math.min(PAD.top + CH, baselineY));

  const coords = points.map((p, i) => ({
    ...p,
    x: PAD.left + i * stepX,
    y: PAD.top + CH - ((p.cumulativePnl - min) / range) * CH,
  }));

  const firstX = coords[0].x;
  const lastX = coords[coords.length - 1].x;
  const lastValue = points[points.length - 1].cumulativePnl;
  const areaColor = lastValue >= 0 ? "#5865f2" : "#fb7185";

  const linePart = coords.map((c) => `L ${c.x} ${c.y}`).join(" ");
  const areaPath = `M ${firstX} ${clampedBaselineY} ${linePart} L ${lastX} ${clampedBaselineY} Z`;
  const polylinePoints = coords.map((c) => `${c.x},${c.y}`).join(" ");

  function handleMouseMove(e: React.MouseEvent<SVGSVGElement>) {
    if (!svgRef.current || !containerRef.current) return;
    const svgRect = svgRef.current.getBoundingClientRect();
    const svgX = ((e.clientX - svgRect.left) / svgRect.width) * W;
    const svgY = ((e.clientY - svgRect.top) / svgRect.height) * H;

    if (svgX < PAD.left || svgX > W - PAD.right || svgY < PAD.top || svgY > H - PAD.bottom) {
      setHovered(null);
      return;
    }

    // Find nearest point by x distance
    const rawIdx = (svgX - PAD.left) / (stepX || 1);
    const idx = Math.max(0, Math.min(points.length - 1, Math.round(rawIdx)));
    const containerRect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - containerRect.left;
    const y = e.clientY - containerRect.top;
    setHovered({ idx, x, y, flip: x > containerRect.width * 0.55 });
  }

  const hp = hovered !== null ? coords[hovered.idx] : null;

  return (
    <div ref={containerRef} className="relative rounded-[24px] border border-white/8 bg-[#1e1f22] p-4 sm:p-5">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        className="h-72 w-full"
        role="img"
        aria-label="Cumulative profit and loss chart"
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHovered(null)}
      >
        <defs>
          <linearGradient
            id="cumul-area-grad"
            x1="0" y1={PAD.top}
            x2="0" y2={clampedBaselineY}
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0%" stopColor={areaColor} stopOpacity="0.28" />
            <stop offset="100%" stopColor={areaColor} stopOpacity="0.02" />
          </linearGradient>
        </defs>

        {/* Horizontal grid lines */}
        {yTicks.map((tick) => (
          <g key={tick.y}>
            <line
              x1={PAD.left} y1={tick.y}
              x2={W - PAD.right} y2={tick.y}
              stroke="rgba(255,255,255,0.07)" strokeWidth="1"
            />
            <text
              x={PAD.left - 10} y={tick.y + 4}
              textAnchor="end" fontSize="11" fill="rgba(148,155,164,0.9)"
            >
              {formatAxisValue(tick.value)}
            </text>
          </g>
        ))}

        {/* Zero baseline */}
        <line
          x1={PAD.left} y1={clampedBaselineY}
          x2={W - PAD.right} y2={clampedBaselineY}
          stroke="rgba(255,255,255,0.2)" strokeDasharray="5 5" strokeWidth="1"
        />

        {/* Area fill */}
        <path d={areaPath} fill="url(#cumul-area-grad)" />

        {/* Line */}
        <polyline
          fill="none"
          stroke="#5865f2"
          strokeWidth="2.5"
          strokeLinejoin="round"
          strokeLinecap="round"
          points={polylinePoints}
        />

        {/* Crosshair */}
        {hovered && hp && (
          <>
            <line
              x1={hp.x} y1={PAD.top}
              x2={hp.x} y2={PAD.top + CH}
              stroke="rgba(255,255,255,0.18)" strokeWidth="1" strokeDasharray="3 3"
            />
            <line
              x1={PAD.left} y1={hp.y}
              x2={W - PAD.right} y2={hp.y}
              stroke="rgba(255,255,255,0.1)" strokeWidth="1" strokeDasharray="3 3"
            />
          </>
        )}

        {/* Last point dot (hidden when hovering a different point) */}
        {coords.length > 0 && (!hovered || hovered.idx === coords.length - 1) && (
          <circle
            cx={coords[coords.length - 1].x}
            cy={coords[coords.length - 1].y}
            r={5}
            fill={lastValue >= 0 ? "#34d399" : "#fb7185"}
            stroke="#1e1f22"
            strokeWidth="2"
          />
        )}

        {/* Hover dot */}
        {hovered && hp && (
          <circle
            cx={hp.x}
            cy={hp.y}
            r={5}
            fill={hp.cumulativePnl >= 0 ? "#34d399" : "#fb7185"}
            stroke="#1e1f22"
            strokeWidth="2"
          />
        )}

        {/* Last value label */}
        {coords.length > 0 && !hovered && (
          <text
            x={Math.min(coords[coords.length - 1].x + 10, W - PAD.right - 2)}
            y={coords[coords.length - 1].y - 10}
            fontSize="11"
            fontWeight="600"
            fill={lastValue >= 0 ? "#34d399" : "#fb7185"}
            textAnchor={coords[coords.length - 1].x > W * 0.8 ? "end" : "start"}
          >
            {formatAxisValue(lastValue)}
          </text>
        )}

        {/* X tick labels */}
        {xTickIndexes.map((i) => {
          const pt = coords[i];
          return (
            <g key={pt.id}>
              <line
                x1={pt.x} y1={PAD.top}
                x2={pt.x} y2={H - PAD.bottom}
                stroke="rgba(255,255,255,0.04)"
              />
              <text
                x={pt.x} y={H - 12}
                textAnchor="middle" fontSize="11" fill="rgba(148,155,164,0.9)"
              >
                {formatChartDate(pt.closedAt)}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Tooltip */}
      {hovered && hp && (
        <div
          className="pointer-events-none absolute z-20 min-w-[180px] rounded-[14px] border border-white/10 bg-[#0d0e10] px-3 py-2.5 shadow-2xl"
          style={{
            left: hovered.x,
            top: hovered.y,
            transform: `translate(${hovered.flip ? "calc(-100% - 14px)" : "14px"}, -50%)`,
          }}
        >
          <p className="mb-0.5 text-[11px] font-medium text-white">{hp.symbol}</p>
          <p className="mb-1.5 text-[10px] text-[#6d7278]">{formatChartDate(hp.closedAt)}</p>
          <div className="space-y-1">
            <div className="flex items-center justify-between gap-4">
              <span className="text-[11px] text-[#6d7278]">Trade P&L</span>
              <span className={`text-[12px] font-semibold tabular-nums ${hp.pnl >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                {hp.pnl >= 0 ? "+" : ""}{fmtCurrency(hp.pnl)}
              </span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-[11px] text-[#6d7278]">Cumulative</span>
              <span className={`text-[12px] font-semibold tabular-nums ${hp.cumulativePnl >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                {hp.cumulativePnl >= 0 ? "+" : ""}{fmtCurrency(hp.cumulativePnl)}
              </span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-[11px] text-[#6d7278]">Trade #</span>
              <span className="text-[12px] font-medium text-[#b5bac1]">{hovered.idx + 1}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
