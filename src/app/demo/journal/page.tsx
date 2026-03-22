import Link from "next/link";

import {
  formatCurrency,
  formatDateTime,
  formatPercent,
  getDemoTrades,
} from "@/lib/demo-data";

export default function DemoJournalPage() {
  const trades = getDemoTrades();

  return (
    <main className="rounded-[28px] border border-white/8 bg-[#2b2d31] p-6 shadow-[0_24px_60px_rgba(0,0,0,0.3)]">
      <div className="flex flex-col gap-2">
        <p className="text-sm uppercase tracking-[0.2em] text-[#949ba4]">
          Demo Journal
        </p>
        <h2 className="text-2xl font-semibold text-white">
          Synthetic trades table
        </h2>
        <p className="text-sm leading-7 text-[#b5bac1]">
          This table is our first stand-in for the real trade journal. Later,
          the rows will come from the database instead of a local file.
        </p>
      </div>

      <div className="mt-6 overflow-hidden rounded-[24px] border border-white/8">
        <table className="min-w-full divide-y divide-white/8">
          <thead className="bg-[#1e1f22] text-left text-xs uppercase tracking-[0.18em] text-[#949ba4]">
            <tr>
              <th className="px-4 py-3">Symbol</th>
              <th className="px-4 py-3">Setup</th>
              <th className="px-4 py-3">Opened</th>
              <th className="px-4 py-3">Direction</th>
              <th className="px-4 py-3">P&amp;L</th>
              <th className="px-4 py-3">Return</th>
              <th className="px-4 py-3">Grade</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/6 bg-[#2b2d31] text-sm">
            {trades.map((trade) => (
              <tr key={trade.id} className="hover:bg-white/4">
                <td className="px-4 py-4 font-medium text-white">
                  <Link
                    href={`/demo/trades/${trade.id}`}
                    className="underline decoration-[#5865f2]/45 underline-offset-4"
                  >
                    {trade.symbol}
                  </Link>
                </td>
                <td className="px-4 py-4 text-[#b5bac1]">{trade.setup}</td>
                <td className="px-4 py-4 text-[#b5bac1]">
                  {formatDateTime(trade.openedAt)}
                </td>
                <td className="px-4 py-4 text-[#b5bac1]">{trade.direction}</td>
                <td
                  className={`px-4 py-4 font-medium ${
                    trade.pnl >= 0 ? "text-emerald-700" : "text-rose-700"
                  }`}
                >
                  {formatCurrency(trade.pnl)}
                </td>
                <td className="px-4 py-4 text-[#b5bac1]">
                  {formatPercent(trade.pnlPercent / 100)}
                </td>
                <td className="px-4 py-4 text-[#b5bac1]">{trade.grade}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
