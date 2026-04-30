import { NextResponse } from "next/server";
import { fetchBillingLinesForMonth } from "@/lib/db";
import { createClient } from "@/lib/supabase/server";

function escape(v: string | number | null | undefined): string {
  if (v == null) return "";
  const s = String(v);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ customerId: string }> },
) {
  const { customerId } = await params;
  const url = new URL(request.url);
  const monthParam = url.searchParams.get("month") ?? "";
  const month = /^\d{4}-\d{2}$/.test(monthParam)
    ? monthParam
    : new Date().toISOString().slice(0, 7);

  // Auth check (RLS applies via the supabase client too, but bail early if unauthed)
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { data: customer } = await supabase
    .from("customers")
    .select("name")
    .eq("id", customerId)
    .maybeSingle();

  const lines = await fetchBillingLinesForMonth(customerId, month);

  const header = [
    "bill_date",
    "site",
    "unit_type",
    "rate_code",
    "unit_count",
    "unit_price_cents",
    "amount_cents",
    "amount_usd",
  ];
  const rows = lines.map((l) => [
    l.bill_date,
    l.site?.name ?? "",
    l.unit_type,
    l.rate_code ?? "",
    l.unit_count,
    l.unit_price_cents ?? "",
    l.amount_cents ?? "",
    l.amount_cents != null ? (l.amount_cents / 100).toFixed(2) : "",
  ]);
  const totalCents = lines.reduce((s, l) => s + (l.amount_cents ?? 0), 0);
  rows.push([
    "TOTAL",
    "",
    "",
    "",
    String(lines.reduce((s, l) => s + l.unit_count, 0)),
    "",
    String(totalCents),
    (totalCents / 100).toFixed(2),
  ]);

  const csv = [header, ...rows].map((row) => row.map(escape).join(",")).join("\n");

  const safeName = (customer?.name ?? "customer").replace(/[^a-z0-9]+/gi, "_").toLowerCase();
  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="ewm_billing_${safeName}_${month}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
