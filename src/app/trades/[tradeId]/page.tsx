import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { WorkspaceTabs } from "@/components/workspace-tabs";
import { formatCurrency, formatDateTime, formatPercent } from "@/lib/demo-data";
import { createClient } from "@/lib/supabase/server";

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
          <Link href="/journal" className="transition hover:text-white">
            Journal
          </Link>
          <span>/</span>
          <span className="text-[#dbdee1]">
            {trade.symbol} {trade.direction}
          </span>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="rounded-[28px] border border-white/8 bg-[#2b2d31] p-6 shadow-[0_24px_60px_rgba(0,0,0,0.3)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.2em] text-[#949ba4]">
                  Trade Detail
                </p>
                <h2 className="mt-2 text-3xl font-semibold text-white">
                  {trade.symbol} · {trade.direction}
                </h2>
                {trade.setup && (
                  <p className="mt-1 text-sm text-[#949ba4]">{trade.setup}</p>
                )}
              </div>
              <Link
                href={`/trades/${trade.id}/edit`}
                className="shrink-0 rounded-2xl border border-white/10 bg-[#1e1f22] px-4 py-2 text-sm text-[#dbdee1] transition hover:border-[#5865f2]/40 hover:text-white"
              >
                Edit
              </Link>
            </div>

            {trade.notes && (
              <p className="mt-4 text-sm leading-7 text-[#b5bac1]">{trade.notes}</p>
            )}

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="rounded-[24px] bg-[#1e1f22] p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-[#949ba4]">
                  Direction
                </p>
                <p className="mt-2 text-lg font-medium text-white">{trade.direction}</p>
              </div>
              <div className="rounded-[24px] bg-[#1e1f22] p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-[#949ba4]">
                  Status
                </p>
                <p
                  className={`mt-2 text-lg font-medium ${
                    trade.status === "Open" ? "text-emerald-400" : "text-white"
                  }`}
                >
                  {trade.status}
                </p>
              </div>
              <div className="rounded-[24px] bg-[#1e1f22] p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-[#949ba4]">
                  Opened
                </p>
                <p className="mt-2 text-lg font-medium text-white">
                  {formatDateTime(trade.opened_at)}
                </p>
              </div>
              <div className="rounded-[24px] bg-[#1e1f22] p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-[#949ba4]">
                  Closed
                </p>
                <p className="mt-2 text-lg font-medium text-white">
                  {trade.closed_at ? formatDateTime(trade.closed_at) : "Still open"}
                </p>
              </div>
            </div>

            {trade.thesis && (
              <div className="mt-6 rounded-[24px] border border-white/8 bg-[#1e1f22] p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-[#949ba4]">
                  Thesis
                </p>
                <p className="mt-3 text-sm leading-7 text-[#dbdee1]">{trade.thesis}</p>
              </div>
            )}

            {trade.lessons && (
              <div className="mt-4 rounded-[24px] border border-white/8 bg-[#1e1f22] p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-[#949ba4]">
                  Lessons
                </p>
                <p className="mt-3 text-sm leading-7 text-[#dbdee1]">{trade.lessons}</p>
              </div>
            )}
          </section>

          <section className="grid content-start gap-6">
            <div className="rounded-[28px] border border-white/8 bg-[#2b2d31] p-6 shadow-[0_24px_60px_rgba(0,0,0,0.3)]">
              <p className="text-sm uppercase tracking-[0.2em] text-[#949ba4]">Numbers</p>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-[#949ba4]">
                    Entry
                  </p>
                  <p className="mt-2 text-lg font-medium text-white">
                    {formatCurrency(Number(trade.entry_price))}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-[#949ba4]">
                    Exit
                  </p>
                  <p className="mt-2 text-lg font-medium text-white">
                    {trade.exit_price
                      ? formatCurrency(Number(trade.exit_price))
                      : "Open"}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-[#949ba4]">
                    Quantity
                  </p>
                  <p className="mt-2 text-lg font-medium text-white">{trade.quantity}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-[#949ba4]">
                    Return
                  </p>
                  <p
                    className={`mt-2 text-lg font-medium ${
                      pnlPercent == null
                        ? "text-[#949ba4]"
                        : pnlPercent >= 0
                          ? "text-emerald-400"
                          : "text-rose-400"
                    }`}
                  >
                    {pnlPercent == null ? "Pending" : formatPercent(pnlPercent)}
                  </p>
                </div>
              </div>

              {pnl != null && (
                <p
                  className={`mt-6 text-3xl font-semibold ${
                    pnl >= 0 ? "text-emerald-400" : "text-rose-400"
                  }`}
                >
                  {formatCurrency(pnl)}
                </p>
              )}
            </div>

            <div className="rounded-[28px] border border-white/8 bg-[#2b2d31] p-6 shadow-[0_24px_60px_rgba(0,0,0,0.3)]">
              <p className="text-sm uppercase tracking-[0.2em] text-[#949ba4]">Review</p>
              <div className="mt-4 grid grid-cols-3 gap-3">
                <div className="rounded-[24px] bg-[#1e1f22] p-3 text-center">
                  <p className="text-xs uppercase tracking-[0.18em] text-[#949ba4]">
                    Grade
                  </p>
                  <p className="mt-2 text-xl font-semibold text-white">
                    {trade.grade ?? "--"}
                  </p>
                </div>
                <div className="rounded-[24px] bg-[#1e1f22] p-3 text-center">
                  <p className="text-xs uppercase tracking-[0.18em] text-[#949ba4]">
                    Conf
                  </p>
                  <p className="mt-2 text-xl font-semibold text-white">
                    {trade.confidence_rating != null
                      ? `${trade.confidence_rating}/5`
                      : "--"}
                  </p>
                </div>
                <div className="rounded-[24px] bg-[#1e1f22] p-3 text-center">
                  <p className="text-xs uppercase tracking-[0.18em] text-[#949ba4]">
                    Plan
                  </p>
                  <p
                    className={`mt-2 text-xl font-semibold ${
                      trade.followed_plan === true
                        ? "text-emerald-400"
                        : trade.followed_plan === false
                          ? "text-rose-400"
                          : "text-[#949ba4]"
                    }`}
                  >
                    {trade.followed_plan === true
                      ? "Yes"
                      : trade.followed_plan === false
                        ? "No"
                        : "--"}
                  </p>
                </div>
              </div>

              <p className="mt-5 text-sm uppercase tracking-[0.2em] text-[#949ba4]">
                Tags
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {trade.tags.length > 0 ? (
                  trade.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-[#1e1f22] px-3 py-1 text-sm text-[#dbdee1]"
                    >
                      {tag}
                    </span>
                  ))
                ) : (
                  <span className="text-sm text-[#6d7278]">No tags</span>
                )}
              </div>

              <p className="mt-5 text-sm uppercase tracking-[0.2em] text-[#949ba4]">
                Mistakes
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {trade.mistake_tags.length > 0 ? (
                  trade.mistake_tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-rose-500/12 px-3 py-1 text-sm text-rose-300"
                    >
                      {tag}
                    </span>
                  ))
                ) : (
                  <span className="text-sm text-[#6d7278]">No mistakes logged</span>
                )}
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
