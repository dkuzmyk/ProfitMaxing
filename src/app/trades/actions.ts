"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";

function revalidateTradePages() {
  revalidatePath("/dashboard");
  revalidatePath("/journal");
  revalidatePath("/analytics");
  revalidatePath("/playbook");
}

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

function parseOptionalIntegerInRange(
  value: FormDataEntryValue | null,
  min: number,
  max: number,
) {
  const raw = String(value ?? "").trim();

  if (!raw) {
    return null;
  }

  const parsed = Number.parseInt(raw, 10);

  return Number.isInteger(parsed) && parsed >= min && parsed <= max ? parsed : null;
}

function parseIsoDate(value: FormDataEntryValue | null) {
  const raw = String(value ?? "");

  if (!raw) {
    return null;
  }

  const parsed = new Date(raw);

  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

function parseTextList(value: FormDataEntryValue | null) {
  return Array.from(
    new Set(
      String(value ?? "")
        .split(/[,\n]/)
        .map((entry) => entry.trim().toLowerCase())
        .filter(Boolean),
    ),
  );
}

function parseFollowedPlan(value: FormDataEntryValue | null) {
  const raw = String(value ?? "");

  if (raw === "yes") {
    return true;
  }

  if (raw === "no") {
    return false;
  }

  return null;
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
  const thesis = String(formData.get("thesis") ?? "").trim() || null;
  const lessons = String(formData.get("lessons") ?? "").trim() || null;
  const tags = parseTextList(formData.get("tags"));
  const mistakeTags = parseTextList(formData.get("mistakeTags"));
  const followedPlan = parseFollowedPlan(formData.get("followedPlan"));
  const confidenceRating = parseOptionalIntegerInRange(
    formData.get("confidenceRating"),
    1,
    5,
  );
  const grade = String(formData.get("grade") ?? "").trim() || null;
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

  if (String(formData.get("confidenceRating") ?? "").trim() && !confidenceRating) {
    fail(target, "Confidence rating must be between 1 and 5.");
  }

  if (grade && !["A", "B", "C", "D", "F"].includes(grade)) {
    fail(target, "Grade must be A, B, C, D, or F.");
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
    thesis,
    lessons,
    tags,
    mistake_tags: mistakeTags,
    followed_plan: followedPlan,
    confidence_rating: confidenceRating,
    grade,
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

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("is_verified")
    .eq("id", user.id)
    .single();

  if (profileError) {
    const message = profileError.message.toLowerCase().includes("profiles")
      ? "Run the latest profiles migration in Supabase before writing journal data."
      : profileError.message;

    redirect(`/dashboard?message=${encodeURIComponent(message)}`);
  }

  if (!profile?.is_verified) {
    redirect(
      "/dashboard?message=Your account is not verified to write journal data yet.",
    );
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
    fail("new", "Unable to save this trade. Please try again.");
  }

  revalidateTradePages();

  if (intent === "add-another") {
    redirect("/trades/new?saved=1");
  }

  redirect("/dashboard?created=1");
}

export async function updateTrade(formData: FormData) {
  const { supabase, user } = await requireUser();
  const tradeId = String(formData.get("tradeId") ?? "");

  if (!tradeId) {
    redirect("/dashboard?message=Trade id is required.");
  }

  const payload = parseTradePayload(formData, { tradeId });

  const { data, error } = await supabase
    .from("trades")
    .update(payload)
    .eq("id", tradeId)
    .eq("user_id", user.id)
    .select("id")
    .single();

  if (error || !data) {
    fail({ tradeId }, "Unable to update this trade.");
  }

  revalidateTradePages();
  redirect("/dashboard?updated=1");
}

export async function deleteTrade(formData: FormData) {
  const { supabase, user } = await requireUser();
  const tradeId = String(formData.get("tradeId") ?? "");

  if (!tradeId) {
    redirect("/dashboard?message=Trade id is required.");
  }

  const { error } = await supabase
    .from("trades")
    .delete()
    .eq("id", tradeId)
    .eq("user_id", user.id);

  if (error) {
    redirect("/dashboard?message=Unable+to+delete+this+trade.");
  }

  revalidateTradePages();
  redirect("/dashboard?deleted=1");
}
