"use client";

import { useActionState } from "react";
import type { WorkerWageRow } from "@/lib/db";
import { setWorkerWage } from "../../payroll/actions";

type State = { error?: string; ok?: boolean } | null;

export function WageEditor({
  workerId,
  history,
}: {
  workerId: string;
  history: WorkerWageRow[];
}) {
  const [state, formAction, pending] = useActionState<State, FormData>(
    setWorkerWage.bind(null, workerId),
    null,
  );
  const today = new Date().toISOString().slice(0, 10);
  const current = history.find((w) => w.effective_to == null);

  return (
    <div>
      <div className="mb-4 flex items-baseline justify-between">
        <div>
          <div className="text-xs font-medium uppercase tracking-wide text-slate-500">Current rate</div>
          <div className="mt-1 text-2xl font-semibold text-slate-900">
            {current ? `$${(current.hourly_rate_cents / 100).toFixed(2)}/hr` : "Not set"}
          </div>
          {current && (
            <div className="text-xs text-slate-500">since {current.effective_from}</div>
          )}
        </div>
      </div>

      <form action={formAction} className="grid gap-3 rounded-md border border-slate-200 bg-slate-50 p-4 sm:grid-cols-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">New rate ($/hr)</label>
          <input
            type="number"
            name="hourly_rate"
            step="0.01"
            min="0"
            required
            placeholder="15.50"
            className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">Effective from</label>
          <input
            type="date"
            name="effective_from"
            defaultValue={today}
            className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
          />
        </div>
        <div className="flex items-end">
          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-md bg-[#0E3D52] px-3 py-1.5 text-sm font-medium text-white hover:bg-[#0E3D52]/90 disabled:opacity-60"
          >
            {pending ? "Saving…" : "Update wage"}
          </button>
        </div>
        {state?.error && <p className="col-span-full rounded-md bg-red-50 px-3 py-2 text-xs text-red-700">{state.error}</p>}
        {state?.ok && <p className="col-span-full rounded-md bg-emerald-50 px-3 py-2 text-xs text-emerald-700">Wage updated.</p>}
      </form>

      {history.length > 0 && (
        <div className="mt-4">
          <div className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500">History</div>
          <table className="w-full text-sm">
            <tbody className="divide-y divide-slate-100">
              {history.map((w) => (
                <tr key={w.id}>
                  <td className="py-2 font-mono text-slate-900">${(w.hourly_rate_cents / 100).toFixed(2)}/hr</td>
                  <td className="py-2 text-xs text-slate-500">
                    {w.effective_from} → {w.effective_to ?? "ongoing"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
