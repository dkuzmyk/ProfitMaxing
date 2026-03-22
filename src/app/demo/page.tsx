import Link from "next/link";

import {
  formatCurrency,
  formatPercent,
  getDemoMetrics,
  getDemoTrades,
} from "@/lib/demo-data";

export default function DemoOverviewPage() {
  const metrics = getDemoMetrics();
  const recentTrades = getDemoTrades().slice(0, 4);

  return (
    <main className="flex flex-col gap-6">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-[24px] border border-white/8 bg-[#2b2d31] p-6">
          <p className="text-sm uppercase tracking-[0.2em] text-[#949ba4]">
            Total P&amp;L
          </p>
          <p className="mt-3 text-3xl font-semibold text-white">
            {formatCurrency(metrics.totalPnl)}
          </p>
        </div>

        <div className="rounded-[24px] border border-white/8 bg-[#2b2d31] p-6">
          <p className="text-sm uppercase tracking-[0.2em] text-[#949ba4]">
            Win Rate
          </p>
          <p className="mt-3 text-3xl font-semibold text-white">
            {formatPercent(metrics.winRate)}
          </p>
        </div>

        <div className="rounded-[24px] border border-white/8 bg-[#2b2d31] p-6">
          <p className="text-sm uppercase tracking-[0.2em] text-[#949ba4]">
            Profit Factor
          </p>
          <p className="mt-3 text-3xl font-semibold text-white">
            {metrics.profitFactor.toFixed(2)}
          </p>
        </div>

        <div className="rounded-[24px] border border-white/8 bg-[#2b2d31] p-6">
          <p className="text-sm uppercase tracking-[0.2em] text-[#949ba4]">
            Avg Hold
          </p>
          <p className="mt-3 text-3xl font-semibold text-white">
            {Math.round(metrics.averageHoldMinutes)} min
          </p>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-[24px] border border-white/8 bg-[#2b2d31] p-6">
          <p className="text-sm uppercase tracking-[0.2em] text-[#949ba4]">
            Closed Trades
          </p>
          <p className="mt-3 text-2xl font-semibold text-white">
            {metrics.totalTrades}
          </p>
        </div>

        <div className="rounded-[24px] border border-white/8 bg-[#2b2d31] p-6">
          <p className="text-sm uppercase tracking-[0.2em] text-[#949ba4]">
            Open Trades
          </p>
          <p className="mt-3 text-2xl font-semibold text-white">0</p>
        </div>

        <div className="rounded-[24px] border border-white/8 bg-[#2b2d31] p-6">
          <p className="text-sm uppercase tracking-[0.2em] text-[#949ba4]">
            Average Win
          </p>
          <p className="mt-3 text-2xl font-semibold text-emerald-400">
            {formatCurrency(metrics.averageWin)}
          </p>
        </div>

        <div className="rounded-[24px] border border-white/8 bg-[#2b2d31] p-6">
          <p className="text-sm uppercase tracking-[0.2em] text-[#949ba4]">
            Average Loss
          </p>
          <p className="mt-3 text-2xl font-semibold text-rose-400">
            {formatCurrency(metrics.averageLoss)}
          </p>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-[28px] border border-white/8 bg-[#2b2d31] p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-[#949ba4]">
                Recent Trades
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-white">
                Demo journal feed
              </h2>
            </div>
            <Link
              href="/demo/journal"
              className="text-sm font-medium text-[#cdd0f7] underline decoration-[#5865f2]/50 underline-offset-4"
            >
              Open full journal
            </Link>
          </div>

          <div className="mt-6 grid gap-4">
            {recentTrades.map((trade) => (
              <Link
                key={trade.id}
                href={`/demo/trades/${trade.id}`}
                className="rounded-[24px] border border-white/8 bg-[#1e1f22] p-4 transition hover:-translate-y-0.5 hover:border-[#5865f2]/35 hover:bg-[#191a1d]"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-lg font-semibold text-white">
                      {trade.symbol} · {trade.setup}
                    </p>
                    <p className="text-sm text-[#949ba4]">
                      {trade.direction} · {trade.account}
                    </p>
                  </div>
                  <p
                    className={`text-lg font-semibold ${
                      trade.pnl >= 0 ? "text-emerald-700" : "text-rose-700"
                    }`}
                  >
                    {formatCurrency(trade.pnl)}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        <div className="grid gap-6">
          <div className="rounded-[28px] border border-white/8 bg-[#2b2d31] p-6">
            <p className="text-sm uppercase tracking-[0.2em] text-[#949ba4]">
              Performance Snapshot
            </p>
            <div className="mt-5 grid gap-4 sm:grid-cols-3">
              <div className="rounded-[24px] bg-[#1e1f22] p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-[#949ba4]">
                  Tracked Trades
                </p>
                <p className="mt-2 text-xl font-semibold text-white">
                  {metrics.totalTrades}
                </p>
              </div>
              <div className="rounded-[24px] bg-[#1e1f22] p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-[#949ba4]">
                  Avg Hold
                </p>
                <p className="mt-2 text-xl font-semibold text-white">
                  {Math.round(metrics.averageHoldMinutes)} min
                </p>
              </div>
              <div className="rounded-[24px] bg-[#1e1f22] p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-[#949ba4]">
                  Data Status
                </p>
                <p className="mt-2 text-xl font-semibold text-white">Demo</p>
              </div>
            </div>

            <p className="mt-5 text-sm leading-7 text-[#b5bac1]">
              Guest metrics mirror the personal dashboard, but they are derived
              entirely from synthetic trades so nothing private is exposed.
            </p>
          </div>

          <div className="rounded-[28px] border border-white/8 bg-[#2b2d31] p-6">
            <p className="text-sm uppercase tracking-[0.2em] text-[#949ba4]">
              Best Trade
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-white">
              {metrics.bestTrade.symbol}
            </h2>
            <p className="mt-3 text-lg text-emerald-700">
              {formatCurrency(metrics.bestTrade.pnl)}
            </p>
            <p className="mt-3 text-sm leading-7 text-[#b5bac1]">
              {metrics.bestTrade.thesis}
            </p>
          </div>

          <div className="rounded-[28px] border border-white/8 bg-[#2b2d31] p-6">
            <p className="text-sm uppercase tracking-[0.2em] text-[#949ba4]">
              Demo Boundary
            </p>
            <p className="mt-3 text-sm leading-7 text-[#b5bac1]">
              Everything on these demo pages uses synthetic data. This lets
              guests explore the product without touching any real trading
              records.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
