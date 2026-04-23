import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.EXPO_PUBLIC_SUPABASE_URL;
const anonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

export function createBrowserClient() {
  if (!url || !anonKey) {
    throw new Error("Supabase env vars missing (NEXT_PUBLIC_* or EXPO_PUBLIC_*)");
  }
  return createClient<Database>(url, anonKey);
}

export function createServerClient(serviceRoleKey: string) {
  if (!url) throw new Error("Supabase URL missing");
  return createClient<Database>(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
