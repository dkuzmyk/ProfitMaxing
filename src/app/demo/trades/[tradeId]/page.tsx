import Link from "next/link";
import { notFound } from "next/navigation";

import { WorkspaceTabs } from "@/components/workspace-tabs";
import {
  formatCurrency,
  formatDateTime,
  formatPercent,
  getDemoTradeById,
} from "@/lib/demo-data";

const GRADE_CLS: Record<string, string> = {
  A: "text-emerald-400",
  B: "text-indigo-400",
  C: "text-white",
  D: "text-amber-400",
  F: "text-rose-400",
};

function formatHoldTime(openedAt: string, closedAt: string) {
  const minutes = (new Date(closedAt).getTime() - new Date(openedAt).getTime()) / 60000;
  if (minutes < 60) return `${Math.round(minutes)}m`;
  if (minutes < 1440) return `${(minutes / 60).toFixed(1)}h`;
  return `${Math.round(minutes / 1440)}d`;
}

export default async function DemoTradeDetailPage({
  params,
}: {
  params: Promise<{ tradeId: string }>;
}) {
  const { tradeId } = await params;
  const trade = getDemoTradeById(tradeId);

  if (!trade) {
    notFound();
  }

  const holdTime = formatHoldTime(trade.openedAt, trade.closedAt);
  const invested = trade.entryPrice * trade.quantity;

  return (
    <main className="px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-4">
        <WorkspaceTabs variant="demo" />

        <div className="flex items-center gap-2 text-sm text-[#949ba4]">
          <Link href="/demo/journal" className="transition hover:text-white">Journal</Link>
          <span>/</span>
          <span className="text-[#dbdee1]">{trade.symbol} {trade.direction}</span>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">

          {/* ── Left column ── */}
          <div className="grid content-start gap-4">

            {/* Identity + stats */}
            <section className="overflow-hidden rounded-[28px] border border-white/8 bg-[#2b2d31] shadow-[0_24px_60px_rgba(0,0,0,0.3)]">
              <div className="p-5">
                <p className="text-[10px] font-medium uppercase tracking-[0.24em] text-[#949ba4]">
                  Demo Trade · {trade.account}
                </p>
                <h2 className="mt-1 text-2xl font-semibold tracking-tight text-white">
                  {trade.symbol} · {trade.direction}
                </h2>
                {trade.setup && (
                  <p className="mt-0.5 text-sm text-[#949ba4]">{trade.setup}</p>
                )}
                {trade.notes && (
                  <p className="mt-2 text-sm leading-relaxed text-[#b5bac1]">{trade.notes}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3 border-t border-white/8 p-5">
                <div className="rounded-[20px] bg-[#1e1f22] p-4">
                  <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-[#949ba4]">Direction</p>
                  <p className="mt-2 text-base font-medium text-white">{trade.direction}</p>
                </div>
                <div className="rounded-[20px] bg-[#1e1f22] p-4">
                  <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-[#949ba4]">Hold</p>
                  <p className="mt-2 text-base font-medium text-white">{holdTime}</p>
                </div>
                <div className="rounded-[20px] bg-[#1e1f22] p-4">
                  <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-[#949ba4]">Opened</p>
                  <p className="mt-2 text-base font-medium text-white">{formatDateTime(trade.openedAt)}</p>
                </div>
                <div className="rounded-[20px] bg-[#1e1f22] p-4">
                  <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-[#949ba4]">Closed</p>
                  <p className="mt-2 text-base font-medium text-white">{formatDateTime(trade.closedAt)}</p>
                </div>
              </div>
            </section>

            {/* Narrative */}
            {trade.thesis && (
              <section className="overflow-hidden rounded-[28px] border border-white/8 bg-[#2b2d31] shadow-[0_24px_60px_rgba(0,0,0,0.3)]">
                <div className="p-5">
                  <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-[#949ba4]">Thesis</p>
                  <p className="mt-2 text-sm leading-relaxed text-[#dbdee1]">{trade.thesis}</p>
                </div>
              </section>
            )}
          </div>

          {/* ── Right column ── */}
          <div className="grid content-start gap-4">

            {/* P&L + execution numbers */}
            <section className="overflow-hidden rounded-[28px] border border-white/8 bg-[#2b2d31] shadow-[0_24px_60px_rgba(0,0,0,0.3)]">
              {/* KPI strip */}
              <div className="flex divide-x divide-white/8">
                <div className="flex flex-1 flex-col gap-1 px-5 py-4">
                  <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-[#949ba4]">Realized P&L</p>
                  <p className={`text-xl font-semibold tabular-nums ${trade.pnl >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                    {formatCurrency(trade.pnl)}
                  </p>
                </div>
                <div className="flex flex-1 flex-col gap-1 px-5 py-4">
                  <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-[#949ba4]">Return %</p>
                  <p className={`text-xl font-semibold tabular-nums ${trade.pnlPercent >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                    {formatPercent(trade.pnlPercent / 100)}
                  </p>
                </div>
              </div>

              {/* Execution stat cards */}
              <div className="grid grid-cols-2 gap-3 border-t border-white/8 p-5">
                <div className="rounded-[20px] bg-[#1e1f22] p-4">
                  <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-[#949ba4]">Entry</p>
                  <p className="mt-2 text-base font-medium text-white">{formatCurrency(trade.entryPrice)}</p>
                </div>
                <div className="rounded-[20px] bg-[#1e1f22] p-4">
                  <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-[#949ba4]">Exit</p>
                  <p className="mt-2 text-base font-medium text-white">{formatCurrency(trade.exitPrice)}</p>
                </div>
                <div className="rounded-[20px] bg-[#1e1f22] p-4">
                  <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-[#949ba4]">Shares</p>
                  <p className="mt-2 text-base font-medium text-white">{trade.quantity}</p>
                </div>
                <div className="rounded-[20px] bg-[#1e1f22] p-4">
                  <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-[#949ba4]">Invested</p>
                  <p className="mt-2 text-base font-medium text-white">{formatCurrency(invested)}</p>
                </div>
              </div>
            </section>

            {/* Review */}
            <section className="overflow-hidden rounded-[28px] border border-white/8 bg-[#2b2d31] shadow-[0_24px_60px_rgba(0,0,0,0.3)]">
              {/* Grade / Conf / Plan */}
              <div className="grid grid-cols-3 gap-3 p-5">
                <div className="rounded-[20px] bg-[#1e1f22] p-4 text-center">
                  <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-[#949ba4]">Grade</p>
                  <p className={`mt-2 text-xl font-semibold ${GRADE_CLS[trade.grade] ?? "text-white"}`}>
                    {trade.grade}
                  </p>
                </div>
                <div className="rounded-[20px] bg-[#1e1f22] p-4 text-center">
                  <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-[#949ba4]">Conf</p>
                  <p className="mt-2 text-xl font-semibold text-white">{trade.confidenceRating}/5</p>
                </div>
                <div className="rounded-[20px] bg-[#1e1f22] p-4 text-center">
                  <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-[#949ba4]">Plan</p>
                  <p className={`mt-2 text-xl font-semibold ${trade.followedPlan ? "text-emerald-400" : "text-rose-400"}`}>
                    {trade.followedPlan ? "Yes" : "No"}
                  </p>
                </div>
              </div>

              {/* Tags */}
              <div className="border-t border-white/8 px-5 py-4">
                <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-[#949ba4]">Tags</p>
                <div className="mt-2.5 flex flex-wrap gap-2">
                  {trade.tags.length > 0 ? (
                    trade.tags.map((tag) => (
                      <span key={tag} className="rounded-full bg-white/6 px-3 py-1 text-[12px] text-[#dbdee1]">{tag}</span>
                    ))
                  ) : (
                    <span className="text-[12px] text-[#6d7278]">No tags</span>
                  )}
                </div>
              </div>

              {/* Mistakes */}
              <div className="border-t border-white/8 px-5 py-4">
                <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-[#949ba4]">Mistakes</p>
                <div className="mt-2.5 flex flex-wrap gap-2">
                  {trade.mistakes.length > 0 ? (
                    trade.mistakes.map((m) => (
                      <span key={m} className="rounded-full bg-rose-500/12 px-3 py-1 text-[12px] text-rose-300">{m}</span>
                    ))
                  ) : (
                    <span className="text-[12px] text-[#6d7278]">None recorded</span>
                  )}
                </div>
              </div>
            </section>

          </div>
        </div>
      </div>
    </main>
  );
}
