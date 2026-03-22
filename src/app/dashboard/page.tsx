import Link from "next/link";
import { redirect } from "next/navigation";

import { signOut } from "@/app/login/actions";
import { CumulativePnlChart } from "@/components/cumulative-pnl-chart";
import { DashboardRangePicker } from "@/components/dashboard-range-picker";
import { formatCurrency, formatDateTime, formatPercent } from "@/lib/demo-data";
import { createClient } from "@/lib/supabase/server";
import { deleteTrade } from "@/app/trades/actions";
import {
  filterTradesByRange,
  getCumulativePnlSeries,
  getTradeMarketValue,
  getStoredTradeMetrics,
  getTradePnl,
  getTradePnlPercent,
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

function EditIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 1 1 3 3L7 19l-4 1 1-4z" />
    </svg>
  );
}

function DeleteIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 6h18" />
      <path d="M8 6V4h8v2" />
      <path d="M19 6l-1 14H6L5 6" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
    </svg>
  );
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

  const { data: trades, error: tradesError } = await supabase
    .from("trades")
    .select(
      "id, symbol, setup, direction, entry_price, exit_price, quantity, opened_at, closed_at, status, followed_plan, confidence_rating, grade, tags, mistake_tags",
    )
    .order("opened_at", { ascending: false });

  const hasDataError = tradesError;
  const { range, created, updated, deleted, message } = await searchParams;
  const selectedRange = normalizeTradeRange(range);
  const filteredTrades = trades ? filterTradesByRange(trades, selectedRange) : [];
  const metrics = filteredTrades ? getStoredTradeMetrics(filteredTrades) : null;
  const cumulativeSeries = getCumulativePnlSeries(filteredTrades);
  const recentTrades = filteredTrades.slice(0, 6);

  return (
    <main className="px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <header className="flex flex-col gap-4 rounded-[28px] border border-white/8 bg-[#2b2d31] p-8 shadow-[0_32px_80px_rgba(0,0,0,0.35)] md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.25em] text-[#949ba4]">
              Real Dashboard
            </p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight text-white">
              Welcome back
            </h1>
            <p className="mt-3 text-sm leading-7 text-[#b5bac1]">
              Signed in as {user.email ?? "a real user"}.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/trades/new"
              className="rounded-2xl bg-[#5865f2] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#4752c4]"
            >
              Add trade
            </Link>
            <Link
              href="/journal"
              className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-[#dbdee1] transition hover:bg-white/10"
            >
              Open journal
            </Link>
            <Link
              href="/demo"
              className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-[#dbdee1] transition hover:bg-white/10"
            >
              Switch to guest demo
            </Link>
            <form action={signOut}>
              <button
                type="submit"
                className="rounded-2xl border border-white/10 bg-[#1e1f22] px-4 py-2 text-sm font-medium text-[#dbdee1] transition hover:bg-[#111214]"
              >
                Sign out
              </button>
            </form>
          </div>
        </header>

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

        <section className="grid gap-4 lg:grid-cols-[1.45fr_0.55fr]">
          <div className="rounded-[28px] border border-white/8 bg-[#2b2d31] p-6 shadow-[0_24px_60px_rgba(0,0,0,0.3)]">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.2em] text-[#949ba4]">
                  Performance
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-white">
                  Cumulative P&amp;L
                </h2>
                <p className="mt-2 text-sm leading-7 text-[#b5bac1]">
                  {getTradeRangeLabel(selectedRange)}. Every summary stat below
                  is calculated from trades inside the selected range.
                </p>
              </div>

              <DashboardRangePicker
                options={rangeOptions}
                selectedRange={selectedRange}
              />
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              <div className="min-w-0 rounded-[24px] bg-[#1e1f22] p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-[#949ba4]">
                  Total P&amp;L
                </p>
                <p className="mt-2 break-words text-lg font-semibold leading-tight text-white sm:text-xl">
                  {metrics ? formatCurrency(metrics.totalClosedPnl) : "--"}
                </p>
              </div>
              <div className="min-w-0 rounded-[24px] bg-[#1e1f22] p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-[#949ba4]">
                  P&amp;L %
                </p>
                <p className="mt-2 break-words text-lg font-semibold leading-tight text-white sm:text-xl">
                  {metrics ? formatPercent(metrics.pnlPercent) : "--"}
                </p>
              </div>
              <div className="min-w-0 rounded-[24px] bg-[#1e1f22] p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-[#949ba4]">
                  Currently Invested
                </p>
                <p className="mt-2 break-words text-lg font-semibold leading-tight text-white sm:text-xl">
                  {metrics ? formatCurrency(metrics.totalCurrentlyInvested) : "--"}
                </p>
              </div>
              <div className="min-w-0 rounded-[24px] bg-[#1e1f22] p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-[#949ba4]">
                  Total Traded
                </p>
                <p className="mt-2 break-words text-lg font-semibold leading-tight text-white sm:text-xl">
                  {metrics ? formatCurrency(metrics.totalMoneyTraded) : "--"}
                </p>
              </div>
              <div className="min-w-0 rounded-[24px] bg-[#1e1f22] p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-[#949ba4]">
                  Return %
                </p>
                <p className="mt-2 break-words text-lg font-semibold leading-tight text-white sm:text-xl">
                  {metrics ? formatPercent(metrics.returnPercent) : "--"}
                </p>
              </div>
              <div className="min-w-0 rounded-[24px] bg-[#1e1f22] p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-[#949ba4]">
                  Win Rate
                </p>
                <p className="mt-2 break-words text-lg font-semibold leading-tight text-white sm:text-xl">
                  {metrics ? formatPercent(metrics.winRate) : "--"}
                </p>
              </div>
            </div>

            <div className="mt-6">
              <CumulativePnlChart points={cumulativeSeries} />
            </div>
          </div>

          <div className="rounded-[28px] border border-white/8 bg-[#2b2d31] p-6 shadow-[0_24px_60px_rgba(0,0,0,0.3)]">
            <p className="text-sm uppercase tracking-[0.2em] text-[#949ba4]">
              Context
            </p>
            <div className="mt-5 grid gap-4">
              <div className="rounded-[24px] bg-[#1e1f22] p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-[#949ba4]">
                  Profit Factor
                </p>
                <p className="mt-2 text-xl font-semibold text-white">
                  {metrics ? metrics.profitFactor.toFixed(2) : "--"}
                </p>
              </div>
              <div className="rounded-[24px] bg-[#1e1f22] p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-[#949ba4]">
                  Average Win
                </p>
                <p className="mt-2 text-xl font-semibold text-emerald-400">
                  {metrics ? formatCurrency(metrics.averageWin) : "--"}
                </p>
              </div>
              <div className="rounded-[24px] bg-[#1e1f22] p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-[#949ba4]">
                  Average Loss
                </p>
                <p className="mt-2 text-xl font-semibold text-rose-400">
                  {metrics ? formatCurrency(metrics.averageLoss) : "--"}
                </p>
              </div>
              <div className="rounded-[24px] bg-[#1e1f22] p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-[#949ba4]">
                  Open / Closed
                </p>
                <p className="mt-2 text-xl font-semibold text-white">
                  {`${metrics?.openTrades ?? 0} / ${metrics?.closedTrades ?? 0}`}
                </p>
              </div>
              <div className="rounded-[24px] bg-[#1e1f22] p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-[#949ba4]">
                  Avg Hold
                </p>
                <p className="mt-2 text-xl font-semibold text-white">
                  {metrics ? `${Math.round(metrics.averageHoldMinutes)} min` : "--"}
                </p>
                <p className="mt-3 text-sm font-medium text-emerald-400">
                  {metrics?.bestTrade
                    ? `Best: ${metrics.bestTrade.symbol} · ${formatCurrency(metrics.bestTrade.pnl)}`
                    : "Best: none"}
                </p>
                <p className="mt-2 text-sm font-medium text-rose-400">
                  {metrics?.worstTrade
                    ? `Worst: ${metrics.worstTrade.symbol} · ${formatCurrency(metrics.worstTrade.pnl)}`
                    : "Worst: none"}
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-[28px] border border-white/8 bg-[#2b2d31] p-6 shadow-[0_24px_60px_rgba(0,0,0,0.3)]">
          <p className="text-sm uppercase tracking-[0.2em] text-[#949ba4]">
            Range Trades
          </p>

          {hasDataError ? (
            <p className="mt-4 rounded-2xl border border-[#f0b232]/20 bg-[#f0b232]/10 px-4 py-3 text-sm leading-7 text-[#f5c96a]">
              The dashboard loaded, but the `trades` query failed. If you just
              created the table, double-check that the SQL ran successfully.
            </p>
          ) : recentTrades.length > 0 ? (
            <div className="mt-5 overflow-hidden rounded-[24px] border border-white/8">
              <table className="min-w-full divide-y divide-white/8">
                <thead className="bg-[#1e1f22] text-left text-xs uppercase tracking-[0.18em] text-[#949ba4]">
                  <tr>
                    <th className="px-4 py-3">Trade</th>
                    <th className="px-4 py-3">Opened</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Shares</th>
                    <th className="px-4 py-3">Invested</th>
                    <th className="px-4 py-3">Entry</th>
                    <th className="px-4 py-3">Exit</th>
                    <th className="px-4 py-3">P&amp;L</th>
                    <th className="px-4 py-3">P&amp;L %</th>
                    <th className="px-4 py-3">Plan</th>
                    <th className="px-4 py-3">Review</th>
                    <th className="px-4 py-3">Tags</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/6 text-sm">
                  {recentTrades.map((trade) => {
                    const pnl = getTradePnl(trade);
                    const marketValue = getTradeMarketValue(trade);
                    const pnlPercent = getTradePnlPercent(trade);

                    return (
                      <tr key={trade.id}>
                        <td className="px-4 py-4">
                          <p className="font-medium text-white">
                            {trade.symbol} · {trade.direction}
                          </p>
                          <p className="mt-1 text-xs text-[#949ba4]">
                            {trade.setup || "No setup"}
                          </p>
                        </td>
                        <td className="px-4 py-4 text-[#b5bac1]">
                          {formatDateTime(trade.opened_at)}
                        </td>
                        <td className="px-4 py-4 text-[#b5bac1]">
                          {trade.status}
                        </td>
                        <td className="px-4 py-4 text-[#b5bac1]">
                          {trade.quantity}
                        </td>
                        <td className="px-4 py-4 text-[#b5bac1]">
                          {formatCurrency(marketValue)}
                        </td>
                        <td className="px-4 py-4 text-[#b5bac1]">
                          {formatCurrency(Number(trade.entry_price))}
                        </td>
                        <td className="px-4 py-4 text-[#b5bac1]">
                          {trade.exit_price
                            ? formatCurrency(Number(trade.exit_price))
                            : "Open"}
                        </td>
                        <td
                          className={`px-4 py-4 font-medium ${
                            pnl == null
                              ? "text-[#949ba4]"
                              : pnl >= 0
                                ? "text-emerald-400"
                                : "text-rose-400"
                          }`}
                        >
                          {pnl == null ? "Pending" : formatCurrency(pnl)}
                        </td>
                        <td
                          className={`px-4 py-4 font-medium ${
                            pnlPercent == null
                              ? "text-[#949ba4]"
                              : pnlPercent >= 0
                                ? "text-emerald-400"
                                : "text-rose-400"
                          }`}
                        >
                          {pnlPercent == null ? "Pending" : formatPercent(pnlPercent)}
                        </td>
                        <td className="px-4 py-4 text-[#b5bac1]">
                          {trade.followed_plan == null
                            ? "Unreviewed"
                            : trade.followed_plan
                              ? "Followed"
                              : "Broke"}
                        </td>
                        <td className="px-4 py-4 text-[#b5bac1]">
                          {trade.grade ?? "--"}
                          {trade.confidence_rating
                            ? ` · ${trade.confidence_rating}/5`
                            : ""}
                        </td>
                        <td className="px-4 py-4 text-[#b5bac1]">
                          <div className="flex max-w-xs flex-wrap gap-2">
                            {trade.tags.slice(0, 2).map((tag) => (
                              <span
                                key={tag}
                                className="rounded-full bg-white/6 px-2 py-1 text-xs text-[#dbdee1]"
                              >
                                {tag}
                              </span>
                            ))}
                            {trade.mistake_tags.slice(0, 1).map((tag) => (
                              <span
                                key={tag}
                                className="rounded-full bg-rose-500/12 px-2 py-1 text-xs text-rose-300"
                              >
                                {tag}
                              </span>
                            ))}
                            {trade.tags.length === 0 && trade.mistake_tags.length === 0 ? (
                              <span className="text-xs text-[#6d7278]">None</span>
                            ) : null}
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center justify-end gap-2">
                            <Link
                              href={`/trades/${trade.id}/edit`}
                              aria-label={`Edit ${trade.symbol} trade`}
                              title="Edit trade"
                              className="rounded-xl border border-white/10 bg-[#1e1f22] p-2 text-[#b5bac1] transition hover:border-[#5865f2]/40 hover:bg-[#16171a] hover:text-white"
                            >
                              <EditIcon />
                            </Link>
                            <form action={deleteTrade}>
                              <input type="hidden" name="tradeId" value={trade.id} />
                              <button
                                type="submit"
                                aria-label={`Delete ${trade.symbol} trade`}
                                title="Delete trade"
                                className="rounded-xl border border-white/10 bg-[#1e1f22] p-2 text-[#b5bac1] transition hover:border-rose-500/40 hover:bg-[#16171a] hover:text-rose-300"
                              >
                                <DeleteIcon />
                              </button>
                            </form>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="mt-4 rounded-2xl border border-white/8 bg-[#1e1f22] px-4 py-4 text-sm leading-7 text-[#b5bac1]">
              <p>
                {trades && trades.length > 0
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
