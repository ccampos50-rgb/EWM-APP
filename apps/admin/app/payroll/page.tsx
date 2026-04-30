import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { fetchPayPeriods, computePayrollLines } from "@/lib/db";
import { signOut } from "../login/actions";
import { NewPeriodForm } from "./new-period-form";

const STATUS_COLORS: Record<string, string> = {
  open: "bg-slate-100 text-slate-700",
  locked: "bg-amber-100 text-amber-700",
  paid: "bg-emerald-100 text-emerald-700",
};

function fmtUsd(cents: number): string {
  return (cents / 100).toLocaleString("en-US", { style: "currency", currency: "USD" });
}

export default async function PayrollPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from("profiles")
    .select("tenant_id")
    .eq("id", user?.id ?? "")
    .maybeSingle();

  const periods = profile?.tenant_id ? await fetchPayPeriods(profile.tenant_id) : [];
  // Compute totals for the most recent 4 periods (so the list view is informative)
  const recent = periods.slice(0, 4);
  const totals = await Promise.all(
    recent.map(async (p) => {
      const lines = await computePayrollLines(p);
      return {
        id: p.id,
        workers: lines.length,
        hours: lines.reduce((a, l) => a + l.hours_total, 0),
        gross: lines.reduce((a, l) => a + l.gross_cents, 0),
        ot: lines.reduce((a, l) => a + l.hours_overtime, 0),
      };
    }),
  );
  const totalsById = new Map(totals.map((t) => [t.id, t]));

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-6">
            <Link href="/" className="altus-wordmark text-xl text-[#0E3D52]">EWM <span className="italic text-[#5EB4CC]">Altus</span></Link>
            <nav className="flex gap-4 text-sm text-slate-600">
              <Link href="/" className="hover:text-slate-900">Dashboard</Link>
              <Link href="/sites" className="hover:text-slate-900">Sites</Link>
              <Link href="/workers" className="hover:text-slate-900">Workers</Link>
              <Link href="/billing" className="hover:text-slate-900">Billing</Link>
              <Link href="/payroll" className="font-medium text-slate-900">Payroll</Link>
            </nav>
          </div>
          <form action={signOut}>
            <button className="text-sm font-medium text-slate-600 hover:text-slate-900">Sign out</button>
          </form>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-10">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-slate-900">Payroll</h1>
          <p className="mt-1 text-sm text-slate-500">
            Weekly pay periods. Hours come from clock-in/out times. OT is auto-flagged at 1.5×
            for any hours above 40 in the week (FLSA).
          </p>
        </div>

        <div className="mb-6">
          <NewPeriodForm />
        </div>

        {periods.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-300 bg-white p-12 text-center">
            <p className="text-sm text-slate-500">
              No pay periods yet. Create one above for the current or past week.
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-6 py-2">Period</th>
                  <th className="px-6 py-2">Status</th>
                  <th className="px-6 py-2 text-right">Workers</th>
                  <th className="px-6 py-2 text-right">Hours</th>
                  <th className="px-6 py-2 text-right">OT hours</th>
                  <th className="px-6 py-2 text-right">Gross</th>
                  <th className="px-6 py-2 text-right">Open</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {periods.map((p) => {
                  const t = totalsById.get(p.id);
                  return (
                    <tr key={p.id} className="hover:bg-slate-50">
                      <td className="px-6 py-3">
                        <div className="font-medium text-slate-900">
                          {p.starts_on} → {p.ends_on}
                        </div>
                        {p.paid_at && (
                          <div className="text-xs text-slate-500">
                            Paid {p.paid_at.slice(0, 10)}
                            {p.paid_note ? ` · ${p.paid_note}` : ""}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-3">
                        <span className={`rounded-full px-2 py-1 text-xs font-medium capitalize ${STATUS_COLORS[p.status]}`}>
                          {p.status}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-right font-mono">{t ? t.workers : "—"}</td>
                      <td className="px-6 py-3 text-right font-mono">{t ? t.hours.toFixed(1) : "—"}</td>
                      <td className="px-6 py-3 text-right font-mono text-amber-700">{t && t.ot > 0 ? t.ot.toFixed(1) : "—"}</td>
                      <td className="px-6 py-3 text-right font-mono font-medium">
                        {t ? fmtUsd(t.gross) : "—"}
                      </td>
                      <td className="px-6 py-3 text-right">
                        <Link href={`/payroll/${p.id}`} className="text-xs font-medium text-[#5EB4CC] hover:underline">
                          Open →
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
