import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { supabase } from "./supabase";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * Register for push notifications and persist the Expo token on the user's profile
 * so the backend can send targeted notifications (new task, shift reminder, etc.).
 */
export async function registerForPushNotifications(): Promise<string | null> {
  if (!Device.isDevice) {
    console.warn("[push] simulator/emulator — skipping push registration");
    return null;
  }

  const { status: existing } = await Notifications.getPermissionsAsync();
  let finalStatus = existing;
  if (existing !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== "granted") {
    console.warn("[push] permission denied");
    return null;
  }

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#1E3A8A",
    });
  }

  let token: string;
  try {
    const projectId = process.env.EXPO_PUBLIC_EAS_PROJECT_ID;
    const result = projectId
      ? await Notifications.getExpoPushTokenAsync({ projectId })
      : await Notifications.getExpoPushTokenAsync();
    token = result.data;
  } catch (e) {
    console.warn("[push] failed to fetch Expo push token:", e);
    return null;
  }

  // Persist onto the profile row
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id;
  if (userId) {
    await supabase
      .from("profiles")
      .update({ push_token: token })
      .eq("id", userId);
  }

  return token;
}
