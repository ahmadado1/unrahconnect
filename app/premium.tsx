// Premium screen (in-app purchase).
// Shows what Premium gives, the Monthly / Yearly plans with the store's real local prices,
// Subscribe (opens Apple's / Google's payment sheet), Restore purchases and the legal text
// Apple and Google require. No website prices or links here (store rules).
import TouchableOpacity from "@/app/components/AppPressable"
import { useTheme } from "@/context/themeContext"
import { usePremium } from "@/lib/premium"
import { buyPlan, loadPlans, manageSubscription, readStorePremiumUntil, restorePlans, setupPurchases, type PlanOption } from "@/lib/purchases"
import { supabase } from "@/lib/supabase"
import { Ionicons } from "@expo/vector-icons"
import { useRouter } from "expo-router"
import { StatusBar } from "expo-status-bar"
import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { ActivityIndicator, Alert, Platform, ScrollView, StyleSheet, Text, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"

const NAVY = "#1E3A5F"
const GOLD = "#C9A84C"

const FEATURES: { icon: keyof typeof Ionicons.glyphMap; key: string }[] = [
  { icon: "volume-high", key: "pw_f2" },
  { icon: "book", key: "pw_f3" },
  { icon: "map", key: "pw_f4" },
  { icon: "notifications", key: "pw_f5" },
  { icon: "sparkles", key: "pw_f6" },
]

export default function PremiumScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { theme } = useTheme()
  const { t, i18n } = useTranslation()
  const premium = usePremium()
  const [plans, setPlans] = useState<PlanOption[] | null>(null)
  const [chosen, setChosen] = useState<"monthly" | "yearly">("yearly")
  const [busy, setBusy] = useState<"buy" | "restore" | null>(null)
  const [fromStore, setFromStore] = useState(false)

  // Connect RevenueCat to this account, then load the plans and prices.
  useEffect(() => {
    let active = true
    const load = async () => {
      const { data } = await supabase.auth.getSession()
      await setupPurchases(data.session?.user.id)
      const list = await loadPlans()
      if (!active) return
      setPlans(list)
      if (!list.some(p => p.id === "yearly") && list[0]) setChosen(list[0].id)
      setFromStore(Boolean(await readStorePremiumUntil()))
    }
    void load()
    return () => {
      active = false
    }
  }, [])

  const plan = plans?.find(p => p.id === chosen)

  const subscribe = async () => {
    if (!plan) return
    const { data } = await supabase.auth.getSession()
    if (!data.session) {
      Alert.alert(t("pw_needLoginTitle"), t("pw_needLogin"))
      return
    }
    setBusy("buy")
    const result = await buyPlan(plan)
    setBusy(null)
    if (result === "ok") {
      await premium.refresh()
      setFromStore(true)
      Alert.alert(t("pw_thanks"), t("pw_thanksBody"), [{ text: "OK", onPress: () => router.back() }])
    } else if (result === "error") {
      Alert.alert(t("pw_errorTitle"), t("pw_error"))
    }
  }

  const restore = async () => {
    setBusy("restore")
    const ok = await restorePlans()
    setBusy(null)
    if (ok) {
      await premium.refresh()
      setFromStore(true)
    }
    Alert.alert(ok ? t("pw_restoreOkTitle") : t("pw_restoreNoneTitle"), ok ? t("pw_restoreOk") : t("pw_restoreNone"))
  }

  const untilText = premium.until
    ? new Date(`${premium.until}T12:00:00`).toLocaleDateString(i18n.language, { day: "numeric", month: "long", year: "numeric" })
    : ""

  return (
    <View style={[styles.screen, { backgroundColor: theme.background }]}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 30 }}>
        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.close} accessibilityLabel={t("close")}>
            <Ionicons name="close" size={22} color="#fff" />
          </TouchableOpacity>
          <View style={styles.star}>
            <Ionicons name="star" size={30} color={NAVY} />
          </View>
          <Text style={styles.title}>{t("pw_title")}</Text>
          <Text style={styles.subtitle}>{t("pw_sub")}</Text>
        </View>

        {/* What you get */}
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          {FEATURES.map(f => (
            <View key={f.key} style={styles.feature}>
              <View style={styles.featureIcon}>
                <Ionicons name={f.icon} size={18} color={GOLD} />
              </View>
              <Text style={[styles.featureText, { color: theme.text }]}>{t(f.key)}</Text>
            </View>
          ))}
        </View>

        {premium.isPremium ? (
          /* Already Premium */
          <View style={[styles.card, styles.activeCard]}>
            <Ionicons name="checkmark-circle" size={28} color="#2F855A" />
            <Text style={[styles.activeTitle, { color: theme.text }]}>{t("pw_active")}</Text>
            {untilText ? <Text style={[styles.muted, { color: theme.textSecondary }]}>{t("pw_activeUntil", { date: untilText })}</Text> : null}
            {fromStore ? (
              <TouchableOpacity style={styles.secondaryBtn} onPress={() => void manageSubscription()}>
                <Text style={styles.secondaryText}>{t("pw_manage")}</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        ) : plans === null ? (
          <ActivityIndicator color={GOLD} style={{ marginTop: 24 }} />
        ) : plans.length === 0 ? (
          <Text style={[styles.muted, styles.unavailable, { color: theme.textSecondary }]}>{t("pw_unavailable")}</Text>
        ) : (
          <>
            {/* Plans */}
            <View style={styles.plans}>
              {plans.map(p => {
                const on = p.id === chosen
                return (
                  <TouchableOpacity
                    key={p.id}
                    onPress={() => setChosen(p.id)}
                    style={[styles.plan, { backgroundColor: theme.card, borderColor: on ? GOLD : theme.border }, on && styles.planOn]}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: on }}
                  >
                    {p.id === "yearly" ? (
                      <Text style={styles.best}>{t("pw_bestValue")}</Text>
                    ) : null}
                    <Text style={[styles.planName, { color: theme.text }]}>{p.id === "yearly" ? t("pw_yearly") : t("pw_monthly")}</Text>
                    <Text style={styles.planPrice}>{p.price}</Text>
                    <Text style={[styles.planPer, { color: theme.textSecondary }]}>
                      {p.id === "yearly" ? (p.perMonth ? t("pw_perMonth", { price: p.perMonth }) : t("pw_perYear")) : t("pw_perMonthOnly")}
                    </Text>
                    <Ionicons name={on ? "radio-button-on" : "radio-button-off"} size={20} color={on ? GOLD : theme.textSecondary} style={styles.radio} />
                  </TouchableOpacity>
                )
              })}
            </View>

            <TouchableOpacity style={styles.buyBtn} onPress={subscribe} disabled={busy !== null || !plan}>
              {busy === "buy" ? <ActivityIndicator color={NAVY} /> : <Text style={styles.buyText}>{t("pw_subscribe")}</Text>}
            </TouchableOpacity>
          </>
        )}

        {/* Restore (Apple requires it) */}
        <TouchableOpacity style={styles.linkBtn} onPress={restore} disabled={busy !== null}>
          {busy === "restore" ? <ActivityIndicator color={GOLD} /> : <Text style={styles.link}>{t("pw_restore")}</Text>}
        </TouchableOpacity>

        {/* Legal text + Terms / Privacy (required by Apple and Google) */}
        <Text style={[styles.legal, { color: theme.textSecondary }]}>{Platform.OS === "ios" ? t("pw_legalIos") : t("pw_legalAndroid")}</Text>
        <View style={styles.legalLinks}>
          <TouchableOpacity onPress={() => router.push("/terms" as any)}>
            <Text style={styles.link}>{t("pw_terms")}</Text>
          </TouchableOpacity>
          <Text style={{ color: theme.textSecondary }}>·</Text>
          <TouchableOpacity onPress={() => router.push("/privacy" as any)}>
            <Text style={styles.link}>{t("pw_privacy")}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: { backgroundColor: NAVY, alignItems: "center", paddingHorizontal: 20, paddingBottom: 26, borderBottomLeftRadius: 26, borderBottomRightRadius: 26 },
  close: { alignSelf: "flex-end", backgroundColor: "rgba(255,255,255,0.18)", borderRadius: 20, padding: 6 },
  star: { width: 64, height: 64, borderRadius: 32, backgroundColor: GOLD, alignItems: "center", justifyContent: "center", marginTop: 4 },
  title: { color: "#fff", fontSize: 24, fontWeight: "800", marginTop: 14, textAlign: "center" },
  subtitle: { color: "#E8D5A3", fontSize: 14, marginTop: 6, textAlign: "center", lineHeight: 20 },
  card: { marginHorizontal: 16, marginTop: 16, borderRadius: 18, borderWidth: 0.5, padding: 16, gap: 12 },
  feature: { flexDirection: "row", alignItems: "center", gap: 12 },
  featureIcon: { width: 34, height: 34, borderRadius: 17, backgroundColor: "rgba(201,168,76,0.15)", alignItems: "center", justifyContent: "center" },
  featureText: { flex: 1, fontSize: 15, lineHeight: 21 },
  activeCard: { alignItems: "center", backgroundColor: "rgba(47,133,90,0.08)", borderColor: "rgba(47,133,90,0.3)" },
  activeTitle: { fontSize: 17, fontWeight: "800" },
  muted: { fontSize: 14, textAlign: "center", lineHeight: 20 },
  unavailable: { marginHorizontal: 24, marginTop: 20 },
  plans: { flexDirection: "row", gap: 12, marginHorizontal: 16, marginTop: 18 },
  plan: { flex: 1, borderRadius: 18, borderWidth: 1.5, padding: 14, paddingTop: 22 },
  planOn: { backgroundColor: "rgba(201,168,76,0.08)" },
  best: { position: "absolute", top: -11, left: 12, backgroundColor: GOLD, color: NAVY, fontSize: 11, fontWeight: "800", paddingHorizontal: 10, paddingVertical: 3, borderRadius: 999, overflow: "hidden" },
  planName: { fontSize: 15, fontWeight: "800" },
  planPrice: { color: GOLD, fontSize: 22, fontWeight: "800", marginTop: 6 },
  planPer: { fontSize: 12, marginTop: 2 },
  radio: { position: "absolute", top: 12, right: 12 },
  buyBtn: { marginHorizontal: 16, marginTop: 18, backgroundColor: GOLD, borderRadius: 16, paddingVertical: 16, alignItems: "center" },
  buyText: { color: NAVY, fontSize: 17, fontWeight: "800" },
  secondaryBtn: { borderWidth: 1.2, borderColor: GOLD, borderRadius: 999, paddingHorizontal: 18, paddingVertical: 8, marginTop: 4 },
  secondaryText: { color: GOLD, fontWeight: "800" },
  linkBtn: { alignItems: "center", marginTop: 16, minHeight: 24 },
  link: { color: GOLD, fontSize: 14, fontWeight: "700" },
  legal: { fontSize: 11, lineHeight: 16, marginHorizontal: 24, marginTop: 16, textAlign: "center" },
  legalLinks: { flexDirection: "row", justifyContent: "center", gap: 10, marginTop: 10 },
})
