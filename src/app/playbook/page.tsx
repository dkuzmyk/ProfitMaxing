import Link from "next/link";
import { redirect } from "next/navigation";

import { DashboardRangePicker } from "@/components/dashboard-range-picker";
import { WorkspaceTabs } from "@/components/workspace-tabs";
import { formatCurrency, formatPercent } from "@/lib/demo-data";
import {
  getPlaybookEntries,
  type InsightTrade,
} from "@/lib/journal-insights";
import { createClient } from "@/lib/supabase/server";
import {
  filterTradesByRange,
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

type PlaybookTradeRow = {
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
};

function toInsightTrade(trade: PlaybookTradeRow): InsightTrade {
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

export default async function PlaybookPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?message=Please sign in to view your playbook.");
  }

  const { range } = await searchParams;
  const selectedRange = normalizeTradeRange(range);

  const { data: trades, error } = await supabase
    .from("trades")
    .select(
      "id, symbol, setup, direction, opened_at, closed_at, entry_value, realized_pnl, realized_pnl_percent, followed_plan, grade, confidence_rating, tags, mistake_tags, thesis, lessons",
    )
    .order("opened_at", { ascending: false });

  if (error) {
    redirect(`/dashboard?message=${encodeURIComponent(error.message)}`);
  }

  const filteredTrades = filterTradesByRange(
    (trades ?? []) as unknown as Parameters<typeof filterTradesByRange>[0],
    selectedRange,
  );
  const playbookEntries = getPlaybookEntries(
    (filteredTrades as unknown as PlaybookTradeRow[]).map(toInsightTrade),
  );

  const totalTrades = playbookEntries.reduce((s, e) => s + e.totalTrades, 0);
  const netPnl = playbookEntries.reduce((s, e) => s + e.totalPnl, 0);
  const totalWinners = playbookEntries.reduce(
    (s, e) => s + Math.round(e.winRate * e.totalTrades),
    0,
  );
  const overallWinRate = totalTrades ? totalWinners / totalTrades : 0;

  return (
    <main className="px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-4">
        <WorkspaceTabs variant="real" />

        {/* ── Header + KPI strip ── */}
        <section className="overflow-hidden rounded-[28px] border border-white/8 bg-[#2b2d31] shadow-[0_24px_60px_rgba(0,0,0,0.3)]">
          <div className="flex flex-col gap-3 p-5 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-[10px] font-medium uppercase tracking-[0.24em] text-[#949ba4]">
                Real Playbook
              </p>
              <h1 className="mt-1 text-xl font-semibold tracking-tight text-white">
                Strategy notes built from real trades
              </h1>
              <p className="mt-0.5 text-xs text-[#b5bac1]">
                {getTradeRangeLabel(selectedRange)}
              </p>
            </div>
            <div className="shrink-0">
              <DashboardRangePicker options={rangeOptions} selectedRange={selectedRange} />
            </div>
          </div>
          <div className="flex overflow-x-auto divide-x divide-white/8 border-t border-white/8">
            {[
              { label: "Setups", value: String(playbookEntries.length), cls: "text-white" },
              { label: "Total Trades", value: String(totalTrades), cls: "text-white" },
              {
                label: "Net P&L",
                value: formatCurrency(netPnl),
                cls: netPnl > 0 ? "text-emerald-400" : netPnl < 0 ? "text-rose-400" : "text-white",
              },
              {
                label: "Win Rate",
                value: totalTrades ? formatPercent(overallWinRate) : "--",
                cls: overallWinRate >= 0.6 ? "text-emerald-400" : overallWinRate >= 0.4 ? "text-[#b5bac1]" : overallWinRate > 0 ? "text-rose-400" : "text-[#b5bac1]",
              },
            ].map(({ label, value, cls }) => (
              <div key={label} className="flex min-w-[110px] flex-1 flex-col gap-1 px-5 py-4">
                <p className="whitespace-nowrap text-[10px] font-medium uppercase tracking-[0.2em] text-[#949ba4]">{label}</p>
                <p className={`text-xl font-semibold tabular-nums ${cls}`}>{value}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Setup cards ── */}
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {playbookEntries.map((entry) => (
            <article
              key={entry.setup}
              className="overflow-hidden rounded-[28px] border border-white/8 bg-[#2b2d31] shadow-[0_8px_32px_rgba(0,0,0,0.2)]"
            >
              {/* Setup name + thesis */}
              <div className="p-5">
                <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-[#949ba4]">
                  Setup
                </p>
                <h2 className="mt-1.5 text-lg font-semibold text-white">{entry.setup}</h2>
                <p className="mt-2 text-[13px] leading-relaxed text-[#b5bac1]">
                  {entry.thesis ?? "No thesis recorded yet for this setup."}
                </p>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-2.5 border-t border-white/8 p-5">
                <div className="rounded-[16px] bg-[#1e1f22] p-3.5">
                  <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-[#949ba4]">Trades</p>
                  <p className="mt-1.5 text-base font-semibold text-white">{entry.totalTrades}</p>
                </div>
                <div className="rounded-[16px] bg-[#1e1f22] p-3.5">
                  <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-[#949ba4]">Win Rate</p>
                  <p className={`mt-1.5 text-base font-semibold ${entry.winRate >= 0.6 ? "text-emerald-400" : entry.winRate >= 0.4 ? "text-[#b5bac1]" : "text-rose-400"}`}>
                    {formatPercent(entry.winRate)}
                  </p>
                </div>
                <div className="rounded-[16px] bg-[#1e1f22] p-3.5">
                  <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-[#949ba4]">P&L</p>
                  <p className={`mt-1.5 text-base font-semibold tabular-nums ${entry.totalPnl >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                    {formatCurrency(entry.totalPnl)}
                  </p>
                </div>
              </div>

              {/* Lesson */}
              <div className="border-t border-white/8 px-5 py-4">
                <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-[#949ba4]">Repeated Lesson</p>
                <p className="mt-1.5 text-[13px] leading-relaxed text-[#dbdee1]">
                  {entry.lesson ?? "No lesson captured yet for this setup."}
                </p>
              </div>

              {/* Tags */}
              <div className="border-t border-white/8 px-5 py-4">
                <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-[#949ba4]">Tags</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {entry.topTags.length > 0 ? (
                    entry.topTags.map((tag) => (
                      <span key={tag.label} className="rounded-full bg-white/6 px-2.5 py-1 text-[11px] text-[#dbdee1]">
                        {tag.label}
                      </span>
                    ))
                  ) : (
                    <span className="text-[12px] text-[#6d7278]">No tags yet</span>
                  )}
                </div>
              </div>

              {/* Mistakes */}
              <div className="border-t border-white/8 px-5 py-4">
                <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-[#949ba4]">Common Mistakes</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {entry.commonMistakes.length > 0 ? (
                    entry.commonMistakes.map((m) => (
                      <span key={m.label} className="rounded-full bg-rose-500/12 px-2.5 py-1 text-[11px] text-rose-300">
                        {m.label}
                      </span>
                    ))
                  ) : (
                    <span className="text-[12px] text-[#6d7278]">No recurring mistakes</span>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="border-t border-white/8 px-5 py-3">
                <Link
                  href={`/journal?setup=${encodeURIComponent(entry.setup)}&range=${selectedRange}`}
                  className="text-[12px] font-medium text-[#5865f2] transition hover:text-[#4752c4]"
                >
                  View trades →
                </Link>
              </div>
            </article>
          ))}

          {playbookEntries.length === 0 && (
            <div className="col-span-full rounded-[28px] border border-white/8 bg-[#2b2d31] px-5 py-4 text-sm text-[#b5bac1]">
              No setup data is available in this range yet.
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
