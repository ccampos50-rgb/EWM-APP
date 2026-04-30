import Link from "next/link";
import { fetchSites } from "@/lib/db";
import { signOut } from "../login/actions";

export default async function SitesPage() {
  const sites = await fetchSites();

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
              <Link href="/sites" className="font-medium text-slate-900">
                Sites
              </Link>
              <Link href="/workers" className="hover:text-slate-900">
                Workers
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
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Sites</h1>
            <p className="mt-1 text-sm text-slate-500">{sites.length} total</p>
          </div>
          <Link
            href="/sites/new"
            className="rounded-md bg-[#0E3D52] px-4 py-2 text-sm font-medium text-white hover:bg-[#0E3D52]/90"
          >
            + New site
          </Link>
        </div>

        {sites.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-300 bg-white p-12 text-center">
            <p className="text-sm text-slate-500">
              No sites yet.{" "}
              <Link href="/sites/new" className="font-medium text-[#5EB4CC] hover:underline">
                Create your first site
              </Link>
              .
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-6 py-3">Site</th>
                  <th className="px-6 py-3">Customer</th>
                  <th className="px-6 py-3">Vertical</th>
                  <th className="px-6 py-3">Address</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {sites.map((site) => (
                  <tr key={site.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 font-medium text-slate-900">{site.name}</td>
                    <td className="px-6 py-4 text-slate-700">{site.customer?.name ?? "—"}</td>
                    <td className="px-6 py-4 capitalize text-slate-700">
                      {site.customer?.vertical.replace("_", " ") ?? "—"}
                    </td>
                    <td className="px-6 py-4 text-slate-500">{site.address ?? "—"}</td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        href={`/sites/${site.id}`}
                        className="text-sm font-medium text-[#5EB4CC] hover:underline"
                      >
                        Open →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
