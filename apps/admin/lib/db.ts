import { createClient } from "./supabase/server";

export type AdminSiteRow = {
  id: string;
  name: string;
  address: string | null;
  customer_id: string;
  site_qr_code: string;
  latitude: number | null;
  longitude: number | null;
  geofence_radius_m: number;
  timezone: string;
  customer: { name: string; vertical: string } | null;
};

export type CustomerRow = {
  id: string;
  name: string;
  vertical: "hospitality" | "healthcare" | "mobility" | "light_industrial";
  tenant_id: string;
};

export type SiteWorkerRow = {
  id: string;
  full_name: string;
  email: string | null;
  preferred_language: string;
  user_role_id: string;
  role: "super_admin" | "rvp" | "area_manager" | "site_manager" | "worker";
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
  site_id: string;
  template_code: string;
  target_ref: string | null;
  status: "assigned" | "in_progress" | "done" | "blocked" | "skipped";
  started_at: string | null;
  completed_at: string | null;
  duration_seconds: number | null;
  photo_url: string | null;
  notes: string | null;
  template: { label: string; expected_minutes: number; requires_photo?: boolean } | null;
};

export async function fetchSites(): Promise<AdminSiteRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("sites")
    .select(
      "id, name, address, customer_id, site_qr_code, latitude, longitude, geofence_radius_m, timezone, customer:customers(name, vertical)",
    )
    .order("name");
  if (error) throw error;
  return (data ?? []) as unknown as AdminSiteRow[];
}

export async function fetchSite(siteId: string): Promise<AdminSiteRow | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("sites")
    .select(
      "id, name, address, customer_id, site_qr_code, latitude, longitude, geofence_radius_m, timezone, customer:customers(name, vertical)",
    )
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
      "id, shift_id, site_id, template_code, target_ref, status, started_at, completed_at, duration_seconds, photo_url, notes, template:task_templates(label, expected_minutes, requires_photo)",
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

export async function fetchCustomers(): Promise<CustomerRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("customers")
    .select("id, name, vertical, tenant_id")
    .order("name");
  if (error) throw error;
  return (data ?? []) as CustomerRow[];
}

export async function fetchWorkersForSite(siteId: string): Promise<SiteWorkerRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("user_roles")
    .select(
      "id, role, profile:profiles!user_roles_profile_id_fkey(id, full_name, email, preferred_language)",
    )
    .eq("scope_site_id", siteId)
    .order("created_at");
  if (error) throw error;
  // Flatten + dedupe (a profile can have multiple role rows; show the highest-privilege)
  const roleRank: Record<SiteWorkerRow["role"], number> = {
    super_admin: 5, rvp: 4, area_manager: 3, site_manager: 2, worker: 1,
  };
  const rows = (data ?? []) as unknown as Array<{
    id: string;
    role: SiteWorkerRow["role"];
    profile: { id: string; full_name: string; email: string | null; preferred_language: string } | null;
  }>;
  const byProfile = new Map<string, SiteWorkerRow>();
  for (const r of rows) {
    if (!r.profile) continue;
    const existing = byProfile.get(r.profile.id);
    if (!existing || roleRank[r.role] > roleRank[existing.role]) {
      byProfile.set(r.profile.id, {
        id: r.profile.id,
        full_name: r.profile.full_name,
        email: r.profile.email,
        preferred_language: r.profile.preferred_language,
        user_role_id: r.id,
        role: r.role,
      });
    }
  }
  return Array.from(byProfile.values()).sort((a, b) => a.full_name.localeCompare(b.full_name));
}

// ─── Billing ───────────────────────────────────────────────────────────────

export type CustomerRateRow = {
  id: string;
  customer_id: string;
  unit_type: string;
  rate_code: string;
  unit_price_cents: number;
  effective_from: string;
  effective_to: string | null;
};

export type BillingLineRow = {
  id: string;
  customer_id: string;
  site_id: string | null;
  bill_date: string;
  unit_type: string;
  rate_code: string | null;
  unit_count: number;
  unit_price_cents: number | null;
  amount_cents: number | null;
  site: { name: string } | null;
};

