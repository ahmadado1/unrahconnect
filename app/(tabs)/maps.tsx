import { AppIcon, AppIconKey } from "@/components/AppIcon"
import { useTheme } from "@/context/themeContext"
import { Ionicons } from "@expo/vector-icons"
import * as Location from "expo-location"
import { useRouter } from "expo-router"
import { StatusBar } from "expo-status-bar"
import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native"
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

/** Madinah sites as a simple list (photos live only in MadinahPlacesSection). */
const MADINAH_HOLY_SITES: {
  id: string
  icon: AppIconKey
  nameKey: string
  subKey: string
  route?: string
  mapsQuery?: string
}[] = [
  {
    id: "nabawi",
    icon: "mosque",
    nameKey: "masjidNabawi",
    subKey: "madinah",
    route: "/maps/nabawi",
  },
  {
    id: "riyad-al-jannah",
    icon: "mosque",
    nameKey: "madinahPlace2Title",
    subKey: "madinah",
    route: "/maps/nabawi",
  },
  {
    id: "prophet-grave",
    icon: "mosque",
    nameKey: "madinahPlace3Title",
    subKey: "madinah",
    route: "/maps/nabawi",
  },
  {
    id: "jannat-al-baqi",
    icon: "walk",
    nameKey: "madinahPlace4Title",
    subKey: "madinah",
    mapsQuery: "Jannat al-Baqi, Madinah, Saudi Arabia",
  },
  {
    id: "masjid-quba",
    icon: "mosque",
    nameKey: "madinahPlace5Title",
    subKey: "madinah",
    mapsQuery: "Masjid Quba, Madinah, Saudi Arabia",
  },
  {
    id: "masjid-qiblatayn",
    icon: "mosque",
    nameKey: "madinahPlace6Title",
    subKey: "madinah",
    mapsQuery: "Masjid al-Qiblatayn, Madinah, Saudi Arabia",
  },
  {
    id: "uhud-mountain",
    icon: "mountain",
    nameKey: "madinahPlace7Title",
    subKey: "madinah",
    mapsQuery: "Mount Uhud, Madinah, Saudi Arabia",
  },
  {
    id: "seven-mosques",
    icon: "mosque",
    nameKey: "madinahPlace8Title",
    subKey: "madinah",
    mapsQuery: "Seven Mosques, Madinah, Saudi Arabia",
  },
  {
    id: "jabal-ayr",
    icon: "mountain",
    nameKey: "madinahPlace10Title",
    subKey: "madinah",
    mapsQuery: "Jabal Ayr, Madinah, Saudi Arabia",
  },
  {
    id: "dar-al-madinah-museum",
    icon: "search",
    nameKey: "madinahPlace9Title",
    subKey: "madinah",
    mapsQuery: "Dar Al Madinah Museum, Madinah, Saudi Arabia",
  },
]

export default function MapsScreen() {
  const { theme } = useTheme()
  const { t } = useTranslation()
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const [locationLabel, setLocationLabel] = useState<string | null>(null)

  useEffect(() => {
    Location.requestForegroundPermissionsAsync().then(({ status }) => {
      if (status !== "granted") return
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

  const openMadinahSite = (site: (typeof MADINAH_HOLY_SITES)[number]) => {
    if (site.route) {
      router.push(site.route as any)
      return
    }
    if (site.mapsQuery) {
      Linking.openURL(`https://maps.google.com/?q=${encodeURIComponent(site.mapsQuery)}`)
    }
  }

  return (
    <View style={[styles.screen, { backgroundColor: theme.background }]}>
      <StatusBar style="light" />

      <View style={[styles.header, { paddingTop: insets.top }]}>
        <Text style={styles.title}>{t("maps")}</Text>
        <Text style={styles.subtitle}>{t("mapsSub")}</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <TouchableOpacity
          style={[styles.myLocationCard, { backgroundColor: theme.card, borderColor: theme.border }]}
          onPress={openMyLocation}
        >
          <View style={styles.myLocationIcon}>
            <Ionicons name="navigate" size={22} color="#1E3A5F" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.locationName, { color: theme.text }]}>{t("myLocation")}</Text>
            <Text style={[styles.locationSub, { color: theme.textSecondary }]}>
              {locationLabel ? t("openInMaps") : t("enableLocation")}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#C9A84C" />
        </TouchableOpacity>

        <Text style={[styles.sectionTitle, { color: theme.text }]}>{t("madinahHolySites")}</Text>
        <Text style={[styles.sectionHint, { color: theme.textSecondary }]}>{t("madinah")}</Text>

        {MADINAH_HOLY_SITES.map(site => (
          <TouchableOpacity
            key={site.id}
            style={[styles.locationCard, { backgroundColor: theme.card, borderColor: theme.border }]}
            onPress={() => openMadinahSite(site)}
            activeOpacity={0.85}
          >
            <AppIcon name={site.icon} size={28} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.locationName, { color: theme.text }]} numberOfLines={2}>
                {t(site.nameKey)}
              </Text>
              <Text style={[styles.locationSub, { color: theme.textSecondary }]}>{t(site.subKey)}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#C9A84C" />
          </TouchableOpacity>
        ))}

        <Text style={[styles.sectionTitle, { color: theme.text }]}>{t("holySites")}</Text>

        {LOCATIONS.map(loc => (
          <TouchableOpacity
            key={loc.id}
            style={[styles.locationCard, { backgroundColor: theme.card, borderColor: theme.border }]}
            onPress={() => router.push(`/maps/${loc.id}` as any)}
          >
            <AppIcon name={loc.icon} size={28} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.locationName, { color: theme.text }]}>{t(loc.nameKey)}</Text>
              <Text style={[styles.locationSub, { color: theme.textSecondary }]}>{t(loc.subKey)}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#C9A84C" />
          </TouchableOpacity>
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
  sectionHint: { fontSize: 12, marginBottom: 12 },
  myLocationCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 16,
    borderRadius: 14,
    borderWidth: 0.5,
  },
  myLocationIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#C9A84C",
    alignItems: "center",
    justifyContent: "center",
  },
  locationCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 16,
    borderRadius: 14,
    borderWidth: 0.5,
    marginBottom: 10,
  },
  locationName: { fontSize: 15, fontWeight: "600" },
  locationSub: { fontSize: 12, marginTop: 2 },
})
