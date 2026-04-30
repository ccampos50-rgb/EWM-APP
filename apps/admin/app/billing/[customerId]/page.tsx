import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { fetchBillingLinesForMonth, fetchCustomerRates } from "@/lib/db";
import { signOut } from "../../login/actions";
import { RateEditor } from "./rate-editor";

function currentMonthIso(): string {
  const d = new Date();
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(iso: string): string {
  const [y, m] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

function offsetMonth(iso: string, by: number): string {
  const [y, m] = iso.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1 + by, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

export default async function CustomerBillingPage({
  params,
  searchParams,
}: {
  params: Promise<{ customerId: string }>;
  searchParams: Promise<{ month?: string }>;
}) {
  const { customerId } = await params;
  const sp = await searchParams;
  const month = sp.month && /^\d{4}-\d{2}$/.test(sp.month) ? sp.month : currentMonthIso();

  const supabase = await createClient();
  const { data: customer } = await supabase
    .from("customers")
    .select("id, name, vertical")
    .eq("id", customerId)
    .maybeSingle();
  if (!customer) notFound();

  const [rates, lines] = await Promise.all([
    fetchCustomerRates(customerId),
    fetchBillingLinesForMonth(customerId, month),
  ]);

  const totalCents = lines.reduce((s, l) => s + (l.amount_cents ?? 0), 0);
  const totalUnits = lines.reduce((s, l) => s + (l.unit_count ?? 0), 0);
  const totalsByUnit = new Map<string, { units: number; cents: number }>();
  for (const l of lines) {
    const key = l.unit_type;
    const cur = totalsByUnit.get(key) ?? { units: 0, cents: 0 };
    cur.units += l.unit_count ?? 0;
    cur.cents += l.amount_cents ?? 0;
    totalsByUnit.set(key, cur);
  }

  const prevMonth = offsetMonth(month, -1);
  const nextMonth = offsetMonth(month, 1);

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
              <Link href="/billing" className="font-medium text-slate-900">Billing</Link>
            </nav>
          </div>
          <form action={signOut}>
            <button className="text-sm font-medium text-slate-600 hover:text-slate-900">Sign out</button>
          </form>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-10">
        <Link href="/billing" className="text-sm text-slate-500 hover:text-slate-900">← All customers</Link>
        <div className="mt-2 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">{customer.name}</h1>
            <p className="mt-1 text-sm capitalize text-slate-500">{customer.vertical.replace("_", " ")}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={`/billing/${customerId}?month=${prevMonth}`}
              className="rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
            >
              ← {monthLabel(prevMonth)}
            </Link>
            <span className="rounded-md bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-900">
              {monthLabel(month)}
            </span>
            <Link
              href={`/billing/${customerId}?month=${nextMonth}`}
              className="rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
            >
              {monthLabel(nextMonth)} →
            </Link>
            <a
              href={`/billing/${customerId}/csv?month=${month}`}
              className="rounded-md border border-[#1E3A8A] px-3 py-1.5 text-sm font-medium text-[#1E3A8A] hover:bg-[#1E3A8A]/5"
            >
              Download CSV
            </a>
            <Link
              href={`/billing/${customerId}/invoice?month=${month}`}
              className="rounded-md bg-[#1E3A8A] px-3 py-1.5 text-sm font-medium text-white hover:bg-[#1E3A8A]/90"
            >
              View invoice
            </Link>
          </div>
        </div>

        <section className="mt-8 grid gap-4 md:grid-cols-3">
          <Card title={`${monthLabel(month)} units`} value={String(totalUnits)} hint={`${lines.length} line items`} />
          <Card
            title={`${monthLabel(month)} total`}
            value={(totalCents / 100).toLocaleString("en-US", { style: "currency", currency: "USD" })}
            hint={Array.from(totalsByUnit.entries())
              .map(([u, t]) => `${u}: ${t.units}`)
              .join(" · ") || "—"}
          />
          <Card
            title="Active rates"
            value={String(rates.filter((r) => !r.effective_to).length)}
            hint={`${rates.length} total in history`}
          />
        </section>

        <section className="mt-8 rounded-lg border border-slate-200 bg-white p-6">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-500">
            Rate schedule
          </h2>
          <RateEditor customerId={customerId} rates={rates} />
        </section>

        <section className="mt-8 rounded-lg border border-slate-200 bg-white">
          <div className="border-b border-slate-200 px-6 py-3 text-sm font-semibold uppercase tracking-wider text-slate-500">
            Line items · {monthLabel(month)}
          </div>
          {lines.length === 0 ? (
            <p className="px-6 py-8 text-center text-sm text-slate-500">
              No billing lines for this month yet. The nightly rollup populates these.
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-6 py-2">Date</th>
                  <th className="px-6 py-2">Site</th>
                  <th className="px-6 py-2">Unit type</th>
                  <th className="px-6 py-2">Rate code</th>
                  <th className="px-6 py-2 text-right">Units</th>
                  <th className="px-6 py-2 text-right">Rate</th>
                  <th className="px-6 py-2 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {lines.map((l) => (
                  <tr key={l.id} className="hover:bg-slate-50">
                    <td className="px-6 py-2 font-mono text-slate-700">{l.bill_date}</td>
                    <td className="px-6 py-2 text-slate-700">{l.site?.name ?? "—"}</td>
                    <td className="px-6 py-2 capitalize text-slate-700">{l.unit_type}</td>
                    <td className="px-6 py-2 text-slate-500">{l.rate_code ?? "—"}</td>
                    <td className="px-6 py-2 text-right font-mono">{l.unit_count}</td>
                    <td className="px-6 py-2 text-right font-mono text-slate-700">
                      {l.unit_price_cents != null ? `$${(l.unit_price_cents / 100).toFixed(2)}` : "—"}
                    </td>
                    <td className="px-6 py-2 text-right font-mono font-medium text-slate-900">
                      {l.amount_cents != null
                        ? (l.amount_cents / 100).toLocaleString("en-US", { style: "currency", currency: "USD" })
                        : "—"}
                    </td>
                  </tr>
                ))}
                <tr className="bg-slate-50">
                  <td colSpan={4} className="px-6 py-3 text-right font-medium text-slate-700">
                    Total
                  </td>
                  <td className="px-6 py-3 text-right font-mono font-medium">{totalUnits}</td>
                  <td></td>
                  <td className="px-6 py-3 text-right font-mono text-base font-semibold text-emerald-600">
                    {(totalCents / 100).toLocaleString("en-US", { style: "currency", currency: "USD" })}
                  </td>
                </tr>
              </tbody>
            </table>
          )}
        </section>
      </main>
    </div>
  );
}

function Card({ title, value, hint }: { title: string; value: string; hint: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="text-xs font-medium uppercase tracking-wide text-slate-500">{title}</div>
      <div className="mt-2 text-2xl font-semibold text-slate-900">{value}</div>
      <div className="mt-1 text-xs text-slate-500">{hint}</div>
    </div>
  );
}
