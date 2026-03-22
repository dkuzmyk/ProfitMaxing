import Link from "next/link";

import { createClient } from "@/lib/supabase/server";
import {
  formatCurrency,
  formatPercent,
  getDemoMetrics,
} from "@/lib/demo-data";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  const isMissingSession =
    error?.name === "AuthSessionMissingError" ||
    error?.message.toLowerCase().includes("session missing");

  const connectionMessage = error && !isMissingSession
    ? "Supabase is configured, but the first auth check returned an error."
    : user
      ? `Supabase is connected and signed in as ${user.email ?? "an authenticated user"}.`
      : "Supabase is connected. No user is signed in yet, which is expected right now.";
  const demoMetrics = getDemoMetrics();

  return (
    <main className="px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <section className="overflow-hidden rounded-[28px] border border-white/8 bg-[linear-gradient(135deg,#313338_0%,#232428_55%,#1a1b1f_100%)] shadow-[0_32px_80px_rgba(0,0,0,0.35)]">
          <div className="grid gap-8 px-6 py-8 md:grid-cols-[1.1fr_0.9fr] md:px-10 md:py-10">
            <div className="flex flex-col gap-5">
              <p className="text-sm font-medium uppercase tracking-[0.25em] text-[#949ba4]">
                Profit Maxing
              </p>
              <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-white sm:text-5xl">
                Private journal for real trades. Guest mode for synthetic ones.
              </h1>
              <p className="max-w-2xl text-lg leading-8 text-[#b5bac1]">
                The app now has two clean paths: your personal workspace for
                real data and a guest demo that shows the product without
                exposing anything private.
              </p>

              <div className="flex flex-wrap gap-3">
                <Link
                  href="/login"
                  className="rounded-2xl bg-[#5865f2] px-5 py-3 text-sm font-medium text-white transition hover:bg-[#4752c4]"
                >
                  Open personal login
                </Link>
                <Link
                  href="/demo"
                  className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-medium text-[#dbdee1] transition hover:bg-white/10"
                >
                  Continue as guest
                </Link>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-[24px] border border-white/8 bg-[#1e1f22]/90 p-5">
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-[#949ba4]">
                  Connection
                </p>
                <p className="mt-3 text-sm leading-7 text-[#dbdee1]">
                  {connectionMessage}
                </p>
              </div>

              <div className="rounded-[24px] border border-white/8 bg-[#1e1f22]/90 p-5">
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-[#949ba4]">
                  Demo P&amp;L
                </p>
                <p className="mt-3 text-3xl font-semibold text-white">
                  {formatCurrency(demoMetrics.totalPnl)}
                </p>
              </div>

              <div className="rounded-[24px] border border-white/8 bg-[#1e1f22]/90 p-5">
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-[#949ba4]">
                  Demo Win Rate
                </p>
                <p className="mt-3 text-3xl font-semibold text-white">
                  {formatPercent(demoMetrics.winRate)}
                </p>
              </div>

              <div className="rounded-[24px] border border-white/8 bg-[#1e1f22]/90 p-5">
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-[#949ba4]">
                  Demo Trades
                </p>
                <p className="mt-3 text-3xl font-semibold text-white">
                  {demoMetrics.totalTrades}
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-[28px] border border-white/8 bg-[#2b2d31] p-6">
            <p className="text-sm font-medium uppercase tracking-[0.18em] text-[#949ba4]">
              Profit Maxing
            </p>
            <h2 className="mt-3 text-2xl font-semibold text-white">
              Personal workspace
            </h2>
            <p className="mt-3 text-sm leading-7 text-[#b5bac1]">
              Use this when you want to sign in, save real trades, and work
              against your own private data.
            </p>
            <Link
              href="/login"
              className="mt-6 inline-flex rounded-2xl bg-[#5865f2] px-5 py-3 text-sm font-medium text-white transition hover:bg-[#4752c4]"
            >
              Go to personal login
            </Link>
          </div>

          <div className="rounded-[28px] border border-white/8 bg-[#2b2d31] p-6">
            <p className="text-sm font-medium uppercase tracking-[0.18em] text-[#949ba4]">
              Guest mode
            </p>
            <h2 className="mt-3 text-2xl font-semibold text-white">
              Synthetic product walkthrough
            </h2>
            <p className="mt-3 text-sm leading-7 text-[#b5bac1]">
              Use this when you want to explore the interface or show it to
              someone else without exposing any personal trading history.
            </p>
            <Link
              href="/demo"
              className="mt-6 inline-flex rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-medium text-[#dbdee1] transition hover:bg-white/10"
            >
              Open guest demo
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
