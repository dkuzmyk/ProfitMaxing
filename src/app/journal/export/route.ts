import { NextRequest, NextResponse } from "next/server";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getTradeRangeCutoff, normalizeTradeRange } from "@/lib/trade-metrics";

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
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?message=Please sign in.");
  }

  const sp = request.nextUrl.searchParams;
  const selectedRange = normalizeTradeRange(sp.get("range") ?? undefined);
  const rangeCutoff = getTradeRangeCutoff(selectedRange);
  const rangeCutoffDate = rangeCutoff?.toISOString().slice(0, 10);
  const symbolFilter = sp.get("symbol")?.trim().toUpperCase() ?? "";
  const setupFilter = sp.get("setup")?.trim() ?? "";
  const statusFilter = sp.get("status") === "Open" || sp.get("status") === "Closed" ? sp.get("status")! : "";
  const directionFilter = sp.get("direction") === "Long" || sp.get("direction") === "Short" ? sp.get("direction")! : "";
  const followedPlanRaw = sp.get("followedPlan");
  const followedPlanFilter = followedPlanRaw === "yes" || followedPlanRaw === "no" ? followedPlanRaw : "";
  const tagFilter = sp.get("tag")?.trim().toLowerCase() ?? "";
  const mistakeFilter = sp.get("mistake")?.trim().toLowerCase() ?? "";
  const gradeFilter = ["A", "B", "C", "D", "F"].includes(sp.get("grade") ?? "") ? sp.get("grade")! : "";

  let query = supabase
    .from("trades")
    .select(
      "symbol, direction, opened_at, closed_at, entry_price, exit_price, quantity, realized_pnl, realized_pnl_percent, grade, setup, tags, mistake_tags, holding_minutes",
    )
    .order("trade_date", { ascending: false })
    .order("opened_at", { ascending: false });

  if (rangeCutoffDate) query = query.gte("trade_date", rangeCutoffDate);
  if (symbolFilter) query = query.ilike("symbol", `${symbolFilter}%`);
  if (setupFilter) query = query.ilike("setup", `%${setupFilter}%`);
  if (statusFilter) query = query.eq("status", statusFilter);
  if (directionFilter) query = query.eq("direction", directionFilter);
  if (followedPlanFilter) query = query.eq("followed_plan", followedPlanFilter === "yes");
  if (tagFilter) query = query.contains("tags", [tagFilter]);
  if (mistakeFilter) query = query.contains("mistake_tags", [mistakeFilter]);
  if (gradeFilter) query = query.eq("grade", gradeFilter);

  const { data, error } = await query;

  if (error || !data) {
    return new NextResponse("Export failed", { status: 500 });
  }

  const header = row([
    "Symbol", "Direction", "Opened At", "Closed At",
    "Entry Price", "Exit Price", "Quantity",
    "Realized P&L", "Return %", "Hold (min)",
    "Grade", "Setup", "Tags", "Mistake Tags",
  ]);

  const lines = data.map((t) =>
    row([
      t.symbol,
      t.direction,
      t.opened_at,
      t.closed_at,
      t.entry_price,
      t.exit_price,
      t.quantity,
      t.realized_pnl,
      t.realized_pnl_percent,
      t.holding_minutes,
      t.grade,
      t.setup,
      (t.tags ?? []).join("; "),
      (t.mistake_tags ?? []).join("; "),
    ]),
  );

  const csv = [header, ...lines].join("\n");

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="journal-${selectedRange}.csv"`,
    },
  });
}
