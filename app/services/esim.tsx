import { useTheme } from "@/context/themeContext"
import { buildSailyEsimLink, ESIM_PLANS } from "@/lib/esim"
import { GOLD, NAVY, ui } from "@/lib/ui"
import { Ionicons } from "@expo/vector-icons"
import { LinearGradient } from "expo-linear-gradient"
import { useRouter } from "expo-router"
import { StatusBar } from "expo-status-bar"
import * as WebBrowser from "expo-web-browser"
import { useTranslation } from "react-i18next"
import { Linking, ScrollView, StyleSheet, Text, View } from "react-native"
import TouchableOpacity from "@/app/components/AppPressable"
import { useSafeAreaInsets } from "react-native-safe-area-context"

const STEPS = ["esimStep1", "esimStep2", "esimStep3"] as const
const PHONES = ["esimIphone", "esimSamsung", "esimPixel"] as const

export default function EsimScreen() {
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
            <Text style={styles.title}>{t("coverSaily")}</Text>
            <Text style={styles.subtitle}>{t("esimHeaderSub")}</Text>
          </View>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 28 }]}
        contentInsetAdjustmentBehavior="never"
      >
        <LinearGradient
          colors={theme.dark ? ["#2C2814", "#241F12"] : ["#FFFDF4", "#FFF6C8"]}
          style={[styles.sailyBox, { borderColor: theme.dark ? "#6A5A20" : "#F0D56A" }]}
        >
          <LinearGradient colors={["#F5D000", "#FFE566"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.brandAccent} />
          <View style={styles.brandBody}>
            {ESIM_PLANS.map(plan => (
              <View
                key={plan.id}
                style={[
                  styles.plan,
                  {
                    backgroundColor: theme.dark ? "#1E2A3A" : "#fff",
                    borderColor: plan.bestForUmrah ? "#E8C200" : theme.border,
                  },
                ]}
              >
                {plan.bestForUmrah ? (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{t("esimBest")}</Text>
                  </View>
                ) : null}
                <Text style={[styles.planText, { color: theme.text }]}>
                  {t("esimPlanLine", { gb: plan.dataGb, days: plan.days, price: plan.price.toFixed(2) })}
                </Text>
              </View>
            ))}
            <Text style={[styles.note, { color: theme.textSecondary }]}>{t("esimPriceNote")}</Text>
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
          style={styles.getBtn}
          onPress={() => {
            const url = buildSailyEsimLink()
            console.log(url)
            const started = Date.now()
            void WebBrowser.openBrowserAsync(url)
              .then(result => {
                const returnedImmediately = Date.now() - started < 400
                if (returnedImmediately && result.type !== "opened") return Linking.openURL(url)
                return result
              })
              .catch(() => Linking.openURL(url))
          }}
          accessibilityRole="button"
        >
          <Text style={styles.getText}>{t("esimGet")}</Text>
        </TouchableOpacity>
        <Text style={[styles.footer, { color: theme.textSecondary }]}>{t("esimFooter")}</Text>
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
  sailyBox: {
    borderRadius: ui.radius,
    borderWidth: 1,
    overflow: "hidden",
    marginBottom: 4,
  },
  brandAccent: { height: 4 },
  brandBody: { padding: ui.cardPad },
  plan: {
    borderRadius: ui.radius,
    borderWidth: 1,
    padding: ui.cardPad,
    marginBottom: 10,
  },
  badge: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(201,168,76,0.18)",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginBottom: 8,
  },
  badgeText: { color: GOLD, fontSize: 11, fontWeight: "700" },
  planText: { fontSize: 16, fontWeight: "700" },
  note: { fontSize: 12, marginTop: 2 },
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
  getBtn: {
    marginTop: 24,
    backgroundColor: NAVY,
    borderRadius: ui.radius,
    paddingVertical: 16,
    alignItems: "center",
  },
  getText: { color: GOLD, fontSize: 16, fontWeight: "700" },
  footer: { fontSize: 12, textAlign: "center", marginTop: 16 },
})
