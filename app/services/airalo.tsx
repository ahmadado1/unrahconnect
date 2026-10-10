import TouchableOpacity from "@/app/components/AppPressable"
import { useTheme } from "@/context/themeContext"
import { AIRALO_PLANS, buildAiraloEsimLink } from "@/lib/esim"
import { GOLD, NAVY, ui } from "@/lib/ui"
import { Ionicons } from "@expo/vector-icons"
import { LinearGradient } from "expo-linear-gradient"
import { useRouter } from "expo-router"
import { StatusBar } from "expo-status-bar"
import * as WebBrowser from "expo-web-browser"
import { useTranslation } from "react-i18next"
import { ScrollView, StyleSheet, Text, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"

const STEPS = ["esimStep1", "esimStep2", "esimStep3"] as const
const PHONES = ["esimIphone", "esimSamsung", "esimPixel"] as const

export default function AiraloScreen() {
  const router = useRouter()
  const { theme } = useTheme()
  const { t } = useTranslation()
  const insets = useSafeAreaInsets()

  return (
    <View style={[styles.screen, { backgroundColor: theme.background }]}>
      <StatusBar style="light" />
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn} accessibilityRole="button" accessibilityLabel={t("back")}>
            <Ionicons name="arrow-back" size={22} color="#fff" />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>{t("coverAiralo")}</Text>
            <Text style={styles.subtitle}>{t("esimAiraloSub")}</Text>
          </View>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 28 }]}
        contentInsetAdjustmentBehavior="never"
      >
        <LinearGradient
          colors={theme.dark ? ["#2E221C", "#2A1A22"] : ["#FFF6EE", "#FDEAF2"]}
          style={[styles.box, { borderColor: theme.dark ? "#6A4038" : "#F3C2B4" }]}
        >
          <LinearGradient
            colors={["#F6B73D", "#F58A2A", "#F15B4A", "#E23D7A"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.accent}
          />
          <View style={styles.body}>
            <View style={styles.chips}>
              {AIRALO_PLANS.map(plan => (
                <View key={plan.id} style={[styles.chip, { backgroundColor: theme.dark ? "#1E2A3A" : "#fff", borderColor: theme.dark ? "#6A4038" : "#F3C2B4" }]}>
                  <Text style={[styles.chipText, { color: theme.text }]}>
                    {t("esimAiraloPlan", { days: plan.days, price: plan.price })}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        </LinearGradient>

        <Text style={[styles.sectionTitle, { color: theme.text }]}>{t("esimHowTitle")}</Text>
        <View style={[styles.block, { backgroundColor: theme.card, borderColor: theme.border }]}>
          {STEPS.map((key, index) => (
            <View key={key} style={styles.stepRow}>
              <View style={styles.stepNum}>
                <Text style={styles.stepNumText}>{index + 1}</Text>
              </View>
              <Text style={[styles.stepText, { color: theme.text }]}>{t(key)}</Text>
            </View>
          ))}
        </View>

        <Text style={[styles.sectionTitle, { color: theme.text }]}>{t("esimSupportTitle")}</Text>
        <View style={[styles.block, { backgroundColor: theme.card, borderColor: theme.border }]}>
          {PHONES.map(key => (
            <Text key={key} style={[styles.phoneLine, { color: theme.text }]}>{t(key)}</Text>
          ))}
          <Text style={[styles.check, { color: theme.textSecondary }]}>{t("esimCheck")}</Text>
        </View>

        <TouchableOpacity
          style={[styles.button, { borderColor: "#E86A4A" }]}
          onPress={() => void WebBrowser.openBrowserAsync(buildAiraloEsimLink())}
          accessibilityRole="button"
        >
          <Text style={[styles.buttonText, { color: theme.text }]}>{t("esimAiraloView")}</Text>
        </TouchableOpacity>
        <Text style={[styles.footer, { color: theme.textSecondary }]}>{t("esimAiraloFooter")}</Text>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: { backgroundColor: NAVY, paddingBottom: 16 },
  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  title: { color: "#fff", fontSize: 22, fontWeight: "bold" },
  subtitle: { color: GOLD, fontSize: 13, marginTop: 4, lineHeight: 18 },
  content: { padding: ui.space },
  box: { borderRadius: ui.radius, borderWidth: 1, overflow: "hidden" },
  accent: { height: 4 },
  body: { padding: ui.cardPad },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    borderRadius: 8,
    borderWidth: ui.hairline,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  chipText: { fontSize: 12, fontWeight: "600" },
  sectionTitle: { fontSize: 17, fontWeight: "bold", marginTop: 20, marginBottom: 10 },
  block: { borderRadius: ui.radius, borderWidth: ui.hairline, padding: ui.cardPad, gap: 12 },
  stepRow: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  stepNum: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: NAVY,
    alignItems: "center",
    justifyContent: "center",
  },
  stepNumText: { color: GOLD, fontSize: 13, fontWeight: "700" },
  stepText: { flex: 1, fontSize: 14, lineHeight: 20 },
  phoneLine: { fontSize: 14, lineHeight: 20 },
  check: { fontSize: 13, lineHeight: 20 },
  button: {
    marginTop: 24,
    borderRadius: ui.radius,
    borderWidth: 1.5,
    paddingVertical: 14,
    alignItems: "center",
    backgroundColor: "transparent",
  },
  buttonText: { fontSize: 15, fontWeight: "700" },
  footer: { fontSize: 12, textAlign: "center", marginTop: 16 },
})
