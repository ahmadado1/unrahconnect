// "Get Premium" card. Opens the Premium screen (Apple / Google in-app purchase).
//   variant "banner": small card on the Home screen for free users.
//   variant "locked": shown on a Premium-only screen (Trip Planner, Offline Map) in place of the content.
import TouchableOpacity from "@/app/components/AppPressable"
import { Ionicons } from "@expo/vector-icons"
import { LinearGradient } from "expo-linear-gradient"
import { useRouter } from "expo-router"
import { useTranslation } from "react-i18next"
import { StyleSheet, Text, View } from "react-native"

const NAVY = "#1E3A5F"
const GOLD = "#C9A84C"

type Props = { variant?: "banner" | "locked" }

export default function PremiumUpsellCard({ variant = "banner" }: Props) {
  const router = useRouter()
  const { t } = useTranslation()
  const locked = variant === "locked"

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={() => router.push("/premium" as any)}
      style={[styles.wrap, locked && styles.wrapLocked]}
      accessibilityRole="button"
      accessibilityLabel={t("pw_seePremium")}
    >
      <LinearGradient colors={[NAVY, "#2C5282"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.card, locked && styles.cardLocked]}>
        {/* Star badge */}
        <View style={[styles.star, locked && styles.starBig]}>
          <Ionicons name={locked ? "lock-open" : "star"} size={locked ? 28 : 20} color={NAVY} />
        </View>

        {/* Title + short text */}
        <View style={locked ? styles.textLocked : styles.text}>
          <Text style={[styles.title, locked && styles.center]}>{t("pw_title")}</Text>
          <Text style={[styles.sub, locked && styles.center]} numberOfLines={locked ? undefined : 2}>
            {locked ? t("premiumFeatureBody") : t("pw_sub")}
          </Text>
        </View>

        {/* Button */}
        <View style={[styles.btn, locked && styles.btnLocked]}>
          <Text style={styles.btnText}>{t("pw_seePremium")}</Text>
          <Ionicons name="chevron-forward" size={14} color={NAVY} />
        </View>
      </LinearGradient>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  wrap: { marginHorizontal: 16, marginTop: 14, borderRadius: 20, overflow: "hidden" },
  wrapLocked: { marginTop: 40, marginHorizontal: 24 },
  card: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderWidth: 1, borderColor: "rgba(201,168,76,0.5)", borderRadius: 20 },
  cardLocked: { flexDirection: "column", padding: 24, gap: 14 },
  star: { width: 40, height: 40, borderRadius: 20, backgroundColor: GOLD, alignItems: "center", justifyContent: "center" },
  starBig: { width: 60, height: 60, borderRadius: 30 },
  text: { flex: 1 },
  textLocked: { alignItems: "center" },
  title: { color: "#fff", fontSize: 16, fontWeight: "800" },
  sub: { color: "#E8D5A3", fontSize: 13, lineHeight: 18, marginTop: 3 },
  center: { textAlign: "center" },
  btn: { flexDirection: "row", alignItems: "center", gap: 2, backgroundColor: GOLD, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 7 },
  btnLocked: { paddingHorizontal: 22, paddingVertical: 11 },
  btnText: { color: NAVY, fontSize: 13, fontWeight: "800" },
})
