"use client";

import { useActionState } from "react";
import { lockPeriod, reopenPeriod, markPaid } from "../actions";

type State = { error?: string; ok?: boolean } | null;

export function LockButton({ periodId }: { periodId: string }) {
  return (
    <form action={lockPeriod.bind(null, periodId)}>
      <button className="rounded-md border border-amber-500 px-3 py-1.5 text-sm font-medium text-amber-700 hover:bg-amber-50">
        Lock period
      </button>
    </form>
  );
}

export function ReopenButton({ periodId }: { periodId: string }) {
  return (
    <form action={reopenPeriod.bind(null, periodId)}>
      <button className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50">
        Reopen
      </button>
    </form>
  );
}

export function MarkPaidForm({ periodId }: { periodId: string }) {
  const [state, formAction, pending] = useActionState<State, FormData>(
    markPaid.bind(null, periodId),
    null,
  );
  return (
    <form action={formAction} className="flex items-end gap-2">
      <input
        type="text"
        name="paid_note"
        placeholder="Run ID, check #, etc."
        className="rounded-md border border-slate-300 px-2 py-1.5 text-sm"
      />
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
      >
        {pending ? "Saving…" : "Mark paid"}
      </button>
      {state?.error && <span className="text-xs text-red-700">{state.error}</span>}
    </form>
  );
}
