"use client";

import { useActionState } from "react";
import { reassignTask } from "./actions";

type ShiftOption = {
  id: string;
  workerName: string;
  scheduledStart: string;
  scheduledEnd: string;
  status: string;
};

type State = { error?: string } | null;

export function ReassignForm({
  siteId,
  taskId,
  currentShiftId,
  shifts,
}: {
  siteId: string;
  taskId: string;
  currentShiftId: string;
  shifts: ShiftOption[];
}) {
  const [state, formAction, pending] = useActionState<State, FormData>(
    reassignTask.bind(null, siteId, taskId),
    null,
  );

  const options = shifts.filter((s) => s.id !== currentShiftId);

  return (
    <form action={formAction} className="mt-6 space-y-4 rounded-lg border border-slate-200 bg-white p-6">
      {options.length === 0 ? (
        <p className="text-sm text-slate-500">
          No other shifts at this site today. Schedule another shift to reassign.
        </p>
      ) : (
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Move to shift</label>
          <select
            name="shift_id"
            required
            defaultValue=""
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="" disabled>
              Select shift…
            </option>
            {options.map((s) => (
              <option key={s.id} value={s.id}>
                {s.workerName} ·{" "}
                {new Date(s.scheduledStart).toLocaleTimeString([], {
                  hour: "numeric",
                  minute: "2-digit",
                })}
                {" – "}
                {new Date(s.scheduledEnd).toLocaleTimeString([], {
                  hour: "numeric",
                  minute: "2-digit",
                })}
                {" · "}
                {s.status.replace("_", " ")}
              </option>
            ))}
          </select>
        </div>
      )}

      {state?.error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>
      )}

      <button
        type="submit"
        disabled={pending || options.length === 0}
        className="w-full rounded-md bg-[#0E3D52] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#0E3D52]/90 disabled:opacity-60"
      >
        {pending ? "Reassigning…" : "Reassign task"}
      </button>
    </form>
  );
}
