import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { fetchSites } from "@/lib/db";
import { signOut } from "../login/actions";

type SiteSummary = {
  id: string;
  name: string;
  customerName: string;
  vertical: string;
  workersClockedIn: number;
  workersScheduled: number;
  tasksTotal: number;
  tasksDone: number;
  tasksBlocked: number;
  completionPct: number;
};

async function fetchSiteSummaries(): Promise<SiteSummary[]> {
  const sites = await fetchSites();
  const supabase = await createClient();

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);

  return Promise.all(
    sites.map(async (site) => {
      const { data: shifts } = await supabase
        .from("shifts")
        .select("id, status")
        .eq("site_id", site.id)
        .gte("scheduled_start", startOfDay.toISOString())
        .lte("scheduled_start", endOfDay.toISOString());

      const shiftIds = (shifts ?? []).map((s) => s.id);
      const workersClockedIn = (shifts ?? []).filter(
        (s) => s.status === "clocked_in",
      ).length;
      const workersScheduled = shifts?.length ?? 0;

      let tasksTotal = 0;
      let tasksDone = 0;
      let tasksBlocked = 0;
      if (shiftIds.length > 0) {
        const { data: tasks } = await supabase
          .from("tasks")
          .select("status")
          .in("shift_id", shiftIds);
        tasksTotal = tasks?.length ?? 0;
        tasksDone = (tasks ?? []).filter((t) => t.status === "done").length;
        tasksBlocked = (tasks ?? []).filter((t) => t.status === "blocked").length;
      }

      const completionPct =
        tasksTotal === 0 ? 0 : Math.round((tasksDone / tasksTotal) * 100);

      return {
        id: site.id,
        name: site.name,
        customerName: site.customer?.name ?? "—",
        vertical: site.customer?.vertical ?? "—",
        workersClockedIn,
        workersScheduled,
        tasksTotal,
        tasksDone,
        tasksBlocked,
        completionPct,
      };
    }),
  );
}

export default async function OverviewPage() {
  const summaries = await fetchSiteSummaries();

  const totals = summaries.reduce(
    (acc, s) => ({
      sites: acc.sites + 1,
      workersClockedIn: acc.workersClockedIn + s.workersClockedIn,
      workersScheduled: acc.workersScheduled + s.workersScheduled,
      tasksTotal: acc.tasksTotal + s.tasksTotal,
      tasksDone: acc.tasksDone + s.tasksDone,
      tasksBlocked: acc.tasksBlocked + s.tasksBlocked,
    }),
    { sites: 0, workersClockedIn: 0, workersScheduled: 0, tasksTotal: 0, tasksDone: 0, tasksBlocked: 0 },
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-6">
            <Link href="/" className="text-xl font-bold text-[#0E3D52]">
              EWM
            </Link>
            <nav className="flex gap-4 text-sm text-slate-600">
              <Link href="/" className="hover:text-slate-900">
                Dashboard
              </Link>
              <Link href="/overview" className="font-medium text-slate-900">
                Overview
              </Link>
              <Link href="/sites" className="hover:text-slate-900">
                Sites
              </Link>
            </nav>
          </div>
          <form action={signOut}>
            <button
              type="submit"
              className="text-sm font-medium text-slate-600 hover:text-slate-900"
            >
              Sign out
            </button>
          </form>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-10">
        <h1 className="text-2xl font-semibold text-slate-900">Area overview</h1>
        <p className="mt-1 text-sm text-slate-500">
          Today's activity across all sites you manage.
        </p>

        <div className="mt-6 grid gap-3 md:grid-cols-5">
          <RollupCard label="Sites" value={String(totals.sites)} />
          <RollupCard
            label="Workers clocked in"
            value={`${totals.workersClockedIn} / ${totals.workersScheduled}`}
          />
          <RollupCard
            label="Task completion"
            value={
              totals.tasksTotal === 0
                ? "—"
                : `${Math.round((totals.tasksDone / totals.tasksTotal) * 100)}%`
            }
            color="text-emerald-600"
          />
          <RollupCard
            label="Tasks done today"
            value={`${totals.tasksDone} / ${totals.tasksTotal}`}
          />
          <RollupCard
            label="Blocked"
            value={String(totals.tasksBlocked)}
            color={totals.tasksBlocked > 0 ? "text-red-600" : "text-slate-900"}
          />
        </div>

        <section className="mt-10">
          <h2 className="text-lg font-semibold text-slate-900">Sites</h2>
          {summaries.length === 0 ? (
            <div className="mt-4 rounded-lg border border-dashed border-slate-300 bg-white p-12 text-center">
              <p className="text-sm text-slate-500">No sites in your scope yet.</p>
            </div>
          ) : (
            <div className="mt-4 overflow-hidden rounded-lg border border-slate-200 bg-white">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-6 py-3">Site</th>
                    <th className="px-6 py-3">Workers</th>
                    <th className="px-6 py-3">Tasks</th>
                    <th className="px-6 py-3">Completion</th>
                    <th className="px-6 py-3">Blocked</th>
                    <th className="px-6 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {summaries.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4">
                        <div className="font-medium text-slate-900">{s.name}</div>
                        <div className="text-xs text-slate-500">
                          {s.customerName} ·{" "}
                          <span className="capitalize">
                            {s.vertical.replace("_", " ")}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-700">
                        {s.workersClockedIn} / {s.workersScheduled}
                      </td>
                      <td className="px-6 py-4 text-slate-700">
                        {s.tasksDone} / {s.tasksTotal}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-20 overflow-hidden rounded-full bg-slate-200">
                            <div
                              className="h-full bg-emerald-500"
                              style={{ width: `${s.completionPct}%` }}
                            />
                          </div>
                          <span className="text-xs text-slate-600">{s.completionPct}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {s.tasksBlocked > 0 ? (
                          <span className="inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                            {s.tasksBlocked}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link
                          href={`/sites/${s.id}/live`}
                          className="text-xs font-medium text-[#5EB4CC] hover:underline"
                        >
                          Live →
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

function RollupCard({
  label,
  value,
  color = "text-slate-900",
}: {
  label: string;
  value: string;
  color?: string;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</div>
      <div className={`mt-1 text-2xl font-semibold ${color}`}>{value}</div>
    </div>
  );
}
