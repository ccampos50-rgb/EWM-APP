import Link from "next/link";
import { notFound } from "next/navigation";
import {
  fetchShiftTasks,
  fetchSite,
  fetchTodaysShiftsForSite,
  fetchLiveActivityForSite,
} from "@/lib/db";
import { signOut } from "../../login/actions";

const STATUS_COLORS: Record<string, string> = {
  scheduled: "bg-slate-100 text-slate-700",
  clocked_in: "bg-sky-100 text-sky-700",
  clocked_out: "bg-emerald-100 text-emerald-700",
  no_show: "bg-red-100 text-red-700",
};

const TASK_COLORS: Record<string, string> = {
  assigned: "bg-slate-100 text-slate-700",
  in_progress: "bg-sky-100 text-sky-700",
  done: "bg-emerald-100 text-emerald-700",
  blocked: "bg-red-100 text-red-700",
  skipped: "bg-slate-100 text-slate-500",
};

export default async function SiteDetailPage({
  params,
}: {
  params: Promise<{ siteId: string }>;
}) {
  const { siteId } = await params;
  const site = await fetchSite(siteId);
  if (!site) notFound();

  const [shifts, liveNow] = await Promise.all([
    fetchTodaysShiftsForSite(siteId),
    fetchLiveActivityForSite(siteId),
  ]);
  const tasksByShift = await Promise.all(
    shifts.map(async (s) => ({ shift: s, tasks: await fetchShiftTasks(s.id) })),
  );
  const now = Date.now();

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
              <Link href="/sites" className="hover:text-slate-900">
                Sites
              </Link>
              <Link href="/workers" className="hover:text-slate-900">
                Workers
              </Link>
            </nav>
          </div>
          <form action={signOut} className="flex items-center gap-3"><a href="https://elevated-workforce.com" target="_blank" rel="noopener" className="rounded-full border border-slate-300 bg-white px-3 py-1 text-xs font-medium text-slate-700 transition hover:border-[#5EB4CC] hover:text-[#5EB4CC]">EWM &#8599;</a>
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
        <Link href="/sites" className="text-sm text-slate-500 hover:text-slate-900">
          ← All sites
        </Link>

        <div className="mt-2 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">{site.name}</h1>
            <p className="mt-1 text-sm text-slate-500">
              {site.customer?.name}
              {site.customer?.vertical && (
                <> · <span className="capitalize">{site.customer.vertical.replace("_", " ")}</span></>
              )}
            </p>
            {site.address && <p className="mt-1 text-sm text-slate-500">{site.address}</p>}
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href={`/sites/${site.id}/edit`}
              className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Edit site
            </Link>
            <Link
              href={`/sites/${site.id}/qr`}
              className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Print QR codes
            </Link>
            <Link
              href={`/sites/${site.id}/live`}
              className="rounded-md border border-[#0E3D52] px-4 py-2 text-sm font-medium text-[#0E3D52] hover:bg-[#0E3D52]/5"
            >
              Live board
            </Link>
            <Link
              href={`/workers/new?site=${site.id}`}
              className="rounded-md border border-[#0E3D52] px-4 py-2 text-sm font-medium text-[#0E3D52] hover:bg-[#0E3D52]/5"
            >
              + Add worker
            </Link>
            <Link
              href={`/sites/${site.id}/new-shift`}
              className="rounded-md bg-[#0E3D52] px-4 py-2 text-sm font-medium text-white hover:bg-[#0E3D52]/90"
            >
              + Schedule shift
            </Link>
          </div>
        </div>

        <section className="mt-10">
          <div className="mb-3 flex items-baseline justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Now</h2>
            <span className="text-xs text-slate-500">{liveNow.length} clocked in · refresh page to update</span>
          </div>
          {liveNow.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-500">
              No workers are clocked in right now.
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {liveNow.map((row) => {
                const onShiftMin = row.shift_started_at
                  ? Math.floor((now - new Date(row.shift_started_at).getTime()) / 60000)
                  : null;
                const onTaskMin = row.task_started_at
                  ? Math.floor((now - new Date(row.task_started_at).getTime()) / 60000)
                  : null;
                return (
                  <Link
                    key={row.shift_id}
                    href={`/workers/${row.worker_id}`}
                    className="rounded-lg border border-slate-200 bg-white p-4 hover:border-[#5EB4CC] hover:shadow-sm"
                  >
                    <div className="flex items-baseline justify-between">
                      <div className="font-medium text-slate-900">{row.worker_name}</div>
                      {onShiftMin != null && (
                        <span className="text-xs text-slate-500">
                          {Math.floor(onShiftMin / 60)}h {onShiftMin % 60}m on shift
                        </span>
                      )}
                    </div>
                    {row.task_label ? (
                      <div className="mt-2">
                        <div className="text-sm text-slate-700">{row.task_label}</div>
                        <div className="mt-1 flex items-center gap-2">
                          {row.task_target_ref && (
                            <span className="rounded bg-[#5EB4CC]/10 px-2 py-0.5 text-xs font-medium text-[#0369A1]">
                              Room {row.task_target_ref}
                            </span>
                          )}
                          {onTaskMin != null && (
                            <span className="text-xs text-slate-500">{onTaskMin}m on task</span>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="mt-2 text-xs italic text-slate-500">No task started yet</div>
                    )}
                  </Link>
                );
              })}
            </div>
          )}
        </section>

        <section className="mt-10">
          <h2 className="text-lg font-semibold text-slate-900">Today's shifts</h2>

          {shifts.length === 0 ? (
            <div className="mt-4 rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
              No shifts scheduled for today.
            </div>
          ) : (
            <div className="mt-4 space-y-4">
              {tasksByShift.map(({ shift, tasks }) => (
                <div key={shift.id} className="overflow-hidden rounded-lg border border-slate-200 bg-white">
                  <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-6 py-3">
                    <div>
                      <div className="text-sm font-medium text-slate-900">
                        {shift.worker?.full_name ?? "Unassigned"}
                      </div>
                      <div className="text-xs text-slate-500">
                        {new Date(shift.scheduled_start).toLocaleTimeString([], {
                          hour: "numeric",
                          minute: "2-digit",
                        })}{" "}
                        –{" "}
                        {new Date(shift.scheduled_end).toLocaleTimeString([], {
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span
                        className={`rounded-full px-2 py-1 text-xs font-medium capitalize ${
                          STATUS_COLORS[shift.status] ?? "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {shift.status.replace("_", " ")}
                      </span>
                      <Link
                        href={`/sites/${site.id}/shifts/${shift.id}/override`}
                        className="text-xs text-[#5EB4CC] hover:underline"
                      >
                        Override
                      </Link>
                    </div>
                  </div>
                  {tasks.length === 0 ? (
                    <div className="px-6 py-4 text-sm text-slate-500">No tasks assigned.</div>
                  ) : (
                    <ul className="divide-y divide-slate-100">
                      {tasks.map((t) => (
                        <li
                          key={t.id}
                          className="flex items-center justify-between px-6 py-3 text-sm"
                        >
                          <div>
                            <div className="font-medium text-slate-900">
                              {t.template?.label ?? t.template_code}
                            </div>
                            {t.target_ref && (
                              <div className="text-xs text-slate-500">Target: {t.target_ref}</div>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <Link
                              href={`/sites/${site.id}/tasks/${t.id}/reassign`}
                              className="text-xs text-[#5EB4CC] hover:underline"
                            >
                              Reassign
                            </Link>
                            <span
                              className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${
                                TASK_COLORS[t.status] ?? "bg-slate-100 text-slate-700"
                              }`}
                            >
                              {t.status.replace("_", " ")}
                            </span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="mt-10">
          <h2 className="text-lg font-semibold text-slate-900">Site info</h2>
          <div className="mt-4 rounded-lg border border-slate-200 bg-white p-6 text-sm">
            <dl className="grid gap-3 sm:grid-cols-2">
              <div>
                <dt className="text-xs uppercase tracking-wider text-slate-500">Geo-fence</dt>
                <dd className="mt-1 text-slate-900">
                  {site.latitude != null && site.longitude != null ? (
                    <>
                      <span className="font-mono">
                        {site.latitude.toFixed(4)}, {site.longitude.toFixed(4)}
                      </span>{" "}
                      · radius <b>{site.geofence_radius_m}m</b>{" "}
                      <a
                        href={`https://www.google.com/maps?q=${site.latitude},${site.longitude}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[#5EB4CC] hover:underline"
                      >
                        (map ↗)
                      </a>
                    </>
                  ) : (
                    <span className="text-slate-500">Not set — workers can't clock in until set.</span>
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wider text-slate-500">Timezone</dt>
                <dd className="mt-1 font-mono text-slate-900">{site.timezone}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wider text-slate-500">Site QR code</dt>
                <dd className="mt-1 font-mono text-slate-900">{site.site_qr_code}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wider text-slate-500">Site ID</dt>
                <dd className="mt-1 font-mono text-slate-900">{site.id}</dd>
              </div>
            </dl>
          </div>
        </section>
      </main>
    </div>
  );
}
