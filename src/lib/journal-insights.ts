type InsightTrade = {
  id: string;
  symbol: string;
  setup: string | null;
  direction: "Long" | "Short";
  openedAt: string;
  closedAt: string | null;
  entryValue: number;
  realizedPnl: number;
  returnPercent: number | null;
  followedPlan: boolean | null;
  grade: "A" | "B" | "C" | "D" | "F" | null;
  confidenceRating: number | null;
  tags: string[];
  mistakeTags: string[];
  thesis: string | null;
  lessons: string | null;
};

function incrementCount(map: Map<string, number>, key: string) {
  map.set(key, (map.get(key) ?? 0) + 1);
}

function getTopEntries(map: Map<string, number>, limit: number) {
  return Array.from(map.entries())
    .sort((left, right) => right[1] - left[1])
    .slice(0, limit)
    .map(([label, count]) => ({ label, count }));
}

function getTradeSetup(trade: InsightTrade) {
  return trade.setup?.trim() || "Unclassified";
}

export function getReviewSummary(trades: InsightTrade[]) {
  const gradeCounts = new Map<string, number>();
  let reviewedTrades = 0;
  let confidenceTotal = 0;
  let confidenceCount = 0;
  let followedPlanCount = 0;

  for (const trade of trades) {
    if (trade.grade) {
      reviewedTrades += 1;
      incrementCount(gradeCounts, trade.grade);
    }

    if (trade.confidenceRating != null) {
      confidenceTotal += trade.confidenceRating;
      confidenceCount += 1;
    }

    if (trade.followedPlan === true) {
      followedPlanCount += 1;
    }
  }

  return {
    reviewedTrades,
    avgConfidence: confidenceCount ? confidenceTotal / confidenceCount : 0,
    followedPlanRate: trades.length ? followedPlanCount / trades.length : 0,
    gradeCounts: {
      A: gradeCounts.get("A") ?? 0,
      B: gradeCounts.get("B") ?? 0,
      C: gradeCounts.get("C") ?? 0,
      D: gradeCounts.get("D") ?? 0,
      F: gradeCounts.get("F") ?? 0,
    },
  };
}

export function getGradePerformance(trades: InsightTrade[]) {
  const byGrade = new Map<
    string,
    {
      grade: string;
      count: number;
      totalPnl: number;
      totalEntryValue: number;
      confidenceTotal: number;
      confidenceCount: number;
    }
  >();

  for (const trade of trades) {
    if (!trade.grade) {
      continue;
    }

    const current = byGrade.get(trade.grade) ?? {
      grade: trade.grade,
      count: 0,
      totalPnl: 0,
      totalEntryValue: 0,
      confidenceTotal: 0,
      confidenceCount: 0,
    };

    current.count += 1;
    current.totalPnl += trade.realizedPnl;
    current.totalEntryValue += trade.entryValue;

    if (trade.confidenceRating != null) {
      current.confidenceTotal += trade.confidenceRating;
      current.confidenceCount += 1;
    }

    byGrade.set(trade.grade, current);
  }

  const gradeOrder = ["A", "B", "C", "D", "F"];

  return gradeOrder
    .map((grade) => byGrade.get(grade))
    .filter(
      (
        entry,
      ): entry is {
        grade: string;
        count: number;
        totalPnl: number;
        totalEntryValue: number;
        confidenceTotal: number;
        confidenceCount: number;
      } => Boolean(entry),
    )
    .map((entry) => ({
      grade: entry.grade,
      count: entry.count,
      totalPnl: entry.totalPnl,
      avgPnl: entry.count ? entry.totalPnl / entry.count : 0,
      returnPercent: entry.totalEntryValue
        ? entry.totalPnl / entry.totalEntryValue
        : 0,
      avgConfidence: entry.confidenceCount
        ? entry.confidenceTotal / entry.confidenceCount
        : 0,
    }));
}

