// "This is a Premium feature" pop-up.
// The nice card is drawn by <PremiumPromptHost /> (one in the root layout, plus one inside
// any pop-up sheet that can show it). The newest host on screen shows the card.
// If no host is mounted yet, it falls back to a simple system alert.
import i18n from "@/i18n"
import { router } from "expo-router"
import { Alert } from "react-native"

type Host = (beforeOpen?: () => void) => void
const hosts: Host[] = []

/** Used by PremiumPromptHost. Returns a function that unregisters it. */
export function registerPremiumPromptHost(host: Host) {
  hosts.push(host)
  return () => {
    const i = hosts.lastIndexOf(host)
    if (i >= 0) hosts.splice(i, 1)
  }
}

/** Opens the Premium screen. beforeOpen: e.g. close a pop-up first so Premium isn't hidden behind it. */
export function openPremiumScreen(beforeOpen?: () => void) {
  beforeOpen?.()
  setTimeout(() => router.push("/premium" as any), beforeOpen ? 300 : 0)
}

/** Show the Premium card. beforeOpen runs only if the user taps "See Premium". */
export function showPremiumPrompt(beforeOpen?: () => void) {
  const host = hosts[hosts.length - 1]
  if (host) {
    host(beforeOpen)
    return
  }
  Alert.alert(i18n.t("premiumFeature"), i18n.t("premiumFeatureBody"), [
    { text: i18n.t("pw_notNow"), style: "cancel" },
    { text: i18n.t("pw_seePremium"), onPress: () => openPremiumScreen(beforeOpen) },
  ])
}
