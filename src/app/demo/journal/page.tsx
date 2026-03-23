import Link from "next/link";

import { DashboardRangePicker } from "@/components/dashboard-range-picker";
import { WorkspaceTabs } from "@/components/workspace-tabs";
import {
  formatCurrency,
  formatDateTime,
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

function normalizeToken(value: string | undefined) {
  return value?.trim().toLowerCase() ?? "";
}

export default async function DemoJournalPage({
  searchParams,
}: {
  searchParams: Promise<{
    range?: string;
    symbol?: string;
    setup?: string;
    direction?: string;
    followedPlan?: string;
    tag?: string;
    mistake?: string;
  }>;
}) {
  const resolvedSearchParams = await searchParams;
  const selectedRange = normalizeTradeRange(resolvedSearchParams.range);
  const baseTrades = getDemoMetrics(selectedRange).trades;
  const symbolFilter = resolvedSearchParams.symbol?.trim().toUpperCase() ?? "";
  const setupFilter = resolvedSearchParams.setup?.trim().toLowerCase() ?? "";
  const directionFilter =
    resolvedSearchParams.direction === "Long" ||
    resolvedSearchParams.direction === "Short"
      ? resolvedSearchParams.direction
      : "";
  const followedPlanFilter =
    resolvedSearchParams.followedPlan === "yes" ||
    resolvedSearchParams.followedPlan === "no"
      ? resolvedSearchParams.followedPlan
      : "";
  const tagFilter = normalizeToken(resolvedSearchParams.tag);
  const mistakeFilter = normalizeToken(resolvedSearchParams.mistake);

  const filteredTrades = baseTrades.filter((trade) => {
    if (symbolFilter && !trade.symbol.startsWith(symbolFilter)) {
      return false;
    }
    if (setupFilter && !trade.setup.toLowerCase().includes(setupFilter)) {
      return false;
    }
    if (directionFilter && trade.direction !== directionFilter) {
      return false;
    }
    if (followedPlanFilter) {
      const requiredValue = followedPlanFilter === "yes";

      if (trade.followedPlan !== requiredValue) {
        return false;
      }
    }
    if (tagFilter && !trade.tags.some((tag) => tag === tagFilter)) {
      return false;
    }
    if (
      mistakeFilter &&
      !trade.mistakes.some((mistake) => mistake.toLowerCase() === mistakeFilter)
    ) {
      return false;
    }

    return true;
  });

  const totalMoneyTraded = filteredTrades.reduce(
    (total, trade) => total + getMarketValue(trade),
    0,
  );
  const totalPnl = filteredTrades.reduce((total, trade) => total + trade.pnl, 0);
  const followedPlanRate = filteredTrades.length
    ? filteredTrades.filter((trade) => trade.followedPlan).length / filteredTrades.length
    : 0;

  const setupTotals = new Map<string, number>();
  const mistakeCounts = new Map<string, number>();

  for (const trade of filteredTrades) {
    setupTotals.set(trade.setup, (setupTotals.get(trade.setup) ?? 0) + trade.pnl);

    for (const mistake of trade.mistakes) {
      mistakeCounts.set(mistake, (mistakeCounts.get(mistake) ?? 0) + 1);
    }
  }

  const bestSetupEntry = Array.from(setupTotals.entries()).sort(
    (left, right) => right[1] - left[1],
  )[0];
  const mostCommonMistakeEntry = Array.from(mistakeCounts.entries()).sort(
    (left, right) => right[1] - left[1],
  )[0];

  return (
    <main className="px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-4">
        <WorkspaceTabs variant="demo" />

        <section className="flex flex-col gap-4 rounded-[28px] border border-white/8 bg-[#2b2d31] p-6 shadow-[0_24px_60px_rgba(0,0,0,0.3)] md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.22em] text-[#949ba4]">
              Demo Journal
            </p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white">
              Filter the demo like a real account
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#b5bac1]">
              {getTradeRangeLabel(selectedRange)}. Guests can inspect setups,
              mistakes, and plan adherence, but cannot insert or modify data.
            </p>
          </div>

        </section>

        <section className="grid gap-4 xl:grid-cols-[1.25fr_0.75fr]">
          <div className="rounded-[28px] border border-white/8 bg-[#2b2d31] p-6 shadow-[0_24px_60px_rgba(0,0,0,0.3)]">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.2em] text-[#949ba4]">
                  Filtered Summary
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-white">
                  Demo review metrics
                </h2>
              </div>

              <DashboardRangePicker
                options={rangeOptions}
                selectedRange={selectedRange}
              />
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-[24px] bg-[#1e1f22] p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-[#949ba4]">
                  Trades
                </p>
                <p className="mt-2 text-2xl font-semibold text-white">
                  {filteredTrades.length}
                </p>
              </div>
              <div className="rounded-[24px] bg-[#1e1f22] p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-[#949ba4]">
                  Realized P&amp;L
                </p>
                <p className="mt-2 text-2xl font-semibold text-white">
                  {formatCurrency(totalPnl)}
                </p>
              </div>
              <div className="rounded-[24px] bg-[#1e1f22] p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-[#949ba4]">
                  Return %
                </p>
                <p className="mt-2 text-2xl font-semibold text-white">
                  {formatPercent(totalMoneyTraded ? totalPnl / totalMoneyTraded : 0)}
                </p>
              </div>
              <div className="rounded-[24px] bg-[#1e1f22] p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-[#949ba4]">
                  Followed Plan
                </p>
                <p className="mt-2 text-2xl font-semibold text-white">
                  {filteredTrades.length ? formatPercent(followedPlanRate) : "--"}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-[28px] border border-white/8 bg-[#2b2d31] p-6 shadow-[0_24px_60px_rgba(0,0,0,0.3)]">
            <p className="text-sm uppercase tracking-[0.2em] text-[#949ba4]">
              Insight Snapshot
            </p>
            <div className="mt-5 grid gap-4">
              <div className="rounded-[24px] bg-[#1e1f22] p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-[#949ba4]">
                  Best Setup
                </p>
                <p className="mt-2 text-xl font-semibold text-white">
                  {bestSetupEntry?.[0] ?? "None yet"}
                </p>
                <p className="mt-2 text-sm text-emerald-400">
                  {bestSetupEntry
                    ? formatCurrency(bestSetupEntry[1])
                    : "Use setup labels to compare edge."}
                </p>
              </div>
              <div className="rounded-[24px] bg-[#1e1f22] p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-[#949ba4]">
                  Most Common Mistake
                </p>
                <p className="mt-2 text-xl font-semibold text-white">
                  {mostCommonMistakeEntry?.[0] ?? "No mistake tags yet"}
                </p>
                <p className="mt-2 text-sm text-rose-400">
                  {mostCommonMistakeEntry
                    ? `${mostCommonMistakeEntry[1]} tagged trade${mostCommonMistakeEntry[1] === 1 ? "" : "s"}`
                    : "Synthetic trades stay read-only."}
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-[28px] border border-white/8 bg-[#2b2d31] p-6 shadow-[0_24px_60px_rgba(0,0,0,0.3)]">
          <form className="grid gap-4 lg:grid-cols-[1fr_1fr_0.9fr_0.9fr_1fr_1fr_auto]">
            <input type="hidden" name="range" value={selectedRange} />
            <div>
              <label
                htmlFor="symbol"
                className="text-xs font-medium uppercase tracking-[0.18em] text-[#949ba4]"
              >
                Symbol
              </label>
              <input
                id="symbol"
                name="symbol"
                type="text"
                defaultValue={symbolFilter}
                placeholder="AAPL"
                className="mt-3 w-full rounded-2xl border border-white/10 bg-[#1e1f22] px-4 py-3 text-sm text-white outline-none transition placeholder:text-[#6d7278] focus:border-[#5865f2]"
              />
            </div>
            <div>
              <label
                htmlFor="setup"
                className="text-xs font-medium uppercase tracking-[0.18em] text-[#949ba4]"
              >
                Setup
              </label>
              <input
                id="setup"
                name="setup"
                type="text"
                defaultValue={resolvedSearchParams.setup ?? ""}
                placeholder="Opening range breakout"
                className="mt-3 w-full rounded-2xl border border-white/10 bg-[#1e1f22] px-4 py-3 text-sm text-white outline-none transition placeholder:text-[#6d7278] focus:border-[#5865f2]"
              />
            </div>
            <div>
              <label
                htmlFor="direction"
                className="text-xs font-medium uppercase tracking-[0.18em] text-[#949ba4]"
              >
                Direction
              </label>
              <select
                id="direction"
                name="direction"
                defaultValue={directionFilter}
                className="mt-3 w-full rounded-2xl border border-white/10 bg-[#1e1f22] px-4 py-3 text-sm text-white outline-none transition focus:border-[#5865f2]"
              >
                <option value="">All</option>
                <option value="Long">Long</option>
                <option value="Short">Short</option>
              </select>
            </div>
            <div>
              <label
                htmlFor="followedPlan"
                className="text-xs font-medium uppercase tracking-[0.18em] text-[#949ba4]"
              >
                Plan
              </label>
              <select
                id="followedPlan"
                name="followedPlan"
                defaultValue={followedPlanFilter}
                className="mt-3 w-full rounded-2xl border border-white/10 bg-[#1e1f22] px-4 py-3 text-sm text-white outline-none transition focus:border-[#5865f2]"
              >
                <option value="">All</option>
                <option value="yes">Followed</option>
                <option value="no">Broke</option>
              </select>
            </div>
            <div>
              <label
                htmlFor="tag"
                className="text-xs font-medium uppercase tracking-[0.18em] text-[#949ba4]"
              >
                Tag
              </label>
              <input
                id="tag"
                name="tag"
                type="text"
                defaultValue={tagFilter}
                placeholder="trend"
                className="mt-3 w-full rounded-2xl border border-white/10 bg-[#1e1f22] px-4 py-3 text-sm text-white outline-none transition placeholder:text-[#6d7278] focus:border-[#5865f2]"
              />
            </div>
            <div>
              <label
                htmlFor="mistake"
                className="text-xs font-medium uppercase tracking-[0.18em] text-[#949ba4]"
              >
                Mistake
              </label>
              <input
                id="mistake"
                name="mistake"
                type="text"
                defaultValue={mistakeFilter}
                placeholder="late entry"
                className="mt-3 w-full rounded-2xl border border-white/10 bg-[#1e1f22] px-4 py-3 text-sm text-white outline-none transition placeholder:text-[#6d7278] focus:border-[#5865f2]"
              />
            </div>
            <div className="flex items-end gap-3">
              <button
                type="submit"
                className="w-full rounded-2xl bg-[#5865f2] px-4 py-3 text-sm font-medium text-white transition hover:bg-[#4752c4]"
              >
                Apply
              </button>
              <Link
                href={`/demo/journal?range=${selectedRange}`}
                className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-[#dbdee1] transition hover:bg-white/10"
              >
                Reset
              </Link>
            </div>
          </form>
        </section>

        <section className="rounded-[28px] border border-white/8 bg-[#2b2d31] p-6 shadow-[0_24px_60px_rgba(0,0,0,0.3)]">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-[#949ba4]">
                Demo Trades
              </p>
              <p className="mt-2 text-sm text-[#b5bac1]">
                {filteredTrades.length} matching synthetic trade
                {filteredTrades.length === 1 ? "" : "s"}.
              </p>
            </div>
          </div>

          {filteredTrades.length > 0 ? (
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
                    <th className="w-[78px] px-2 py-2.5">Return</th>
                    <th className="w-[88px] px-2 py-2.5">Review</th>
                    <th className="w-[150px] px-2 py-2.5">Tags</th>
                    <th className="w-[72px] px-2 py-2.5 text-right">View</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/6 bg-[#2b2d31] text-[13px]">
                  {filteredTrades.map((trade) => (
                    <tr key={trade.id} className="hover:bg-white/4">
                      <td className="px-2 py-2.5">
                        <p className="whitespace-nowrap font-medium text-white">
                          {trade.symbol} · {trade.direction}
                        </p>
                        <p className="mt-1 max-w-[98px] truncate text-xs text-[#949ba4]">
                          {trade.setup}
                        </p>
                      </td>
                      <td className="whitespace-nowrap px-2 py-2.5 text-[#b5bac1]">
                        {formatDateTime(trade.openedAt)}
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
            <div className="mt-5 rounded-[24px] border border-white/8 bg-[#1e1f22] px-4 py-4 text-sm leading-7 text-[#b5bac1]">
              No demo trades match the current filters.
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
