import { NextResponse } from "next/server";
import { fetchPayPeriod, computePayrollLines } from "@/lib/db";
import { createClient } from "@/lib/supabase/server";

function escape(v: string | number | null | undefined): string {
  if (v == null) return "";
  const s = String(v);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ periodId: string }> },
) {
  const { periodId } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new NextResponse("Unauthorized", { status: 401 });

  const period = await fetchPayPeriod(periodId);
  if (!period) return new NextResponse("Not found", { status: 404 });

  const lines = await computePayrollLines(period);

  const header = [
    "worker_name",
    "email",
    "hours_regular",
    "hours_overtime",
    "hours_total",
    "rate_per_hour_usd",
    "gross_pay_usd",
  ];
  const rows = lines.map((l) => [
    l.worker_name,
    l.email ?? "",
    l.hours_regular.toFixed(2),
    l.hours_overtime.toFixed(2),
    l.hours_total.toFixed(2),
    (l.rate_cents / 100).toFixed(2),
    (l.gross_cents / 100).toFixed(2),
  ]);
  const totalGross = lines.reduce((a, l) => a + l.gross_cents, 0);
  rows.push([
    "TOTAL",
    "",
    lines.reduce((a, l) => a + l.hours_regular, 0).toFixed(2),
    lines.reduce((a, l) => a + l.hours_overtime, 0).toFixed(2),
    lines.reduce((a, l) => a + l.hours_total, 0).toFixed(2),
    "",
    (totalGross / 100).toFixed(2),
  ]);

  const csv = [header, ...rows].map((r) => r.map(escape).join(",")).join("\n");
  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="ewm_payroll_${period.starts_on}_to_${period.ends_on}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
