import { redirect } from "next/navigation";

import { WorkspaceTabs } from "@/components/workspace-tabs";
import { createClient } from "@/lib/supabase/server";
import { importTrades } from "./actions";

export default async function ImportPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?message=Please sign in to import trades.");
  }

  const { error } = await searchParams;

  return (
    <main className="px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-4">
        <WorkspaceTabs variant="real" />

        <header className="rounded-[28px] border border-white/8 bg-[#2b2d31] p-6 shadow-[0_24px_60px_rgba(0,0,0,0.3)]">
          <p className="text-xs font-medium uppercase tracking-[0.22em] text-[#949ba4]">
            Import
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white">
            CSV Trade Import
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#b5bac1]">
            Upload a CSV exported from your broker or any spreadsheet. Trades are
            inserted with write-time derived fields (P&amp;L, holding time, etc.)
            calculated automatically.
          </p>
        </header>

        {error && (
          <div className="rounded-[24px] border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
            {error}
          </div>
        )}

        <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
          <section className="rounded-[28px] border border-white/8 bg-[#2b2d31] p-6 shadow-[0_24px_60px_rgba(0,0,0,0.3)]">
            <p className="text-sm uppercase tracking-[0.2em] text-[#949ba4]">
              Upload File
            </p>

            <form action={importTrades} className="mt-5 flex flex-col gap-4">
              <div>
                <label
                  htmlFor="file"
                  className="block text-xs font-medium uppercase tracking-[0.18em] text-[#949ba4]"
                >
                  CSV File
                </label>
                <input
                  id="file"
                  name="file"
                  type="file"
                  accept=".csv,text/csv"
                  required
                  className="mt-3 w-full cursor-pointer rounded-2xl border border-white/10 bg-[#1e1f22] px-4 py-3 text-sm text-[#dbdee1] outline-none transition file:mr-4 file:rounded-xl file:border-0 file:bg-[#5865f2] file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-white hover:border-white/20 focus:border-[#5865f2]"
                />
              </div>

              <button
                type="submit"
                className="w-full rounded-2xl bg-[#5865f2] px-4 py-3 text-sm font-medium text-white transition hover:bg-[#4752c4]"
              >
                Import trades
              </button>
            </form>

            <p className="mt-4 text-xs leading-6 text-[#6d7278]">
              Max file size: 2 MB. Existing trades are not deduplicated — run
              import once per export file to avoid duplicates.
            </p>
          </section>

          <section className="rounded-[28px] border border-white/8 bg-[#2b2d31] p-6 shadow-[0_24px_60px_rgba(0,0,0,0.3)]">
            <p className="text-sm uppercase tracking-[0.2em] text-[#949ba4]">
              Expected Columns
            </p>

            <div className="mt-5 grid gap-3">
              <div className="rounded-[20px] bg-[#1e1f22] px-4 py-3">
                <p className="text-xs font-medium text-white">Required</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {["symbol", "direction", "quantity", "entry_price", "opened_at"].map(
                    (col) => (
                      <code
                        key={col}
                        className="rounded-lg bg-white/6 px-2 py-0.5 text-[11px] text-[#dbdee1]"
                      >
                        {col}
                      </code>
                    ),
                  )}
                </div>
              </div>

              <div className="rounded-[20px] bg-[#1e1f22] px-4 py-3">
                <p className="text-xs font-medium text-white">Optional</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {[
                    "exit_price",
                    "closed_at",
                    "setup",
                    "notes",
                    "thesis",
                    "lessons",
                    "tags",
                    "mistake_tags",
                    "grade",
                    "confidence_rating",
                    "followed_plan",
                  ].map((col) => (
                    <code
                      key={col}
                      className="rounded-lg bg-white/6 px-2 py-0.5 text-[11px] text-[#949ba4]"
                    >
                      {col}
                    </code>
                  ))}
                </div>
              </div>

              <div className="rounded-[20px] bg-[#1e1f22] px-4 py-3">
                <p className="text-xs font-medium text-white">Field formats</p>
                <ul className="mt-2 space-y-1 text-[11px] leading-5 text-[#949ba4]">
                  <li>
                    <span className="text-[#dbdee1]">direction</span> — Long / Short,
                    Buy / Sell, B / S
                  </li>
                  <li>
                    <span className="text-[#dbdee1]">opened_at / closed_at</span> — any
                    parseable date or datetime
                  </li>
                  <li>
                    <span className="text-[#dbdee1]">tags / mistake_tags</span> — comma
                    or semicolon separated
                  </li>
                  <li>
                    <span className="text-[#dbdee1]">grade</span> — A, B, C, D, or F
                  </li>
                  <li>
                    <span className="text-[#dbdee1]">confidence_rating</span> — 1–5
                  </li>
                  <li>
                    <span className="text-[#dbdee1]">followed_plan</span> — yes / no /
                    true / false
                  </li>
                </ul>
              </div>

              <div className="rounded-[20px] bg-[#1e1f22] px-4 py-3">
                <p className="text-xs font-medium text-white">Accepted column aliases</p>
                <p className="mt-2 text-[11px] leading-5 text-[#949ba4]">
                  Headers are matched case-insensitively and ignoring spaces and
                  underscores. Aliases include <code className="text-[#dbdee1]">ticker</code>,{" "}
                  <code className="text-[#dbdee1]">side</code>,{" "}
                  <code className="text-[#dbdee1]">qty</code>,{" "}
                  <code className="text-[#dbdee1]">shares</code>,{" "}
                  <code className="text-[#dbdee1]">entry</code>,{" "}
                  <code className="text-[#dbdee1]">exit</code>,{" "}
                  <code className="text-[#dbdee1]">date</code>, and more.
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
