"use client";

import React, { useState } from "react";
import Link from "next/link";
import { deleteTrade } from "@/app/trades/actions";
import { formatCurrency, formatPercent } from "@/lib/demo-data";

export type JournalTrade = {
  id: string;
  symbol: string;
  setup: string | null;
  direction: "Long" | "Short";
  opened_at: string;
  closed_at: string | null;
  quantity: number;
  status: "Open" | "Closed";
  entry_value: number | string;
  entry_price: number | string;
  exit_price: number | string | null;
  realized_pnl: number | string;
  realized_pnl_percent: number | string | null;
  followed_plan: boolean | null;
  confidence_rating: number | null;
  grade: "A" | "B" | "C" | "D" | "F" | null;
  tags: string[];
  mistake_tags: string[];
  holding_minutes: number | null;
  thesis: string | null;
  notes: string | null;
  lessons: string | null;
};

export type SortHrefs = {
  date: string;
  pnl: string;
  returnPct: string;
  grade: string;
};

function formatHoldTime(minutes: number | null) {
  if (minutes == null || minutes < 0) return "--";
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

function EditIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 1 1 3 3L7 19l-4 1 1-4z" />
    </svg>
  );
}

function DeleteIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 6h18" />
      <path d="M8 6V4h8v2" />
      <path d="M19 6l-1 14H6L5 6" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
    </svg>
  );
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

export function JournalTable({
  trades,
  sortKey,
  sortDir,
  sortHrefs,
}: {
  trades: JournalTrade[];
  sortKey: string;
  sortDir: "asc" | "desc";
  sortHrefs: SortHrefs;
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
                  Opened <SortIndicator active={sortKey === "trade_date"} dir={sortDir} />
                </Link>
              </th>
              <th className="w-[68px] px-3 py-2.5">Status</th>
              <th className="w-[104px] px-3 py-2.5">Invested</th>
              <th className="w-[80px] px-3 py-2.5">Entry</th>
              <th className="w-[80px] px-3 py-2.5">Exit</th>
              <th className="w-[64px] px-3 py-2.5">Hold</th>
              <th className="w-[96px] px-3 py-2.5">
                <Link href={sortHrefs.pnl} scroll={false} className="flex items-center gap-1 transition hover:text-white">
                  P&amp;L <SortIndicator active={sortKey === "realized_pnl"} dir={sortDir} />
                </Link>
              </th>
              <th className="w-[78px] px-3 py-2.5">
                <Link href={sortHrefs.returnPct} scroll={false} className="flex items-center gap-1 transition hover:text-white">
                  Return <SortIndicator active={sortKey === "realized_pnl_percent"} dir={sortDir} />
                </Link>
              </th>
              <th className="w-[88px] px-3 py-2.5">
                <Link href={sortHrefs.grade} scroll={false} className="flex items-center gap-1 transition hover:text-white">
                  Review <SortIndicator active={sortKey === "grade"} dir={sortDir} />
                </Link>
              </th>
              <th className="w-[150px] px-3 py-2.5">Tags</th>
              <th className="w-[84px] px-3 py-2.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/6 text-[12px]">
            {trades.map((trade) => {
              const isOpen = expanded.has(trade.id);
              const hasNarrative = trade.thesis || trade.notes || trade.lessons;
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
                      <Link href={`/trades/${trade.id}`} className="whitespace-nowrap font-medium text-white transition hover:text-[#5865f2]">
                        {trade.symbol} · {trade.direction}
                      </Link>
                    </td>
                    <td className="whitespace-nowrap px-3 py-2 text-[#b5bac1]">
                      {formatDateTime(trade.opened_at)}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2 text-[#b5bac1]">
                      {trade.status}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2 text-[#b5bac1]">
                      {formatCurrency(Number(trade.entry_value))}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2 text-[#b5bac1]">
                      {formatCurrency(Number(trade.entry_price))}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2 text-[#b5bac1]">
                      {trade.exit_price == null ? "Open" : formatCurrency(Number(trade.exit_price))}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2 text-[#b5bac1]">
                      {formatHoldTime(trade.holding_minutes)}
                    </td>
                    <td className={`whitespace-nowrap px-3 py-2 font-medium ${Number(trade.realized_pnl) >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                      {trade.status === "Closed" ? formatCurrency(Number(trade.realized_pnl)) : "Open"}
                    </td>
                    <td className={`whitespace-nowrap px-3 py-2 font-medium ${Number(trade.realized_pnl_percent ?? 0) >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                      {trade.realized_pnl_percent == null ? "Open" : formatPercent(Number(trade.realized_pnl_percent))}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2">
                      <span className={`font-medium ${trade.grade ? (GRADE_CLS[trade.grade] ?? "text-[#b5bac1]") : "text-[#6d7278]"}`}>
                        {trade.grade || "--"}
                      </span>
                      {trade.confidence_rating ? (
                        <span className="text-[#6d7278]"> · {trade.confidence_rating}/5</span>
                      ) : null}
                    </td>
                    <td className="px-3 py-2 text-[#b5bac1]">
                      <div className="flex max-w-[136px] flex-wrap gap-1">
                        {trade.tags.slice(0, 2).map((tag) => (
                          <span key={tag} className="rounded-full bg-white/6 px-2 py-0.5 text-[11px] text-[#dbdee1]">{tag}</span>
                        ))}
                        {trade.mistake_tags.slice(0, 1).map((tag) => (
                          <span key={tag} className="rounded-full bg-rose-500/12 px-2 py-0.5 text-[11px] text-rose-300">{tag}</span>
                        ))}
                        {trade.tags.length === 0 && trade.mistake_tags.length === 0 && (
                          <span className="text-[11px] text-[#6d7278]">—</span>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link href={`/trades/${trade.id}/edit`} aria-label={`Edit ${trade.symbol} trade`} title="Edit trade" className="rounded-[10px] border border-white/10 bg-[#1e1f22] p-1.5 text-[#b5bac1] transition hover:border-[#5865f2]/40 hover:bg-[#16171a] hover:text-white">
                          <EditIcon />
                        </Link>
                        <form action={deleteTrade}>
                          <input type="hidden" name="tradeId" value={trade.id} />
                          <button type="submit" aria-label={`Delete ${trade.symbol} trade`} title="Delete trade" className="rounded-[10px] border border-white/10 bg-[#1e1f22] p-1.5 text-[#b5bac1] transition hover:border-rose-500/40 hover:bg-[#16171a] hover:text-rose-300">
                            <DeleteIcon />
                          </button>
                        </form>
                      </div>
                    </td>
                  </tr>
                  {isOpen && hasNarrative && (
                    <tr className="bg-[#1e1f22]/60">
                      <td colSpan={13} className="px-5 py-4">
                        <div className="grid gap-4 sm:grid-cols-3">
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
                          {trade.lessons && (
                            <div>
                              <p className="mb-1 text-[10px] font-medium uppercase tracking-[0.2em] text-[#6d7278]">Lessons</p>
                              <p className="text-[12px] leading-relaxed text-[#b5bac1]">{trade.lessons}</p>
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