export function getSetupPerformance(trades: InsightTrade[]) {
  const bySetup = new Map<
    string,
    {
      setup: string;
      totalTrades: number;
      winningTrades: number;
      totalPnl: number;
      totalEntryValue: number;
      followedPlanTrades: number;
      tags: Map<string, number>;
      mistakes: Map<string, number>;
    }
  >();

  for (const trade of trades) {
    const setup = getTradeSetup(trade);
    const current = bySetup.get(setup) ?? {
      setup,
      totalTrades: 0,
      winningTrades: 0,
      totalPnl: 0,
      totalEntryValue: 0,
      followedPlanTrades: 0,
      tags: new Map<string, number>(),
      mistakes: new Map<string, number>(),
    };

    current.totalTrades += 1;
    current.totalPnl += trade.realizedPnl;
    current.totalEntryValue += trade.entryValue;

    if (trade.realizedPnl > 0) {
      current.winningTrades += 1;
    }

    if (trade.followedPlan === true) {
      current.followedPlanTrades += 1;
    }

    for (const tag of trade.tags) {
      incrementCount(current.tags, tag);
    }

    for (const mistake of trade.mistakeTags) {
      incrementCount(current.mistakes, mistake);
    }

    bySetup.set(setup, current);
  }

  return Array.from(bySetup.values())
    .map((entry) => ({
      setup: entry.setup,
      totalTrades: entry.totalTrades,
      winRate: entry.totalTrades ? entry.winningTrades / entry.totalTrades : 0,
      totalPnl: entry.totalPnl,
      avgPnl: entry.totalTrades ? entry.totalPnl / entry.totalTrades : 0,
      returnPercent: entry.totalEntryValue
        ? entry.totalPnl / entry.totalEntryValue
        : 0,
      followedPlanRate: entry.totalTrades
        ? entry.followedPlanTrades / entry.totalTrades
        : 0,
      topTags: getTopEntries(entry.tags, 3),
      topMistakes: getTopEntries(entry.mistakes, 2),
    }))
    .sort((left, right) => right.totalPnl - left.totalPnl);
}

export function getMistakePerformance(trades: InsightTrade[]) {
  const byMistake = new Map<
    string,
    {
      label: string;
      count: number;
      totalPnl: number;
      totalEntryValue: number;
    }
  >();

  for (const trade of trades) {
    for (const mistake of trade.mistakeTags) {
      const current = byMistake.get(mistake) ?? {
        label: mistake,
        count: 0,
        totalPnl: 0,
        totalEntryValue: 0,
      };

      current.count += 1;
      current.totalPnl += trade.realizedPnl;
      current.totalEntryValue += trade.entryValue;
      byMistake.set(mistake, current);
    }
  }

  return Array.from(byMistake.values())
    .map((entry) => ({
      label: entry.label,
      count: entry.count,
      totalPnl: entry.totalPnl,
      avgPnl: entry.count ? entry.totalPnl / entry.count : 0,
      returnPercent: entry.totalEntryValue
        ? entry.totalPnl / entry.totalEntryValue
        : 0,
    }))
    .sort((left, right) => left.totalPnl - right.totalPnl);
}

export function getPlaybookEntries(trades: InsightTrade[]) {
  const bySetup = new Map<
    string,
    {
      setup: string;
      trades: InsightTrade[];
      tags: Map<string, number>;
      mistakes: Map<string, number>;
    }
  >();

  for (const trade of trades) {
    const setup = getTradeSetup(trade);
    const current = bySetup.get(setup) ?? {
      setup,
      trades: [],
      tags: new Map<string, number>(),
      mistakes: new Map<string, number>(),
    };

    current.trades.push(trade);

    for (const tag of trade.tags) {
      incrementCount(current.tags, tag);
    }

    for (const mistake of trade.mistakeTags) {
      incrementCount(current.mistakes, mistake);
    }

    bySetup.set(setup, current);
  }

  return Array.from(bySetup.values())
    .map((entry) => {
      const orderedTrades = [...entry.trades].sort(
        (left, right) =>
          new Date(right.openedAt).getTime() - new Date(left.openedAt).getTime(),
      );
      const totalPnl = entry.trades.reduce(
        (total, trade) => total + trade.realizedPnl,
        0,
      );
      const winners = entry.trades.filter((trade) => trade.realizedPnl > 0).length;
      const latestWithThesis =
        orderedTrades.find((trade) => trade.thesis?.trim()) ?? orderedTrades[0];
      const latestWithLesson =
        orderedTrades.find((trade) => trade.lessons?.trim()) ?? orderedTrades[0];

      return {
        setup: entry.setup,
        totalTrades: entry.trades.length,
        totalPnl,
        winRate: entry.trades.length ? winners / entry.trades.length : 0,
        topTags: getTopEntries(entry.tags, 4),
        commonMistakes: getTopEntries(entry.mistakes, 3),
        exampleSymbol: orderedTrades[0]?.symbol ?? null,
        thesis: latestWithThesis?.thesis?.trim() || null,
        lesson: latestWithLesson?.lessons?.trim() || null,
      };
    })
    .sort((left, right) => right.totalPnl - left.totalPnl);
}

