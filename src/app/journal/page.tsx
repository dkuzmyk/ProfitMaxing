import Link from "next/link";
import { redirect } from "next/navigation";

import { DashboardRangePicker } from "@/components/dashboard-range-picker";
import { formatCurrency, formatDateTime, formatPercent } from "@/lib/demo-data";
import { createClient } from "@/lib/supabase/server";
import {
  getTradeRangeCutoff,
  getTradeRangeLabel,
  normalizeTradeRange,
} from "@/lib/trade-metrics";

const pageSize = 25;

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

type JournalSearchParams = {
  range?: string;
  symbol?: string;
  setup?: string;
  status?: string;
  direction?: string;
  followedPlan?: string;
  tag?: string;
  mistake?: string;
  page?: string;
};

type JournalTrade = {
  id: string;
  symbol: string;
  setup: string | null;
  direction: "Long" | "Short";
  opened_at: string;
  closed_at: string | null;
  quantity: number;
  status: "Open" | "Closed";
  entry_value: number | string;
  entry_price: number | string;
  exit_price: number | string | null;
  realized_pnl: number | string;
  realized_pnl_percent: number | string | null;
  followed_plan: boolean | null;
  confidence_rating: number | null;
  grade: "A" | "B" | "C" | "D" | "F" | null;
  tags: string[];
  mistake_tags: string[];
};

function normalizeListFilter(value: string | undefined) {
  return value?.trim().toLowerCase() ?? "";
}

function buildPageHref(params: JournalSearchParams, page: number) {
  const nextSearchParams = new URLSearchParams();

  if (params.range) {
    nextSearchParams.set("range", params.range);
  }
  if (params.symbol) {
    nextSearchParams.set("symbol", params.symbol);
  }
  if (params.setup) {
    nextSearchParams.set("setup", params.setup);
  }
  if (params.status) {
    nextSearchParams.set("status", params.status);
  }
  if (params.direction) {
    nextSearchParams.set("direction", params.direction);
  }
  if (params.followedPlan) {
    nextSearchParams.set("followedPlan", params.followedPlan);
  }
  if (params.tag) {
    nextSearchParams.set("tag", params.tag);
  }
  if (params.mistake) {
    nextSearchParams.set("mistake", params.mistake);
  }
  if (page > 1) {
    nextSearchParams.set("page", String(page));
  }

  const query = nextSearchParams.toString();

  return query ? `/journal?${query}` : "/journal";
}

