"use client";

import React, { useState } from "react";
import Link from "next/link";
import { formatCurrency, formatPercent, type DemoTrade } from "@/lib/demo-data";

export type DemoSortHrefs = {
  date: string;
  pnl: string;
  returnPct: string;
  grade: string;
};

function formatHoldTime(minutes: number) {
  if (minutes < 60) return `${Math.round(minutes)}m`;
  if (minutes < 1440) return `${(minutes / 60).toFixed(1)}h`;
  return `${Math.round(minutes / 1440)}d`;
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const GRADE_CLS: Record<string, string> = {
  A: "text-emerald-400",
  B: "text-indigo-400",
  C: "text-white",
  D: "text-amber-400",
  F: "text-rose-400",
};

function SortIndicator({ active, dir }: { active: boolean; dir: string }) {
  if (!active) return <span className="opacity-25">↕</span>;
  return <span>{dir === "desc" ? "↓" : "↑"}</span>;
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

export function DemoJournalTable({
  trades,
  sortKey,
  sortDir,
  sortHrefs,
}: {
  trades: (DemoTrade & { holdingMinutes: number })[];
  sortKey: string;
  sortDir: "asc" | "desc";
  sortHrefs: DemoSortHrefs;
}) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  function toggle(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div className="overflow-hidden rounded-[20px] border border-white/8">
      <div className="overflow-x-auto">
        <table className="min-w-[1160px] w-full divide-y divide-white/8">
          <thead className="sticky top-0 z-10 bg-[#1e1f22] text-left text-[10px] uppercase tracking-[0.16em] text-[#949ba4]">
            <tr>
              <th className="w-7 px-2 py-2.5" />
              <th className="w-[112px] px-3 py-2.5">Trade</th>
              <th className="w-[106px] px-3 py-2.5">
                <Link href={sortHrefs.date} scroll={false} className="flex items-center gap-1 transition hover:text-white">
                  Opened <SortIndicator active={sortKey === "openedAt"} dir={sortDir} />
                </Link>
              </th>
              <th className="w-[68px] px-3 py-2.5">Status</th>
              <th className="w-[104px] px-3 py-2.5">Invested</th>
              <th className="w-[80px] px-3 py-2.5">Entry</th>
              <th className="w-[80px] px-3 py-2.5">Exit</th>
              <th className="w-[64px] px-3 py-2.5">Hold</th>
              <th className="w-[96px] px-3 py-2.5">
                <Link href={sortHrefs.pnl} scroll={false} className="flex items-center gap-1 transition hover:text-white">
                  P&amp;L <SortIndicator active={sortKey === "pnl"} dir={sortDir} />
                </Link>
              </th>
              <th className="w-[78px] px-3 py-2.5">
                <Link href={sortHrefs.returnPct} scroll={false} className="flex items-center gap-1 transition hover:text-white">
                  Return <SortIndicator active={sortKey === "pnlPercent"} dir={sortDir} />
                </Link>
              </th>
              <th className="w-[88px] px-3 py-2.5">
                <Link href={sortHrefs.grade} scroll={false} className="flex items-center gap-1 transition hover:text-white">
                  Review <SortIndicator active={sortKey === "grade"} dir={sortDir} />
                </Link>
              </th>
              <th className="w-[150px] px-3 py-2.5">Tags</th>
              <th className="w-[72px] px-3 py-2.5 text-right">View</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/6 text-[12px]">
            {trades.map((trade) => {
              const isOpen = expanded.has(trade.id);
              const hasNarrative = trade.thesis || trade.notes;
              return (
                <React.Fragment key={trade.id}>
                  <tr className="transition hover:bg-white/[0.02]">
                    <td className="px-2 py-2">
                      {hasNarrative ? (
                        <button
                          type="button"
                          onClick={() => toggle(trade.id)}
                          aria-label={isOpen ? "Collapse" : "Expand"}
                          className="flex items-center justify-center rounded-md p-0.5 text-[#6d7278] transition hover:text-white"
                        >
                          <ChevronIcon open={isOpen} />
                        </button>
                      ) : null}
                    </td>
                    <td className="px-3 py-2">
                      <p className="whitespace-nowrap font-medium text-white">{trade.symbol} · {trade.direction}</p>
                      <p className="mt-0.5 max-w-[98px] truncate text-[10px] text-[#6d7278]">{trade.setup}</p>
                    </td>
                    <td className="whitespace-nowrap px-3 py-2 text-[#b5bac1]">
                      {formatDateTime(trade.openedAt)}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2 text-[#b5bac1]">Closed</td>
                    <td className="whitespace-nowrap px-3 py-2 text-[#b5bac1]">
                      {formatCurrency(trade.entryPrice * trade.quantity)}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2 text-[#b5bac1]">
                      {formatCurrency(trade.entryPrice)}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2 text-[#b5bac1]">
                      {formatCurrency(trade.exitPrice)}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2 text-[#b5bac1]">
                      {formatHoldTime(trade.holdingMinutes)}
                    </td>
                    <td className={`whitespace-nowrap px-3 py-2 font-medium ${trade.pnl >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                      {formatCurrency(trade.pnl)}
                    </td>
                    <td className={`whitespace-nowrap px-3 py-2 font-medium ${trade.pnlPercent >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                      {formatPercent(trade.pnlPercent / 100)}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2">
                      <span className={`font-medium ${GRADE_CLS[trade.grade] ?? "text-[#b5bac1]"}`}>
                        {trade.grade}
                      </span>
                      <span className="text-[#6d7278]"> · {trade.confidenceRating}/5</span>
                    </td>
                    <td className="px-3 py-2 text-[#b5bac1]">
                      <div className="flex max-w-[136px] flex-wrap gap-1">
                        {trade.tags.slice(0, 2).map((tag) => (
                          <span key={tag} className="rounded-full bg-white/6 px-2 py-0.5 text-[11px] text-[#dbdee1]">{tag}</span>
                        ))}
                        {trade.mistakes.slice(0, 1).map((m) => (
                          <span key={m} className="rounded-full bg-rose-500/12 px-2 py-0.5 text-[11px] text-rose-300">{m}</span>
                        ))}
                        {trade.tags.length === 0 && trade.mistakes.length === 0 && (
                          <span className="text-[11px] text-[#6d7278]">—</span>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-2 text-right">
                      <Link href={`/demo/trades/${trade.id}`} className="rounded-[10px] border border-white/10 bg-[#1e1f22] px-2.5 py-1.5 text-[11px] font-medium text-[#dbdee1] transition hover:bg-[#18191c] hover:text-white">
                        View
                      </Link>
                    </td>
                  </tr>
                  {isOpen && hasNarrative && (
                    <tr className="bg-[#1e1f22]/60">
                      <td colSpan={13} className="px-5 py-4">
                        <div className="grid gap-4 sm:grid-cols-2">
                          {trade.thesis && (
                            <div>
                              <p className="mb-1 text-[10px] font-medium uppercase tracking-[0.2em] text-[#6d7278]">Thesis</p>
                              <p className="text-[12px] leading-relaxed text-[#b5bac1]">{trade.thesis}</p>
                            </div>
                          )}
                          {trade.notes && (
                            <div>
                              <p className="mb-1 text-[10px] font-medium uppercase tracking-[0.2em] text-[#6d7278]">Notes</p>
                              <p className="text-[12px] leading-relaxed text-[#b5bac1]">{trade.notes}</p>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
