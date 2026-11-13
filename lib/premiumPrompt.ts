// "This is a Premium feature" pop-up.
// The nice card is drawn by <PremiumPromptHost /> (one in the root layout, plus one inside
// any pop-up sheet that can show it). The newest host on screen shows the card.
// If no host is mounted yet, it falls back to a simple system alert.
import i18n from "@/i18n"
import { router } from "expo-router"
import { Alert } from "react-native"
import { agencyAccessNow } from "./premium"

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
  // Agency accounts never see Premium: their agency dashboard instead
  if (agencyAccessNow()) {
    setTimeout(() => router.push("/agent/dashboard" as any), beforeOpen ? 300 : 0)
    return
  }
  setTimeout(() => router.push("/premium" as any), beforeOpen ? 300 : 0)
}

/** Show the Premium card. beforeOpen runs only if the user taps "See Premium". */
export function showPremiumPrompt(beforeOpen?: () => void) {
  // Agency still being verified: explain instead of offering Premium
  if (agencyAccessNow()) {
    Alert.alert(i18n.t("agencyFeatureTitle"), i18n.t("agencyFeatureBody"), [
      { text: i18n.t("ok", { defaultValue: "OK" }), style: "cancel" },
      { text: i18n.t("agentDashboard"), onPress: () => router.push("/agent/dashboard" as any) },
    ])
    return
  }
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
