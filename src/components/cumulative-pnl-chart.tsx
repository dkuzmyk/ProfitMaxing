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

  const rawRange = maxValue - minValue;
  const padding = rawRange * 0.12;

  return {
    min: minValue - padding,
    max: maxValue + padding,
  };
}

function formatChartDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}

function formatAxisValue(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: Math.abs(value) >= 1000 ? "compact" : "standard",
    maximumFractionDigits: Math.abs(value) >= 1000 ? 1 : 0,
  }).format(value);
}

function getTickIndexes(totalPoints: number, maxTicks: number) {
  if (totalPoints <= maxTicks) {
    return Array.from({ length: totalPoints }, (_, index) => index);
  }

  const indexes = new Set<number>();
  const step = (totalPoints - 1) / (maxTicks - 1);

  for (let index = 0; index < maxTicks; index += 1) {
    indexes.add(Math.round(index * step));
  }

  return Array.from(indexes).sort((left, right) => left - right);
}

export function CumulativePnlChart({ points }: CumulativePnlChartProps) {
  if (points.length === 0) {
    return (
      <div className="flex h-72 items-center justify-center rounded-[24px] border border-white/8 bg-[#1e1f22] text-sm text-[#949ba4]">
        No closed trades in this date range yet.
      </div>
    );
  }

  const chartWidth = 860;
  const chartHeight = 320;
  const margin = {
    top: 18,
    right: 20,
    bottom: 40,
    left: 68,
  };
  const values = points.map((point) => point.cumulativePnl);
  const { min, max } = clampRange(Math.min(...values, 0), Math.max(...values, 0));
  const usableWidth = chartWidth - margin.left - margin.right;
  const usableHeight = chartHeight - margin.top - margin.bottom;
  const stepX = points.length > 1 ? usableWidth / (points.length - 1) : 0;
  const valueRange = max - min;
  const yTickCount = 5;
  const yTicks = Array.from({ length: yTickCount }, (_, index) => {
    const ratio = index / (yTickCount - 1);
    const value = max - ratio * valueRange;
    const y = margin.top + ratio * usableHeight;

    return {
      value,
      y,
    };
  });
  const xTickIndexes = getTickIndexes(points.length, 6);
  const baselineY =
    margin.top + usableHeight - ((0 - min) / valueRange) * usableHeight;

  const coordinates = points.map((point, index) => {
    const x = margin.left + index * stepX;
    const y =
      margin.top +
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
    <div className="rounded-[24px] border border-white/8 bg-[#1e1f22] p-4 sm:p-5">
      <svg
        viewBox={`0 0 ${chartWidth} ${chartHeight}`}
        className="h-72 w-full"
        role="img"
        aria-label="Cumulative profit and loss chart"
      >
        {yTicks.map((tick) => (
          <g key={tick.y}>
            <line
              x1={margin.left}
              y1={tick.y}
              x2={chartWidth - margin.right}
              y2={tick.y}
              stroke="rgba(255,255,255,0.08)"
            />
            <text
              x={margin.left - 10}
              y={tick.y + 4}
              textAnchor="end"
              fontSize="11"
              fill="rgba(148,155,164,0.9)"
            >
              {formatAxisValue(tick.value)}
            </text>
          </g>
        ))}

        <line
          x1={margin.left}
          y1={baselineY}
          x2={chartWidth - margin.right}
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

        {xTickIndexes.map((index) => {
          const point = coordinates[index];

          return (
            <g key={point.id}>
              <line
                x1={point.x}
                y1={margin.top}
                x2={point.x}
                y2={chartHeight - margin.bottom}
                stroke="rgba(255,255,255,0.04)"
              />
              <text
                x={point.x}
                y={chartHeight - 12}
                textAnchor="middle"
                fontSize="11"
                fill="rgba(148,155,164,0.9)"
              >
                {formatChartDate(point.closedAt)}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
