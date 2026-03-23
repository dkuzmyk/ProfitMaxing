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

  const filteredTrades = filterTradesByRange(trades ?? [], selectedRange);
  const playbookEntries = getPlaybookEntries(filteredTrades.map(toInsightTrade));

  return (
    <main className="px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-4">
        <WorkspaceTabs variant="real" />

        <header className="flex flex-col gap-4 rounded-[28px] border border-white/8 bg-[#2b2d31] p-6 shadow-[0_24px_60px_rgba(0,0,0,0.3)] md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.22em] text-[#949ba4]">
              Real Playbook
            </p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white">
              Strategy notes built from real trades
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#b5bac1]">
              {getTradeRangeLabel(selectedRange)}. This page promotes setup,
              thesis, lesson, tag, and mistake fields into a working playbook.
            </p>
          </div>

          <div className="flex flex-wrap items-end gap-3">
            <DashboardRangePicker
              options={rangeOptions}
              selectedRange={selectedRange}
            />
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {playbookEntries.map((entry) => (
            <article
              key={entry.setup}
              className="rounded-[28px] border border-white/8 bg-[#2b2d31] p-6"
            >
              <p className="text-sm uppercase tracking-[0.2em] text-[#949ba4]">
                Setup
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-white">
                {entry.setup}
              </h2>
              <p className="mt-3 text-sm leading-7 text-[#b5bac1]">
                {entry.thesis || "No thesis recorded yet for this setup."}
              </p>

              <div className="mt-5 grid gap-4 sm:grid-cols-3">
                <div className="rounded-[20px] bg-[#1e1f22] p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-[#949ba4]">
                    Trades
                  </p>
                  <p className="mt-2 text-xl font-semibold text-white">
                    {entry.totalTrades}
                  </p>
                </div>
                <div className="rounded-[20px] bg-[#1e1f22] p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-[#949ba4]">
                    Win Rate
                  </p>
                  <p className="mt-2 text-xl font-semibold text-white">
                    {formatPercent(entry.winRate)}
                  </p>
                </div>
                <div className="rounded-[20px] bg-[#1e1f22] p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-[#949ba4]">
                    Total P&amp;L
                  </p>
                  <p className="mt-2 text-xl font-semibold text-white">
                    {formatCurrency(entry.totalPnl)}
                  </p>
                </div>
              </div>

              <div className="mt-5">
                <p className="text-xs uppercase tracking-[0.18em] text-[#949ba4]">
                  Repeated lesson
                </p>
                <p className="mt-2 text-sm leading-7 text-[#dbdee1]">
                  {entry.lesson || "No lesson captured yet for this setup."}
                </p>
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                {entry.topTags.map((tag) => (
                  <span
                    key={tag.label}
                    className="rounded-full bg-white/6 px-3 py-1 text-xs text-[#dbdee1]"
                  >
                    {tag.label}
                  </span>
                ))}
                {entry.topTags.length === 0 ? (
                  <span className="text-xs text-[#6d7278]">No tags yet</span>
                ) : null}
              </div>

              <div className="mt-5">
                <p className="text-xs uppercase tracking-[0.18em] text-[#949ba4]">
                  Common mistakes
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {entry.commonMistakes.map((mistake) => (
                    <span
                      key={mistake.label}
                      className="rounded-full bg-rose-500/12 px-3 py-1 text-xs text-rose-300"
                    >
                      {mistake.label}
                    </span>
                  ))}
                  {entry.commonMistakes.length === 0 ? (
                    <span className="text-xs text-[#6d7278]">
                      No recurring mistakes logged
                    </span>
                  ) : null}
                </div>
              </div>
            </article>
          ))}
          {playbookEntries.length === 0 ? (
            <div className="rounded-[28px] border border-white/8 bg-[#2b2d31] p-6 text-sm text-[#b5bac1]">
              No setup data is available in this range yet.
            </div>
          ) : null}
        </section>
      </div>
    </main>
  );
}
