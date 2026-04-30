import Link from "next/link";
import { fetchSites, fetchWorkersForSite, fetchWorkerHours } from "@/lib/db";
import { signOut } from "../login/actions";

export default async function WorkersPage() {
  const sites = await fetchSites();
  const groups = await Promise.all(
    sites.map(async (s) => ({ site: s, workers: await fetchWorkersForSite(s.id) })),
  );

  const total = groups.reduce((acc, g) => acc + g.workers.length, 0);

  // Hours this week (last 7 days) for everyone
  const sinceWeek = new Date();
  sinceWeek.setDate(sinceWeek.getDate() - 6);
  sinceWeek.setHours(0, 0, 0, 0);
  const until = new Date();
  until.setHours(23, 59, 59, 999);
  const hoursMap = await fetchWorkerHours(sinceWeek.toISOString(), until.toISOString());

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

      <main className="mx-auto max-w-7xl px-6 py-10">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Workers</h1>
            <p className="mt-1 text-sm text-slate-500">{total} across {sites.length} site{sites.length === 1 ? "" : "s"}</p>
          </div>
          <Link
            href="/workers/new"
            className="rounded-md bg-[#0E3D52] px-4 py-2 text-sm font-medium text-white hover:bg-[#0E3D52]/90"
          >
            + Add worker
          </Link>
        </div>

        {sites.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-300 bg-white p-12 text-center">
            <p className="text-sm text-slate-500">
              No sites yet. <Link href="/sites/new" className="font-medium text-[#5EB4CC] hover:underline">Add a site</Link> first.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {groups.map(({ site, workers }) => (
              <section key={site.id} className="overflow-hidden rounded-lg border border-slate-200 bg-white">
                <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-6 py-3">
                  <div>
                    <Link href={`/sites/${site.id}`} className="text-sm font-medium text-slate-900 hover:underline">
                      {site.name}
                    </Link>
                    <span className="ml-2 text-xs text-slate-500">{workers.length} worker{workers.length === 1 ? "" : "s"}</span>
                  </div>
                  <Link
                    href={`/workers/new?site=${site.id}`}
                    className="text-xs font-medium text-[#5EB4CC] hover:underline"
                  >
                    + Add to this site
                  </Link>
                </div>
                {workers.length === 0 ? (
                  <p className="px-6 py-6 text-sm text-slate-500">No workers assigned yet.</p>
                ) : (
                  <table className="w-full text-sm">
                    <thead className="text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                      <tr>
                        <th className="px-6 py-2">Name</th>
                        <th className="px-6 py-2">Email</th>
                        <th className="px-6 py-2">Role</th>
                        <th className="px-6 py-2">Lang</th>
                        <th className="px-6 py-2 text-right">Hrs (7d)</th>
                        <th className="px-6 py-2"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {workers.map((w) => {
                        const hrs = hoursMap.get(w.id) ?? 0;
                        return (
                          <tr key={w.id} className="hover:bg-slate-50">
                            <td className="px-6 py-3 font-medium text-slate-900">{w.full_name}</td>
                            <td className="px-6 py-3 text-slate-700">{w.email ?? "—"}</td>
                            <td className="px-6 py-3 capitalize text-slate-700">{w.role.replace("_", " ")}</td>
                            <td className="px-6 py-3 uppercase text-slate-500">{w.preferred_language}</td>
                            <td className="px-6 py-3 text-right font-mono text-slate-900">
                              {hrs > 0 ? hrs.toFixed(1) : "—"}
                            </td>
                            <td className="px-6 py-3 text-right">
                              <Link href={`/workers/${w.id}`} className="text-xs font-medium text-[#5EB4CC] hover:underline">
                                Open →
                              </Link>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </section>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
