"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

type State = { error?: string; ok?: boolean } | null;

// Sunday → Saturday week containing the given date (FLSA workweek default)
function weekBounds(dateIso: string): { starts_on: string; ends_on: string } {
  const d = new Date(dateIso + "T00:00:00Z");
  const dow = d.getUTCDay(); // 0 = Sun
  const start = new Date(d);
  start.setUTCDate(d.getUTCDate() - dow);
  const end = new Date(start);
  end.setUTCDate(start.getUTCDate() + 6);
  return { starts_on: start.toISOString().slice(0, 10), ends_on: end.toISOString().slice(0, 10) };
}

export async function createWeeklyPeriod(_prev: State, formData: FormData): Promise<State> {
  const dateIso = String(formData.get("week_of") ?? "").trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateIso)) return { error: "Pick a date." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };
  const { data: profile } = await supabase
    .from("profiles")
    .select("tenant_id")
    .eq("id", user.id)
    .maybeSingle();
  if (!profile) return { error: "Couldn't load tenant." };

  const { starts_on, ends_on } = weekBounds(dateIso);
  const { data, error } = await supabase
    .from("pay_periods")
    .insert({ tenant_id: profile.tenant_id, starts_on, ends_on, status: "open" })
    .select("id")
    .single();
  if (error) return { error: error.message };
  redirect(`/payroll/${data.id}`);
}

export async function lockPeriod(periodId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in.");
  const { error } = await supabase
    .from("pay_periods")
    .update({ status: "locked", locked_at: new Date().toISOString(), locked_by: user.id })
    .eq("id", periodId)
    .eq("status", "open");
  if (error) throw new Error(error.message);
  revalidatePath(`/payroll/${periodId}`);
  revalidatePath("/payroll");
}

export async function reopenPeriod(periodId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("pay_periods")
    .update({ status: "open", locked_at: null, locked_by: null, paid_at: null, paid_by: null, paid_note: null })
    .eq("id", periodId);
  if (error) throw new Error(error.message);
  revalidatePath(`/payroll/${periodId}`);
  revalidatePath("/payroll");
}

export async function markPaid(
  periodId: string,
  _prev: State,
  formData: FormData,
): Promise<State> {
  const note = String(formData.get("paid_note") ?? "").trim() || null;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };
  const { error } = await supabase
    .from("pay_periods")
    .update({ status: "paid", paid_at: new Date().toISOString(), paid_by: user.id, paid_note: note })
    .eq("id", periodId)
    .in("status", ["open", "locked"]);
  if (error) return { error: error.message };
  revalidatePath(`/payroll/${periodId}`);
  revalidatePath("/payroll");
  return { ok: true };
}

export async function setWorkerWage(
  workerId: string,
  _prev: State,
  formData: FormData,
): Promise<State> {
  const dollarsStr = String(formData.get("hourly_rate") ?? "").trim();
  const effectiveFrom = String(formData.get("effective_from") ?? "").trim();

  const dollars = Number(dollarsStr);
  if (Number.isNaN(dollars) || dollars < 0) return { error: "Enter a non-negative number." };
  const cents = Math.round(dollars * 100);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  const today = new Date().toISOString().slice(0, 10);
  const newFrom = /^\d{4}-\d{2}-\d{2}$/.test(effectiveFrom) ? effectiveFrom : today;

  // End any currently-open wage as of the day before the new one starts
  const dayBefore = new Date(newFrom + "T00:00:00Z");
  dayBefore.setUTCDate(dayBefore.getUTCDate() - 1);
  const endIso = dayBefore.toISOString().slice(0, 10);

  await supabase
    .from("worker_wages")
    .update({ effective_to: endIso })
    .eq("profile_id", workerId)
    .is("effective_to", null);

  const { error } = await supabase.from("worker_wages").insert({
    profile_id: workerId,
    hourly_rate_cents: cents,
    effective_from: newFrom,
    created_by: user.id,
  });
  if (error) return { error: error.message };

  revalidatePath(`/workers/${workerId}`);
  return { ok: true };
}
