"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";

// ---------------------------------------------------------------------------
// Lightweight CSV parser — no external dependency needed.
// Handles quoted fields, comma and newline delimiters.
// ---------------------------------------------------------------------------

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const next = text[i + 1];

    if (inQuotes) {
      if (ch === '"' && next === '"') {
        field += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        field += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      row.push(field.trim());
      field = "";
    } else if (ch === "\r" && next === "\n") {
      row.push(field.trim());
      rows.push(row);
      row = [];
      field = "";
      i++;
    } else if (ch === "\n" || ch === "\r") {
      row.push(field.trim());
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += ch;
    }
  }

  if (field || row.length > 0) {
    row.push(field.trim());
    rows.push(row);
  }

  return rows.filter((r) => r.some((cell) => cell !== ""));
}

function colIndex(headers: string[], ...candidates: string[]) {
  for (const name of candidates) {
    const idx = headers.findIndex(
      (h) => h.toLowerCase().replace(/[^a-z0-9]/g, "") === name.toLowerCase().replace(/[^a-z0-9]/g, ""),
    );
    if (idx !== -1) return idx;
  }
  return -1;
}

function parseNum(value: string | undefined) {
  if (!value) return null;
  const n = Number(value.replace(/[$,]/g, ""));
  return Number.isFinite(n) && n > 0 ? n : null;
}

function parsePositiveInteger(value: string | undefined) {
  if (!value) return null;
  const n = parseInt(value.replace(/,/g, ""), 10);
  return Number.isInteger(n) && n > 0 ? n : null;
}

