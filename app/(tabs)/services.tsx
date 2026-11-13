// Services tab.
//   1. Big hotel card (photo + "Book on Booking.com")
//   2. Travel essentials: flights, eSIM
//   3. Near the holy mosques: restaurants, malls, hospitals, transport (live from Google)
//   4. Travel agencies: Find an Agent
import TouchableOpacity from "@/app/components/AppPressable"
import { AiraloMark, AviasalesMark, SailyMark } from "@/app/components/BrandMarks"
import { AppIcon, AppIconKey } from "@/components/AppIcon"
import { useTheme } from "@/context/themeContext"
import { GOLD, NAVY, tabScrollBottom, ui } from "@/lib/ui"
import { Ionicons } from "@expo/vector-icons"
import { LinearGradient } from "expo-linear-gradient"
import { useRouter } from "expo-router"
import { StatusBar } from "expo-status-bar"
import { useTranslation } from "react-i18next"
import { I18nManager, ImageBackground, ScrollView, StyleSheet, Text, useWindowDimensions, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"

const BOOKING_BLUE = "#003580"

// Flights and eSIM partners
const ESSENTIALS = [
  { id: "flights", titleKey: "coverAviasales", subKey: "flightsCompare", route: "/services/flights", mark: "aviasales" as const },
  { id: "saily", titleKey: "coverSaily", subKey: "esimCardSub", route: "/services/esim", mark: "saily" as const },
  { id: "airalo", titleKey: "coverAiralo", subKey: "esimAiraloSub", route: "/services/airalo", mark: "airalo" as const },
]

// Near Masjid al-Haram / Masjid an-Nabawi
const NEAR: { id: string; titleKey: string; subKey: string; route: string; icon: AppIconKey; tint: string; fill: string; fillDark: string }[] = [
  { id: "restaurants", titleKey: "restaurantsTitle", subKey: "svcRestaurantsSub", route: "/nearby/restaurants", icon: "restaurant", tint: "#EF6C3A", fill: "#FFF4EC", fillDark: "#2E2216" },
  { id: "malls", titleKey: "svcMalls", subKey: "svcMallsSub", route: "/nearby/malls", icon: "bag", tint: "#B83280", fill: "#FBF1F6", fillDark: "#2A1A24" },
  { id: "hospitals", titleKey: "hospitals", subKey: "hospitalsSub", route: "/maps/hospital-makkah", icon: "medkit", tint: "#2F855A", fill: "#F0F8F3", fillDark: "#1A2820" },
  { id: "transport", titleKey: "transport", subKey: "transportSub", route: "/services/transport", icon: "train", tint: "#2B6CB0", fill: "#EFF5FB", fillDark: "#1A2433" },
]

function EssentialMark({ mark }: { mark: "aviasales" | "saily" | "airalo" }) {
  if (mark === "aviasales") return <AviasalesMark size={36} />
  if (mark === "saily") return <SailyMark size={36} />
  return <AiraloMark size={36} />
}

export default function ServicesScreen() {
  const router = useRouter()
  const { theme } = useTheme()
  const { t } = useTranslation()
  const insets = useSafeAreaInsets()
  const { width } = useWindowDimensions()
  const half = (width - ui.space * 2 - 12) / 2
  const chevron = I18nManager.isRTL ? "chevron-back" : "chevron-forward"

  return (
    <View style={[styles.screen, { backgroundColor: theme.background }]}>
      <StatusBar style="light" />

      <View style={[styles.header, { paddingTop: insets.top }]}>
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>{t("services")}</Text>
            <Text style={styles.subtitle}>{t("servicesSub")}</Text>
          </View>
          <TouchableOpacity style={styles.searchBtn} onPress={() => router.push("/search" as any)} accessibilityRole="button">
            <Ionicons name="search-outline" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, { paddingBottom: tabScrollBottom(insets.bottom) }]}
        contentInsetAdjustmentBehavior="never"
        automaticallyAdjustContentInsets={false}
      >
        {/* ─── 1. Hotels: big photo card with the Booking.com badge ─── */}
        <TouchableOpacity activeOpacity={0.9} onPress={() => router.push("/hotels" as any)} accessibilityRole="button">
          <ImageBackground source={require("../../assets/photos/tawaf-header.jpg")} style={styles.hero} imageStyle={styles.heroImg}>
            <LinearGradient colors={["rgba(15,30,50,0.05)", "rgba(15,30,50,0.85)"]} style={styles.heroShade}>
              <View style={styles.bookingBadge}>
                <Text style={styles.bookingSmall}>{t("svcBookOn")}</Text>
                <Text style={styles.bookingName}>
                  Booking<Text style={styles.bookingDot}>.com</Text>
                </Text>
              </View>
              <View>
                <Text style={styles.heroTitle}>{t("hotelsNearHaram")}</Text>
                <Text style={styles.heroSub}>{t("svcHotelsSub")}</Text>
                <View style={styles.heroBtn}>
                  <Text style={styles.heroBtnText}>{t("svcSeeHotels")}</Text>
                  <Ionicons name={chevron} size={16} color={NAVY} />
                </View>
              </View>
            </LinearGradient>
          </ImageBackground>
        </TouchableOpacity>

        {/* ─── 2. Travel essentials ─── */}
        <Text style={[styles.section, { color: theme.textSecondary }]}>{t("svcTravel")}</Text>
        <View style={styles.essentials}>
          {ESSENTIALS.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={[styles.essential, { backgroundColor: theme.card, borderColor: theme.border }]}
              onPress={() => router.push(item.route as any)}
              accessibilityRole="button"
            >
              <EssentialMark mark={item.mark} />
              <Text style={[styles.essentialTitle, { color: theme.text }]} numberOfLines={1}>{t(item.titleKey)}</Text>
              <Text style={[styles.essentialSub, { color: theme.textSecondary }]} numberOfLines={2}>{t(item.subKey)}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ─── 3. Near the holy mosques ─── */}
        <Text style={[styles.section, { color: theme.textSecondary }]}>{t("svcNear")}</Text>
        <View style={styles.grid}>
          {NEAR.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={[styles.tile, { width: half, backgroundColor: theme.dark ? item.fillDark : item.fill, borderColor: theme.border }]}
              onPress={() => router.push(item.route as any)}
              accessibilityRole="button"
            >
              <View style={[styles.tileIcon, { backgroundColor: `${item.tint}22` }]}>
                <AppIcon name={item.icon} size={22} />
              </View>
              <Text style={[styles.tileTitle, { color: theme.text }]} numberOfLines={1}>{t(item.titleKey)}</Text>
              <Text style={[styles.tileSub, { color: theme.textSecondary }]} numberOfLines={2}>{t(item.subKey)}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ─── 4. Travel agencies ─── */}
        <Text style={[styles.section, { color: theme.textSecondary }]}>{t("svcAgencies")}</Text>
        <TouchableOpacity activeOpacity={0.9} onPress={() => router.push("/agent" as any)} accessibilityRole="button">
          <LinearGradient colors={[NAVY, "#2C5282"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.agentCard}>
            <View style={styles.agentIcon}>
              <AppIcon name="handshake" size={22} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.agentTitle}>{t("findAgent")}</Text>
              <Text style={styles.agentSub} numberOfLines={2}>{t("findAgentSub")}</Text>
            </View>
            <View style={styles.verifiedChip}>
              <Ionicons name="shield-checkmark" size={12} color={NAVY} />
              <Text style={styles.verifiedText}>{t("agentVerified")}</Text>
            </View>
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: { backgroundColor: NAVY, paddingHorizontal: 20, paddingBottom: 20 },
  headerRow: { flexDirection: "row", alignItems: "flex-end", marginTop: 16, gap: 12 },
  title: { color: "#fff", fontSize: 26, fontWeight: "bold" },
  subtitle: { color: GOLD, fontSize: 13, marginTop: 4 },
  searchBtn: { backgroundColor: "rgba(255,255,255,0.12)", borderRadius: 20, padding: 10, marginBottom: 2 },
  content: { padding: ui.space },
  // Hotels hero
  hero: { height: 210, borderRadius: 20, overflow: "hidden" },
  heroImg: { borderRadius: 20 },
  heroShade: { flex: 1, padding: 16, justifyContent: "space-between" },
  bookingBadge: { alignSelf: "flex-start", backgroundColor: BOOKING_BLUE, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 5 },
  bookingSmall: { color: "#BFD7FF", fontSize: 9, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.4 },
  bookingName: { color: "#fff", fontSize: 16, fontWeight: "800" },
  bookingDot: { color: "#5BBAFF" },
  heroTitle: { color: "#fff", fontSize: 22, fontWeight: "bold" },
  heroSub: { color: "#E2E8F0", fontSize: 13, marginTop: 2 },
  heroBtn: { flexDirection: "row", alignItems: "center", gap: 4, alignSelf: "flex-start", backgroundColor: GOLD, borderRadius: 999, paddingVertical: 8, paddingHorizontal: 14, marginTop: 10 },
  heroBtnText: { color: NAVY, fontWeight: "bold", fontSize: 13 },
  // Sections
  section: { fontSize: 12, fontWeight: "700", letterSpacing: 0.4, textTransform: "uppercase", marginTop: 20, marginBottom: 10 },
  essentials: { flexDirection: "row", gap: 10 },
  essential: { flex: 1, borderRadius: 16, borderWidth: ui.hairline, padding: 12, gap: 6 },
  essentialTitle: { fontSize: 13, fontWeight: "700" },
  essentialSub: { fontSize: 11, lineHeight: 14 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  tile: { borderRadius: 16, borderWidth: ui.hairline, padding: 14, minHeight: 120 },
  tileIcon: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center", marginBottom: 10 },
  tileTitle: { fontSize: 15, fontWeight: "700" },
  tileSub: { fontSize: 12, lineHeight: 16, marginTop: 3 },
  agentCard: { flexDirection: "row", alignItems: "center", gap: 12, borderRadius: 18, padding: 16 },
  agentIcon: { width: 44, height: 44, borderRadius: 14, backgroundColor: GOLD, alignItems: "center", justifyContent: "center" },
  agentTitle: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  agentSub: { color: "#D7DEEA", fontSize: 12, marginTop: 2 },
  verifiedChip: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "#E8F1FB", borderRadius: 999, paddingHorizontal: 8, paddingVertical: 4 },
  verifiedText: { color: NAVY, fontSize: 11, fontWeight: "700" },
})
