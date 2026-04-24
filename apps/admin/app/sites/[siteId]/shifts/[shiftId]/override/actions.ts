"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

type OverrideKind =
  | "force_clock_in"
  | "force_clock_out"
  | "no_show"
  | "early_release"
  | "other";

export async function submitOverride(
  siteId: string,
  shiftId: string,
  _prev: unknown,
  formData: FormData,
) {
  const kind = String(formData.get("kind") ?? "") as OverrideKind;
  const reason = String(formData.get("reason") ?? "").trim();

  if (!kind || !reason) {
    return { error: "Pick a reason code and provide a note." };
  }

  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return { error: "Not authenticated." };

  // 1. Log the override
  const { error: logError } = await supabase.from("shift_overrides").insert({
    shift_id: shiftId,
    supervisor_id: userData.user.id,
    kind,
    reason,
  });
  if (logError) return { error: logError.message };

  // 2. Apply side-effect to the shift based on kind
  const now = new Date().toISOString();
  const shiftUpdates: Record<string, unknown> = {};
  switch (kind) {
    case "force_clock_in":
      shiftUpdates.status = "clocked_in";
      shiftUpdates.actual_start = now;
      break;
    case "force_clock_out":
      shiftUpdates.status = "clocked_out";
      shiftUpdates.actual_end = now;
      break;
    case "no_show":
      shiftUpdates.status = "no_show";
      break;
    case "early_release":
      shiftUpdates.status = "clocked_out";
      shiftUpdates.actual_end = now;
      break;
  }

  if (Object.keys(shiftUpdates).length > 0) {
    const { error: updateError } = await supabase
      .from("shifts")
      .update(shiftUpdates)
      .eq("id", shiftId);
    if (updateError) return { error: updateError.message };
  }

  revalidatePath(`/sites/${siteId}`);
  redirect(`/sites/${siteId}`);
}
