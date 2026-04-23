import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "./login/actions";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, tenant_id")
    .eq("id", user?.id ?? "")
    .maybeSingle();

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-6">
            <Link href="/" className="text-xl font-bold text-[#1E3A8A]">
              EWM
            </Link>
            <nav className="flex gap-4 text-sm text-slate-600">
              <Link href="/" className="font-medium text-slate-900">
                Dashboard
              </Link>
              <Link href="/overview" className="hover:text-slate-900">
                Overview
              </Link>
              <Link href="/sites" className="hover:text-slate-900">
                Sites
              </Link>
              <Link href="/billing" className="hover:text-slate-900">
                Billing
              </Link>
              <Link href="/audit" className="hover:text-slate-900">
                Audit
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
        <h1 className="text-2xl font-semibold text-slate-900">
          Welcome{profile?.full_name ? `, ${profile.full_name}` : ""}.
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Signed in as <span className="font-medium">{user?.email}</span>
        </p>

        <section className="mt-10 grid gap-4 md:grid-cols-3">
          <DashboardCard title="Live sites" value="—" hint="Sites with active shifts" />
          <DashboardCard title="Workers on shift" value="—" hint="Across all sites" />
          <DashboardCard title="Tasks today" value="—" hint="Completed / total" />
        </section>

        <section className="mt-10 rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center">
          <p className="text-sm text-slate-600">
            Live metrics wire up in Week 3. Go to{" "}
            <Link href="/sites" className="font-medium text-[#0EA5E9] hover:underline">
              Sites
            </Link>{" "}
            to view site rosters and schedule shifts.
          </p>
        </section>
      </main>
    </div>
  );
}

function DashboardCard({
  title,
  value,
  hint,
}: {
  title: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="text-xs font-medium uppercase tracking-wide text-slate-500">{title}</div>
      <div className="mt-2 text-3xl font-semibold text-slate-900">{value}</div>
      <div className="mt-1 text-xs text-slate-500">{hint}</div>
    </div>
  );
}
