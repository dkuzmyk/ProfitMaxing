import Link from "next/link";
import { redirect } from "next/navigation";

import { CumulativePnlChart } from "@/components/cumulative-pnl-chart";
import { DailyPnlBars } from "@/components/daily-pnl-bars";
import { DashboardRangePicker } from "@/components/dashboard-range-picker";
import { WorkspaceTabs } from "@/components/workspace-tabs";
import { formatCurrency, formatPercent } from "@/lib/demo-data";
import { createClient } from "@/lib/supabase/server";
import {
  getCumulativePnlSeries,
  getDailyPnlSeries,
  getStoredTradeMetrics,
  getTradeRangeCutoff,
  getTradeRangeLabel,
  getTradeStreak,
  getMaxDrawdown,
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

function formatHoldDuration(openedAt: string): string {
  const minutes = Math.floor((Date.now() - new Date(openedAt).getTime()) / 60000);
  if (minutes < 1) return "< 1m";
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours < 24) return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  const days = Math.floor(hours / 24);
  const rh = hours % 24;
  return rh > 0 ? `${days}d ${rh}h` : `${days}d`;
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

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{
    range?: string;
    created?: string;
    updated?: string;
    deleted?: string;
    message?: string;
  }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?message=Please sign in to view your dashboard.");
  }

  const { range, created, updated, deleted, message } = await searchParams;
  const selectedRange = normalizeTradeRange(range);
  const rangeCutoff = getTradeRangeCutoff(selectedRange);
  const rangeCutoffDate = rangeCutoff?.toISOString().slice(0, 10);

  let tradesQuery = supabase
    .from("trades")
    .select(
      "id, symbol, setup, direction, entry_price, exit_price, quantity, opened_at, closed_at, status, trade_date, entry_value, realized_pnl, realized_pnl_percent, holding_minutes, followed_plan, confidence_rating, grade, tags, mistake_tags",
    )
    .order("trade_date", { ascending: false })
    .order("opened_at", { ascending: false });

  if (rangeCutoffDate) {
    tradesQuery = tradesQuery.or(`trade_date.gte.${rangeCutoffDate},status.eq.Open`);
  }

  const streakQuery = supabase
    .from("trades")
    .select("id, direction, entry_price, exit_price, closed_at, quantity")
    .eq("status", "Closed")
    .order("closed_at", { ascending: false })
    .limit(60);

  const [{ data: trades, error: tradesError }, { data: streakData }] = await Promise.all([
    tradesQuery,
    streakQuery,
  ]);

  const allTrades = trades ?? [];
  const openPositions = allTrades.filter((t) => t.status === "Open");
  const closedInRange = allTrades.filter((t) => t.status === "Closed");

  // Today's session
  const todayDateStr = new Date().toISOString().slice(0, 10);
  const todayTrades = closedInRange.filter((t) => t.trade_date === todayDateStr);
  const todayPnl = todayTrades.reduce((s, t) => s + Number(t.realized_pnl ?? 0), 0);

  // Streak from all-time data
  const streak = getTradeStreak(streakData ?? []);

  // Plan adherence for the range
  const closedWithPlanData = closedInRange.filter((t) => t.followed_plan !== null);
  const planAdherence =
    closedWithPlanData.length > 0
      ? closedWithPlanData.filter((t) => t.followed_plan === true).length /
        closedWithPlanData.length
      : null;

  // Max drawdown from range data
  const { maxDrawdown, currentDrawdown } = getMaxDrawdown(allTrades);

  // Existing metrics/series
  const metrics = getStoredTradeMetrics(allTrades);
  const cumulativeSeries = getCumulativePnlSeries(allTrades);
  const dailySeries = getDailyPnlSeries(allTrades);

  const recentTrades = closedInRange.slice(0, 5);

  return (
    <main className="px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-4">
        <WorkspaceTabs variant="real" />

        {/* Toast notifications */}
        {created || updated || deleted || message ? (
          <div
            className={`rounded-[24px] border px-4 py-3 text-sm ${
              message
                ? "border-[#f0b232]/20 bg-[#f0b232]/10 text-[#f5c96a]"
                : "border-emerald-500/20 bg-emerald-500/10 text-emerald-300"
            }`}
          >
            {message ??
              (created
                ? "Trade created."
                : updated
                  ? "Trade updated."
                  : "Trade deleted.")}
          </div>
        ) : null}

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
                {streak.count > 0 ? "consecutive" : "no data yet"}
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
                {closedInRange.length} trades in range
              </p>
            </div>

            {/* Open Positions */}
            <div className="rounded-[22px] bg-[#1e1f22] p-4">
              <p className="text-[10px] uppercase tracking-wider text-[#6d7278]">Open Positions</p>
              <p className="mt-1.5 text-xl font-bold text-white">{openPositions.length}</p>
              <p className="mt-1 text-xs text-[#6d7278]">
                {openPositions.length > 0
                  ? `${formatCurrency(metrics.totalCurrentlyInvested)} deployed`
                  : "all flat"}
              </p>
            </div>
          </div>

          {/* Quick actions */}
          <div className="flex flex-wrap items-center gap-2 border-t border-white/8 px-5 py-3">
            <Link
              href="/trades/new"
              className="flex items-center gap-1.5 rounded-[18px] bg-[#5865f2] px-3.5 py-1.5 text-[13px] font-medium text-white transition hover:bg-[#4752c4]"
            >
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden="true">
                <path d="M6.5 1v11M1 6.5h11" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
              </svg>
              Add Trade
            </Link>
            <Link
              href="/trades/import"
              className="flex items-center gap-1.5 rounded-[18px] border border-white/10 bg-[#1e1f22] px-3.5 py-1.5 text-[13px] font-medium text-[#dbdee1] transition hover:border-[#5865f2]/40 hover:text-white"
            >
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden="true">
                <path d="M6.5 1v7.5M4 6l2.5 2.5L9 6M2 11h9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Import CSV
            </Link>
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

        {/* Performance section — full width chart card + stat strip */}
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
              <p className="mt-1 text-xs text-[#6d7278]">{getTradeRangeLabel(selectedRange)}</p>
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
            <CumulativePnlChart points={cumulativeSeries} />
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

        {/* Open Positions */}
        {openPositions.length > 0 ? (
          <section className="rounded-[28px] border border-white/8 bg-[#2b2d31] p-6">
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs uppercase tracking-widest text-[#949ba4]">
                Open Positions · {openPositions.length}
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {openPositions.map((pos) => (
                <Link
                  href={`/trades/${pos.id}`}
                  key={pos.id}
                  className="rounded-[22px] bg-[#1e1f22] p-4 hover:bg-[#26272b] transition"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-white">{pos.symbol}</p>
                      <p className="text-xs text-[#6d7278] mt-0.5">
                        {pos.direction} · {pos.quantity} shares
                      </p>
                    </div>
                    <span
                      className={`text-xs font-medium rounded-full px-2 py-1 ${
                        pos.direction === "Long"
                          ? "bg-emerald-500/12 text-emerald-400"
                          : "bg-rose-500/12 text-rose-400"
                      }`}
                    >
                      {pos.direction}
                    </span>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-[#6d7278]">Entry</p>
                      <p className="font-medium text-[#b5bac1]">
                        {formatCurrency(Number(pos.entry_price))}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-[#6d7278]">Value</p>
                      <p className="font-medium text-[#b5bac1]">
                        {formatCurrency(Number(pos.entry_value ?? 0))}
                      </p>
                    </div>
                  </div>
                  <div className="mt-2 text-xs text-[#6d7278]">
                    Held {formatHoldDuration(pos.opened_at)}
                  </div>
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        {/* Daily P&L */}
        <section className="rounded-[28px] border border-white/8 bg-[#2b2d31] p-6">
          <div className="flex items-baseline justify-between mb-4">
            <p className="text-xs uppercase tracking-widest text-[#949ba4]">Daily P&amp;L</p>
            <p className="text-xs text-[#6d7278]">
              {dailySeries.length} day{dailySeries.length !== 1 ? "s" : ""}
            </p>
          </div>
          <DailyPnlBars points={dailySeries} />
        </section>

        {/* Recent Trades */}
        <section className="rounded-[28px] border border-white/8 bg-[#2b2d31] p-6">
          <div className="flex items-center justify-between mb-5">
            <p className="text-xs uppercase tracking-widest text-[#949ba4]">Recent Trades</p>
            <Link href="/trades" className="text-xs text-[#5865f2] hover:text-white transition">
              View all →
            </Link>
          </div>

          {tradesError ? (
            <p className="mt-4 rounded-2xl border border-[#f0b232]/20 bg-[#f0b232]/10 px-4 py-3 text-sm leading-7 text-[#f5c96a]">
              The dashboard loaded, but the trades query failed. If you just created the table,
              double-check that the SQL ran successfully.
            </p>
          ) : recentTrades.length > 0 ? (
            <div className="rounded-[24px] border border-white/8 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-[760px] w-full divide-y divide-white/8">
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
                    {recentTrades.map((trade) => {
                      const pnl =
                        trade.realized_pnl != null ? Number(trade.realized_pnl) : null;
                      const pnlPct =
                        trade.realized_pnl_percent != null
                          ? Number(trade.realized_pnl_percent)
                          : null;

                      return (
                        <tr
                          key={trade.id}
                          className="cursor-pointer hover:bg-white/[0.025] transition"
                        >
                          <td className="px-3 py-2.5">
                            <Link
                              href={`/trades/${trade.id}`}
                              className="whitespace-nowrap font-medium text-white hover:text-[#5865f2] transition"
                            >
                              {trade.symbol} · {trade.direction}
                            </Link>
                          </td>
                          <td className="whitespace-nowrap px-3 py-2.5 text-[#b5bac1]">
                            <Link href={`/trades/${trade.id}`} className="block">
                              {trade.trade_date ? formatShortDate(trade.trade_date) : "—"}
                            </Link>
                          </td>
                          <td className="whitespace-nowrap px-3 py-2.5 text-[#b5bac1]">
                            <Link href={`/trades/${trade.id}`} className="block">
                              {trade.quantity}
                            </Link>
                          </td>
                          <td className="whitespace-nowrap px-3 py-2.5 text-[#b5bac1]">
                            <Link href={`/trades/${trade.id}`} className="block">
                              {formatCurrency(Number(trade.entry_price))}
                            </Link>
                          </td>
                          <td className="whitespace-nowrap px-3 py-2.5 text-[#b5bac1]">
                            <Link href={`/trades/${trade.id}`} className="block">
                              {trade.exit_price
                                ? formatCurrency(Number(trade.exit_price))
                                : "Open"}
                            </Link>
                          </td>
                          <td
                            className={`whitespace-nowrap px-3 py-2.5 font-medium ${
                              pnl == null
                                ? "text-[#949ba4]"
                                : pnl >= 0
                                  ? "text-emerald-400"
                                  : "text-rose-400"
                            }`}
                          >
                            <Link href={`/trades/${trade.id}`} className="block">
                              {pnl == null ? "Pending" : formatCurrency(pnl)}
                            </Link>
                          </td>
                          <td
                            className={`whitespace-nowrap px-3 py-2.5 font-medium ${
                              pnlPct == null
                                ? "text-[#949ba4]"
                                : pnlPct >= 0
                                  ? "text-emerald-400"
                                  : "text-rose-400"
                            }`}
                          >
                            <Link href={`/trades/${trade.id}`} className="block">
                              {pnlPct == null ? "Pending" : formatPercent(pnlPct)}
                            </Link>
                          </td>
                          <td className="whitespace-nowrap px-3 py-2.5 text-[#b5bac1]">
                            <Link href={`/trades/${trade.id}`} className="block">
                              {trade.grade ?? "—"}
                              {trade.confidence_rating
                                ? ` · ${trade.confidence_rating}/5`
                                : ""}
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-white/8 bg-[#1e1f22] px-4 py-4 text-sm leading-7 text-[#b5bac1]">
              <p>
                {allTrades.length > 0
                  ? "No trades match the selected timeframe yet."
                  : "You are authenticated and the table exists, but there are no real trades yet."}
              </p>
              <Link
                href="/trades/new"
                className="mt-4 inline-flex rounded-2xl bg-[#5865f2] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#4752c4]"
              >
                Insert your first trade
              </Link>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
