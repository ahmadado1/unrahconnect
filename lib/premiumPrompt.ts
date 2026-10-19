// "This is a Premium feature" popup with a button that opens the Premium screen.
import i18n from "@/i18n"
import { router } from "expo-router"
import { Alert } from "react-native"

/** beforeOpen: e.g. close a pop-up first, so the Premium screen is not hidden behind it. */
export function showPremiumPrompt(beforeOpen?: () => void) {
  Alert.alert(i18n.t("premiumFeature"), i18n.t("premiumFeatureBody"), [
    { text: i18n.t("pw_notNow"), style: "cancel" },
    { text: i18n.t("pw_seePremium"), onPress: () => {
        beforeOpen?.()
        setTimeout(() => router.push("/premium" as any), beforeOpen ? 300 : 0)
      } },
  ])
}
