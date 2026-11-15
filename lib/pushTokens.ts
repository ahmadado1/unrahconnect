// Save this phone's push token (Expo) to the account, so the user's agency announcements can
// arrive as notifications. Needs notification permission (already asked for prayer alerts).
// Safe to call often: it only writes when the token, account or language changed.
import i18n from "@/i18n"
import AsyncStorage from "@react-native-async-storage/async-storage"
import Constants from "expo-constants"
import * as Device from "expo-device"
import * as Notifications from "expo-notifications"
import { Platform } from "react-native"
import { supabase } from "./supabase"

const SAVED_KEY = "push_token_saved_v1"

export async function syncPushToken(userId: string | null | undefined) {
  if (!userId || !Device.isDevice) return
  try {
    const perm = await Notifications.getPermissionsAsync()
    if (perm.status !== "granted") return
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("agency-updates", {
        name: "Agency updates",
        importance: Notifications.AndroidImportance.HIGH,
        sound: "default",
      }).catch(() => {})
    }
    const projectId =
      (Constants.expoConfig?.extra as { eas?: { projectId?: string } } | undefined)?.eas?.projectId ??
      Constants.easConfig?.projectId
    const { data: token } = await Notifications.getExpoPushTokenAsync(projectId ? { projectId } : undefined)
    if (!token) return
    const sig = `${userId}|${token}|${i18n.language}`
    if ((await AsyncStorage.getItem(SAVED_KEY)) === sig) return
    const { error } = await supabase.from("push_tokens").upsert(
      { token, user_id: userId, platform: Platform.OS, language: i18n.language, updated_at: new Date().toISOString() },
      { onConflict: "token" }
    )
    if (!error) await AsyncStorage.setItem(SAVED_KEY, sig)
  } catch (e) {
    console.log("[Push] token not saved:", String(e))
  }
}

/** On sign out: this phone should stop getting the old account's announcements. */
export async function removePushTokenOnSignOut() {
  await AsyncStorage.removeItem(SAVED_KEY).catch(() => {})
}
