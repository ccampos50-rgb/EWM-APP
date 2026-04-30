"use client";

import { useActionState } from "react";
import { createWeeklyPeriod } from "./actions";

type State = { error?: string; ok?: boolean } | null;

export function NewPeriodForm() {
  const [state, formAction, pending] = useActionState<State, FormData>(createWeeklyPeriod, null);
  const today = new Date().toISOString().slice(0, 10);

  return (
    <form
      action={formAction}
      className="flex flex-wrap items-end gap-3 rounded-md border border-slate-200 bg-slate-50 p-4"
    >
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600">Pay period for week of</label>
        <input
          type="date"
          name="week_of"
          required
          defaultValue={today}
          className="rounded-md border border-slate-300 px-2 py-1.5 text-sm"
        />
        <p className="mt-1 text-xs text-slate-500">Snaps to Sunday-Saturday FLSA workweek.</p>
      </div>
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-[#0E3D52] px-4 py-2 text-sm font-medium text-white hover:bg-[#0E3D52]/90 disabled:opacity-60"
      >
        {pending ? "Creating…" : "+ New pay period"}
      </button>
      {state?.error && (
        <p className="basis-full rounded-md bg-red-50 px-3 py-2 text-xs text-red-700">{state.error}</p>
      )}
    </form>
  );
}
