import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "../login/actions";

type DailyRow = {
  day: string;
  tasks_done: number;
  tasks_blocked: number;
  worker_hours: number;
  shifts: number;
};

type TemplateRow = {
  template_code: string;
  label: string;
  expected: number;
  actual: number;
  count: number;
};

type IncidentRow = {
  category: string;
  severity: string;
  count: number;
};

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ days?: string; site?: string }>;
}) {
  const sp = await searchParams;
  const days = Number(sp.days ?? "7");
  const siteFilter = sp.site ?? "";

  const supabase = await createClient();
  const { data: sites } = await supabase.from("sites").select("id, name").order("name");

  const since = new Date();
  since.setDate(since.getDate() - days);
  since.setHours(0, 0, 0, 0);

  // Tasks done / blocked by day
  let tasksQuery = supabase
    .from("tasks")
    .select("status, completed_at, site_id, template_code, started_at, duration_seconds")
    .gte("created_at", since.toISOString());
  if (siteFilter) tasksQuery = tasksQuery.eq("site_id", siteFilter);
  const { data: tasks } = await tasksQuery;

  let shiftsQuery = supabase
    .from("shifts")
    .select("actual_start, actual_end, site_id, status")
    .gte("scheduled_start", since.toISOString())
    .in("status", ["clocked_in", "clocked_out"]);
  if (siteFilter) shiftsQuery = shiftsQuery.eq("site_id", siteFilter);
  const { data: shifts } = await shiftsQuery;

  // Bucket into days
  const byDay: Record<string, DailyRow> = {};
  const fmt = (d: Date) => d.toISOString().slice(0, 10);
  for (let i = 0; i < days; i++) {
    const d = new Date(since);
    d.setDate(since.getDate() + i);
    byDay[fmt(d)] = { day: fmt(d), tasks_done: 0, tasks_blocked: 0, worker_hours: 0, shifts: 0 };
  }
  tasks?.forEach((t) => {
    const key = t.completed_at ? fmt(new Date(t.completed_at)) : null;
    if (!key || !byDay[key]) return;
    if (t.status === "done") byDay[key].tasks_done += 1;
    if (t.status === "blocked") byDay[key].tasks_blocked += 1;
  });
  shifts?.forEach((s) => {
    if (!s.actual_start) return;
    const key = fmt(new Date(s.actual_start));
    if (!byDay[key]) return;
    byDay[key].shifts += 1;
    if (s.actual_end) {
      const ms = new Date(s.actual_end).getTime() - new Date(s.actual_start).getTime();
      byDay[key].worker_hours += ms / (1000 * 60 * 60);
    }
  });

  const dailyRows = Object.values(byDay).sort((a, b) => a.day.localeCompare(b.day));
  const maxDone = Math.max(1, ...dailyRows.map((r) => r.tasks_done));

  // Template performance
  const templateAgg: Record<string, TemplateRow> = {};
  const { data: templates } = await supabase
    .from("task_templates")
    .select("code, label, expected_minutes");
  const tmplMap = new Map((templates ?? []).map((tt) => [tt.code, tt]));
  tasks?.forEach((t) => {
    if (t.status !== "done" || !t.duration_seconds) return;
    const tmpl = tmplMap.get(t.template_code);
    if (!tmpl) return;
    const agg = templateAgg[t.template_code] ?? {
      template_code: t.template_code,
      label: tmpl.label,
      expected: tmpl.expected_minutes,
      actual: 0,
      count: 0,
    };
    agg.actual += t.duration_seconds / 60;
    agg.count += 1;
    templateAgg[t.template_code] = agg;
  });
  const templateRows = Object.values(templateAgg).sort((a, b) => b.count - a.count);

  // Incidents by category
  let incidentsQuery = supabase
    .from("incidents")
    .select("category, severity")
    .gte("created_at", since.toISOString());
  if (siteFilter) incidentsQuery = incidentsQuery.eq("site_id", siteFilter);
  const { data: incidents } = await incidentsQuery;
  const incidentAgg: Record<string, IncidentRow> = {};
  incidents?.forEach((i) => {
    const key = `${i.category}-${i.severity}`;
    const agg = incidentAgg[key] ?? { category: i.category, severity: i.severity, count: 0 };
    agg.count += 1;
    incidentAgg[key] = agg;
  });
  const incidentRows = Object.values(incidentAgg).sort((a, b) => b.count - a.count);

  const totalDone = tasks?.filter((t) => t.status === "done").length ?? 0;
  const totalHours = shifts?.reduce((acc, s) => {
    if (!s.actual_start || !s.actual_end) return acc;
    return acc + (new Date(s.actual_end).getTime() - new Date(s.actual_start).getTime()) / 3600000;
  }, 0) ?? 0;
  const totalIncidents = incidents?.length ?? 0;

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-6">
            <Link href="/" className="altus-wordmark text-xl text-[#0E3D52]">EWM <span className="italic text-[#5EB4CC]">Altus</span></Link>
            <nav className="flex gap-4 text-sm text-slate-600">
              <Link href="/" className="hover:text-slate-900">Dashboard</Link>
              <Link href="/overview" className="hover:text-slate-900">Overview</Link>
              <Link href="/sites" className="hover:text-slate-900">Sites</Link>
              <Link href="/billing" className="hover:text-slate-900">Billing</Link>
              <Link href="/reports" className="font-medium text-slate-900">Reports</Link>
              <Link href="/audit" className="hover:text-slate-900">Audit</Link>
            </nav>
          </div>
          <form action={signOut} className="flex items-center gap-3"><a href="https://elevated-workforce.com" target="_blank" rel="noopener" className="rounded-full border border-slate-300 bg-white px-3 py-1 text-xs font-medium text-slate-700 transition hover:border-[#5EB4CC] hover:text-[#5EB4CC]">EWM &#8599;</a>
            <button className="text-sm font-medium text-slate-600 hover:text-slate-900">Sign out</button>
          </form>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-10">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Reports</h1>
            <p className="mt-1 text-sm text-slate-500">Operational trends, template performance, incident summary.</p>
          </div>
        </div>

        <form className="mb-6 flex flex-wrap gap-3 rounded-lg border border-slate-200 bg-white p-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">Range</label>
            <select name="days" defaultValue={String(days)} className="rounded-md border border-slate-300 px-3 py-1.5 text-sm">
              <option value="7">Last 7 days</option>
              <option value="14">Last 14 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">Site</label>
            <select name="site" defaultValue={siteFilter} className="rounded-md border border-slate-300 px-3 py-1.5 text-sm">
              <option value="">All sites</option>
              {sites?.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div className="flex items-end">
            <button type="submit" className="rounded-md bg-[#0E3D52] px-4 py-1.5 text-sm font-medium text-white">Apply</button>
          </div>
        </form>

        <section className="mb-8 grid gap-4 md:grid-cols-3">
          <StatCard label="Tasks completed" value={totalDone.toLocaleString()} hint={`last ${days} days`} />
          <StatCard label="Worker hours" value={totalHours.toFixed(1)} hint={`${shifts?.length ?? 0} shifts`} />
          <StatCard label="Incidents reported" value={totalIncidents.toLocaleString()} hint={`across ${new Set(incidents?.map((i) => i.category)).size} categories`} />
        </section>

        <section className="mb-8 rounded-lg border border-slate-200 bg-white p-6">
          <h2 className="mb-4 text-sm font-semibold text-slate-900">Daily tasks completed</h2>
          <div className="space-y-2">
            {dailyRows.map((r) => (
              <div key={r.day} className="flex items-center gap-3 text-xs">
                <div className="w-20 text-slate-500">{r.day}</div>
                <div className="flex-1">
                  <div className="h-6 rounded bg-slate-100 relative overflow-hidden">
                    <div
                      className="h-full bg-emerald-400"
                      style={{ width: `${(r.tasks_done / maxDone) * 100}%` }}
                    />
                    <div className="absolute inset-0 flex items-center px-2 text-[11px] font-medium text-slate-700">
                      {r.tasks_done} done · {r.shifts} shifts · {r.worker_hours.toFixed(1)}h
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-8 rounded-lg border border-slate-200 bg-white p-6">
          <h2 className="mb-4 text-sm font-semibold text-slate-900">Template performance — expected vs actual</h2>
          {templateRows.length === 0 ? (
            <p className="text-sm text-slate-500">No completed tasks in this window.</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="pb-2">Task</th>
                  <th className="pb-2 text-right">Count</th>
                  <th className="pb-2 text-right">Expected</th>
                  <th className="pb-2 text-right">Avg actual</th>
                  <th className="pb-2 text-right">Variance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {templateRows.map((t) => {
                  const avg = t.count > 0 ? t.actual / t.count : 0;
                  const variance = ((avg - t.expected) / t.expected) * 100;
                  const varColor =
                    variance > 15 ? "text-red-600" : variance < -15 ? "text-emerald-600" : "text-slate-500";
                  return (
                    <tr key={t.template_code}>
                      <td className="py-2 font-medium text-slate-900">{t.label}</td>
                      <td className="py-2 text-right text-slate-700">{t.count}</td>
                      <td className="py-2 text-right text-slate-500">{t.expected} min</td>
                      <td className="py-2 text-right text-slate-900">{avg.toFixed(1)} min</td>
                      <td className={`py-2 text-right font-medium ${varColor}`}>
                        {variance >= 0 ? "+" : ""}
                        {variance.toFixed(0)}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-6">
          <h2 className="mb-4 text-sm font-semibold text-slate-900">Incidents by category</h2>
          {incidentRows.length === 0 ? (
            <p className="text-sm text-slate-500">No incidents in this window.</p>
          ) : (
            <div className="space-y-2">
              {incidentRows.map((i) => (
                <div key={`${i.category}-${i.severity}`} className="flex items-center justify-between text-sm">
                  <span className="capitalize text-slate-900">{i.category.replace("_", " ")}</span>
                  <div className="flex items-center gap-3 text-xs">
                    <span
                      className={`rounded-full px-2 py-0.5 font-medium capitalize ${
                        i.severity === "high"
                          ? "bg-red-100 text-red-700"
                          : i.severity === "medium"
                          ? "bg-amber-100 text-amber-700"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {i.severity}
                    </span>
                    <span className="text-slate-900 font-medium">{i.count}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

function StatCard({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</div>
      <div className="mt-2 text-3xl font-semibold text-slate-900">{value}</div>
      <div className="mt-1 text-xs text-slate-500">{hint}</div>
    </div>
  );
}
