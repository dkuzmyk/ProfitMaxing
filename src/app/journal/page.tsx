import Link from "next/link";
import { redirect } from "next/navigation";

import { DashboardRangePicker } from "@/components/dashboard-range-picker";
import { WorkspaceTabs } from "@/components/workspace-tabs";
import { JournalTable } from "@/components/journal-table";
import type { JournalTrade } from "@/components/journal-table";
import { formatCurrency, formatPercent } from "@/lib/demo-data";
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

const VALID_SORT_KEYS = new Set(["trade_date", "realized_pnl", "realized_pnl_percent", "grade", "confidence_rating"]);

type JournalSearchParams = {
  range?: string;
  symbol?: string;
  setup?: string;
  status?: string;
  direction?: string;
  followedPlan?: string;
  tag?: string;
  mistake?: string;
  grade?: string;
  sort?: string;
  sortDir?: string;
  page?: string;
  imported?: string;
};

function normalizeSort(key: string | undefined, dir: string | undefined): { key: string; dir: "asc" | "desc" } {
  return {
    key: VALID_SORT_KEYS.has(key ?? "") ? key! : "trade_date",
    dir: dir === "asc" ? "asc" : "desc",
  };
}

function normalizeListFilter(value: string | undefined) {
  return value?.trim().toLowerCase() ?? "";
}

function buildPageHref(params: JournalSearchParams, page: number) {
  const nextSearchParams = new URLSearchParams();

  if (params.range) nextSearchParams.set("range", params.range);
  if (params.symbol) nextSearchParams.set("symbol", params.symbol);
  if (params.setup) nextSearchParams.set("setup", params.setup);
  if (params.status) nextSearchParams.set("status", params.status);
  if (params.direction) nextSearchParams.set("direction", params.direction);
  if (params.followedPlan) nextSearchParams.set("followedPlan", params.followedPlan);
  if (params.tag) nextSearchParams.set("tag", params.tag);
  if (params.mistake) nextSearchParams.set("mistake", params.mistake);
  if (params.grade) nextSearchParams.set("grade", params.grade);
  if (params.sort) nextSearchParams.set("sort", params.sort);
  if (params.sortDir) nextSearchParams.set("sortDir", params.sortDir);
  if (page > 1) nextSearchParams.set("page", String(page));

  const query = nextSearchParams.toString();
  return query ? `/journal?${query}` : "/journal";
}

function sortColumnHref(params: JournalSearchParams, key: string, activeKey: string, activeDir: "asc" | "desc") {
  const next = { ...params };
  next.sort = key;
  next.sortDir = activeKey === key && activeDir === "desc" ? "asc" : "desc";
  delete next.page;
  return buildPageHref(next, 1);
}

