import Link from "next/link";

import { CumulativePnlChart } from "@/components/cumulative-pnl-chart";
import { DailyPnlBars } from "@/components/daily-pnl-bars";
import { DashboardRangePicker } from "@/components/dashboard-range-picker";
import { WorkspaceTabs } from "@/components/workspace-tabs";
import {
  formatCurrency,
  formatPercent,
  getDemoMetrics,
  getDemoTrades,
  type DemoTrade,
} from "@/lib/demo-data";
import {
  getDailyPnlSeries,
  getTradeStreak,
  normalizeTradeRange,
  type StoredTrade,
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

function toStoredTrade(t: DemoTrade): StoredTrade {
  return {
    id: t.id,
    symbol: t.symbol,
    direction: t.direction,
    entry_price: t.entryPrice,
    exit_price: t.exitPrice,
    quantity: t.quantity,
    opened_at: t.openedAt,
    closed_at: t.closedAt,
  };
}

function computeDrawdown(series: { cumulativePnl: number }[]) {
  if (series.length === 0) return { maxDrawdown: 0, currentDrawdown: 0 };
  let peak = 0;
  let maxDrawdown = 0;
  for (const p of series) {
    if (p.cumulativePnl > peak) peak = p.cumulativePnl;
    const dd = peak - p.cumulativePnl;
    if (dd > maxDrawdown) maxDrawdown = dd;
  }
  const currentPnl = series[series.length - 1].cumulativePnl;
  return { maxDrawdown, currentDrawdown: Math.max(0, peak - currentPnl) };
}

function formatShortDate(dateStr: string): string {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(
    new Date(dateStr),
  );
}

function formatTodayLabel(): string {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(new Date());
}

export default async function DemoOverviewPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  const { range } = await searchParams;
  const selectedRange = normalizeTradeRange(range);
  const metrics = getDemoMetrics(selectedRange);

  // Today's session
  const todayStr = new Date().toISOString().slice(0, 10);
  const todayTrades = metrics.trades.filter((t) => t.closedAt.startsWith(todayStr));
  const todayPnl = todayTrades.reduce((s, t) => s + t.pnl, 0);

  // Streak from all-time demo trades
  const allDemoTrades = getDemoTrades();
  const streak = getTradeStreak(
    allDemoTrades.map((t) => ({
      direction: t.direction,
      entry_price: t.entryPrice,
      exit_price: t.exitPrice,
      closed_at: t.closedAt,
      quantity: t.quantity,
    })),
  );

  // Plan adherence from range
  const planAdherence =
    metrics.trades.length > 0
      ? metrics.trades.filter((t) => t.followedPlan).length / metrics.trades.length
      : null;

  // Drawdown from cumulative series
  const { maxDrawdown, currentDrawdown } = computeDrawdown(metrics.cumulativeSeries);

  // Daily P&L series
  const dailySeries = getDailyPnlSeries(metrics.trades.map(toStoredTrade));

  const recentTrades = metrics.trades.slice(0, 5);

  return (
    <main className="px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-4">
        <WorkspaceTabs variant="demo" />

        {/* Today's Session */}
        <section className="overflow-hidden rounded-[28px] border border-white/8 bg-[#2b2d31] shadow-[0_24px_60px_rgba(0,0,0,0.3)]">
          <div className="flex items-center justify-between p-5 pb-4">
            <p className="text-xs uppercase tracking-widest text-[#949ba4]">Today&apos;s Session</p>
            <p className="text-xs text-[#6d7278]">{formatTodayLabel()}</p>
          </div>
          <div className="grid grid-cols-2 gap-3 px-5 pb-5 sm:grid-cols-4">
            {/* Today P&L */}
            <div className="rounded-[22px] bg-[#1e1f22] p-4">
              <p className="text-[10px] uppercase tracking-wider text-[#6d7278]">P&amp;L Today</p>
              <p
                className={`mt-1.5 text-xl font-bold ${
                  todayPnl > 0
                    ? "text-emerald-400"
                    : todayPnl < 0
                      ? "text-rose-400"
                      : "text-white"
                }`}
              >
                {formatCurrency(todayPnl)}
              </p>
              <p className="mt-1 text-xs text-[#6d7278]">
                {todayTrades.length} trade{todayTrades.length !== 1 ? "s" : ""} closed
              </p>
            </div>

            {/* Streak */}
            <div className="rounded-[22px] bg-[#1e1f22] p-4">
              <p className="text-[10px] uppercase tracking-wider text-[#6d7278]">Streak</p>
              <p
                className={`mt-1.5 text-xl font-bold ${
                  streak.count > 0
                    ? streak.type === "win"
                      ? "text-emerald-400"
                      : "text-rose-400"
                    : "text-white"
                }`}
              >
                {streak.count > 0
                  ? `${streak.count}${streak.type === "win" ? "W" : "L"}`
                  : "—"}
              </p>
              <p className="mt-1 text-xs text-[#6d7278]">
                {streak.count > 0 ? "consecutive" : "no data"}
              </p>
            </div>

            {/* Plan Adherence */}
            <div className="rounded-[22px] bg-[#1e1f22] p-4">
              <p className="text-[10px] uppercase tracking-wider text-[#6d7278]">Followed Plan</p>
              <p
                className={`mt-1.5 text-xl font-bold ${
                  planAdherence === null
                    ? "text-white"
                    : planAdherence >= 0.75
                      ? "text-emerald-400"
                      : planAdherence >= 0.5
                        ? "text-white"
                        : "text-rose-400"
                }`}
              >
                {planAdherence !== null ? formatPercent(planAdherence) : "—"}
              </p>
              <p className="mt-1 text-xs text-[#6d7278]">
                {metrics.trades.length} trades in range
              </p>
            </div>

            {/* Trades in Range */}
            <div className="rounded-[22px] bg-[#1e1f22] p-4">
              <p className="text-[10px] uppercase tracking-wider text-[#6d7278]">Trades in Range</p>
              <p className="mt-1.5 text-xl font-bold text-white">{metrics.closedTrades}</p>
              <p className="mt-1 text-xs text-[#6d7278]">
                {metrics.winRate > 0
                  ? `${formatPercent(metrics.winRate)} win rate`
                  : "no closed trades"}
              </p>
            </div>
          </div>

          {/* Quick actions — disabled in demo */}
          <div className="flex flex-wrap items-center gap-2 border-t border-white/8 px-5 py-3">
            <span className="flex cursor-default items-center gap-1.5 rounded-[18px] bg-[#5865f2]/30 px-3.5 py-1.5 text-[13px] font-medium text-[#8a94f0]">
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden="true">
                <path d="M6.5 1v11M1 6.5h11" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
              </svg>
              Add Trade
            </span>
            <span className="flex cursor-default items-center gap-1.5 rounded-[18px] border border-white/8 bg-[#1e1f22] px-3.5 py-1.5 text-[13px] font-medium text-[#555860]">
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden="true">
                <path d="M6.5 1v7.5M4 6l2.5 2.5L9 6M2 11h9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Import CSV
            </span>
            <div className="ml-auto flex items-center gap-4">
              <span className="flex items-center gap-1.5 text-[11px] text-[#353840]">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                  <path d="M1 4c1.4-1.4 3-2.2 5-2.2s3.6.8 5 2.2M3.5 6.5C4.2 5.8 5 5.5 6 5.5s1.8.3 2.5 1M6 9h.01" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Webull · soon
              </span>
              <span className="flex items-center gap-1.5 text-[11px] text-[#353840]">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                  <path d="M4.5 4.5l3 3M7.5 2l2.5 2.5-1.5 1.5L6 3.5 7.5 2zM2 7.5l2.5 2.5-1.5 1.5L.5 9 2 7.5z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Broker · soon
              </span>
            </div>
          </div>
        </section>

        {/* Performance — full-width card with inline stat strip */}
        <section className="rounded-[28px] border border-white/8 bg-[#2b2d31] p-6 shadow-[0_24px_60px_rgba(0,0,0,0.3)]">
          {/* Header row */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs uppercase tracking-widest text-[#949ba4]">Performance</p>
              <h2
                className={`mt-1.5 text-2xl font-bold ${
                  metrics.totalClosedPnl > 0
                    ? "text-emerald-400"
                    : metrics.totalClosedPnl < 0
                      ? "text-rose-400"
                      : "text-white"
                }`}
              >
                {formatCurrency(metrics.totalClosedPnl)}
              </h2>
              <p className="mt-1 text-xs text-[#6d7278]">Synthetic demo data only</p>
            </div>
            <DashboardRangePicker options={rangeOptions} selectedRange={selectedRange} />
          </div>

          {/* Stat strip */}
          <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
            <div className="rounded-[18px] bg-[#1e1f22] px-3 py-3">
              <p className="text-[10px] uppercase tracking-wider text-[#6d7278]">Win Rate</p>
              <p className={`mt-1 text-base font-bold ${
                metrics.closedTrades === 0 ? "text-white"
                  : metrics.winRate >= 0.55 ? "text-emerald-400"
                  : metrics.winRate >= 0.4 ? "text-white"
                  : "text-rose-400"
              }`}>
                {metrics.closedTrades ? formatPercent(metrics.winRate) : "—"}
              </p>
            </div>
            <div className="rounded-[18px] bg-[#1e1f22] px-3 py-3">
              <p className="text-[10px] uppercase tracking-wider text-[#6d7278]">Profit Factor</p>
              <p className="mt-1 text-base font-bold text-white">
                {metrics.profitFactor.toFixed(2)}
              </p>
            </div>
            <div className="rounded-[18px] bg-[#1e1f22] px-3 py-3">
              <p className="text-[10px] uppercase tracking-wider text-[#6d7278]">Avg Win</p>
              <p className="mt-1 text-base font-bold text-emerald-400">
                {formatCurrency(metrics.averageWin)}
              </p>
            </div>
            <div className="rounded-[18px] bg-[#1e1f22] px-3 py-3">
              <p className="text-[10px] uppercase tracking-wider text-[#6d7278]">Avg Loss</p>
              <p className="mt-1 text-base font-bold text-rose-400">
                {formatCurrency(metrics.averageLoss)}
              </p>
            </div>
            <div className="rounded-[18px] bg-[#1e1f22] px-3 py-3">
              <p className="text-[10px] uppercase tracking-wider text-[#6d7278]">Max Drawdown</p>
              <p className={`mt-1 text-base font-bold ${maxDrawdown > 0 ? "text-rose-400" : "text-[#6d7278]"}`}>
                {maxDrawdown > 0 ? `-${formatCurrency(maxDrawdown)}` : "—"}
              </p>
            </div>
            <div className="rounded-[18px] bg-[#1e1f22] px-3 py-3">
              <p className="text-[10px] uppercase tracking-wider text-[#6d7278]">Cur. Drawdown</p>
              <p className={`mt-1 text-base font-bold ${currentDrawdown > 0 ? "text-rose-400" : "text-emerald-400"}`}>
                {currentDrawdown > 0 ? `-${formatCurrency(currentDrawdown)}` : "At peak"}
              </p>
            </div>
          </div>

          {/* Chart */}
          <div className="mt-5">
            <CumulativePnlChart points={metrics.cumulativeSeries} />
          </div>

          {/* Best / Worst footer */}
          {metrics.bestTrade ? (
            <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-1 border-t border-white/6 pt-4 text-[12px]">
              <span className="text-[#6d7278]">
                Best: <span className="font-semibold text-emerald-400">{metrics.bestTrade.symbol} · {formatCurrency(metrics.bestTrade.pnl)}</span>
              </span>
              {metrics.worstTrade ? (
                <span className="text-[#6d7278]">
                  Worst: <span className="font-semibold text-rose-400">{metrics.worstTrade.symbol} · {formatCurrency(metrics.worstTrade.pnl)}</span>
                </span>
              ) : null}
              <span className="ml-auto text-[#4a4d52]">
                {metrics.closedTrades} closed · {metrics.openTrades} open
              </span>
            </div>
          ) : null}
        </section>

        {/* Daily P&L */}
        <section className="rounded-[28px] border border-white/8 bg-[#2b2d31] p-6">
          <div className="mb-4 flex items-baseline justify-between">
            <p className="text-xs uppercase tracking-widest text-[#949ba4]">Daily P&amp;L</p>
            <p className="text-xs text-[#6d7278]">
              {dailySeries.length} day{dailySeries.length !== 1 ? "s" : ""}
            </p>
          </div>
          <DailyPnlBars points={dailySeries} />
        </section>

        {/* Recent Trades */}
        <section className="rounded-[28px] border border-white/8 bg-[#2b2d31] p-6">
          <div className="mb-5 flex items-center justify-between">
            <p className="text-xs uppercase tracking-widest text-[#949ba4]">Recent Trades</p>
            <Link
              href="/demo/journal"
              className="text-xs text-[#5865f2] transition hover:text-white"
            >
              View all →
            </Link>
          </div>

          {recentTrades.length > 0 ? (
            <div className="overflow-hidden rounded-[24px] border border-white/8">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[700px] divide-y divide-white/8">
                  <thead className="bg-[#1e1f22] text-left text-[11px] uppercase tracking-[0.16em] text-[#949ba4]">
                    <tr>
                      <th className="px-3 py-2.5">Trade</th>
                      <th className="px-3 py-2.5">Date</th>
                      <th className="px-3 py-2.5">Qty</th>
                      <th className="px-3 py-2.5">Entry</th>
                      <th className="px-3 py-2.5">Exit</th>
                      <th className="px-3 py-2.5">P&amp;L</th>
                      <th className="px-3 py-2.5">P&amp;L %</th>
                      <th className="px-3 py-2.5">Review</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/6 text-[13px]">
                    {recentTrades.map((trade) => (
                      <tr
                        key={trade.id}
                        className="cursor-pointer transition hover:bg-white/[0.025]"
                      >
                        <td className="px-3 py-2.5">
                          <Link
                            href={`/demo/trades/${trade.id}`}
                            className="block whitespace-nowrap font-medium text-white transition hover:text-[#5865f2]"
                          >
                            {trade.symbol} · {trade.direction}
                          </Link>
                        </td>
                        <td className="whitespace-nowrap px-3 py-2.5 text-[#b5bac1]">
                          <Link href={`/demo/trades/${trade.id}`} className="block">
                            {formatShortDate(trade.closedAt)}
                          </Link>
                        </td>
                        <td className="whitespace-nowrap px-3 py-2.5 text-[#b5bac1]">
                          <Link href={`/demo/trades/${trade.id}`} className="block">
                            {trade.quantity}
                          </Link>
                        </td>
                        <td className="whitespace-nowrap px-3 py-2.5 text-[#b5bac1]">
                          <Link href={`/demo/trades/${trade.id}`} className="block">
                            {formatCurrency(trade.entryPrice)}
                          </Link>
                        </td>
                        <td className="whitespace-nowrap px-3 py-2.5 text-[#b5bac1]">
                          <Link href={`/demo/trades/${trade.id}`} className="block">
                            {formatCurrency(trade.exitPrice)}
                          </Link>
                        </td>
                        <td
                          className={`whitespace-nowrap px-3 py-2.5 font-medium ${
                            trade.pnl >= 0 ? "text-emerald-400" : "text-rose-400"
                          }`}
                        >
                          <Link href={`/demo/trades/${trade.id}`} className="block">
                            {formatCurrency(trade.pnl)}
                          </Link>
                        </td>
                        <td
                          className={`whitespace-nowrap px-3 py-2.5 font-medium ${
                            trade.pnlPercent >= 0 ? "text-emerald-400" : "text-rose-400"
                          }`}
                        >
                          <Link href={`/demo/trades/${trade.id}`} className="block">
                            {formatPercent(trade.pnlPercent / 100)}
                          </Link>
                        </td>
                        <td className="whitespace-nowrap px-3 py-2.5 text-[#b5bac1]">
                          <Link href={`/demo/trades/${trade.id}`} className="block">
                            {trade.grade} · {trade.confidenceRating}/5
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-white/8 bg-[#1e1f22] px-4 py-4 text-sm text-[#b5bac1]">
              No demo trades match this timeframe.
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
