// Shown once right after someone gets Premium: what they got and where to find it.
// Each feature has an "Open" button; the new features also glow in the app until opened.
import TouchableOpacity from "@/app/components/AppPressable"
import { useTheme } from "@/context/themeContext"
import { markFeatureSeen, type PremiumFeatureId } from "@/lib/premiumNew"
import { Ionicons } from "@expo/vector-icons"
import { LinearGradient } from "expo-linear-gradient"
import { useRouter } from "expo-router"
import { StatusBar } from "expo-status-bar"
import { useTranslation } from "react-i18next"
import { ScrollView, StyleSheet, Text, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"

const NAVY = "#1E3A5F"
const GOLD = "#C9A84C"

const ITEMS: { id: PremiumFeatureId; icon: keyof typeof Ionicons.glyphMap; title: string; body: string; route: string | null }[] = [
  { id: "goal", icon: "flag", title: "pwW_goal", body: "pwW_goalBody", route: "/(tabs)" },
  { id: "companion", icon: "sync", title: "mkTitle", body: "pwW_companionBody", route: "/makkah-companion" },
  { id: "miqat", icon: "airplane", title: "mqTitle", body: "pwW_miqatBody", route: "/miqat-alert" },
  { id: "widget", icon: "phone-portrait", title: "pwW_widget", body: "pwW_widgetBody", route: null },
  { id: "voices", icon: "volume-high", title: "pwW_voices", body: "pwW_voicesBody", route: "/(tabs)/umrah" },
  { id: "trip", icon: "map", title: "pwW_trip", body: "pwW_tripBody", route: "/trip-planner" },
]

export default function PremiumWelcomeScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { theme } = useTheme()
  const { t } = useTranslation()

  const open = (item: (typeof ITEMS)[number]) => {
    if (!item.route) return
    void markFeatureSeen(item.id)
    router.replace(item.route as any)
  }

  return (
    <View style={[styles.screen, { backgroundColor: theme.background }]}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 30 }}>
        <LinearGradient colors={[NAVY, "#2C5282"]} style={[styles.hero, { paddingTop: insets.top + 24 }]}>
          <View style={styles.star}>
            <Ionicons name="star" size={30} color={NAVY} />
          </View>
          <Text style={styles.title}>{t("pwW_title")}</Text>
          <Text style={styles.sub}>{t("pwW_sub")}</Text>
        </LinearGradient>

        {ITEMS.map(item => (
          <View key={item.id} style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={styles.icon}>
              <Ionicons name={item.icon} size={20} color={GOLD} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.cardTitle, { color: theme.text }]}>{t(item.title)}</Text>
              <Text style={[styles.cardBody, { color: theme.textSecondary }]}>{t(item.body)}</Text>
            </View>
            {item.route ? (
              <TouchableOpacity style={styles.openBtn} onPress={() => open(item)}>
                <Text style={styles.openText}>{t("pwW_open")}</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        ))}

        <TouchableOpacity style={styles.doneBtn} onPress={() => router.replace("/(tabs)" as any)}>
          <Text style={styles.doneText}>{t("pwW_start")}</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  hero: { alignItems: "center", paddingHorizontal: 24, paddingBottom: 28, borderBottomLeftRadius: 26, borderBottomRightRadius: 26 },
  star: { width: 64, height: 64, borderRadius: 32, backgroundColor: GOLD, alignItems: "center", justifyContent: "center" },
  title: { color: "#fff", fontSize: 24, fontWeight: "800", marginTop: 14, textAlign: "center" },
  sub: { color: "#E8D5A3", fontSize: 14, marginTop: 6, textAlign: "center", lineHeight: 20 },
  card: { flexDirection: "row", alignItems: "center", gap: 12, marginHorizontal: 16, marginTop: 12, borderWidth: 0.5, borderRadius: 16, padding: 14 },
  icon: { width: 38, height: 38, borderRadius: 19, backgroundColor: "rgba(201,168,76,0.15)", alignItems: "center", justifyContent: "center" },
  cardTitle: { fontSize: 15, fontWeight: "800" },
  cardBody: { fontSize: 13, lineHeight: 18, marginTop: 2 },
  openBtn: { borderWidth: 1.2, borderColor: GOLD, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6 },
  openText: { color: GOLD, fontWeight: "800", fontSize: 12 },
  doneBtn: { marginHorizontal: 16, marginTop: 20, backgroundColor: GOLD, borderRadius: 16, paddingVertical: 15, alignItems: "center" },
  doneText: { color: NAVY, fontSize: 16, fontWeight: "800" },
})
