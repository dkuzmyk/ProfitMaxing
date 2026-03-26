export type StoredTrade = {
  id: string;
  symbol: string;
  direction: "Long" | "Short";
  entry_price: number | string;
  exit_price: number | string | null;
  quantity: number;
  opened_at: string;
  closed_at: string | null;
};

export type ClosedTrade = StoredTrade & {
  exit_price: number | string;
  closed_at: string;
  pnl: number;
};

export type TradeRange =
  | "1d"
  | "7d"
  | "30d"
  | "90d"
  | "ytd"
  | "1y"
  | "5y"
  | "all";

function toNumber(value: number | string) {
  return typeof value === "number" ? value : Number(value);
}

export function getTradeMarketValue(trade: StoredTrade) {
  return toNumber(trade.entry_price) * trade.quantity;
}

export function getTradePnl(trade: StoredTrade) {
  if (trade.exit_price == null) {
    return null;
  }

  const entryPrice = toNumber(trade.entry_price);
  const exitPrice = toNumber(trade.exit_price);
  const priceDelta =
    trade.direction === "Long" ? exitPrice - entryPrice : entryPrice - exitPrice;

  return priceDelta * trade.quantity;
}

export function getTradePnlPercent(trade: StoredTrade) {
  const pnl = getTradePnl(trade);
  const marketValue = getTradeMarketValue(trade);

  if (pnl == null || marketValue <= 0) {
    return null;
  }

  return pnl / marketValue;
}

export function isClosedTrade(trade: StoredTrade): trade is ClosedTrade {
  return trade.exit_price != null && trade.closed_at != null;
}

export function getTradeDurationMinutes(trade: StoredTrade) {
  if (!trade.closed_at) {
    return null;
  }

  const openedAt = new Date(trade.opened_at).getTime();
  const closedAt = new Date(trade.closed_at).getTime();

  return Math.max(1, Math.round((closedAt - openedAt) / 60000));
}

export function getStoredTradeMetrics(trades: StoredTrade[]) {
  const closedTrades = trades
    .filter(isClosedTrade)
    .map((trade) => ({
      ...trade,
      pnl: getTradePnl(trade) ?? 0,
      marketValue: getTradeMarketValue(trade),
    }));
  const openTrades = trades.filter((trade) => !isClosedTrade(trade));
  const winningTrades = closedTrades.filter((trade) => trade.pnl > 0);
  const losingTrades = closedTrades.filter((trade) => trade.pnl < 0);
  const grossProfit = winningTrades.reduce((total, trade) => total + trade.pnl, 0);
  const grossLoss = losingTrades.reduce(
    (total, trade) => total + Math.abs(trade.pnl),
    0,
  );
  const totalClosedPnl = closedTrades.reduce((total, trade) => total + trade.pnl, 0);
  const totalClosedMarketValue = closedTrades.reduce(
    (total, trade) => total + trade.marketValue,
    0,
  );
  const totalMoneyTraded = trades.reduce(
    (total, trade) => total + getTradeMarketValue(trade),
    0,
  );
  const totalCurrentlyInvested = openTrades.reduce(
    (total, trade) => total + getTradeMarketValue(trade),
    0,
  );
  const averageHoldMinutes = closedTrades.length
    ? closedTrades.reduce(
        (total, trade) => total + (getTradeDurationMinutes(trade) ?? 0),
        0,
      ) / closedTrades.length
    : 0;

  return {
    totalTrades: trades.length,
    openTrades: openTrades.length,
    closedTrades: closedTrades.length,
    totalClosedPnl,
    totalClosedMarketValue,
    totalMoneyTraded,
    totalCurrentlyInvested,
    pnlPercent: totalClosedMarketValue
      ? totalClosedPnl / totalClosedMarketValue
      : 0,
    returnPercent: totalMoneyTraded ? totalClosedPnl / totalMoneyTraded : 0,
    winRate: closedTrades.length ? winningTrades.length / closedTrades.length : 0,
    averageWin: winningTrades.length ? grossProfit / winningTrades.length : 0,
    averageLoss: losingTrades.length ? grossLoss / losingTrades.length : 0,
    profitFactor: grossLoss ? grossProfit / grossLoss : grossProfit,
    averageHoldMinutes,
    bestTrade: closedTrades.length
      ? closedTrades.reduce((best, trade) => (trade.pnl > best.pnl ? trade : best))
      : null,
    worstTrade: closedTrades.length
      ? closedTrades.reduce((worst, trade) => (trade.pnl < worst.pnl ? trade : worst))
      : null,
  };
}

