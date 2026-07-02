import { useTheme } from "@/context/themeContext"
import { Ionicons } from "@expo/vector-icons"
import * as Location from "expo-location"
import { useRouter } from "expo-router"
import { StatusBar } from "expo-status-bar"
import { useTranslation } from "react-i18next"
import { Linking, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"

// ─── DATA ─────────────────────────────────────────────────────────────────────

const APP_SERVICES = [
  { id: "hotels", emoji: "🏨", titleKey: "hotelsTitle", subKey: "hotelsSub", route: "/hotels", icon: "bed-outline" },
  { id: "restaurants", emoji: "🍽️", titleKey: "restaurantsTitle", subKey: "restaurantsSub", route: "/restaurants", icon: "restaurant-outline" },
  { id: "booking", emoji: "📅", titleKey: "booking", subKey: "bookingSub", route: "/booking", icon: "calendar-outline" },
  { id: "agents", emoji: "🏢", titleKey: "findAgent", subKey: "findAgentSub", route: "/agent", icon: "people-outline" },
] as const

const HARAMAIN_STATIONS = [
  {
    id: "makkah",
    emoji: "🚄",
    titleKey: "makkahStation",
    addressKey: "makkahStationAddress",
    lat: 21.4536,
    lng: 39.8018,
  },
  {
    id: "madinah",
    emoji: "🚄",
    titleKey: "madinahStation",
    addressKey: "madinahStationAddress",
    lat: 24.5489,
    lng: 39.7392,
  },
] as const

const SAPTCO_URL = "https://www.saptco.com.sa"
const UBER_FALLBACK_URL = "https://www.uber.com"
const HARAM_LAT = 21.4225
const HARAM_LNG = 39.8262

const SHOPPING = [
  { id: "abraj", emoji: "🛍️", titleKey: "abrajMall", subKey: "abrajSub", lat: 21.4183, lng: 39.8260 },
  { id: "zal", emoji: "🪬", titleKey: "souqZal", subKey: "souqZalSub", lat: 21.4157, lng: 39.8198 },
  { id: "madinah-mall", emoji: "🏬", titleKey: "madinahMall", subKey: "madinahMallSub", lat: 24.4672, lng: 39.6150 },
  { id: "ansar", emoji: "🛒", titleKey: "ansarMall", subKey: "ansarMallSub", lat: 24.4698, lng: 39.6118 },
] as const

const COMING_SOON = [
  { id: "flights", emoji: "✈️", titleKey: "flights", subKey: "flightsSub" },
  { id: "pharmacy", emoji: "💊", titleKey: "pharmacy", subKey: "pharmacySub" },
  { id: "sim", emoji: "📱", titleKey: "simCards", subKey: "simCardsSub" },
  { id: "search", emoji: "🔍", titleKey: "search", subKey: "searchSub", route: "/search", icon: "search-outline" },
] as const

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function openDirections(lat: number, lng: number) {
  Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`)
}

async function openNearestSaptcoStop() {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync()
    if (status === "granted") {
      const pos = await Location.getCurrentPositionAsync({})
      const { latitude, longitude } = pos.coords
      const query = encodeURIComponent("SAPTCO bus stop")
      Linking.openURL(`https://www.google.com/maps/search/${query}/@${latitude},${longitude},14z`)
      return
    }
  } catch {
    // fall through to default search
  }
  Linking.openURL("https://www.google.com/maps/search/SAPTCO+bus+stop+Makkah")
}

async function openUberToHaram() {
  const uberUrl =
    `uber://?action=setPickup&pickup=my_location` +
    `&dropoff[latitude]=${HARAM_LAT}&dropoff[longitude]=${HARAM_LNG}` +
    `&dropoff[nickname]=${encodeURIComponent("Masjid al-Haram")}`

  try {
    const supported = await Linking.canOpenURL(uberUrl)
    if (supported) {
      await Linking.openURL(uberUrl)
      return
    }
  } catch {
    // try direct open below
  }

  try {
    await Linking.openURL(uberUrl)
  } catch {
    Linking.openURL(UBER_FALLBACK_URL)
  }
}

// ─── SCREEN ───────────────────────────────────────────────────────────────────

