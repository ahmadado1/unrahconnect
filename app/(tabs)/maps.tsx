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
  { id: "haram", emoji: "🕋", nameKey: "masjidAlHaram", subKey: "makkah", query: "Masjid Al-Haram, Makkah, Saudi Arabia" },
  { id: "nabawi", emoji: "🕌", nameKey: "masjidNabawi", subKey: "madinah", query: "Masjid Nabawi, Madinah, Saudi Arabia" },
  { id: "mina", emoji: "⛺", nameKey: "mina", subKey: "hajjSite", query: "Mina, Makkah, Saudi Arabia" },
  { id: "arafah", emoji: "🏔️", nameKey: "arafah", subKey: "hajjSite", query: "Mount Arafah, Makkah, Saudi Arabia" },
  { id: "zamzam", emoji: "💧", nameKey: "zamzamWell", subKey: "makkah", query: "Zamzam Well, Makkah, Saudi Arabia" },
  { id: "safa", emoji: "🚶", nameKey: "safaMarwah", subKey: "makkah", query: "Safa and Marwah, Makkah, Saudi Arabia" },
] as const

export default function MapsScreen() {
  const { theme } = useTheme()
  const { t } = useTranslation()
  const insets = useSafeAreaInsets()
  const router = useRouter() // ← used to navigate to detail screen
  const [locationLabel, setLocationLabel] = useState<string | null>(null)
  const [showMap, setShowMap] = useState(false)

  // Get user's current location on mount
  useEffect(() => {
    Location.requestForegroundPermissionsAsync().then(({ status }) => {
      if (status !== "granted") return
      Location.getCurrentPositionAsync({}).then((pos) => {
        setLocationLabel(`${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`)
      }).catch(() => {})
    })
  }, [])

  // Opens Google Maps at user's current location
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

      {/* ── HEADER ── */}
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <Text style={styles.title}>{t("maps")}</Text>
        <Text style={styles.subtitle}>{t("mapsSub")}</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>

        {/* ── MY LOCATION CARD ── opens Google Maps at user location */}
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

        <Text style={[styles.sectionTitle, { color: theme.text }]}>{t("holySites")}</Text>

        {/* ── HOLY SITES LIST ── each card navigates to detail screen */}
        {LOCATIONS.map((loc) => (
          <TouchableOpacity
            key={loc.id}
            style={[styles.locationCard, { backgroundColor: theme.card, borderColor: theme.border }]}
            onPress={() => router.push(`/maps/${loc.id}` as any)}
            // ↑ THIS IS THE KEY CHANGE — goes to detail screen, not Google Maps directly
          >
            <Text style={styles.emoji}>{loc.emoji}</Text>
            <View style={{ flex: 1 }}>
              <Text style={[styles.locationName, { color: theme.text }]}>{t(loc.nameKey)}</Text>
              <Text style={[styles.locationSub, { color: theme.textSecondary }]}>{t(loc.subKey)}</Text>
            </View>
            {/* Arrow icon — indicates it goes deeper, not to external app */}
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
  sectionTitle: { fontSize: 17, fontWeight: "bold", marginTop: 24, marginBottom: 12 },
  myLocationCard: {
    flexDirection: "row", alignItems: "center", gap: 14,
    padding: 16, borderRadius: 14, borderWidth: 0.5,
  },
  myLocationIcon: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: "#C9A84C", alignItems: "center", justifyContent: "center",
  },
  locationCard: {
    flexDirection: "row", alignItems: "center", gap: 14,
    padding: 16, borderRadius: 14, borderWidth: 0.5, marginBottom: 10,
  },
  emoji: { fontSize: 28 },
  locationName: { fontSize: 15, fontWeight: "600" },
  locationSub: { fontSize: 12, marginTop: 2 },
})