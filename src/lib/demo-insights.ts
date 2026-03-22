import { getDemoMetrics } from "@/lib/demo-data";
import type { InsightTrade } from "@/lib/journal-insights";
import type { TradeRange } from "@/lib/trade-metrics";

export function getDemoInsightTrades(range: TradeRange = "30d"): InsightTrade[] {
  return getDemoMetrics(range).trades.map((trade) => ({
    id: trade.id,
    symbol: trade.symbol,
    setup: trade.setup,
    direction: trade.direction,
    openedAt: trade.openedAt,
    closedAt: trade.closedAt,
    entryValue: trade.entryPrice * trade.quantity,
    realizedPnl: trade.pnl,
    returnPercent: trade.pnlPercent / 100,
    followedPlan: trade.followedPlan,
    grade: trade.grade,
    confidenceRating: trade.confidenceRating,
    tags: trade.tags,
    mistakeTags: trade.mistakes,
    thesis: trade.thesis,
    lessons: trade.notes,
  }));
}
