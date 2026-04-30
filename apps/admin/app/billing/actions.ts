"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

type State = { error?: string; ok?: boolean } | null;

export async function addCustomerRate(
  customerId: string,
  _prev: State,
  formData: FormData,
): Promise<State> {
  const unitType = String(formData.get("unit_type") ?? "").trim();
  const rateCode = String(formData.get("rate_code") ?? "standard").trim();
  const dollarsStr = String(formData.get("unit_price") ?? "").trim();
  const effectiveFrom = String(formData.get("effective_from") ?? "").trim();

  if (!unitType) return { error: "Unit type is required (e.g. room, bed, vehicle)." };
  if (!rateCode) return { error: "Rate code is required." };
  const dollars = Number(dollarsStr);
  if (Number.isNaN(dollars) || dollars < 0) return { error: "Price must be a non-negative number." };
  const cents = Math.round(dollars * 100);

  const supabase = await createClient();
  const insertRow: Record<string, unknown> = {
    customer_id: customerId,
    unit_type: unitType,
    rate_code: rateCode,
    unit_price_cents: cents,
  };
  if (effectiveFrom) insertRow.effective_from = effectiveFrom;

  const { error } = await supabase.from("customer_rates").insert(insertRow);
  if (error) return { error: error.message };
  revalidatePath(`/billing/${customerId}`);
  revalidatePath("/billing");
  return { ok: true };
}

export async function endCustomerRate(rateId: string, customerId: string) {
  const supabase = await createClient();
  const today = new Date().toISOString().slice(0, 10);
  const { error } = await supabase
    .from("customer_rates")
    .update({ effective_to: today })
    .eq("id", rateId);
  if (error) throw new Error(error.message);
  revalidatePath(`/billing/${customerId}`);
  revalidatePath("/billing");
}
