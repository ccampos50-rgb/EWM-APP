"use client";

import type { AdminSiteRow, CustomerRow } from "@/lib/db";
import { SiteForm } from "../../site-form";
import { updateSite } from "./actions";

export function EditSiteFormWrapper({
  site,
  customers,
}: {
  site: AdminSiteRow;
  customers: CustomerRow[];
}) {
  return (
    <SiteForm
      customers={customers}
      initial={site}
      action={updateSite.bind(null, site.id)}
      submitLabel="Save changes"
      pendingLabel="Saving…"
    />
  );
}
