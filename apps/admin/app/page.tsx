import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { fetchDashboardStats } from "@/lib/db";
import { signOut } from "./login/actions";
import { AltusMark } from "@/components/altus-mark";

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

  const stats = await fetchDashboardStats();
  const completionPct =
    stats.tasksTotal > 0 ? Math.round((stats.tasksDone / stats.tasksTotal) * 100) : 0;

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2" aria-label="EWM Altus">
              <AltusMark size={32} />
              <span className="altus-wordmark text-xl text-[#0E3D52]">EWM <span className="italic text-[#5EB4CC]">Altus</span></span>
            </Link>
            <nav className="flex gap-4 text-sm text-slate-600">
              <Link href="/" className="font-medium text-slate-900">
                Dashboard
              </Link>
              <Link href="/overview" className="hover:text-slate-900">
                Overview
              </Link>
              <Link href="/customers" className="hover:text-slate-900">Customers</Link>
              <Link href="/sites" className="hover:text-slate-900">
                Sites
              </Link>
              <Link href="/workers" className="hover:text-slate-900">
                Workers
              </Link>
              <Link href="/payroll" className="hover:text-slate-900">
                Payroll
              </Link>
              <Link href="/billing" className="hover:text-slate-900">
                Billing
              </Link>
              <Link href="/reports" className="hover:text-slate-900">
                Reports
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

        <section className="mt-10 grid gap-4 md:grid-cols-4">
          <DashboardCard
            title="Live sites"
            value={String(stats.liveSites)}
            hint="Sites with ≥1 worker clocked in"
          />
          <DashboardCard
            title="Workers on shift"
            value={String(stats.workersOnShift)}
            hint="Currently clocked in"
          />
          <DashboardCard
            title="Hours today"
            value={stats.hoursToday.toFixed(1)}
            hint="Sum of clocked-in time"
          />
          <DashboardCard
            title="Tasks today"
            value={`${stats.tasksDone} / ${stats.tasksTotal}`}
            hint={`${completionPct}% complete`}
          />
        </section>

        <section className="mt-10 grid gap-4 md:grid-cols-3">
          <Link href="/sites" className="rounded-lg border border-slate-200 bg-white p-5 hover:border-[#275768] hover:shadow-sm">
            <div className="text-sm font-medium text-slate-900">Sites</div>
            <p className="mt-1 text-xs text-slate-500">Live boards, schedules, geo-fence, QR codes.</p>
          </Link>
          <Link href="/workers" className="rounded-lg border border-slate-200 bg-white p-5 hover:border-[#275768] hover:shadow-sm">
            <div className="text-sm font-medium text-slate-900">Workers</div>
            <p className="mt-1 text-xs text-slate-500">Roster, hours-this-week, current task per worker.</p>
          </Link>
          <Link href="/reports" className="rounded-lg border border-slate-200 bg-white p-5 hover:border-[#275768] hover:shadow-sm">
            <div className="text-sm font-medium text-slate-900">Reports</div>
            <p className="mt-1 text-xs text-slate-500">Daily totals, template performance, incidents.</p>
          </Link>
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
