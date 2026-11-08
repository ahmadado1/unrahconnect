// Android only: picks up the agent code that came through Google Play.
//
// The agent QR page sends Android users to:
//   play.google.com/store/apps/details?id=com.myumrahconnect.app&referrer=agent_code%3DAGT-XXXXXX
// After install, Google Play gives the app that "referrer" text ONCE we ask for it.
// We save the code as a pending referral, so sign-up fills it in and links the pilgrim to the agent.
import AsyncStorage from "@react-native-async-storage/async-storage"
import { Platform } from "react-native"
import { normalizeReferralCode, saveReferralCode } from "./referral"

const CHECKED_KEY = "install_referrer_checked_v1"

export async function captureInstallReferrer(): Promise<string | null> {
  if (Platform.OS !== "android") return null
  try {
    // Only once per install: the referrer never changes after install.
    if (await AsyncStorage.getItem(CHECKED_KEY)) return null
    await AsyncStorage.setItem(CHECKED_KEY, "1")

    const Application = await import("expo-application")
    const raw = await Application.getInstallReferrerAsync()
    if (!raw) return null

    // raw looks like "agent_code=AGT-123ABC" (sometimes still URL-encoded)
    const text = decodeURIComponent(raw)
    const match = text.match(/agent_code=([A-Za-z0-9-]+)/)
    const code = match ? normalizeReferralCode(match[1]) : ""
    if (!code) return null

    await saveReferralCode(code)
    return code
  } catch (e) {
    console.log("Install referrer error:", e)
    return null
  }
}
