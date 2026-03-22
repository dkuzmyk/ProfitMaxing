import { DashboardRangePicker } from "@/components/dashboard-range-picker";
import { WorkspaceTabs } from "@/components/workspace-tabs";
import { getDemoInsightTrades } from "@/lib/demo-insights";
import { formatCurrency, formatPercent } from "@/lib/demo-data";
import {
  getGradePerformance,
  getMistakePerformance,
  getReviewSummary,
  getSetupPerformance,
} from "@/lib/journal-insights";
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

export default async function DemoAnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  const { range } = await searchParams;
  const selectedRange = normalizeTradeRange(range);
  const trades = getDemoInsightTrades(selectedRange);
  const setupPerformance = getSetupPerformance(trades);
  const mistakePerformance = getMistakePerformance(trades);
  const reviewSummary = getReviewSummary(trades);
  const gradePerformance = getGradePerformance(trades);

  return (
    <main className="px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <WorkspaceTabs variant="demo" />

        <header className="flex flex-col gap-4 rounded-[28px] border border-white/8 bg-[#2b2d31] p-6 shadow-[0_24px_60px_rgba(0,0,0,0.3)] md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.22em] text-[#949ba4]">
              Demo Analytics
            </p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white">
              Explore setup and review analytics
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#b5bac1]">
              Synthetic data only. {getTradeRangeLabel(selectedRange)}.
            </p>
          </div>

          <div className="flex flex-wrap items-end gap-3">
            <DashboardRangePicker
              options={rangeOptions}
              selectedRange={selectedRange}
            />
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-[24px] border border-white/8 bg-[#2b2d31] p-6">
            <p className="text-sm uppercase tracking-[0.2em] text-[#949ba4]">
              Reviewed Trades
            </p>
            <p className="mt-3 text-3xl font-semibold text-white">
              {reviewSummary.reviewedTrades}
            </p>
          </div>
          <div className="rounded-[24px] border border-white/8 bg-[#2b2d31] p-6">
            <p className="text-sm uppercase tracking-[0.2em] text-[#949ba4]">
              Avg Confidence
            </p>
            <p className="mt-3 text-3xl font-semibold text-white">
              {reviewSummary.avgConfidence
                ? `${reviewSummary.avgConfidence.toFixed(1)}/5`
                : "--"}
            </p>
          </div>
          <div className="rounded-[24px] border border-white/8 bg-[#2b2d31] p-6">
            <p className="text-sm uppercase tracking-[0.2em] text-[#949ba4]">
              Grade A / B
            </p>
            <p className="mt-3 text-3xl font-semibold text-white">
              {reviewSummary.gradeCounts.A + reviewSummary.gradeCounts.B}
            </p>
          </div>
          <div className="rounded-[24px] border border-white/8 bg-[#2b2d31] p-6">
            <p className="text-sm uppercase tracking-[0.2em] text-[#949ba4]">
              Followed Plan
            </p>
            <p className="mt-3 text-3xl font-semibold text-white">
              {formatPercent(reviewSummary.followedPlanRate)}
            </p>
          </div>
        </section>

        <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-[28px] border border-white/8 bg-[#2b2d31] p-6">
            <p className="text-sm uppercase tracking-[0.2em] text-[#949ba4]">
              Setup Ranking
            </p>
            <div className="mt-5 overflow-hidden rounded-[24px] border border-white/8">
              <table className="min-w-full divide-y divide-white/8">
                <thead className="bg-[#1e1f22] text-left text-[11px] uppercase tracking-[0.16em] text-[#949ba4]">
                  <tr>
                    <th className="px-3 py-2.5">Setup</th>
                    <th className="px-3 py-2.5">Trades</th>
                    <th className="px-3 py-2.5">Win Rate</th>
                    <th className="px-3 py-2.5">Total P&amp;L</th>
                    <th className="px-3 py-2.5">Avg P&amp;L</th>
                    <th className="px-3 py-2.5">Return</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/6 text-[13px]">
                  {setupPerformance.slice(0, 8).map((setup) => (
                    <tr key={setup.setup}>
                      <td className="px-3 py-3 font-medium text-white">
                        {setup.setup}
                      </td>
                      <td className="px-3 py-3 text-[#b5bac1]">{setup.totalTrades}</td>
                      <td className="px-3 py-3 text-[#b5bac1]">
                        {formatPercent(setup.winRate)}
                      </td>
                      <td className="px-3 py-3 text-white">
                        {formatCurrency(setup.totalPnl)}
                      </td>
                      <td className="px-3 py-3 text-[#b5bac1]">
                        {formatCurrency(setup.avgPnl)}
                      </td>
                      <td className="px-3 py-3 text-[#b5bac1]">
                        {formatPercent(setup.returnPercent)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-[28px] border border-white/8 bg-[#2b2d31] p-6">
            <p className="text-sm uppercase tracking-[0.2em] text-[#949ba4]">
              Mistake Cost
            </p>
            <div className="mt-5 grid gap-4">
              {mistakePerformance.slice(0, 6).map((mistake) => (
                <div
                  key={mistake.label}
                  className="rounded-[24px] bg-[#1e1f22] p-4"
                >
                  <p className="text-sm font-medium text-white">{mistake.label}</p>
                  <p className="mt-2 text-xl font-semibold text-rose-400">
                    {formatCurrency(mistake.totalPnl)}
                  </p>
                  <p className="mt-2 text-sm text-[#949ba4]">
                    {mistake.count} trade{mistake.count === 1 ? "" : "s"} · avg{" "}
                    {formatCurrency(mistake.avgPnl)} · return{" "}
                    {formatPercent(mistake.returnPercent)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-[28px] border border-white/8 bg-[#2b2d31] p-6">
            <p className="text-sm uppercase tracking-[0.2em] text-[#949ba4]">
              Review Grade Performance
            </p>
            <div className="mt-5 overflow-hidden rounded-[24px] border border-white/8">
              <table className="min-w-full divide-y divide-white/8">
                <thead className="bg-[#1e1f22] text-left text-[11px] uppercase tracking-[0.16em] text-[#949ba4]">
                  <tr>
                    <th className="px-3 py-2.5">Grade</th>
                    <th className="px-3 py-2.5">Trades</th>
                    <th className="px-3 py-2.5">Avg Confidence</th>
                    <th className="px-3 py-2.5">Avg P&amp;L</th>
                    <th className="px-3 py-2.5">Return</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/6 text-[13px]">
                  {gradePerformance.map((grade) => (
                    <tr key={grade.grade}>
                      <td className="px-3 py-3 font-medium text-white">
                        {grade.grade}
                      </td>
                      <td className="px-3 py-3 text-[#b5bac1]">{grade.count}</td>
                      <td className="px-3 py-3 text-[#b5bac1]">
                        {grade.avgConfidence
                          ? `${grade.avgConfidence.toFixed(1)}/5`
                          : "--"}
                      </td>
                      <td className="px-3 py-3 text-white">
                        {formatCurrency(grade.avgPnl)}
                      </td>
                      <td className="px-3 py-3 text-[#b5bac1]">
                        {formatPercent(grade.returnPercent)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-[28px] border border-white/8 bg-[#2b2d31] p-6">
            <p className="text-sm uppercase tracking-[0.2em] text-[#949ba4]">
              Review Signals
            </p>
            <div className="mt-5 grid gap-4">
              <div className="rounded-[24px] bg-[#1e1f22] p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-[#949ba4]">
                  Top Setup
                </p>
                <p className="mt-2 text-xl font-semibold text-white">
                  {setupPerformance[0]?.setup ?? "None yet"}
                </p>
                <p className="mt-2 text-sm text-emerald-400">
                  {setupPerformance[0]
                    ? `${formatCurrency(setupPerformance[0].totalPnl)} across ${setupPerformance[0].totalTrades} trades`
                    : "Synthetic setup ranking will appear here."}
                </p>
              </div>
              <div className="rounded-[24px] bg-[#1e1f22] p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-[#949ba4]">
                  Weakest Reviewed Grade
                </p>
                <p className="mt-2 text-xl font-semibold text-white">
                  {gradePerformance.at(-1)?.grade ?? "No graded trades"}
                </p>
                <p className="mt-2 text-sm text-rose-400">
                  {gradePerformance.at(-1)
                    ? `${formatCurrency(gradePerformance.at(-1)!.avgPnl)} average P&L`
                    : "Synthetic grades will populate here."}
                </p>
              </div>
              <div className="rounded-[24px] bg-[#1e1f22] p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-[#949ba4]">
                  Costliest Mistake
                </p>
                <p className="mt-2 text-xl font-semibold text-white">
                  {mistakePerformance[0]?.label ?? "No mistake tags yet"}
                </p>
                <p className="mt-2 text-sm text-rose-400">
                  {mistakePerformance[0]
                    ? formatCurrency(mistakePerformance[0].totalPnl)
                    : "Synthetic mistake data will populate here."}
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
