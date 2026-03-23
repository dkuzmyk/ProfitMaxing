import { redirect } from "next/navigation";

import { DashboardRangePicker } from "@/components/dashboard-range-picker";
import { WorkspaceTabs } from "@/components/workspace-tabs";
import {
  getGradePerformance,
  getMistakePerformance,
  getReviewSummary,
  getSetupPerformance,
  type InsightTrade,
} from "@/lib/journal-insights";
import { formatCurrency, formatPercent } from "@/lib/demo-data";
import { createClient } from "@/lib/supabase/server";
import {
  getTradeRangeLabel,
  normalizeTradeRange,
  filterTradesByRange,
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

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?message=Please sign in to view analytics.");
  }

  const { range } = await searchParams;
  const selectedRange = normalizeTradeRange(range);
  const { data: trades, error } = await supabase
    .from("trades")
    .select(
      "id, symbol, setup, direction, opened_at, closed_at, entry_value, realized_pnl, realized_pnl_percent, followed_plan, grade, confidence_rating, tags, mistake_tags, thesis, lessons, entry_price, exit_price, quantity",
    )
    .order("opened_at", { ascending: false });

  if (error) {
    redirect(`/dashboard?message=${encodeURIComponent(error.message)}`);
  }

  const filteredTrades = filterTradesByRange(trades ?? [], selectedRange);
  const insightTrades = filteredTrades.map(toInsightTrade);
  const setupPerformance = getSetupPerformance(insightTrades);
  const mistakePerformance = getMistakePerformance(insightTrades);
  const reviewSummary = getReviewSummary(insightTrades);
  const gradePerformance = getGradePerformance(insightTrades);

  return (
    <main className="px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-4">
        <WorkspaceTabs variant="real" />

        <header className="flex flex-col gap-4 rounded-[28px] border border-white/8 bg-[#2b2d31] p-6 shadow-[0_24px_60px_rgba(0,0,0,0.3)] md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.22em] text-[#949ba4]">
              Real Analytics
            </p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white">
              Setups, mistakes, and review quality
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#b5bac1]">
              {getTradeRangeLabel(selectedRange)}. This page turns your existing
              review fields into dedicated analytics.
            </p>
          </div>

          <div className="flex flex-wrap items-end gap-3">
            <DashboardRangePicker
              options={rangeOptions}
              selectedRange={selectedRange}
            />
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-[24px] border border-white/8 bg-[#2b2d31] p-6">
            <p className="text-sm uppercase tracking-[0.2em] text-[#949ba4]">
              Reviewed Trades
            </p>
            <p className="mt-3 text-3xl font-semibold text-white">
              {reviewSummary.reviewedTrades}
            </p>
          </div>
          <div className="rounded-[24px] border border-white/8 bg-[#2b2d31] p-6">
            <p className="text-sm uppercase tracking-[0.2em] text-[#949ba4]">
              Avg Confidence
            </p>
            <p className="mt-3 text-3xl font-semibold text-white">
              {reviewSummary.avgConfidence
                ? `${reviewSummary.avgConfidence.toFixed(1)}/5`
                : "--"}
            </p>
          </div>
          <div className="rounded-[24px] border border-white/8 bg-[#2b2d31] p-6">
            <p className="text-sm uppercase tracking-[0.2em] text-[#949ba4]">
              Grade A / B
            </p>
            <p className="mt-3 text-3xl font-semibold text-white">
              {reviewSummary.gradeCounts.A + reviewSummary.gradeCounts.B}
            </p>
          </div>
          <div className="rounded-[24px] border border-white/8 bg-[#2b2d31] p-6">
            <p className="text-sm uppercase tracking-[0.2em] text-[#949ba4]">
              Followed Plan
            </p>
            <p className="mt-3 text-3xl font-semibold text-white">
              {formatPercent(reviewSummary.followedPlanRate)}
            </p>
          </div>
        </section>

        <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-[28px] border border-white/8 bg-[#2b2d31] p-6">
            <p className="text-sm uppercase tracking-[0.2em] text-[#949ba4]">
              Setup Ranking
            </p>
            <div className="mt-5 overflow-hidden rounded-[24px] border border-white/8">
              <table className="min-w-full divide-y divide-white/8">
                <thead className="bg-[#1e1f22] text-left text-[11px] uppercase tracking-[0.16em] text-[#949ba4]">
                  <tr>
                    <th className="px-3 py-2.5">Setup</th>
                    <th className="px-3 py-2.5">Trades</th>
                    <th className="px-3 py-2.5">Win Rate</th>
                    <th className="px-3 py-2.5">Total P&amp;L</th>
                    <th className="px-3 py-2.5">Avg P&amp;L</th>
                    <th className="px-3 py-2.5">Return</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/6 text-[13px]">
                  {setupPerformance.slice(0, 8).map((setup) => (
                    <tr key={setup.setup}>
                      <td className="px-3 py-3 font-medium text-white">
                        {setup.setup}
                      </td>
                      <td className="px-3 py-3 text-[#b5bac1]">{setup.totalTrades}</td>
                      <td className="px-3 py-3 text-[#b5bac1]">
                        {formatPercent(setup.winRate)}
                      </td>
                      <td className="px-3 py-3 text-white">
                        {formatCurrency(setup.totalPnl)}
                      </td>
                      <td className="px-3 py-3 text-[#b5bac1]">
                        {formatCurrency(setup.avgPnl)}
                      </td>
                      <td className="px-3 py-3 text-[#b5bac1]">
                        {formatPercent(setup.returnPercent)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-[28px] border border-white/8 bg-[#2b2d31] p-6">
            <p className="text-sm uppercase tracking-[0.2em] text-[#949ba4]">
              Mistake Cost
            </p>
            <div className="mt-5 grid gap-4">
              {mistakePerformance.slice(0, 6).map((mistake) => (
                <div
                  key={mistake.label}
                  className="rounded-[24px] bg-[#1e1f22] p-4"
                >
                  <p className="text-sm font-medium text-white">{mistake.label}</p>
                  <p className="mt-2 text-xl font-semibold text-rose-400">
                    {formatCurrency(mistake.totalPnl)}
                  </p>
                  <p className="mt-2 text-sm text-[#949ba4]">
                    {mistake.count} trade{mistake.count === 1 ? "" : "s"} · avg{" "}
                    {formatCurrency(mistake.avgPnl)} · return{" "}
                    {formatPercent(mistake.returnPercent)}
                  </p>
                </div>
              ))}
              {mistakePerformance.length === 0 ? (
                <div className="rounded-[24px] bg-[#1e1f22] p-4 text-sm text-[#b5bac1]">
                  No mistake tags recorded in this range yet.
                </div>
              ) : null}
            </div>
          </div>
        </section>

        <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-[28px] border border-white/8 bg-[#2b2d31] p-6">
            <p className="text-sm uppercase tracking-[0.2em] text-[#949ba4]">
              Review Grade Performance
            </p>
            <div className="mt-5 overflow-hidden rounded-[24px] border border-white/8">
              <table className="min-w-full divide-y divide-white/8">
                <thead className="bg-[#1e1f22] text-left text-[11px] uppercase tracking-[0.16em] text-[#949ba4]">
                  <tr>
                    <th className="px-3 py-2.5">Grade</th>
                    <th className="px-3 py-2.5">Trades</th>
                    <th className="px-3 py-2.5">Avg Confidence</th>
                    <th className="px-3 py-2.5">Avg P&amp;L</th>
                    <th className="px-3 py-2.5">Return</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/6 text-[13px]">
                  {gradePerformance.map((grade) => (
                    <tr key={grade.grade}>
                      <td className="px-3 py-3 font-medium text-white">
                        {grade.grade}
                      </td>
                      <td className="px-3 py-3 text-[#b5bac1]">{grade.count}</td>
                      <td className="px-3 py-3 text-[#b5bac1]">
                        {grade.avgConfidence
                          ? `${grade.avgConfidence.toFixed(1)}/5`
                          : "--"}
                      </td>
                      <td className="px-3 py-3 text-white">
                        {formatCurrency(grade.avgPnl)}
                      </td>
                      <td className="px-3 py-3 text-[#b5bac1]">
                        {formatPercent(grade.returnPercent)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {gradePerformance.length === 0 ? (
                <div className="border-t border-white/8 bg-[#2b2d31] px-4 py-4 text-sm text-[#b5bac1]">
                  No graded trades in this range yet.
                </div>
              ) : null}
            </div>
          </div>

          <div className="rounded-[28px] border border-white/8 bg-[#2b2d31] p-6">
            <p className="text-sm uppercase tracking-[0.2em] text-[#949ba4]">
              Review Signals
            </p>
            <div className="mt-5 grid gap-4">
              <div className="rounded-[24px] bg-[#1e1f22] p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-[#949ba4]">
                  Top Setup
                </p>
                <p className="mt-2 text-xl font-semibold text-white">
                  {setupPerformance[0]?.setup ?? "None yet"}
                </p>
                <p className="mt-2 text-sm text-emerald-400">
                  {setupPerformance[0]
                    ? `${formatCurrency(setupPerformance[0].totalPnl)} across ${setupPerformance[0].totalTrades} trades`
                    : "Log setups consistently to build rankings."}
                </p>
              </div>
              <div className="rounded-[24px] bg-[#1e1f22] p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-[#949ba4]">
                  Weakest Reviewed Grade
                </p>
                <p className="mt-2 text-xl font-semibold text-white">
                  {gradePerformance.at(-1)?.grade ?? "No graded trades"}
                </p>
                <p className="mt-2 text-sm text-rose-400">
                  {gradePerformance.at(-1)
                    ? `${formatCurrency(gradePerformance.at(-1)!.avgPnl)} average P&L`
                    : "Add grades to compare decision quality."}
                </p>
              </div>
              <div className="rounded-[24px] bg-[#1e1f22] p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-[#949ba4]">
                  Costliest Mistake
                </p>
                <p className="mt-2 text-xl font-semibold text-white">
                  {mistakePerformance[0]?.label ?? "No mistake tags yet"}
                </p>
                <p className="mt-2 text-sm text-rose-400">
                  {mistakePerformance[0]
                    ? formatCurrency(mistakePerformance[0].totalPnl)
                    : "Tag mistakes to measure the drag."}
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
