"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

type State = { error?: string } | null;

const VALID_ROLES = new Set(["worker", "site_manager", "area_manager"]);

export async function createWorker(_prev: State, formData: FormData): Promise<State> {
  const fullName = String(formData.get("full_name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const language = String(formData.get("preferred_language") ?? "en");
  const role = String(formData.get("role") ?? "worker");
  const siteId = String(formData.get("site_id") ?? "");

  if (!fullName) return { error: "Full name is required." };
  if (!email || !email.includes("@")) return { error: "A valid email is required." };
  if (!password || password.length < 8) return { error: "Password must be at least 8 characters." };
  if (!VALID_ROLES.has(role)) return { error: "Invalid role." };
  if (!siteId) return { error: "Site is required." };

  // Need the creator's tenant_id so we know which tenant to scope the new profile under.
  const supabase = await createClient();
  const {
    data: { user: actor },
  } = await supabase.auth.getUser();
  if (!actor) return { error: "Not signed in." };

  const { data: actorProfile, error: actorErr } = await supabase
    .from("profiles")
    .select("tenant_id")
    .eq("id", actor.id)
    .maybeSingle();

  if (actorErr || !actorProfile) {
    return { error: "Couldn't load your tenant. Sign out and back in." };
  }

  const admin = createAdminClient();

  // 1) Create auth.users (or find existing — idempotent for re-submits w/ same email)
  const { data: created, error: authErr } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  });

  let userId: string | null = created?.user?.id ?? null;

  if (authErr) {
    // If the email exists, look up the existing auth user instead of failing.
    if (/already.*registered|already exists|duplicate/i.test(authErr.message)) {
      const { data: list } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
      userId = list?.users.find((u) => u.email?.toLowerCase() === email)?.id ?? null;
      if (!userId) return { error: `Auth user exists but couldn't be found: ${authErr.message}` };
      // Reset password so the value the admin just typed is the live one
      await admin.auth.admin.updateUserById(userId, { password });
    } else {
      return { error: `Auth: ${authErr.message}` };
    }
  }

  if (!userId) return { error: "No user id returned from auth.createUser." };

  // 2) profiles upsert
  const { error: profileErr } = await admin
    .from("profiles")
    .upsert(
      {
        id: userId,
        tenant_id: actorProfile.tenant_id,
        full_name: fullName,
        email,
        preferred_language: language,
      },
      { onConflict: "id" },
    );
  if (profileErr) return { error: `Profile: ${profileErr.message}` };

  // 3) user_roles — only insert if a row for (profile, role, scope_site) doesn't exist
  const { data: existingRoles } = await admin
    .from("user_roles")
    .select("id")
    .eq("profile_id", userId)
    .eq("role", role)
    .eq("scope_site_id", siteId);

  if (!existingRoles || existingRoles.length === 0) {
    const { error: roleErr } = await admin.from("user_roles").insert({
      profile_id: userId,
      role,
      scope_kind: "site",
      scope_site_id: siteId,
    });
    if (roleErr) return { error: `Role: ${roleErr.message}` };
  }

  redirect(`/sites/${siteId}`);
}
