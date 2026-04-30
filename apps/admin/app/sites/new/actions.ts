"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

type State = { error?: string } | null;

export async function createSite(_prev: State, formData: FormData): Promise<State> {
  const name = String(formData.get("name") ?? "").trim();
  const customerId = String(formData.get("customer_id") ?? "");
  const address = String(formData.get("address") ?? "").trim() || null;
  const latRaw = String(formData.get("latitude") ?? "").trim();
  const lngRaw = String(formData.get("longitude") ?? "").trim();
  const radiusRaw = String(formData.get("geofence_radius_m") ?? "").trim();
  const timezone = String(formData.get("timezone") ?? "America/Chicago");

  if (!name) return { error: "Name is required." };
  if (!customerId) return { error: "Customer is required." };

  const latitude = latRaw ? Number(latRaw) : null;
  const longitude = lngRaw ? Number(lngRaw) : null;
  const radius = radiusRaw ? Number(radiusRaw) : 200;

  if ((latitude !== null && Number.isNaN(latitude)) || (longitude !== null && Number.isNaN(longitude))) {
    return { error: "Latitude and longitude must be numbers." };
  }
  if (latitude !== null && (latitude < -90 || latitude > 90)) {
    return { error: "Latitude must be between -90 and 90." };
  }
  if (longitude !== null && (longitude < -180 || longitude > 180)) {
    return { error: "Longitude must be between -180 and 180." };
  }
  if (Number.isNaN(radius) || radius < 50 || radius > 50000) {
    return { error: "Geo-fence radius must be between 50 and 50000 meters." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("sites")
    .insert({
      name,
      customer_id: customerId,
      address,
      latitude,
      longitude,
      geofence_radius_m: radius,
      timezone,
    })
    .select("id")
    .single();

  if (error || !data) {
    return { error: error?.message ?? "Failed to create site." };
  }

  redirect(`/sites/${data.id}`);
}
