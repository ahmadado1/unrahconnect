// Restaurants or malls near Masjid al-Haram / Masjid an-Nabawi, live from Google.
//   /nearby/restaurants   /nearby/malls
// Category chips at the top, then compact rows: picture, name, type, rating, open now,
// walking time from the mosque. Tap a row for directions in Google Maps.
// Picture: Google photo when Google has one, else the chain's logo, else a category icon.
// Google's rules: show "Google" as the source and the photographer's name.
import { Ionicons } from "@expo/vector-icons"
import { Image } from "expo-image"
import { useLocalSearchParams, useRouter } from "expo-router"
import { StatusBar } from "expo-status-bar"
import { useCallback, useEffect, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { ActivityIndicator, FlatList, Linking, ScrollView, StyleSheet, Text, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import TouchableOpacity from "@/app/components/AppPressable"
import { useTheme } from "@/context/themeContext"
import {
  chainLogo,
  formatMeters,
  getNearbyPlaces,
  placePhotoUrl,
  priceSymbols,
  type CategoryBanner,
  type NearbyCategory,
  type NearbyCity,
  type NearbyKind,
  type NearbyPlace,
} from "@/lib/nearbyPlaces"

const NAVY = "#1E3A5F"
const GOLD = "#C9A84C"
const GREEN = "#2F855A"

// Order, label and look of each category
const CATEGORIES: Record<NearbyKind, NearbyCategory[]> = {
  restaurants: ["fast", "arabic", "asian", "cafe", "other"],
  malls: ["mall", "supermarket", "department"],
}
const CAT_STYLE: Record<NearbyCategory, { icon: keyof typeof Ionicons.glyphMap; tint: string; labelKey: string }> = {
  fast: { icon: "fast-food-outline", tint: "#EF6C3A", labelKey: "catFast" },
  arabic: { icon: "restaurant-outline", tint: "#B7791F", labelKey: "catArabic" },
  asian: { icon: "flame-outline", tint: "#C53030", labelKey: "catAsian" },
  cafe: { icon: "cafe-outline", tint: "#7B4F2C", labelKey: "catCafe" },
  other: { icon: "restaurant-outline", tint: NAVY, labelKey: "catOther" },
  mall: { icon: "bag-handle-outline", tint: "#B83280", labelKey: "catMall" },
  supermarket: { icon: "cart-outline", tint: GREEN, labelKey: "catSupermarket" },
  department: { icon: "shirt-outline", tint: "#2B6CB0", labelKey: "catDepartment" },
}

/** Small square picture for a row. */
function Thumb({ place }: { place: NearbyPlace }) {
  const look = CAT_STYLE[place.category] ?? CAT_STYLE.other
  if (place.photo) {
    return <Image source={{ uri: placePhotoUrl(place.photo, 240) }} style={styles.thumb} contentFit="cover" transition={150} cachePolicy="memory-disk" />
  }
  const logo = chainLogo(place.name)
  if (logo) {
    return (
      <View style={[styles.thumb, styles.logoBox]}>
        <Image source={{ uri: logo }} style={styles.logo} contentFit="contain" cachePolicy="memory-disk" />
      </View>
    )
  }
  return (
    <View style={[styles.thumb, styles.iconBox, { backgroundColor: `${look.tint}1A` }]}>
      <Ionicons name={look.icon} size={26} color={look.tint} />
    </View>
  )
}

export default function NearbyScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { theme } = useTheme()
  const { t, i18n } = useTranslation()
  const params = useLocalSearchParams<{ kind?: string; city?: string }>()
  const kind: NearbyKind = params.kind === "malls" ? "malls" : "restaurants"
  const [city, setCity] = useState<NearbyCity>(params.city === "madinah" ? "madinah" : "makkah")
  const [category, setCategory] = useState<NearbyCategory | "all">("all")
  const [places, setPlaces] = useState<NearbyPlace[] | null>(null)
  const [banners, setBanners] = useState<Partial<Record<string, CategoryBanner>>>({})
  const [error, setError] = useState(false)

  const load = useCallback(async () => {
    setError(false)
    setPlaces(null)
    try {
      const result = await getNearbyPlaces(city, kind, (i18n.language || "en").slice(0, 2))
      setPlaces(result.places)
      setBanners(result.banners)
    } catch (e) {
      console.log("Nearby load error:", e)
      setError(true)
    }
  }, [city, kind, i18n.language])

  useEffect(() => {
    void load()
  }, [load])

  // Only show category chips that have places
  const chips = useMemo(() => {
    const present = new Set((places ?? []).map((p) => p.category))
    return CATEGORIES[kind].filter((c) => present.has(c))
  }, [places, kind])
  const shown = useMemo(
    () => (places ?? []).filter((p) => category === "all" || p.category === category),
    [places, category],
  )

  const mosque = city === "makkah" ? t("nearbyHaram") : t("nearbyNabawi")
  const title = kind === "malls" ? t("nearbyMallsTitle") : t("nearbyRestaurantsTitle")

  const renderItem = ({ item }: { item: NearbyPlace }) => {
    const price = priceSymbols(item.priceLevel)
    return (
      <TouchableOpacity
        style={[styles.row, { backgroundColor: theme.card, borderColor: theme.border }]}
        onPress={() => Linking.openURL(item.mapsUrl).catch(() => {})}
        accessibilityRole="button"
      >
        <Thumb place={item} />
        <View style={{ flex: 1, gap: 3 }}>
          <Text style={[styles.name, { color: theme.text }]} numberOfLines={1}>{item.name}</Text>
          <View style={styles.metaRow}>
            {item.rating ? (
              <View style={styles.meta}>
                <Ionicons name="star" size={12} color={GOLD} />
                <Text style={[styles.metaText, { color: theme.text }]}>
                  {item.rating.toFixed(1)} <Text style={{ color: theme.textSecondary }}>({item.ratingCount.toLocaleString()})</Text>
                </Text>
              </View>
            ) : null}
            {price ? <Text style={[styles.metaText, { color: theme.textSecondary }]}>{price}</Text> : null}
            {item.typeLabel ? <Text style={[styles.metaText, { color: theme.textSecondary }]} numberOfLines={1}>{item.typeLabel}</Text> : null}
          </View>
          <View style={styles.meta}>
            <Ionicons name="walk-outline" size={13} color={NAVY} />
            <Text style={[styles.metaText, { color: theme.textSecondary }]} numberOfLines={1}>
              {t("nearbyWalkShort", { min: item.walkMinutes, dist: formatMeters(item.meters) })}
            </Text>
            {item.openNow !== null ? (
              <Text style={[styles.metaText, { color: item.openNow ? GREEN : "#C53030", fontWeight: "700" }]}>
                · {item.openNow ? t("nearbyOpenNow") : t("nearbyClosedNow")}
              </Text>
            ) : null}
          </View>
          {/* Credit the photographer (Google) or author + licence (Wikimedia Commons) */}
          {item.photo?.author ? (
            <Text
              style={styles.credit}
              numberOfLines={1}
              onPress={() => item.photo?.authorUrl && Linking.openURL(item.photo.authorUrl).catch(() => {})}
            >
              {t("nearbyPhotoBy", { name: item.photo.author })}
              {item.photo.source === "wikimedia" ? ` · ${item.photo.license ? `${item.photo.license}, ` : ""}Wikimedia Commons` : ""}
            </Text>
          ) : null}
        </View>
        <View style={styles.dirIcon}>
          <Ionicons name="navigate" size={16} color={NAVY} />
        </View>
      </TouchableOpacity>
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
            <TouchableOpacity key={c} style={[styles.toggleBtn, city === c && styles.toggleOn]} onPress={() => { setCity(c); setCategory("all") }}>
              <Text style={[styles.toggleText, city === c && styles.toggleTextOn]}>{c === "makkah" ? t("makkah") : t("madinah")}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Categories */}
      {places && chips.length > 1 ? (
        <View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
            {(["all", ...chips] as (NearbyCategory | "all")[]).map((c) => {
              const on = category === c
              const look = c === "all" ? null : CAT_STYLE[c]
              return (
                <TouchableOpacity
                  key={c}
                  style={[styles.chip, { borderColor: theme.border, backgroundColor: on ? NAVY : theme.card }]}
                  onPress={() => setCategory(c)}
                >
                  {look ? <Ionicons name={look.icon} size={14} color={on ? GOLD : look.tint} /> : null}
                  <Text style={[styles.chipText, { color: on ? "#fff" : theme.text }]}>
                    {c === "all" ? t("catAll") : t(look!.labelKey)}
                    {c === "all" ? "" : ` · ${(places ?? []).filter((p) => p.category === c).length}`}
                  </Text>
                </TouchableOpacity>
              )
            })}
          </ScrollView>
        </View>
      ) : null}

      {error ? (
        <View style={styles.center}>
          <Ionicons name="cloud-offline-outline" size={40} color={GOLD} />
          <Text style={[styles.centerText, { color: theme.textSecondary }]}>{t("nearbyError")}</Text>
          <TouchableOpacity style={styles.retry} onPress={load}>
            <Text style={styles.retryText}>{t("tryAgain")}</Text>
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
          ListHeaderComponent={(() => {
            const key = category === "all" ? chips[0] : category
            const banner = key ? banners[key] : undefined
            if (!banner) return null
            return (
              <View style={styles.banner}>
                <Image source={{ uri: banner.url }} style={StyleSheet.absoluteFill} contentFit="cover" transition={200} cachePolicy="memory-disk" />
                <View style={styles.bannerShade} />
                <Text style={styles.bannerTitle}>{key ? t(CAT_STYLE[key].labelKey) : ""}</Text>
                <Text style={styles.bannerCredit} onPress={() => Linking.openURL(banner.pageUrl).catch(() => {})}>
                  {t("nearbyPhotoBy", { name: banner.author })} · {banner.source || "Pexels"}
                </Text>
              </View>
            )
          })()}
          data={shown}
          keyExtractor={(p) => p.id}
          renderItem={renderItem}
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 4, paddingBottom: insets.bottom + 40, gap: 10 }}
          ListEmptyComponent={<Text style={[styles.centerText, { color: theme.textSecondary, marginTop: 30 }]}>{t("nearbyEmpty")}</Text>}
          ListFooterComponent={
            <Text style={[styles.powered, { color: theme.textSecondary }]}>
              {t("nearbyPoweredBy")}
            </Text>
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
  chips: { paddingHorizontal: 16, paddingVertical: 12, gap: 8 },
  chip: { flexDirection: "row", alignItems: "center", gap: 6, borderWidth: 1, borderRadius: 999, paddingVertical: 7, paddingHorizontal: 12 },
  chipText: { fontSize: 13, fontWeight: "700" },
  row: { flexDirection: "row", alignItems: "center", gap: 12, borderRadius: 16, borderWidth: 0.5, padding: 10 },
  thumb: { width: 64, height: 64, borderRadius: 12, backgroundColor: "#EEF2F7" },
  logoBox: { backgroundColor: "#fff", alignItems: "center", justifyContent: "center", borderWidth: 0.5, borderColor: "#E2E8F0" },
  logo: { width: 46, height: 46 },
  iconBox: { alignItems: "center", justifyContent: "center" },
  name: { fontSize: 15, fontWeight: "bold" },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" },
  meta: { flexDirection: "row", alignItems: "center", gap: 4 },
  metaText: { fontSize: 12 },
  dirIcon: { width: 34, height: 34, borderRadius: 17, backgroundColor: GOLD, alignItems: "center", justifyContent: "center" },
  center: { alignItems: "center", padding: 32, gap: 10 },
  centerText: { fontSize: 14, textAlign: "center" },
  retry: { backgroundColor: GOLD, borderRadius: 999, paddingVertical: 8, paddingHorizontal: 16 },
  retryText: { color: NAVY, fontWeight: "bold" },
  credit: { fontSize: 10, color: "#8A97A5" },
  banner: { height: 120, borderRadius: 16, overflow: "hidden", justifyContent: "flex-end", padding: 12, marginBottom: 2 },
  bannerShade: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(15,30,50,0.35)" },
  bannerTitle: { color: "#fff", fontSize: 20, fontWeight: "bold" },
  bannerCredit: { color: "#E2E8F0", fontSize: 10, marginTop: 2 },
  powered: { fontSize: 11, textAlign: "center", marginTop: 8 },
})
