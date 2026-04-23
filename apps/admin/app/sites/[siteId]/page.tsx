import Link from "next/link";
import { notFound } from "next/navigation";
import { fetchShiftTasks, fetchSite, fetchTodaysShiftsForSite } from "@/lib/db";
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

  const shifts = await fetchTodaysShiftsForSite(siteId);
  const tasksByShift = await Promise.all(
    shifts.map(async (s) => ({ shift: s, tasks: await fetchShiftTasks(s.id) })),
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-6">
            <Link href="/" className="text-xl font-bold text-[#1E3A8A]">
              EWM
            </Link>
            <nav className="flex gap-4 text-sm text-slate-600">
              <Link href="/" className="hover:text-slate-900">
                Dashboard
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
          <Link
            href={`/sites/${site.id}/new-shift`}
            className="rounded-md bg-[#1E3A8A] px-4 py-2 text-sm font-medium text-white hover:bg-[#1E3A8A]/90"
          >
            + Schedule shift
          </Link>
        </div>

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
                    <span
                      className={`rounded-full px-2 py-1 text-xs font-medium capitalize ${
                        STATUS_COLORS[shift.status] ?? "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {shift.status.replace("_", " ")}
                    </span>
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
                          <span
                            className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${
                              TASK_COLORS[t.status] ?? "bg-slate-100 text-slate-700"
                            }`}
                          >
                            {t.status.replace("_", " ")}
                          </span>
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
