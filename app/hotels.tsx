import { AppIcon, AppIconKey, StarRating } from "@/components/AppIcon"
import { useTheme } from "@/context/themeContext"
import { HOTEL_IMAGE_PLACEHOLDER } from "@/lib/hotelImages"
import { groupHotelsIntoSections, HOTELS, type Hotel } from "@/lib/hotels"
import { supabase, toggleFavorite } from "@/lib/supabase"
import { Ionicons } from "@expo/vector-icons"
import { useFocusEffect } from "@react-navigation/native"
import { useRouter } from "expo-router"
import { StatusBar } from "expo-status-bar"
import * as WebBrowser from "expo-web-browser"
import { useCallback, useEffect, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import {
  Alert,
  Image,
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
type CategoryFilter =
  | "All"
  | "Recommended"
  | "Budget Friendly"
  | "Near Haram"
  | "Near Nabawi"
  | "Abraj Al Bait Mall"
  | "Family"

function byIds(ids: string[]): Hotel[] {
  return ids
    .map(id => HOTELS.find(h => h.id === id))
    .filter((h): h is Hotel => !!h)
}

/** Curated flagship picks shown first */
const RECOMMENDED_IDS = [
  "fairmont-clock",
  "oberoi-madinah",
  "raffles-makkah",
  "anwar-movenpick",
  "conrad-makkah",
  "hilton-madinah",
  "pullman-zamzam",
  "dar-al-taqwa",
]

/** Budget / mid-range options */
const BUDGET_FRIENDLY_IDS = new Set([
  "elaf-kinda",
  "elaf-bakkah",
  "al-haram-madinah",
  "dallah-taibah",
  "saja-madinah",
  "al-shohada",
  "millennium-naseem",
  "le-meridien-towers",
])

/** Abraj Al Bait Mall / hotel complex (formerly labeled Clock Tower) */
const ABRAJ_AL_BAIT_IDS = new Set([
  "fairmont-clock",
  "swissotel-makkah",
  "pullman-zamzam",
  "raffles-makkah",
  "movenpick-hajar",
  "rotana-makkah",
  "al-safwah-orchid",
])

/** Good for families — suites, larger rooms, or group-friendly stays */
const FAMILY_FRIENDLY_IDS = new Set([
  "pullman-zamzam",
  "hilton-suites-makkah",
  "anwar-movenpick",
  "elaf-kinda",
  "elaf-bakkah",
  "dallah-taibah",
  "le-meridien-towers",
  "saja-madinah",
  "anjum-makkah",
  "radisson-blu-makkah",
  "al-shohada",
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

const recommendedHotels = byIds(RECOMMENDED_IDS)
const budgetFriendlyHotels = HOTELS.filter(h => BUDGET_FRIENDLY_IDS.has(h.id))
const nearHaramHotels = HOTELS.filter(h => h.city === "Makkah" && h.walkMinutes <= 5)
const nearNabawiHotels = HOTELS.filter(h => h.city === "Madinah" && h.walkMinutes <= 5)
const abrajAlBaitHotels = HOTELS.filter(h => ABRAJ_AL_BAIT_IDS.has(h.id))
const familyHotels = HOTELS.filter(h => FAMILY_FRIENDLY_IDS.has(h.id))

const CATEGORY_SECTIONS: { key: Exclude<CategoryFilter, "All">; icon: AppIconKey; title: string; hotels: Hotel[] }[] =
  [
    { key: "Recommended", icon: "sparkles", title: "Recommended", hotels: recommendedHotels },
    { key: "Budget Friendly", icon: "cash", title: "Budget Friendly", hotels: budgetFriendlyHotels },
    { key: "Near Haram", icon: "kaaba", title: "Closest to Haram", hotels: nearHaramHotels },
    { key: "Near Nabawi", icon: "mosque", title: "Closest to Nabawi", hotels: nearNabawiHotels },
    { key: "Abraj Al Bait Mall", icon: "business", title: "Abraj Al Bait Mall", hotels: abrajAlBaitHotels },
    { key: "Family", icon: "people", title: "Family Friendly", hotels: familyHotels },
  ]


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
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>("All")
  const [activeFilter, setActiveFilter] = useState<CityFilter>("All")
  const [favoriteHotelIds, setFavoriteHotelIds] = useState<Set<string>>(new Set())
  const categoryFilters: CategoryFilter[] = [
    "All",
    "Recommended",
    "Budget Friendly",
    "Near Haram",
    "Near Nabawi",
    "Abraj Al Bait Mall",
    "Family",
  ]
  const cityFilters: CityFilter[] = ["All", "Makkah", "Madinah"]
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

  const visibleSections = useMemo(() => {
    // "All" shows each hotel once (by city/stars). Category pills can overlap on purpose.
    if (activeCategory === "All") {
      return groupHotelsIntoSections(filterHotelsList(HOTELS)).map(section => ({
        icon: (section.city === "Makkah" ? "kaaba" : "mosque") as AppIconKey,
        title: section.title,
        hotels: section.hotels,
      }))
    }

    return CATEGORY_SECTIONS
      .filter(section => section.key === activeCategory)
      .map(section => ({
        icon: section.icon,
        title: section.title,
        hotels: filterHotelsList(section.hotels),
      }))
      .filter(section => section.hotels.length > 0)
  }, [activeCategory, filterHotelsList])


  function HotelCard({ hotel }: { hotel: Hotel }) {
    const isFavorited = favoriteHotelIds.has(hotel.id)
    const isFeatured = FEATURED_IDS.has(hotel.id)
    const category = hotel.stars === 5 ? "5 Star" : "4 Star"
    const isLogo = hotel.imageType === "logo"
    const [imageUri, setImageUri] = useState(hotel.image)

    useEffect(() => {
      setImageUri(hotel.image)
    }, [hotel.id, hotel.image])

    const handleImageError = () => {
      if (imageUri === hotel.image && hotel.imageFallback) {
        setImageUri(hotel.imageFallback)
      } else if (imageUri !== HOTEL_IMAGE_PLACEHOLDER) {
        setImageUri(HOTEL_IMAGE_PLACEHOLDER)
      }
    }

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

    const media = isLogo ? (
      <View style={cardStyles.logoWrap}>
        <View style={cardStyles.logoBox}>
          <Image
            source={{ uri: imageUri }}
            style={cardStyles.logo}
            resizeMode="contain"
            onError={handleImageError}
          />
        </View>
        <View style={[cardStyles.badge, { backgroundColor: hotel.brandAccent }]}>
          <Text style={[cardStyles.badgeText, { color: "#fff" }]}>
            {isFeatured ? t("featured") : hotel.city}
          </Text>
        </View>
        <TouchableOpacity
          style={[cardStyles.heart, cardStyles.heartOnLight]}
          onPress={e => {
            e.stopPropagation()
            handleFavoritePress()
          }}
        >
          <Ionicons
            name={isFavorited ? "heart" : "heart-outline"}
            size={18}
            color={isFavorited ? "#C9A84C" : "#1E3A5F"}
          />
        </TouchableOpacity>
        <Text style={[cardStyles.imageLabel, cardStyles.imageLabelOnLight]}>
          {hotel.city} · {hotel.distanceLabel}
        </Text>
      </View>
    ) : (
      <ImageBackground
        source={{ uri: imageUri }}
        style={cardStyles.image}
        imageStyle={{ borderTopLeftRadius: 16, borderTopRightRadius: 16 }}
        onError={handleImageError}
      >
        <View style={[cardStyles.badge, { backgroundColor: hotel.brandAccent }]}>
          <Text style={[cardStyles.badgeText, { color: "#fff" }]}>
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
    )

    return (
      <TouchableOpacity
        style={[
          cardStyles.card,
          {
            backgroundColor: theme.card,
            borderColor: theme.border,
            borderBottomColor: hotel.brandAccent,
            borderBottomWidth: 3,
          },
        ]}
        onPress={() => router.push({ pathname: "/hotel-detail/[id]", params: { id: hotel.id } })}
        activeOpacity={0.9}
      >
        {media}
        <View style={cardStyles.info}>
          <Text style={[cardStyles.name, { color: theme.text }]} numberOfLines={2}>
            {hotel.name}
          </Text>
          <Text style={[cardStyles.meta, { color: theme.textSecondary }]} numberOfLines={1}>
            {category} · {hotel.distanceLabel}
          </Text>
          <View style={cardStyles.footer}>
            <View style={cardStyles.ratingRow}>
              <StarRating count={hotel.stars} size={12} color="#C9A84C" />
              <Text style={cardStyles.walkText}>● {hotel.walkMinutes} min walk</Text>
            </View>
            <View style={cardStyles.scoreRow}>
              <AppIcon name="star" size={12} color="#C9A84C" />
              <Text style={cardStyles.rating}>{hotel.stars}.0</Text>
            </View>
            <TouchableOpacity
              style={[
                cardStyles.btn,
                !isFeatured && cardStyles.btnExternal,
                isFeatured && { backgroundColor: hotel.brandAccent },
              ]}
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
            contentContainerStyle={{ gap: 8, paddingRight: 16 }}
          >
            {categoryFilters.map(filter => (
              <TouchableOpacity
                key={filter}
                style={[styles.pill, activeCategory === filter && styles.pillActive]}
                onPress={() => setActiveCategory(filter)}
              >
                <Text
                  style={[styles.pillText, activeCategory === filter && styles.pillTextActive]}
                >
                  {filter}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.cityPillsRow}
            contentContainerStyle={{ gap: 8, paddingRight: 16 }}
          >
            {cityFilters.map(filter => (
              <TouchableOpacity
                key={filter}
                style={[styles.cityPill, activeFilter === filter && styles.cityPillActive]}
                onPress={() => setActiveFilter(filter)}
              >
                <Text
                  style={[
                    styles.cityPillText,
                    activeFilter === filter && styles.cityPillTextActive,
                  ]}
                >
                  {filter}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View key={`${activeCategory}-${activeFilter}`}>
          {visibleSections.map(section => (
            <View key={section.title} style={styles.section}>
              <View style={styles.sectionHeader}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8, flex: 1 }}>
                  <AppIcon name={section.icon} size={20} />
                  <Text style={[styles.sectionTitle, { color: theme.text }]}>{section.title}</Text>
                </View>
                <Text style={styles.seeAll}>{section.hotels.length}</Text>
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
  logoWrap: {
    height: 160,
    backgroundColor: "#F4F6F8",
    justifyContent: "flex-end",
    padding: 10,
    position: "relative",
  },
  logoBox: {
    ...StyleSheet.absoluteFillObject,
    margin: 28,
    backgroundColor: "#fff",
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  logo: { width: "100%", height: "100%" },
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
  heartOnLight: { backgroundColor: "rgba(255,255,255,0.9)" },
  imageLabel: { color: "rgba(255,255,255,0.8)", fontSize: 11 },
  imageLabelOnLight: { color: "#1E3A5F", fontWeight: "600" },
  info: { padding: 14 },
  name: { fontSize: 15, fontWeight: "bold", marginBottom: 4 },
  meta: { fontSize: 12, marginBottom: 10 },
  footer: {
    flexDirection: "column",
    alignItems: "stretch",
    gap: 8,
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
  },
  walkText: { color: "#2D6A4F", fontSize: 13, fontWeight: "600" },
  scoreRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  price: { fontSize: 13, fontWeight: "bold" },
  rating: { color: "#C9A84C", fontSize: 12 },
  btn: {
    alignSelf: "flex-start",
    backgroundColor: "#1E3A5F",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 2,
  },
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
  pillsRow: { paddingHorizontal: 16, marginBottom: 10 },
  cityPillsRow: { paddingHorizontal: 16 },
  pill: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.12)",
  },
  pillActive: { backgroundColor: "#C9A84C" },
  pillText: { color: "rgba(255,255,255,0.7)", fontSize: 13, fontWeight: "500" },
  pillTextActive: { color: "#1E3A5F", fontWeight: "bold" },
  cityPill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
    backgroundColor: "transparent",
  },
  cityPillActive: {
    borderColor: "#C9A84C",
    backgroundColor: "rgba(201,168,76,0.18)",
  },
  cityPillText: { color: "rgba(255,255,255,0.65)", fontSize: 12, fontWeight: "500" },
  cityPillTextActive: { color: "#C9A84C", fontWeight: "700" },
  empty: { alignItems: "center", paddingVertical: 48, gap: 10 },
  emptyText: { fontSize: 14 },
})