export function getSymbolPerformance(trades: InsightTrade[]) {
  const bySymbol = new Map<
    string,
    {
      symbol: string;
      totalTrades: number;
      closedTrades: number;
      winningTrades: number;
      totalPnl: number;
      totalEntryValue: number;
    }
  >();

  for (const trade of trades) {
    const current = bySymbol.get(trade.symbol) ?? {
      symbol: trade.symbol,
      totalTrades: 0,
      closedTrades: 0,
      winningTrades: 0,
      totalPnl: 0,
      totalEntryValue: 0,
    };

    current.totalTrades += 1;
    current.totalEntryValue += trade.entryValue;

    if (trade.closedAt != null) {
      current.closedTrades += 1;
      current.totalPnl += trade.realizedPnl;
      if (trade.realizedPnl > 0) {
        current.winningTrades += 1;
      }
    }

    bySymbol.set(trade.symbol, current);
  }

  return Array.from(bySymbol.values())
    .map((entry) => ({
      symbol: entry.symbol,
      totalTrades: entry.totalTrades,
      closedTrades: entry.closedTrades,
      winRate: entry.closedTrades ? entry.winningTrades / entry.closedTrades : 0,
      totalPnl: entry.totalPnl,
      avgPnl: entry.closedTrades ? entry.totalPnl / entry.closedTrades : 0,
      returnPercent: entry.totalEntryValue
        ? entry.totalPnl / entry.totalEntryValue
        : 0,
    }))
    .sort((left, right) => right.totalPnl - left.totalPnl);
}

export function getDirectionPerformance(trades: InsightTrade[]) {
  const directions = ["Long", "Short"] as const;

  return directions.map((direction) => {
    const closed = trades.filter(
      (t) => t.direction === direction && t.closedAt != null,
    );
    const wins = closed.filter((t) => t.realizedPnl > 0).length;
    const totalPnl = closed.reduce((sum, t) => sum + t.realizedPnl, 0);
    const totalEntryValue = closed.reduce((sum, t) => sum + t.entryValue, 0);

    return {
      direction,
      totalTrades: trades.filter((t) => t.direction === direction).length,
      closedTrades: closed.length,
      wins,
      winRate: closed.length ? wins / closed.length : 0,
      totalPnl,
      avgPnl: closed.length ? totalPnl / closed.length : 0,
      returnPercent: totalEntryValue ? totalPnl / totalEntryValue : 0,
    };
  });
}

export function getProfitFactorStats(trades: InsightTrade[]) {
  const closed = trades.filter((t) => t.closedAt != null);
  let grossProfit = 0;
  let grossLoss = 0;
  let wins = 0;
  let losses = 0;
  let bestPnl = -Infinity;
  let worstPnl = Infinity;
  let bestSymbol = "";
  let worstSymbol = "";

  for (const t of closed) {
    if (t.realizedPnl > 0) {
      grossProfit += t.realizedPnl;
      wins++;
      if (t.realizedPnl > bestPnl) {
        bestPnl = t.realizedPnl;
        bestSymbol = t.symbol;
      }
    } else if (t.realizedPnl < 0) {
      grossLoss += Math.abs(t.realizedPnl);
      losses++;
      if (t.realizedPnl < worstPnl) {
        worstPnl = t.realizedPnl;
        worstSymbol = t.symbol;
      }
    }
  }

  const avgWin = wins ? grossProfit / wins : 0;
  const avgLoss = losses ? grossLoss / losses : 0;

  return {
    closedTrades: closed.length,
    grossProfit,
    grossLoss,
    profitFactor: grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? Infinity : 0,
    avgWin,
    avgLoss,
    winLossRatio: avgLoss > 0 ? avgWin / avgLoss : 0,
    bestTrade:
      wins > 0 ? { pnl: bestPnl, symbol: bestSymbol } : null,
    worstTrade:
      losses > 0 ? { pnl: worstPnl, symbol: worstSymbol } : null,
  };
}

export function getDrawdownStats(trades: InsightTrade[]) {
  const closed = [...trades.filter((t) => t.closedAt != null)].sort(
    (a, b) => new Date(a.closedAt!).getTime() - new Date(b.closedAt!).getTime(),
  );

  let runningPnl = 0;
  let peak = 0;
  let maxDrawdown = 0;
  let currentWinStreak = 0;
  let currentLossStreak = 0;
  let maxWinStreak = 0;
  let maxLossStreak = 0;

  for (const t of closed) {
    runningPnl += t.realizedPnl;
    if (runningPnl > peak) peak = runningPnl;
    const drawdown = peak - runningPnl;
    if (drawdown > maxDrawdown) maxDrawdown = drawdown;

    if (t.realizedPnl > 0) {
      currentWinStreak++;
      currentLossStreak = 0;
      if (currentWinStreak > maxWinStreak) maxWinStreak = currentWinStreak;
    } else if (t.realizedPnl < 0) {
      currentLossStreak++;
      currentWinStreak = 0;
      if (currentLossStreak > maxLossStreak) maxLossStreak = currentLossStreak;
    }
  }

  const currentDrawdown = Math.max(0, peak - runningPnl);

  return {
    peak,
    maxDrawdown,
    maxDrawdownPercent: peak > 0 ? maxDrawdown / peak : 0,
    currentDrawdown,
    currentDrawdownPercent: peak > 0 ? currentDrawdown / peak : 0,
    maxWinStreak,
    maxLossStreak,
  };
}