export default async function JournalPage({
  searchParams,
}: {
  searchParams: Promise<JournalSearchParams>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?message=Please sign in to view your journal.");
  }

  const resolvedSearchParams = await searchParams;
  const selectedRange = normalizeTradeRange(resolvedSearchParams.range);
  const rangeCutoff = getTradeRangeCutoff(selectedRange);
  const rangeCutoffDate = rangeCutoff?.toISOString().slice(0, 10);
  const symbolFilter = resolvedSearchParams.symbol?.trim().toUpperCase() ?? "";
  const setupFilter = resolvedSearchParams.setup?.trim() ?? "";
  const statusFilter =
    resolvedSearchParams.status === "Open" || resolvedSearchParams.status === "Closed"
      ? resolvedSearchParams.status
      : "";
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
  const tagFilter = normalizeListFilter(resolvedSearchParams.tag);
  const mistakeFilter = normalizeListFilter(resolvedSearchParams.mistake);
  const currentPage = Math.max(
    1,
    Number.parseInt(resolvedSearchParams.page ?? "1", 10) || 1,
  );
  const rangeFrom = (currentPage - 1) * pageSize;
  const rangeTo = rangeFrom + pageSize - 1;

  let summaryQuery = supabase
    .from("trades")
    .select(
      "id, status, setup, entry_value, realized_pnl, followed_plan, mistake_tags",
    )
    .order("trade_date", { ascending: false })
    .order("opened_at", { ascending: false });

  let tradesQuery = supabase
    .from("trades")
    .select(
      "id, symbol, setup, direction, opened_at, closed_at, quantity, status, entry_value, entry_price, exit_price, realized_pnl, realized_pnl_percent, followed_plan, confidence_rating, grade, tags, mistake_tags",
      { count: "exact" },
    )
    .order("trade_date", { ascending: false })
    .order("opened_at", { ascending: false })
    .range(rangeFrom, rangeTo);

  if (rangeCutoffDate) {
    summaryQuery = summaryQuery.gte("trade_date", rangeCutoffDate);
    tradesQuery = tradesQuery.gte("trade_date", rangeCutoffDate);
  }
  if (symbolFilter) {
    summaryQuery = summaryQuery.ilike("symbol", `${symbolFilter}%`);
    tradesQuery = tradesQuery.ilike("symbol", `${symbolFilter}%`);
  }
  if (setupFilter) {
    summaryQuery = summaryQuery.ilike("setup", `%${setupFilter}%`);
    tradesQuery = tradesQuery.ilike("setup", `%${setupFilter}%`);
  }
  if (statusFilter) {
    summaryQuery = summaryQuery.eq("status", statusFilter);
    tradesQuery = tradesQuery.eq("status", statusFilter);
  }
  if (directionFilter) {
    summaryQuery = summaryQuery.eq("direction", directionFilter);
    tradesQuery = tradesQuery.eq("direction", directionFilter);
  }
  if (followedPlanFilter) {
    const followedPlanValue = followedPlanFilter === "yes";
    summaryQuery = summaryQuery.eq("followed_plan", followedPlanValue);
    tradesQuery = tradesQuery.eq("followed_plan", followedPlanValue);
  }
  if (tagFilter) {
    summaryQuery = summaryQuery.contains("tags", [tagFilter]);
    tradesQuery = tradesQuery.contains("tags", [tagFilter]);
  }
  if (mistakeFilter) {
    summaryQuery = summaryQuery.contains("mistake_tags", [mistakeFilter]);
    tradesQuery = tradesQuery.contains("mistake_tags", [mistakeFilter]);
  }

  const [
    { data: summaryTrades, error: summaryError },
    { data: trades, error: tradesError, count },
  ] = await Promise.all([summaryQuery, tradesQuery]);

  const hasDataError = summaryError || tradesError;
  const safeSummaryTrades = summaryTrades ?? [];
  const safeTrades = (trades ?? []) as JournalTrade[];
  const totalPages = Math.max(1, Math.ceil((count ?? 0) / pageSize));
  const filteredTradeCount = safeSummaryTrades.length;
  const openTrades = safeSummaryTrades.filter((trade) => trade.status === "Open").length;
  const closedTrades = safeSummaryTrades.length - openTrades;
  const totalMoneyTraded = safeSummaryTrades.reduce(
    (total, trade) => total + Number(trade.entry_value),
    0,
  );
  const totalRealizedPnl = safeSummaryTrades.reduce(
    (total, trade) => total + Number(trade.realized_pnl),
    0,
  );
  const followedPlanCount = safeSummaryTrades.filter(
    (trade) => trade.followed_plan === true,
  ).length;
  const reviewedTradeCount = safeSummaryTrades.filter(
    (trade) => trade.followed_plan != null,
  ).length;
  const followedPlanRate = reviewedTradeCount
    ? followedPlanCount / reviewedTradeCount
    : 0;
  const returnPercent = totalMoneyTraded ? totalRealizedPnl / totalMoneyTraded : 0;

  const setupTotals = new Map<string, number>();
  const mistakeCounts = new Map<string, number>();

  for (const trade of safeSummaryTrades) {
    if (trade.status === "Closed" && trade.setup) {
      setupTotals.set(
        trade.setup,
        (setupTotals.get(trade.setup) ?? 0) + Number(trade.realized_pnl),
      );
    }

    for (const mistake of trade.mistake_tags ?? []) {
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
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <section className="flex flex-col gap-4 rounded-[28px] border border-white/8 bg-[#2b2d31] p-8 shadow-[0_32px_80px_rgba(0,0,0,0.35)] md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.25em] text-[#949ba4]">
              Real Journal
            </p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight text-white">
              Review setups and mistakes
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-[#b5bac1]">
              {getTradeRangeLabel(selectedRange)}. Use the filters to isolate
              winning conditions, repeated mistakes, and plan adherence.
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
              href="/dashboard"
              className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-[#dbdee1] transition hover:bg-white/10"
            >
              Back to dashboard
            </Link>
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
                  Journal performance
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
                  {filteredTradeCount}
                </p>
              </div>
              <div className="rounded-[24px] bg-[#1e1f22] p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-[#949ba4]">
                  Realized P&amp;L
                </p>
                <p className="mt-2 text-2xl font-semibold text-white">
                  {formatCurrency(totalRealizedPnl)}
                </p>
              </div>
              <div className="rounded-[24px] bg-[#1e1f22] p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-[#949ba4]">
                  Return %
                </p>
                <p className="mt-2 text-2xl font-semibold text-white">
                  {formatPercent(returnPercent)}
                </p>
              </div>
              <div className="rounded-[24px] bg-[#1e1f22] p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-[#949ba4]">
                  Followed Plan
                </p>
                <p className="mt-2 text-2xl font-semibold text-white">
                  {reviewedTradeCount ? formatPercent(followedPlanRate) : "--"}
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
                  Open / Closed
                </p>
                <p className="mt-2 text-xl font-semibold text-white">
                  {openTrades} / {closedTrades}
                </p>
              </div>
              <div className="rounded-[24px] bg-[#1e1f22] p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-[#949ba4]">
                  Total Traded
                </p>
                <p className="mt-2 text-xl font-semibold text-white">
                  {formatCurrency(totalMoneyTraded)}
                </p>
              </div>
              <div className="rounded-[24px] bg-[#1e1f22] p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-[#949ba4]">
                  Best Setup
                </p>
                <p className="mt-2 text-xl font-semibold text-white">
                  {bestSetupEntry?.[0] ?? "None yet"}
                </p>
                <p className="mt-2 text-sm text-emerald-400">
                  {bestSetupEntry ? formatCurrency(bestSetupEntry[1]) : "Add setup data to compare edge."}
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
                    : "Tag recurring mistakes to expose them quickly."}
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-[28px] border border-white/8 bg-[#2b2d31] p-6 shadow-[0_24px_60px_rgba(0,0,0,0.3)]">
          <form className="grid gap-4 lg:grid-cols-[1fr_1fr_0.9fr_0.9fr_0.9fr_1fr_1fr_auto]">
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
                defaultValue={setupFilter}
                placeholder="Opening range breakout"
                className="mt-3 w-full rounded-2xl border border-white/10 bg-[#1e1f22] px-4 py-3 text-sm text-white outline-none transition placeholder:text-[#6d7278] focus:border-[#5865f2]"
              />
            </div>
            <div>
              <label
                htmlFor="status"
                className="text-xs font-medium uppercase tracking-[0.18em] text-[#949ba4]"
              >
                Status
              </label>
              <select
                id="status"
                name="status"
                defaultValue={statusFilter}
                className="mt-3 w-full rounded-2xl border border-white/10 bg-[#1e1f22] px-4 py-3 text-sm text-white outline-none transition focus:border-[#5865f2]"
              >
                <option value="">All</option>
                <option value="Open">Open</option>
                <option value="Closed">Closed</option>
              </select>
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
                href={buildPageHref({ range: selectedRange }, 1)}
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
                Filtered Trades
              </p>
              <p className="mt-2 text-sm text-[#b5bac1]">
                {count ?? 0} matching trades. Page {Math.min(currentPage, totalPages)} of {totalPages}.
              </p>
            </div>
          </div>

          {hasDataError ? (
            <p className="mt-5 rounded-2xl border border-[#f0b232]/20 bg-[#f0b232]/10 px-4 py-3 text-sm leading-7 text-[#f5c96a]">
              The journal query failed. Run the latest Supabase migration before
              using the new journaling fields.
            </p>
          ) : safeTrades.length > 0 ? (
            <div className="mt-5 overflow-hidden rounded-[24px] border border-white/8">
              <table className="min-w-full divide-y divide-white/8">
                <thead className="bg-[#1e1f22] text-left text-xs uppercase tracking-[0.18em] text-[#949ba4]">
                  <tr>
                    <th className="px-4 py-3">Trade</th>
                    <th className="px-4 py-3">Opened</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Invested</th>
                    <th className="px-4 py-3">Entry</th>
                    <th className="px-4 py-3">Exit</th>
                    <th className="px-4 py-3">P&amp;L</th>
                    <th className="px-4 py-3">Return</th>
                    <th className="px-4 py-3">Plan</th>
                    <th className="px-4 py-3">Review</th>
                    <th className="px-4 py-3">Tags</th>
                    <th className="px-4 py-3 text-right">Edit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/6 text-sm">
                  {safeTrades.map((trade) => (
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
                        {formatCurrency(Number(trade.entry_value))}
                      </td>
                      <td className="px-4 py-4 text-[#b5bac1]">
                        {formatCurrency(Number(trade.entry_price))}
                      </td>
                      <td className="px-4 py-4 text-[#b5bac1]">
                        {trade.exit_price == null
                          ? "Open"
                          : formatCurrency(Number(trade.exit_price))}
                      </td>
                      <td
                        className={`px-4 py-4 font-medium ${
                          Number(trade.realized_pnl) >= 0
                            ? "text-emerald-400"
                            : "text-rose-400"
                        }`}
                      >
                        {trade.status === "Closed"
                          ? formatCurrency(Number(trade.realized_pnl))
                          : "Open"}
                      </td>
                      <td
                        className={`px-4 py-4 font-medium ${
                          Number(trade.realized_pnl_percent ?? 0) >= 0
                            ? "text-emerald-400"
                            : "text-rose-400"
                        }`}
                      >
                        {trade.realized_pnl_percent == null
                          ? "Open"
                          : formatPercent(Number(trade.realized_pnl_percent))}
                      </td>
                      <td className="px-4 py-4 text-[#b5bac1]">
                        {trade.followed_plan == null
                          ? "Unreviewed"
                          : trade.followed_plan
                            ? "Followed"
                            : "Broke"}
                      </td>
                      <td className="px-4 py-4 text-[#b5bac1]">
                        {trade.grade || "--"}
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
                      <td className="px-4 py-4 text-right">
                        <Link
                          href={`/trades/${trade.id}/edit`}
                          className="rounded-xl border border-white/10 bg-[#1e1f22] px-3 py-2 text-sm font-medium text-[#dbdee1] transition hover:bg-[#18191c] hover:text-white"
                        >
                          Edit
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="mt-5 rounded-2xl border border-white/8 bg-[#1e1f22] px-4 py-4 text-sm leading-7 text-[#b5bac1]">
              No trades match the current journal filters.
            </div>
          )}

          {totalPages > 1 ? (
            <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
              <Link
                href={buildPageHref(resolvedSearchParams, Math.max(1, currentPage - 1))}
                className={`rounded-2xl border px-4 py-2 text-sm font-medium transition ${
                  currentPage === 1
                    ? "pointer-events-none border-white/6 bg-white/5 text-[#6d7278]"
                    : "border-white/10 bg-white/5 text-[#dbdee1] hover:bg-white/10"
                }`}
              >
                Previous
              </Link>
              <p className="text-sm text-[#949ba4]">
                Page {Math.min(currentPage, totalPages)} of {totalPages}
              </p>
              <Link
                href={buildPageHref(
                  resolvedSearchParams,
                  Math.min(totalPages, currentPage + 1),
                )}
                className={`rounded-2xl border px-4 py-2 text-sm font-medium transition ${
                  currentPage >= totalPages
                    ? "pointer-events-none border-white/6 bg-white/5 text-[#6d7278]"
                    : "border-white/10 bg-white/5 text-[#dbdee1] hover:bg-white/10"
                }`}
              >
                Next
              </Link>
            </div>
          ) : null}
        </section>
      </div>
    </main>
  );
}
