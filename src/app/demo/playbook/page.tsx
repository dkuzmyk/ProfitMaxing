import { DashboardRangePicker } from "@/components/dashboard-range-picker";
import { WorkspaceTabs } from "@/components/workspace-tabs";
import { getDemoInsightTrades } from "@/lib/demo-insights";
import { formatCurrency, formatPercent } from "@/lib/demo-data";
import { getPlaybookEntries } from "@/lib/journal-insights";
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

export default async function DemoPlaybookPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  const { range } = await searchParams;
  const selectedRange = normalizeTradeRange(range);
  const playbookEntries = getPlaybookEntries(getDemoInsightTrades(selectedRange));

  return (
    <main className="px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-4">
        <WorkspaceTabs variant="demo" />

        <header className="flex flex-col gap-4 rounded-[28px] border border-white/8 bg-[#2b2d31] p-6 shadow-[0_24px_60px_rgba(0,0,0,0.3)] md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.22em] text-[#949ba4]">
              Demo Playbook
            </p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white">
              Strategy notes built from synthetic trades
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#b5bac1]">
              {getTradeRangeLabel(selectedRange)}. Guests can explore playbook
              structure without seeing or changing real data.
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
        </section>
      </div>
    </main>
  );
}