export async function fetchCustomerRates(customerId: string): Promise<CustomerRateRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("customer_rates")
    .select("id, customer_id, unit_type, rate_code, unit_price_cents, effective_from, effective_to")
    .eq("customer_id", customerId)
    .order("effective_from", { ascending: false });
  if (error) throw error;
  return (data ?? []) as CustomerRateRow[];
}

export async function fetchBillingLinesForMonth(
  customerId: string,
  monthIso: string, // YYYY-MM
): Promise<BillingLineRow[]> {
  const supabase = await createClient();
  const start = `${monthIso}-01`;
  const [yy, mm] = monthIso.split("-").map(Number);
  const nextMonthDate = new Date(Date.UTC(yy, mm, 1));
  const end = nextMonthDate.toISOString().slice(0, 10);

  const { data, error } = await supabase
    .from("billing_lines")
    .select(
      "id, customer_id, site_id, bill_date, unit_type, rate_code, unit_count, unit_price_cents, amount_cents, site:sites(name)",
    )
    .eq("customer_id", customerId)
    .gte("bill_date", start)
    .lt("bill_date", end)
    .order("bill_date");
  if (error) throw error;
  return (data ?? []) as unknown as BillingLineRow[];
}

// ─── Payroll ───────────────────────────────────────────────────────────────

export type PayPeriodRow = {
  id: string;
  tenant_id: string;
  starts_on: string;
  ends_on: string;
  status: "open" | "locked" | "paid";
  locked_at: string | null;
  paid_at: string | null;
  paid_note: string | null;
};

export type PayrollLine = {
  worker_id: string;
  worker_name: string;
  email: string | null;
  hours_regular: number;
  hours_overtime: number;
  hours_total: number;
  rate_cents: number;
  gross_cents: number;
};

export async function fetchPayPeriods(tenantId: string): Promise<PayPeriodRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("pay_periods")
    .select("id, tenant_id, starts_on, ends_on, status, locked_at, paid_at, paid_note")
    .eq("tenant_id", tenantId)
    .order("starts_on", { ascending: false });
  if (error) throw error;
  return (data ?? []) as PayPeriodRow[];
}

export async function fetchPayPeriod(periodId: string): Promise<PayPeriodRow | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("pay_periods")
    .select("id, tenant_id, starts_on, ends_on, status, locked_at, paid_at, paid_note")
    .eq("id", periodId)
    .maybeSingle();
  if (error) throw error;
  return (data as PayPeriodRow) ?? null;
}

// Return the wage in effect on a given date for each profile_id passed in.
export async function fetchWagesAt(
  profileIds: string[],
  asOf: string,
): Promise<Map<string, number>> {
  if (profileIds.length === 0) return new Map();
  const supabase = await createClient();
  const { data } = await supabase
    .from("worker_wages")
    .select("profile_id, hourly_rate_cents, effective_from, effective_to")
    .in("profile_id", profileIds)
    .lte("effective_from", asOf)
    .or(`effective_to.is.null,effective_to.gte.${asOf}`)
    .order("effective_from", { ascending: false });

  const out = new Map<string, number>();
  for (const row of data ?? []) {
    if (!out.has(row.profile_id)) out.set(row.profile_id, row.hourly_rate_cents);
  }
  return out;
}

