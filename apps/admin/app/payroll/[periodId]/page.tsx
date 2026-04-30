import Link from "next/link";
import { notFound } from "next/navigation";
import { fetchPayPeriod, computePayrollLines } from "@/lib/db";
import { signOut } from "../../login/actions";
import { LockButton, ReopenButton, MarkPaidForm } from "./period-actions";

const STATUS_COLORS: Record<string, string> = {
  open: "bg-slate-100 text-slate-700",
  locked: "bg-amber-100 text-amber-700",
  paid: "bg-emerald-100 text-emerald-700",
};

function fmtUsd(cents: number): string {
  return (cents / 100).toLocaleString("en-US", { style: "currency", currency: "USD" });
}

export default async function PayPeriodPage({
  params,
}: {
  params: Promise<{ periodId: string }>;
}) {
  const { periodId } = await params;
  const period = await fetchPayPeriod(periodId);
  if (!period) notFound();

  const lines = await computePayrollLines(period);
  const totalHours = lines.reduce((a, l) => a + l.hours_total, 0);
  const totalOt = lines.reduce((a, l) => a + l.hours_overtime, 0);
  const totalGross = lines.reduce((a, l) => a + l.gross_cents, 0);
  const workersWithoutWage = lines.filter((l) => l.rate_cents === 0).length;

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-6">
            <Link href="/" className="text-xl font-bold text-[#1E3A8A]">EWM</Link>
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
        <Link href="/payroll" className="text-sm text-slate-500 hover:text-slate-900">
          ← All pay periods
        </Link>

        <div className="mt-2 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">
              Week of {period.starts_on} → {period.ends_on}
            </h1>
            <div className="mt-2 flex items-center gap-2">
              <span className={`rounded-full px-2 py-1 text-xs font-medium capitalize ${STATUS_COLORS[period.status]}`}>
                {period.status}
              </span>
              {period.paid_at && (
                <span className="text-xs text-slate-500">
                  Paid {period.paid_at.slice(0, 10)}
                  {period.paid_note ? ` · ${period.paid_note}` : ""}
                </span>
              )}
            </div>
          </div>
          <div className="flex flex-wrap items-end gap-2">
            <a
              href={`/payroll/${periodId}/csv`}
              className="rounded-md border border-[#1E3A8A] px-3 py-1.5 text-sm font-medium text-[#1E3A8A] hover:bg-[#1E3A8A]/5"
            >
              Download CSV
            </a>
            {period.status === "open" && <LockButton periodId={periodId} />}
            {period.status === "locked" && <MarkPaidForm periodId={periodId} />}
            {period.status !== "open" && <ReopenButton periodId={periodId} />}
          </div>
        </div>

        <section className="mt-8 grid gap-4 md:grid-cols-4">
          <Card title="Workers" value={String(lines.length)} hint="With clocked-in time" />
          <Card title="Hours" value={totalHours.toFixed(1)} hint="Regular + OT" />
          <Card title="OT hours" value={totalOt.toFixed(1)} hint="Above 40/week" emphasize={totalOt > 0} />
          <Card title="Gross pay" value={fmtUsd(totalGross)} hint="Before deductions" />
        </section>

        {workersWithoutWage > 0 && (
          <p className="mt-6 rounded-md bg-amber-50 px-4 py-3 text-sm text-amber-800">
            <b>{workersWithoutWage}</b> worker{workersWithoutWage === 1 ? "" : "s"} have hours but no
            wage on file. Their gross will show as $0.00. Set wages on the worker detail page.
          </p>
        )}

        <section className="mt-8 overflow-hidden rounded-lg border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-6 py-2">Worker</th>
                <th className="px-6 py-2">Email</th>
                <th className="px-6 py-2 text-right">Reg hrs</th>
                <th className="px-6 py-2 text-right">OT hrs</th>
                <th className="px-6 py-2 text-right">Total hrs</th>
                <th className="px-6 py-2 text-right">Rate</th>
                <th className="px-6 py-2 text-right">Gross</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {lines.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-sm text-slate-500">
                    No clocked-in time recorded for this week.
                  </td>
                </tr>
              ) : (
                lines.map((l) => (
                  <tr key={l.worker_id} className="hover:bg-slate-50">
                    <td className="px-6 py-3">
                      <Link
                        href={`/workers/${l.worker_id}`}
                        className="font-medium text-slate-900 hover:text-[#0EA5E9]"
                      >
                        {l.worker_name}
                      </Link>
                    </td>
                    <td className="px-6 py-3 text-slate-700">{l.email ?? "—"}</td>
                    <td className="px-6 py-3 text-right font-mono">{l.hours_regular.toFixed(2)}</td>
                    <td className="px-6 py-3 text-right font-mono text-amber-700">
                      {l.hours_overtime > 0 ? l.hours_overtime.toFixed(2) : "—"}
                    </td>
                    <td className="px-6 py-3 text-right font-mono font-medium">{l.hours_total.toFixed(2)}</td>
                    <td className="px-6 py-3 text-right font-mono text-slate-700">
                      {l.rate_cents > 0 ? `$${(l.rate_cents / 100).toFixed(2)}` : <span className="text-amber-700">no wage</span>}
                    </td>
                    <td className="px-6 py-3 text-right font-mono font-medium">{fmtUsd(l.gross_cents)}</td>
                  </tr>
                ))
              )}
            </tbody>
            {lines.length > 0 && (
              <tfoot className="bg-slate-50">
                <tr>
                  <td colSpan={2} className="px-6 py-3 text-right font-medium text-slate-700">
                    Totals
                  </td>
                  <td className="px-6 py-3 text-right font-mono font-medium">
                    {lines.reduce((a, l) => a + l.hours_regular, 0).toFixed(2)}
                  </td>
                  <td className="px-6 py-3 text-right font-mono font-medium text-amber-700">
                    {totalOt.toFixed(2)}
                  </td>
                  <td className="px-6 py-3 text-right font-mono font-medium">{totalHours.toFixed(2)}</td>
                  <td></td>
                  <td className="px-6 py-3 text-right font-mono text-base font-semibold text-emerald-600">
                    {fmtUsd(totalGross)}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </section>
      </main>
    </div>
  );
}

function Card({
  title,
  value,
  hint,
  emphasize,
}: {
  title: string;
  value: string;
  hint: string;
  emphasize?: boolean;
}) {
  return (
    <div className={`rounded-lg border bg-white p-5 shadow-sm ${emphasize ? "border-amber-300" : "border-slate-200"}`}>
      <div className="text-xs font-medium uppercase tracking-wide text-slate-500">{title}</div>
      <div className={`mt-2 text-2xl font-semibold ${emphasize ? "text-amber-700" : "text-slate-900"}`}>
        {value}
      </div>
      <div className="mt-1 text-xs text-slate-500">{hint}</div>
    </div>
  );
}
