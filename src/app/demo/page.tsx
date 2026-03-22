import Link from "next/link";

import { CumulativePnlChart } from "@/components/cumulative-pnl-chart";
import { DashboardRangePicker } from "@/components/dashboard-range-picker";
import { WorkspaceTabs } from "@/components/workspace-tabs";
import {
  formatCurrency,
  formatPercent,
  getDemoMetrics,
  type DemoTrade,
} from "@/lib/demo-data";
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

function getMarketValue(trade: DemoTrade) {
  return trade.entryPrice * trade.quantity;
}

export default async function DemoOverviewPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  const { range } = await searchParams;
  const selectedRange = normalizeTradeRange(range);
  const metrics = getDemoMetrics(selectedRange);
  const recentTrades = metrics.trades.slice(0, 6);

  return (
    <main className="px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <WorkspaceTabs variant="demo" />

        <section className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
          <div className="rounded-[28px] border border-white/8 bg-[#2b2d31] p-6 shadow-[0_24px_60px_rgba(0,0,0,0.3)]">
            <p className="text-xs font-medium uppercase tracking-[0.22em] text-[#949ba4]">
              Demo Dashboard
            </p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white">
              Read-only product walkthrough
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#b5bac1]">
              Synthetic data only. {getTradeRangeLabel(selectedRange)}. Use the
              tabs above to inspect the same workflow without touching real
              trades.
            </p>
          </div>

          <div className="rounded-[28px] border border-white/8 bg-[#2b2d31] p-6 shadow-[0_24px_60px_rgba(0,0,0,0.3)]">
            <p className="text-xs font-medium uppercase tracking-[0.22em] text-[#949ba4]">
              Demo Mode
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white">
              Guest access profile
            </h2>
            <p className="mt-2 text-sm leading-6 text-[#b5bac1]">
              This workspace mirrors the real one, but remains read-only and
              fully synthetic.
            </p>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className="rounded-[22px] bg-[#1e1f22] p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-[#949ba4]">
                  Data policy
                </p>
                <p className="mt-2 text-sm font-medium text-white">
                  No write access
                </p>
              </div>
              <div className="rounded-[22px] bg-[#1e1f22] p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-[#949ba4]">
                  History
                </p>
                <p className="mt-2 text-sm font-medium text-white">
                  One synthetic year
                </p>
              </div>
              <div className="rounded-[22px] bg-[#1e1f22] p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-[#949ba4]">
                  Trade set
                </p>
                <p className="mt-2 text-sm font-medium text-white">
                  {metrics.trades.length} trades in range
                </p>
              </div>
              <div className="rounded-[22px] bg-[#1e1f22] p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-[#949ba4]">
                  Return profile
                </p>
                <p className="mt-2 text-sm font-medium text-white">
                  {formatPercent(metrics.returnPercent)} in range
                </p>
              </div>
            </div>
          </div>
        </section>

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
                  Every demo stat below is calculated from synthetic trades in
                  the selected range.
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
                  {formatCurrency(metrics.totalClosedPnl)}
                </p>
              </div>
              <div className="min-w-0 rounded-[24px] bg-[#1e1f22] p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-[#949ba4]">
                  P&amp;L %
                </p>
                <p className="mt-2 break-words text-lg font-semibold leading-tight text-white sm:text-xl">
                  {formatPercent(metrics.pnlPercent)}
                </p>
              </div>
              <div className="min-w-0 rounded-[24px] bg-[#1e1f22] p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-[#949ba4]">
                  Currently Invested
                </p>
                <p className="mt-2 break-words text-lg font-semibold leading-tight text-white sm:text-xl">
                  {formatCurrency(metrics.totalCurrentlyInvested)}
                </p>
              </div>
              <div className="min-w-0 rounded-[24px] bg-[#1e1f22] p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-[#949ba4]">
                  Total Traded
                </p>
                <p className="mt-2 break-words text-lg font-semibold leading-tight text-white sm:text-xl">
                  {formatCurrency(metrics.totalMoneyTraded)}
                </p>
              </div>
              <div className="min-w-0 rounded-[24px] bg-[#1e1f22] p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-[#949ba4]">
                  Return %
                </p>
                <p className="mt-2 break-words text-lg font-semibold leading-tight text-white sm:text-xl">
                  {formatPercent(metrics.returnPercent)}
                </p>
              </div>
              <div className="min-w-0 rounded-[24px] bg-[#1e1f22] p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-[#949ba4]">
                  Win Rate
                </p>
                <p className="mt-2 break-words text-lg font-semibold leading-tight text-white sm:text-xl">
                  {formatPercent(metrics.winRate)}
                </p>
              </div>
            </div>

            <div className="mt-6">
              <CumulativePnlChart points={metrics.cumulativeSeries} />
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
                  {metrics.profitFactor.toFixed(2)}
                </p>
              </div>
              <div className="rounded-[24px] bg-[#1e1f22] p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-[#949ba4]">
                  Average Win
                </p>
                <p className="mt-2 text-xl font-semibold text-emerald-400">
                  {formatCurrency(metrics.averageWin)}
                </p>
              </div>
              <div className="rounded-[24px] bg-[#1e1f22] p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-[#949ba4]">
                  Average Loss
                </p>
                <p className="mt-2 text-xl font-semibold text-rose-400">
                  {formatCurrency(metrics.averageLoss)}
                </p>
              </div>
              <div className="rounded-[24px] bg-[#1e1f22] p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-[#949ba4]">
                  Open / Closed
                </p>
                <p className="mt-2 text-xl font-semibold text-white">
                  {metrics.openTrades} / {metrics.closedTrades}
                </p>
              </div>
              <div className="rounded-[24px] bg-[#1e1f22] p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-[#949ba4]">
                  Avg Hold
                </p>
                <p className="mt-2 text-xl font-semibold text-white">
                  {Math.round(metrics.averageHoldMinutes)} min
                </p>
                <p className="mt-3 text-sm font-medium text-emerald-400">
                  {metrics.bestTrade
                    ? `Best: ${metrics.bestTrade.symbol} · ${formatCurrency(metrics.bestTrade.pnl)}`
                    : "Best: none"}
                </p>
                <p className="mt-2 text-sm font-medium text-rose-400">
                  {metrics.worstTrade
                    ? `Worst: ${metrics.worstTrade.symbol} · ${formatCurrency(metrics.worstTrade.pnl)}`
                    : "Worst: none"}
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-[28px] border border-white/8 bg-[#2b2d31] p-6 shadow-[0_24px_60px_rgba(0,0,0,0.3)]">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-[#949ba4]">
                Demo Range Trades
              </p>
              <p className="mt-2 text-sm text-[#b5bac1]">
                Synthetic only. Guests can review the product, but cannot create
                or modify records.
              </p>
            </div>
            <Link
              href="/demo/journal"
              className="text-sm font-medium text-[#cdd0f7] underline decoration-[#5865f2]/50 underline-offset-4"
            >
              Open full demo journal
            </Link>
          </div>

          {recentTrades.length > 0 ? (
            <div className="mt-5 rounded-[24px] border border-white/8">
              <div className="overflow-x-auto">
                <table className="min-w-[1200px] w-full divide-y divide-white/8">
                <thead className="bg-[#1e1f22] text-left text-[11px] uppercase tracking-[0.16em] text-[#949ba4]">
                  <tr>
                    <th className="w-[124px] px-2 py-2.5">Trade</th>
                    <th className="w-[106px] px-2 py-2.5">Opened</th>
                    <th className="w-[68px] px-2 py-2.5">Status</th>
                    <th className="w-[64px] px-2 py-2.5">Shares</th>
                    <th className="w-[104px] px-2 py-2.5">Invested</th>
                    <th className="w-[88px] px-2 py-2.5">Entry</th>
                    <th className="w-[88px] px-2 py-2.5">Exit</th>
                    <th className="w-[96px] px-2 py-2.5">P&amp;L</th>
                    <th className="w-[78px] px-2 py-2.5">P&amp;L %</th>
                    <th className="w-[88px] px-2 py-2.5">Review</th>
                    <th className="w-[150px] px-2 py-2.5">Tags</th>
                    <th className="w-[72px] px-2 py-2.5 text-right">View</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/6 text-[13px]">
                  {recentTrades.map((trade) => (
                    <tr key={trade.id}>
                      <td className="px-2 py-2.5">
                        <p className="whitespace-nowrap font-medium text-white">
                          {trade.symbol} · {trade.direction}
                        </p>
                        <p className="mt-1 max-w-[98px] truncate text-xs text-[#949ba4]">
                          {trade.setup}
                        </p>
                      </td>
                      <td className="whitespace-nowrap px-2 py-2.5 text-[#b5bac1]">
                        {new Intl.DateTimeFormat("en-US", {
                          month: "short",
                          day: "numeric",
                          hour: "numeric",
                          minute: "2-digit",
                        }).format(new Date(trade.openedAt))}
                      </td>
                      <td className="whitespace-nowrap px-2 py-2.5 text-[#b5bac1]">Closed</td>
                      <td className="whitespace-nowrap px-2 py-2.5 text-[#b5bac1]">
                        {trade.quantity}
                      </td>
                      <td className="whitespace-nowrap px-2 py-2.5 text-[#b5bac1]">
                        {formatCurrency(getMarketValue(trade))}
                      </td>
                      <td className="whitespace-nowrap px-2 py-2.5 text-[#b5bac1]">
                        {formatCurrency(trade.entryPrice)}
                      </td>
                      <td className="whitespace-nowrap px-2 py-2.5 text-[#b5bac1]">
                        {formatCurrency(trade.exitPrice)}
                      </td>
                      <td
                        className={`whitespace-nowrap px-2 py-2.5 font-medium ${
                          trade.pnl >= 0 ? "text-emerald-400" : "text-rose-400"
                        }`}
                      >
                        {formatCurrency(trade.pnl)}
                      </td>
                      <td
                        className={`whitespace-nowrap px-2 py-2.5 font-medium ${
                          trade.pnlPercent >= 0 ? "text-emerald-400" : "text-rose-400"
                        }`}
                      >
                        {formatPercent(trade.pnlPercent / 100)}
                      </td>
                      <td className="whitespace-nowrap px-2 py-2.5 text-[#b5bac1]">
                        {trade.grade} · {trade.confidenceRating}/5
                      </td>
                      <td className="px-2 py-2.5 text-[#b5bac1]">
                        <div className="flex max-w-[136px] flex-wrap gap-1">
                          {trade.tags.slice(0, 2).map((tag) => (
                            <span
                              key={tag}
                              className="rounded-full bg-white/6 px-2 py-1 text-[11px] text-[#dbdee1]"
                            >
                              {tag}
                            </span>
                          ))}
                          {trade.mistakes.slice(0, 1).map((mistake) => (
                            <span
                              key={mistake}
                              className="rounded-full bg-rose-500/12 px-2 py-1 text-[11px] text-rose-300"
                            >
                              {mistake}
                            </span>
                          ))}
                          {trade.tags.length === 0 && trade.mistakes.length === 0 ? (
                            <span className="text-[11px] text-[#6d7278]">None</span>
                          ) : null}
                        </div>
                      </td>
                      <td className="px-2 py-2.5 text-right">
                        <Link
                          href={`/demo/trades/${trade.id}`}
                          className="rounded-xl border border-white/10 bg-[#1e1f22] px-3 py-2 text-sm font-medium text-[#dbdee1] transition hover:bg-[#18191c] hover:text-white"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="mt-5 rounded-2xl border border-white/8 bg-[#1e1f22] px-4 py-4 text-sm leading-7 text-[#b5bac1]">
              No demo trades match this timeframe.
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
