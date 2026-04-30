"use client";

import { useActionState } from "react";
import { addCustomerRate, endCustomerRate } from "../actions";
import type { CustomerRateRow } from "@/lib/db";

type State = { error?: string; ok?: boolean } | null;

export function RateEditor({
  customerId,
  rates,
}: {
  customerId: string;
  rates: CustomerRateRow[];
}) {
  const [state, formAction, pending] = useActionState<State, FormData>(
    addCustomerRate.bind(null, customerId),
    null,
  );

  return (
    <div>
      <table className="w-full text-sm">
        <thead className="text-left text-xs font-medium uppercase tracking-wider text-slate-500">
          <tr>
            <th className="py-2">Unit type</th>
            <th className="py-2">Rate code</th>
            <th className="py-2 text-right">Price</th>
            <th className="py-2">Effective</th>
            <th className="py-2 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rates.length === 0 ? (
            <tr>
              <td colSpan={5} className="py-4 text-center text-sm text-slate-500">
                No rates configured.
              </td>
            </tr>
          ) : (
            rates.map((r) => {
              const ended = r.effective_to != null;
              return (
                <tr key={r.id} className={ended ? "text-slate-400" : ""}>
                  <td className="py-2 capitalize text-slate-900">{r.unit_type}</td>
                  <td className="py-2 text-slate-600">{r.rate_code}</td>
                  <td className="py-2 text-right font-mono text-slate-900">
                    ${(r.unit_price_cents / 100).toFixed(2)}
                  </td>
                  <td className="py-2 text-xs text-slate-500">
                    {r.effective_from}
                    {r.effective_to ? ` → ${r.effective_to}` : " → ongoing"}
                  </td>
                  <td className="py-2 text-right">
                    {!ended && (
                      <form action={endCustomerRate.bind(null, r.id, customerId)}>
                        <button className="text-xs text-slate-500 hover:text-red-600">End today</button>
                      </form>
                    )}
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>

      <form
        action={formAction}
        className="mt-6 grid gap-3 rounded-md border border-slate-200 bg-slate-50 p-4 sm:grid-cols-5"
      >
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">Unit type</label>
          <input
            type="text"
            name="unit_type"
            required
            placeholder="room"
            className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">Rate code</label>
          <input
            type="text"
            name="rate_code"
            defaultValue="standard"
            className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">Price ($)</label>
          <input
            type="number"
            name="unit_price"
            required
            step="0.01"
            min="0"
            placeholder="4.50"
            className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">Effective from</label>
          <input
            type="date"
            name="effective_from"
            className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
          />
        </div>
        <div className="flex items-end">
          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-md bg-[#0E3D52] px-3 py-1.5 text-sm font-medium text-white hover:bg-[#0E3D52]/90 disabled:opacity-60"
          >
            {pending ? "Adding…" : "+ Add rate"}
          </button>
        </div>
        {state?.error && (
          <p className="col-span-full rounded-md bg-red-50 px-3 py-2 text-xs text-red-700">{state.error}</p>
        )}
        {state?.ok && (
          <p className="col-span-full rounded-md bg-emerald-50 px-3 py-2 text-xs text-emerald-700">Rate added.</p>
        )}
      </form>
    </div>
  );
}
