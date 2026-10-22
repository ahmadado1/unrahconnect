// "Your plan" card for the Profile screen.
// Free: a calm card. Premium: a gold card with what is unlocked.
// Status only — no prices, no buttons to buy (App Store / Play rules).
import { useTheme } from "@/context/themeContext"
import { usePremium } from "@/lib/premium"
import { Ionicons } from "@expo/vector-icons"
import { useTranslation } from "react-i18next"
import { StyleSheet, Text, View } from "react-native"

const NAVY = "#1E3A5F"
const GOLD = "#C9A84C"

export default function PremiumPlanCard() {
  const { theme, isDark } = useTheme()
  const { t, i18n } = useTranslation()
  const { isPremium, until, autoRenew } = usePremium()

  const date = until
    ? new Date(`${until}T00:00:00`).toLocaleDateString(i18n.language || "en", { day: "numeric", month: "long", year: "numeric" })
    : ""

  // ─── Free ─────────────────────────────────────────────────────────────────
  if (!isPremium) {
    return (
      <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <Text style={[styles.label, { color: theme.textSecondary }]}>{t("planTitle")}</Text>
        <View style={styles.row}>
          <View style={[styles.icon, { backgroundColor: isDark ? "rgba(255,255,255,0.08)" : "#EEF2F7" }]}>
            <Ionicons name="leaf-outline" size={18} color={NAVY} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.title, { color: theme.text }]}>{t("planFree")}</Text>
            <Text style={[styles.body, { color: theme.textSecondary }]}>{t("planFreeBody")}</Text>
          </View>
        </View>
      </View>
    )
  }

  // ─── Premium ──────────────────────────────────────────────────────────────
  const unlocked = [t("planFeatAdhan"), t("planFeatFonts"), t("planFeatGuided"), t("planFeatAi")]
  return (
    <View style={[styles.card, styles.premiumCard, { backgroundColor: isDark ? "#2A2414" : "#FBF6E8" }]}>
      <Text style={[styles.label, { color: "#A07F2A" }]}>{t("planTitle")}</Text>
      <View style={styles.row}>
        <View style={[styles.icon, { backgroundColor: GOLD }]}>
          <Ionicons name="star" size={18} color={NAVY} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: isDark ? "#F3E3B5" : NAVY }]}>{t("planPremium")}</Text>
          {date ? <Text style={[styles.body, { color: isDark ? "#D9C894" : "#7A6A3A" }]}>{t(autoRenew ? "planPremiumRenews" : "planPremiumUntil", { date })}</Text> : null}
        </View>
      </View>
      <View style={styles.divider} />
      <Text style={[styles.unlockedLabel, { color: "#A07F2A" }]}>{t("planUnlocked")}</Text>
      {unlocked.map(item => (
        <View key={item} style={styles.featureRow}>
          <Ionicons name="checkmark-circle" size={16} color={GOLD} />
          <Text style={[styles.feature, { color: isDark ? "#EDE3C8" : NAVY }]}>{item}</Text>
        </View>
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  card: { marginHorizontal: 16, marginTop: 16, borderRadius: 16, padding: 16, borderWidth: 0.5 },
  premiumCard: { borderWidth: 1.5, borderColor: GOLD },
  label: { fontSize: 12, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 10 },
  row: { flexDirection: "row", alignItems: "center", gap: 12 },
  icon: { width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 16, fontWeight: "bold" },
  body: { fontSize: 13, marginTop: 2, lineHeight: 18 },
  divider: { height: 1, backgroundColor: "rgba(201,168,76,0.35)", marginVertical: 12 },
  unlockedLabel: { fontSize: 11, fontWeight: "700", marginBottom: 6 },
  featureRow: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 3 },
  feature: { fontSize: 13, flex: 1 },
})