function buildExportHref(params: JournalSearchParams) {
  const sp = new URLSearchParams();
  if (params.range) sp.set("range", params.range);
  if (params.symbol) sp.set("symbol", params.symbol);
  if (params.setup) sp.set("setup", params.setup);
  if (params.status) sp.set("status", params.status);
  if (params.direction) sp.set("direction", params.direction);
  if (params.followedPlan) sp.set("followedPlan", params.followedPlan);
  if (params.tag) sp.set("tag", params.tag);
  if (params.mistake) sp.set("mistake", params.mistake);
  if (params.grade) sp.set("grade", params.grade);
  if (params.sort) sp.set("sort", params.sort);
  if (params.sortDir) sp.set("sortDir", params.sortDir);
  const q = sp.toString();
  return q ? `/journal/export?${q}` : "/journal/export";
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
  const importedCount = resolvedSearchParams.imported
    ? Number.parseInt(resolvedSearchParams.imported, 10) || 0
    : null;
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
    resolvedSearchParams.direction === "Long" || resolvedSearchParams.direction === "Short"
      ? resolvedSearchParams.direction
      : "";
  const followedPlanFilter =
    resolvedSearchParams.followedPlan === "yes" || resolvedSearchParams.followedPlan === "no"
      ? resolvedSearchParams.followedPlan
      : "";
  const tagFilter = normalizeListFilter(resolvedSearchParams.tag);
  const mistakeFilter = normalizeListFilter(resolvedSearchParams.mistake);
  const gradeFilter = ["A", "B", "C", "D", "F"].includes(resolvedSearchParams.grade ?? "")
    ? resolvedSearchParams.grade!
    : "";
  const { key: sortKey, dir: sortDir } = normalizeSort(
    resolvedSearchParams.sort,
    resolvedSearchParams.sortDir,
  );
  const currentPage = Math.max(1, Number.parseInt(resolvedSearchParams.page ?? "1", 10) || 1);
  const rangeFrom = (currentPage - 1) * pageSize;
  const rangeTo = rangeFrom + pageSize - 1;

  let summaryQuery = supabase
    .from("trades")
    .select("id, status, setup, entry_value, realized_pnl, followed_plan, mistake_tags")
    .order("trade_date", { ascending: false })
    .order("opened_at", { ascending: false });

  let tradesQuery = supabase
    .from("trades")
    .select(
      "id, symbol, setup, direction, opened_at, closed_at, quantity, status, entry_value, entry_price, exit_price, realized_pnl, realized_pnl_percent, followed_plan, confidence_rating, grade, tags, mistake_tags, holding_minutes, thesis, notes, lessons",
      { count: "exact" },
    )
    .range(rangeFrom, rangeTo);

  // Apply sort to trades query
  if (sortKey === "grade") {
    tradesQuery = tradesQuery.order("grade", { ascending: sortDir === "asc", nullsFirst: false });
  } else if (sortKey !== "trade_date") {
    tradesQuery = tradesQuery
      .order(sortKey, { ascending: sortDir === "asc", nullsFirst: false })
      .order("trade_date", { ascending: false });
  } else {
    tradesQuery = tradesQuery
      .order("trade_date", { ascending: sortDir === "asc" })
      .order("opened_at", { ascending: sortDir === "asc" });
  }

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
  if (gradeFilter) {
    summaryQuery = summaryQuery.eq("grade", gradeFilter);
    tradesQuery = tradesQuery.eq("grade", gradeFilter);
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
  const followedPlanCount = safeSummaryTrades.filter((trade) => trade.followed_plan === true).length;
  const reviewedTradeCount = safeSummaryTrades.filter((trade) => trade.followed_plan != null).length;
  const followedPlanRate = reviewedTradeCount ? followedPlanCount / reviewedTradeCount : 0;
  const returnPercent = totalMoneyTraded ? totalRealizedPnl / totalMoneyTraded : 0;

  const setupTotals = new Map<string, number>();
  const mistakeCounts = new Map<string, number>();

  for (const trade of safeSummaryTrades) {
    if (trade.status === "Closed" && trade.setup) {
      setupTotals.set(trade.setup, (setupTotals.get(trade.setup) ?? 0) + Number(trade.realized_pnl));
    }
    for (const mistake of trade.mistake_tags ?? []) {
      mistakeCounts.set(mistake, (mistakeCounts.get(mistake) ?? 0) + 1);
    }
  }

  const bestSetupEntry = Array.from(setupTotals.entries()).sort((l, r) => r[1] - l[1])[0];
  const mostCommonMistakeEntry = Array.from(mistakeCounts.entries()).sort((l, r) => r[1] - l[1])[0];

  const hasActiveFilter = Boolean(
    symbolFilter || setupFilter || statusFilter || directionFilter ||
    followedPlanFilter || tagFilter || mistakeFilter || gradeFilter,
  );

  return (
    <main className="px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-4">
        <WorkspaceTabs variant="real" />

        {importedCount != null && importedCount > 0 && (
          <div className="rounded-[24px] border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
            {importedCount} trade{importedCount === 1 ? "" : "s"} imported successfully.
          </div>
        )}

        {/* ── Header + KPI Strip ── */}
        <section className="overflow-hidden rounded-[28px] border border-white/8 bg-[#2b2d31] shadow-[0_24px_60px_rgba(0,0,0,0.3)]">
          <div className="flex flex-col gap-3 p-5 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-[10px] font-medium uppercase tracking-[0.24em] text-[#949ba4]">
                Real Journal
              </p>
              <h1 className="mt-1 text-xl font-semibold tracking-tight text-white">
                Review setups and mistakes
              </h1>
              <p className="mt-0.5 text-xs text-[#b5bac1]">
                {getTradeRangeLabel(selectedRange)}{hasActiveFilter ? " · filtered" : ""}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-3">
              <Link
                href="/trades/new"
                className="rounded-[20px] bg-[#5865f2] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#4752c4]"
              >
                + Add Trade
              </Link>
              <DashboardRangePicker options={rangeOptions} selectedRange={selectedRange} />
            </div>
          </div>
          {/* KPI strip */}
          <div className="flex overflow-x-auto divide-x divide-white/8 border-t border-white/8">
            {[
              { label: "Total Trades", value: String(filteredTradeCount), cls: "text-white" },
              {
                label: "Realized P&L",
                value: formatCurrency(totalRealizedPnl),
                cls: totalRealizedPnl > 0 ? "text-emerald-400" : totalRealizedPnl < 0 ? "text-rose-400" : "text-white",
              },
              {
                label: "Return %",
                value: totalMoneyTraded > 0 ? formatPercent(returnPercent) : "--",
                cls: returnPercent > 0 ? "text-emerald-400" : returnPercent < 0 ? "text-rose-400" : "text-white",
              },
              {
                label: "Followed Plan",
                value: reviewedTradeCount ? formatPercent(followedPlanRate) : "--",
                cls: followedPlanRate >= 0.75 ? "text-emerald-400" : followedPlanRate >= 0.5 ? "text-[#b5bac1]" : followedPlanRate > 0 ? "text-rose-400" : "text-[#b5bac1]",
              },
            ].map(({ label, value, cls }) => (
              <div key={label} className="flex min-w-[120px] flex-1 flex-col gap-1 px-5 py-4">
                <p className="whitespace-nowrap text-[10px] font-medium uppercase tracking-[0.2em] text-[#949ba4]">{label}</p>
                <p className={`text-xl font-semibold tabular-nums ${cls}`}>{value}</p>
              </div>
            ))}
          </div>
          {/* Context bar */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-white/8 bg-[#1e1f22]/60 px-5 py-2">
            <span className="text-[11px] text-[#949ba4]">Open <span className="text-white">{openTrades}</span></span>
            <span className="select-none text-white/20">·</span>
            <span className="text-[11px] text-[#949ba4]">Closed <span className="text-white">{closedTrades}</span></span>
            {totalMoneyTraded > 0 && (
              <>
                <span className="select-none text-white/20">·</span>
                <span className="text-[11px] text-[#949ba4]">Traded <span className="text-white">{formatCurrency(totalMoneyTraded)}</span></span>
              </>
            )}
            {bestSetupEntry && (
              <>
                <span className="select-none text-white/20">·</span>
                <span className="text-[11px] text-[#949ba4]">Best setup <span className="text-white">{bestSetupEntry[0]}</span> <span className="text-emerald-400">{formatCurrency(bestSetupEntry[1])}</span></span>
              </>
            )}
            {mostCommonMistakeEntry && (
              <>
                <span className="select-none text-white/20">·</span>
                <span className="text-[11px] text-[#949ba4]">Top mistake <span className="text-white">{mostCommonMistakeEntry[0]}</span> <span className="text-rose-400">{mostCommonMistakeEntry[1]}×</span></span>
              </>
            )}
          </div>
        </section>

        {/* ── Filters ── */}
        <section className="rounded-[28px] border border-white/8 bg-[#2b2d31] p-5">
          <form className="grid gap-3 lg:grid-cols-[1fr_1fr_0.8fr_0.8fr_0.8fr_0.8fr_1fr_1fr_auto]">
            <input type="hidden" name="range" value={selectedRange} />
            <div>
              <label htmlFor="symbol" className="text-[10px] font-medium uppercase tracking-[0.2em] text-[#949ba4]">Symbol</label>
              <input
                id="symbol" name="symbol" type="text" defaultValue={symbolFilter} placeholder="AAPL"
                className="mt-2 w-full rounded-[16px] border border-white/10 bg-[#1e1f22] px-3 py-2 text-sm text-white outline-none transition placeholder:text-[#6d7278] focus:border-[#5865f2]"
              />
            </div>
            <div>
              <label htmlFor="setup" className="text-[10px] font-medium uppercase tracking-[0.2em] text-[#949ba4]">Setup</label>
              <input
                id="setup" name="setup" type="text" defaultValue={setupFilter} placeholder="Opening range…"
                className="mt-2 w-full rounded-[16px] border border-white/10 bg-[#1e1f22] px-3 py-2 text-sm text-white outline-none transition placeholder:text-[#6d7278] focus:border-[#5865f2]"
              />
            </div>
            <div>
              <label htmlFor="status" className="text-[10px] font-medium uppercase tracking-[0.2em] text-[#949ba4]">Status</label>
              <select id="status" name="status" defaultValue={statusFilter} className="mt-2 w-full rounded-[16px] border border-white/10 bg-[#1e1f22] px-3 py-2 text-sm text-white outline-none transition focus:border-[#5865f2]">
                <option value="">All</option>
                <option value="Open">Open</option>
                <option value="Closed">Closed</option>
              </select>
            </div>
            <div>
              <label htmlFor="direction" className="text-[10px] font-medium uppercase tracking-[0.2em] text-[#949ba4]">Direction</label>
              <select id="direction" name="direction" defaultValue={directionFilter} className="mt-2 w-full rounded-[16px] border border-white/10 bg-[#1e1f22] px-3 py-2 text-sm text-white outline-none transition focus:border-[#5865f2]">
                <option value="">All</option>
                <option value="Long">Long</option>
                <option value="Short">Short</option>
              </select>
            </div>
            <div>
              <label htmlFor="followedPlan" className="text-[10px] font-medium uppercase tracking-[0.2em] text-[#949ba4]">Plan</label>
              <select id="followedPlan" name="followedPlan" defaultValue={followedPlanFilter} className="mt-2 w-full rounded-[16px] border border-white/10 bg-[#1e1f22] px-3 py-2 text-sm text-white outline-none transition focus:border-[#5865f2]">
                <option value="">All</option>
                <option value="yes">Followed</option>
                <option value="no">Broke</option>
              </select>
            </div>
            <div>
              <label htmlFor="grade" className="text-[10px] font-medium uppercase tracking-[0.2em] text-[#949ba4]">Grade</label>
              <select id="grade" name="grade" defaultValue={gradeFilter} className="mt-2 w-full rounded-[16px] border border-white/10 bg-[#1e1f22] px-3 py-2 text-sm text-white outline-none transition focus:border-[#5865f2]">
                <option value="">All</option>
                <option value="A">A</option>
                <option value="B">B</option>
                <option value="C">C</option>
                <option value="D">D</option>
                <option value="F">F</option>
              </select>
            </div>
            <div>
              <label htmlFor="tag" className="text-[10px] font-medium uppercase tracking-[0.2em] text-[#949ba4]">Tag</label>
              <input
                id="tag" name="tag" type="text" defaultValue={tagFilter} placeholder="trend"
                className="mt-2 w-full rounded-[16px] border border-white/10 bg-[#1e1f22] px-3 py-2 text-sm text-white outline-none transition placeholder:text-[#6d7278] focus:border-[#5865f2]"
              />
            </div>
            <div>
              <label htmlFor="mistake" className="text-[10px] font-medium uppercase tracking-[0.2em] text-[#949ba4]">Mistake</label>
              <input
                id="mistake" name="mistake" type="text" defaultValue={mistakeFilter} placeholder="late entry"
                className="mt-2 w-full rounded-[16px] border border-white/10 bg-[#1e1f22] px-3 py-2 text-sm text-white outline-none transition placeholder:text-[#6d7278] focus:border-[#5865f2]"
              />
            </div>
            <div className="flex items-end gap-2">
              <button type="submit" className="w-full rounded-[16px] bg-[#5865f2] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#4752c4]">
                Apply
              </button>
              <Link href={buildPageHref({ range: selectedRange }, 1)} className="rounded-[16px] border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-[#dbdee1] transition hover:bg-white/10">
                Reset
              </Link>
            </div>
          </form>
        </section>

        {/* ── Trades Table ── */}
        <section className="rounded-[28px] border border-white/8 bg-[#2b2d31] p-5">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-[#949ba4]">Filtered Trades</p>
            <div className="flex items-center gap-3">
              <p className="text-[11px] text-[#6d7278]">
                {count ?? 0} trades · page {Math.min(currentPage, totalPages)} of {totalPages}
              </p>
              <Link
                href={buildExportHref(resolvedSearchParams)}
                className="rounded-[14px] border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] font-medium text-[#b5bac1] transition hover:bg-white/10 hover:text-white"
              >
                Export CSV
              </Link>
            </div>
          </div>

          {hasDataError ? (
            <p className="rounded-2xl border border-[#f0b232]/20 bg-[#f0b232]/10 px-4 py-3 text-sm leading-7 text-[#f5c96a]">
              The journal query failed. Run the latest Supabase migration before using the new journaling fields.
            </p>
          ) : safeTrades.length > 0 ? (
            <JournalTable
              trades={safeTrades}
              sortKey={sortKey}
              sortDir={sortDir}
              sortHrefs={{
                date: sortColumnHref(resolvedSearchParams, "trade_date", sortKey, sortDir),
                pnl: sortColumnHref(resolvedSearchParams, "realized_pnl", sortKey, sortDir),
                returnPct: sortColumnHref(resolvedSearchParams, "realized_pnl_percent", sortKey, sortDir),
                grade: sortColumnHref(resolvedSearchParams, "grade", sortKey, sortDir),
              }}
            />
          ) : (
            <div className="rounded-[20px] border border-white/8 bg-[#1e1f22] px-4 py-4 text-sm text-[#b5bac1]">
              No trades match the current journal filters.
            </div>
          )}

          {totalPages > 1 ? (
            <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
              <Link
                href={buildPageHref(resolvedSearchParams, Math.max(1, currentPage - 1))}
                className={`rounded-[16px] border px-4 py-2 text-sm font-medium transition ${
                  currentPage === 1
                    ? "pointer-events-none border-white/6 bg-white/5 text-[#6d7278]"
                    : "border-white/10 bg-white/5 text-[#dbdee1] hover:bg-white/10"
                }`}
              >
                Previous
              </Link>
              <p className="text-[11px] text-[#949ba4]">
                Page {Math.min(currentPage, totalPages)} of {totalPages}
              </p>
              <Link
                href={buildPageHref(resolvedSearchParams, Math.min(totalPages, currentPage + 1))}
                className={`rounded-[16px] border px-4 py-2 text-sm font-medium transition ${
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
