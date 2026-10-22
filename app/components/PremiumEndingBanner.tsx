// Home banner in the last 3 days of WEBSITE Premium: "Your Premium ends in 2 days".
// App Store / Google Play subscriptions renew by themselves, so they never show this banner.
// Information only (no payment link inside the app, as the App Store / Play rules require).
// People who are not on auto-renew also get a reminder email from the website.
import { usePremium } from "@/lib/premium"
import { Ionicons } from "@expo/vector-icons"
import { useTranslation } from "react-i18next"
import { StyleSheet, Text, View } from "react-native"

const NAVY = "#1E3A5F"
const GOLD = "#C9A84C"

export default function PremiumEndingBanner() {
  const { t } = useTranslation()
  const { isPremium, until, autoRenew } = usePremium()
  if (!isPremium || !until || autoRenew) return null

  // Whole days left until the last Premium day (local calendar).
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const end = new Date(`${until.slice(0, 10)}T00:00:00`)
  const days = Math.round((end.getTime() - today.getTime()) / 86400000)
  if (Number.isNaN(days) || days < 0 || days > 3) return null

  const title = days === 0 ? t("premEndsToday") : days === 1 ? t("premEndsTomorrow") : t("premEndsInDays", { count: days })

  return (
    <View style={styles.banner}>
      <Ionicons name="star" size={18} color={NAVY} />
      <View style={{ flex: 1 }}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.sub}>{t("premEndingSub")}</Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  banner: { flexDirection: "row", alignItems: "center", gap: 10, marginHorizontal: 16, marginTop: 14, padding: 12, borderRadius: 14, backgroundColor: GOLD },
  title: { color: NAVY, fontSize: 14, fontWeight: "800" },
  sub: { color: NAVY, fontSize: 12, marginTop: 1, opacity: 0.85 },
})
