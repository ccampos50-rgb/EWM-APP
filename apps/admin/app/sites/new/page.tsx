import Link from "next/link";
import { fetchCustomers } from "@/lib/db";
import { SiteForm } from "../site-form";
import { createSite } from "./actions";
import { signOut } from "../../login/actions";

export default async function NewSitePage() {
  const customers = await fetchCustomers();

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-6">
            <Link href="/" className="text-xl font-bold text-[#1E3A8A]">
              EWM
            </Link>
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
        <Link href="/sites" className="text-sm text-slate-500 hover:text-slate-900">
          ← Back to sites
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-slate-900">New site</h1>
        <p className="mt-1 text-sm text-slate-500">
          A site is a physical location where workers deploy. The geo-fence determines
          where workers are allowed to clock in.
        </p>

        <SiteForm
          customers={customers}
          action={createSite}
          submitLabel="Create site"
          pendingLabel="Creating site…"
        />
      </main>
    </div>
  );
}
