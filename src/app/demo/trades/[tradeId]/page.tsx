import { notFound } from "next/navigation";

import {
  formatCurrency,
  formatDateTime,
  formatPercent,
  getDemoTradeById,
} from "@/lib/demo-data";

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

  return (
    <main className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
      <section className="rounded-[28px] border border-white/8 bg-[#2b2d31] p-6 shadow-[0_24px_60px_rgba(0,0,0,0.3)]">
        <p className="text-sm uppercase tracking-[0.2em] text-[#949ba4]">
          Trade Detail
        </p>
        <h2 className="mt-2 text-3xl font-semibold text-white">
          {trade.symbol} · {trade.setup}
        </h2>
        <p className="mt-3 text-sm leading-7 text-[#b5bac1]">
          {trade.notes}
        </p>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-[24px] bg-[#1e1f22] p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-[#949ba4]">
              Account
            </p>
            <p className="mt-2 text-lg font-medium text-white">{trade.account}</p>
          </div>
          <div className="rounded-[24px] bg-[#1e1f22] p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-[#949ba4]">
              Direction
            </p>
            <p className="mt-2 text-lg font-medium text-white">
              {trade.direction}
            </p>
          </div>
          <div className="rounded-[24px] bg-[#1e1f22] p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-[#949ba4]">
              Opened
            </p>
            <p className="mt-2 text-lg font-medium text-white">
              {formatDateTime(trade.openedAt)}
            </p>
          </div>
          <div className="rounded-[24px] bg-[#1e1f22] p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-[#949ba4]">
              Closed
            </p>
            <p className="mt-2 text-lg font-medium text-white">
              {formatDateTime(trade.closedAt)}
            </p>
          </div>
        </div>

        <div className="mt-6 rounded-[24px] border border-white/8 bg-[#1e1f22] p-4">
          <p className="text-xs uppercase tracking-[0.18em] text-[#949ba4]">
            Thesis
          </p>
          <p className="mt-3 text-sm leading-7 text-[#dbdee1]">
            {trade.thesis}
          </p>
        </div>
      </section>

      <section className="grid gap-6">
        <div className="rounded-[28px] border border-white/8 bg-[#2b2d31] p-6 shadow-[0_24px_60px_rgba(0,0,0,0.3)]">
          <p className="text-sm uppercase tracking-[0.2em] text-[#949ba4]">
            Numbers
          </p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-[#949ba4]">
                Entry
              </p>
              <p className="mt-2 text-lg font-medium text-white">
                {trade.entryPrice}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-[#949ba4]">
                Exit
              </p>
              <p className="mt-2 text-lg font-medium text-white">
                {trade.exitPrice}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-[#949ba4]">
                Quantity
              </p>
              <p className="mt-2 text-lg font-medium text-white">
                {trade.quantity}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-[#949ba4]">
                Return
              </p>
              <p className="mt-2 text-lg font-medium text-white">
                {formatPercent(trade.pnlPercent / 100)}
              </p>
            </div>
          </div>

          <p
            className={`mt-6 text-3xl font-semibold ${
              trade.pnl >= 0 ? "text-emerald-700" : "text-rose-700"
            }`}
          >
            {formatCurrency(trade.pnl)}
          </p>
        </div>

        <div className="rounded-[28px] border border-white/8 bg-[#2b2d31] p-6 shadow-[0_24px_60px_rgba(0,0,0,0.3)]">
          <p className="text-sm uppercase tracking-[0.2em] text-[#949ba4]">
            Tags
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {trade.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-[#1e1f22] px-3 py-1 text-sm text-[#dbdee1]"
              >
                {tag}
              </span>
            ))}
          </div>

          <p className="mt-6 text-sm uppercase tracking-[0.2em] text-[#949ba4]">
            Mistakes
          </p>
          <ul className="mt-3 space-y-2 text-sm leading-7 text-[#dbdee1]">
            {trade.mistakes.length ? (
              trade.mistakes.map((mistake) => <li key={mistake}>• {mistake}</li>)
            ) : (
              <li>• None recorded on this demo trade.</li>
            )}
          </ul>
        </div>
      </section>
    </main>
  );
}
