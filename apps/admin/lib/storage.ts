import { createClient } from "./supabase/server";

// task-photos is a private bucket. UI needs short-lived signed URLs to display
// thumbnails. Photos can be stored either as a bucket path ("tasks/.../foo.jpg")
// or as a full https URL — handle both. Returns null if neither resolves.
export async function signTaskPhotoUrl(
  storedValue: string | null,
  expiresInSeconds = 60 * 30, // 30 min — long enough for the page to load + a re-render
): Promise<string | null> {
  if (!storedValue) return null;
  // If it already looks like an http(s) URL, just return it.
  if (/^https?:\/\//.test(storedValue)) return storedValue;

  // Strip leading slashes / bucket prefix if present
  let path = storedValue.replace(/^\/+/, "");
  if (path.startsWith("task-photos/")) path = path.slice("task-photos/".length);

  const supabase = await createClient();
  const { data, error } = await supabase.storage
    .from("task-photos")
    .createSignedUrl(path, expiresInSeconds);
  if (error) return null;
  return data?.signedUrl ?? null;
}

// Bulk variant for lists. Returns a map keyed by storedValue → signedUrl|null.
export async function signTaskPhotoUrls(
  storedValues: Array<string | null>,
  expiresInSeconds = 60 * 30,
): Promise<Map<string, string>> {
  const out = new Map<string, string>();
  const unique = Array.from(new Set(storedValues.filter((v): v is string => !!v)));
  await Promise.all(
    unique.map(async (v) => {
      const signed = await signTaskPhotoUrl(v, expiresInSeconds);
      if (signed) out.set(v, signed);
    }),
  );
  return out;
}