// FLSA-style payroll: per-worker hours bucketed regular vs OT (>40h in the period),
// multiplied by the wage in effect at period end.
export async function computePayrollLines(period: PayPeriodRow): Promise<PayrollLine[]> {
  const supabase = await createClient();
  const startIso = `${period.starts_on}T00:00:00Z`;
  const endIso = `${period.ends_on}T23:59:59Z`;

  const { data: shifts } = await supabase
    .from("shifts")
    .select(
      "worker_id, actual_start, actual_end, worker:profiles!shifts_worker_id_fkey(full_name, email, tenant_id)",
    )
    .gte("scheduled_start", startIso)
    .lte("scheduled_start", endIso)
    .not("actual_start", "is", null);

  const rows = (shifts ?? []) as unknown as Array<{
    worker_id: string;
    actual_start: string | null;
    actual_end: string | null;
    worker: { full_name: string; email: string | null; tenant_id: string } | null;
  }>;

  const now = Date.now();
  const hoursByWorker = new Map<
    string,
    { name: string; email: string | null; hours: number }
  >();
  for (const s of rows) {
    if (!s.actual_start) continue;
    const end = s.actual_end ? new Date(s.actual_end).getTime() : now;
    const hrs = (end - new Date(s.actual_start).getTime()) / 3600000;
    if (hrs <= 0) continue;
    const cur = hoursByWorker.get(s.worker_id) ?? {
      name: s.worker?.full_name ?? "—",
      email: s.worker?.email ?? null,
      hours: 0,
    };
    cur.hours += hrs;
    hoursByWorker.set(s.worker_id, cur);
  }

  const wages = await fetchWagesAt(Array.from(hoursByWorker.keys()), period.ends_on);

  const out: PayrollLine[] = [];
  for (const [workerId, row] of hoursByWorker) {
    const regular = Math.min(40, row.hours);
    const overtime = Math.max(0, row.hours - 40);
    const rateCents = wages.get(workerId) ?? 0;
    // FLSA: OT paid at 1.5× regular rate
    const grossCents = Math.round(regular * rateCents + overtime * rateCents * 1.5);
    out.push({
      worker_id: workerId,
      worker_name: row.name,
      email: row.email,
      hours_regular: regular,
      hours_overtime: overtime,
      hours_total: row.hours,
      rate_cents: rateCents,
      gross_cents: grossCents,
    });
  }
  return out.sort((a, b) => a.worker_name.localeCompare(b.worker_name));
}

export type WorkerWageRow = {
  id: string;
  hourly_rate_cents: number;
  effective_from: string;
  effective_to: string | null;
};

export async function fetchWorkerWageHistory(profileId: string): Promise<WorkerWageRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("worker_wages")
    .select("id, hourly_rate_cents, effective_from, effective_to")
    .eq("profile_id", profileId)
    .order("effective_from", { ascending: false });
  if (error) throw error;
  return (data ?? []) as WorkerWageRow[];
}

// ─── Live snapshots ────────────────────────────────────────────────────────

export type DashboardStats = {
  liveSites: number;
  workersOnShift: number;
  hoursToday: number;
  tasksDone: number;
  tasksTotal: number;
};

export async function fetchDashboardStats(): Promise<DashboardStats> {
  const supabase = await createClient();
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);

  const { data: shifts } = await supabase
    .from("shifts")
    .select("id, site_id, status, actual_start, actual_end")
    .gte("scheduled_start", startOfDay.toISOString())
    .lte("scheduled_start", endOfDay.toISOString());

  const liveSites = new Set<string>();
  let workersOnShift = 0;
  let hoursToday = 0;
  const now = Date.now();
  const shiftIds: string[] = [];
  for (const s of shifts ?? []) {
    shiftIds.push(s.id);
    if (s.status === "clocked_in") {
      liveSites.add(s.site_id);
      workersOnShift++;
    }
    if (s.actual_start) {
      const end = s.actual_end ? new Date(s.actual_end).getTime() : now;
      hoursToday += (end - new Date(s.actual_start).getTime()) / 3600000;
    }
  }

  let tasksDone = 0;
  let tasksTotal = 0;
  if (shiftIds.length > 0) {
    const { data: tasks } = await supabase
      .from("tasks")
      .select("status")
      .in("shift_id", shiftIds);
    tasksTotal = (tasks ?? []).length;
    tasksDone = (tasks ?? []).filter((t) => t.status === "done").length;
  }

  return { liveSites: liveSites.size, workersOnShift, hoursToday, tasksDone, tasksTotal };
}

