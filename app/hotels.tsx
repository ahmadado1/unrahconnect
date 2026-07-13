import { useTheme } from "@/context/themeContext"
import { HOTELS, type Hotel } from "@/lib/hotels"
import { supabase, toggleFavorite } from "@/lib/supabase"
import { Ionicons } from "@expo/vector-icons"
import { useFocusEffect } from "@react-navigation/native"
import { useRouter } from "expo-router"
import { StatusBar } from "expo-status-bar"
import * as WebBrowser from "expo-web-browser"
import { useCallback, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import {
  Alert,
  ImageBackground,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"

type CityFilter = "All" | "Makkah" | "Madinah"

function byIds(ids: string[]): Hotel[] {
  return ids
    .map(id => HOTELS.find(h => h.id === id))
    .filter((h): h is Hotel => !!h)
}

const recommended = byIds([
  "fairmont-clock",
  "oberoi-madinah",
  "raffles-makkah",
  "anwar-movenpick",
  "conrad-makkah",
  "hilton-madinah",
])

const makkahTopPicks = byIds([
  "fairmont-clock",
  "swissotel-makkah",
  "pullman-zamzam",
  "conrad-makkah",
  "raffles-makkah",
  "hilton-suites-makkah",
  "movenpick-hajar",
  "dar-al-tawhid",
  "marriott-makkah",
  "sheraton-jabal",
  "hyatt-regency-makkah",
  "rotana-makkah",
  "al-safwah-orchid",
  "anjum-makkah",
  "radisson-blu-makkah",
  "le-meridien-towers",
  "elaf-kinda",
  "elaf-bakkah",
  "millennium-naseem",
  "makkah-millennium",
])

const nearHaram = byIds([
  "fairmont-clock",
  "swissotel-makkah",
  "pullman-zamzam",
  "al-safwah-orchid",
  "rotana-makkah",
  "elaf-kinda",
  "raffles-makkah",
  "movenpick-hajar",
  "hilton-suites-makkah",
  "dar-al-tawhid",
  "marriott-makkah",
  "hyatt-regency-makkah",
  "sheraton-jabal",
  "anjum-makkah",
])

const madinahTopPicks = byIds([
  "oberoi-madinah",
  "anwar-movenpick",
  "hilton-madinah",
  "dar-al-taqwa",
  "crowne-plaza-madinah",
  "shaza-madinah",
  "al-masa-madinah",
  "marriott-madinah",
])

const nearNabawi = byIds([
  "oberoi-madinah",
  "anwar-movenpick",
  "hilton-madinah",
  "dar-al-taqwa",
  "crowne-plaza-madinah",
  "al-masa-madinah",
  "shaza-madinah",
  "al-shohada",
  "al-haram-madinah",
  "anwar-al-madinah",
  "radisson-blu-madinah",
  "dallah-taibah",
  "saja-madinah",
  "marriott-madinah",
  "sheraton-madinah",
])

/** Closest / flagship hotels get the gold Featured badge */
const FEATURED_IDS = new Set([
  "fairmont-clock",
  "swissotel-makkah",
  "pullman-zamzam",
  "conrad-makkah",
  "raffles-makkah",
  "hilton-suites-makkah",
  "movenpick-hajar",
  "oberoi-madinah",
  "anwar-movenpick",
  "hilton-madinah",
  "dar-al-taqwa",
  "shaza-madinah",
])

async function openWebsite(url: string) {
  try {
    if (!url) {
      Alert.alert("Unable to open", "No website available for this hotel.")
      return
    }
    await WebBrowser.openBrowserAsync(url)
  } catch {
    try {
      await Linking.openURL(url)
    } catch {
      Alert.alert("Unable to open", "Something went wrong opening this website.")
    }
  }
}

export default function HotelsScreen() {
  const router = useRouter()
  const [activeFilter, setActiveFilter] = useState<CityFilter>("All")
  const [favoriteHotelIds, setFavoriteHotelIds] = useState<Set<string>>(new Set())
  const filters: CityFilter[] = ["All", "Makkah", "Madinah"]
  const [searchQuery, setSearchQuery] = useState("")
  const { theme } = useTheme()
  const { t } = useTranslation()
  const insets = useSafeAreaInsets()

  const loadFavoriteHotels = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      setFavoriteHotelIds(new Set())
      return
    }
    const { data, error } = await supabase
      .from("favorites")
      .select("item_id")
      .eq("user_id", user.id)
      .eq("item_type", "hotel")
    if (error) {
      console.error("loadFavoriteHotels error:", error.message)
      return
    }
    setFavoriteHotelIds(new Set((data ?? []).map(row => String(row.item_id))))
  }

  useFocusEffect(
    useCallback(() => {
      loadFavoriteHotels()
    }, [])
  )

  const filterHotelsList = useCallback(
    (hotels: Hotel[]) =>
      hotels.filter(h => {
        const matchesCity = activeFilter === "All" || h.city === activeFilter
        const matchesSearch = h.name.toLowerCase().includes(searchQuery.toLowerCase())
        return matchesCity && matchesSearch
      }),
    [activeFilter, searchQuery]
  )

  const visibleSections = useMemo(
    () =>
      [
        { title: "Recommended", hotels: recommended },
        { title: "Makkah Top Picks", hotels: makkahTopPicks },
        { title: "Near Haram", hotels: nearHaram },
        { title: "Madinah Top Picks", hotels: madinahTopPicks },
        { title: "Near Masjid al-Nabawi", hotels: nearNabawi },
      ]
        .map(section => ({
          title: section.title,
          hotels: filterHotelsList(section.hotels),
        }))
        .filter(section => section.hotels.length > 0),
    [filterHotelsList]
  )

  function HotelCard({ hotel }: { hotel: Hotel }) {
    const isFavorited = favoriteHotelIds.has(hotel.id)
    const isFeatured = FEATURED_IDS.has(hotel.id)
    const category = hotel.stars === 5 ? "5 Star" : "4 Star"
    const starsDisplay = "★".repeat(hotel.stars)

    const handleFavoritePress = async () => {
      const newState = await toggleFavorite(hotel.id, "hotel")
      setFavoriteHotelIds(prev => {
        const next = new Set(prev)
        if (newState) next.add(hotel.id)
        else next.delete(hotel.id)
        return next
      })
    }

    const handleVisitWebsite = (e: { stopPropagation?: () => void }) => {
      e.stopPropagation?.()
      openWebsite(hotel.website)
    }

    return (
      <TouchableOpacity
        style={[cardStyles.card, { backgroundColor: theme.card, borderColor: theme.border }]}
        onPress={() => router.push({ pathname: "/hotel-detail/[id]", params: { id: hotel.id } })}
        activeOpacity={0.9}
      >
        <ImageBackground
          source={{ uri: hotel.image }}
          style={cardStyles.image}
          imageStyle={{ borderTopLeftRadius: 16, borderTopRightRadius: 16 }}
        >
          <View style={cardStyles.badge}>
            <Text style={cardStyles.badgeText}>
              {isFeatured ? t("featured") : hotel.city}
            </Text>
          </View>
          <TouchableOpacity
            style={cardStyles.heart}
            onPress={e => {
              e.stopPropagation()
              handleFavoritePress()
            }}
          >
            <Ionicons
              name={isFavorited ? "heart" : "heart-outline"}
              size={18}
              color={isFavorited ? "#C9A84C" : "#fff"}
            />
          </TouchableOpacity>
          <Text style={cardStyles.imageLabel}>
            {hotel.city} · {hotel.distanceLabel}
          </Text>
        </ImageBackground>
        <View style={cardStyles.info}>
          <Text style={[cardStyles.name, { color: theme.text }]} numberOfLines={2}>
            {hotel.name}
          </Text>
          <Text style={[cardStyles.meta, { color: theme.textSecondary }]} numberOfLines={1}>
            {category} · {hotel.distanceLabel}
          </Text>
          <View style={cardStyles.footer}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <Text style={[cardStyles.price, { color: theme.text }]}>
                {starsDisplay} ·{" "}
                <Text style={{ color: "#2D6A4F" }}>● {hotel.walkMinutes} min walk</Text>
              </Text>
              <Text style={cardStyles.rating}>★ {hotel.stars}.0</Text>
            </View>
            <TouchableOpacity
              style={[cardStyles.btn, !isFeatured && cardStyles.btnExternal]}
              onPress={handleVisitWebsite}
            >
              <Text style={[cardStyles.btnText, !isFeatured && cardStyles.btnTextExternal]}>
                Visit Website
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    )
  }

  return (
    <View style={[styles.screen, { backgroundColor: theme.background }]}>
      <StatusBar style="light" />

      <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
        <View style={[styles.header, { paddingTop: insets.top }]}>
          <View style={styles.headerTop}>
            <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
              <Ionicons name="arrow-back" size={22} color="#fff" />
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>{t("hotels")}</Text>
              <Text style={styles.subtitle}>Well-known hotels near the Holy Mosques</Text>
            </View>
          </View>

          <View style={styles.searchBar}>
            <Ionicons name="search" size={16} color="rgba(255,255,255,0.5)" />
            <TextInput
              placeholder={t("searchHotels")}
              placeholderTextColor="rgba(255,255,255,0.45)"
              style={styles.searchInput}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.pillsRow}
            contentContainerStyle={{ gap: 8 }}
          >
            {filters.map(filter => (
              <TouchableOpacity
                key={filter}
                style={[styles.pill, activeFilter === filter && styles.pillActive]}
                onPress={() => setActiveFilter(filter)}
              >
                <Text style={[styles.pillText, activeFilter === filter && styles.pillTextActive]}>
                  {filter}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View key={activeFilter}>
          {visibleSections.map(section => (
            <View key={section.title} style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: theme.text }]}>{section.title}</Text>
                <TouchableOpacity>
                  <Text style={styles.seeAll}>{t("seeAll")}</Text>
                </TouchableOpacity>
              </View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 12, paddingHorizontal: 16 }}
              >
                {section.hotels.map(hotel => (
                  <HotelCard key={`${section.title}-${hotel.id}`} hotel={hotel} />
                ))}
              </ScrollView>
            </View>
          ))}

          {visibleSections.length === 0 && (
            <View style={styles.empty}>
              <Ionicons name="bed-outline" size={40} color={theme.textSecondary} />
              <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                No hotels match your filters
              </Text>
            </View>
          )}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  )
}

