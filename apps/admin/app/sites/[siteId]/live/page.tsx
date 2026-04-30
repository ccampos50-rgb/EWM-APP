import Link from "next/link";
import { notFound } from "next/navigation";
import { fetchSite, fetchShiftTasks, fetchTodaysShiftsForSite, type AdminShiftRow, type AdminTaskRow } from "@/lib/db";
import { LiveBoard } from "./live-board";
import { signOut } from "../../../login/actions";

export default async function LiveBoardPage({
  params,
}: {
  params: Promise<{ siteId: string }>;
}) {
  const { siteId } = await params;
  const site = await fetchSite(siteId);
  if (!site) notFound();

  const shifts = await fetchTodaysShiftsForSite(siteId);
  const tasksByShift: Array<{ shift: AdminShiftRow; tasks: AdminTaskRow[] }> = await Promise.all(
    shifts.map(async (s) => ({ shift: s, tasks: await fetchShiftTasks(s.id) })),
  );

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-[1600px] items-center justify-between px-6 py-3">
          <div className="flex items-center gap-6">
            <Link href="/" className="text-xl font-bold text-[#0E3D52]">
              EWM
            </Link>
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-slate-900">{site.name}</span>
              <span className="text-xs text-slate-500">Live board · auto-updates</span>
            </div>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <Link href={`/sites/${siteId}`} className="text-slate-600 hover:text-slate-900">
              Back to site
            </Link>
            <form action={signOut}>
              <button className="text-slate-600 hover:text-slate-900">Sign out</button>
            </form>
          </div>
        </div>
      </header>

      <LiveBoard siteId={siteId} initialShifts={shifts} initialTasksByShift={tasksByShift} />
    </div>
  );
}