function parseIsoDate(value: string | undefined): string | null {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

function parseDirection(value: string | undefined): "Long" | "Short" | null {
  const v = value?.trim().toLowerCase() ?? "";
  if (v === "long" || v === "buy" || v === "b") return "Long";
  if (v === "short" || v === "sell" || v === "s") return "Short";
  return null;
}

function parseTextList(value: string | undefined): string[] {
  if (!value) return [];
  return Array.from(
    new Set(
      value
        .split(/[,;|]/)
        .map((s) => s.trim().toLowerCase())
        .filter(Boolean),
    ),
  );
}

type ImportRow = {
  symbol: string;
  direction: "Long" | "Short";
  quantity: number;
  entry_price: number;
  exit_price: number | null;
  opened_at: string;
  closed_at: string | null;
  setup: string | null;
  notes: string | null;
  thesis: string | null;
  lessons: string | null;
  tags: string[];
  mistake_tags: string[];
  grade: string | null;
  confidence_rating: number | null;
  followed_plan: boolean | null;
};

type ParseResult =
  | { ok: true; rows: ImportRow[] }
  | { ok: false; error: string };

function parseCsvToRows(text: string): ParseResult {
  const allRows = parseCsv(text);
  if (allRows.length < 2) {
    return { ok: false, error: "CSV must have a header row and at least one data row." };
  }

  const headers = allRows[0].map((h) => h.toLowerCase().trim());
  const dataRows = allRows.slice(1);

  const iSymbol = colIndex(headers, "symbol", "ticker");
  const iDirection = colIndex(headers, "direction", "side", "type");
  const iQuantity = colIndex(headers, "quantity", "qty", "shares", "contracts");
  const iEntryPrice = colIndex(headers, "entryprice", "entry_price", "entry", "buyprice", "avgprice");
  const iExitPrice = colIndex(headers, "exitprice", "exit_price", "exit", "sellprice");
  const iOpenedAt = colIndex(headers, "openedat", "opened_at", "opentime", "open_time", "opendate", "tradedate", "date", "datetime", "openeddatetime");
  const iClosedAt = colIndex(headers, "closedat", "closed_at", "closetime", "close_time", "closedate", "closeddatetime");
  const iSetup = colIndex(headers, "setup", "strategy", "pattern");
  const iNotes = colIndex(headers, "notes", "note", "comment", "comments");
  const iThesis = colIndex(headers, "thesis");
  const iLessons = colIndex(headers, "lessons", "lesson");
  const iTags = colIndex(headers, "tags", "tag");
  const iMistakeTags = colIndex(headers, "mistaketags", "mistake_tags", "mistakes", "mistake");
  const iGrade = colIndex(headers, "grade");
  const iConfidence = colIndex(headers, "confidencerating", "confidence_rating", "confidence");
  const iFollowedPlan = colIndex(headers, "followedplan", "followed_plan", "plan");

  if (iSymbol === -1) {
    return { ok: false, error: 'CSV is missing a "symbol" or "ticker" column.' };
  }
  if (iDirection === -1) {
    return {
      ok: false,
      error: 'CSV is missing a "direction" column. Use Long/Short, Buy/Sell, or B/S.',
    };
  }
  if (iQuantity === -1) {
    return { ok: false, error: 'CSV is missing a "quantity", "qty", or "shares" column.' };
  }
  if (iEntryPrice === -1) {
    return { ok: false, error: 'CSV is missing an "entry_price" or "entry" column.' };
  }
  if (iOpenedAt === -1) {
    return {
      ok: false,
      error:
        'CSV is missing an "opened_at", "open_time", or "date" column.',
    };
  }

  const rows: ImportRow[] = [];
  const errors: string[] = [];

  for (let i = 0; i < dataRows.length; i++) {
    const row = dataRows[i];
    const lineNum = i + 2;
    const get = (idx: number) => (idx !== -1 ? row[idx] : undefined);

    const symbol = get(iSymbol)?.trim().toUpperCase();
    const direction = parseDirection(get(iDirection));
    const quantity = parsePositiveInteger(get(iQuantity));
    const entryPrice = parseNum(get(iEntryPrice));
    const exitPrice = parseNum(get(iExitPrice)) ?? null;
    const openedAt = parseIsoDate(get(iOpenedAt));
    const closedAt = parseIsoDate(get(iClosedAt)) ?? null;

    if (!symbol) {
      errors.push(`Row ${lineNum}: missing symbol.`);
      continue;
    }
    if (!direction) {
      errors.push(`Row ${lineNum}: invalid direction "${get(iDirection)}".`);
      continue;
    }
    if (!quantity) {
      errors.push(`Row ${lineNum}: quantity must be a positive integer.`);
      continue;
    }
    if (!entryPrice) {
      errors.push(`Row ${lineNum}: entry price must be a positive number.`);
      continue;
    }
    if (!openedAt) {
      errors.push(`Row ${lineNum}: could not parse open date/time "${get(iOpenedAt)}".`);
      continue;
    }

    const rawGrade = get(iGrade)?.trim().toUpperCase() ?? null;
    const grade =
      rawGrade && ["A", "B", "C", "D", "F"].includes(rawGrade) ? rawGrade : null;

    const rawConf = parseInt(get(iConfidence) ?? "", 10);
    const confidence_rating =
      Number.isInteger(rawConf) && rawConf >= 1 && rawConf <= 5 ? rawConf : null;

    const rawPlan = get(iFollowedPlan)?.trim().toLowerCase() ?? null;
    const followed_plan =
      rawPlan === "yes" || rawPlan === "true" || rawPlan === "1"
        ? true
        : rawPlan === "no" || rawPlan === "false" || rawPlan === "0"
          ? false
          : null;

    rows.push({
      symbol,
      direction,
      quantity,
      entry_price: entryPrice,
      exit_price: exitPrice,
      opened_at: openedAt,
      closed_at: closedAt,
      setup: get(iSetup)?.trim() || null,
      notes: get(iNotes)?.trim() || null,
      thesis: get(iThesis)?.trim() || null,
      lessons: get(iLessons)?.trim() || null,
      tags: parseTextList(get(iTags)),
      mistake_tags: parseTextList(get(iMistakeTags)),
      grade,
      confidence_rating,
      followed_plan,
    });
  }

  if (errors.length > 0) {
    return {
      ok: false,
      error: errors.slice(0, 5).join(" ") + (errors.length > 5 ? ` …and ${errors.length - 5} more errors.` : ""),
    };
  }

  if (rows.length === 0) {
    return { ok: false, error: "No valid rows found in the CSV." };
  }

  return { ok: true, rows };
}

async function requireVerifiedUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?message=Please sign in to import trades.");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("is_verified")
    .eq("id", user.id)
    .single();

  if (profileError || !profile?.is_verified) {
    redirect("/dashboard?message=Your account is not verified to import trades yet.");
  }

  return { supabase, user };
}

export async function importTrades(formData: FormData) {
  const { supabase, user } = await requireVerifiedUser();

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    redirect("/trades/import?error=Please+select+a+CSV+file.");
  }

  if (file.size > 2 * 1024 * 1024) {
    redirect("/trades/import?error=File+must+be+smaller+than+2+MB.");
  }

  const text = await file.text();
  const result = parseCsvToRows(text);

  if (!result.ok) {
    redirect(`/trades/import?error=${encodeURIComponent(result.error)}`);
  }

  const payload = result.rows.map((row) => ({ ...row, user_id: user.id }));

  const batchSize = 100;
  for (let i = 0; i < payload.length; i += batchSize) {
    const batch = payload.slice(i, i + batchSize);
    const { error } = await supabase.from("trades").insert(batch);
    if (error) {
      redirect("/trades/import?error=Import+failed.+Please+try+again.");
    }
  }

  revalidatePath("/dashboard");
  revalidatePath("/journal");
  revalidatePath("/analytics");
  revalidatePath("/playbook");

  redirect(`/journal?imported=${result.rows.length}`);
}
