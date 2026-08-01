import { useTheme } from "@/context/themeContext"
import { Ionicons } from "@expo/vector-icons"
import { useRouter } from "expo-router"
import { StatusBar } from "expo-status-bar"
import { useTranslation } from "react-i18next"
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"

const PLANS = [
  {
    id: "basic",
    nameKey: "planBasicName",
    price: "$39.99",
    periodKey: "perMonth",
    descriptionKey: "planBasicDesc",
    featureKeys: ["planBasicFeature1", "planBasicFeature2", "planBasicFeature3", "planBasicFeature4", "planBasicFeature5"],
    popular: false,
    color: "#1E3A5F",
  },
  {
    id: "pro",
    nameKey: "planProName",
    price: "$79.99",
    periodKey: "perMonth",
    descriptionKey: "planProDesc",
    featureKeys: ["planProFeature1", "planProFeature2", "planProFeature3", "planProFeature4", "planProFeature5", "planProFeature6"],
    popular: true,
    color: "#C9A84C",
  },
  {
    id: "enterprise",
    nameKey: "planEnterpriseName",
    priceKey: "planCustomPrice",
    periodKey: "",
    descriptionKey: "planEnterpriseDesc",
    featureKeys: ["planEnterpriseFeature1", "planEnterpriseFeature2", "planEnterpriseFeature3", "planEnterpriseFeature4", "planEnterpriseFeature5"],
    popular: false,
    color: "#1E3A5F",
  },
] as const

export default function PlansScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { theme } = useTheme()
  const { t } = useTranslation()

  return (
    <View style={[styles.screen, { backgroundColor: theme.background }]}>
      <StatusBar style="light" />

      <View style={[styles.header, { paddingTop: insets.top }]}>
        <Text style={styles.headerTitle}>{t("chooseYourPlan")}</Text>
        <Text style={styles.headerSub}>{t("freeTrialSub")}</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>

        <View style={[styles.whyCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.whyTitle, { color: theme.text }]}>{t("whyListAgency")}</Text>
          <View style={styles.whyRow}>
            <Ionicons name="people-outline" size={18} color="#C9A84C" />
            <Text style={[styles.whyText, { color: theme.textSecondary }]}>{t("reachPilgrims")}</Text>
          </View>
          <View style={styles.whyRow}>
            <Ionicons name="cash-outline" size={18} color="#C9A84C" />
            <Text style={[styles.whyText, { color: theme.textSecondary }]}>{t("earnCommission")}</Text>
          </View>
          <View style={styles.whyRow}>
            <Ionicons name="shield-checkmark-outline" size={18} color="#C9A84C" />
            <Text style={[styles.whyText, { color: theme.textSecondary }]}>{t("getVerified")}</Text>
          </View>
          <View style={styles.whyRow}>
            <Ionicons name="trending-up-outline" size={18} color="#C9A84C" />
            <Text style={[styles.whyText, { color: theme.textSecondary }]}>{t("growClients")}</Text>
          </View>
        </View>

        {PLANS.map(plan => (
          <View
            key={plan.id}
            style={[
              styles.planCard,
              { backgroundColor: theme.card, borderColor: theme.border },
              plan.popular && styles.planCardPopular,
            ]}
          >
            {plan.popular && (
              <View style={styles.popularBadge}>
                <Text style={styles.popularText}>{t("mostPopular")}</Text>
              </View>
            )}

            <View style={styles.planHeader}>
              <Text style={[styles.planName, { color: theme.text }]}>{t(plan.nameKey)}</Text>
              <View style={styles.planPriceRow}>
                <Text style={[styles.planPrice, { color: plan.popular ? "#C9A84C" : theme.text }]}>
                  {"priceKey" in plan ? t(plan.priceKey) : plan.price}
                </Text>
                {plan.periodKey ? (
                  <Text style={[styles.planPeriod, { color: theme.textSecondary }]}>{t(plan.periodKey)}</Text>
                ) : null}
              </View>
              <Text style={[styles.planDesc, { color: theme.textSecondary }]}>{t(plan.descriptionKey)}</Text>
            </View>

            <View style={styles.planDivider} />

            {plan.featureKeys.map((featureKey) => (
              <View key={featureKey} style={styles.featureRow}>
                <Ionicons name="checkmark-circle" size={16} color="#C9A84C" />
                <Text style={[styles.featureText, { color: theme.text }]}>{t(featureKey)}</Text>
              </View>
            ))}

            <TouchableOpacity
              style={[
                styles.planBtn,
                plan.popular && styles.planBtnActive,
              ]}
              onPress={() => router.replace("/(tabs)" as any)}
            >
              <Text style={[styles.planBtnText, plan.popular && { color: "#1E3A5F" }]}>
                {plan.id === "enterprise" ? t("contactUs2") : t("startFreeTrial")}
              </Text>
            </TouchableOpacity>
          </View>
        ))}

        <TouchableOpacity
          style={styles.skipBtn}
          onPress={() => router.replace("/(tabs)")}
        >
          <Text style={[styles.skipText, { color: theme.textSecondary }]}>{t("skipForNow")}</Text>
        </TouchableOpacity>

        <View style={{ height: 60 }} />
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: { backgroundColor: "#1E3A5F", padding: 24, paddingBottom: 20 },
  headerTitle: { color: "#fff", fontSize: 24, fontWeight: "bold" },
  headerSub: { color: "#C9A84C", fontSize: 13, marginTop: 4 },
  content: { padding: 16 },
  whyCard: { borderRadius: 16, padding: 16, borderWidth: 0.5, marginBottom: 20, gap: 12 },
  whyTitle: { fontSize: 15, fontWeight: "bold", marginBottom: 4 },
  whyRow: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  whyText: { fontSize: 13, lineHeight: 20, flex: 1 },
  planCard: { borderRadius: 16, padding: 20, borderWidth: 0.5, marginBottom: 16 },
  planCardPopular: { borderColor: "#C9A84C", borderWidth: 1.5 },
  popularBadge: { backgroundColor: "#C9A84C", borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4, alignSelf: "flex-start", marginBottom: 12 },
  popularText: { fontSize: 11, fontWeight: "bold", color: "#1E3A5F" },
  planHeader: { marginBottom: 12 },
  planName: { fontSize: 18, fontWeight: "bold", marginBottom: 4 },
  planPriceRow: { flexDirection: "row", alignItems: "baseline", gap: 4, marginBottom: 4 },
  planPrice: { fontSize: 28, fontWeight: "bold" },
  planPeriod: { fontSize: 13 },
  planDesc: { fontSize: 12 },
  planDivider: { height: 0.5, backgroundColor: "rgba(0,0,0,0.08)", marginBottom: 12 },
  featureRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 },
  featureText: { fontSize: 13 },
  planBtn: { marginTop: 16, borderRadius: 25, padding: 14, alignItems: "center", borderWidth: 1, borderColor: "#C9A84C" },
  planBtnActive: { backgroundColor: "#C9A84C" },
  planBtnText: { fontSize: 15, fontWeight: "bold", color: "#C9A84C" },
  skipBtn: { alignItems: "center", marginTop: 8 },
  skipText: { fontSize: 13 },
})
