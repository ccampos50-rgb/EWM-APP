import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "../login/actions";

export default async function AuditLogPage({
  searchParams,
}: {
  searchParams: Promise<{ site?: string; days?: string }>;
}) {
  const sp = await searchParams;
  const siteFilter = sp.site ?? "";
  const days = Number(sp.days ?? "7");

  const supabase = await createClient();

  const { data: sites } = await supabase.from("sites").select("id, name").order("name");

  const sinceDate = new Date();
  sinceDate.setDate(sinceDate.getDate() - days);

  let eventsQuery = supabase
    .from("task_events")
    .select(`
      id, event_type, payload, created_at,
      task:tasks(id, template_code, target_ref, site_id, template:task_templates(label)),
      actor:profiles(full_name)
    `)
    .gte("created_at", sinceDate.toISOString())
    .order("created_at", { ascending: false })
    .limit(200);

  if (siteFilter) {
    // Filter events where the linked task's site_id matches
    const { data: siteTasks } = await supabase
      .from("tasks")
      .select("id")
      .eq("site_id", siteFilter);
    const ids = (siteTasks ?? []).map((t) => t.id);
    if (ids.length) eventsQuery = eventsQuery.in("task_id", ids);
    else eventsQuery = eventsQuery.eq("task_id", "00000000-0000-0000-0000-000000000000");
  }

  const { data: events } = await eventsQuery;

  const eventColors: Record<string, string> = {
    started: "bg-sky-100 text-sky-700",
    completed: "bg-emerald-100 text-emerald-700",
    blocked: "bg-red-100 text-red-700",
    skipped: "bg-slate-100 text-slate-500",
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-6">
            <Link href="/" className="text-xl font-bold text-[#1E3A8A]">EWM</Link>
            <nav className="flex gap-4 text-sm text-slate-600">
              <Link href="/" className="hover:text-slate-900">Dashboard</Link>
              <Link href="/overview" className="hover:text-slate-900">Overview</Link>
              <Link href="/sites" className="hover:text-slate-900">Sites</Link>
              <Link href="/billing" className="hover:text-slate-900">Billing</Link>
              <Link href="/reports" className="hover:text-slate-900">Reports</Link>
              <Link href="/audit" className="font-medium text-slate-900">Audit</Link>
            </nav>
          </div>
          <form action={signOut}>
            <button className="text-sm font-medium text-slate-600 hover:text-slate-900">Sign out</button>
          </form>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-10">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Audit log</h1>
            <p className="mt-1 text-sm text-slate-500">
              Every task state change and scan event. Append-only.
            </p>
          </div>
        </div>

        <form className="mb-6 flex flex-wrap gap-3 rounded-lg border border-slate-200 bg-white p-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">Site</label>
            <select
              name="site"
              defaultValue={siteFilter}
              className="rounded-md border border-slate-300 px-3 py-1.5 text-sm"
            >
              <option value="">All sites</option>
              {sites?.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">Range</label>
            <select
              name="days"
              defaultValue={String(days)}
              className="rounded-md border border-slate-300 px-3 py-1.5 text-sm"
            >
              <option value="1">Last 24h</option>
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              type="submit"
              className="rounded-md bg-[#1E3A8A] px-4 py-1.5 text-sm font-medium text-white"
            >
              Apply
            </button>
          </div>
          <div className="flex items-end text-xs text-slate-500">
            Showing {events?.length ?? 0} event(s) · last {days} day(s)
          </div>
        </form>

        {!events || events.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-300 bg-white p-12 text-center">
            <p className="text-sm text-slate-500">No events in this range.</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-6 py-3">When</th>
                  <th className="px-6 py-3">Event</th>
                  <th className="px-6 py-3">Task</th>
                  <th className="px-6 py-3">Target</th>
                  <th className="px-6 py-3">Actor</th>
                  <th className="px-6 py-3">Payload</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {events.map((e) => {
                  const task = Array.isArray(e.task) ? e.task[0] : e.task;
                  const template = Array.isArray(task?.template) ? task?.template[0] : task?.template;
                  const actor = Array.isArray(e.actor) ? e.actor[0] : e.actor;
                  return (
                    <tr key={e.id} className="hover:bg-slate-50">
                      <td className="px-6 py-3 text-xs text-slate-500 whitespace-nowrap">
                        {new Date(e.created_at).toLocaleString()}
                      </td>
                      <td className="px-6 py-3">
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${
                            eventColors[e.event_type] ?? "bg-slate-100 text-slate-700"
                          }`}
                        >
                          {e.event_type}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-slate-900">
                        {template?.label ?? task?.template_code ?? "—"}
                      </td>
                      <td className="px-6 py-3 text-slate-600">{task?.target_ref ?? "—"}</td>
                      <td className="px-6 py-3 text-slate-700">{actor?.full_name ?? "—"}</td>
                      <td className="px-6 py-3 font-mono text-xs text-slate-500">
                        {JSON.stringify(e.payload)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
