import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { fetchSite, fetchTemplatesForVertical, fetchWorkers } from "@/lib/db";
import { NewShiftForm } from "./new-shift-form";

export default async function NewShiftPage({
  params,
}: {
  params: Promise<{ siteId: string }>;
}) {
  const { siteId } = await params;
  const site = await fetchSite(siteId);
  if (!site) notFound();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from("profiles")
    .select("tenant_id")
    .eq("id", user?.id ?? "")
    .maybeSingle();

  const vertical = site.customer?.vertical ?? "hospitality";
  const [workers, templates] = await Promise.all([
    profile?.tenant_id ? fetchWorkers(profile.tenant_id) : Promise.resolve([]),
    fetchTemplatesForVertical(vertical),
  ]);

  return (
    <div className="min-h-screen bg-slate-50">
      <main className="mx-auto max-w-3xl px-6 py-10">
        <Link
          href={`/sites/${siteId}`}
          className="text-sm text-slate-500 hover:text-slate-900"
        >
          ← Back to {site.name}
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-slate-900">Schedule shift</h1>
        <p className="mt-1 text-sm text-slate-500">
          {site.name} · <span className="capitalize">{vertical.replace("_", " ")}</span>
        </p>

        <NewShiftForm
          siteId={siteId}
          workers={workers}
          templates={templates}
        />
      </main>
    </div>
  );
}
