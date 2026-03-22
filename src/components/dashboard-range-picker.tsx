"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { startTransition } from "react";

import type { TradeRange } from "@/lib/trade-metrics";

type DashboardRangePickerProps = {
  options: ReadonlyArray<{
    value: TradeRange;
    label: string;
  }>;
  selectedRange: TradeRange;
};

export function DashboardRangePicker({
  options,
  selectedRange,
}: DashboardRangePickerProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  return (
    <label className="flex flex-col gap-2">
      <span className="text-xs font-medium uppercase tracking-[0.18em] text-[#949ba4]">
        Range
      </span>
      <select
        value={selectedRange}
        onChange={(event) => {
          const nextRange = event.target.value;
          const nextSearchParams = new URLSearchParams(searchParams.toString());
          nextSearchParams.set("range", nextRange);
          nextSearchParams.delete("page");

          startTransition(() => {
            router.replace(`${pathname}?${nextSearchParams.toString()}`, {
              scroll: false,
            });
          });
        }}
        className="min-w-36 rounded-2xl border border-white/8 bg-[#1e1f22] px-4 py-3 text-sm font-medium text-white outline-none transition hover:bg-[#18191c] focus:border-[#5865f2]"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
