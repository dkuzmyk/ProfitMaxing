"use server";

import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

function buildNewTradeRedirect(message: string) {
  return `/trades/new?message=${encodeURIComponent(message)}`;
}

function buildEditTradeRedirect(tradeId: string, message: string) {
  return `/trades/${tradeId}/edit?message=${encodeURIComponent(message)}`;
}

function parsePositiveNumber(value: FormDataEntryValue | null) {
  const parsed = Number(value);

  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function parsePositiveInteger(value: FormDataEntryValue | null) {
  const parsed = Number.parseInt(String(value ?? ""), 10);

  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

function parseIsoDate(value: FormDataEntryValue | null) {
  const raw = String(value ?? "");

  if (!raw) {
    return null;
  }

  const parsed = new Date(raw);

  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

type RedirectTarget = "new" | { tradeId: string };

function fail(target: RedirectTarget, message: string): never {
  if (target === "new") {
    redirect(buildNewTradeRedirect(message));
  }

  redirect(buildEditTradeRedirect(target.tradeId, message));
}

function parseTradePayload(formData: FormData, target: RedirectTarget) {
  const symbol = String(formData.get("symbol") ?? "")
    .trim()
    .toUpperCase();
  const setup = String(formData.get("setup") ?? "").trim() || null;
  const direction = String(formData.get("direction") ?? "");
  const quantity = parsePositiveInteger(formData.get("quantity"));
  const entryPrice = parsePositiveNumber(formData.get("entryPrice"));
  const openedAt = parseIsoDate(formData.get("openedAt"));
  const notes = String(formData.get("notes") ?? "").trim() || null;
  const isClosed = formData.get("isClosed") === "on";

  if (!symbol) {
    fail(target, "Symbol is required.");
  }

  if (direction !== "Long" && direction !== "Short") {
    fail(target, "Direction must be Long or Short.");
  }

  if (!quantity) {
    fail(target, "Quantity must be a positive whole number.");
  }

  if (!entryPrice) {
    fail(target, "Entry price must be greater than zero.");
  }

  if (!openedAt) {
    fail(target, "Open time is required.");
  }

  let exitPrice: number | null = null;
  let closedAt: string | null = null;

  if (isClosed) {
    exitPrice = parsePositiveNumber(formData.get("exitPrice"));
    closedAt = parseIsoDate(formData.get("closedAt"));

    if (!exitPrice) {
      fail(target, "Exit price is required for closed trades.");
    }

    if (!closedAt) {
      fail(target, "Close time is required for closed trades.");
    }
  }

  return {
    symbol,
    setup,
    direction,
    quantity,
    entry_price: entryPrice,
    exit_price: exitPrice,
    opened_at: openedAt,
    closed_at: closedAt,
    notes,
  };
}

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?message=Please sign in to manage real trades.");
  }

  return { supabase, user };
}

export async function createTrade(formData: FormData) {
  const { supabase, user } = await requireUser();
  const payload = parseTradePayload(formData, "new");
  const intent = String(formData.get("intent") ?? "dashboard");

  const { error } = await supabase.from("trades").insert({
    user_id: user.id,
    ...payload,
  });

  if (error) {
    fail("new", error.message);
  }

  if (intent === "add-another") {
    redirect("/trades/new?saved=1");
  }

  redirect("/dashboard?created=1");
}

export async function updateTrade(formData: FormData) {
  const { supabase } = await requireUser();
  const tradeId = String(formData.get("tradeId") ?? "");

  if (!tradeId) {
    redirect("/dashboard?message=Trade id is required.");
  }

  const payload = parseTradePayload(formData, { tradeId });

  const { data, error } = await supabase
    .from("trades")
    .update(payload)
    .eq("id", tradeId)
    .select("id")
    .single();

  if (error || !data) {
    fail({ tradeId }, error?.message ?? "Unable to update this trade.");
  }

  redirect("/dashboard?updated=1");
}

export async function deleteTrade(formData: FormData) {
  const { supabase } = await requireUser();
  const tradeId = String(formData.get("tradeId") ?? "");

  if (!tradeId) {
    redirect("/dashboard?message=Trade id is required.");
  }

  const { error } = await supabase
    .from("trades")
    .delete()
    .eq("id", tradeId);

  if (error) {
    redirect(`/dashboard?message=${encodeURIComponent(error.message)}`);
  }

  redirect("/dashboard?deleted=1");
}
