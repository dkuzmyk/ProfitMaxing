import Link from "next/link";
import { redirect } from "next/navigation";

import { AnalyticsFilterBar } from "@/components/analytics-filter-bar";
import { DashboardRangePicker } from "@/components/dashboard-range-picker";
import { PnlDistributionChart } from "@/components/pnl-distribution";
import { TimeHeatmap } from "@/components/time-heatmap";
import { WorkspaceTabs } from "@/components/workspace-tabs";
import {
  getDirectionPerformance,
  getDrawdownStats,
  getGradePerformance,
  getHoldingTimeBuckets,
  getMistakePerformance,
  getProfitFactorStats,
  getReviewSummary,
  getSetupPerformance,
  getSymbolPerformance,
  getTagPerformance,
  getTimeHeatmap,
  type InsightTrade,
} from "@/lib/journal-insights";
import { formatCurrency, formatPercent } from "@/lib/demo-data";
import { createClient } from "@/lib/supabase/server";
import {
  getTradeRangeCutoff,
  getTradeRangeLabel,
  normalizeTradeRange,
} from "@/lib/trade-metrics";

const rangeOptions = [
  { value: "1d", label: "1D" },
  { value: "7d", label: "7D" },
  { value: "30d", label: "30D" },
  { value: "90d", label: "90D" },
  { value: "ytd", label: "YTD" },
  { value: "1y", label: "1Y" },
  { value: "5y", label: "5Y" },
  { value: "all", label: "All" },
] as const;

type AnalyticsSearchParams = {
  range?: string;
  symbol?: string;
  tag?: string;
  direction?: string;
  setupSort?: string;
  setupSortDir?: string;
  symbolSort?: string;
  symbolSortDir?: string;
  tagSort?: string;
  tagSortDir?: string;
};

type AnalyticsTradeRow = {
  id: string;
  symbol: string;
  setup: string | null;
  direction: "Long" | "Short";
  opened_at: string;
  closed_at: string | null;
  entry_value: number | string;
  realized_pnl: number | string;
  realized_pnl_percent: number | string | null;
  followed_plan: boolean | null;
  grade: "A" | "B" | "C" | "D" | "F" | null;
  confidence_rating: number | null;
  tags: string[];
  mistake_tags: string[];
  thesis: string | null;
  lessons: string | null;
  entry_price: number | string;
  exit_price: number | string | null;
  quantity: number;
};

function toInsightTrade(trade: AnalyticsTradeRow): InsightTrade {
  return {
    id: trade.id,
    symbol: trade.symbol,
    setup: trade.setup,
    direction: trade.direction,
    openedAt: trade.opened_at,
    closedAt: trade.closed_at,
    entryValue: Number(trade.entry_value),
    realizedPnl: Number(trade.realized_pnl),
    returnPercent:
      trade.realized_pnl_percent == null ? null : Number(trade.realized_pnl_percent),
    followedPlan: trade.followed_plan,
    grade: trade.grade,
    confidenceRating: trade.confidence_rating,
    tags: trade.tags,
    mistakeTags: trade.mistake_tags,
    thesis: trade.thesis,
    lessons: trade.lessons,
  };
}

function pnlColor(value: number) {
  return value > 0 ? "text-emerald-400" : value < 0 ? "text-rose-400" : "text-[#b5bac1]";
}

function winRateColor(rate: number) {
  return rate >= 0.55
    ? "text-emerald-400"
    : rate >= 0.4
      ? "text-[#b5bac1]"
      : "text-rose-400";
}

/** Inline horizontal bar proportional to value relative to a max absolute value. */
function InlineBar({ value, maxAbs }: { value: number; maxAbs: number }) {
  const pct = maxAbs > 0 ? Math.min(100, (Math.abs(value) / maxAbs) * 100) : 0;
  const positive = value >= 0;
  return (
    <div className="flex h-1.5 w-full items-center overflow-hidden rounded-full bg-white/6">
      <div
        className={`h-full rounded-full ${positive ? "bg-emerald-400" : "bg-rose-400"}`}
        style={{ width: `${pct}%`, opacity: 0.75 }}
      />
    </div>
  );
}

const VALID_SORT_KEYS = new Set([
  "totalPnl",
  "winRate",
  "totalTrades",
  "avgPnl",
  "returnPercent",
]);

function normalizeSort(
  key: string | undefined,
  dir: string | undefined,
): { key: string; dir: "asc" | "desc" } {
  return {
    key: VALID_SORT_KEYS.has(key ?? "") ? key! : "totalPnl",
    dir: dir === "asc" ? "asc" : "desc",
  };
}

function sortByKey<T extends Record<string, unknown>>(
  arr: T[],
  key: string,
  dir: "asc" | "desc",
): T[] {
  const sign = dir === "asc" ? 1 : -1;
  return [...arr].sort((a, b) => ((a[key] as number) - (b[key] as number)) * sign);
}

