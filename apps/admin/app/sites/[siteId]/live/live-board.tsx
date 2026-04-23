"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { AdminShiftRow, AdminTaskRow } from "@/lib/db";

type ShiftWithTasks = {
  shift: AdminShiftRow;
  tasks: AdminTaskRow[];
};

const SHIFT_STATUS_COLORS: Record<AdminShiftRow["status"], string> = {
  scheduled: "bg-slate-100 text-slate-700",
  clocked_in: "bg-sky-100 text-sky-700",
  clocked_out: "bg-emerald-100 text-emerald-700",
  no_show: "bg-red-100 text-red-700",
};

const TASK_STATUS_COLORS: Record<AdminTaskRow["status"], string> = {
  assigned: "bg-slate-100 text-slate-700 border-slate-200",
  in_progress: "bg-sky-50 text-sky-900 border-sky-200",
  done: "bg-emerald-50 text-emerald-900 border-emerald-200",
  blocked: "bg-red-50 text-red-900 border-red-200",
  skipped: "bg-slate-50 text-slate-500 border-slate-200",
};

export function LiveBoard({
  siteId,
  initialShifts,
  initialTasksByShift,
}: {
  siteId: string;
  initialShifts: AdminShiftRow[];
  initialTasksByShift: ShiftWithTasks[];
}) {
  const [rows, setRows] = useState<ShiftWithTasks[]>(initialTasksByShift);
  const [lastEvent, setLastEvent] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`live-board:${siteId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "shifts", filter: `site_id=eq.${siteId}` },
        (payload) => {
          setLastEvent(`shift ${payload.eventType} at ${new Date().toLocaleTimeString()}`);
          setRows((prev) => applyShiftChange(prev, payload));
        },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "tasks", filter: `site_id=eq.${siteId}` },
        (payload) => {
          setLastEvent(`task ${payload.eventType} at ${new Date().toLocaleTimeString()}`);
          setRows((prev) => applyTaskChange(prev, payload));
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [siteId]);

  const totals = useMemo(() => {
    const all = rows.flatMap((r) => r.tasks);
    return {
      shifts: rows.length,
      clockedIn: rows.filter((r) => r.shift.status === "clocked_in").length,
      tasksTotal: all.length,
      tasksDone: all.filter((t) => t.status === "done").length,
      tasksInProgress: all.filter((t) => t.status === "in_progress").length,
      tasksBlocked: all.filter((t) => t.status === "blocked").length,
    };
  }, [rows]);

  return (
    <main className="mx-auto max-w-[1600px] px-6 py-6">
      <div className="mb-4 grid gap-3 md:grid-cols-5">
        <StatCard label="Workers on site" value={`${totals.clockedIn} / ${totals.shifts}`} />
        <StatCard label="Tasks done" value={String(totals.tasksDone)} color="text-emerald-600" />
        <StatCard label="In progress" value={String(totals.tasksInProgress)} color="text-sky-600" />
        <StatCard label="Blocked" value={String(totals.tasksBlocked)} color="text-red-600" />
        <StatCard label="Total today" value={String(totals.tasksTotal)} />
      </div>

      {lastEvent && (
        <div className="mb-4 rounded-md bg-sky-50 px-3 py-2 text-xs text-sky-900">
          Live · {lastEvent}
        </div>
      )}

      {rows.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-300 bg-white p-12 text-center">
          <p className="text-sm text-slate-500">No shifts scheduled for today.</p>
        </div>
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {rows.map(({ shift, tasks }) => (
            <div
              key={shift.id}
              className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm"
            >
              <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
                <div>
                  <div className="text-sm font-semibold text-slate-900">
                    {shift.worker?.full_name ?? "Unassigned"}
                  </div>
                  <div className="text-xs text-slate-500">
                    {new Date(shift.scheduled_start).toLocaleTimeString([], {
                      hour: "numeric",
                      minute: "2-digit",
                    })}{" "}
                    –{" "}
                    {new Date(shift.scheduled_end).toLocaleTimeString([], {
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                    {shift.actual_start && (
                      <>
                        {" · in since "}
                        {new Date(shift.actual_start).toLocaleTimeString([], {
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </>
                    )}
                  </div>
                </div>
                <span
                  className={`rounded-full px-2 py-1 text-xs font-medium capitalize ${
                    SHIFT_STATUS_COLORS[shift.status] ?? "bg-slate-100 text-slate-700"
                  }`}
                >
                  {shift.status.replace("_", " ")}
                </span>
              </div>

              {tasks.length === 0 ? (
                <div className="px-4 py-4 text-xs text-slate-500">No tasks assigned.</div>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {tasks.map((t) => {
                    const isSlow =
                      t.status === "in_progress" &&
                      t.started_at &&
                      t.template?.expected_minutes != null &&
                      elapsedMinutes(t.started_at) > t.template.expected_minutes;
                    return (
                      <li
                        key={t.id}
                        className={`flex items-center justify-between px-4 py-2 text-sm border-l-4 ${
                          TASK_STATUS_COLORS[t.status] ?? "bg-white"
                        } ${isSlow ? "border-l-red-500" : "border-l-transparent"}`}
                      >
                        <div>
                          <div className="font-medium text-slate-900">
                            {t.template?.label ?? t.template_code}
                          </div>
                          <div className="text-xs text-slate-500">
                            {t.target_ref && <>Target: {t.target_ref} · </>}
                            {t.status === "in_progress" && t.started_at && (
                              <>{Math.round(elapsedMinutes(t.started_at))} min elapsed</>
                            )}
                            {t.status === "done" && t.duration_seconds != null && (
                              <>Completed in {Math.round(t.duration_seconds / 60)} min</>
                            )}
                          </div>
                        </div>
                        {isSlow && (
                          <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                            Over target
                          </span>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          ))}
        </div>
      )}
    </main>
  );
}

function StatCard({
  label,
  value,
  color = "text-slate-900",
}: {
  label: string;
  value: string;
  color?: string;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</div>
      <div className={`mt-1 text-2xl font-semibold ${color}`}>{value}</div>
    </div>
  );
}

function elapsedMinutes(startedAt: string): number {
  return (Date.now() - new Date(startedAt).getTime()) / 60000;
}

type PgPayload<T> = {
  eventType: "INSERT" | "UPDATE" | "DELETE";
  new: T;
  old: T;
};

function applyShiftChange(
  prev: ShiftWithTasks[],
  raw: unknown,
): ShiftWithTasks[] {
  const payload = raw as PgPayload<AdminShiftRow>;
  if (payload.eventType === "DELETE") {
    return prev.filter((r) => r.shift.id !== payload.old.id);
  }
  const existing = prev.find((r) => r.shift.id === payload.new.id);
  if (existing) {
    return prev.map((r) => (r.shift.id === payload.new.id ? { ...r, shift: { ...r.shift, ...payload.new } } : r));
  }
  return [...prev, { shift: payload.new, tasks: [] }];
}

function applyTaskChange(prev: ShiftWithTasks[], raw: unknown): ShiftWithTasks[] {
  const payload = raw as PgPayload<AdminTaskRow>;
  if (payload.eventType === "DELETE") {
    return prev.map((r) => ({
      ...r,
      tasks: r.tasks.filter((t) => t.id !== payload.old.id),
    }));
  }
  return prev.map((r) => {
    if (r.shift.id !== payload.new.shift_id) return r;
    const existing = r.tasks.find((t) => t.id === payload.new.id);
    if (existing) {
      return {
        ...r,
        tasks: r.tasks.map((t) => (t.id === payload.new.id ? { ...t, ...payload.new } : t)),
      };
    }
    return { ...r, tasks: [...r.tasks, payload.new] };
  });
}
