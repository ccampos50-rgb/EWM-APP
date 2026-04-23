"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function reassignTask(
  siteId: string,
  taskId: string,
  _prev: unknown,
  formData: FormData,
) {
  const newShiftId = String(formData.get("shift_id") ?? "");
  if (!newShiftId) return { error: "Select a destination shift." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("tasks")
    .update({ shift_id: newShiftId })
    .eq("id", taskId);

  if (error) return { error: error.message };

  redirect(`/sites/${siteId}`);
}
