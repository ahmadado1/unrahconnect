// "Were you sent by <agency>?" — the iPhone way to link a pilgrim to the agent whose QR they
// scanned before installing (Apple can't pass the agent code through the App Store; Android
// does it with the install referrer, see lib/installReferrer.ts).
//
// The website remembers which agent page this internet connection opened in the last 24 hours.
// On the app's first open we ask the website once; if there is a match we ask the user.
// Nothing is linked unless they tap "Yes".
import AsyncStorage from "@react-native-async-storage/async-storage"
import { Alert } from "react-native"
import i18n from "@/i18n"
import { getPendingReferral, linkPilgrimToAgent, pilgrimHasAgent, saveReferralCode } from "./referral"
import { getUserFast } from "./supabase"

const CHECKED_KEY = "agent_match_checked_v1"
const MATCH_URL = "https://myumrahconnect.com/api/agents/match"

export async function checkAgentMatchOnce(): Promise<void> {
  try {
    // Only once per install.
    if (await AsyncStorage.getItem(CHECKED_KEY)) return
    await AsyncStorage.setItem(CHECKED_KEY, "1")

    // Already have a code (deep link, Android install, typed)? Nothing to ask.
    if (await getPendingReferral()) return
    const { data: { user } } = await getUserFast()
    // Agencies aren't pilgrims: never ask them to join an agency
    if (user?.user_metadata?.user_type === "agent") return
    if (user && (await pilgrimHasAgent(user.id))) return

    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 8000)
    const res = await fetch(MATCH_URL, { signal: controller.signal }).finally(() => clearTimeout(timer))
    const json = (await res.json().catch(() => null)) as { match?: { code: string; name: string | null } | null } | null
    const match = json?.match
    if (!match?.code) return

    const name = match.name || match.code
    Alert.alert(
      i18n.t("agentMatchTitle", { defaultValue: "Were you sent by an agency?" }),
      i18n.t("agentMatchBody", { name, defaultValue: `Did ${name} invite you to UmrahConnect? Join them to get their updates and support.` }),
      [
        { text: i18n.t("agentMatchNo", { defaultValue: "No" }), style: "cancel" },
        {
          text: i18n.t("agentMatchYes", { defaultValue: "Yes, join" }),
          onPress: async () => {
            await saveReferralCode(match.code)
            // Signed in already: link now. Otherwise sign-up fills the code in and links.
            const { data: { user: current } } = await getUserFast()
            if (current) await linkPilgrimToAgent(match.code)
          },
        },
      ],
    )
  } catch (e) {
    console.log("Agent match error:", e)
  }
}