const cardStyles = StyleSheet.create({
  card: { width: 260, borderRadius: 16, overflow: "hidden", borderWidth: 0.5 },
  image: { height: 160, justifyContent: "flex-end", padding: 10, position: "relative" },
  badge: {
    position: "absolute",
    top: 10,
    left: 10,
    backgroundColor: "rgba(201,168,76,0.9)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  badgeText: { color: "#1E3A5F", fontSize: 11, fontWeight: "bold" },
  heart: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: "rgba(0,0,0,0.3)",
    borderRadius: 20,
    padding: 6,
  },
  imageLabel: { color: "rgba(255,255,255,0.8)", fontSize: 11 },
  info: { padding: 14 },
  name: { fontSize: 15, fontWeight: "bold", marginBottom: 4 },
  meta: { fontSize: 12, marginBottom: 10 },
  footer: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  price: { fontSize: 13, fontWeight: "bold" },
  rating: { color: "#C9A84C", fontSize: 12, marginTop: 2 },
  btn: { backgroundColor: "#1E3A5F", paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
  btnExternal: { backgroundColor: "#C9A84C" },
  btnText: { color: "#fff", fontSize: 11, fontWeight: "bold" },
  btnTextExternal: { color: "#1E3A5F" },
})

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: { backgroundColor: "#1E3A5F", paddingBottom: 16 },
  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  title: { color: "#fff", fontSize: 26, fontWeight: "bold" },
  subtitle: { color: "#C9A84C", fontSize: 13, marginTop: 2 },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  body: { flex: 1 },
  section: { marginTop: 24 },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 17, fontWeight: "bold" },
  seeAll: { color: "#C9A84C", fontSize: 13 },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.12)",
    marginHorizontal: 16,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
    marginBottom: 14,
  },
  searchInput: { flex: 1, color: "#fff", fontSize: 14 },
  pillsRow: { paddingHorizontal: 16 },
  pill: {
    paddingHorizontal: 18,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.12)",
  },
  pillActive: { backgroundColor: "#C9A84C" },
  pillText: { color: "rgba(255,255,255,0.7)", fontSize: 13, fontWeight: "500" },
  pillTextActive: { color: "#1E3A5F", fontWeight: "bold" },
  empty: { alignItems: "center", paddingVertical: 48, gap: 10 },
  emptyText: { fontSize: 14 },
})
