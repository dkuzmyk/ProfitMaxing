import {
  filterTradesByRange,
  getCumulativePnlSeries,
  getStoredTradeMetrics,
  type StoredTrade,
  type TradeRange,
} from "@/lib/trade-metrics";

export type DemoTradeDirection = "Long" | "Short";

export type DemoTrade = {
  id: string;
  symbol: string;
  account: string;
  setup: string;
  direction: DemoTradeDirection;
  openedAt: string;
  closedAt: string;
  entryPrice: number;
  exitPrice: number;
  quantity: number;
  pnl: number;
  pnlPercent: number;
  tags: string[];
  thesis: string;
  notes: string;
  mistakes: string[];
  grade: "A" | "B" | "C";
  followedPlan: boolean;
  confidenceRating: 1 | 2 | 3 | 4 | 5;
};

const DEMO_TRADE_COUNT = 208;
const DEMO_TARGET_TOTAL_PNL = 12_480;

const symbolCatalog = [
  { symbol: "NVDA", basePrice: 126, account: "Momentum Account" },
  { symbol: "TSLA", basePrice: 182, account: "Momentum Account" },
  { symbol: "META", basePrice: 494, account: "Core Account" },
  { symbol: "AMD", basePrice: 138, account: "Momentum Account" },
  { symbol: "AAPL", basePrice: 214, account: "Core Account" },
  { symbol: "AMZN", basePrice: 191, account: "Momentum Account" },
  { symbol: "SPY", basePrice: 521, account: "Core Account" },
  { symbol: "QQQ", basePrice: 447, account: "Core Account" },
  { symbol: "MSFT", basePrice: 421, account: "Core Account" },
  { symbol: "PLTR", basePrice: 29, account: "Momentum Account" },
  { symbol: "COIN", basePrice: 214, account: "Momentum Account" },
  { symbol: "SMCI", basePrice: 882, account: "Momentum Account" },
] as const;

const setupCatalog = [
  {
    name: "Opening Range Breakout",
    edge: 0.62,
    defaultDirection: "Long" as const,
    tags: ["opening-bell", "breakout", "high-volume"],
    mistakePool: ["chased the break", "sized too large", "entered before confirmation"],
    thesis:
      "Early momentum held above the opening range and volume confirmed continuation.",
  },
  {
    name: "VWAP Reclaim",
    edge: 0.41,
    defaultDirection: "Long" as const,
    tags: ["vwap", "reclaim", "midday"],
    mistakePool: ["entered too early", "ignored weak tape", "held through a failed reclaim"],
    thesis:
      "Price reclaimed VWAP cleanly and buyers defended the first pullback into support.",
  },
  {
    name: "Trend Continuation",
    edge: 0.56,
    defaultDirection: "Long" as const,
    tags: ["trend", "continuation", "higher-high"],
    mistakePool: ["trimmed too early", "added too late", "overstayed after extension"],
    thesis:
      "The trend stayed orderly and continuation offered a repeatable higher-probability entry.",
  },
  {
    name: "Range Rejection",
    edge: 0.33,
    defaultDirection: "Short" as const,
    tags: ["rejection", "range", "mean-reversion"],
    mistakePool: ["covered too early", "fought the trend", "ignored the failed rejection"],
    thesis:
      "Price failed repeatedly at the same level and the rejection offered asymmetric downside.",
  },
  {
    name: "Breakout Pullback",
    edge: 0.48,
    defaultDirection: "Long" as const,
    tags: ["pullback", "trend", "continuation"],
    mistakePool: ["missed the cleaner retest", "forced size into a weak retest", "bought too extended"],
    thesis:
      "The breakout held and the retest offered a cleaner entry than the initial expansion candle.",
  },
  {
    name: "Late-Day Fade",
    edge: 0.24,
    defaultDirection: "Short" as const,
    tags: ["late-session", "fade", "exhaustion"],
    mistakePool: ["faded too early", "ignored closing strength", "used A-size on a B setup"],
    thesis:
      "The move looked exhausted late in the session and the fade worked once buyers lost urgency.",
  },
] as const;

const rawReturnProfile = [
  1.45, -0.84, 0.66, 1.18, -0.42, 0.91, 0.38, 1.62, -1.07, 0.74, 1.03, -0.25,
  0.58, 1.27, -0.63, 0.81, 0.49, 1.36, -0.54, 0.94,
] as const;

