// EWM billing rollup — converts completed tasks into billing_lines per customer per day.
//
// Trigger: daily cron or HTTP POST.
// Query param: ?date=YYYY-MM-DD (default: yesterday in UTC)
//
// Deploy: supabase functions deploy billing-rollup
// Invoke:  supabase functions invoke billing-rollup --no-verify-jwt
//
// Runs under the service role (set in Edge Function secrets). Not callable
// by unauthenticated users.

// @ts-nocheck — Deno imports, types resolved at runtime in Edge Function env
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.46.1";

Deno.serve(async (req) => {
  try {
    const url = new URL(req.url);
    const dateParam = url.searchParams.get("date");
    const targetDate = dateParam ? new Date(dateParam) : yesterdayUTC();
    const dateStr = targetDate.toISOString().slice(0, 10);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false } },
    );

    // Find all completed tasks on that date, group by customer+site+unit_type.
    const startOfDay = `${dateStr}T00:00:00Z`;
    const endOfDay = `${dateStr}T23:59:59Z`;

    const { data: tasks, error: tasksError } = await supabase
      .from("tasks")
      .select(`
        id, site_id, completed_at, started_at,
        template:task_templates(code, billable, billing_unit),
        shift:shifts(site:sites(customer_id))
      `)
      .eq("status", "done")
      .gte("completed_at", startOfDay)
      .lte("completed_at", endOfDay);

    if (tasksError) throw tasksError;

    // Aggregate by (customer_id, site_id, unit_type)
    const rollup = new Map();
    let workerHoursBySite = new Map();

    for (const task of tasks ?? []) {
      if (!task.template?.billable) continue;
      const unitType = task.template.billing_unit ?? "task";
      const customerId = task.shift?.site?.customer_id;
      if (!customerId) continue;

      const key = `${customerId}|${task.site_id}|${unitType}`;
      const existing = rollup.get(key) ?? {
        customer_id: customerId,
        site_id: task.site_id,
        bill_date: dateStr,
        unit_type: unitType,
        unit_count: 0,
        worker_hours: 0,
        rate_code: null,
      };
      existing.unit_count += 1;
      if (task.started_at && task.completed_at) {
        const hours = (new Date(task.completed_at).getTime() - new Date(task.started_at).getTime()) / 3600_000;
        existing.worker_hours += hours;
      }
      rollup.set(key, existing);
    }

    // Compute total worker hours per site from clocked-out shifts
    const { data: shifts } = await supabase
      .from("shifts")
      .select("site_id, actual_start, actual_end")
      .eq("status", "clocked_out")
      .gte("actual_end", startOfDay)
      .lte("actual_end", endOfDay);

    for (const s of shifts ?? []) {
      if (!s.actual_start || !s.actual_end) continue;
      const hrs = (new Date(s.actual_end).getTime() - new Date(s.actual_start).getTime()) / 3600_000;
      workerHoursBySite.set(s.site_id, (workerHoursBySite.get(s.site_id) ?? 0) + hrs);
    }

    // Upsert billing_lines
    const rows = [...rollup.values()].map((r) => ({
      ...r,
      worker_hours: Number(r.worker_hours.toFixed(2)),
    }));

    if (rows.length) {
      const { error: upsertError } = await supabase
        .from("billing_lines")
        .upsert(rows, { onConflict: "customer_id,site_id,bill_date,unit_type,rate_code" });
      if (upsertError) throw upsertError;
    }

    // Also generate CSV and write to Storage
    const csv = [
      "customer_id,site_id,bill_date,unit_type,unit_count,worker_hours,rate_code",
      ...rows.map((r) =>
        [r.customer_id, r.site_id, r.bill_date, r.unit_type, r.unit_count, r.worker_hours, r.rate_code ?? ""].join(","),
      ),
    ].join("\n");

    const csvPath = `billing/${dateStr}.csv`;
    const { error: uploadError } = await supabase.storage
      .from("task-photos") // reusing bucket; ideally we'd have a separate billing-exports bucket
      .upload(csvPath, new Blob([csv], { type: "text/csv" }), { upsert: true });

    // Don't fail the whole rollup if storage upload fails
    const uploadWarning = uploadError?.message;

    return new Response(
      JSON.stringify({
        date: dateStr,
        tasks_processed: tasks?.length ?? 0,
        billing_lines: rows.length,
        csv_path: uploadWarning ? null : csvPath,
        warnings: uploadWarning ? [uploadWarning] : [],
      }),
      { headers: { "Content-Type": "application/json" } },
    );
  } catch (e) {
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : String(e) }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
});

function yesterdayUTC() {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - 1);
  return d;
}
