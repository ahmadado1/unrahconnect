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
import { I18nManager, ScrollView, StyleSheet, Text, useWindowDimensions, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"

type Cover = {
  id: string
  titleKey: string
  subKey: string
  route: string
  mark: "hotel" | "aviasales" | "saily" | "airalo"
  accent: readonly [string, string, ...string[]]
  fill: readonly [string, string]
  fillDark: readonly [string, string]
  border: string
  borderDark: string
}

const COVERS: Cover[] = [
  {
    id: "hotels",
    titleKey: "hotelsNearHaram",
    subKey: "hotelsSub",
    route: "/hotels",
    mark: "hotel",
    accent: ["#C9A84C", "#E8D5A3"],
    fill: ["#FBF7EE", "#F3E6C8"],
    fillDark: ["#2C281C", "#241F16"],
    border: "#E4D2A4",
    borderDark: "#6E5A32",
  },
  {
    id: "aviasales",
    titleKey: "coverAviasales",
    subKey: "flightsCompare",
    route: "/services/flights",
    mark: "aviasales",
    accent: ["#3A6DFF", "#7AA2FF"],
    fill: ["#F4F7FF", "#E6EDFF"],
    fillDark: ["#1A2744", "#152033"],
    border: "#C9D7FF",
    borderDark: "#2E4A86",
  },
  {
    id: "saily",
    titleKey: "coverSaily",
    subKey: "esimCardSub",
    route: "/services/esim",
    mark: "saily",
    accent: ["#F5D000", "#FFE566"],
    fill: ["#FFFDF4", "#FFF6C8"],
    fillDark: ["#2C2814", "#241F12"],
    border: "#F0D56A",
    borderDark: "#6A5A20",
  },
  {
    id: "airalo",
    titleKey: "coverAiralo",
    subKey: "esimAiraloSub",
    route: "/services/airalo",
    mark: "airalo",
    accent: ["#F6B73D", "#F58A2A", "#F15B4A", "#E23D7A"],
    fill: ["#FFF6EE", "#FDEAF2"],
    fillDark: ["#2E221C", "#2A1A22"],
    border: "#F3C2B4",
    borderDark: "#6A4038",
  },
]

const LIST: {
  id: string
  sectionKey?: string
  icon: AppIconKey
  titleKey: string
  subKey: string
  route?: string
  fill: string
  fillDark: string
  border: string
  borderDark: string
}[] = [
  { id: "restaurants", sectionKey: "serviceFood", icon: "restaurant", titleKey: "restaurantsTitle", subKey: "restaurantsSub", route: "/restaurants", fill: "#FFF6F0", fillDark: "#2A221C", border: "#F3D5C4", borderDark: "#5A4034" },
  { id: "agents", icon: "handshake", titleKey: "findAgent", subKey: "findAgentSub", route: "/travel-agents", fill: "#F4F7FB", fillDark: "#1A2433", border: "#D5DEE8", borderDark: "#3A4A5C" },
  { id: "hospitals", icon: "medkit", titleKey: "hospitals", subKey: "hospitalsSub", route: "/maps/hospital-makkah", fill: "#F3F8F4", fillDark: "#1A2820", border: "#D3E6D8", borderDark: "#3A5644" },
  { id: "transport", sectionKey: "transport", icon: "train", titleKey: "transport", subKey: "transportSub", route: "/services/transport", fill: "#F3F7F8", fillDark: "#1A2628", border: "#D0E0E4", borderDark: "#3A5258" },
  { id: "shopping", sectionKey: "shopping", icon: "bag", titleKey: "shopping", subKey: "shoppingSub", route: "/services/shopping", fill: "#FBF6F8", fillDark: "#2A2226", border: "#E8D6DE", borderDark: "#5A4450" },
  { id: "booking", sectionKey: "comingSoon", icon: "calendar", titleKey: "booking", subKey: "bookingSub", fill: "#F7F5F2", fillDark: "#242220", border: "#E4DDD4", borderDark: "#4A453E" },
]

function CoverMark({ mark }: { mark: Cover["mark"] }) {
  if (mark === "hotel") {
    return (
      <View style={styles.hotelMark}>
        <AppIcon name="bed" size={20} />
      </View>
    )
  }
  if (mark === "aviasales") return <AviasalesMark size={34} />
  if (mark === "saily") return <SailyMark size={34} />
  return <AiraloMark size={34} />
}

export default function ServicesScreen() {
  const router = useRouter()
  const { theme } = useTheme()
  const { t } = useTranslation()
  const insets = useSafeAreaInsets()
  const { width } = useWindowDimensions()
  const boxWidth = (width - ui.space * 2 - 12) / 2
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
          <TouchableOpacity
            style={styles.searchBtn}
            onPress={() => router.push("/search" as any)}
            accessibilityRole="button"
          >
            <Ionicons name="search-outline" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, { paddingBottom: tabScrollBottom(insets.bottom) }]}
        contentInsetAdjustmentBehavior="never"
        automaticallyAdjustContentInsets={false}
      >
        <View style={styles.grid}>
          {COVERS.map(cover => (
            <TouchableOpacity
              key={cover.id}
              style={[styles.cover, { width: boxWidth, borderColor: theme.dark ? cover.borderDark : cover.border }]}
              onPress={() => router.push(cover.route as any)}
              accessibilityRole="button"
            >
              <LinearGradient colors={cover.accent} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.accent} />
              <LinearGradient colors={theme.dark ? cover.fillDark : cover.fill} style={styles.coverBody}>
                <CoverMark mark={cover.mark} />
                <Text style={[styles.coverTitle, { color: theme.text }]} numberOfLines={2}>{t(cover.titleKey)}</Text>
                <Text style={[styles.coverSub, { color: theme.textSecondary }]} numberOfLines={2}>{t(cover.subKey)}</Text>
                <View style={styles.coverFooter}>
                  <Ionicons name={chevron} size={16} color={GOLD} />
                </View>
              </LinearGradient>
            </TouchableOpacity>
          ))}
        </View>

        {LIST.map(service => {
          const showSection = Boolean(service.sectionKey && service.sectionKey !== service.titleKey)
          return (
            <View key={service.id}>
              {showSection ? (
                <Text style={[styles.section, { color: theme.textSecondary }]}>{t(service.sectionKey!)}</Text>
              ) : null}
              <TouchableOpacity
                style={[
                  styles.row,
                  {
                    backgroundColor: theme.dark ? service.fillDark : service.fill,
                    borderColor: theme.dark ? service.borderDark : service.border,
                  },
                  !service.route && styles.rowSoon,
                ]}
                disabled={!service.route}
                onPress={() => service.route && router.push(service.route as any)}
                accessibilityRole="button"
              >
                <AppIcon name={service.icon} size={26} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.rowTitle, { color: theme.text }]} numberOfLines={1}>{t(service.titleKey)}</Text>
                  <Text style={[styles.rowSub, { color: theme.textSecondary }]} numberOfLines={1}>{t(service.subKey)}</Text>
                </View>
                {service.route ? (
                  <Ionicons name={chevron} size={18} color={GOLD} />
                ) : (
                  <View style={styles.soonTag}>
                    <Text style={styles.soonText}>{t("comingSoonLabel")}</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          )
        })}
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
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginBottom: 8 },
  cover: {
    height: 158,
    borderRadius: ui.radius,
    borderWidth: 1,
    overflow: "hidden",
  },
  accent: { height: 4 },
  coverBody: { flex: 1, padding: 12 },
  hotelMark: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: "rgba(201,168,76,0.22)",
    alignItems: "center",
    justifyContent: "center",
  },
  coverTitle: { fontSize: 14, fontWeight: "700", marginTop: 8 },
  coverSub: { fontSize: 11, lineHeight: 15, marginTop: 3, flex: 1 },
  coverFooter: { flexDirection: "row", justifyContent: "flex-end" },
  section: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.4,
    textTransform: "uppercase",
    marginTop: 14,
    marginBottom: 8,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: ui.cardPad,
    borderRadius: ui.radius,
    borderWidth: ui.hairline,
    marginBottom: 10,
  },
  rowSoon: { opacity: 0.5 },
  rowTitle: { fontSize: 15, fontWeight: "700" },
  rowSub: { fontSize: 12, marginTop: 2 },
  soonTag: { backgroundColor: "rgba(0,0,0,0.06)", borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  soonText: { fontSize: 10, color: "#888", fontWeight: "600" },
})