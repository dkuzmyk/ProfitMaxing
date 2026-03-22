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
};

export const demoTrades: DemoTrade[] = [
  {
    id: "demo-001",
    symbol: "NVDA",
    account: "Momentum Account",
    setup: "Opening Range Breakout",
    direction: "Long",
    openedAt: "2026-03-10T09:41:00-05:00",
    closedAt: "2026-03-10T10:18:00-05:00",
    entryPrice: 121.85,
    exitPrice: 124.24,
    quantity: 120,
    pnl: 286.8,
    pnlPercent: 1.96,
    tags: ["opening-bell", "clean-breakout", "high-volume"],
    thesis:
      "Pre-market strength held through the open and buyers defended the first pullback.",
    notes:
      "Good patience on entry. Added only after the reclaim confirmed instead of chasing the first candle.",
    mistakes: [],
    grade: "A",
  },
  {
    id: "demo-002",
    symbol: "TSLA",
    account: "Momentum Account",
    setup: "Failed Breakdown Reversal",
    direction: "Long",
    openedAt: "2026-03-11T10:07:00-05:00",
    closedAt: "2026-03-11T10:52:00-05:00",
    entryPrice: 178.2,
    exitPrice: 180.15,
    quantity: 90,
    pnl: 175.5,
    pnlPercent: 1.09,
    tags: ["reversal", "trend-change"],
    thesis:
      "The breakdown failed quickly and volume flipped in favor of buyers near VWAP.",
    notes:
      "Took partials correctly, then let the final piece close into resistance.",
    mistakes: [],
    grade: "A",
  },
  {
    id: "demo-003",
    symbol: "AAPL",
    account: "Core Account",
    setup: "VWAP Reclaim",
    direction: "Long",
    openedAt: "2026-03-12T11:04:00-05:00",
    closedAt: "2026-03-12T11:46:00-05:00",
    entryPrice: 214.75,
    exitPrice: 214.1,
    quantity: 150,
    pnl: -97.5,
    pnlPercent: -0.3,
    tags: ["midday", "vwap"],
    thesis:
      "Wanted continuation after reclaim, but momentum never expanded enough.",
    notes:
      "Exit was disciplined. Trade thesis was fine, but the time of day made follow-through less likely.",
    mistakes: ["entered too large for a midday setup"],
    grade: "B",
  },
  {
    id: "demo-004",
    symbol: "AMD",
    account: "Momentum Account",
    setup: "Gap and Go",
    direction: "Long",
    openedAt: "2026-03-13T09:38:00-05:00",
    closedAt: "2026-03-13T09:57:00-05:00",
    entryPrice: 136.48,
    exitPrice: 135.52,
    quantity: 180,
    pnl: -172.8,
    pnlPercent: -0.7,
    tags: ["gap-up", "opening-bell"],
    thesis:
      "Expected extension after the opening print, but the move lacked sustained bids.",
    notes:
      "This was slightly too aggressive. The loss stayed controlled because the stop was respected.",
    mistakes: ["chased before a proper pullback"],
    grade: "C",
  },
  {
    id: "demo-005",
    symbol: "META",
    account: "Core Account",
    setup: "Trend Continuation",
    direction: "Long",
    openedAt: "2026-03-14T12:16:00-05:00",
    closedAt: "2026-03-14T13:04:00-05:00",
    entryPrice: 488.3,
    exitPrice: 493.6,
    quantity: 55,
    pnl: 291.5,
    pnlPercent: 1.09,
    tags: ["afternoon", "higher-high"],
    thesis:
      "The stock held intraday trend structure and kept reclaiming shallow pullbacks.",
    notes:
      "Good execution and position sizing. This is the kind of trend trade worth reviewing.",
    mistakes: [],
    grade: "A",
  },
  {
    id: "demo-006",
    symbol: "SPY",
    account: "Core Account",
    setup: "Range Rejection",
    direction: "Short",
    openedAt: "2026-03-17T13:25:00-05:00",
    closedAt: "2026-03-17T14:01:00-05:00",
    entryPrice: 521.1,
    exitPrice: 518.95,
    quantity: 80,
    pnl: 172,
    pnlPercent: 0.41,
    tags: ["index", "mean-reversion"],
    thesis:
      "Price failed repeatedly at the same intraday level and buyers were losing urgency.",
    notes:
      "Solid short, but could have held the final piece longer after the level clearly broke.",
    mistakes: ["covered a bit early"],
    grade: "B",
  },
  {
    id: "demo-007",
    symbol: "AMZN",
    account: "Momentum Account",
    setup: "Breakout Pullback",
    direction: "Long",
    openedAt: "2026-03-18T10:29:00-05:00",
    closedAt: "2026-03-18T11:11:00-05:00",
    entryPrice: 192.4,
    exitPrice: 195.05,
    quantity: 110,
    pnl: 291.5,
    pnlPercent: 1.38,
    tags: ["pullback", "trend"],
    thesis:
      "The breakout held, volume stayed healthy, and the retest offered a much cleaner entry than the initial break.",
    notes:
      "Good example of letting the setup come to you rather than forcing the first move.",
    mistakes: [],
    grade: "A",
  },
  {
    id: "demo-008",
    symbol: "QQQ",
    account: "Core Account",
    setup: "Late-Day Fade",
    direction: "Short",
    openedAt: "2026-03-19T14:42:00-05:00",
    closedAt: "2026-03-19T15:21:00-05:00",
    entryPrice: 447.25,
    exitPrice: 448.05,
    quantity: 130,
    pnl: -104,
    pnlPercent: -0.18,
    tags: ["late-session", "fade"],
    thesis:
      "The market looked heavy, but the downside never expanded enough to justify staying in.",
    notes:
      "This was fine structurally, but the quality was average and should have been sized smaller.",
    mistakes: ["took a B setup with A-size"],
    grade: "B",
  },
];

export function getDemoTrades() {
  return [...demoTrades].sort(
    (left, right) =>
      new Date(right.openedAt).getTime() - new Date(left.openedAt).getTime(),
  );
}

export function getDemoTradeById(tradeId: string) {
  return demoTrades.find((trade) => trade.id === tradeId) ?? null;
}

function getTradeDurationMinutes(trade: DemoTrade) {
  const openedAt = new Date(trade.openedAt).getTime();
  const closedAt = new Date(trade.closedAt).getTime();

  return Math.max(1, Math.round((closedAt - openedAt) / 60000));
}

export function getDemoMetrics() {
  const trades = getDemoTrades();
  const wins = trades.filter((trade) => trade.pnl > 0);
  const losses = trades.filter((trade) => trade.pnl < 0);
  const grossProfit = wins.reduce((total, trade) => total + trade.pnl, 0);
  const grossLoss = losses.reduce((total, trade) => total + Math.abs(trade.pnl), 0);
  const totalPnl = trades.reduce((total, trade) => total + trade.pnl, 0);
  const averageHoldMinutes =
    trades.reduce((total, trade) => total + getTradeDurationMinutes(trade), 0) /
    trades.length;

  return {
    totalTrades: trades.length,
    totalPnl,
    winRate: wins.length / trades.length,
    averageWin: wins.length ? grossProfit / wins.length : 0,
    averageLoss: losses.length ? grossLoss / losses.length : 0,
    profitFactor: grossLoss ? grossProfit / grossLoss : grossProfit,
    averageHoldMinutes,
    bestTrade: trades.reduce((best, trade) => (trade.pnl > best.pnl ? trade : best)),
    worstTrade: trades.reduce((worst, trade) =>
      trade.pnl < worst.pnl ? trade : worst,
    ),
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
