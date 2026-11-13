// Restaurants or malls near Masjid al-Haram / Masjid an-Nabawi, live from Google:
// real photo, rating, open now, walking time from the mosque, and Directions.
//   /nearby/restaurants   /nearby/malls
// Google's rules: show "Google" as the source and the photo author's name.
import { Ionicons } from "@expo/vector-icons"
import { Image } from "expo-image"
import { useLocalSearchParams, useRouter } from "expo-router"
import { StatusBar } from "expo-status-bar"
import { useCallback, useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { ActivityIndicator, FlatList, Linking, StyleSheet, Text, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import TouchableOpacity from "@/app/components/AppPressable"
import { useTheme } from "@/context/themeContext"
import {
  formatMeters,
  getNearbyPlaces,
  nearbyPhotoUrl,
  priceSymbols,
  type NearbyCity,
  type NearbyKind,
  type NearbyPlace,
} from "@/lib/nearbyPlaces"

const NAVY = "#1E3A5F"
const GOLD = "#C9A84C"
const GREEN = "#2F855A"

export default function NearbyScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { theme } = useTheme()
  const { t, i18n } = useTranslation()
  const params = useLocalSearchParams<{ kind?: string; city?: string }>()
  const kind: NearbyKind = params.kind === "malls" ? "malls" : "restaurants"
  const [city, setCity] = useState<NearbyCity>(params.city === "madinah" ? "madinah" : "makkah")
  const [places, setPlaces] = useState<NearbyPlace[] | null>(null)
  const [error, setError] = useState(false)

  const load = useCallback(async () => {
    setError(false)
    setPlaces(null)
    try {
      setPlaces(await getNearbyPlaces(city, kind, (i18n.language || "en").slice(0, 2)))
    } catch (e) {
      console.log("Nearby load error:", e)
      setError(true)
    }
  }, [city, kind, i18n.language])

  useEffect(() => {
    void load()
  }, [load])

  const mosque = city === "makkah" ? t("nearbyHaram") : t("nearbyNabawi")
  const title = kind === "malls" ? t("nearbyMallsTitle") : t("nearbyRestaurantsTitle")

  const renderItem = ({ item }: { item: NearbyPlace }) => {
    const price = priceSymbols(item.priceLevel)
    return (
      <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
        {/* Photo (from Google, with the photographer's name) */}
        {item.photo ? (
          <View>
            <Image source={{ uri: nearbyPhotoUrl(item.photo.name, 800) }} style={styles.photo} contentFit="cover" transition={200} cachePolicy="memory-disk" />
            {item.photo.author ? (
              <Text style={styles.photoCredit} numberOfLines={1} onPress={() => item.photo?.authorUrl && Linking.openURL(item.photo.authorUrl)}>
                {t("nearbyPhotoBy", { name: item.photo.author })}
              </Text>
            ) : null}
          </View>
        ) : (
          <View style={[styles.photo, styles.noPhoto]}>
            <Ionicons name={kind === "malls" ? "bag-handle-outline" : "restaurant-outline"} size={40} color={GOLD} />
          </View>
        )}

        <View style={styles.body}>
          <Text style={[styles.name, { color: theme.text }]} numberOfLines={2}>{item.name}</Text>

          <View style={styles.metaRow}>
            {item.rating ? (
              <View style={styles.meta}>
                <Ionicons name="star" size={13} color={GOLD} />
                <Text style={[styles.metaText, { color: theme.text }]}>
                  {item.rating.toFixed(1)} <Text style={{ color: theme.textSecondary }}>({item.ratingCount.toLocaleString()})</Text>
                </Text>
              </View>
            ) : null}
            {price ? <Text style={[styles.metaText, { color: theme.textSecondary }]}>{price}</Text> : null}
            {item.openNow !== null ? (
              <Text style={[styles.metaText, { color: item.openNow ? GREEN : "#C53030", fontWeight: "700" }]}>
                {item.openNow ? t("nearbyOpenNow") : t("nearbyClosedNow")}
              </Text>
            ) : null}
          </View>

          {/* Walking time from the mosque */}
          <View style={styles.meta}>
            <Ionicons name="walk-outline" size={15} color={NAVY} />
            <Text style={[styles.metaText, { color: theme.textSecondary }]}>
              {t("nearbyWalk", { min: item.walkMinutes, dist: formatMeters(item.meters), place: mosque })}
            </Text>
          </View>
          {item.address ? <Text style={[styles.address, { color: theme.textSecondary }]} numberOfLines={1}>{item.address}</Text> : null}

          <TouchableOpacity style={styles.dirBtn} onPress={() => Linking.openURL(item.mapsUrl).catch(() => {})}>
            <Ionicons name="navigate" size={15} color={NAVY} />
            <Text style={styles.dirText}>{t("getDirections")}</Text>
          </TouchableOpacity>
        </View>
      </View>
    )
  }

  return (
    <View style={[styles.screen, { backgroundColor: theme.background }]}>
      <StatusBar style="light" />
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={22} color="#fff" />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.subtitle}>{t("nearbySub", { place: mosque })}</Text>
          </View>
        </View>
        {/* Makkah / Madinah */}
        <View style={styles.toggle}>
          {(["makkah", "madinah"] as NearbyCity[]).map((c) => (
            <TouchableOpacity key={c} style={[styles.toggleBtn, city === c && styles.toggleOn]} onPress={() => setCity(c)}>
              <Text style={[styles.toggleText, city === c && styles.toggleTextOn]}>{c === "makkah" ? t("makkah") : t("madinah")}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {error ? (
        <View style={styles.center}>
          <Ionicons name="cloud-offline-outline" size={40} color={GOLD} />
          <Text style={[styles.centerText, { color: theme.textSecondary }]}>{t("nearbyError")}</Text>
          <TouchableOpacity style={styles.dirBtn} onPress={load}>
            <Text style={styles.dirText}>{t("tryAgain")}</Text>
          </TouchableOpacity>
          {kind === "restaurants" ? (
            <TouchableOpacity onPress={() => router.push("/restaurants" as any)} style={{ marginTop: 12 }}>
              <Text style={{ color: GOLD, fontWeight: "700" }}>{t("nearbySavedList")}</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      ) : !places ? (
        <ActivityIndicator color={GOLD} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={places}
          keyExtractor={(p) => p.id}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 40, gap: 14 }}
          ListEmptyComponent={<Text style={[styles.centerText, { color: theme.textSecondary }]}>{t("nearbyEmpty")}</Text>}
          ListFooterComponent={
            <Text style={[styles.powered, { color: theme.textSecondary }]}>{t("nearbyPoweredBy")}</Text>
          }
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: { backgroundColor: NAVY, paddingHorizontal: 20, paddingBottom: 16 },
  headerRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  backBtn: { backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 20, padding: 6 },
  title: { color: "#fff", fontSize: 20, fontWeight: "bold" },
  subtitle: { color: GOLD, fontSize: 12, marginTop: 2 },
  toggle: { flexDirection: "row", backgroundColor: "rgba(255,255,255,0.12)", borderRadius: 999, padding: 4, marginTop: 14 },
  toggleBtn: { flex: 1, alignItems: "center", paddingVertical: 8, borderRadius: 999 },
  toggleOn: { backgroundColor: GOLD },
  toggleText: { color: "#fff", fontWeight: "700" },
  toggleTextOn: { color: NAVY },
  card: { borderRadius: 18, borderWidth: 0.5, overflow: "hidden" },
  photo: { width: "100%", height: 170, backgroundColor: "#EEF2F7" },
  noPhoto: { alignItems: "center", justifyContent: "center", backgroundColor: "#F3EAD2" },
  photoCredit: { position: "absolute", bottom: 6, right: 8, color: "#fff", fontSize: 10, backgroundColor: "rgba(0,0,0,0.45)", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, maxWidth: "70%" },
  body: { padding: 14, gap: 6 },
  name: { fontSize: 17, fontWeight: "bold" },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 12, flexWrap: "wrap" },
  meta: { flexDirection: "row", alignItems: "center", gap: 5 },
  metaText: { fontSize: 13 },
  address: { fontSize: 12 },
  dirBtn: { flexDirection: "row", alignItems: "center", gap: 6, alignSelf: "flex-start", backgroundColor: GOLD, borderRadius: 999, paddingVertical: 8, paddingHorizontal: 14, marginTop: 6 },
  dirText: { color: NAVY, fontWeight: "bold", fontSize: 13 },
  center: { alignItems: "center", padding: 32, gap: 10 },
  centerText: { fontSize: 14, textAlign: "center" },
  powered: { fontSize: 11, textAlign: "center", marginTop: 6 },
})
