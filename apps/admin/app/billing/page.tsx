import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "../login/actions";

type CustomerSummary = {
  customer: { id: string; name: string; vertical: string };
  rates: Array<{ id: string; unit_type: string; rate_code: string; unit_price_cents: number }>;
  currentMonth: {
    totalUnits: number;
    totalCents: number;
    lineCount: number;
  };
};

export default async function BillingPage() {
  const supabase = await createClient();

  const { data: customers } = await supabase
    .from("customers")
    .select("id, name, vertical")
    .order("name");

  // Gather rates + this-month billing_lines per customer in parallel
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const summaries: CustomerSummary[] = await Promise.all(
    (customers ?? []).map(async (c) => {
      const [ratesRes, linesRes] = await Promise.all([
        supabase
          .from("customer_rates")
          .select("id, unit_type, rate_code, unit_price_cents")
          .eq("customer_id", c.id)
          .order("unit_type"),
        supabase
          .from("billing_lines")
          .select("unit_count, amount_cents")
          .eq("customer_id", c.id)
          .gte("bill_date", startOfMonth.toISOString().slice(0, 10)),
      ]);

      const lines = linesRes.data ?? [];
      return {
        customer: c,
        rates: ratesRes.data ?? [],
        currentMonth: {
          totalUnits: lines.reduce((s, l) => s + (l.unit_count ?? 0), 0),
          totalCents: lines.reduce((s, l) => s + (l.amount_cents ?? 0), 0),
          lineCount: lines.length,
        },
      };
    }),
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-6">
            <Link href="/" className="altus-wordmark text-xl text-[#0E3D52]">EWM <span className="italic text-[#5EB4CC]">Altus</span></Link>
            <nav className="flex gap-4 text-sm text-slate-600">
              <Link href="/" className="hover:text-slate-900">Dashboard</Link>
              <Link href="/overview" className="hover:text-slate-900">Overview</Link>
              <Link href="/sites" className="hover:text-slate-900">Sites</Link>
              <Link href="/workers" className="hover:text-slate-900">Workers</Link>
              <Link href="/billing" className="font-medium text-slate-900">Billing</Link>
              <Link href="/payroll" className="hover:text-slate-900">Payroll</Link>
              <Link href="/audit" className="hover:text-slate-900">Audit</Link>
            </nav>
          </div>
          <form action={signOut} className="flex items-center gap-3"><a href="https://elevated-workforce.com" target="_blank" rel="noopener" className="rounded-full border border-slate-300 bg-white px-3 py-1 text-xs font-medium text-slate-700 transition hover:border-[#5EB4CC] hover:text-[#5EB4CC]">EWM &#8599;</a>
            <button className="text-sm font-medium text-slate-600 hover:text-slate-900">Sign out</button>
          </form>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-10">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-slate-900">Billing</h1>
          <p className="mt-1 text-sm text-slate-500">
            Per-customer rates and current month-to-date billing. CSV exports drop nightly to the{" "}
            <code className="text-xs">billing-exports</code> bucket.
          </p>
        </div>

        {summaries.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-300 bg-white p-12 text-center">
            <p className="text-sm text-slate-500">No customers yet.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {summaries.map((s) => (
              <div
                key={s.customer.id}
                className="overflow-hidden rounded-lg border border-slate-200 bg-white"
              >
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 bg-slate-50 px-6 py-4">
                  <div>
                    <Link
                      href={`/billing/${s.customer.id}`}
                      className="text-sm font-semibold text-slate-900 hover:text-[#5EB4CC]"
                    >
                      {s.customer.name} →
                    </Link>
                    <div className="text-xs capitalize text-slate-500">
                      {s.customer.vertical.replace("_", " ")}
                    </div>
                  </div>
                  <div className="flex gap-6 text-sm">
                    <div>
                      <div className="text-xs text-slate-500">MTD units</div>
                      <div className="font-semibold text-slate-900">{s.currentMonth.totalUnits}</div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500">MTD total</div>
                      <div className="font-semibold text-emerald-600">
                        {(s.currentMonth.totalCents / 100).toLocaleString("en-US", {
                          style: "currency",
                          currency: "USD",
                        })}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500">Lines</div>
                      <div className="font-semibold text-slate-900">{s.currentMonth.lineCount}</div>
                    </div>
                  </div>
                </div>

                <div className="px-6 py-4">
                  <div className="mb-2 text-xs font-medium uppercase tracking-wider text-slate-500">
                    Rate schedule
                  </div>
                  {s.rates.length === 0 ? (
                    <p className="text-sm text-slate-500">
                      No rates configured. Add rates via the Supabase dashboard (
                      <code className="text-xs">customer_rates</code> table) or run the 0004 migration to
                      seed defaults.
                    </p>
                  ) : (
                    <table className="w-full text-sm">
                      <thead className="text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                        <tr>
                          <th className="py-2">Unit type</th>
                          <th className="py-2">Rate code</th>
                          <th className="py-2 text-right">Price per unit</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {s.rates.map((r) => (
                          <tr key={r.id}>
                            <td className="py-2 text-slate-900">{r.unit_type}</td>
                            <td className="py-2 text-slate-600">{r.rate_code}</td>
                            <td className="py-2 text-right font-mono text-slate-900">
                              {(r.unit_price_cents / 100).toLocaleString("en-US", {
                                style: "currency",
                                currency: "USD",
                              })}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
