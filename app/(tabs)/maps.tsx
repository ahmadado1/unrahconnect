import { ensureLocationPermission } from "@/lib/locationPermission"
import TouchableOpacity from "@/app/components/AppPressable"
import { AppIcon, AppIconKey } from "@/components/AppIcon"
import { useTheme } from "@/context/themeContext"
import { cardShadow, GOLD, NAVY, tabScrollBottom, ui } from "@/lib/ui"
import { Ionicons } from "@expo/vector-icons"
import * as Location from "expo-location"
import { useRouter } from "expo-router"
import { StatusBar } from "expo-status-bar"
import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { Linking, ScrollView, StyleSheet, Text, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"

const LOCATIONS = [
  { id: "haram", icon: "kaaba" as AppIconKey, nameKey: "masjidAlHaram", subKey: "makkah", query: "Masjid Al-Haram, Makkah, Saudi Arabia" },
  { id: "nabawi", icon: "mosque" as AppIconKey, nameKey: "masjidNabawi", subKey: "madinah", query: "Masjid Nabawi, Madinah, Saudi Arabia" },
  { id: "mina", icon: "camp" as AppIconKey, nameKey: "mina", subKey: "hajjSite", query: "Mina, Makkah, Saudi Arabia" },
  { id: "arafah", icon: "mountain" as AppIconKey, nameKey: "arafah", subKey: "hajjSite", query: "Mount Arafah, Makkah, Saudi Arabia" },
  { id: "zamzam", icon: "water" as AppIconKey, nameKey: "zamzamWell", subKey: "makkah", query: "Zamzam Well, Makkah, Saudi Arabia" },
  { id: "safa", icon: "walk" as AppIconKey, nameKey: "safaMarwah", subKey: "makkah", query: "Safa and Marwah, Makkah, Saudi Arabia" },
  { id: "lost-found", icon: "search" as AppIconKey, nameKey: "lostAndFound", subKey: "lostAndFoundSub", query: "Civil Defense Makkah Saudi Arabia" },
] as const

export default function MapsScreen() {
  const { theme, isDark } = useTheme()
  const { t } = useTranslation()
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const [locationLabel, setLocationLabel] = useState<string | null>(null)

  useEffect(() => {
    ensureLocationPermission().then(granted => {
      if (!granted) return
      Location.getCurrentPositionAsync({})
        .then(pos => {
          setLocationLabel(`${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`)
        })
        .catch(() => {})
    })
  }, [])

  const openMyLocation = () => {
    if (locationLabel) {
      Linking.openURL(`https://maps.google.com/?q=${locationLabel}`)
    } else {
      Linking.openURL("https://maps.google.com/?q=Mecca,Saudi+Arabia")
    }
  }

  return (
    <View style={[styles.screen, { backgroundColor: theme.background }]}>
      <StatusBar style="light" />

      <View style={[styles.header, { paddingTop: insets.top }]}>
        <Text style={styles.title}>{t("maps")}</Text>
        <Text style={styles.subtitle}>{t("mapsSub")}</Text>
      </View>

      <ScrollView keyboardDismissMode="on-drag" keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, { paddingBottom: tabScrollBottom(insets.bottom) }]}
        contentInsetAdjustmentBehavior="never"
        automaticallyAdjustContentInsets={false}
      >
        {/* Quick actions: my location and the offline map, side by side */}
        <View style={styles.row}>
          <TouchableOpacity
            style={[styles.quickTile, { backgroundColor: theme.card, borderColor: theme.border }]}
            onPress={openMyLocation}
          >
            <View style={[styles.quickIcon, { backgroundColor: GOLD }]}>
              <Ionicons name="navigate" size={20} color={NAVY} />
            </View>
            <Text style={[styles.quickTitle, { color: theme.text }]} numberOfLines={1}>{t("myLocation")}</Text>
            <Text style={[styles.quickSub, { color: theme.textSecondary }]} numberOfLines={2}>
              {locationLabel ? t("openInMaps") : t("enableLocation")}
            </Text>
          </TouchableOpacity>

          {/* Offline map (Premium): works with no internet in Makkah and Madinah */}
          <TouchableOpacity
            style={[styles.quickTile, styles.quickTileNavy]}
            onPress={() => router.push("/offline-map" as any)}
          >
            <View style={styles.quickTop}>
              <View style={[styles.quickIcon, { backgroundColor: GOLD }]}>
                <Ionicons name="cloud-offline" size={20} color={NAVY} />
              </View>
              <View style={styles.proPill}>
                <Ionicons name="star" size={8} color={NAVY} />
                <Text style={styles.proText}>{t("premiumBadge").toUpperCase()}</Text>
              </View>
            </View>
            <Text style={styles.quickTitleLight} numberOfLines={1}>{t("om_cardTitle")}</Text>
            <Text style={styles.quickSubLight} numberOfLines={2}>{t("om_cardSub")}</Text>
          </TouchableOpacity>
        </View>

        <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>{t("holySites")}</Text>

        {/* Holy sites: even 2-column grid */}
        <View style={styles.grid}>
          {LOCATIONS.filter(loc => loc.id !== "lost-found").map(loc => (
            <TouchableOpacity
              key={loc.id}
              style={[styles.siteCard, { backgroundColor: theme.card, borderColor: theme.border }]}
              onPress={() => router.push(`/maps/${loc.id}` as any)}
            >
              <View style={[styles.siteIcon, { backgroundColor: isDark ? "rgba(201,168,76,0.14)" : "#FAF3E3" }]}>
                <AppIcon name={loc.icon} size={26} />
              </View>
              <Text style={[styles.siteName, { color: theme.text }]} numberOfLines={2}>{t(loc.nameKey)}</Text>
              <Text style={[styles.locationSub, { color: theme.textSecondary }]} numberOfLines={1}>{t(loc.subKey)}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>{t("makkah")}</Text>
        <TouchableOpacity
          style={[styles.locationCard, { backgroundColor: theme.card, borderColor: theme.border }]}
          onPress={() => router.push("/makkah-places" as any)}
        >
          <View style={[styles.rowIcon, { backgroundColor: isDark ? "rgba(201,168,76,0.14)" : "#FAF3E3" }]}>
            <AppIcon name="mountain" size={24} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.locationName, { color: theme.text }]}>{t("makkahPlacesTitle")}</Text>
            <Text style={[styles.locationSub, { color: theme.textSecondary }]}>{t("makkahPlacesSub")}</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={GOLD} />
        </TouchableOpacity>

        {/* Lost & found / help: kept apart so it's easy to find in a hurry */}
        <TouchableOpacity
          style={[styles.locationCard, styles.helpCard, { backgroundColor: theme.card }]}
          onPress={() => router.push("/maps/lost-found" as any)}
        >
          <View style={[styles.rowIcon, { backgroundColor: isDark ? "rgba(220,80,80,0.18)" : "#FDECEC" }]}>
            <AppIcon name="search" size={24} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.locationName, { color: theme.text }]}>{t("lostAndFound")}</Text>
            <Text style={[styles.locationSub, { color: theme.textSecondary }]}>{t("lostAndFoundSub")}</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={GOLD} />
        </TouchableOpacity>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: { backgroundColor: NAVY, paddingHorizontal: 20, paddingBottom: 20 },
  title: { color: "#fff", fontSize: 26, fontWeight: "bold", marginTop: 16 },
  subtitle: { color: GOLD, fontSize: 13, marginTop: 4 },
  content: { padding: ui.space, gap: 0 },
  sectionTitle: { fontSize: 12, fontWeight: "700", letterSpacing: 1, textTransform: "uppercase", marginTop: 22, marginBottom: 10, marginLeft: 2 },
  row: { flexDirection: "row", gap: 12 },
  quickTile: { flex: 1, borderRadius: 18, padding: 14, borderWidth: ui.hairline, minHeight: 132, ...cardShadow },
  quickTileNavy: { backgroundColor: NAVY, borderWidth: 1, borderColor: "rgba(201,168,76,0.5)" },
  quickTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  quickIcon: { width: 42, height: 42, borderRadius: 12, alignItems: "center", justifyContent: "center", marginBottom: 12 },
  quickTitle: { fontSize: 15, fontWeight: "700" },
  quickSub: { fontSize: 12, marginTop: 2, lineHeight: 16 },
  quickTitleLight: { fontSize: 15, fontWeight: "700", color: "#fff" },
  quickSubLight: { fontSize: 12, marginTop: 2, lineHeight: 16, color: "rgba(255,255,255,0.75)" },
  grid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", rowGap: 12 },
  siteCard: { width: "48.3%", borderRadius: 18, padding: 14, borderWidth: ui.hairline, ...cardShadow },
  siteIcon: { width: 48, height: 48, borderRadius: 14, alignItems: "center", justifyContent: "center", marginBottom: 12 },
  siteName: { fontSize: 15, fontWeight: "700", lineHeight: 19 },
  locationCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: ui.cardPad,
    borderRadius: 18,
    borderWidth: ui.hairline,
    marginBottom: ui.gap,
    ...cardShadow,
  },
  helpCard: { borderColor: "rgba(220,80,80,0.45)", borderWidth: 1, marginTop: 2 },
  rowIcon: { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  proPill: { flexDirection: "row", alignItems: "center", gap: 3, backgroundColor: GOLD, borderRadius: 999, paddingHorizontal: 6, paddingVertical: 2 },
  proText: { color: NAVY, fontSize: 8, fontWeight: "800" },
  locationName: { fontSize: 15, fontWeight: "600" },
  locationSub: { fontSize: 12, marginTop: 2 },
})
