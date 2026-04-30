import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "../login/actions";

const TASK_COLORS: Record<string, string> = {
  assigned: "bg-slate-100 text-slate-700",
  in_progress: "bg-sky-100 text-sky-700",
  done: "bg-emerald-100 text-emerald-700",
  blocked: "bg-red-100 text-red-700",
  skipped: "bg-slate-100 text-slate-500",
};

function fmtUsd(cents: number): string {
  return (cents / 100).toLocaleString("en-US", { style: "currency", currency: "USD" });
}

export default async function CustomerPortalPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .maybeSingle();

  // Find the customer this user is scoped to (the first customer-scoped role)
  const { data: rolesData } = await supabase
    .from("user_roles")
    .select("role, scope_customer_id, scope_site_id, scope_kind")
    .eq("profile_id", user.id);
  const customerScopedRole = (rolesData ?? []).find((r) => r.scope_kind === "customer" && r.scope_customer_id);

  if (!customerScopedRole) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Header email={user.email ?? ""} />
        <main className="mx-auto max-w-3xl px-6 py-16 text-center">
          <h1 className="text-xl font-semibold text-slate-900">No customer access</h1>
          <p className="mt-2 text-sm text-slate-600">
            Your account isn't linked to a customer yet. Ask your EWM contact to grant access.
          </p>
        </main>
      </div>
    );
  }

  const customerId = customerScopedRole.scope_customer_id!;

  const { data: customer } = await supabase
    .from("customers")
    .select("id, name, vertical")
    .eq("id", customerId)
    .maybeSingle();

  const { data: sites } = await supabase
    .from("sites")
    .select("id, name, address")
    .eq("customer_id", customerId)
    .order("name");

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);

  const { data: shiftsToday } = await supabase
    .from("shifts")
    .select("id, status, site_id, worker_id, scheduled_start, actual_start, worker:profiles!shifts_worker_id_fkey(full_name)")
    .gte("scheduled_start", startOfDay.toISOString())
    .lte("scheduled_start", endOfDay.toISOString());

  const shiftsTodayList = ((shiftsToday ?? []) as unknown as Array<{
    id: string;
    status: string;
    site_id: string;
    worker_id: string;
    scheduled_start: string;
    actual_start: string | null;
    worker: { full_name: string } | null;
  }>);

  const todayShiftIds = shiftsTodayList.map((s) => s.id);
  const { data: tasksToday } =
    todayShiftIds.length > 0
      ? await supabase.from("tasks").select("status, photo_url, target_ref, template:task_templates(label)").in("shift_id", todayShiftIds)
      : { data: [] };
  const tasksTodayList = ((tasksToday ?? []) as unknown as Array<{
    status: string;
    photo_url: string | null;
    target_ref: string | null;
    template: { label: string } | null;
  }>);

  const tasksDone = tasksTodayList.filter((t) => t.status === "done").length;
  const tasksTotal = tasksTodayList.length;
  const photoCount = tasksTodayList.filter((t) => t.photo_url).length;
  const workersClockedIn = shiftsTodayList.filter((s) => s.status === "clocked_in").length;
  const workersScheduled = shiftsTodayList.length;

  const { data: linesMtd } = await supabase
    .from("billing_lines")
    .select("amount_cents, unit_count")
    .eq("customer_id", customerId)
    .gte("bill_date", startOfMonth.toISOString().slice(0, 10));
  const mtdCents = (linesMtd ?? []).reduce((s, l) => s + (l.amount_cents ?? 0), 0);
  const mtdUnits = (linesMtd ?? []).reduce((s, l) => s + (l.unit_count ?? 0), 0);

  const monthLabel = new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" });

  return (
    <div className="min-h-screen bg-slate-50">
      <Header email={user.email ?? ""} customer={customer?.name} />

      <main className="mx-auto max-w-6xl px-6 py-10">
        <h1 className="text-2xl font-semibold text-slate-900">
          Welcome{profile?.full_name ? `, ${profile.full_name}` : ""}.
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          {customer?.name} ·{" "}
          <span className="capitalize">{customer?.vertical?.replace("_", " ")}</span>
          {sites && sites.length > 0 && (
            <> · {sites.length} site{sites.length === 1 ? "" : "s"}</>
          )}
        </p>

        <section className="mt-8 grid gap-4 md:grid-cols-4">
          <Card title="Workers on shift today" value={`${workersClockedIn} / ${workersScheduled}`} hint="Clocked in / scheduled" />
          <Card title="Tasks today" value={`${tasksDone} / ${tasksTotal}`} hint={tasksTotal === 0 ? "No tasks scheduled" : `${Math.round((tasksDone / Math.max(1, tasksTotal)) * 100)}% complete`} />
          <Card title="Photos uploaded today" value={String(photoCount)} hint="Proof of work attached" />
          <Card title={`${monthLabel} billing`} value={fmtUsd(mtdCents)} hint={`${mtdUnits} units · MTD`} accent />
        </section>

        <section className="mt-10">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-500">
            Today's activity
          </h2>
          {shiftsTodayList.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-500">
              No workers scheduled today.
            </div>
          ) : (
            <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-6 py-2">Worker</th>
                    <th className="px-6 py-2">Scheduled</th>
                    <th className="px-6 py-2">Status</th>
                    <th className="px-6 py-2">Clocked in</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {shiftsTodayList.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50">
                      <td className="px-6 py-3 font-medium text-slate-900">{s.worker?.full_name ?? "—"}</td>
                      <td className="px-6 py-3 font-mono text-xs text-slate-700">
                        {new Date(s.scheduled_start).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
                      </td>
                      <td className="px-6 py-3">
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${TASK_COLORS[s.status] ?? "bg-slate-100"}`}>
                          {s.status.replace("_", " ")}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-xs text-slate-500">
                        {s.actual_start
                          ? new Date(s.actual_start).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
                          : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="mt-10 grid gap-4 md:grid-cols-2">
          <Link
            href={`/billing/${customerId}`}
            className="rounded-lg border border-slate-200 bg-white p-5 hover:border-[#275768] hover:shadow-sm"
          >
            <div className="text-sm font-medium text-slate-900">Billing & Invoices →</div>
            <p className="mt-1 text-xs text-slate-500">
              {monthLabel} total: <b>{fmtUsd(mtdCents)}</b>. View line items, download CSV, or print invoice.
            </p>
          </Link>
          <Link
            href="/sites"
            className="rounded-lg border border-slate-200 bg-white p-5 hover:border-[#275768] hover:shadow-sm"
          >
            <div className="text-sm font-medium text-slate-900">Sites →</div>
            <p className="mt-1 text-xs text-slate-500">
              See live activity, schedules, photo proofs, and worker rosters.
            </p>
          </Link>
        </section>
      </main>
    </div>
  );
}

function Header({ email, customer }: { email: string; customer?: string }) {
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/portal" className="flex items-center gap-2" aria-label="EWM">
          <img src="/ewm-logo.png" alt="EWM" className="h-8 w-auto" />
          {customer && <span className="ml-3 text-sm text-slate-500">· {customer}</span>}
        </Link>
        <div className="flex items-center gap-4 text-sm text-slate-600">
          <span>{email}</span>
          <form action={signOut}>
            <button className="font-medium hover:text-slate-900">Sign out</button>
          </form>
        </div>
      </div>
    </header>
  );
}

function Card({
  title,
  value,
  hint,
  accent,
}: {
  title: string;
  value: string;
  hint: string;
  accent?: boolean;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="text-xs font-medium uppercase tracking-wide text-slate-500">{title}</div>
      <div className={`mt-2 text-3xl font-semibold ${accent ? "text-emerald-600" : "text-slate-900"}`}>
        {value}
      </div>
      <div className="mt-1 text-xs text-slate-500">{hint}</div>
    </div>
  );
}
