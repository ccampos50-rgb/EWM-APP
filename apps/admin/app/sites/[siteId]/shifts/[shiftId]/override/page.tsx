import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { fetchSite } from "@/lib/db";
import { OverrideForm } from "./override-form";

export default async function OverridePage({
  params,
}: {
  params: Promise<{ siteId: string; shiftId: string }>;
}) {
  const { siteId, shiftId } = await params;
  const site = await fetchSite(siteId);
  if (!site) notFound();

  const supabase = await createClient();
  const { data: shift } = await supabase
    .from("shifts")
    .select(`
      id, scheduled_start, scheduled_end, actual_start, actual_end, status,
      worker:profiles!shifts_worker_id_fkey(full_name, email)
    `)
    .eq("id", shiftId)
    .maybeSingle();

  if (!shift) notFound();

  const worker = Array.isArray(shift.worker) ? shift.worker[0] : shift.worker;

  const { data: priorOverrides } = await supabase
    .from("shift_overrides")
    .select(`
      id, kind, reason, created_at,
      supervisor:profiles!shift_overrides_supervisor_id_fkey(full_name)
    `)
    .eq("shift_id", shiftId)
    .order("created_at", { ascending: false });

  return (
    <div className="min-h-screen bg-slate-50">
      <main className="mx-auto max-w-2xl px-6 py-10">
        <Link
          href={`/sites/${siteId}`}
          className="text-sm text-slate-500 hover:text-slate-900"
        >
          ← Back to {site.name}
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-slate-900">Supervisor override</h1>
        <p className="mt-1 text-sm text-slate-500">
          {worker?.full_name ?? "Unassigned"} ·{" "}
          {new Date(shift.scheduled_start).toLocaleString()} · status:{" "}
          <span className="capitalize">{shift.status.replace("_", " ")}</span>
        </p>

        <OverrideForm siteId={siteId} shiftId={shiftId} currentStatus={shift.status} />

        {priorOverrides && priorOverrides.length > 0 && (
          <section className="mt-10">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
              Prior overrides ({priorOverrides.length})
            </h2>
            <ul className="space-y-3">
              {priorOverrides.map((o) => {
                const sup = Array.isArray(o.supervisor) ? o.supervisor[0] : o.supervisor;
                return (
                  <li
                    key={o.id}
                    className="rounded-md border border-slate-200 bg-white p-4 text-sm"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium capitalize text-slate-900">
                        {o.kind.replace("_", " ")}
                      </span>
                      <span className="text-xs text-slate-500">
                        {new Date(o.created_at).toLocaleString()}
                      </span>
                    </div>
                    <p className="mt-1 text-slate-600">{o.reason}</p>
                    {sup?.full_name && (
                      <p className="mt-1 text-xs text-slate-500">by {sup.full_name}</p>
                    )}
                  </li>
                );
              })}
            </ul>
          </section>
        )}
      </main>
    </div>
  );
}
