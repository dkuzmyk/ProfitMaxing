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

export type { InsightTrade };
