import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { fetchSite } from "@/lib/db";
import { PrintableQRSheet } from "./printable-sheet";

export default async function SiteQRPage({
  params,
  searchParams,
}: {
  params: Promise<{ siteId: string }>;
  searchParams: Promise<{ kind?: string }>;
}) {
  const { siteId } = await params;
  const { kind } = await searchParams;

  const site = await fetchSite(siteId);
  if (!site) notFound();

  const supabase = await createClient();

  // For hospitality sites, pull room scan codes. Other verticals show the site QR only.
  const entityKind = kind ?? inferEntityKindForVertical(site.customer?.vertical ?? "hospitality");

  const { data: scanCodes } = await supabase
    .from("scan_codes")
    .select("id, code, entity_kind, entity_ref")
    .eq("site_id", siteId)
    .eq("entity_kind", entityKind)
    .order("entity_ref");

  return (
    <div className="min-h-screen bg-slate-50 print:bg-white">
      <header className="border-b border-slate-200 bg-white print:hidden">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-6">
            <Link href="/" className="text-xl font-bold text-[#1E3A8A]">EWM</Link>
            <nav className="flex gap-4 text-sm text-slate-600">
              <Link href={`/sites/${siteId}`} className="hover:text-slate-900">← Back to {site.name}</Link>
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <KindPicker current={entityKind} siteId={siteId} />
            <button
              onClick={undefined}
              data-print-trigger
              className="rounded-md bg-[#1E3A8A] px-4 py-2 text-sm font-medium text-white hover:bg-[#1E3A8A]/90"
            >
              Print
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl p-6 print:max-w-none print:p-0">
        <PrintableQRSheet
          siteName={site.name}
          siteAddress={site.address ?? ""}
          siteQRCode={site.site_qr_code}
          entityKind={entityKind}
          scanCodes={scanCodes ?? []}
        />
      </main>
    </div>
  );
}

function KindPicker({ current, siteId }: { current: string; siteId: string }) {
  const kinds = [
    { key: "room", label: "Rooms" },
    { key: "bed", label: "Beds" },
    { key: "vehicle", label: "Vehicles" },
    { key: "zone", label: "Zones" },
  ];
  return (
    <div className="flex gap-1 rounded-md border border-slate-300 bg-white p-1 text-sm">
      {kinds.map((k) => (
        <Link
          key={k.key}
          href={`/sites/${siteId}/qr?kind=${k.key}`}
          className={`px-3 py-1 rounded ${
            current === k.key ? "bg-[#1E3A8A] text-white" : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          {k.label}
        </Link>
      ))}
    </div>
  );
}

function inferEntityKindForVertical(vertical: string): string {
  switch (vertical) {
    case "hospitality":
      return "room";
    case "healthcare":
      return "bed";
    case "mobility":
      return "vehicle";
    case "light_industrial":
      return "zone";
    default:
      return "room";
  }
}
