import { AppIcon, AppIconKey } from "@/components/AppIcon"
import { useTheme } from "@/context/themeContext"
import { HARAMAIN_STATIONS as HARAMAIN_STATION_MAP } from "@/lib/haramainStations"
import { openExternalUrl } from "@/lib/openAffiliateWebView"
import { openGoogleMapsUrl } from "@/lib/openMaps"
import { GOLD, NAVY, ui } from "@/lib/ui"
import { Ionicons } from "@expo/vector-icons"
import * as Location from "expo-location"
import { useRouter } from "expo-router"
import { StatusBar } from "expo-status-bar"
import { useTranslation } from "react-i18next"
import { Linking, Platform, ScrollView, StyleSheet, Text, View } from "react-native"
import TouchableOpacity from "@/app/components/AppPressable"
import { useSafeAreaInsets } from "react-native-safe-area-context"

const HARAMAIN_STATIONS = (["makkah", "madinah"] as const).map(id => {
  const station = HARAMAIN_STATION_MAP[id]
  return {
    id: station.id,
    icon: station.icon as AppIconKey,
    titleKey: station.titleKey,
    addressKey: station.addressKey,
    lat: station.lat,
    lng: station.lng,
  }
})

const SAPTCO_URL = "https://www.saptco.com.sa"
const UBER_FALLBACK_URL = "https://www.uber.com"
const HARAM_LAT = 21.4225
const HARAM_LNG = 39.8262

async function openNearestSaptcoStop() {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync()
    if (status === "granted") {
      const pos = await Location.getCurrentPositionAsync({})
      const { latitude, longitude } = pos.coords
      const query = encodeURIComponent("SAPTCO bus stop")
      void openGoogleMapsUrl(
        `https://www.google.com/maps/search/${query}/@${latitude},${longitude},14z`,
        { name: "SAPTCO bus stop", latitude, longitude },
      )
      return
    }
  } catch {
    // fall through to default search
  }
  void openGoogleMapsUrl("https://www.google.com/maps/search/SAPTCO+bus+stop+Makkah", {
    name: "SAPTCO bus stop Makkah",
  })
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

export default function TransportScreen() {
  const router = useRouter()
  const { theme } = useTheme()
  const { t } = useTranslation()
  const insets = useSafeAreaInsets()

  return (
    <View style={[styles.screen, { backgroundColor: theme.background }]}>
      <StatusBar style="light" />
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn} accessibilityRole="button" accessibilityLabel={t("back")}>
            <Ionicons name="arrow-back" size={22} color="#fff" />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>{t("transport")}</Text>
            <Text style={styles.subtitle}>{t("transportSub")}</Text>
          </View>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 28 }]}
        contentInsetAdjustmentBehavior="never"
      >
        <Text style={[styles.groupLabel, { color: theme.textSecondary }]}>{t("haramainRailway")}</Text>
        {HARAMAIN_STATIONS.map(station => (
          <TouchableOpacity
            key={station.id}
            style={[styles.expandCard, { backgroundColor: theme.card, borderColor: theme.border }]}
            onPress={() => router.push(`/haramain/${station.id}` as any)}
            activeOpacity={0.85}
          >
            <View style={styles.expandHeader}>
              <AppIcon name={station.icon} size={26} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.listTitle, { color: theme.text }]}>{t(station.titleKey)}</Text>
                <Text style={[styles.listSub, { color: theme.textSecondary }]}>{t(station.addressKey)}</Text>
                <Text style={[styles.coords, { color: theme.textSecondary }]}>
                  {station.lat.toFixed(4)}, {station.lng.toFixed(4)}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={GOLD} />
            </View>
          </TouchableOpacity>
        ))}

        <View style={[styles.expandCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={styles.expandHeader}>
            <AppIcon name="bus" size={26} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.listTitle, { color: theme.text }]}>{t("saptcoBuses")}</Text>
              <Text style={[styles.listSub, { color: theme.textSecondary }]}>{t("saptcoSub")}</Text>
            </View>
          </View>
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={styles.actionBtnOutline}
              onPress={() => openExternalUrl(router, SAPTCO_URL, t("saptcoBuses"))}
            >
              <Ionicons name="globe-outline" size={14} color={GOLD} />
              <Text style={styles.actionBtnOutlineText}>{t("officialSite")}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionBtnPrimary} onPress={openNearestSaptcoStop}>
              <Ionicons name="navigate-outline" size={14} color={GOLD} />
              <Text style={styles.actionBtnPrimaryText}>{t("directionsNearestStop")}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={[styles.expandCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={styles.expandHeader}>
            <AppIcon name="car" size={26} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.listTitle, { color: theme.text }]}>{t("uber")}</Text>
              <Text style={[styles.listSub, { color: theme.textSecondary }]}>{t("uberSub")}</Text>
            </View>
          </View>
          <TouchableOpacity style={[styles.actionBtnPrimary, styles.actionBtnFull]} onPress={openUberToHaram}>
            <Ionicons name="car-outline" size={14} color={GOLD} />
            <Text style={styles.actionBtnPrimaryText}>{t("openUberApp")}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: { backgroundColor: NAVY, paddingBottom: 16 },
  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  title: { color: "#fff", fontSize: 26, fontWeight: "bold" },
  subtitle: { color: GOLD, fontSize: 13, marginTop: 2 },
  content: { padding: ui.space },
  groupLabel: { fontSize: 12, fontWeight: "600", marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.5 },
  expandCard: { borderRadius: ui.radius, borderWidth: ui.hairline, marginBottom: ui.gap, padding: ui.cardPad },
  expandHeader: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
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
    borderRadius: ui.radius,
    borderWidth: 1,
    borderColor: "rgba(201,168,76,0.5)",
    backgroundColor: "rgba(201,168,76,0.08)",
  },
  actionBtnOutlineText: { color: GOLD, fontSize: 12, fontWeight: "600" },
  actionBtnPrimary: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: ui.radius,
    backgroundColor: NAVY,
  },
  actionBtnPrimaryText: { color: GOLD, fontSize: 12, fontWeight: "600" },
  actionBtnFull: { flex: undefined, width: "100%", marginTop: 12 },
})
