import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { fetchBillingLinesForMonth } from "@/lib/db";

function monthLabel(iso: string): string {
  const [y, m] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

function fmtUsd(cents: number | null | undefined): string {
  if (cents == null) return "—";
  return (cents / 100).toLocaleString("en-US", { style: "currency", currency: "USD" });
}

export default async function InvoicePage({
  params,
  searchParams,
}: {
  params: Promise<{ customerId: string }>;
  searchParams: Promise<{ month?: string }>;
}) {
  const { customerId } = await params;
  const sp = await searchParams;
  const month =
    sp.month && /^\d{4}-\d{2}$/.test(sp.month)
      ? sp.month
      : new Date().toISOString().slice(0, 7);

  const supabase = await createClient();
  const { data: customer } = await supabase
    .from("customers")
    .select("id, name, vertical")
    .eq("id", customerId)
    .maybeSingle();
  if (!customer) notFound();

  const lines = await fetchBillingLinesForMonth(customerId, month);

  // Aggregate by (site, unit_type, rate_code) — invoices are easier to read this way than raw lines
  type Group = { site: string; unit: string; code: string; units: number; price: number | null; amount: number };
  const groups = new Map<string, Group>();
  for (const l of lines) {
    const key = `${l.site?.name ?? ""}|${l.unit_type}|${l.rate_code ?? ""}`;
    const cur = groups.get(key) ?? {
      site: l.site?.name ?? "—",
      unit: l.unit_type,
      code: l.rate_code ?? "—",
      units: 0,
      price: l.unit_price_cents,
      amount: 0,
    };
    cur.units += l.unit_count ?? 0;
    cur.amount += l.amount_cents ?? 0;
    groups.set(key, cur);
  }
  const groupRows = Array.from(groups.values()).sort(
    (a, b) => a.site.localeCompare(b.site) || a.unit.localeCompare(b.unit),
  );
  const totalCents = groupRows.reduce((s, r) => s + r.amount, 0);
  const invoiceNumber = `EWM-${month.replace("-", "")}-${customer.id.slice(0, 4).toUpperCase()}`;
  const invoiceDate = new Date().toISOString().slice(0, 10);

  return (
    <div className="min-h-screen bg-slate-100 print:bg-white">
      <header className="border-b border-slate-200 bg-white print:hidden">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-3">
          <Link href={`/billing/${customerId}?month=${month}`} className="text-sm text-slate-600 hover:text-slate-900">
            ← Back
          </Link>
          <button
            onClick={undefined}
            className="rounded-md bg-[#1E3A8A] px-4 py-2 text-sm font-medium text-white hover:bg-[#1E3A8A]/90 print:hidden"
            data-print-button
          >
            Print / Save as PDF
          </button>
        </div>
      </header>

      <main className="mx-auto my-8 max-w-4xl bg-white p-12 shadow-sm print:my-0 print:max-w-none print:p-8 print:shadow-none">
        <div className="flex items-start justify-between border-b border-slate-200 pb-6">
          <div>
            <div className="text-3xl font-bold text-[#1E3A8A]">EWM</div>
            <div className="mt-1 text-sm text-slate-500">Elevated Workforce Management</div>
            <div className="mt-1 text-xs text-slate-500">People. Performance. Elevated.</div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-semibold text-slate-900">INVOICE</div>
            <div className="mt-1 font-mono text-xs text-slate-500">{invoiceNumber}</div>
            <div className="mt-1 text-xs text-slate-500">Issued: {invoiceDate}</div>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-6">
          <div>
            <div className="text-xs font-medium uppercase tracking-wider text-slate-500">Bill to</div>
            <div className="mt-1 text-sm font-medium text-slate-900">{customer.name}</div>
            <div className="text-xs capitalize text-slate-500">{customer.vertical.replace("_", " ")}</div>
          </div>
          <div>
            <div className="text-xs font-medium uppercase tracking-wider text-slate-500">Period</div>
            <div className="mt-1 text-sm font-medium text-slate-900">{monthLabel(month)}</div>
          </div>
        </div>

        <table className="mt-8 w-full text-sm">
          <thead className="border-b-2 border-slate-300 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
            <tr>
              <th className="py-2">Site</th>
              <th className="py-2">Unit type</th>
              <th className="py-2">Rate code</th>
              <th className="py-2 text-right">Units</th>
              <th className="py-2 text-right">Rate</th>
              <th className="py-2 text-right">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {groupRows.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-sm text-slate-500">
                  No charges for {monthLabel(month)}.
                </td>
              </tr>
            ) : (
              groupRows.map((r, i) => (
                <tr key={i}>
                  <td className="py-2 text-slate-900">{r.site}</td>
                  <td className="py-2 capitalize text-slate-700">{r.unit}</td>
                  <td className="py-2 text-slate-500">{r.code}</td>
                  <td className="py-2 text-right font-mono">{r.units}</td>
                  <td className="py-2 text-right font-mono text-slate-700">{fmtUsd(r.price)}</td>
                  <td className="py-2 text-right font-mono font-medium text-slate-900">{fmtUsd(r.amount)}</td>
                </tr>
              ))
            )}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-slate-300">
              <td colSpan={5} className="pt-3 text-right text-sm font-semibold text-slate-700">
                Total due
              </td>
              <td className="pt-3 text-right font-mono text-lg font-bold text-[#1E3A8A]">
                {fmtUsd(totalCents)}
              </td>
            </tr>
          </tfoot>
        </table>

        <div className="mt-12 border-t border-slate-200 pt-6 text-xs text-slate-500">
          Payment due net 30. Questions? Contact billing@elevated-workforce.com.
          <br />
          Generated by EWM Admin · {new Date().toISOString()}
        </div>
      </main>

      <PrintScript />
    </div>
  );
}

function PrintScript() {
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `
          document.addEventListener('click', function(e) {
            var t = e.target;
            while (t && t !== document.body) {
              if (t.dataset && t.dataset.printButton !== undefined) { window.print(); return; }
              t = t.parentNode;
            }
          });
        `,
      }}
    />
  );
}