const openTimeSlots = [
  { hour: 9, minute: 41 },
  { hour: 10, minute: 7 },
  { hour: 10, minute: 29 },
  { hour: 11, minute: 4 },
  { hour: 12, minute: 16 },
  { hour: 13, minute: 25 },
  { hour: 14, minute: 42 },
] as const;

function roundTo(value: number, decimals: number) {
  const factor = 10 ** decimals;

  return Math.round(value * factor) / factor;
}

function clamp(value: number, minValue: number, maxValue: number) {
  return Math.min(maxValue, Math.max(minValue, value));
}

function getRecentTradingDates(count: number) {
  const end = new Date();
  const start = new Date(end);
  start.setDate(start.getDate() - 365);
  start.setHours(0, 0, 0, 0);

  const weekdays: Date[] = [];

  for (
    const cursor = new Date(start);
    cursor <= end;
    cursor.setDate(cursor.getDate() + 1)
  ) {
    const day = cursor.getDay();

    if (day !== 0 && day !== 6) {
      weekdays.push(new Date(cursor));
    }
  }

  const step = (weekdays.length - 1) / (count - 1);

  return Array.from({ length: count }, (_, index) => {
    const sampledIndex = Math.floor(index * step);

    return new Date(weekdays[sampledIndex]);
  });
}

function setLocalTime(date: Date, hour: number, minute: number) {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    hour,
    minute,
    0,
    0,
  );
}

function toStoredTrade(trade: DemoTrade): StoredTrade {
  return {
    id: trade.id,
    symbol: trade.symbol,
    direction: trade.direction,
    entry_price: trade.entryPrice,
    exit_price: trade.exitPrice,
    quantity: trade.quantity,
    opened_at: trade.openedAt,
    closed_at: trade.closedAt,
  };
}

function buildDemoTrades() {
  const tradingDates = getRecentTradingDates(DEMO_TRADE_COUNT);
  const draftTrades = tradingDates.map((tradingDate, index) => {
    const setup = setupCatalog[index % setupCatalog.length];
    const symbolConfig =
      symbolCatalog[(index * 3 + index % setupCatalog.length) % symbolCatalog.length];
    const timeSlot = openTimeSlots[index % openTimeSlots.length];
    const openedAt = setLocalTime(tradingDate, timeSlot.hour, timeSlot.minute);
    const holdMinutes = 18 + (index % 6) * 11 + (index % 4) * 7;
    const closedAt = new Date(openedAt.getTime() + holdMinutes * 60000);
    const direction =
      setup.defaultDirection === "Short" && index % 5 !== 0
        ? "Short"
        : index % 11 === 0
          ? "Short"
          : "Long";
    const entryPrice = roundTo(
      symbolConfig.basePrice *
        (1 + ((index % 17) - 8) * 0.008 + (index % setupCatalog.length) * 0.0025),
      2,
    );
    const targetValue =
      4_800 + (index % 7) * 820 + (index % setupCatalog.length) * 360;
    const quantity = Math.max(8, Math.round(targetValue / entryPrice));
    const entryValue = entryPrice * quantity;
    const rawPnlPercent =
      setup.edge +
      rawReturnProfile[index % rawReturnProfile.length] +
      ((index % 5) - 2) * 0.06;
    const followedPlan = index % 5 !== 0 && rawPnlPercent > -0.7;

    return {
      index,
      setup,
      symbolConfig,
      openedAt,
      closedAt,
      holdMinutes,
      direction,
      entryPrice,
      quantity,
      entryValue,
      rawPnlPercent,
      followedPlan,
    };
  });

  const rawTotalPnl = draftTrades.reduce(
    (total, trade) => total + (trade.entryValue * trade.rawPnlPercent) / 100,
    0,
  );
  const scaleFactor = DEMO_TARGET_TOTAL_PNL / rawTotalPnl;

  return draftTrades.map((trade) => {
    const pnlPercent = roundTo(
      clamp(trade.rawPnlPercent * scaleFactor, -1.65, 2.45),
      2,
    );
    const pnl = roundTo((trade.entryValue * pnlPercent) / 100, 2);
    const exitPrice = roundTo(
      trade.direction === "Long"
        ? trade.entryPrice * (1 + pnlPercent / 100)
        : trade.entryPrice * (1 - pnlPercent / 100),
      2,
    );
    const sessionTag =
      trade.openedAt.getHours() < 10
        ? "opening-bell"
        : trade.openedAt.getHours() < 12
          ? "mid-morning"
          : trade.openedAt.getHours() < 14
            ? "midday"
            : "late-session";
    const tags = Array.from(
      new Set([
        ...trade.setup.tags,
        sessionTag,
        trade.direction === "Long" ? "bullish" : "bearish",
      ]),
    );
    const mistakes = trade.followedPlan
      ? pnl < 0 && trade.index % 9 === 0
        ? ["market conditions shifted after entry"]
        : []
      : [trade.setup.mistakePool[trade.index % trade.setup.mistakePool.length]];
    const confidenceRating = clamp(
      Math.round(3 + pnlPercent / 0.9 + (trade.followedPlan ? 0.5 : -0.5)),
      1,
      5,
    ) as 1 | 2 | 3 | 4 | 5;
    const grade: DemoTrade["grade"] =
      pnlPercent >= 1.1 && trade.followedPlan
        ? "A"
        : pnlPercent >= 0
          ? "B"
          : "C";

    return {
      id: `demo-${String(trade.index + 1).padStart(3, "0")}`,
      symbol: trade.symbolConfig.symbol,
      account: trade.symbolConfig.account,
      setup: trade.setup.name,
      direction: trade.direction,
      openedAt: trade.openedAt.toISOString(),
      closedAt: trade.closedAt.toISOString(),
      entryPrice: trade.entryPrice,
      exitPrice,
      quantity: trade.quantity,
      pnl,
      pnlPercent,
      tags,
      thesis: trade.setup.thesis,
      notes: trade.followedPlan
        ? "Execution stayed close to plan and the trade was managed with controlled size."
        : "The idea had merit, but discipline slipped enough to lower the quality of the result.",
      mistakes,
      grade,
      followedPlan: trade.followedPlan,
      confidenceRating,
    } satisfies DemoTrade;
  });
}

