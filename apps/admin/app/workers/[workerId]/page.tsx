import Link from "next/link";
import { notFound } from "next/navigation";
import { fetchWorkerDetail, fetchWorkerWageHistory } from "@/lib/db";
import { signOut } from "../../login/actions";
import { WageEditor } from "./wage-editor";

const STATUS_COLORS: Record<string, string> = {
  scheduled: "bg-slate-100 text-slate-700",
  clocked_in: "bg-sky-100 text-sky-700",
  clocked_out: "bg-emerald-100 text-emerald-700",
  no_show: "bg-red-100 text-red-700",
};

export default async function WorkerDetailPage({
  params,
}: {
  params: Promise<{ workerId: string }>;
}) {
  const { workerId } = await params;
  const [detail, wageHistory] = await Promise.all([
    fetchWorkerDetail(workerId),
    fetchWorkerWageHistory(workerId),
  ]);
  if (!detail) notFound();

  const { profile, roles, todayShift, currentTask, hoursByDay, hoursThisWeek } = detail;

  const now = Date.now();
  const minutesOnTask =
    currentTask?.started_at != null
      ? Math.floor((now - new Date(currentTask.started_at).getTime()) / 60000)
      : null;
  const hoursOnShift =
    todayShift?.actual_start
      ? ((todayShift.actual_end ? new Date(todayShift.actual_end).getTime() : now) -
          new Date(todayShift.actual_start).getTime()) /
        3600000
      : null;

  const maxHours = Math.max(0.5, ...hoursByDay.map((r) => r.hours));

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-6">
            <Link href="/" className="altus-wordmark text-xl text-[#0E3D52]">EWM <span className="italic text-[#5EB4CC]">Altus</span></Link>
            <nav className="flex gap-4 text-sm text-slate-600">
              <Link href="/" className="hover:text-slate-900">Dashboard</Link>
              <Link href="/sites" className="hover:text-slate-900">Sites</Link>
              <Link href="/workers" className="font-medium text-slate-900">Workers</Link>
            </nav>
          </div>
          <form action={signOut} className="flex items-center gap-3"><a href="https://elevated-workforce.com" target="_blank" rel="noopener" className="rounded-full border border-slate-300 bg-white px-3 py-1 text-xs font-medium text-slate-700 transition hover:border-[#5EB4CC] hover:text-[#5EB4CC]">EWM &#8599;</a>
            <button className="text-sm font-medium text-slate-600 hover:text-slate-900">Sign out</button>
          </form>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-10">
        <Link href="/workers" className="text-sm text-slate-500 hover:text-slate-900">
          ← All workers
        </Link>

        <div className="mt-2">
          <h1 className="text-2xl font-semibold text-slate-900">{profile.full_name}</h1>
          <p className="mt-1 text-sm text-slate-500">
            {profile.email ?? "no email"} · {profile.preferred_language.toUpperCase()}
            {profile.phone && <> · {profile.phone}</>}
          </p>
        </div>

        <section className="mt-8 grid gap-4 md:grid-cols-3">
          <Card title="This week" value={hoursThisWeek.toFixed(1)} hint="hours (last 7 days)" />
          <Card
            title="Shift today"
            value={todayShift ? todayShift.status.replace("_", " ") : "none"}
            hint={
              todayShift
                ? `${new Date(todayShift.scheduled_start).toLocaleTimeString([], {
                    hour: "numeric",
                    minute: "2-digit",
                  })}–${new Date(todayShift.scheduled_end).toLocaleTimeString([], {
                    hour: "numeric",
                    minute: "2-digit",
                  })} at ${todayShift.site_name}`
                : "Not scheduled today"
            }
            badgeClass={todayShift ? STATUS_COLORS[todayShift.status] : undefined}
          />
          <Card
            title="On shift now"
            value={hoursOnShift != null ? hoursOnShift.toFixed(1) : "—"}
            hint={hoursOnShift != null ? "hours since clock-in" : "Not clocked in"}
          />
        </section>

        <section className="mt-8 rounded-lg border border-slate-200 bg-white p-6">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500">
            Currently working on
          </h2>
          {currentTask ? (
            <div className="mt-3 flex items-baseline gap-3">
              <div className="text-2xl font-semibold text-slate-900">{currentTask.label}</div>
              {currentTask.target_ref && (
                <div className="rounded-md bg-[#5EB4CC]/10 px-2 py-1 text-sm font-medium text-[#0369A1]">
                  Room {currentTask.target_ref}
                </div>
              )}
              {minutesOnTask != null && (
                <div className="text-sm text-slate-500">
                  {minutesOnTask} min on this task
                </div>
              )}
            </div>
          ) : todayShift?.status === "clocked_in" ? (
            <p className="mt-3 text-sm text-slate-500">
              Clocked in at <b>{todayShift.site_name}</b>, no task in progress yet.
            </p>
          ) : (
            <p className="mt-3 text-sm text-slate-500">
              {todayShift ? "Not clocked in yet." : "No shift scheduled today."}
            </p>
          )}
        </section>

        <section className="mt-8 rounded-lg border border-slate-200 bg-white p-6">
          <div className="mb-4 flex items-baseline justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500">
              Hours · last 14 days
            </h2>
            <span className="text-sm font-medium text-slate-900">
              {hoursByDay.reduce((a, r) => a + r.hours, 0).toFixed(1)} h total
            </span>
          </div>
          <div className="flex items-end gap-1">
            {hoursByDay.map((r) => {
              const pct = (r.hours / maxHours) * 100;
              return (
                <div key={r.day} className="flex flex-1 flex-col items-center gap-1">
                  <div className="relative h-32 w-full overflow-hidden rounded bg-slate-100">
                    <div
                      className="absolute bottom-0 w-full bg-[#0E3D52]/80"
                      style={{ height: `${pct}%` }}
                      title={`${r.hours.toFixed(1)}h`}
                    />
                  </div>
                  <div className="text-[10px] text-slate-500">{r.day.slice(5)}</div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="mt-8 rounded-lg border border-slate-200 bg-white p-6">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-500">
            Wage
          </h2>
          <WageEditor workerId={workerId} history={wageHistory} />
        </section>

        <section className="mt-8 rounded-lg border border-slate-200 bg-white p-6">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500">
            Roles
          </h2>
          {roles.length === 0 ? (
            <p className="mt-3 text-sm text-slate-500">No role assignments.</p>
          ) : (
            <ul className="mt-3 space-y-2 text-sm">
              {roles.map((r, i) => (
                <li key={i} className="flex items-center gap-2">
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium capitalize text-slate-700">
                    {r.role.replace("_", " ")}
                  </span>
                  {r.site_name ? (
                    <Link
                      href={`/sites/${r.site_id}`}
                      className="text-slate-700 hover:text-[#5EB4CC] hover:underline"
                    >
                      at {r.site_name}
                    </Link>
                  ) : (
                    <span className="text-slate-500">global scope</span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}

function Card({
  title,
  value,
  hint,
  badgeClass,
}: {
  title: string;
  value: string;
  hint: string;
  badgeClass?: string;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="text-xs font-medium uppercase tracking-wide text-slate-500">{title}</div>
      <div className="mt-2 flex items-baseline gap-2">
        <div className="text-3xl font-semibold capitalize text-slate-900">{value}</div>
        {badgeClass && (
          <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${badgeClass}`}>
            live
          </span>
        )}
      </div>
      <div className="mt-1 text-xs text-slate-500">{hint}</div>
    </div>
  );
}