export function normalizeTradeRange(value: string | undefined): TradeRange {
  return value === "1d" ||
    value === "7d" ||
    value === "30d" ||
    value === "90d" ||
    value === "ytd" ||
    value === "1y" ||
    value === "5y" ||
    value === "all"
    ? value
    : "30d";
}

export function getTradeRangeCutoff(range: TradeRange) {
  if (range === "all") {
    return null;
  }

  const cutoff = new Date();

  if (range === "ytd") {
    cutoff.setMonth(0, 1);
    cutoff.setHours(0, 0, 0, 0);
    return cutoff;
  }

  if (range === "1d") {
    cutoff.setDate(cutoff.getDate() - 1);
  } else if (range === "7d") {
    cutoff.setDate(cutoff.getDate() - 7);
  } else if (range === "30d") {
    cutoff.setDate(cutoff.getDate() - 30);
  } else if (range === "90d") {
    cutoff.setDate(cutoff.getDate() - 90);
  } else if (range === "1y") {
    cutoff.setFullYear(cutoff.getFullYear() - 1);
  } else if (range === "5y") {
    cutoff.setFullYear(cutoff.getFullYear() - 5);
  }

  return cutoff;
}

export function getTradeRangeLabel(range: TradeRange) {
  switch (range) {
    case "1d":
      return "Last 1 day";
    case "7d":
      return "Last 7 days";
    case "30d":
      return "Last 30 days";
    case "90d":
      return "Last 90 days";
    case "ytd":
      return "Year to date";
    case "1y":
      return "Last 1 year";
    case "5y":
      return "Last 5 years";
    case "all":
      return "All time";
  }
}

export function filterTradesByRange(trades: StoredTrade[], range: TradeRange) {
  const cutoff = getTradeRangeCutoff(range);

  if (!cutoff) {
    return trades;
  }

  return trades.filter((trade) => {
    const anchor = trade.closed_at ?? trade.opened_at;

    return new Date(anchor).getTime() >= cutoff.getTime();
  });
}

export type DailyPnlPoint = {
  date: string;
  pnl: number;
  tradeCount: number;
};

export function getDailyPnlSeries(trades: StoredTrade[]): DailyPnlPoint[] {
  const byDate = new Map<string, { pnl: number; count: number }>();

  for (const trade of trades) {
    if (!isClosedTrade(trade)) continue;
    const date = trade.closed_at.slice(0, 10);
    const pnl = getTradePnl(trade) ?? 0;
    const current = byDate.get(date) ?? { pnl: 0, count: 0 };
    byDate.set(date, { pnl: current.pnl + pnl, count: current.count + 1 });
  }

  return Array.from(byDate.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, { pnl, count }]) => ({ date, pnl, tradeCount: count }));
}

export function getCumulativePnlSeries(trades: StoredTrade[]) {
  const closedTrades = trades
    .filter(isClosedTrade)
    .map((trade) => ({
      ...trade,
      pnl: getTradePnl(trade) ?? 0,
    }))
    .sort(
      (left, right) =>
        new Date(left.closed_at).getTime() - new Date(right.closed_at).getTime(),
    );

  let runningTotal = 0;

  return closedTrades.map((trade) => {
    runningTotal += trade.pnl;

    return {
      id: trade.id,
      symbol: trade.symbol,
      closedAt: trade.closed_at,
      pnl: trade.pnl,
      cumulativePnl: runningTotal,
    };
  });
}
