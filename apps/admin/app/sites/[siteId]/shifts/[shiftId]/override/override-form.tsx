"use client";

import { useActionState } from "react";
import { submitOverride } from "./actions";

type State = { error?: string } | null;

const KINDS: Array<{ value: string; label: string; desc: string }> = [
  {
    value: "force_clock_in",
    label: "Force clock-in",
    desc: "Worker is on site but geo-fence failed. Records manual clock-in at current time.",
  },
  {
    value: "force_clock_out",
    label: "Force clock-out",
    desc: "Worker left without clocking out. Closes the shift at current time.",
  },
  {
    value: "no_show",
    label: "No show",
    desc: "Worker did not arrive. Shift status → no_show.",
  },
  {
    value: "early_release",
    label: "Early release",
    desc: "Worker released before scheduled end. Closes the shift at current time.",
  },
  {
    value: "other",
    label: "Other",
    desc: "Record an override without a status change. Put details in the note.",
  },
];

export function OverrideForm({
  siteId,
  shiftId,
  currentStatus,
}: {
  siteId: string;
  shiftId: string;
  currentStatus: string;
}) {
  const [state, formAction, pending] = useActionState<State, FormData>(
    submitOverride.bind(null, siteId, shiftId),
    null,
  );

  return (
    <form action={formAction} className="mt-6 space-y-5 rounded-lg border border-slate-200 bg-white p-6">
      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700">Reason code</label>
        <div className="space-y-2">
          {KINDS.map((k) => (
            <label
              key={k.value}
              className="flex cursor-pointer items-start gap-3 rounded-md border border-slate-200 p-3 hover:bg-slate-50"
            >
              <input type="radio" name="kind" value={k.value} required className="mt-1" />
              <div>
                <div className="text-sm font-medium text-slate-900">{k.label}</div>
                <div className="text-xs text-slate-500">{k.desc}</div>
              </div>
            </label>
          ))}
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Note (required)</label>
        <textarea
          name="reason"
          required
          minLength={5}
          placeholder="What happened? This is audit-logged."
          rows={3}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
      </div>

      {state?.error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>
      )}

      <div className="flex items-center justify-between text-xs text-slate-500">
        <span>Current status: <span className="capitalize">{currentStatus.replace("_", " ")}</span></span>
      </div>

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-md bg-[#0E3D52] px-4 py-2 text-sm font-medium text-white hover:bg-[#0E3D52]/90 disabled:opacity-60"
      >
        {pending ? "Recording override…" : "Record override"}
      </button>
    </form>
  );
}