export function getTagPerformance(trades: InsightTrade[]) {
  const byTag = new Map<
    string,
    {
      tag: string;
      totalTrades: number;
      closedTrades: number;
      winningTrades: number;
      totalPnl: number;
      totalEntryValue: number;
    }
  >();

  for (const trade of trades) {
    for (const tag of trade.tags) {
      const current = byTag.get(tag) ?? {
        tag,
        totalTrades: 0,
        closedTrades: 0,
        winningTrades: 0,
        totalPnl: 0,
        totalEntryValue: 0,
      };

      current.totalTrades++;
      current.totalEntryValue += trade.entryValue;

      if (trade.closedAt != null) {
        current.closedTrades++;
        current.totalPnl += trade.realizedPnl;
        if (trade.realizedPnl > 0) current.winningTrades++;
      }

      byTag.set(tag, current);
    }
  }

  return Array.from(byTag.values())
    .map((entry) => ({
      tag: entry.tag,
      totalTrades: entry.totalTrades,
      closedTrades: entry.closedTrades,
      winRate: entry.closedTrades ? entry.winningTrades / entry.closedTrades : 0,
      totalPnl: entry.totalPnl,
      avgPnl: entry.closedTrades ? entry.totalPnl / entry.closedTrades : 0,
      returnPercent: entry.totalEntryValue ? entry.totalPnl / entry.totalEntryValue : 0,
    }))
    .sort((a, b) => b.totalPnl - a.totalPnl);
}

const HOLD_BUCKETS = [
  { label: "< 5 min", minMin: 0, maxMin: 5 },
  { label: "5 – 30 min", minMin: 5, maxMin: 30 },
  { label: "30 min – 4 h", minMin: 30, maxMin: 240 },
  { label: "4 h – 1 day", minMin: 240, maxMin: 1440 },
  { label: "> 1 day", minMin: 1440, maxMin: Infinity },
] as const;

export function getHoldingTimeBuckets(trades: InsightTrade[]) {
  type Acc = { count: number; wins: number; totalPnl: number; totalEntryValue: number };
  const accs: Acc[] = HOLD_BUCKETS.map(() => ({
    count: 0,
    wins: 0,
    totalPnl: 0,
    totalEntryValue: 0,
  }));

  let totalHoldMinutes = 0;
  let holdCount = 0;

  for (const trade of trades) {
    if (trade.closedAt == null) continue;

    const mins =
      (new Date(trade.closedAt).getTime() - new Date(trade.openedAt).getTime()) / 60_000;

    totalHoldMinutes += mins;
    holdCount++;

    const idx = HOLD_BUCKETS.findIndex((b) => mins >= b.minMin && mins < b.maxMin);
    if (idx >= 0) {
      accs[idx].count++;
      accs[idx].totalPnl += trade.realizedPnl;
      accs[idx].totalEntryValue += trade.entryValue;
      if (trade.realizedPnl > 0) accs[idx].wins++;
    }
  }

  return {
    avgHoldMinutes: holdCount ? totalHoldMinutes / holdCount : 0,
    buckets: HOLD_BUCKETS.map((b, i) => ({
      label: b.label,
      count: accs[i].count,
      winRate: accs[i].count ? accs[i].wins / accs[i].count : 0,
      totalPnl: accs[i].totalPnl,
      avgPnl: accs[i].count ? accs[i].totalPnl / accs[i].count : 0,
      returnPercent: accs[i].totalEntryValue
        ? accs[i].totalPnl / accs[i].totalEntryValue
        : 0,
    })).filter((b) => b.count > 0),
  };
}

export function getTimeHeatmap(trades: InsightTrade[]) {
  type Cell = { count: number; wins: number; totalPnl: number };
  // grid[day][hour] where day 0=Sun, 1=Mon, ..., 6=Sat
  const grid: Cell[][] = Array.from({ length: 7 }, () =>
    Array.from({ length: 24 }, () => ({ count: 0, wins: 0, totalPnl: 0 })),
  );

  for (const trade of trades) {
    const date = new Date(trade.openedAt);
    const day = date.getDay();
    const hour = date.getHours();
    const cell = grid[day][hour];
    cell.count++;
    cell.totalPnl += trade.realizedPnl;
    if (trade.realizedPnl > 0) cell.wins++;
  }

  const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return grid.map((dayRow, day) => ({
    day,
    dayLabel: DAY_LABELS[day],
    hours: dayRow.map((cell, hour) => ({
      hour,
      count: cell.count,
      winRate: cell.count ? cell.wins / cell.count : 0,
      totalPnl: cell.totalPnl,
      avgPnl: cell.count ? cell.totalPnl / cell.count : 0,
    })),
  }));
}

export type { InsightTrade };