function sortHref(
  params: Record<string, string>,
  paramName: string,
  dirParamName: string,
  key: string,
  activeKey: string,
  activeDir: string,
) {
  const next = new URLSearchParams(params);
  next.set(paramName, key);
  next.set(dirParamName, activeKey === key && activeDir === "desc" ? "asc" : "desc");
  return `?${next.toString()}`;
}

function SortIndicator({ active, dir }: { active: boolean; dir: string }) {
  if (!active) return <span className="opacity-25">↕</span>;
  return <span>{dir === "desc" ? "↓" : "↑"}</span>;
}

function formatHoldTime(minutes: number) {
  if (minutes < 60) return `${Math.round(minutes)}m`;
  if (minutes < 1440) return `${(minutes / 60).toFixed(1)}h`;
  return `${Math.round(minutes / 1440)}d`;
}

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<AnalyticsSearchParams>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?message=Please sign in to view analytics.");
  }

  const params = await searchParams;
  const selectedRange = normalizeTradeRange(params.range);
  const rangeCutoff = getTradeRangeCutoff(selectedRange);
  const rangeCutoffDate = rangeCutoff?.toISOString().slice(0, 10);

  const symbolFilter = params.symbol?.trim().toUpperCase() ?? "";
  const tagFilter = params.tag?.trim().toLowerCase() ?? "";
  const directionFilter = params.direction ?? "";

  // Build URL param record for sort link hrefs (preserves all active filters)
  const allParams: Record<string, string> = {};
  if (params.range) allParams.range = params.range;
  if (symbolFilter) allParams.symbol = symbolFilter;
  if (tagFilter) allParams.tag = tagFilter;
  if (directionFilter) allParams.direction = directionFilter;
  if (params.setupSort) allParams.setupSort = params.setupSort;
  if (params.setupSortDir) allParams.setupSortDir = params.setupSortDir;
  if (params.symbolSort) allParams.symbolSort = params.symbolSort;
  if (params.symbolSortDir) allParams.symbolSortDir = params.symbolSortDir;
  if (params.tagSort) allParams.tagSort = params.tagSort;
  if (params.tagSortDir) allParams.tagSortDir = params.tagSortDir;

  let tradesQuery = supabase
    .from("trades")
    .select(
      "id, symbol, setup, direction, opened_at, closed_at, entry_value, realized_pnl, realized_pnl_percent, followed_plan, grade, confidence_rating, tags, mistake_tags, thesis, lessons, entry_price, exit_price, quantity",
    )
    .order("trade_date", { ascending: false })
    .order("opened_at", { ascending: false });

  if (rangeCutoffDate) tradesQuery = tradesQuery.gte("trade_date", rangeCutoffDate);
  if (symbolFilter) tradesQuery = tradesQuery.ilike("symbol", `${symbolFilter}%`);
  if (tagFilter) tradesQuery = tradesQuery.contains("tags", [tagFilter]);
  if (directionFilter === "Long" || directionFilter === "Short") {
    tradesQuery = tradesQuery.eq("direction", directionFilter);
  }

  const { data: trades, error } = await tradesQuery;

  if (error) {
    redirect(`/dashboard?message=${encodeURIComponent(error.message)}`);
  }

  const insightTrades = (trades ?? []).map(toInsightTrade);
  const closedTrades = insightTrades.filter((t) => t.closedAt != null);

  const totalPnl = closedTrades.reduce((sum, t) => sum + t.realizedPnl, 0);
  const winRate = closedTrades.length
    ? closedTrades.filter((t) => t.realizedPnl > 0).length / closedTrades.length
    : 0;

  const closedPnls = closedTrades.map((t) => t.realizedPnl);

  const reviewSummary = getReviewSummary(insightTrades);
  const profitFactor = getProfitFactorStats(insightTrades);
  const drawdown = getDrawdownStats(insightTrades);
  const gradePerformance = getGradePerformance(insightTrades);
  const directionPerformance = getDirectionPerformance(insightTrades);
  const mistakePerformance = getMistakePerformance(insightTrades);
  const holdingTime = getHoldingTimeBuckets(insightTrades);
  const heatmapData = getTimeHeatmap(insightTrades);

  // Sortable tables
  const { key: setupSortKey, dir: setupSortDir } = normalizeSort(
    params.setupSort,
    params.setupSortDir,
  );
  const { key: symbolSortKey, dir: symbolSortDir } = normalizeSort(
    params.symbolSort,
    params.symbolSortDir,
  );
  const { key: tagSortKey, dir: tagSortDir } = normalizeSort(
    params.tagSort,
    params.tagSortDir,
  );

  const setupPerformance = sortByKey(getSetupPerformance(insightTrades), setupSortKey, setupSortDir);
  const symbolPerformance = sortByKey(getSymbolPerformance(insightTrades), symbolSortKey, symbolSortDir);
  const tagPerformance = sortByKey(getTagPerformance(insightTrades), tagSortKey, tagSortDir);

  const hasActiveFilter = Boolean(symbolFilter || tagFilter || directionFilter);

  // Pre-compute maxes outside map loops
  const maxSetupPnl = Math.max(...setupPerformance.map((s) => Math.abs(s.totalPnl)), 1);
  const maxSymPnl = Math.max(...symbolPerformance.map((s) => Math.abs(s.totalPnl)), 1);
  const maxTagPnl = Math.max(...tagPerformance.map((t) => Math.abs(t.totalPnl)), 1);

  // Edge & Risk rows for the compact dl panel
  const edgeRows: { label: string; value: string; cls: string }[] = [
    {
      label: "Profit Factor",
      value:
        profitFactor.grossLoss > 0
          ? profitFactor.profitFactor.toFixed(2)
          : profitFactor.grossProfit > 0
            ? "∞"
            : "--",
      cls:
        profitFactor.profitFactor >= 1.5
          ? "text-emerald-400"
          : profitFactor.profitFactor >= 1
            ? "text-[#b5bac1]"
            : "text-rose-400",
    },
    {
      label: "W / L Ratio",
      value: profitFactor.avgLoss > 0 ? `${profitFactor.winLossRatio.toFixed(2)}×` : "--",
      cls: profitFactor.winLossRatio >= 1 ? "text-emerald-400" : "text-rose-400",
    },
    {
      label: "Avg Win",
      value: profitFactor.avgWin > 0 ? formatCurrency(profitFactor.avgWin) : "--",
      cls: "text-emerald-400",
    },
    {
      label: "Avg Loss",
      value: profitFactor.avgLoss > 0 ? formatCurrency(-profitFactor.avgLoss) : "--",
      cls: "text-rose-400",
    },
    {
      label: "Peak Equity",
      value: drawdown.peak > 0 ? formatCurrency(drawdown.peak) : "--",
      cls: "text-white",
    },
    {
      label: "Max Drawdown",
      value:
        drawdown.maxDrawdown > 0
          ? `${formatCurrency(-drawdown.maxDrawdown)} (${formatPercent(drawdown.maxDrawdownPercent)})`
          : "--",
      cls: drawdown.maxDrawdown > 0 ? "text-rose-400" : "text-[#b5bac1]",
    },
    ...(profitFactor.bestTrade
      ? [
          {
            label: `Best (${profitFactor.bestTrade.symbol})`,
            value: formatCurrency(profitFactor.bestTrade.pnl),
            cls: "text-emerald-400",
          },
        ]
      : []),
    ...(profitFactor.worstTrade
      ? [
          {
            label: `Worst (${profitFactor.worstTrade.symbol})`,
            value: formatCurrency(profitFactor.worstTrade.pnl),
            cls: "text-rose-400",
          },
        ]
      : []),
  ];

  // Long/Short comparison rows
  const [longDir, shortDir] = directionPerformance;
  const dirRows = [
    {
      label: "Trades",
      long: { v: String(longDir.totalTrades), cls: "text-[#b5bac1]" },
      short: { v: String(shortDir.totalTrades), cls: "text-[#b5bac1]" },
    },
    {
      label: "Win Rate",
      long: {
        v: longDir.closedTrades ? formatPercent(longDir.winRate) : "--",
        cls: winRateColor(longDir.winRate),
      },
      short: {
        v: shortDir.closedTrades ? formatPercent(shortDir.winRate) : "--",
        cls: winRateColor(shortDir.winRate),
      },
    },
    {
      label: "Total P&L",
      long: {
        v: longDir.closedTrades ? formatCurrency(longDir.totalPnl) : "--",
        cls: pnlColor(longDir.totalPnl),
      },
      short: {
        v: shortDir.closedTrades ? formatCurrency(shortDir.totalPnl) : "--",
        cls: pnlColor(shortDir.totalPnl),
      },
    },
    {
      label: "Avg P&L",
      long: {
        v: longDir.closedTrades ? formatCurrency(longDir.avgPnl) : "--",
        cls: pnlColor(longDir.avgPnl),
      },
      short: {
        v: shortDir.closedTrades ? formatCurrency(shortDir.avgPnl) : "--",
        cls: pnlColor(shortDir.avgPnl),
      },
    },
  ];

  return (
    <main className="px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-3">
        <WorkspaceTabs variant="real" />

        {/* ── Header ── */}
        <header className="flex flex-col gap-4 rounded-[28px] border border-white/8 bg-[#2b2d31] p-5 shadow-[0_24px_60px_rgba(0,0,0,0.3)]">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-[10px] font-medium uppercase tracking-[0.24em] text-[#949ba4]">
                Real Analytics
              </p>
              <h1 className="mt-1 text-xl font-semibold tracking-tight text-white">
                Setups, symbols &amp; review quality
              </h1>
              <p className="mt-0.5 text-xs text-[#b5bac1]">
                {getTradeRangeLabel(selectedRange)}
                {hasActiveFilter ? " · filtered" : ""}
              </p>
            </div>
            <DashboardRangePicker options={rangeOptions} selectedRange={selectedRange} />
          </div>
          <div className="border-t border-white/8 pt-3">
            <AnalyticsFilterBar
              initialSymbol={symbolFilter}
              initialTag={tagFilter}
              initialDirection={directionFilter}
            />
          </div>
        </header>

        {/* ── Stats Strip ── */}
        <section className="overflow-hidden rounded-[28px] border border-white/8 bg-[#2b2d31]">
          <div className="flex overflow-x-auto divide-x divide-white/8">
            {[
              {
                label: "Total P&L",
                value: formatCurrency(totalPnl),
                cls: pnlColor(totalPnl),
              },
              {
                label: "Win Rate",
                value: closedTrades.length ? formatPercent(winRate) : "--",
                cls: winRateColor(winRate),
              },
              {
                label: "Profit Factor",
                value:
                  profitFactor.grossLoss > 0
                    ? profitFactor.profitFactor.toFixed(2)
                    : profitFactor.grossProfit > 0
                      ? "∞"
                      : "--",
                cls:
                  profitFactor.profitFactor >= 1.5
                    ? "text-emerald-400"
                    : profitFactor.profitFactor >= 1
                      ? "text-[#b5bac1]"
                      : "text-rose-400",
              },
              {
                label: "W / L Ratio",
                value:
                  profitFactor.avgLoss > 0
                    ? `${profitFactor.winLossRatio.toFixed(2)}×`
                    : "--",
                cls:
                  profitFactor.winLossRatio >= 1 ? "text-emerald-400" : "text-rose-400",
              },
              {
                label: "Avg Hold",
                value:
                  holdingTime.avgHoldMinutes > 0
                    ? formatHoldTime(holdingTime.avgHoldMinutes)
                    : "--",
                cls: "text-white",
              },
              {
                label: "Max DD",
                value:
                  drawdown.maxDrawdown > 0
                    ? `−${formatPercent(drawdown.maxDrawdownPercent)}`
                    : "--",
                cls: drawdown.maxDrawdown > 0 ? "text-rose-400" : "text-[#b5bac1]",
              },
            ].map(({ label, value, cls }) => (
              <div
                key={label}
                className="flex min-w-[120px] flex-1 flex-col gap-1 px-5 py-4"
              >
                <p className="whitespace-nowrap text-[10px] font-medium uppercase tracking-[0.2em] text-[#949ba4]">
                  {label}
                </p>
                <p className={`text-xl font-semibold tabular-nums ${cls}`}>{value}</p>
              </div>
            ))}
          </div>

          {/* Secondary context bar */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-white/8 bg-[#1e1f22]/60 px-5 py-2">
            <span className="text-[11px] text-[#949ba4]">
              Reviewed <span className="text-white">{reviewSummary.reviewedTrades}</span>
            </span>
            <span className="select-none text-white/20">·</span>
            <span className="text-[11px] text-[#949ba4]">
              Grade A/B{" "}
              <span className="text-white">
                {reviewSummary.gradeCounts.A + reviewSummary.gradeCounts.B}
              </span>
            </span>
            <span className="select-none text-white/20">·</span>
            <span className="text-[11px] text-[#949ba4]">
              Followed Plan{" "}
              <span className="text-white">
                {formatPercent(reviewSummary.followedPlanRate)}
              </span>
            </span>
            {reviewSummary.avgConfidence > 0 && (
              <>
                <span className="select-none text-white/20">·</span>
                <span className="text-[11px] text-[#949ba4]">
                  Conf{" "}
                  <span className="text-white">
                    {reviewSummary.avgConfidence.toFixed(1)}/5
                  </span>
                </span>
              </>
            )}
            {profitFactor.grossProfit > 0 && (
              <>
                <span className="select-none text-white/20">·</span>
                <span className="text-[11px] text-[#949ba4]">
                  Gross{" "}
                  <span className="text-emerald-400">
                    {formatCurrency(profitFactor.grossProfit)}
                  </span>{" "}
                  /{" "}
                  <span className="text-rose-400">
                    {formatCurrency(-profitFactor.grossLoss)}
                  </span>
                </span>
              </>
            )}
            {(drawdown.maxWinStreak > 0 || drawdown.maxLossStreak > 0) && (
              <>
                <span className="select-none text-white/20">·</span>
                <span className="text-[11px] text-[#949ba4]">
                  Streak{" "}
                  <span className="text-emerald-400">{drawdown.maxWinStreak}W</span>
                  {" / "}
                  <span className="text-rose-400">{drawdown.maxLossStreak}L</span>
                </span>
              </>
            )}
          </div>
        </section>

        {/* ── P&L Distribution ── */}
        <section className="rounded-[28px] border border-white/8 bg-[#2b2d31] px-5 pb-5 pt-4">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-[#949ba4]">
              P&amp;L Distribution
            </p>
            <p className="text-[11px] text-[#6d7278]">{closedTrades.length} closed trades</p>
          </div>
          <div className="mt-3">
            <PnlDistributionChart values={closedPnls} />
          </div>
        </section>

        {/* ── Setup table + Edge/Risk panel ── */}
        <section className="grid gap-3 xl:grid-cols-[1.35fr_0.65fr]">
          {/* Setup table */}
          <div className="rounded-[28px] border border-white/8 bg-[#2b2d31] p-5">
            <p className="mb-3 text-[10px] font-medium uppercase tracking-[0.2em] text-[#949ba4]">
              Setup Ranking
            </p>
            <div className="overflow-hidden rounded-[20px] border border-white/8">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-white/8">
                  <thead className="bg-[#1e1f22] text-left text-[10px] uppercase tracking-[0.16em] text-[#949ba4]">
                    <tr>
                      <th className="px-3 py-2">Setup</th>
                      <th className="px-3 py-2">
                        <Link href={sortHref(allParams, "setupSort", "setupSortDir", "totalTrades", setupSortKey, setupSortDir)} scroll={false} className="flex items-center gap-1 transition hover:text-white">
                          # <SortIndicator active={setupSortKey === "totalTrades"} dir={setupSortDir} />
                        </Link>
                      </th>
                      <th className="px-3 py-2">
                        <Link href={sortHref(allParams, "setupSort", "setupSortDir", "winRate", setupSortKey, setupSortDir)} scroll={false} className="flex items-center gap-1 transition hover:text-white">
                          Win% <SortIndicator active={setupSortKey === "winRate"} dir={setupSortDir} />
                        </Link>
                      </th>
                      <th className="px-3 py-2">
                        <Link href={sortHref(allParams, "setupSort", "setupSortDir", "totalPnl", setupSortKey, setupSortDir)} scroll={false} className="flex items-center gap-1 transition hover:text-white">
                          P&amp;L <SortIndicator active={setupSortKey === "totalPnl"} dir={setupSortDir} />
                        </Link>
                      </th>
                      <th className="w-[72px] px-3 py-2"></th>
                      <th className="px-3 py-2">
                        <Link href={sortHref(allParams, "setupSort", "setupSortDir", "avgPnl", setupSortKey, setupSortDir)} scroll={false} className="flex items-center gap-1 transition hover:text-white">
                          Avg <SortIndicator active={setupSortKey === "avgPnl"} dir={setupSortDir} />
                        </Link>
                      </th>
                      <th className="px-3 py-2">
                        <Link href={sortHref(allParams, "setupSort", "setupSortDir", "returnPercent", setupSortKey, setupSortDir)} scroll={false} className="flex items-center gap-1 transition hover:text-white">
                          Ret% <SortIndicator active={setupSortKey === "returnPercent"} dir={setupSortDir} />
                        </Link>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/6 text-[12px]">
                    {setupPerformance.slice(0, 10).map((setup) => (
                      <tr key={setup.setup} className="transition hover:bg-white/[0.02]">
                        <td className="px-3 py-2">
                          <Link href={`/journal?setup=${encodeURIComponent(setup.setup)}&range=${selectedRange}`} className="font-medium text-white transition hover:text-[#5865f2]">
                            {setup.setup}
                          </Link>
                        </td>
                        <td className="px-3 py-2 text-[#b5bac1]">{setup.totalTrades}</td>
                        <td className={`px-3 py-2 font-medium ${winRateColor(setup.winRate)}`}>{formatPercent(setup.winRate)}</td>
                        <td className={`px-3 py-2 font-medium ${pnlColor(setup.totalPnl)}`}>{formatCurrency(setup.totalPnl)}</td>
                        <td className="w-[72px] px-3 py-2"><InlineBar value={setup.totalPnl} maxAbs={maxSetupPnl} /></td>
                        <td className={`px-3 py-2 ${pnlColor(setup.avgPnl)}`}>{formatCurrency(setup.avgPnl)}</td>
                        <td className={`px-3 py-2 ${pnlColor(setup.returnPercent)}`}>{formatPercent(setup.returnPercent)}</td>
                      </tr>
                    ))}
                    {setupPerformance.length === 0 && (
                      <tr>
                        <td colSpan={7} className="px-3 py-4 text-[12px] text-[#b5bac1]">No setup data in this range yet.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Right: Edge/Risk + Mistake Cost */}
          <div className="flex flex-col gap-3">
            <div className="rounded-[24px] border border-white/8 bg-[#2b2d31] p-4">
              <p className="mb-2.5 text-[10px] font-medium uppercase tracking-[0.2em] text-[#949ba4]">
                Edge &amp; Risk
              </p>
              <dl className="overflow-hidden rounded-[16px] bg-[#1e1f22] divide-y divide-white/6">
                {edgeRows.map(({ label, value, cls }) => (
                  <div key={label} className="flex items-center justify-between px-4 py-2">
                    <dt className="text-[11px] text-[#6d7278]">{label}</dt>
                    <dd className={`text-[12px] font-medium tabular-nums ${cls}`}>{value}</dd>
                  </div>
                ))}
              </dl>
            </div>

            {mistakePerformance.length > 0 && (
              <div className="rounded-[24px] border border-white/8 bg-[#2b2d31] p-4">
                <p className="mb-2.5 text-[10px] font-medium uppercase tracking-[0.2em] text-[#949ba4]">
                  Mistake Cost
                </p>
                <div className="space-y-1">
                  {mistakePerformance.slice(0, 5).map((m) => (
                    <div key={m.label} className="flex items-center justify-between rounded-xl bg-[#1e1f22] px-3 py-2">
                      <div className="flex min-w-0 items-center gap-2">
                        <span className="truncate text-[12px] font-medium text-white">{m.label}</span>
                        <span className="shrink-0 text-[10px] text-[#6d7278]">{m.count}×</span>
                      </div>
                      <span className="shrink-0 text-[12px] font-medium tabular-nums text-rose-400">
                        {formatCurrency(m.totalPnl)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* ── Symbol Performance ── */}
        <section className="rounded-[28px] border border-white/8 bg-[#2b2d31] p-5">
          <p className="mb-3 text-[10px] font-medium uppercase tracking-[0.2em] text-[#949ba4]">
            Symbol Performance
          </p>
          <div className="overflow-hidden rounded-[20px] border border-white/8">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-white/8">
                <thead className="bg-[#1e1f22] text-left text-[10px] uppercase tracking-[0.16em] text-[#949ba4]">
                  <tr>
                    <th className="px-3 py-2">Symbol</th>
                    <th className="px-3 py-2">
                      <Link href={sortHref(allParams, "symbolSort", "symbolSortDir", "totalTrades", symbolSortKey, symbolSortDir)} scroll={false} className="flex items-center gap-1 transition hover:text-white">
                        # <SortIndicator active={symbolSortKey === "totalTrades"} dir={symbolSortDir} />
                      </Link>
                    </th>
                    <th className="px-3 py-2">Cl</th>
                    <th className="px-3 py-2">
                      <Link href={sortHref(allParams, "symbolSort", "symbolSortDir", "winRate", symbolSortKey, symbolSortDir)} scroll={false} className="flex items-center gap-1 transition hover:text-white">
                        Win% <SortIndicator active={symbolSortKey === "winRate"} dir={symbolSortDir} />
                      </Link>
                    </th>
                    <th className="px-3 py-2">
                      <Link href={sortHref(allParams, "symbolSort", "symbolSortDir", "totalPnl", symbolSortKey, symbolSortDir)} scroll={false} className="flex items-center gap-1 transition hover:text-white">
                        P&amp;L <SortIndicator active={symbolSortKey === "totalPnl"} dir={symbolSortDir} />
                      </Link>
                    </th>
                    <th className="w-[72px] px-3 py-2"></th>
                    <th className="px-3 py-2">
                      <Link href={sortHref(allParams, "symbolSort", "symbolSortDir", "avgPnl", symbolSortKey, symbolSortDir)} scroll={false} className="flex items-center gap-1 transition hover:text-white">
                        Avg <SortIndicator active={symbolSortKey === "avgPnl"} dir={symbolSortDir} />
                      </Link>
                    </th>
                    <th className="px-3 py-2">
                      <Link href={sortHref(allParams, "symbolSort", "symbolSortDir", "returnPercent", symbolSortKey, symbolSortDir)} scroll={false} className="flex items-center gap-1 transition hover:text-white">
                        Ret% <SortIndicator active={symbolSortKey === "returnPercent"} dir={symbolSortDir} />
                      </Link>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/6 text-[12px]">
                  {symbolPerformance.slice(0, 12).map((sym) => (
                    <tr key={sym.symbol} className="transition hover:bg-white/[0.02]">
                      <td className="px-3 py-2">
                        <Link href={`/journal?symbol=${encodeURIComponent(sym.symbol)}&range=${selectedRange}`} className="font-medium text-white transition hover:text-[#5865f2]">
                          {sym.symbol}
                        </Link>
                      </td>
                      <td className="px-3 py-2 text-[#b5bac1]">{sym.totalTrades}</td>
                      <td className="px-3 py-2 text-[#b5bac1]">{sym.closedTrades}</td>
                      <td className={`px-3 py-2 font-medium ${winRateColor(sym.winRate)}`}>{sym.closedTrades ? formatPercent(sym.winRate) : "--"}</td>
                      <td className={`px-3 py-2 font-medium ${pnlColor(sym.totalPnl)}`}>{sym.closedTrades ? formatCurrency(sym.totalPnl) : "--"}</td>
                      <td className="w-[72px] px-3 py-2">{sym.closedTrades ? <InlineBar value={sym.totalPnl} maxAbs={maxSymPnl} /> : null}</td>
                      <td className={`px-3 py-2 ${pnlColor(sym.avgPnl)}`}>{sym.closedTrades ? formatCurrency(sym.avgPnl) : "--"}</td>
                      <td className={`px-3 py-2 ${pnlColor(sym.returnPercent)}`}>{sym.closedTrades ? formatPercent(sym.returnPercent) : "--"}</td>
                    </tr>
                  ))}
                  {symbolPerformance.length === 0 && (
                    <tr>
                      <td colSpan={8} className="px-3 py-4 text-[12px] text-[#b5bac1]">No trades in this range yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* ── Tag + Grade/Direction ── */}
        <section className={`grid gap-3 ${tagPerformance.length > 0 ? "xl:grid-cols-[1.1fr_0.9fr]" : ""}`}>
          {tagPerformance.length > 0 && (
            <div className="rounded-[28px] border border-white/8 bg-[#2b2d31] p-5">
              <p className="mb-3 text-[10px] font-medium uppercase tracking-[0.2em] text-[#949ba4]">
                Tag Performance
              </p>
              <div className="overflow-hidden rounded-[20px] border border-white/8">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-white/8">
                    <thead className="bg-[#1e1f22] text-left text-[10px] uppercase tracking-[0.16em] text-[#949ba4]">
                      <tr>
                        <th className="px-3 py-2">Tag</th>
                        <th className="px-3 py-2">
                          <Link href={sortHref(allParams, "tagSort", "tagSortDir", "totalTrades", tagSortKey, tagSortDir)} scroll={false} className="flex items-center gap-1 transition hover:text-white">
                            # <SortIndicator active={tagSortKey === "totalTrades"} dir={tagSortDir} />
                          </Link>
                        </th>
                        <th className="px-3 py-2">Cl</th>
                        <th className="px-3 py-2">
                          <Link href={sortHref(allParams, "tagSort", "tagSortDir", "winRate", tagSortKey, tagSortDir)} scroll={false} className="flex items-center gap-1 transition hover:text-white">
                            Win% <SortIndicator active={tagSortKey === "winRate"} dir={tagSortDir} />
                          </Link>
                        </th>
                        <th className="px-3 py-2">
                          <Link href={sortHref(allParams, "tagSort", "tagSortDir", "totalPnl", tagSortKey, tagSortDir)} scroll={false} className="flex items-center gap-1 transition hover:text-white">
                            P&amp;L <SortIndicator active={tagSortKey === "totalPnl"} dir={tagSortDir} />
                          </Link>
                        </th>
                        <th className="w-[72px] px-3 py-2"></th>
                        <th className="px-3 py-2">
                          <Link href={sortHref(allParams, "tagSort", "tagSortDir", "avgPnl", tagSortKey, tagSortDir)} scroll={false} className="flex items-center gap-1 transition hover:text-white">
                            Avg <SortIndicator active={tagSortKey === "avgPnl"} dir={tagSortDir} />
                          </Link>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/6 text-[12px]">
                      {tagPerformance.slice(0, 12).map((row) => (
                        <tr key={row.tag} className="transition hover:bg-white/[0.02]">
                          <td className="px-3 py-2">
                            <Link href={`/journal?tag=${encodeURIComponent(row.tag)}&range=${selectedRange}`} className="font-medium text-white transition hover:text-[#5865f2]">
                              {row.tag}
                            </Link>
                          </td>
                          <td className="px-3 py-2 text-[#b5bac1]">{row.totalTrades}</td>
                          <td className="px-3 py-2 text-[#b5bac1]">{row.closedTrades}</td>
                          <td className={`px-3 py-2 font-medium ${winRateColor(row.winRate)}`}>{row.closedTrades ? formatPercent(row.winRate) : "--"}</td>
                          <td className={`px-3 py-2 font-medium ${pnlColor(row.totalPnl)}`}>{row.closedTrades ? formatCurrency(row.totalPnl) : "--"}</td>
                          <td className="w-[72px] px-3 py-2">{row.closedTrades ? <InlineBar value={row.totalPnl} maxAbs={maxTagPnl} /> : null}</td>
                          <td className={`px-3 py-2 ${pnlColor(row.avgPnl)}`}>{row.closedTrades ? formatCurrency(row.avgPnl) : "--"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Grade + Long/Short merged card */}
          <div className="rounded-[28px] border border-white/8 bg-[#2b2d31] p-5">
            <p className="mb-3 text-[10px] font-medium uppercase tracking-[0.2em] text-[#949ba4]">
              Grade Performance
            </p>
            <div className="overflow-hidden rounded-[20px] border border-white/8">
              <table className="min-w-full divide-y divide-white/8">
                <thead className="bg-[#1e1f22] text-left text-[10px] uppercase tracking-[0.16em] text-[#949ba4]">
                  <tr>
                    <th className="px-3 py-2">Grade</th>
                    <th className="px-3 py-2">#</th>
                    <th className="px-3 py-2">Conf</th>
                    <th className="px-3 py-2">P&amp;L</th>
                    <th className="px-3 py-2">Avg</th>
                    <th className="px-3 py-2">Ret%</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/6 text-[12px]">
                  {gradePerformance.map((g) => (
                    <tr key={g.grade} className="transition hover:bg-white/[0.02]">
                      <td className="px-3 py-2 font-semibold text-white">{g.grade}</td>
                      <td className="px-3 py-2 text-[#b5bac1]">{g.count}</td>
                      <td className="px-3 py-2 text-[#b5bac1]">
                        {g.avgConfidence ? g.avgConfidence.toFixed(1) : "--"}
                      </td>
                      <td className={`px-3 py-2 font-medium ${pnlColor(g.totalPnl)}`}>{formatCurrency(g.totalPnl)}</td>
                      <td className={`px-3 py-2 ${pnlColor(g.avgPnl)}`}>{formatCurrency(g.avgPnl)}</td>
                      <td className={`px-3 py-2 ${pnlColor(g.returnPercent)}`}>{formatPercent(g.returnPercent)}</td>
                    </tr>
                  ))}
                  {gradePerformance.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-3 py-3 text-[12px] text-[#b5bac1]">No graded trades yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Long / Short comparison */}
            <div className="mt-4 border-t border-white/8 pt-4">
              <p className="mb-3 text-[10px] font-medium uppercase tracking-[0.2em] text-[#949ba4]">
                Long vs Short
              </p>
              <div className="overflow-hidden rounded-[20px] border border-white/8">
                <table className="min-w-full divide-y divide-white/8 text-[12px]">
                  <thead className="bg-[#1e1f22] text-[10px] uppercase tracking-[0.16em]">
                    <tr>
                      <th className="px-3 py-2 text-left text-[#949ba4]"></th>
                      <th className="px-3 py-2 text-right font-medium text-emerald-400/80">Long</th>
                      <th className="px-3 py-2 text-right font-medium text-rose-400/80">Short</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/6">
                    {dirRows.map(({ label, long, short }) => (
                      <tr key={label} className="transition hover:bg-white/[0.02]">
                        <td className="px-3 py-2 text-[11px] text-[#6d7278]">{label}</td>
                        <td className={`px-3 py-2 text-right font-medium tabular-nums ${long.cls}`}>{long.v}</td>
                        <td className={`px-3 py-2 text-right font-medium tabular-nums ${short.cls}`}>{short.v}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>

        {/* ── Holding Time + Time Heatmap ── */}
        <section className="grid gap-3 xl:grid-cols-[0.85fr_1.15fr]">
          <div className="rounded-[28px] border border-white/8 bg-[#2b2d31] p-5">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-[#949ba4]">
                Holding Time
              </p>
              {holdingTime.avgHoldMinutes > 0 && (
                <p className="text-[11px] text-[#6d7278]">
                  avg {formatHoldTime(holdingTime.avgHoldMinutes)}
                </p>
              )}
            </div>
            <div className="overflow-hidden rounded-[20px] border border-white/8">
              <table className="min-w-full divide-y divide-white/8">
                <thead className="bg-[#1e1f22] text-left text-[10px] uppercase tracking-[0.16em] text-[#949ba4]">
                  <tr>
                    <th className="px-3 py-2">Duration</th>
                    <th className="px-3 py-2">#</th>
                    <th className="px-3 py-2">Win%</th>
                    <th className="px-3 py-2">P&amp;L</th>
                    <th className="px-3 py-2">Avg</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/6 text-[12px]">
                  {holdingTime.buckets.map((b) => (
                    <tr key={b.label} className="transition hover:bg-white/[0.02]">
                      <td className="px-3 py-2 font-medium text-white">{b.label}</td>
                      <td className="px-3 py-2 text-[#b5bac1]">{b.count}</td>
                      <td className={`px-3 py-2 font-medium ${winRateColor(b.winRate)}`}>{formatPercent(b.winRate)}</td>
                      <td className={`px-3 py-2 font-medium ${pnlColor(b.totalPnl)}`}>{formatCurrency(b.totalPnl)}</td>
                      <td className={`px-3 py-2 ${pnlColor(b.avgPnl)}`}>{formatCurrency(b.avgPnl)}</td>
                    </tr>
                  ))}
                  {holdingTime.buckets.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-3 py-4 text-[12px] text-[#b5bac1]">No closed trades yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-[28px] border border-white/8 bg-[#2b2d31] p-5">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-[#949ba4]">
                Time of Day
              </p>
              <p className="text-[11px] text-[#6d7278]">avg P&amp;L by open hour</p>
            </div>
            <TimeHeatmap data={heatmapData} />
          </div>
        </section>
      </div>
    </main>
  );
}
