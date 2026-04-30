import { supabase } from "./supabase";

export type SiteRow = {
  id: string;
  name: string;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  geofence_radius_m: number;
  customer: { name: string; vertical: string } | null;
};

export type ShiftRow = {
  id: string;
  site_id: string;
  scheduled_start: string;
  scheduled_end: string;
  actual_start: string | null;
  actual_end: string | null;
  status: "scheduled" | "clocked_in" | "clocked_out" | "no_show";
};

export type TaskRow = {
  id: string;
  shift_id: string;
  site_id: string;
  template_code: string;
  target_ref: string | null;
  status: "assigned" | "in_progress" | "done" | "blocked" | "skipped";
  started_at: string | null;
  completed_at: string | null;
  notes: string | null;
  photo_url: string | null;
  template: {
    label: string;
    expected_minutes: number;
    requires_scan: boolean;
    requires_photo: boolean;
    billing_unit: string | null;
  } | null;
};

export type ScanCodeRow = {
  id: string;
  site_id: string;
  code: string;
  entity_kind: string;
  entity_ref: string;
};

/** Sites the current user can access via user_roles (RLS enforces). */
export async function fetchAccessibleSites(): Promise<SiteRow[]> {
  const { data, error } = await supabase
    .from("sites")
    .select("id, name, address, latitude, longitude, geofence_radius_m, customer:customers(name, vertical)")
    .order("name");

  if (error) throw error;
  return (data ?? []) as unknown as SiteRow[];
}

export async function fetchSite(siteId: string): Promise<SiteRow | null> {
  const { data, error } = await supabase
    .from("sites")
    .select("id, name, address, latitude, longitude, geofence_radius_m, customer:customers(name, vertical)")
    .eq("id", siteId)
    .maybeSingle();

  if (error) throw error;
  return (data as unknown as SiteRow) ?? null;
}

/** Today's shift for current user at a site, if any. */
export async function fetchTodaysShift(siteId: string): Promise<ShiftRow | null> {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("shifts")
    .select("id, site_id, scheduled_start, scheduled_end, actual_start, actual_end, status")
    .eq("site_id", siteId)
    .eq("worker_id", user.id)
    .gte("scheduled_start", startOfDay.toISOString())
    .lte("scheduled_start", endOfDay.toISOString())
    .order("scheduled_start", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return (data as unknown as ShiftRow) ?? null;
}

export async function clockIn(
  shiftId: string,
  lat: number,
  lng: number,
): Promise<void> {
  const { error } = await supabase
    .from("shifts")
    .update({
      status: "clocked_in",
      actual_start: new Date().toISOString(),
      clock_in_lat: lat,
      clock_in_lng: lng,
    })
    .eq("id", shiftId);
  if (error) throw error;
}

export async function clockOut(shiftId: string): Promise<void> {
  const { error } = await supabase
    .from("shifts")
    .update({
      status: "clocked_out",
      actual_end: new Date().toISOString(),
    })
    .eq("id", shiftId);
  if (error) throw error;
}

export async function fetchShiftTasks(shiftId: string): Promise<TaskRow[]> {
  const { data, error } = await supabase
    .from("tasks")
    .select(
      "id, shift_id, site_id, template_code, target_ref, status, started_at, completed_at, notes, photo_url, template:task_templates(label, expected_minutes, requires_scan, requires_photo, billing_unit)",
    )
    .eq("shift_id", shiftId)
    .order("created_at");

  if (error) throw error;
  return (data ?? []) as unknown as TaskRow[];
}

export async function fetchTask(taskId: string): Promise<TaskRow | null> {
  const { data, error } = await supabase
    .from("tasks")
    .select(
      "id, shift_id, site_id, template_code, target_ref, status, started_at, completed_at, notes, photo_url, template:task_templates(label, expected_minutes, requires_scan, requires_photo, billing_unit)",
    )
    .eq("id", taskId)
    .maybeSingle();

  if (error) throw error;
  return (data as unknown as TaskRow) ?? null;
}

export async function startTask(taskId: string, scannedCode?: string): Promise<void> {
  const now = new Date().toISOString();
  const { error } = await supabase
    .from("tasks")
    .update({
      status: "in_progress",
      started_at: now,
      ...(scannedCode ? { target_ref: scannedCode } : {}),
    })
    .eq("id", taskId);
  if (error) throw error;

  await logTaskEvent(taskId, "started", scannedCode ? { code: scannedCode } : {});
}

export async function completeTask(
  taskId: string,
  opts: { notes?: string; scannedCode?: string; photoUrl?: string } = {},
): Promise<void> {
  const now = new Date().toISOString();
  const { error } = await supabase
    .from("tasks")
    .update({
      status: "done",
      completed_at: now,
      ...(opts.notes ? { notes: opts.notes } : {}),
      ...(opts.photoUrl ? { photo_url: opts.photoUrl } : {}),
    })
    .eq("id", taskId);
  if (error) throw error;

  await logTaskEvent(taskId, "completed", {
    ...(opts.scannedCode ? { code: opts.scannedCode } : {}),
    ...(opts.notes ? { notes: opts.notes } : {}),
    ...(opts.photoUrl ? { photo_url: opts.photoUrl } : {}),
  });
}

export async function createIncident(opts: {
  siteId: string;
  category: string;
  severity: "low" | "medium" | "high";
  description?: string;
  photoUrl?: string;
}): Promise<void> {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error("Not signed in.");

  const { error } = await supabase.from("incidents").insert({
    site_id: opts.siteId,
    reporter_id: user.user.id,
    category: opts.category,
    severity: opts.severity,
    description: opts.description ?? null,
    photo_url: opts.photoUrl ?? null,
  });
  if (error) throw error;
}

export async function blockTask(taskId: string, reason: string): Promise<void> {
  const { error } = await supabase
    .from("tasks")
    .update({ status: "blocked", notes: reason })
    .eq("id", taskId);
  if (error) throw error;
  await logTaskEvent(taskId, "blocked", { reason });
}

async function logTaskEvent(
  taskId: string,
  eventType: string,
  payload: Record<string, unknown>,
): Promise<void> {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) return;
  await supabase.from("task_events").insert({
    task_id: taskId,
    actor_id: user.user.id,
    event_type: eventType,
    payload,
  });
}

export async function resolveScanCode(
  siteId: string,
  code: string,
): Promise<ScanCodeRow | null> {
  const { data, error } = await supabase
    .from("scan_codes")
    .select("id, site_id, code, entity_kind, entity_ref")
    .eq("site_id", siteId)
    .eq("code", code)
    .maybeSingle();

  if (error) throw error;
  return (data as unknown as ScanCodeRow) ?? null;
}

/** Haversine distance in meters. */
export function distanceMeters(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const R = 6371000;
  const toRad = (v: number) => (v * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(Math.max(0, Math.min(1, a))));
}