export const demoTrades: DemoTrade[] = buildDemoTrades();

export function getDemoTrades() {
  return [...demoTrades].sort(
    (left, right) =>
      new Date(right.openedAt).getTime() - new Date(left.openedAt).getTime(),
  );
}

export function getDemoTradeById(tradeId: string) {
  return demoTrades.find((trade) => trade.id === tradeId) ?? null;
}

function getStoredDemoTrades() {
  return getDemoTrades().map(toStoredTrade);
}

function getTradeDurationMinutes(trade: DemoTrade) {
  const openedAt = new Date(trade.openedAt).getTime();
  const closedAt = new Date(trade.closedAt).getTime();

  return Math.max(1, Math.round((closedAt - openedAt) / 60000));
}

export function getDemoMetrics(range: TradeRange = "30d") {
  const filteredStoredTrades = filterTradesByRange(getStoredDemoTrades(), range);
  const filteredIds = new Set(filteredStoredTrades.map((trade) => trade.id));
  const filteredTrades = getDemoTrades().filter((trade) => filteredIds.has(trade.id));
  const metrics = getStoredTradeMetrics(filteredStoredTrades);
  const bestTrade = filteredTrades.reduce<DemoTrade | null>(
    (best, trade) => (!best || trade.pnl > best.pnl ? trade : best),
    null,
  );
  const worstTrade = filteredTrades.reduce<DemoTrade | null>(
    (worst, trade) => (!worst || trade.pnl < worst.pnl ? trade : worst),
    null,
  );
  const averageHoldMinutes = filteredTrades.length
    ? filteredTrades.reduce((total, trade) => total + getTradeDurationMinutes(trade), 0) /
      filteredTrades.length
    : 0;

  return {
    ...metrics,
    totalPnl: metrics.totalClosedPnl,
    averageHoldMinutes,
    bestTrade,
    worstTrade,
    trades: filteredTrades,
    cumulativeSeries: getCumulativePnlSeries(filteredStoredTrades),
  };
}

export function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatPercent(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "percent",
    maximumFractionDigits: 1,
  }).format(value);
}

export function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}
