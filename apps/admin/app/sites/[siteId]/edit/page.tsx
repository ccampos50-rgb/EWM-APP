import Link from "next/link";
import { notFound } from "next/navigation";
import { fetchCustomers, fetchSite } from "@/lib/db";
import { EditSiteFormWrapper } from "./edit-form-wrapper";
import { signOut } from "../../../login/actions";

export default async function EditSitePage({
  params,
}: {
  params: Promise<{ siteId: string }>;
}) {
  const { siteId } = await params;
  const [site, customers] = await Promise.all([fetchSite(siteId), fetchCustomers()]);
  if (!site) notFound();

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-6">
            <Link href="/" className="altus-wordmark text-xl text-[#0E3D52]">EWM <span className="italic text-[#5EB4CC]">Altus</span></Link>
            <nav className="flex gap-4 text-sm text-slate-600">
              <Link href="/" className="hover:text-slate-900">Dashboard</Link>
              <Link href="/sites" className="font-medium text-slate-900">Sites</Link>
              <Link href="/workers" className="hover:text-slate-900">Workers</Link>
            </nav>
          </div>
          <form action={signOut}>
            <button className="text-sm font-medium text-slate-600 hover:text-slate-900">Sign out</button>
          </form>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-10">
        <Link href={`/sites/${siteId}`} className="text-sm text-slate-500 hover:text-slate-900">
          ← Back to {site.name}
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-slate-900">Edit site</h1>
        <p className="mt-1 text-sm text-slate-500">
          Changing latitude/longitude or radius takes effect on the worker's next clock-in.
        </p>

        <EditSiteFormWrapper site={site} customers={customers} />
      </main>
    </div>
  );
}
