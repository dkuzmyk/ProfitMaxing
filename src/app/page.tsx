import Link from "next/link";
import {
  TrendingUp,
  Brain,
  TrendingDown,
  CalendarDays,
  Flame,
  Target,
} from "lucide-react";

import { signOut } from "@/app/login/actions";
import { createClient } from "@/lib/supabase/server";
import {
  formatCurrency,
  formatPercent,
  getDemoMetrics,
  getDemoTrades,
} from "@/lib/demo-data";
import { getTradeStreak } from "@/lib/trade-metrics";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  const isMissingSession =
    error?.name === "AuthSessionMissingError" ||
    error?.message.toLowerCase().includes("session missing");
  const isAuthenticated = !!user && !isMissingSession;

  const demoMetrics = getDemoMetrics("all");
  const allDemoTrades = getDemoTrades();
  const streak = getTradeStreak(
    allDemoTrades.map((t) => ({
      direction: t.direction,
      entry_price: t.entryPrice,
      exit_price: t.exitPrice,
      closed_at: t.closedAt,
      quantity: t.quantity,
    })),
  );

  return (
    <main className="px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">

        {/* ── Hero ── */}
        <section className="overflow-hidden rounded-[32px] border border-white/8 bg-[linear-gradient(135deg,#313338_0%,#232428_55%,#1a1b1f_100%)] shadow-[0_32px_80px_rgba(0,0,0,0.4)]">
          <div className="grid gap-10 px-8 py-12 md:grid-cols-[1.15fr_0.85fr] md:px-12 md:py-14">

            {/* Left: copy + CTAs */}
            <div className="flex flex-col gap-6 justify-center">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#5865f2]">
                Profit Maxing
              </p>
              <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-[3.4rem] lg:leading-[1.1]">
                Know your edge.<br />
                <span className="text-[#5865f2]">Close your leaks.</span>
              </h1>
              <p className="max-w-xl text-[1.05rem] leading-[1.75] text-[#b5bac1]">
                Most traders lose money they never see leaving. ProfitMaxing is a
                trade journal built to surface the patterns, setups, and habits
                that are actually driving your P&L — the good and the bad.
              </p>

              <ul className="flex flex-col gap-2 text-sm text-[#949ba4]">
                {[
                  "Cumulative P&L curve with per-trade hover",
                  "Win rate, profit factor, and streak tracking",
                  "Plan adherence and grade every trade",
                  "Drawdown alerts and daily P&L bars",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2.5">
                    <span className="text-emerald-400">✓</span>
                    {item}
                  </li>
                ))}
              </ul>

              <div className="flex flex-wrap items-center gap-3 pt-1">
                <Link
                  href="/demo"
                  className="rounded-[22px] bg-[#5865f2] px-6 py-3 text-sm font-semibold text-white shadow-[0_0_24px_rgba(88,101,242,0.35)] transition hover:bg-[#4752c4] hover:shadow-[0_0_32px_rgba(88,101,242,0.5)]"
                >
                  Try the demo — no sign-up
                </Link>
                {isAuthenticated ? (
                  <Link
                    href="/dashboard"
                    className="rounded-[22px] border border-white/10 bg-white/5 px-6 py-3 text-sm font-medium text-[#dbdee1] transition hover:bg-white/10"
                  >
                    Go to dashboard →
                  </Link>
                ) : (
                  <Link
                    href="/login"
                    className="rounded-[22px] border border-white/10 bg-white/5 px-6 py-3 text-sm font-medium text-[#dbdee1] transition hover:bg-white/10"
                  >
                    Sign in
                  </Link>
                )}
              </div>
            </div>

            {/* Right: live demo stats */}
            <div className="flex flex-col gap-3">
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#6d7278]">
                Live demo account
              </p>

              {/* Big P&L */}
              <div className="rounded-[24px] border border-white/8 bg-[#1e1f22]/90 px-5 py-5">
                <p className="text-[10px] uppercase tracking-wider text-[#6d7278]">Total P&amp;L</p>
                <p className={`mt-2 text-4xl font-bold ${demoMetrics.totalPnl >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                  {formatCurrency(demoMetrics.totalPnl)}
                </p>
                <p className="mt-1 text-xs text-[#4a4d52]">
                  {demoMetrics.totalTrades} trades · {demoMetrics.closedTrades} closed
                </p>
              </div>

              {/* 2-col stat grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-[24px] border border-white/8 bg-[#1e1f22]/90 px-4 py-4">
                  <p className="text-[10px] uppercase tracking-wider text-[#6d7278]">Win Rate</p>
                  <p className={`mt-1.5 text-2xl font-bold ${demoMetrics.winRate >= 0.55 ? "text-emerald-400" : demoMetrics.winRate >= 0.4 ? "text-white" : "text-rose-400"}`}>
                    {formatPercent(demoMetrics.winRate)}
                  </p>
                </div>
                <div className="rounded-[24px] border border-white/8 bg-[#1e1f22]/90 px-4 py-4">
                  <p className="text-[10px] uppercase tracking-wider text-[#6d7278]">Profit Factor</p>
                  <p className="mt-1.5 text-2xl font-bold text-white">
                    {demoMetrics.profitFactor.toFixed(2)}
                  </p>
                </div>
                <div className="rounded-[24px] border border-white/8 bg-[#1e1f22]/90 px-4 py-4">
                  <p className="text-[10px] uppercase tracking-wider text-[#6d7278]">Avg Win</p>
                  <p className="mt-1.5 text-lg font-bold text-emerald-400">
                    {formatCurrency(demoMetrics.averageWin)}
                  </p>
                </div>
                <div className="rounded-[24px] border border-white/8 bg-[#1e1f22]/90 px-4 py-4">
                  <p className="text-[10px] uppercase tracking-wider text-[#6d7278]">Avg Loss</p>
                  <p className="mt-1.5 text-lg font-bold text-rose-400">
                    {formatCurrency(demoMetrics.averageLoss)}
                  </p>
                </div>
              </div>

              {/* Streak + Best trade */}
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-[24px] border border-white/8 bg-[#1e1f22]/90 px-4 py-4">
                  <p className="text-[10px] uppercase tracking-wider text-[#6d7278]">Current Streak</p>
                  <p className={`mt-1.5 text-xl font-bold ${streak.type === "win" ? "text-emerald-400" : streak.type === "loss" ? "text-rose-400" : "text-white"}`}>
                    {streak.count > 0
                      ? `${streak.count}${streak.type === "win" ? "W" : "L"}`
                      : "—"}
                  </p>
                  <p className="mt-0.5 text-[10px] text-[#4a4d52]">consecutive</p>
                </div>
                {demoMetrics.bestTrade ? (
                  <div className="rounded-[24px] border border-white/8 bg-[#1e1f22]/90 px-4 py-4">
                    <p className="text-[10px] uppercase tracking-wider text-[#6d7278]">Best Trade</p>
                    <p className="mt-1.5 text-sm font-bold text-white">{demoMetrics.bestTrade.symbol}</p>
                    <p className="mt-0.5 text-sm font-semibold text-emerald-400">
                      {formatCurrency(demoMetrics.bestTrade.pnl)}
                    </p>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </section>

        {/* ── Why traders use it ── */}
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[
            {
              Icon: TrendingUp,
              color: "text-emerald-400",
              bg: "bg-emerald-400/10",
              title: "See your real edge",
              body: "Most traders think they have an edge until they look at their actual numbers. Profit factor, expectancy, win rate by setup — know what's working before you size up.",
            },
            {
              Icon: Brain,
              color: "text-violet-400",
              bg: "bg-violet-400/10",
              title: "Grade every decision",
              body: "Log confidence, setup quality, and whether you followed your plan. Over time you'll see if your losses are bad luck or bad habits.",
            },
            {
              Icon: TrendingDown,
              color: "text-rose-400",
              bg: "bg-rose-400/10",
              title: "Drawdown awareness",
              body: "Real-time drawdown tracking so you know exactly where you are relative to your peak. Stop averaging down blind — see the damage before it compounds.",
            },
            {
              Icon: CalendarDays,
              color: "text-sky-400",
              bg: "bg-sky-400/10",
              title: "Daily P&L rhythm",
              body: "Bar chart of every trading day so you can spot which days or sessions consistently drain your account. Time your size to your best windows.",
            },
            {
              Icon: Flame,
              color: "text-orange-400",
              bg: "bg-orange-400/10",
              title: "Streak tracking",
              body: "Know when you're on a hot streak — or a cold one. Consecutive losses are a sign to step back. Consecutive wins are a sign to stay disciplined.",
            },
            {
              Icon: Target,
              color: "text-amber-400",
              bg: "bg-amber-400/10",
              title: "Plan adherence",
              body: "Tag every trade as followed-plan or not. When you break your rules and win, that's the most dangerous outcome. Track it anyway.",
            },
          ].map(({ Icon, color, bg, title, body }) => (
            <div
              key={title}
              className="rounded-[28px] border border-white/8 bg-[#2b2d31] p-6"
            >
              <span className={`inline-flex rounded-2xl p-2.5 ${bg}`}>
                <Icon className={`h-5 w-5 ${color}`} strokeWidth={1.75} />
              </span>
              <h3 className="mt-3 text-base font-semibold text-white">{title}</h3>
              <p className="mt-2 text-sm leading-[1.7] text-[#949ba4]">{body}</p>
            </div>
          ))}
        </section>

        {/* ── Bottom CTA ── */}
        <section className="rounded-[28px] border border-[#5865f2]/25 bg-[linear-gradient(135deg,#1e1f22_0%,#232428_100%)] p-8 text-center shadow-[0_0_60px_rgba(88,101,242,0.08)]">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#5865f2]">No sign-up required</p>
          <h2 className="mt-3 text-2xl font-bold text-white sm:text-3xl">
            See it with real data — yours or the demo.
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-sm leading-[1.75] text-[#949ba4]">
            The demo is pre-loaded with {demoMetrics.totalTrades} trades across multiple symbols. Every chart,
            hover tooltip, and metric is live. Takes 10 seconds to open.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/demo"
              className="rounded-[22px] bg-[#5865f2] px-7 py-3 text-sm font-semibold text-white shadow-[0_0_24px_rgba(88,101,242,0.3)] transition hover:bg-[#4752c4] hover:shadow-[0_0_40px_rgba(88,101,242,0.5)]"
            >
              Open demo dashboard
            </Link>
            {isAuthenticated ? (
              <>
                <Link
                  href="/dashboard"
                  className="rounded-[22px] border border-white/10 bg-white/5 px-7 py-3 text-sm font-medium text-[#dbdee1] transition hover:bg-white/10"
                >
                  My dashboard →
                </Link>
                <form action={signOut}>
                  <button
                    type="submit"
                    className="rounded-[22px] border border-white/6 px-7 py-3 text-sm text-[#6d7278] transition hover:text-[#b5bac1]"
                  >
                    Sign out
                  </button>
                </form>
              </>
            ) : (
              <Link
                href="/login"
                className="rounded-[22px] border border-white/10 bg-white/5 px-7 py-3 text-sm font-medium text-[#dbdee1] transition hover:bg-white/10"
              >
                Sign in to your account
              </Link>
            )}
          </div>
        </section>

      </div>
    </main>
  );
}
