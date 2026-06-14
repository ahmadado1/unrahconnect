import { useTheme } from "@/context/themeContext"
import { Ionicons } from "@expo/vector-icons"
import { useRouter } from "expo-router"
import { StatusBar } from "expo-status-bar"
import { useTranslation } from "react-i18next"
import { Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"


// ─── DATA ─────────────────────────────────────────────────────────────────────

const APP_SERVICES = [
  { id: "hotels", emoji: "🏨", titleKey: "hotelsTitle", subKey: "hotelsSub", route: "/hotels", icon: "bed-outline" },
  { id: "restaurants", emoji: "🍽️", titleKey: "restaurantsTitle", subKey: "restaurantsSub", route: "/restaurants", icon: "restaurant-outline" },
  { id: "booking", emoji: "📅", titleKey: "booking", subKey: "bookingSub", route: "/booking", icon: "calendar-outline" },
  { id: "search", emoji: "🔍", titleKey: "search", subKey: "searchSub", route: "/search", icon: "search-outline" },
] as const

const TRANSPORT = [
  { id: "haramain", emoji: "🚄", titleKey: "haramainRailway", subKey: "haramainSub", url: "https://www.hhr.com.sa" },
  { id: "saptco", emoji: "🚌", titleKey: "saptcoBuses", subKey: "saptcoSub", url: "https://www.saptco.com.sa" },
  { id: "uber", emoji: "🚗", titleKey: "uber", subKey: "uberSub", url: "https://www.uber.com" },
] as const

const SHOPPING = [
  { id: "abraj", emoji: "🛍️", titleKey: "abrajMall", subKey: "abrajSub", url: "https://maps.google.com/?q=Abraj+Al+Bait+Mall+Makkah" },
  { id: "zal", emoji: "🪬", titleKey: "souqZal", subKey: "souqZalSub", url: "https://maps.google.com/?q=Souq+Al+Zal+Makkah" },
  { id: "madinah-mall", emoji: "🏬", titleKey: "madinahMall", subKey: "madinahMallSub", url: "https://maps.google.com/?q=Madinah+Mall+Saudi+Arabia" },
  { id: "ansar", emoji: "🛒", titleKey: "ansarMall", subKey: "ansarMallSub", url: "https://maps.google.com/?q=Ansar+Mall+Madinah" },
] as const

const COMING_SOON = [
  { id: "flights", emoji: "✈️", titleKey: "flights", subKey: "flightsSub" },
  { id: "pharmacy", emoji: "💊", titleKey: "pharmacy", subKey: "pharmacySub" },
  { id: "sim", emoji: "📱", titleKey: "simCards", subKey: "simCardsSub" },
] as const

export default function ServicesScreen() {
  const router = useRouter()
  const { theme } = useTheme()
  const { t } = useTranslation()
  const insets = useSafeAreaInsets()

  return (
    <View style={[styles.screen, { backgroundColor: theme.background }]}>
      <StatusBar style="light" />

      {/* ── HEADER ── */}
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <Text style={styles.title}>{t("services")}</Text>
        <Text style={styles.subtitle}>{t("servicesSub")}</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>

        {/* ── IN-APP SERVICES ── opens inside the app */}
        <View style={styles.grid}>
          {APP_SERVICES.map(s => (
            <TouchableOpacity
              key={s.id}
              style={[styles.gridCard, { backgroundColor: theme.card, borderColor: theme.border }]}
              onPress={() => router.push(s.route as any)}
            >
              <Text style={styles.emoji}>{s.emoji}</Text>
              <Text style={[styles.cardTitle, { color: theme.text }]}>{t(s.titleKey)}</Text>
              <Text style={[styles.cardSub, { color: theme.textSecondary }]}>{t(s.subKey)}</Text>
              <View style={styles.cardFooter}>
                <Ionicons name={s.icon as any} size={16} color="#C9A84C" />
                <Ionicons name="chevron-forward" size={16} color="#C9A84C" />
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── TRANSPORT ── opens external websites */}
        <Text style={[styles.sectionTitle, { color: theme.text }]}>{t("transport")}</Text>
        <Text style={[styles.sectionSub, { color: theme.textSecondary }]}>{t("transportSub")}</Text>
        {TRANSPORT.map(s => (
          <TouchableOpacity
            key={s.id}
            style={[styles.listCard, { backgroundColor: theme.card, borderColor: theme.border }]}
            onPress={() => Linking.openURL(s.url)}
          >
            <Text style={styles.listEmoji}>{s.emoji}</Text>
            <View style={{ flex: 1 }}>
              <Text style={[styles.listTitle, { color: theme.text }]}>{t(s.titleKey)}</Text>
              <Text style={[styles.listSub, { color: theme.textSecondary }]}>{t(s.subKey)}</Text>
            </View>
            {/* Tag showing it's an official/external site */}
            <View style={styles.tag}>
              <Text style={styles.tagText}>{t("officialSite")}</Text>
            </View>
          </TouchableOpacity>
        ))}

        {/* ── SHOPPING ── opens Google Maps */}
        <Text style={[styles.sectionTitle, { color: theme.text }]}>{t("shopping")}</Text>
        <Text style={[styles.sectionSub, { color: theme.textSecondary }]}>{t("shoppingSub")}</Text>
        {SHOPPING.map(s => (
          <TouchableOpacity
            key={s.id}
            style={[styles.listCard, { backgroundColor: theme.card, borderColor: theme.border }]}
            onPress={() => Linking.openURL(s.url)}
          >
            <Text style={styles.listEmoji}>{s.emoji}</Text>
            <View style={{ flex: 1 }}>
              <Text style={[styles.listTitle, { color: theme.text }]}>{t(s.titleKey)}</Text>
              <Text style={[styles.listSub, { color: theme.textSecondary }]}>{t(s.subKey)}</Text>
            </View>
            <Ionicons name="map-outline" size={20} color="#C9A84C" />
          </TouchableOpacity>
        ))}

        {/* ── COMING SOON ── greyed out */}
        <Text style={[styles.sectionTitle, { color: theme.text }]}>{t("comingSoon")}</Text>
        {COMING_SOON.map(s => (
          <View
            key={s.id}
            style={[styles.listCard, { backgroundColor: theme.card, borderColor: theme.border, opacity: 0.5 }]}
          >
            <Text style={styles.listEmoji}>{s.emoji}</Text>
            <View style={{ flex: 1 }}>
              <Text style={[styles.listTitle, { color: theme.text }]}>{t(s.titleKey)}</Text>
              <Text style={[styles.listSub, { color: theme.textSecondary }]}>{t(s.subKey)}</Text>
            </View>
            <View style={styles.comingSoonTag}>
              <Text style={styles.comingSoonText}>{t("comingSoonLabel")}</Text>
            </View>
          </View>
        ))}

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: { backgroundColor: "#1E3A5F", paddingHorizontal: 20, paddingBottom: 20 },
  title: { color: "#fff", fontSize: 26, fontWeight: "bold", marginTop: 16 },
  subtitle: { color: "#C9A84C", fontSize: 13, marginTop: 4 },
  content: { padding: 16 },
  sectionTitle: { fontSize: 17, fontWeight: "bold", marginTop: 24, marginBottom: 4 },
  sectionSub: { fontSize: 12, marginBottom: 12 },

  // Grid — 2 columns for app services
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginBottom: 8 },
  gridCard: { width: "47%", borderRadius: 16, padding: 16, borderWidth: 0.5, minHeight: 130 },
  emoji: { fontSize: 28, marginBottom: 8 },
  cardTitle: { fontSize: 14, fontWeight: "bold", marginBottom: 4 },
  cardSub: { fontSize: 11, flex: 1 },
  cardFooter: { flexDirection: "row", justifyContent: "space-between", marginTop: 10 },

  // List — full width for transport and shopping
  listCard: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderRadius: 14, borderWidth: 0.5, marginBottom: 10 },
  listEmoji: { fontSize: 26 },
  listTitle: { fontSize: 14, fontWeight: "600" },
  listSub: { fontSize: 11, marginTop: 2 },

  // Tags
  tag: { backgroundColor: "#FAEEDA", borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  tagText: { fontSize: 10, color: "#633806", fontWeight: "600" },
  comingSoonTag: { backgroundColor: "rgba(0,0,0,0.06)", borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  comingSoonText: { fontSize: 10, color: "#888", fontWeight: "600" },
})