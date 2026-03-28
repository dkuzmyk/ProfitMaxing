import Link from "next/link";

import { DashboardRangePicker } from "@/components/dashboard-range-picker";
import { WorkspaceTabs } from "@/components/workspace-tabs";
import { DemoJournalTable } from "@/components/demo-journal-table";
import type { DemoSortHrefs } from "@/components/demo-journal-table";
import {
  formatCurrency,
  formatPercent,
  getDemoMetrics,
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

const VALID_SORT_KEYS = new Set(["openedAt", "pnl", "pnlPercent", "grade"]);

type DemoJournalSearchParams = {
  range?: string;
  symbol?: string;
  setup?: string;
  direction?: string;
  followedPlan?: string;
  tag?: string;
  mistake?: string;
  grade?: string;
  sort?: string;
  sortDir?: string;
};

function normalizeSort(key: string | undefined, dir: string | undefined): { key: string; dir: "asc" | "desc" } {
  return {
    key: VALID_SORT_KEYS.has(key ?? "") ? key! : "openedAt",
    dir: dir === "asc" ? "asc" : "desc",
  };
}

function normalizeToken(value: string | undefined) {
  return value?.trim().toLowerCase() ?? "";
}

function buildHref(params: DemoJournalSearchParams) {
  const sp = new URLSearchParams();
  if (params.range) sp.set("range", params.range);
  if (params.symbol) sp.set("symbol", params.symbol);
  if (params.setup) sp.set("setup", params.setup);
  if (params.direction) sp.set("direction", params.direction);
  if (params.followedPlan) sp.set("followedPlan", params.followedPlan);
  if (params.tag) sp.set("tag", params.tag);
  if (params.mistake) sp.set("mistake", params.mistake);
  if (params.grade) sp.set("grade", params.grade);
  if (params.sort) sp.set("sort", params.sort);
  if (params.sortDir) sp.set("sortDir", params.sortDir);
  const q = sp.toString();
  return q ? `/demo/journal?${q}` : "/demo/journal";
}

function sortColumnHref(params: DemoJournalSearchParams, key: string, activeKey: string, activeDir: "asc" | "desc") {
  return buildHref({
    ...params,
    sort: key,
    sortDir: activeKey === key && activeDir === "desc" ? "asc" : "desc",
  });
}

function buildExportHref(params: DemoJournalSearchParams) {
  const sp = new URLSearchParams();
  if (params.range) sp.set("range", params.range);
  if (params.symbol) sp.set("symbol", params.symbol);
  if (params.setup) sp.set("setup", params.setup);
  if (params.direction) sp.set("direction", params.direction);
  if (params.followedPlan) sp.set("followedPlan", params.followedPlan);
  if (params.tag) sp.set("tag", params.tag);
  if (params.mistake) sp.set("mistake", params.mistake);
  if (params.grade) sp.set("grade", params.grade);
  const q = sp.toString();
  return q ? `/demo/journal/export?${q}` : "/demo/journal/export";
}

export default async function DemoJournalPage({
  searchParams,
}: {
  searchParams: Promise<DemoJournalSearchParams>;
}) {
  const resolvedSearchParams = await searchParams;
  const selectedRange = normalizeTradeRange(resolvedSearchParams.range);
  const baseTrades = getDemoMetrics(selectedRange).trades;

  const symbolFilter = resolvedSearchParams.symbol?.trim().toUpperCase() ?? "";
  const setupFilter = resolvedSearchParams.setup?.trim().toLowerCase() ?? "";
  const directionFilter =
    resolvedSearchParams.direction === "Long" || resolvedSearchParams.direction === "Short"
      ? resolvedSearchParams.direction
      : "";
  const followedPlanFilter =
    resolvedSearchParams.followedPlan === "yes" || resolvedSearchParams.followedPlan === "no"
      ? resolvedSearchParams.followedPlan
      : "";
  const tagFilter = normalizeToken(resolvedSearchParams.tag);
  const mistakeFilter = normalizeToken(resolvedSearchParams.mistake);
  const gradeFilter = ["A", "B", "C", "D", "F"].includes(resolvedSearchParams.grade ?? "")
    ? resolvedSearchParams.grade!
    : "";
  const { key: sortKey, dir: sortDir } = normalizeSort(
    resolvedSearchParams.sort,
    resolvedSearchParams.sortDir,
  );

  const hasActiveFilter = Boolean(
    symbolFilter || setupFilter || directionFilter || followedPlanFilter ||
    tagFilter || mistakeFilter || gradeFilter,
  );

  // Add computed holdingMinutes to each trade
  const tradesWithHold = baseTrades.map((t) => ({
    ...t,
    holdingMinutes: (new Date(t.closedAt).getTime() - new Date(t.openedAt).getTime()) / 60000,
  }));

  const filteredTrades = tradesWithHold.filter((trade) => {
    if (symbolFilter && !trade.symbol.startsWith(symbolFilter)) return false;
    if (setupFilter && !trade.setup.toLowerCase().includes(setupFilter)) return false;
    if (directionFilter && trade.direction !== directionFilter) return false;
    if (followedPlanFilter && trade.followedPlan !== (followedPlanFilter === "yes")) return false;
    if (tagFilter && !trade.tags.some((t) => t === tagFilter)) return false;
    if (mistakeFilter && !trade.mistakes.some((m) => m.toLowerCase() === mistakeFilter)) return false;
    if (gradeFilter && trade.grade !== gradeFilter) return false;
    return true;
  });

  // Sort
  const sortedTrades = [...filteredTrades].sort((a, b) => {
    const sign = sortDir === "asc" ? 1 : -1;
    if (sortKey === "openedAt") return sign * (new Date(a.openedAt).getTime() - new Date(b.openedAt).getTime());
    if (sortKey === "pnl") return sign * (a.pnl - b.pnl);
    if (sortKey === "pnlPercent") return sign * (a.pnlPercent - b.pnlPercent);
    if (sortKey === "grade") return sign * a.grade.localeCompare(b.grade);
    return 0;
  });

  const totalMoneyTraded = filteredTrades.reduce((t, tr) => t + tr.entryPrice * tr.quantity, 0);
  const totalPnl = filteredTrades.reduce((t, tr) => t + tr.pnl, 0);
  const followedPlanCount = filteredTrades.filter((t) => t.followedPlan).length;
  const followedPlanRate = filteredTrades.length ? followedPlanCount / filteredTrades.length : 0;
  const returnPercent = totalMoneyTraded ? totalPnl / totalMoneyTraded : 0;

  const setupTotals = new Map<string, number>();
  const mistakeCounts = new Map<string, number>();
  for (const trade of filteredTrades) {
    setupTotals.set(trade.setup, (setupTotals.get(trade.setup) ?? 0) + trade.pnl);
    for (const m of trade.mistakes) {
      mistakeCounts.set(m, (mistakeCounts.get(m) ?? 0) + 1);
    }
  }
  const bestSetupEntry = Array.from(setupTotals.entries()).sort((l, r) => r[1] - l[1])[0];
  const mostCommonMistakeEntry = Array.from(mistakeCounts.entries()).sort((l, r) => r[1] - l[1])[0];

  const sortHrefs: DemoSortHrefs = {
    date: sortColumnHref(resolvedSearchParams, "openedAt", sortKey, sortDir),
    pnl: sortColumnHref(resolvedSearchParams, "pnl", sortKey, sortDir),
    returnPct: sortColumnHref(resolvedSearchParams, "pnlPercent", sortKey, sortDir),
    grade: sortColumnHref(resolvedSearchParams, "grade", sortKey, sortDir),
  };

  return (
    <main className="px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-4">
        <WorkspaceTabs variant="demo" />

        {/* ── Header + KPI Strip ── */}
        <section className="overflow-hidden rounded-[28px] border border-white/8 bg-[#2b2d31] shadow-[0_24px_60px_rgba(0,0,0,0.3)]">
          <div className="flex flex-col gap-3 p-5 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-[10px] font-medium uppercase tracking-[0.24em] text-[#949ba4]">
                Demo Journal
              </p>
              <h1 className="mt-1 text-xl font-semibold tracking-tight text-white">
                Filter the demo like a real account
              </h1>
              <p className="mt-0.5 text-xs text-[#b5bac1]">
                {getTradeRangeLabel(selectedRange)}{hasActiveFilter ? " · filtered" : ""}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-3">
              <DashboardRangePicker options={rangeOptions} selectedRange={selectedRange} />
            </div>
          </div>
          {/* KPI strip */}
          <div className="flex overflow-x-auto divide-x divide-white/8 border-t border-white/8">
            {[
              { label: "Total Trades", value: String(filteredTrades.length), cls: "text-white" },
              {
                label: "Realized P&L",
                value: formatCurrency(totalPnl),
                cls: totalPnl > 0 ? "text-emerald-400" : totalPnl < 0 ? "text-rose-400" : "text-white",
              },
              {
                label: "Return %",
                value: totalMoneyTraded > 0 ? formatPercent(returnPercent) : "--",
                cls: returnPercent > 0 ? "text-emerald-400" : returnPercent < 0 ? "text-rose-400" : "text-white",
              },
              {
                label: "Followed Plan",
                value: filteredTrades.length ? formatPercent(followedPlanRate) : "--",
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
            <span className="text-[11px] text-[#949ba4]">Closed <span className="text-white">{filteredTrades.length}</span></span>
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
            <span className="select-none text-white/20">·</span>
            <span className="text-[11px] text-[#6d7278]">Read-only synthetic data</span>
          </div>
        </section>

        {/* ── Filters ── */}
        <section className="rounded-[28px] border border-white/8 bg-[#2b2d31] p-5">
          <form className="grid gap-3 lg:grid-cols-[1fr_1fr_0.8fr_0.8fr_0.8fr_1fr_1fr_auto]">
            <input type="hidden" name="range" value={selectedRange} />
            <div>
              <label htmlFor="symbol" className="text-[10px] font-medium uppercase tracking-[0.2em] text-[#949ba4]">Symbol</label>
              <input id="symbol" name="symbol" type="text" defaultValue={symbolFilter} placeholder="AAPL"
                className="mt-2 w-full rounded-[16px] border border-white/10 bg-[#1e1f22] px-3 py-2 text-sm text-white outline-none transition placeholder:text-[#6d7278] focus:border-[#5865f2]" />
            </div>
            <div>
              <label htmlFor="setup" className="text-[10px] font-medium uppercase tracking-[0.2em] text-[#949ba4]">Setup</label>
              <input id="setup" name="setup" type="text" defaultValue={resolvedSearchParams.setup ?? ""} placeholder="Opening range…"
                className="mt-2 w-full rounded-[16px] border border-white/10 bg-[#1e1f22] px-3 py-2 text-sm text-white outline-none transition placeholder:text-[#6d7278] focus:border-[#5865f2]" />
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
              </select>
            </div>
            <div>
              <label htmlFor="tag" className="text-[10px] font-medium uppercase tracking-[0.2em] text-[#949ba4]">Tag</label>
              <input id="tag" name="tag" type="text" defaultValue={tagFilter} placeholder="trend"
                className="mt-2 w-full rounded-[16px] border border-white/10 bg-[#1e1f22] px-3 py-2 text-sm text-white outline-none transition placeholder:text-[#6d7278] focus:border-[#5865f2]" />
            </div>
            <div>
              <label htmlFor="mistake" className="text-[10px] font-medium uppercase tracking-[0.2em] text-[#949ba4]">Mistake</label>
              <input id="mistake" name="mistake" type="text" defaultValue={mistakeFilter} placeholder="late entry"
                className="mt-2 w-full rounded-[16px] border border-white/10 bg-[#1e1f22] px-3 py-2 text-sm text-white outline-none transition placeholder:text-[#6d7278] focus:border-[#5865f2]" />
            </div>
            <div className="flex items-end gap-2">
              <button type="submit" className="w-full rounded-[16px] bg-[#5865f2] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#4752c4]">
                Apply
              </button>
              <Link href={buildHref({ range: selectedRange })} className="rounded-[16px] border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-[#dbdee1] transition hover:bg-white/10">
                Reset
              </Link>
            </div>
          </form>
        </section>

        {/* ── Trades Table ── */}
        <section className="rounded-[28px] border border-white/8 bg-[#2b2d31] p-5">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-[#949ba4]">Demo Trades</p>
            <div className="flex items-center gap-3">
              <p className="text-[11px] text-[#6d7278]">
                {filteredTrades.length} synthetic trade{filteredTrades.length === 1 ? "" : "s"}
              </p>
              <Link
                href={buildExportHref(resolvedSearchParams)}
                className="rounded-[14px] border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] font-medium text-[#b5bac1] transition hover:bg-white/10 hover:text-white"
              >
                Export CSV
              </Link>
            </div>
          </div>

          {sortedTrades.length > 0 ? (
            <DemoJournalTable
              trades={sortedTrades}
              sortKey={sortKey}
              sortDir={sortDir}
              sortHrefs={sortHrefs}
            />
          ) : (
            <div className="rounded-[20px] border border-white/8 bg-[#1e1f22] px-4 py-4 text-sm text-[#b5bac1]">
              No demo trades match the current filters.
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
