import { NextRequest, NextResponse } from "next/server";
import { getDemoMetrics } from "@/lib/demo-data";
import { normalizeTradeRange } from "@/lib/trade-metrics";

function csvEscape(value: string | number | boolean | null | undefined): string {
  if (value == null) return "";
  const str = String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function row(cells: (string | number | boolean | null | undefined)[]): string {
  return cells.map(csvEscape).join(",");
}

export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;
  const selectedRange = normalizeTradeRange(sp.get("range") ?? undefined);
  const baseTrades = getDemoMetrics(selectedRange).trades;

  const symbolFilter = sp.get("symbol")?.trim().toUpperCase() ?? "";
  const setupFilter = sp.get("setup")?.trim().toLowerCase() ?? "";
  const directionFilter = sp.get("direction") === "Long" || sp.get("direction") === "Short" ? sp.get("direction")! : "";
  const followedPlanRaw = sp.get("followedPlan");
  const followedPlanFilter = followedPlanRaw === "yes" || followedPlanRaw === "no" ? followedPlanRaw : "";
  const tagFilter = sp.get("tag")?.trim().toLowerCase() ?? "";
  const mistakeFilter = sp.get("mistake")?.trim().toLowerCase() ?? "";
  const gradeFilter = ["A", "B", "C", "D", "F"].includes(sp.get("grade") ?? "") ? sp.get("grade")! : "";

  const filtered = baseTrades.filter((trade) => {
    if (symbolFilter && !trade.symbol.startsWith(symbolFilter)) return false;
    if (setupFilter && !trade.setup.toLowerCase().includes(setupFilter)) return false;
    if (directionFilter && trade.direction !== directionFilter) return false;
    if (followedPlanFilter && trade.followedPlan !== (followedPlanFilter === "yes")) return false;
    if (tagFilter && !trade.tags.some((t) => t === tagFilter)) return false;
    if (mistakeFilter && !trade.mistakes.some((m) => m.toLowerCase() === mistakeFilter)) return false;
    if (gradeFilter && trade.grade !== gradeFilter) return false;
    return true;
  });

  const header = row([
    "Symbol", "Direction", "Opened At", "Closed At",
    "Entry Price", "Exit Price", "Quantity",
    "Realized P&L", "Return %", "Hold (min)",
    "Grade", "Confidence", "Setup", "Tags", "Mistakes",
  ]);

  const lines = filtered.map((t) => {
    const holdingMinutes = Math.round(
      (new Date(t.closedAt).getTime() - new Date(t.openedAt).getTime()) / 60000,
    );
    return row([
      t.symbol,
      t.direction,
      t.openedAt,
      t.closedAt,
      t.entryPrice,
      t.exitPrice,
      t.quantity,
      t.pnl.toFixed(2),
      (t.pnlPercent / 100).toFixed(4),
      holdingMinutes,
      t.grade,
      t.confidenceRating,
      t.setup,
      t.tags.join("; "),
      t.mistakes.join("; "),
    ]);
  });

  const csv = [header, ...lines].join("\n");

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="demo-journal-${selectedRange}.csv"`,
    },
  });
}