// Hours per worker for an arbitrary date range (returns map of profile_id → hours)
export async function fetchWorkerHours(
  fromIso: string,
  toIso: string,
): Promise<Map<string, number>> {
  const supabase = await createClient();
  const { data: shifts } = await supabase
    .from("shifts")
    .select("worker_id, actual_start, actual_end")
    .gte("scheduled_start", fromIso)
    .lte("scheduled_start", toIso)
    .not("actual_start", "is", null);

  const now = Date.now();
  const out = new Map<string, number>();
  for (const s of shifts ?? []) {
    if (!s.actual_start) continue;
    const end = s.actual_end ? new Date(s.actual_end).getTime() : now;
    const hrs = (end - new Date(s.actual_start).getTime()) / 3600000;
    out.set(s.worker_id, (out.get(s.worker_id) ?? 0) + hrs);
  }
  return out;
}

// Currently-in-progress tasks at a site, joined to shift + worker.
// Used by the site-detail "Now" panel.
export type LiveWorkerActivity = {
  worker_id: string;
  worker_name: string;
  shift_id: string;
  shift_started_at: string | null;
  task_id: string | null;
  task_label: string | null;
  task_target_ref: string | null;
  task_started_at: string | null;
};

export async function fetchLiveActivityForSite(siteId: string): Promise<LiveWorkerActivity[]> {
  const supabase = await createClient();
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const { data: shifts } = await supabase
    .from("shifts")
    .select(
      "id, worker_id, actual_start, status, worker:profiles!shifts_worker_id_fkey(full_name)",
    )
    .eq("site_id", siteId)
    .eq("status", "clocked_in")
    .gte("scheduled_start", startOfDay.toISOString());

  const rows = (shifts ?? []) as unknown as Array<{
    id: string;
    worker_id: string;
    actual_start: string | null;
    worker: { full_name: string } | null;
  }>;

  if (rows.length === 0) return [];

  const shiftIds = rows.map((s) => s.id);
  const { data: tasks } = await supabase
    .from("tasks")
    .select(
      "id, shift_id, target_ref, started_at, template:task_templates(label)",
    )
    .in("shift_id", shiftIds)
    .eq("status", "in_progress");

  const taskRows = (tasks ?? []) as unknown as Array<{
    id: string;
    shift_id: string;
    target_ref: string | null;
    started_at: string | null;
    template: { label: string } | null;
  }>;
  const tasksByShift = new Map<string, (typeof taskRows)[number]>();
  for (const t of taskRows) tasksByShift.set(t.shift_id, t);

  return rows.map((s) => {
    const t = tasksByShift.get(s.id);
    return {
      worker_id: s.worker_id,
      worker_name: s.worker?.full_name ?? "Unknown",
      shift_id: s.id,
      shift_started_at: s.actual_start,
      task_id: t?.id ?? null,
      task_label: t?.template?.label ?? null,
      task_target_ref: t?.target_ref ?? null,
      task_started_at: t?.started_at ?? null,
    };
  });
}

export type WorkerDetail = {
  profile: {
    id: string;
    full_name: string;
    email: string | null;
    preferred_language: string;
    phone: string | null;
  };
  roles: Array<{ user_role_id: string; role: string; site_id: string | null; site_name: string | null }>;
  todayShift: {
    id: string;
    status: string;
    site_name: string;
    site_id: string;
    actual_start: string | null;
    actual_end: string | null;
    scheduled_start: string;
    scheduled_end: string;
  } | null;
  currentTask: {
    id: string;
    label: string;
    target_ref: string | null;
    started_at: string | null;
  } | null;
  hoursByDay: Array<{ day: string; hours: number }>;
  hoursThisWeek: number;
};

