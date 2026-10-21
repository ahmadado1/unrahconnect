import PremiumUpsellCard from "@/app/components/PremiumUpsellCard"
// Offline map for Makkah and Madinah (Premium).
//   • Map: OpenStreetMap tiles are saved on the phone as you look at them. Open it once with
//     internet (e.g. at the hotel) and those areas still show later with no internet.
//   • Places list: gates, Zamzam, hospitals, Quba, Baqi... stored in the app, with live distance,
//     walking time and an arrow that points the way. GPS and the compass work with no internet.
import TouchableOpacity from "@/app/components/AppPressable"
import { useTheme } from "@/context/themeContext"
import {
  CITY_CENTER,
  OFFLINE_PLACES,
  PLACE_ICON,
  bearingDegrees,
  distanceMeters,
  formatDistance,
  walkMinutes,
  type OfflineCity,
  type OfflinePlace,
} from "@/lib/offlinePlaces"
import { usePremium } from "@/lib/premium"
import { Ionicons } from "@expo/vector-icons"
import * as FileSystem from "expo-file-system/legacy"
import * as Location from "expo-location"
import { useRouter } from "expo-router"
import { StatusBar } from "expo-status-bar"
import { useEffect, useMemo, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { NativeModules, Platform, ScrollView, StyleSheet, Text, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"

const NAVY = "#1E3A5F"
const GOLD = "#C9A84C"
const TILE_URL = "https://tile.openstreetmap.org/{z}/{x}/{y}.png"
const TILE_CACHE = `${FileSystem.documentDirectory ?? ""}map-tiles`
const THIRTY_DAYS = 30 * 24 * 60 * 60

// Load react-native-maps only when the native part exists (not in Expo Go / web).
function loadMaps() {
  if (Platform.OS === "web") return null
  const hasNative = NativeModules.RNMapsAirModule != null || NativeModules.AIRMapManager != null || NativeModules.AIRGoogleMapManager != null
  if (!hasNative) return null
  try {
    return require("react-native-maps")
  } catch {
    return null
  }
}
const maps = loadMaps()
const MapView = maps?.default ?? null
const Marker = maps?.Marker ?? null
const UrlTile = maps?.UrlTile ?? null

/** Quick check: can we reach the map server right now? */
async function isOnline() {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 3500)
  try {
    const res = await fetch("https://tile.openstreetmap.org/0/0/0.png", { method: "HEAD", signal: controller.signal })
    return res.ok
  } catch {
    return false
  } finally {
    clearTimeout(timer)
  }
}

export default function OfflineMapScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { theme } = useTheme()
  const { t } = useTranslation()
  const { isPremium } = usePremium()
  const mapRef = useRef<any>(null)
  const pickedCityRef = useRef(false)

  const [city, setCity] = useState<OfflineCity>("makkah")
  const [online, setOnline] = useState(true)
  const [me, setMe] = useState<{ lat: number; lng: number } | null>(null)
  const [heading, setHeading] = useState<number | null>(null)

  // Online or offline? (Offline → the map only uses saved tiles.)
  useEffect(() => {
    void isOnline().then(setOnline)
  }, [])

  // Where am I, and which way is the phone pointing? Both work without internet.
  useEffect(() => {
    if (!isPremium) return
    let posSub: Location.LocationSubscription | null = null
    let headSub: Location.LocationSubscription | null = null
    let cancelled = false
    ;(async () => {
      const { status } = await Location.requestForegroundPermissionsAsync()
      if (status !== "granted" || cancelled) return
      posSub = await Location.watchPositionAsync({ accuracy: Location.Accuracy.High, distanceInterval: 5 }, pos => {
        const next = { lat: pos.coords.latitude, lng: pos.coords.longitude }
        // First GPS fix: if you're in Madinah, switch to Madinah.
        if (!pickedCityRef.current) {
          pickedCityRef.current = true
          const nearMadinah = distanceMeters(next, CITY_CENTER.madinah) < distanceMeters(next, CITY_CENTER.makkah)
          setCity(nearMadinah ? "madinah" : "makkah")
        }
        setMe(next)
      })
      headSub = await Location.watchHeadingAsync(h => setHeading(h.trueHeading >= 0 ? h.trueHeading : h.magHeading))
    })().catch(() => {})
    return () => {
      cancelled = true
      posSub?.remove()
      headSub?.remove()
    }
  }, [isPremium])

  const places = useMemo(() => {
    const list = OFFLINE_PLACES.filter(p => p.city === city)
    if (!me) return list.map(p => ({ place: p, distance: null as number | null, bearing: 0 }))
    return list
      .map(p => ({ place: p, distance: distanceMeters(me, p), bearing: bearingDegrees(me, p) }))
      .sort((a, b) => (a.distance ?? 0) - (b.distance ?? 0))
  }, [city, me])

  const focus = (p: { lat: number; lng: number }, delta = 0.004) => {
    mapRef.current?.animateToRegion({ latitude: p.lat, longitude: p.lng, latitudeDelta: delta, longitudeDelta: delta }, 500)
  }

  const switchCity = (next: OfflineCity) => {
    setCity(next)
    focus(CITY_CENTER[next], 0.02)
  }

  const center = CITY_CENTER[city]

  return (
    <View style={[styles.screen, { backgroundColor: theme.background }]}>
      <StatusBar style="light" />
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={22} color="#fff" />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>{t("om_title")}</Text>
            <Text style={styles.headerSub}>{online ? t("om_onlineHint") : t("om_offlineNow")}</Text>
          </View>
          <View style={[styles.statusDot, { backgroundColor: online ? "#4ADE80" : "#F59E0B" }]} />
        </View>
        <View style={styles.segment}>
          {(["makkah", "madinah"] as const).map(c => (
            <TouchableOpacity key={c} onPress={() => switchCity(c)} style={[styles.segBtn, city === c && styles.segOn]}>
              <Text style={[styles.segText, { color: city === c ? NAVY : "#fff" }]}>{t(c === "makkah" ? "tp_makkah" : "tp_madinah")}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {!isPremium ? (
        <PremiumUpsellCard variant="locked" />
      ) : (
        <>
          {/* ─── Map ─── */}
          {MapView && UrlTile ? (
            <View style={styles.mapWrap}>
              <MapView
                ref={mapRef}
                style={StyleSheet.absoluteFill}
                mapType={Platform.OS === "android" ? "none" : "standard"}
                initialRegion={{ latitude: center.lat, longitude: center.lng, latitudeDelta: 0.012, longitudeDelta: 0.012 }}
                showsUserLocation
                showsCompass
              >
                <UrlTile
                  urlTemplate={TILE_URL}
                  maximumZ={19}
                  shouldReplaceMapContent
                  tileCachePath={TILE_CACHE}
                  tileCacheMaxAge={THIRTY_DAYS}
                  offlineMode={!online}
                />
                {OFFLINE_PLACES.filter(p => p.city === city).map(p => (
                  <Marker key={p.id} coordinate={{ latitude: p.lat, longitude: p.lng }} title={t(p.nameKey)} pinColor={p.kind === "hospital" ? "#DC2626" : GOLD} />
                ))}
              </MapView>
              {me ? (
                <TouchableOpacity style={styles.meBtn} onPress={() => focus(me, 0.003)}>
                  <Ionicons name="locate" size={20} color={NAVY} />
                </TouchableOpacity>
              ) : null}
              <Text style={styles.attribution}>© OpenStreetMap contributors</Text>
            </View>
          ) : (
            <View style={[styles.mapWrap, styles.noMap]}>
              <Ionicons name="map-outline" size={28} color={GOLD} />
              <Text style={styles.noMapText}>{t("mapsNativeBuildRequired")}</Text>
            </View>
          )}

          {/* ─── Places (works with no internet) ─── */}
          <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 30 }}>
            <Text style={[styles.listTitle, { color: theme.text }]}>{t("om_placesTitle")}</Text>
            <Text style={[styles.listSub, { color: theme.textSecondary }]}>{me ? t("om_placesSub") : t("om_needLocation")}</Text>
            {places.map(({ place, distance, bearing }) => (
              <PlaceRow
                key={place.id}
                place={place}
                distance={distance}
                // Arrow: direction of the place minus the way the phone points.
                arrow={heading === null ? bearing : bearing - heading}
                onPress={() => focus(place)}
              />
            ))}
            <Text style={[styles.note, { color: theme.textSecondary }]}>{t("om_note")}</Text>
          </ScrollView>
        </>
      )}
    </View>
  )
}

function PlaceRow({ place, distance, arrow, onPress }: { place: OfflinePlace; distance: number | null; arrow: number; onPress: () => void }) {
  const { theme } = useTheme()
  const { t } = useTranslation()
  return (
    <TouchableOpacity style={[styles.row, { backgroundColor: theme.card, borderColor: theme.border }]} onPress={onPress}>
      <View style={[styles.rowIcon, place.kind === "hospital" && { backgroundColor: "#DC2626" }]}>
        <Ionicons name={PLACE_ICON[place.kind] as any} size={16} color="#fff" />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.rowTitle, { color: theme.text }]} numberOfLines={1}>{t(place.nameKey)}</Text>
        {distance !== null ? (
          <Text style={[styles.rowSub, { color: theme.textSecondary }]}>
            {formatDistance(distance)} · {t("om_walk", { min: walkMinutes(distance) })}
          </Text>
        ) : null}
      </View>
      {distance !== null ? (
        <View style={[styles.arrow, { transform: [{ rotate: `${arrow}deg` }] }]}>
          <Ionicons name="navigate" size={20} color={GOLD} style={{ transform: [{ rotate: "-45deg" }] }} />
        </View>
      ) : null}
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: { backgroundColor: NAVY, paddingHorizontal: 16, paddingBottom: 14 },
  headerRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  backBtn: { backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 20, padding: 6 },
  headerTitle: { color: "#fff", fontSize: 18, fontWeight: "bold" },
  headerSub: { color: GOLD, fontSize: 12, marginTop: 1 },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  segment: { flexDirection: "row", backgroundColor: "rgba(255,255,255,0.12)", borderRadius: 12, padding: 3, marginTop: 12 },
  segBtn: { flex: 1, alignItems: "center", paddingVertical: 8, borderRadius: 10 },
  segOn: { backgroundColor: GOLD },
  segText: { fontSize: 13, fontWeight: "700" },
  locked: { textAlign: "center", marginTop: 50, paddingHorizontal: 30 },
  mapWrap: { height: 300, backgroundColor: "#E5E7EB" },
  noMap: { alignItems: "center", justifyContent: "center", gap: 8, padding: 20, backgroundColor: NAVY },
  noMapText: { color: "rgba(255,255,255,0.7)", textAlign: "center", fontSize: 12 },
  meBtn: { position: "absolute", right: 12, bottom: 24, backgroundColor: "#fff", borderRadius: 22, padding: 10, elevation: 4, shadowColor: "#000", shadowOpacity: 0.2, shadowRadius: 4 },
  attribution: { position: "absolute", left: 6, bottom: 4, fontSize: 9, color: "#333", backgroundColor: "rgba(255,255,255,0.7)", paddingHorizontal: 4 },
  listTitle: { fontSize: 16, fontWeight: "800" },
  listSub: { fontSize: 12, marginTop: 2, marginBottom: 10 },
  row: { flexDirection: "row", alignItems: "center", gap: 12, padding: 12, borderRadius: 14, borderWidth: 0.5, marginBottom: 8 },
  rowIcon: { width: 32, height: 32, borderRadius: 16, backgroundColor: NAVY, alignItems: "center", justifyContent: "center" },
  rowTitle: { fontSize: 14, fontWeight: "600" },
  rowSub: { fontSize: 12, marginTop: 2 },
  arrow: { width: 34, height: 34, borderRadius: 17, borderWidth: 1, borderColor: GOLD, alignItems: "center", justifyContent: "center" },
  note: { fontSize: 11, marginTop: 10, lineHeight: 16 },
})
