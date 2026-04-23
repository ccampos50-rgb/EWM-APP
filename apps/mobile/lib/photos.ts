import * as ImagePicker from "expo-image-picker";
import { supabase } from "./supabase";

const BUCKET = "task-photos";

export type PhotoResult = { path: string; publicUrl: string };

/** Launches the camera, returns null if user cancelled. */
export async function captureTaskPhoto(): Promise<PhotoResult | null> {
  const perm = await ImagePicker.requestCameraPermissionsAsync();
  if (!perm.granted) throw new Error("Camera permission denied.");

  const result = await ImagePicker.launchCameraAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: false,
    quality: 0.75,
    exif: false,
  });

  if (result.canceled || !result.assets[0]) return null;
  return uploadAsset(result.assets[0]);
}

async function uploadAsset(asset: ImagePicker.ImagePickerAsset): Promise<PhotoResult> {
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id;
  if (!userId) throw new Error("Not signed in.");

  const ext = inferExtension(asset.uri, asset.mimeType);
  const path = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const contentType = asset.mimeType ?? `image/${ext}`;

  // Fetch the local file into an ArrayBuffer for upload
  const response = await fetch(asset.uri);
  const blob = await response.blob();

  const { error } = await supabase.storage.from(BUCKET).upload(path, blob, {
    contentType,
    upsert: false,
  });
  if (error) throw new Error(`Upload failed: ${error.message}`);

  const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return { path, publicUrl: urlData.publicUrl };
}

function inferExtension(uri: string, mimeType?: string): string {
  if (mimeType === "image/png") return "png";
  if (mimeType === "image/webp") return "webp";
  if (uri.toLowerCase().endsWith(".png")) return "png";
  if (uri.toLowerCase().endsWith(".webp")) return "webp";
  return "jpg";
}