export async function fetchWorkerDetail(workerId: string): Promise<WorkerDetail | null> {
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name, email, preferred_language, phone")
    .eq("id", workerId)
    .maybeSingle();
  if (!profile) return null;

  const { data: rolesData } = await supabase
    .from("user_roles")
    .select("id, role, scope_site_id, site:sites(id, name)")
    .eq("profile_id", workerId);

  const roles = ((rolesData ?? []) as unknown as Array<{
    id: string;
    role: string;
    scope_site_id: string | null;
    site: { id: string; name: string } | null;
  }>).map((r) => ({
    user_role_id: r.id,
    role: r.role,
    site_id: r.scope_site_id,
    site_name: r.site?.name ?? null,
  }));

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);

  const { data: todayRows } = await supabase
    .from("shifts")
    .select(
      "id, status, scheduled_start, scheduled_end, actual_start, actual_end, site_id, site:sites(id, name)",
    )
    .eq("worker_id", workerId)
    .gte("scheduled_start", startOfDay.toISOString())
    .lte("scheduled_start", endOfDay.toISOString())
    .order("scheduled_start")
    .limit(1);

  const todayShiftRow = ((todayRows ?? []) as unknown as Array<{
    id: string;
    status: string;
    scheduled_start: string;
    scheduled_end: string;
    actual_start: string | null;
    actual_end: string | null;
    site_id: string;
    site: { id: string; name: string } | null;
  }>)[0];

  let currentTask: WorkerDetail["currentTask"] = null;
  if (todayShiftRow && todayShiftRow.status === "clocked_in") {
    const { data: t } = await supabase
      .from("tasks")
      .select("id, target_ref, started_at, template:task_templates(label)")
      .eq("shift_id", todayShiftRow.id)
      .eq("status", "in_progress")
      .order("started_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (t) {
      const row = t as unknown as {
        id: string;
        target_ref: string | null;
        started_at: string | null;
        template: { label: string } | null;
      };
      currentTask = {
        id: row.id,
        label: row.template?.label ?? "—",
        target_ref: row.target_ref,
        started_at: row.started_at,
      };
    }
  }

  // 14-day rolling per-day hours
  const since = new Date();
  since.setDate(since.getDate() - 13);
  since.setHours(0, 0, 0, 0);
  const { data: histShifts } = await supabase
    .from("shifts")
    .select("scheduled_start, actual_start, actual_end")
    .eq("worker_id", workerId)
    .gte("scheduled_start", since.toISOString())
    .not("actual_start", "is", null);

  const fmt = (d: Date) => d.toISOString().slice(0, 10);
  const hoursByDay: Array<{ day: string; hours: number }> = [];
  const buckets = new Map<string, number>();
  for (let i = 0; i < 14; i++) {
    const d = new Date(since);
    d.setDate(since.getDate() + i);
    buckets.set(fmt(d), 0);
  }
  const now = Date.now();
  for (const s of histShifts ?? []) {
    if (!s.actual_start) continue;
    const key = fmt(new Date(s.actual_start));
    if (!buckets.has(key)) continue;
    const end = s.actual_end ? new Date(s.actual_end).getTime() : now;
    const hrs = (end - new Date(s.actual_start).getTime()) / 3600000;
    buckets.set(key, (buckets.get(key) ?? 0) + hrs);
  }
  for (const [day, hours] of buckets) hoursByDay.push({ day, hours });

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
  sevenDaysAgo.setHours(0, 0, 0, 0);
  const weekKey = fmt(sevenDaysAgo);
  const hoursThisWeek = hoursByDay
    .filter((r) => r.day >= weekKey)
    .reduce((acc, r) => acc + r.hours, 0);

  return {
    profile,
    roles,
    todayShift: todayShiftRow
      ? {
          id: todayShiftRow.id,
          status: todayShiftRow.status,
          site_id: todayShiftRow.site_id,
          site_name: todayShiftRow.site?.name ?? "—",
          actual_start: todayShiftRow.actual_start,
          actual_end: todayShiftRow.actual_end,
          scheduled_start: todayShiftRow.scheduled_start,
          scheduled_end: todayShiftRow.scheduled_end,
        }
      : null,
    currentTask,
    hoursByDay,
    hoursThisWeek,
  };
}
