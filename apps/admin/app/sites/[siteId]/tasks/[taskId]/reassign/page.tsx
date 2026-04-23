import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { fetchSite, fetchTodaysShiftsForSite } from "@/lib/db";
import { ReassignForm } from "./reassign-form";

export default async function ReassignTaskPage({
  params,
}: {
  params: Promise<{ siteId: string; taskId: string }>;
}) {
  const { siteId, taskId } = await params;
  const site = await fetchSite(siteId);
  if (!site) notFound();

  const supabase = await createClient();
  const { data: task } = await supabase
    .from("tasks")
    .select("id, template_code, target_ref, shift_id, template:task_templates(label)")
    .eq("id", taskId)
    .maybeSingle();

  if (!task) notFound();

  const shifts = await fetchTodaysShiftsForSite(siteId);

  return (
    <div className="min-h-screen bg-slate-50">
      <main className="mx-auto max-w-2xl px-6 py-10">
        <Link
          href={`/sites/${siteId}`}
          className="text-sm text-slate-500 hover:text-slate-900"
        >
          ← Back to {site.name}
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-slate-900">Reassign task</h1>
        <p className="mt-1 text-sm text-slate-500">
          {(task.template as { label?: string } | null)?.label ?? task.template_code}
          {task.target_ref && <> · Target: {task.target_ref}</>}
        </p>

        <ReassignForm
          siteId={siteId}
          taskId={taskId}
          currentShiftId={task.shift_id}
          shifts={shifts.map((s) => ({
            id: s.id,
            workerName: s.worker?.full_name ?? "Unassigned",
            scheduledStart: s.scheduled_start,
            scheduledEnd: s.scheduled_end,
            status: s.status,
          }))}
        />
      </main>
    </div>
  );
}
