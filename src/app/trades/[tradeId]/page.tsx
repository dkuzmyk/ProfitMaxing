import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { WorkspaceTabs } from "@/components/workspace-tabs";
import { formatCurrency, formatDateTime, formatPercent } from "@/lib/demo-data";
import { createClient } from "@/lib/supabase/server";

const GRADE_CLS: Record<string, string> = {
  A: "text-emerald-400",
  B: "text-indigo-400",
  C: "text-white",
  D: "text-amber-400",
  F: "text-rose-400",
};

export default async function TradeDetailPage({
  params,
}: {
  params: Promise<{ tradeId: string }>;
}) {
  const { tradeId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?message=Please sign in to view trade details.");
  }

  const { data: trade, error } = await supabase
    .from("trades")
    .select(
      "id, symbol, setup, direction, quantity, entry_price, exit_price, opened_at, closed_at, status, realized_pnl, realized_pnl_percent, entry_value, followed_plan, confidence_rating, grade, tags, mistake_tags, thesis, lessons, notes",
    )
    .eq("id", tradeId)
    .eq("user_id", user.id)
    .single();

  if (error || !trade) {
    notFound();
  }

  const pnl = trade.exit_price != null ? Number(trade.realized_pnl) : null;
  const pnlPercent =
    trade.realized_pnl_percent != null ? Number(trade.realized_pnl_percent) : null;

  return (
    <main className="px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-4">
        <WorkspaceTabs variant="real" />

        <div className="flex items-center gap-2 text-sm text-[#949ba4]">
          <Link href="/journal" className="transition hover:text-white">Journal</Link>
          <span>/</span>
          <span className="text-[#dbdee1]">{trade.symbol} {trade.direction}</span>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">

          {/* ── Left column ── */}
          <div className="grid content-start gap-4">

            {/* Identity + stats */}
            <section className="overflow-hidden rounded-[28px] border border-white/8 bg-[#2b2d31] shadow-[0_24px_60px_rgba(0,0,0,0.3)]">
              <div className="flex items-start justify-between gap-4 p-5">
                <div>
                  <p className="text-[10px] font-medium uppercase tracking-[0.24em] text-[#949ba4]">Trade Detail</p>
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
                <Link
                  href={`/trades/${trade.id}/edit`}
                  className="shrink-0 rounded-[16px] border border-white/10 bg-[#1e1f22] px-4 py-2 text-sm text-[#dbdee1] transition hover:border-[#5865f2]/40 hover:text-white"
                >
                  Edit
                </Link>
              </div>

              <div className="grid grid-cols-2 gap-3 border-t border-white/8 p-5">
                <div className="rounded-[20px] bg-[#1e1f22] p-4">
                  <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-[#949ba4]">Direction</p>
                  <p className="mt-2 text-base font-medium text-white">{trade.direction}</p>
                </div>
                <div className="rounded-[20px] bg-[#1e1f22] p-4">
                  <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-[#949ba4]">Status</p>
                  <p className={`mt-2 text-base font-medium ${trade.status === "Open" ? "text-emerald-400" : "text-white"}`}>
                    {trade.status}
                  </p>
                </div>
                <div className="rounded-[20px] bg-[#1e1f22] p-4">
                  <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-[#949ba4]">Opened</p>
                  <p className="mt-2 text-base font-medium text-white">{formatDateTime(trade.opened_at)}</p>
                </div>
                <div className="rounded-[20px] bg-[#1e1f22] p-4">
                  <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-[#949ba4]">Closed</p>
                  <p className="mt-2 text-base font-medium text-white">
                    {trade.closed_at ? formatDateTime(trade.closed_at) : "Still open"}
                  </p>
                </div>
              </div>
            </section>

            {/* Narrative — only rendered if any text exists */}
            {(trade.thesis || trade.lessons) && (
              <section className="overflow-hidden rounded-[28px] border border-white/8 bg-[#2b2d31] shadow-[0_24px_60px_rgba(0,0,0,0.3)]">
                {trade.thesis && (
                  <div className="p-5">
                    <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-[#949ba4]">Thesis</p>
                    <p className="mt-2 text-sm leading-relaxed text-[#dbdee1]">{trade.thesis}</p>
                  </div>
                )}
                {trade.thesis && trade.lessons && <div className="border-t border-white/8" />}
                {trade.lessons && (
                  <div className="p-5">
                    <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-[#949ba4]">Lessons</p>
                    <p className="mt-2 text-sm leading-relaxed text-[#dbdee1]">{trade.lessons}</p>
                  </div>
                )}
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
                  {pnl != null ? (
                    <p className={`text-xl font-semibold tabular-nums ${pnl >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                      {formatCurrency(pnl)}
                    </p>
                  ) : (
                    <p className="text-xl font-semibold text-[#949ba4]">Open</p>
                  )}
                </div>
                <div className="flex flex-1 flex-col gap-1 px-5 py-4">
                  <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-[#949ba4]">Return %</p>
                  {pnlPercent != null ? (
                    <p className={`text-xl font-semibold tabular-nums ${pnlPercent >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                      {formatPercent(pnlPercent)}
                    </p>
                  ) : (
                    <p className="text-xl font-semibold text-[#949ba4]">Open</p>
                  )}
                </div>
              </div>

              {/* Execution stat cards */}
              <div className="grid grid-cols-2 gap-3 border-t border-white/8 p-5">
                <div className="rounded-[20px] bg-[#1e1f22] p-4">
                  <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-[#949ba4]">Entry</p>
                  <p className="mt-2 text-base font-medium text-white">
                    {formatCurrency(Number(trade.entry_price))}
                  </p>
                </div>
                <div className="rounded-[20px] bg-[#1e1f22] p-4">
                  <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-[#949ba4]">Exit</p>
                  <p className="mt-2 text-base font-medium text-white">
                    {trade.exit_price ? formatCurrency(Number(trade.exit_price)) : "Open"}
                  </p>
                </div>
                <div className="rounded-[20px] bg-[#1e1f22] p-4">
                  <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-[#949ba4]">Quantity</p>
                  <p className="mt-2 text-base font-medium text-white">{trade.quantity}</p>
                </div>
                <div className="rounded-[20px] bg-[#1e1f22] p-4">
                  <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-[#949ba4]">Invested</p>
                  <p className="mt-2 text-base font-medium text-white">
                    {formatCurrency(Number(trade.entry_value))}
                  </p>
                </div>
              </div>
            </section>

            {/* Review */}
            <section className="overflow-hidden rounded-[28px] border border-white/8 bg-[#2b2d31] shadow-[0_24px_60px_rgba(0,0,0,0.3)]">
              {/* Grade / Conf / Plan */}
              <div className="grid grid-cols-3 gap-3 p-5">
                <div className="rounded-[20px] bg-[#1e1f22] p-4 text-center">
                  <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-[#949ba4]">Grade</p>
                  <p className={`mt-2 text-xl font-semibold ${trade.grade ? (GRADE_CLS[trade.grade] ?? "text-white") : "text-[#949ba4]"}`}>
                    {trade.grade ?? "--"}
                  </p>
                </div>
                <div className="rounded-[20px] bg-[#1e1f22] p-4 text-center">
                  <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-[#949ba4]">Conf</p>
                  <p className="mt-2 text-xl font-semibold text-white">
                    {trade.confidence_rating != null ? `${trade.confidence_rating}/5` : "--"}
                  </p>
                </div>
                <div className="rounded-[20px] bg-[#1e1f22] p-4 text-center">
                  <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-[#949ba4]">Plan</p>
                  <p className={`mt-2 text-xl font-semibold ${
                    trade.followed_plan === true ? "text-emerald-400"
                    : trade.followed_plan === false ? "text-rose-400"
                    : "text-[#949ba4]"
                  }`}>
                    {trade.followed_plan === true ? "Yes" : trade.followed_plan === false ? "No" : "--"}
                  </p>
                </div>
              </div>

              {/* Tags */}
              <div className="border-t border-white/8 px-5 py-4">
                <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-[#949ba4]">Tags</p>
                <div className="mt-2.5 flex flex-wrap gap-2">
                  {trade.tags.length > 0 ? (
                    (trade.tags as string[]).map((tag) => (
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
                  {trade.mistake_tags.length > 0 ? (
                    (trade.mistake_tags as string[]).map((tag) => (
                      <span key={tag} className="rounded-full bg-rose-500/12 px-3 py-1 text-[12px] text-rose-300">{tag}</span>
                    ))
                  ) : (
                    <span className="text-[12px] text-[#6d7278]">No mistakes logged</span>
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
