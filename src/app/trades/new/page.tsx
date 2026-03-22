import Link from "next/link";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

import { createTrade } from "../actions";
import { TradeForm } from "../trade-form";

export default async function NewTradePage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string; saved?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?message=Please sign in to create a trade.");
  }

  const { message, saved } = await searchParams;

  return (
    <main className="px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
        <section className="flex flex-col gap-4 rounded-[28px] border border-white/8 bg-[#2b2d31] p-8 shadow-[0_32px_80px_rgba(0,0,0,0.35)]">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.25em] text-[#949ba4]">
                Real Trade Entry
              </p>
              <h1 className="mt-3 text-4xl font-semibold tracking-tight text-white">
                Insert a trade fast
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-[#b5bac1]">
                Keep the form minimal: symbol, side, size, entry, and time.
                Close details are optional so open trades do not slow you down.
              </p>
            </div>

            <Link
              href="/dashboard"
              className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-[#dbdee1] transition hover:bg-white/10"
            >
              Back to dashboard
            </Link>
          </div>

          {saved ? (
            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
              Trade saved. You can enter the next one immediately.
            </div>
          ) : null}

          {message ? (
            <div className="rounded-2xl border border-[#f0b232]/20 bg-[#f0b232]/10 px-4 py-3 text-sm text-[#f5c96a]">
              {message}
            </div>
          ) : null}
        </section>

        <TradeForm action={createTrade} />
      </div>
    </main>
  );
}
