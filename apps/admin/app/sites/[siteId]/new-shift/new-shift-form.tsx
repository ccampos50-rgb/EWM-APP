"use client";

import { useActionState } from "react";
import { createShiftWithTasks } from "./actions";
import type { TemplateRow, WorkerRow } from "@/lib/db";

type State = { error?: string } | null;

export function NewShiftForm({
  siteId,
  workers,
  templates,
}: {
  siteId: string;
  workers: WorkerRow[];
  templates: TemplateRow[];
}) {
  const [state, formAction, pending] = useActionState<State, FormData>(
    createShiftWithTasks.bind(null, siteId),
    null,
  );

  return (
    <form action={formAction} className="mt-6 space-y-6 rounded-lg border border-slate-200 bg-white p-6">
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Worker</label>
        {workers.length === 0 ? (
          <p className="text-sm text-slate-500">
            No workers in your tenant yet. Add a profile + worker role to the user first.
          </p>
        ) : (
          <select
            name="worker_id"
            required
            defaultValue=""
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="" disabled>
              Select worker…
            </option>
            {workers.map((w) => (
              <option key={w.id} value={w.id}>
                {w.full_name} {w.email ? `(${w.email})` : ""}
              </option>
            ))}
          </select>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Start</label>
          <input
            type="time"
            name="start_time"
            required
            defaultValue="08:00"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">End</label>
          <input
            type="time"
            name="end_time"
            required
            defaultValue="16:00"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700">
          Tasks to assign ({templates.length} available for this vertical)
        </label>
        <div className="max-h-80 space-y-1 overflow-y-auto rounded-md border border-slate-200 p-2">
          {templates.map((t) => (
            <label
              key={t.code}
              className="flex cursor-pointer items-start gap-3 rounded px-2 py-2 hover:bg-slate-50"
            >
              <input
                type="checkbox"
                name="template_codes"
                value={t.code}
                className="mt-1"
              />
              <div className="flex-1">
                <div className="text-sm font-medium text-slate-900">{t.label}</div>
                <div className="text-xs text-slate-500">
                  ~{t.expected_minutes} min
                  {t.requires_scan && " · requires scan"}
                  {t.billing_unit && ` · billable per ${t.billing_unit}`}
                </div>
              </div>
            </label>
          ))}
        </div>
      </div>

      {state?.error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>
      )}

      <button
        type="submit"
        disabled={pending || workers.length === 0}
        className="w-full rounded-md bg-[#0E3D52] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#0E3D52]/90 disabled:opacity-60"
      >
        {pending ? "Creating shift…" : "Create shift"}
      </button>
    </form>
  );
}
