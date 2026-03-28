import Link from "next/link";

import { DashboardRangePicker } from "@/components/dashboard-range-picker";
import { PnlDistributionChart } from "@/components/pnl-distribution";
import { TimeHeatmap } from "@/components/time-heatmap";
import { WeekdayChart } from "@/components/weekday-chart";
import { WorkspaceTabs } from "@/components/workspace-tabs";
import { getDemoInsightTrades } from "@/lib/demo-insights";
import { formatCurrency, formatPercent } from "@/lib/demo-data";
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
  getWeekdayPerformance,
} from "@/lib/journal-insights";
import { getTradeRangeLabel, normalizeTradeRange } from "@/lib/trade-metrics";

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

function InlineBar({ value, maxAbs }: { value: number; maxAbs: number }) {
  const pct = maxAbs > 0 ? Math.min(100, (Math.abs(value) / maxAbs) * 100) : 0;
  return (
    <div className="flex h-1.5 w-full items-center overflow-hidden rounded-full bg-white/6">
      <div
        className={`h-full rounded-full ${value >= 0 ? "bg-emerald-400" : "bg-rose-400"}`}
        style={{ width: `${pct}%`, opacity: 0.75 }}
      />
    </div>
  );
}

function formatHoldTime(minutes: number) {
  if (minutes < 60) return `${Math.round(minutes)}m`;
  if (minutes < 1440) return `${(minutes / 60).toFixed(1)}h`;
  return `${Math.round(minutes / 1440)}d`;
}

