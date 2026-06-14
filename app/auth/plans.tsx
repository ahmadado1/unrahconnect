import { useTheme } from "@/context/themeContext"
import { Ionicons } from "@expo/vector-icons"
import { useRouter } from "expo-router"
import { StatusBar } from "expo-status-bar"
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"

const PLANS = [
  {
    id: "basic",
    name: "Basic",
    price: "$49",
    period: "/ month",
    description: "Perfect for small agencies",
    features: [
      "Listed in UmrahConnect app",
      "Up to 20 active clients",
      "Hotel booking commissions",
      "Verified agency badge",
      "Email support",
    ],
    popular: false,
    color: "#1E3A5F",
  },
  {
    id: "pro",
    name: "Pro",
    price: "$99",
    period: "/ month",
    description: "For growing agencies",
    features: [
      "Everything in Basic",
      "Up to 100 active clients",
      "Flight redirect commissions",
      "Priority listing in app",
      "Analytics dashboard",
      "Priority support",
    ],
    popular: true,
    color: "#C9A84C",
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: "Custom",
    period: "",
    description: "For large agencies",
    features: [
      "Everything in Pro",
      "Unlimited clients",
      "White-label option",
      "Dedicated account manager",
      "Custom integrations",
    ],
    popular: false,
    color: "#1E3A5F",
  },
]

export default function PlansScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { theme } = useTheme()

  return (
    <View style={[styles.screen, { backgroundColor: theme.background }]}>
      <StatusBar style="light" />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <Text style={styles.headerTitle}>Choose Your Plan</Text>
        <Text style={styles.headerSub}>Start with a 14-day free trial — no card needed</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>

        {/* Why join section */}
        <View style={[styles.whyCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.whyTitle, { color: theme.text }]}>Why list your agency?</Text>
          <View style={styles.whyRow}>
            <Ionicons name="people-outline" size={18} color="#C9A84C" />
            <Text style={[styles.whyText, { color: theme.textSecondary }]}>Reach thousands of pilgrims searching for agents</Text>
          </View>
          <View style={styles.whyRow}>
            <Ionicons name="cash-outline" size={18} color="#C9A84C" />
            <Text style={[styles.whyText, { color: theme.textSecondary }]}>Earn commission on hotel and flight bookings</Text>
          </View>
          <View style={styles.whyRow}>
            <Ionicons name="shield-checkmark-outline" size={18} color="#C9A84C" />
            <Text style={[styles.whyText, { color: theme.textSecondary }]}>Get a verified badge that builds trust</Text>
          </View>
          <View style={styles.whyRow}>
            <Ionicons name="trending-up-outline" size={18} color="#C9A84C" />
            <Text style={[styles.whyText, { color: theme.textSecondary }]}>Grow your client base with zero marketing cost</Text>
          </View>
        </View>

        {/* Plans */}
        {PLANS.map(plan => (
          <View
            key={plan.id}
            style={[
              styles.planCard,
              { backgroundColor: theme.card, borderColor: theme.border },
              plan.popular && styles.planCardPopular,
            ]}
          >
            {/* Popular badge */}
            {plan.popular && (
              <View style={styles.popularBadge}>
                <Text style={styles.popularText}>Most Popular</Text>
              </View>
            )}

            <View style={styles.planHeader}>
              <Text style={[styles.planName, { color: theme.text }]}>{plan.name}</Text>
              <View style={styles.planPriceRow}>
                <Text style={[styles.planPrice, { color: plan.popular ? "#C9A84C" : theme.text }]}>{plan.price}</Text>
                <Text style={[styles.planPeriod, { color: theme.textSecondary }]}>{plan.period}</Text>
              </View>
              <Text style={[styles.planDesc, { color: theme.textSecondary }]}>{plan.description}</Text>
            </View>

            <View style={styles.planDivider} />

            {plan.features.map((feature, i) => (
              <View key={i} style={styles.featureRow}>
                <Ionicons name="checkmark-circle" size={16} color="#C9A84C" />
                <Text style={[styles.featureText, { color: theme.text }]}>{feature}</Text>
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
                {plan.id === "enterprise" ? "Contact Us" : "Start Free Trial"}
              </Text>
            </TouchableOpacity>
          </View>
        ))}

        {/* Skip for now */}
        <TouchableOpacity
          style={styles.skipBtn}
          onPress={() => router.replace("/(tabs)")}
        >
          <Text style={[styles.skipText, { color: theme.textSecondary }]}>Skip for now — decide later</Text>
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