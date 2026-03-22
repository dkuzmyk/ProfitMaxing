type ChartPoint = {
  id: string;
  symbol: string;
  closedAt: string;
  cumulativePnl: number;
};

type CumulativePnlChartProps = {
  points: ChartPoint[];
};

function clampRange(minValue: number, maxValue: number) {
  if (minValue === maxValue) {
    return {
      min: minValue - 1,
      max: maxValue + 1,
    };
  }

  return {
    min: minValue,
    max: maxValue,
  };
}

function formatChartDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}

export function CumulativePnlChart({ points }: CumulativePnlChartProps) {
  if (points.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center rounded-[24px] border border-white/8 bg-[#1e1f22] text-sm text-[#949ba4]">
        No closed trades in this date range yet.
      </div>
    );
  }

  const chartWidth = 760;
  const chartHeight = 240;
  const padding = 24;
  const values = points.map((point) => point.cumulativePnl);
  const { min, max } = clampRange(Math.min(...values, 0), Math.max(...values, 0));
  const usableWidth = chartWidth - padding * 2;
  const usableHeight = chartHeight - padding * 2;
  const stepX = points.length > 1 ? usableWidth / (points.length - 1) : 0;
  const valueRange = max - min;
  const baselineY =
    padding + usableHeight - ((0 - min) / valueRange) * usableHeight;

  const coordinates = points.map((point, index) => {
    const x = padding + index * stepX;
    const y =
      padding +
      usableHeight -
      ((point.cumulativePnl - min) / valueRange) * usableHeight;

    return {
      ...point,
      x,
      y,
    };
  });

  const polylinePoints = coordinates.map((point) => `${point.x},${point.y}`).join(" ");

  return (
    <div className="rounded-[24px] border border-white/8 bg-[#1e1f22] p-4">
      <svg
        viewBox={`0 0 ${chartWidth} ${chartHeight}`}
        className="h-64 w-full"
        role="img"
        aria-label="Cumulative profit and loss chart"
      >
        <line
          x1={padding}
          y1={baselineY}
          x2={chartWidth - padding}
          y2={baselineY}
          stroke="rgba(255,255,255,0.18)"
          strokeDasharray="6 6"
        />

        <polyline
          fill="none"
          stroke="#5865f2"
          strokeWidth="4"
          strokeLinejoin="round"
          strokeLinecap="round"
          points={polylinePoints}
        />

        {coordinates.map((point, index) => (
          <circle
            key={point.id}
            cx={point.x}
            cy={point.y}
            r={index === coordinates.length - 1 ? 5 : 4}
            fill={point.cumulativePnl >= 0 ? "#3ba55c" : "#ed4245"}
          />
        ))}
      </svg>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-xs text-[#949ba4]">
        <span>{formatChartDate(points[0].closedAt)}</span>
        <span>{formatChartDate(points[points.length - 1].closedAt)}</span>
      </div>
    </div>
  );
}