export default async function DemoAnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  const { range } = await searchParams;
  const selectedRange = normalizeTradeRange(range);
  const trades = getDemoInsightTrades(selectedRange);
  const closedTrades = trades.filter((t) => t.closedAt != null);

  const totalPnl = closedTrades.reduce((sum, t) => sum + t.realizedPnl, 0);
  const winRate = closedTrades.length
    ? closedTrades.filter((t) => t.realizedPnl > 0).length / closedTrades.length
    : 0;
  const closedPnls = closedTrades.map((t) => t.realizedPnl);

  const reviewSummary = getReviewSummary(trades);
  const profitFactor = getProfitFactorStats(trades);
  const drawdown = getDrawdownStats(trades);
  const setupPerformance = getSetupPerformance(trades);
  const symbolPerformance = getSymbolPerformance(trades);
  const tagPerformance = getTagPerformance(trades);
  const mistakePerformance = getMistakePerformance(trades);
  const gradePerformance = getGradePerformance(trades);
  const directionPerformance = getDirectionPerformance(trades);
  const holdingTime = getHoldingTimeBuckets(trades);
  const heatmapData = getTimeHeatmap(trades);
  const weekdayData = getWeekdayPerformance(trades);

  const maxSetupPnl = Math.max(...setupPerformance.map((s) => Math.abs(s.totalPnl)), 1);
  const maxSymPnl = Math.max(...symbolPerformance.map((s) => Math.abs(s.totalPnl)), 1);
  const maxTagPnl = Math.max(...tagPerformance.map((t) => Math.abs(t.totalPnl)), 1);

  const [longDir, shortDir] = directionPerformance;
  const dirRows = [
    {
      label: "Trades",
      long: { v: String(longDir.totalTrades), cls: "text-[#b5bac1]" },
      short: { v: String(shortDir.totalTrades), cls: "text-[#b5bac1]" },
    },
    {
      label: "Win Rate",
      long: { v: longDir.closedTrades ? formatPercent(longDir.winRate) : "--", cls: winRateColor(longDir.winRate) },
      short: { v: shortDir.closedTrades ? formatPercent(shortDir.winRate) : "--", cls: winRateColor(shortDir.winRate) },
    },
    {
      label: "Total P&L",
      long: { v: longDir.closedTrades ? formatCurrency(longDir.totalPnl) : "--", cls: pnlColor(longDir.totalPnl) },
      short: { v: shortDir.closedTrades ? formatCurrency(shortDir.totalPnl) : "--", cls: pnlColor(shortDir.totalPnl) },
    },
    {
      label: "Avg P&L",
      long: { v: longDir.closedTrades ? formatCurrency(longDir.avgPnl) : "--", cls: pnlColor(longDir.avgPnl) },
      short: { v: shortDir.closedTrades ? formatCurrency(shortDir.avgPnl) : "--", cls: pnlColor(shortDir.avgPnl) },
    },
  ];

  return (
    <main className="px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-4">
        <WorkspaceTabs variant="demo" />

        {/* ── Header + Stats Strip ── */}
        <section className="overflow-hidden rounded-[28px] border border-white/8 bg-[#2b2d31] shadow-[0_24px_60px_rgba(0,0,0,0.3)]">
          <div className="flex flex-col gap-3 p-5 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-[10px] font-medium uppercase tracking-[0.24em] text-[#949ba4]">
                Demo Analytics
              </p>
              <h1 className="mt-1 text-xl font-semibold tracking-tight text-white">
                Explore setup and review analytics
              </h1>
              <p className="mt-0.5 text-xs text-[#b5bac1]">
                Synthetic data only · {getTradeRangeLabel(selectedRange)}
              </p>
            </div>
            <DashboardRangePicker options={rangeOptions} selectedRange={selectedRange} />
          </div>
          <div className="border-t border-white/8" />
          <div className="flex overflow-x-auto divide-x divide-white/8">
            {[
              { label: "Total P&L", value: formatCurrency(totalPnl), cls: pnlColor(totalPnl) },
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
                value: profitFactor.avgLoss > 0 ? `${profitFactor.winLossRatio.toFixed(2)}×` : "--",
                cls: profitFactor.winLossRatio >= 1 ? "text-emerald-400" : "text-rose-400",
              },
              {
                label: "Avg Hold",
                value: holdingTime.avgHoldMinutes > 0 ? formatHoldTime(holdingTime.avgHoldMinutes) : "--",
                cls: "text-white",
              },
              {
                label: "Max DD",
                value: drawdown.maxDrawdown > 0 ? `−${formatPercent(drawdown.maxDrawdownPercent)}` : "--",
                cls: drawdown.maxDrawdown > 0 ? "text-rose-400" : "text-[#b5bac1]",
              },
            ].map(({ label, value, cls }) => (
              <div key={label} className="flex min-w-[120px] flex-1 flex-col gap-1 px-5 py-4">
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
              <span className="text-white">{formatPercent(reviewSummary.followedPlanRate)}</span>
            </span>
            {reviewSummary.avgConfidence > 0 && (
              <>
                <span className="select-none text-white/20">·</span>
                <span className="text-[11px] text-[#949ba4]">
                  Conf <span className="text-white">{reviewSummary.avgConfidence.toFixed(1)}/5</span>
                </span>
              </>
            )}
            {profitFactor.grossProfit > 0 && (
              <>
                <span className="select-none text-white/20">·</span>
                <span className="text-[11px] text-[#949ba4]">
                  Gross{" "}
                  <span className="text-emerald-400">{formatCurrency(profitFactor.grossProfit)}</span>
                  {" / "}
                  <span className="text-rose-400">{formatCurrency(-profitFactor.grossLoss)}</span>
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

        {/* ── Row A: P&L Distribution + Edge & Risk ── */}
        <section className="grid gap-4 xl:grid-cols-[1.45fr_1fr]">
          <div className="flex flex-col rounded-[28px] border border-white/8 bg-[#2b2d31] p-5">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-[#949ba4]">P&amp;L Distribution</p>
              <p className="text-[11px] text-[#6d7278]">{closedTrades.length} closed trades</p>
            </div>
            <PnlDistributionChart values={closedPnls} className="flex-1 min-h-0" />
          </div>

          <div className="rounded-[28px] border border-white/8 bg-[#2b2d31] p-5">
            <p className="mb-3 text-[10px] font-medium uppercase tracking-[0.2em] text-[#949ba4]">Edge &amp; Risk</p>
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-[18px] bg-[#1e1f22] p-3.5">
                <p className="text-[10px] uppercase tracking-[0.18em] text-[#6d7278]">Profit Factor</p>
                <p className={`mt-2 text-2xl font-semibold tabular-nums ${profitFactor.profitFactor >= 1.5 ? "text-emerald-400" : profitFactor.profitFactor >= 1 ? "text-[#b5bac1]" : "text-rose-400"}`}>
                  {profitFactor.grossLoss > 0 ? profitFactor.profitFactor.toFixed(2) : profitFactor.grossProfit > 0 ? "∞" : "--"}
                </p>
              </div>
              <div className="rounded-[18px] bg-[#1e1f22] p-3.5">
                <p className="text-[10px] uppercase tracking-[0.18em] text-[#6d7278]">W / L Ratio</p>
                <p className={`mt-2 text-2xl font-semibold tabular-nums ${profitFactor.winLossRatio >= 1 ? "text-emerald-400" : "text-rose-400"}`}>
                  {profitFactor.avgLoss > 0 ? `${profitFactor.winLossRatio.toFixed(2)}×` : "--"}
                </p>
              </div>
              <div className="rounded-[18px] bg-[#1e1f22] p-3.5">
                <p className="text-[10px] uppercase tracking-[0.18em] text-[#6d7278]">Avg Win</p>
                <p className="mt-2 text-xl font-semibold tabular-nums text-emerald-400">
                  {profitFactor.avgWin > 0 ? formatCurrency(profitFactor.avgWin) : "--"}
                </p>
              </div>
              <div className="rounded-[18px] bg-[#1e1f22] p-3.5">
                <p className="text-[10px] uppercase tracking-[0.18em] text-[#6d7278]">Avg Loss</p>
                <p className="mt-2 text-xl font-semibold tabular-nums text-rose-400">
                  {profitFactor.avgLoss > 0 ? formatCurrency(-profitFactor.avgLoss) : "--"}
                </p>
              </div>
            </div>
            <div className="mt-2 flex items-center justify-between rounded-[18px] bg-[#1e1f22] px-4 py-3">
              <div>
                <p className="text-[10px] uppercase tracking-[0.18em] text-[#6d7278]">Peak Equity</p>
                <p className="mt-1.5 text-sm font-semibold text-white">{drawdown.peak > 0 ? formatCurrency(drawdown.peak) : "--"}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] uppercase tracking-[0.18em] text-[#6d7278]">Max Drawdown</p>
                <p className={`mt-1.5 text-sm font-semibold ${drawdown.maxDrawdown > 0 ? "text-rose-400" : "text-[#b5bac1]"}`}>
                  {drawdown.maxDrawdown > 0 ? `${formatCurrency(-drawdown.maxDrawdown)} (${formatPercent(drawdown.maxDrawdownPercent)})` : "--"}
                </p>
              </div>
            </div>
            {(profitFactor.bestTrade || profitFactor.worstTrade) && (
              <div className="mt-2 grid grid-cols-2 gap-2">
                {profitFactor.bestTrade && (
                  <div className="rounded-[18px] bg-[#1e1f22] p-3">
                    <p className="text-[10px] uppercase tracking-[0.18em] text-[#6d7278]">Best Trade</p>
                    <p className="mt-1.5 text-xs font-medium text-white">{profitFactor.bestTrade.symbol}</p>
                    <p className="text-sm font-semibold tabular-nums text-emerald-400">{formatCurrency(profitFactor.bestTrade.pnl)}</p>
                  </div>
                )}
                {profitFactor.worstTrade && (
                  <div className="rounded-[18px] bg-[#1e1f22] p-3">
                    <p className="text-[10px] uppercase tracking-[0.18em] text-[#6d7278]">Worst Trade</p>
                    <p className="mt-1.5 text-xs font-medium text-white">{profitFactor.worstTrade.symbol}</p>
                    <p className="text-sm font-semibold tabular-nums text-rose-400">{formatCurrency(profitFactor.worstTrade.pnl)}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </section>

        {/* ── Row B: Setup Ranking + Long/Short + Mistakes ── */}
        <section className="grid gap-4 xl:grid-cols-[1.45fr_1fr]">
          <div className="rounded-[28px] border border-white/8 bg-[#2b2d31] p-5">
            <p className="mb-3 text-[10px] font-medium uppercase tracking-[0.2em] text-[#949ba4]">Setup Ranking</p>
            <div className="overflow-hidden rounded-[20px] border border-white/8">
              <div className="max-h-[320px] overflow-auto">
                <table className="min-w-full divide-y divide-white/8">
                  <thead className="sticky top-0 z-10 bg-[#1e1f22] text-left text-[10px] uppercase tracking-[0.16em] text-[#949ba4]">
                    <tr>
                      <th className="px-3 py-2">Setup</th>
                      <th className="px-3 py-2">#</th>
                      <th className="px-3 py-2">Win%</th>
                      <th className="px-3 py-2">P&amp;L</th>
                      <th className="w-[72px] px-3 py-2"></th>
                      <th className="px-3 py-2">Avg</th>
                      <th className="px-3 py-2">Ret%</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/6 text-[12px]">
                    {setupPerformance.map((setup) => (
                      <tr key={setup.setup} className="transition hover:bg-white/[0.02]">
                        <td className="px-3 py-2 font-medium text-white">{setup.setup}</td>
                        <td className="px-3 py-2 text-[#b5bac1]">{setup.totalTrades}</td>
                        <td className={`px-3 py-2 font-medium ${winRateColor(setup.winRate)}`}>{formatPercent(setup.winRate)}</td>
                        <td className={`px-3 py-2 font-medium ${pnlColor(setup.totalPnl)}`}>{formatCurrency(setup.totalPnl)}</td>
                        <td className="w-[72px] px-3 py-2"><InlineBar value={setup.totalPnl} maxAbs={maxSetupPnl} /></td>
                        <td className={`px-3 py-2 ${pnlColor(setup.avgPnl)}`}>{formatCurrency(setup.avgPnl)}</td>
                        <td className={`px-3 py-2 ${pnlColor(setup.returnPercent)}`}>{formatPercent(setup.returnPercent)}</td>
                      </tr>
                    ))}
                    {setupPerformance.length === 0 && (
                      <tr><td colSpan={7} className="px-3 py-4 text-[12px] text-[#b5bac1]">No setup data in this range yet.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <div className="rounded-[28px] border border-white/8 bg-[#2b2d31] p-5">
              <p className="mb-3 text-[10px] font-medium uppercase tracking-[0.2em] text-[#949ba4]">Long vs Short</p>
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

            {mistakePerformance.length > 0 && (
              <div className="rounded-[28px] border border-white/8 bg-[#2b2d31] p-5">
                <p className="mb-3 text-[10px] font-medium uppercase tracking-[0.2em] text-[#949ba4]">Mistake Cost</p>
                <div className="space-y-1.5">
                  {mistakePerformance.slice(0, 5).map((m) => (
                    <div key={m.label} className="flex items-center justify-between rounded-[16px] bg-[#1e1f22] px-3 py-2.5">
                      <div className="flex min-w-0 items-center gap-2">
                        <span className="truncate text-[12px] font-medium text-white">{m.label}</span>
                        <span className="shrink-0 text-[10px] text-[#6d7278]">{m.count}×</span>
                      </div>
                      <span className="shrink-0 text-[12px] font-semibold tabular-nums text-rose-400">{formatCurrency(m.totalPnl)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* ── Symbol Performance ── */}
        {symbolPerformance.length > 0 && (
          <section className="rounded-[28px] border border-white/8 bg-[#2b2d31] p-5">
            <p className="mb-3 text-[10px] font-medium uppercase tracking-[0.2em] text-[#949ba4]">Symbol Performance</p>
            <div className="overflow-hidden rounded-[20px] border border-white/8">
              <div className="max-h-[360px] overflow-auto">
                <table className="min-w-full divide-y divide-white/8">
                  <thead className="sticky top-0 z-10 bg-[#1e1f22] text-left text-[10px] uppercase tracking-[0.16em] text-[#949ba4]">
                    <tr>
                      <th className="px-3 py-2">Symbol</th>
                      <th className="px-3 py-2">#</th>
                      <th className="px-3 py-2">Cl</th>
                      <th className="px-3 py-2">Win%</th>
                      <th className="px-3 py-2">P&amp;L</th>
                      <th className="w-[72px] px-3 py-2"></th>
                      <th className="px-3 py-2">Avg</th>
                      <th className="px-3 py-2">Ret%</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/6 text-[12px]">
                    {symbolPerformance.map((sym) => (
                      <tr key={sym.symbol} className="transition hover:bg-white/[0.02]">
                        <td className="px-3 py-2 font-medium text-white">{sym.symbol}</td>
                        <td className="px-3 py-2 text-[#b5bac1]">{sym.totalTrades}</td>
                        <td className="px-3 py-2 text-[#b5bac1]">{sym.closedTrades}</td>
                        <td className={`px-3 py-2 font-medium ${winRateColor(sym.winRate)}`}>{sym.closedTrades ? formatPercent(sym.winRate) : "--"}</td>
                        <td className={`px-3 py-2 font-medium ${pnlColor(sym.totalPnl)}`}>{sym.closedTrades ? formatCurrency(sym.totalPnl) : "--"}</td>
                        <td className="w-[72px] px-3 py-2">{sym.closedTrades ? <InlineBar value={sym.totalPnl} maxAbs={maxSymPnl} /> : null}</td>
                        <td className={`px-3 py-2 ${pnlColor(sym.avgPnl)}`}>{sym.closedTrades ? formatCurrency(sym.avgPnl) : "--"}</td>
                        <td className={`px-3 py-2 ${pnlColor(sym.returnPercent)}`}>{sym.closedTrades ? formatPercent(sym.returnPercent) : "--"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}

        {/* ── Grade + Tag Performance ── */}
        <section className={`grid gap-4 ${tagPerformance.length > 0 ? "xl:grid-cols-[1fr_1.2fr]" : ""}`}>
          <div className="rounded-[28px] border border-white/8 bg-[#2b2d31] p-5">
            <p className="mb-3 text-[10px] font-medium uppercase tracking-[0.2em] text-[#949ba4]">Grade Performance</p>
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
                      <td className="px-3 py-2 text-[#b5bac1]">{g.avgConfidence ? g.avgConfidence.toFixed(1) : "--"}</td>
                      <td className={`px-3 py-2 font-medium ${pnlColor(g.totalPnl)}`}>{formatCurrency(g.totalPnl)}</td>
                      <td className={`px-3 py-2 ${pnlColor(g.avgPnl)}`}>{formatCurrency(g.avgPnl)}</td>
                      <td className={`px-3 py-2 ${pnlColor(g.returnPercent)}`}>{formatPercent(g.returnPercent)}</td>
                    </tr>
                  ))}
                  {gradePerformance.length === 0 && (
                    <tr><td colSpan={6} className="px-3 py-3 text-[12px] text-[#b5bac1]">No graded trades yet.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {tagPerformance.length > 0 && (
            <div className="rounded-[28px] border border-white/8 bg-[#2b2d31] p-5">
              <p className="mb-3 text-[10px] font-medium uppercase tracking-[0.2em] text-[#949ba4]">Tag Performance</p>
              <div className="overflow-hidden rounded-[20px] border border-white/8">
                <div className="max-h-[320px] overflow-auto">
                  <table className="min-w-full divide-y divide-white/8">
                    <thead className="sticky top-0 z-10 bg-[#1e1f22] text-left text-[10px] uppercase tracking-[0.16em] text-[#949ba4]">
                      <tr>
                        <th className="px-3 py-2">Tag</th>
                        <th className="px-3 py-2">#</th>
                        <th className="px-3 py-2">Cl</th>
                        <th className="px-3 py-2">Win%</th>
                        <th className="px-3 py-2">P&amp;L</th>
                        <th className="w-[72px] px-3 py-2"></th>
                        <th className="px-3 py-2">Avg</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/6 text-[12px]">
                      {tagPerformance.map((row) => (
                        <tr key={row.tag} className="transition hover:bg-white/[0.02]">
                          <td className="px-3 py-2 font-medium text-white">{row.tag}</td>
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
        </section>

        {/* ── Weekday Performance + Holding Time ── */}
        <section className="grid gap-4 xl:grid-cols-2">
          <div className="rounded-[28px] border border-white/8 bg-[#2b2d31] p-5">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-[#949ba4]">Performance by Weekday</p>
              <p className="text-[11px] text-[#6d7278]">total P&amp;L · close date</p>
            </div>
            <WeekdayChart data={weekdayData} />
          </div>

          <div className="rounded-[28px] border border-white/8 bg-[#2b2d31] p-5">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-[#949ba4]">Holding Time</p>
              {holdingTime.avgHoldMinutes > 0 && (
                <p className="text-[11px] text-[#6d7278]">avg {formatHoldTime(holdingTime.avgHoldMinutes)}</p>
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
                    <tr><td colSpan={5} className="px-3 py-4 text-[12px] text-[#b5bac1]">No closed trades yet.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* ── Time Heatmap (full width) ── */}
        <section className="rounded-[28px] border border-white/8 bg-[#2b2d31] p-5">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-[#949ba4]">Time of Day</p>
            <p className="text-[11px] text-[#6d7278]">avg P&amp;L by open hour</p>
          </div>
          <TimeHeatmap data={heatmapData} />
        </section>
      </div>
    </main>
  );
}
