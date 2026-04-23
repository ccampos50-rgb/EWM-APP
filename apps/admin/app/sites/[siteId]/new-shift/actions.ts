"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function createShiftWithTasks(
  siteId: string,
  _prev: unknown,
  formData: FormData,
) {
  const workerId = String(formData.get("worker_id") ?? "");
  const startTime = String(formData.get("start_time") ?? "");
  const endTime = String(formData.get("end_time") ?? "");
  const templateCodes = formData.getAll("template_codes").map(String);

  if (!workerId || !startTime || !endTime) {
    return { error: "Worker, start, and end times are required." };
  }
  if (templateCodes.length === 0) {
    return { error: "Select at least one task template." };
  }

  const supabase = await createClient();

  const today = new Date();
  const [startH, startM] = startTime.split(":").map(Number);
  const [endH, endM] = endTime.split(":").map(Number);
  const scheduledStart = new Date(today);
  scheduledStart.setHours(startH ?? 0, startM ?? 0, 0, 0);
  const scheduledEnd = new Date(today);
  scheduledEnd.setHours(endH ?? 0, endM ?? 0, 0, 0);

  const { data: shift, error: shiftError } = await supabase
    .from("shifts")
    .insert({
      worker_id: workerId,
      site_id: siteId,
      scheduled_start: scheduledStart.toISOString(),
      scheduled_end: scheduledEnd.toISOString(),
      status: "scheduled",
    })
    .select("id")
    .single();

  if (shiftError || !shift) {
    return { error: shiftError?.message ?? "Failed to create shift." };
  }

  const tasksToInsert = templateCodes.map((code) => ({
    shift_id: shift.id,
    site_id: siteId,
    template_code: code,
    status: "assigned" as const,
  }));

  const { error: tasksError } = await supabase.from("tasks").insert(tasksToInsert);
  if (tasksError) {
    return { error: `Shift created but task insert failed: ${tasksError.message}` };
  }

  redirect(`/sites/${siteId}`);
}
