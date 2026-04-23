import { createClient } from "./supabase/server";

export type AdminSiteRow = {
  id: string;
  name: string;
  address: string | null;
  customer_id: string;
  site_qr_code: string;
  customer: { name: string; vertical: string } | null;
};

export type AdminShiftRow = {
  id: string;
  worker_id: string;
  site_id: string;
  scheduled_start: string;
  scheduled_end: string;
  actual_start: string | null;
  actual_end: string | null;
  status: "scheduled" | "clocked_in" | "clocked_out" | "no_show";
  worker: { full_name: string; email: string | null } | null;
};

export type AdminTaskRow = {
  id: string;
  shift_id: string;
  template_code: string;
  target_ref: string | null;
  status: "assigned" | "in_progress" | "done" | "blocked" | "skipped";
  started_at: string | null;
  completed_at: string | null;
  template: { label: string; expected_minutes: number } | null;
};

export async function fetchSites(): Promise<AdminSiteRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("sites")
    .select("id, name, address, customer_id, site_qr_code, customer:customers(name, vertical)")
    .order("name");
  if (error) throw error;
  return (data ?? []) as unknown as AdminSiteRow[];
}

export async function fetchSite(siteId: string): Promise<AdminSiteRow | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("sites")
    .select("id, name, address, customer_id, site_qr_code, customer:customers(name, vertical)")
    .eq("id", siteId)
    .maybeSingle();
  if (error) throw error;
  return (data as unknown as AdminSiteRow) ?? null;
}

export async function fetchTodaysShiftsForSite(siteId: string): Promise<AdminShiftRow[]> {
  const supabase = await createClient();
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);

  const { data, error } = await supabase
    .from("shifts")
    .select(
      "id, worker_id, site_id, scheduled_start, scheduled_end, actual_start, actual_end, status, worker:profiles!shifts_worker_id_fkey(full_name, email)",
    )
    .eq("site_id", siteId)
    .gte("scheduled_start", startOfDay.toISOString())
    .lte("scheduled_start", endOfDay.toISOString())
    .order("scheduled_start");

  if (error) throw error;
  return (data ?? []) as unknown as AdminShiftRow[];
}

export async function fetchShiftTasks(shiftId: string): Promise<AdminTaskRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tasks")
    .select(
      "id, shift_id, template_code, target_ref, status, started_at, completed_at, template:task_templates(label, expected_minutes)",
    )
    .eq("shift_id", shiftId)
    .order("created_at");
  if (error) throw error;
  return (data ?? []) as unknown as AdminTaskRow[];
}

export type WorkerRow = {
  id: string;
  full_name: string;
  email: string | null;
};

export async function fetchWorkers(tenantId: string): Promise<WorkerRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, email")
    .eq("tenant_id", tenantId)
    .order("full_name");
  if (error) throw error;
  return (data ?? []) as WorkerRow[];
}

export type TemplateRow = {
  code: string;
  vertical: string;
  label: string;
  expected_minutes: number;
  requires_scan: boolean;
  billing_unit: string | null;
};

export async function fetchTemplatesForVertical(vertical: string): Promise<TemplateRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("task_templates")
    .select("code, vertical, label, expected_minutes, requires_scan, billing_unit")
    .eq("vertical", vertical)
    .order("label");
  if (error) throw error;
  return (data ?? []) as TemplateRow[];
}