export default function ServicesScreen() {
  const router = useRouter()
  const { theme } = useTheme()
  const { t } = useTranslation()
  const insets = useSafeAreaInsets()

  return (
    <View style={[styles.screen, { backgroundColor: theme.background }]}>
      <StatusBar style="light" />

      <View style={[styles.header, { paddingTop: insets.top }]}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", marginTop: 16 }}>
          <View>
            <Text style={styles.title}>{t("services")}</Text>
            <Text style={styles.subtitle}>{t("servicesSub")}</Text>
          </View>
          <TouchableOpacity
            style={{ backgroundColor: "rgba(255,255,255,0.12)", borderRadius: 20, padding: 10, marginBottom: 2 }}
            onPress={() => router.push("/search" as any)}
          >
            <Ionicons name="search" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>

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

        {/* ── TRANSPORT ── */}
        <Text style={[styles.sectionTitle, { color: theme.text }]}>{t("transport")}</Text>
        <Text style={[styles.sectionSub, { color: theme.textSecondary }]}>{t("transportSub")}</Text>

        <Text style={[styles.groupLabel, { color: theme.textSecondary }]}>{t("haramainRailway")}</Text>
        {HARAMAIN_STATIONS.map(station => (
          <TouchableOpacity
            key={station.id}
            style={[styles.expandCard, { backgroundColor: theme.card, borderColor: theme.border }]}
            onPress={() => router.push(`/haramain/${station.id}` as any)}
            activeOpacity={0.85}
          >
            <View style={styles.expandHeader}>
              <Text style={styles.listEmoji}>{station.emoji}</Text>
              <View style={{ flex: 1 }}>
                <Text style={[styles.listTitle, { color: theme.text }]}>{t(station.titleKey)}</Text>
                <Text style={[styles.listSub, { color: theme.textSecondary }]}>{t(station.addressKey)}</Text>
                <Text style={[styles.coords, { color: theme.textSecondary }]}>
                  {station.lat.toFixed(4)}, {station.lng.toFixed(4)}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#C9A84C" />
            </View>
          </TouchableOpacity>
        ))}

        <View style={[styles.expandCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={styles.expandHeader}>
            <Text style={styles.listEmoji}>🚌</Text>
            <View style={{ flex: 1 }}>
              <Text style={[styles.listTitle, { color: theme.text }]}>{t("saptcoBuses")}</Text>
              <Text style={[styles.listSub, { color: theme.textSecondary }]}>{t("saptcoSub")}</Text>
            </View>
          </View>
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={styles.actionBtnOutline}
              onPress={() => Linking.openURL(SAPTCO_URL)}
            >
              <Ionicons name="globe-outline" size={14} color="#C9A84C" />
              <Text style={styles.actionBtnOutlineText}>{t("officialSite")}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionBtnPrimary} onPress={openNearestSaptcoStop}>
              <Ionicons name="navigate-outline" size={14} color="#C9A84C" />
              <Text style={styles.actionBtnPrimaryText}>{t("directionsNearestStop")}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={[styles.expandCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={styles.expandHeader}>
            <Text style={styles.listEmoji}>🚗</Text>
            <View style={{ flex: 1 }}>
              <Text style={[styles.listTitle, { color: theme.text }]}>{t("uber")}</Text>
              <Text style={[styles.listSub, { color: theme.textSecondary }]}>{t("uberSub")}</Text>
            </View>
          </View>
          <TouchableOpacity style={[styles.actionBtnPrimary, styles.actionBtnFull]} onPress={openUberToHaram}>
            <Ionicons name="car-outline" size={14} color="#C9A84C" />
            <Text style={styles.actionBtnPrimaryText}>{t("openUberApp")}</Text>
          </TouchableOpacity>
        </View>

        {/* ── SHOPPING ── */}
        <Text style={[styles.sectionTitle, { color: theme.text }]}>{t("shopping")}</Text>
        <Text style={[styles.sectionSub, { color: theme.textSecondary }]}>{t("shoppingSub")}</Text>
        {SHOPPING.map(s => (
          <View
            key={s.id}
            style={[styles.expandCard, { backgroundColor: theme.card, borderColor: theme.border }]}
          >
            <View style={styles.expandHeader}>
              <Text style={styles.listEmoji}>{s.emoji}</Text>
              <View style={{ flex: 1 }}>
                <Text style={[styles.listTitle, { color: theme.text }]}>{t(s.titleKey)}</Text>
                <Text style={[styles.listSub, { color: theme.textSecondary }]}>{t(s.subKey)}</Text>
              </View>
            </View>
            <TouchableOpacity
              style={[styles.actionBtnPrimary, styles.actionBtnFull]}
              onPress={() => openDirections(s.lat, s.lng)}
            >
              <Ionicons name="navigate-outline" size={14} color="#C9A84C" />
              <Text style={styles.actionBtnPrimaryText}>{t("getDirections")}</Text>
            </TouchableOpacity>
          </View>
        ))}

        {/* ── COMING SOON ── */}
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
  groupLabel: { fontSize: 12, fontWeight: "600", marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.5 },

  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginBottom: 8 },
  gridCard: { width: "47%", borderRadius: 16, padding: 16, borderWidth: 0.5, minHeight: 130 },
  emoji: { fontSize: 28, marginBottom: 8 },
  cardTitle: { fontSize: 14, fontWeight: "bold", marginBottom: 4 },
  cardSub: { fontSize: 11, flex: 1 },
  cardFooter: { flexDirection: "row", justifyContent: "space-between", marginTop: 10 },

  listCard: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderRadius: 14, borderWidth: 0.5, marginBottom: 10 },
  expandCard: { borderRadius: 14, borderWidth: 0.5, marginBottom: 10, padding: 14 },
  expandHeader: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  listEmoji: { fontSize: 26 },
  listTitle: { fontSize: 14, fontWeight: "600" },
  listSub: { fontSize: 11, marginTop: 2, lineHeight: 16 },
  coords: { fontSize: 10, marginTop: 4, fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace" },

  actionRow: { flexDirection: "row", gap: 8, marginTop: 12 },
  actionBtnOutline: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(201,168,76,0.5)",
    backgroundColor: "rgba(201,168,76,0.08)",
  },
  actionBtnOutlineText: { color: "#C9A84C", fontSize: 12, fontWeight: "600" },
  actionBtnPrimary: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: "#1E3A5F",
  },
  actionBtnPrimaryText: { color: "#C9A84C", fontSize: 12, fontWeight: "600" },
  actionBtnFull: { flex: undefined, width: "100%", marginTop: 12 },

  comingSoonTag: { backgroundColor: "rgba(0,0,0,0.06)", borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  comingSoonText: { fontSize: 10, color: "#888", fontWeight: "600" },
})
