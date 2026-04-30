"use client";

import { useActionState, useState } from "react";
import type { CustomerRow, AdminSiteRow } from "@/lib/db";

type State = { error?: string } | null;

const TIMEZONES = [
  "America/Chicago",
  "America/New_York",
  "America/Denver",
  "America/Los_Angeles",
  "America/Phoenix",
  "America/Anchorage",
  "Pacific/Honolulu",
];

export type SiteFormAction = (
  prev: State,
  formData: FormData,
) => Promise<State>;

export function SiteForm({
  customers,
  initial,
  action,
  submitLabel,
  pendingLabel,
}: {
  customers: CustomerRow[];
  initial?: Partial<AdminSiteRow> | null;
  action: SiteFormAction;
  submitLabel: string;
  pendingLabel: string;
}) {
  const [state, formAction, pending] = useActionState<State, FormData>(action, null);
  const [lat, setLat] = useState<string>(
    initial?.latitude != null ? String(initial.latitude) : "",
  );
  const [lng, setLng] = useState<string>(
    initial?.longitude != null ? String(initial.longitude) : "",
  );

  function useMyLocation() {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      alert("Geolocation isn't available in this browser.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude.toFixed(6));
        setLng(pos.coords.longitude.toFixed(6));
      },
      (err) => alert(`Couldn't get location: ${err.message}`),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }

  return (
    <form action={formAction} className="mt-6 space-y-6 rounded-lg border border-slate-200 bg-white p-6">
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Name *</label>
        <input
          type="text"
          name="name"
          required
          defaultValue={initial?.name ?? ""}
          placeholder="e.g. Josh Inn"
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Customer *</label>
        {customers.length === 0 ? (
          <p className="rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-800">
            No customers yet. Create a customer record before adding a site.
          </p>
        ) : (
          <select
            name="customer_id"
            required
            defaultValue={initial?.customer_id ?? ""}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="" disabled>
              Select customer…
            </option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} · {c.vertical.replace("_", " ")}
              </option>
            ))}
          </select>
        )}
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Address</label>
        <input
          type="text"
          name="address"
          defaultValue={initial?.address ?? ""}
          placeholder="Street, city, state ZIP"
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
      </div>

      <div>
        <div className="mb-1 flex items-end justify-between">
          <label className="text-sm font-medium text-slate-700">Geo-fence</label>
          <button
            type="button"
            onClick={useMyLocation}
            className="text-xs font-medium text-[#0EA5E9] hover:underline"
          >
            Use my current location
          </button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <input
            type="number"
            name="latitude"
            step="any"
            value={lat}
            onChange={(e) => setLat(e.target.value)}
            placeholder="Latitude (e.g. 33.1935)"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
          <input
            type="number"
            name="longitude"
            step="any"
            value={lng}
            onChange={(e) => setLng(e.target.value)}
            placeholder="Longitude (e.g. -96.812)"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <div className="mt-3">
          <label className="mb-1 block text-xs text-slate-600">
            Fence radius (meters): tight = at-the-property only, wide = anywhere in town
          </label>
          <input
            type="number"
            name="geofence_radius_m"
            min="50"
            max="50000"
            step="50"
            required
            defaultValue={initial?.geofence_radius_m ?? 200}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
          <p className="mt-1 text-xs text-slate-500">
            Common values: <b>200m</b> (single building) · <b>1000m</b> (campus) · <b>12000m</b> (Frisco + Prosper).
          </p>
        </div>
        {lat && lng && (
          <p className="mt-2 text-xs text-slate-500">
            Preview:{" "}
            <a
              href={`https://www.google.com/maps?q=${lat},${lng}`}
              target="_blank"
              rel="noreferrer"
              className="text-[#0EA5E9] hover:underline"
            >
              open in Google Maps
            </a>
          </p>
        )}
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Timezone *</label>
        <select
          name="timezone"
          required
          defaultValue={initial?.timezone ?? "America/Chicago"}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
        >
          {TIMEZONES.map((tz) => (
            <option key={tz} value={tz}>
              {tz}
            </option>
          ))}
        </select>
      </div>

      {state?.error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>
      )}

      <button
        type="submit"
        disabled={pending || customers.length === 0}
        className="w-full rounded-md bg-[#1E3A8A] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#1E3A8A]/90 disabled:opacity-60"
      >
        {pending ? pendingLabel : submitLabel}
      </button>
    </form>
  );
}
