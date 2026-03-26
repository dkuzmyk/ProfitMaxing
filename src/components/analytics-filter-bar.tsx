"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { startTransition, useState } from "react";

type Props = {
  initialSymbol: string;
  initialTag: string;
  initialDirection: string;
};

export function AnalyticsFilterBar({ initialSymbol, initialTag, initialDirection }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [symbolInput, setSymbolInput] = useState(initialSymbol);
  const [tagInput, setTagInput] = useState(initialTag);

  function navigate(updates: Record<string, string>) {
    const next = new URLSearchParams(searchParams.toString());
    for (const [k, v] of Object.entries(updates)) {
      if (v) next.set(k, v);
      else next.delete(k);
    }
    startTransition(() => {
      router.replace(`${pathname}?${next.toString()}`, { scroll: false });
    });
  }

  const activeDirection = initialDirection || "all";

  return (
    <div className="flex flex-wrap items-end gap-3">
      <label className="flex flex-col gap-2">
        <span className="text-xs font-medium uppercase tracking-[0.18em] text-[#949ba4]">
          Symbol
        </span>
        <div className="relative flex items-center">
          <input
            type="text"
            value={symbolInput}
            onChange={(e) => setSymbolInput(e.target.value.toUpperCase())}
            onKeyDown={(e) => e.key === "Enter" && navigate({ symbol: symbolInput })}
            onBlur={() => navigate({ symbol: symbolInput })}
            placeholder="AAPL"
            className="w-28 rounded-2xl border border-white/8 bg-[#1e1f22] px-4 py-3 pr-8 text-sm font-medium text-white placeholder-[#6d7278] outline-none transition hover:bg-[#18191c] focus:border-[#5865f2]"
          />
          {symbolInput && (
            <button
              onClick={() => {
                setSymbolInput("");
                navigate({ symbol: "" });
              }}
              className="absolute right-3 text-sm leading-none text-[#6d7278] hover:text-white"
            >
              ×
            </button>
          )}
        </div>
      </label>

      <label className="flex flex-col gap-2">
        <span className="text-xs font-medium uppercase tracking-[0.18em] text-[#949ba4]">
          Tag
        </span>
        <div className="relative flex items-center">
          <input
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value.toLowerCase())}
            onKeyDown={(e) => e.key === "Enter" && navigate({ tag: tagInput })}
            onBlur={() => navigate({ tag: tagInput })}
            placeholder="earnings"
            className="w-32 rounded-2xl border border-white/8 bg-[#1e1f22] px-4 py-3 pr-8 text-sm font-medium text-white placeholder-[#6d7278] outline-none transition hover:bg-[#18191c] focus:border-[#5865f2]"
          />
          {tagInput && (
            <button
              onClick={() => {
                setTagInput("");
                navigate({ tag: "" });
              }}
              className="absolute right-3 text-sm leading-none text-[#6d7278] hover:text-white"
            >
              ×
            </button>
          )}
        </div>
      </label>

      <div className="flex flex-col gap-2">
        <span className="text-xs font-medium uppercase tracking-[0.18em] text-[#949ba4]">
          Direction
        </span>
        <div className="flex overflow-hidden rounded-2xl border border-white/8 bg-[#1e1f22]">
          {(["all", "Long", "Short"] as const).map((d) => (
            <button
              key={d}
              onClick={() => navigate({ direction: d === "all" ? "" : d })}
              className={`px-4 py-3 text-sm font-medium transition ${
                activeDirection === d
                  ? "bg-[#5865f2] text-white"
                  : "text-[#949ba4] hover:text-white"
              }`}
            >
              {d === "all" ? "All" : d}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
