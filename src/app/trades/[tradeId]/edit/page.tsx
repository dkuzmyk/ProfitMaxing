import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

import { updateTrade } from "../../actions";
import { TradeForm } from "../../trade-form";

export default async function EditTradePage({
  params,
  searchParams,
}: {
  params: Promise<{ tradeId: string }>;
  searchParams: Promise<{ message?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?message=Please sign in to edit trades.");
  }

  const { tradeId } = await params;
  const { message } = await searchParams;
  const { data: trade, error } = await supabase
    .from("trades")
    .select(
      "id, symbol, setup, direction, quantity, entry_price, exit_price, opened_at, closed_at, notes",
    )
    .eq("id", tradeId)
    .single();

  if (error || !trade) {
    notFound();
  }

  const editStartedAt = new Date().toISOString();

  return (
    <main className="px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
        <section className="flex flex-col gap-4 rounded-[28px] border border-white/8 bg-[#2b2d31] p-8 shadow-[0_32px_80px_rgba(0,0,0,0.35)]">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.25em] text-[#949ba4]">
                Edit Trade
              </p>
              <h1 className="mt-3 text-4xl font-semibold tracking-tight text-white">
                {trade.symbol} trade
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-[#b5bac1]">
                Update the details, then save the changes back to your private
                journal.
              </p>
            </div>

            <Link
              href="/dashboard"
              className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-[#dbdee1] transition hover:bg-white/10"
            >
              Back to dashboard
            </Link>
          </div>

          {message ? (
            <div className="rounded-2xl border border-[#f0b232]/20 bg-[#f0b232]/10 px-4 py-3 text-sm text-[#f5c96a]">
              {message}
            </div>
          ) : null}
        </section>

        <TradeForm
          action={updateTrade}
          submitLabel="Save changes"
          secondarySubmitLabel={null}
          cancelHref="/dashboard"
          cancelLabel="Cancel edit"
          initialValues={{
            tradeId: trade.id,
            symbol: trade.symbol,
            setup: trade.setup,
            direction: trade.direction,
            quantity: trade.quantity,
            entryPrice: Number(trade.entry_price),
            openedAt: trade.opened_at,
            exitPrice: trade.exit_price == null ? null : Number(trade.exit_price),
            closedAt: editStartedAt,
            notes: trade.notes,
          }}
        />
      </div>
    </main>
  );
}
