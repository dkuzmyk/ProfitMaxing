"use client";

import { useEffect, useRef, useState } from "react";

type PnlDistributionProps = {
  /** Realized P&L for every closed trade in the selected range */
  values: number[];
  /** Optional className applied to the outermost wrapper div */
  className?: string;
};

type HoverState = {
  bucketIdx: number;
  x: number;
  y: number;
  flip: boolean;
};

const PAD = { top: 14, right: 16, bottom: 42, left: 52 };
const BUCKETS = 14;

function fmtShort(v: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: "compact",
    maximumFractionDigits: 0,
  }).format(v);
}

function fmtCurrency(v: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(v);
}

export function PnlDistributionChart({ values, className }: PnlDistributionProps) {
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

  if (values.length === 0) {
    return (
      <div className={`flex min-h-[180px] items-center justify-center rounded-[24px] border border-white/8 bg-[#1e1f22] text-sm text-[#949ba4] ${className ?? ""}`}>
        No closed trades in this range yet.
      </div>
    );
  }

  const { w, h } = dims;
  const CW = w - PAD.left - PAD.right;
  const CH = h - PAD.top - PAD.bottom;

  const minVal = Math.min(...values);
  const maxVal = Math.max(...values);
  const domainPad = (maxVal - minVal) * 0.04 || 1;
  const domainMin = minVal - domainPad;
  const domainMax = maxVal + domainPad;
  const bucketSize = (domainMax - domainMin) / BUCKETS;

  const buckets = Array.from({ length: BUCKETS }, (_, i) => ({
    lo: domainMin + i * bucketSize,
    hi: domainMin + (i + 1) * bucketSize,
    mid: domainMin + (i + 0.5) * bucketSize,
    count: 0,
    winners: 0,
  }));

  for (const v of values) {
    const i = Math.min(BUCKETS - 1, Math.floor((v - domainMin) / bucketSize));
    if (i >= 0) {
      buckets[i].count++;
      if (v >= 0) buckets[i].winners++;
    }
  }

  const maxCount = Math.max(...buckets.map((b) => b.count), 1);
  const slotW = CW / BUCKETS;
  const barW = slotW * 0.78;
  const gap = slotW * 0.22;

  const yTickVals = [...new Set([0, 1, 2, 3].map((i) => Math.round((maxCount / 3) * i)))];
  const zeroX = PAD.left + ((-domainMin) / (domainMax - domainMin)) * CW;
  const showZeroLine = domainMin < 0 && domainMax > 0;

  function handleMouseMove(e: React.MouseEvent<SVGSVGElement>) {
    if (!svgRef.current || !containerRef.current) return;
    const svgRect = svgRef.current.getBoundingClientRect();
    const svgX = e.clientX - svgRect.left;
    const svgY = e.clientY - svgRect.top;

    if (svgX < PAD.left || svgX > w - PAD.right || svgY < PAD.top || svgY > h - PAD.bottom) {
      setHovered(null);
      return;
    }

    const idx = Math.floor((svgX - PAD.left) / slotW);
    const clampedIdx = Math.max(0, Math.min(BUCKETS - 1, idx));
    if (buckets[clampedIdx].count === 0) {
      setHovered(null);
      return;
    }

    const containerRect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - containerRect.left;
    const y = e.clientY - containerRect.top;
    setHovered({ bucketIdx: clampedIdx, x, y, flip: x > containerRect.width * 0.55 });
  }

  const hb = hovered !== null ? buckets[hovered.bucketIdx] : null;

  return (
    <div ref={containerRef} className={`relative rounded-[24px] border border-white/8 bg-[#1e1f22] p-4 sm:p-5 ${className ?? ""}`}>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${w} ${h}`}
        className="h-full w-full min-h-[180px]"
        role="img"
        aria-label="P&amp;L distribution histogram"
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHovered(null)}
      >
        {/* Subtle grid lines */}
        {yTickVals.map((v, i) => {
          const y = PAD.top + CH - (v / maxCount) * CH;
          return (
            <g key={i}>
              <line
                x1={PAD.left} y1={y}
                x2={w - PAD.right} y2={y}
                stroke="rgba(255,255,255,0.06)" strokeWidth="1"
              />
              <text x={PAD.left - 6} y={y + 4} textAnchor="end" fontSize="11" fill="rgba(148,155,164,0.8)">
                {v}
              </text>
            </g>
          );
        })}

        {/* Zero-crossing vertical line */}
        {showZeroLine && (
          <line
            x1={zeroX} y1={PAD.top}
            x2={zeroX} y2={PAD.top + CH}
            stroke="rgba(255,255,255,0.18)" strokeWidth="1" strokeDasharray="4 4"
          />
        )}

        {/* Hover column highlight */}
        {hovered !== null && (
          <rect
            x={PAD.left + hovered.bucketIdx * slotW}
            y={PAD.top}
            width={slotW}
            height={CH}
            fill="rgba(255,255,255,0.04)"
            rx="2"
          />
        )}

        {/* Bars */}
        {buckets.map((b, i) => {
          if (b.count === 0) return null;
          const barH = (b.count / maxCount) * CH;
          const bx = PAD.left + i * slotW + gap / 2;
          const by = PAD.top + CH - barH;
          const positive = b.mid >= 0;
          const fill = positive ? "#34d399" : "#fb7185";
          const isHovered = hovered?.bucketIdx === i;

          return (
            <rect
              key={i}
              x={bx} y={by}
              width={barW} height={barH}
              fill={fill}
              rx="2"
              opacity={isHovered ? 1 : 0.82}
              stroke={isHovered ? fill : "none"}
              strokeWidth={isHovered ? 1 : 0}
              strokeOpacity={0.5}
            />
          );
        })}

        {/* X axis: lo, midpoint, hi labels */}
        {[0, Math.floor(BUCKETS / 2), BUCKETS - 1].map((i) => {
          const cx = PAD.left + (i + 0.5) * slotW;
          return (
            <text key={i} x={cx} y={h - 10} textAnchor="middle" fontSize="11" fill="rgba(148,155,164,0.85)">
              {fmtShort(buckets[i].mid)}
            </text>
          );
        })}

        {/* Baseline */}
        <line
          x1={PAD.left} y1={PAD.top + CH}
          x2={w - PAD.right} y2={PAD.top + CH}
          stroke="rgba(255,255,255,0.12)" strokeWidth="1"
        />
      </svg>

      {/* Tooltip */}
      {hovered && hb && hb.count > 0 && (
        <div
          className="pointer-events-none absolute z-20 min-w-[170px] rounded-[14px] border border-white/10 bg-[#0d0e10] px-3 py-2.5 shadow-2xl"
          style={{
            left: hovered.x,
            top: hovered.y,
            transform: `translate(${hovered.flip ? "calc(-100% - 14px)" : "14px"}, -50%)`,
          }}
        >
          <p className="mb-1.5 text-[11px] font-medium text-white">
            {fmtCurrency(hb.lo)} → {fmtCurrency(hb.hi)}
          </p>
          <div className="space-y-1">
            <div className="flex items-center justify-between gap-4">
              <span className="text-[11px] text-[#6d7278]">Trades</span>
              <span className="text-[12px] font-medium text-[#b5bac1]">{hb.count}</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-[11px] text-[#6d7278]">% of total</span>
              <span className="text-[12px] font-medium text-[#b5bac1]">
                {((hb.count / values.length) * 100).toFixed(1)}%
              </span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-[11px] text-[#6d7278]">Winners</span>
              <span className={`text-[12px] font-medium tabular-nums ${hb.winners > 0 ? "text-emerald-400" : "text-[#b5bac1]"}`}>
                {hb.winners} / {hb.count}
              </span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-[11px] text-[#6d7278]">Range</span>
              <span className={`text-[12px] font-medium ${hb.mid >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                {hb.mid >= 0 ? "Profit" : "Loss"}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
