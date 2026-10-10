import TouchableOpacity from "@/app/components/AppPressable"
import HeroBackground from "@/app/components/HeroBackground"
import TripDetailsSheet, { TripDetailsChip, useTripDetails } from "@/app/components/TripDetailsSheet"
import { AppIcon, AppIconKey, StarRating } from "@/components/AppIcon"
import { useTheme } from "@/context/themeContext"
import i18n from "@/i18n"
import {
  getFeaturedHotelsForCity,
  loadFeaturedFavorites,
  toggleFeaturedFavorite,
  type FeaturedHotel,
  type HotelPartner,
} from "@/lib/featuredHotels"
import { HOTEL_IMAGE_PLACEHOLDER } from "@/lib/hotelImages"
import { groupHotelsIntoSections, HOTELS, type Hotel } from "@/lib/hotels"
import { affiliateWebViewHref, openExternalUrl } from "@/lib/openAffiliateWebView"
import { applyStayToBookingUrl } from "@/lib/stayLinks"
import { supabase, toggleFavorite } from "@/lib/supabase"
import { Ionicons } from "@expo/vector-icons"
import { useFocusEffect } from "@react-navigation/native"
import { useRouter } from "expo-router"
import { StatusBar } from "expo-status-bar"
import { useCallback, useEffect, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import {
  Alert,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
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
type BudgetFilter = "all" | "budget" | "premium"
type DistanceFilter = "any" | 5 | 10 | 15

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

const CATEGORY_FILTERS: CategoryFilter[] = [
  "All",
  "Recommended",
  "Budget Friendly",
  "Near Haram",
  "Near Nabawi",
  "Abraj Al Bait Mall",
  "Family",
]
const CITY_FILTERS: CityFilter[] = ["All", "Makkah", "Madinah"]

function openWebsite(
  router: ReturnType<typeof useRouter>,
  url: string,
  title?: string,
) {
  if (!url) {
    Alert.alert(i18n.t("unableToOpen"), i18n.t("noWebsiteForHotel"))
    return
  }
  openExternalUrl(router, url, title)
}

function openBookingInWebView(
  router: ReturnType<typeof useRouter>,
  url: string,
  hotelName: string,
) {
  if (!url) {
    Alert.alert(i18n.t("unableToOpen"), i18n.t("noBookingLinkFor", { name: hotelName }))
    return
  }
  router.push(affiliateWebViewHref(url, hotelName))
}

export default function HotelsScreen() {
  const router = useRouter()
  const { theme } = useTheme()
  const { t } = useTranslation()
  const insets = useSafeAreaInsets()

  // ─── Filters ───
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>("All")
  const [activeFilter, setActiveFilter] = useState<CityFilter>("All")
  const [searchQuery, setSearchQuery] = useState("")
  const [budgetFilter, setBudgetFilter] = useState<BudgetFilter>("all")
  const [distanceFilter, setDistanceFilter] = useState<DistanceFilter>("any")
  const [sortClosest, setSortClosest] = useState(true)

  // ─── Favorites, partner picker, trip dates ───
  const [favoriteHotelIds, setFavoriteHotelIds] = useState<Set<string>>(new Set())
  const [featuredFavoriteIds, setFeaturedFavoriteIds] = useState<Set<string>>(new Set())
  const [partnerHotel, setPartnerHotel] = useState<FeaturedHotel | null>(null)
  const { trip, open: tripOpen, setOpen: setTripOpen, close: closeTrip, onSaved: onTripSaved } = useTripDetails(true)

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
      void loadFeaturedFavorites().then(setFeaturedFavoriteIds)
    }, [])
  )

  // ─── Filtering ───
  const filterHotelsList = useCallback(
    (hotels: Hotel[]) => {
      const filtered = hotels.filter(h => {
        const matchesCity = activeFilter === "All" || h.city === activeFilter
        const matchesSearch = h.name.toLowerCase().includes(searchQuery.toLowerCase())
        const matchesBudget =
          budgetFilter === "all" ||
          (budgetFilter === "budget" && BUDGET_FRIENDLY_IDS.has(h.id)) ||
          (budgetFilter === "premium" && !BUDGET_FRIENDLY_IDS.has(h.id))
        const matchesDistance = distanceFilter === "any" || h.walkMinutes <= distanceFilter
        return matchesCity && matchesSearch && matchesBudget && matchesDistance
      })
      if (!sortClosest) return filtered
      return [...filtered].sort((a, b) => a.walkMinutes - b.walkMinutes)
    },
    [activeFilter, searchQuery, budgetFilter, distanceFilter, sortClosest]
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

  const featuredSections = useMemo(() => {
    // Show featured booking cards on All / city views (not when a category pill is active)
    if (activeCategory !== "All") return []
    const q = searchQuery.trim().toLowerCase()
    return getFeaturedHotelsForCity(activeFilter)
      .map(section => {
        let hotels = section.hotels.filter(h => {
          const matchesQuery =
            !q || h.name.toLowerCase().includes(q) || h.description.toLowerCase().includes(q)
          const matchesDistance = distanceFilter === "any" || h.walkMinutes <= distanceFilter
          const matchesBudget = budgetFilter !== "budget"
          return matchesQuery && matchesDistance && matchesBudget
        })
        if (sortClosest) hotels = [...hotels].sort((a, b) => a.walkMinutes - b.walkMinutes)
        return { ...section, hotels }
      })
      .filter(section => section.hotels.length > 0 || budgetFilter === "budget")
  }, [activeCategory, activeFilter, searchQuery, budgetFilter, distanceFilter, sortClosest])

  // ─── Booking ───
  const bookFeatured = (hotel: FeaturedHotel, partner?: HotelPartner) => {
    const partners = hotel.partners
    if (!partner && partners.length > 1) {
      setPartnerHotel(hotel)
      return
    }
    const chosen = partner ?? partners[0]
    if (!chosen) return
    openBookingInWebView(router, applyStayToBookingUrl(chosen.url, trip), hotel.name)
  }

  // ─── Featured (partner) hotel card ───
  function FeaturedHotelCard({ hotel }: { hotel: FeaturedHotel }) {
    const [imageUri, setImageUri] = useState(hotel.image)
    const [showLogo, setShowLogo] = useState(hotel.imageType === "logo")

    useEffect(() => {
      setImageUri(hotel.image)
      setShowLogo(hotel.imageType === "logo")
    }, [hotel.id, hotel.image, hotel.imageType])

    const handleImageError = () => {
      if (imageUri !== hotel.imageFallback) {
        setImageUri(hotel.imageFallback)
        setShowLogo(true)
      }
    }

    const isFavorited = featuredFavoriteIds.has(hotel.id)
    const heart = (
      <TouchableOpacity
        style={[cardStyles.heart, showLogo ? cardStyles.heartOnLight : null]}
        onPress={() => {
          void toggleFeaturedFavorite(hotel.id).then(setFeaturedFavoriteIds)
        }}
      >
        <Ionicons
          name={isFavorited ? "heart" : "heart-outline"}
          size={18}
          color={isFavorited ? "#C9A84C" : showLogo ? "#1E3A5F" : "#fff"}
        />
      </TouchableOpacity>
    )

    const badge = (
      <View style={[cardStyles.badge, { backgroundColor: "#1E3A5F" }]}>
        <Text style={[cardStyles.badgeText, { color: "#C9A84C" }]}>{t("featured")}</Text>
      </View>
    )

    const media = showLogo ? (
      <View style={cardStyles.logoWrap}>
        <View style={cardStyles.logoBox}>
          <Image
            source={{ uri: imageUri }}
            style={cardStyles.logo}
            resizeMode="contain"
            onError={handleImageError}
          />
        </View>
        {badge}
        {heart}
        <Text style={[cardStyles.imageLabel, cardStyles.imageLabelOnLight]}>{hotel.city}</Text>
      </View>
    ) : (
      <HeroBackground
        source={{ uri: imageUri }}
        style={cardStyles.image}
        imageStyle={{ borderTopLeftRadius: 16, borderTopRightRadius: 16 }}
        onError={handleImageError}
      >
        {badge}
        {heart}
        <Text style={cardStyles.imageLabel}>{hotel.city}</Text>
      </HeroBackground>
    )

    return (
      <View
        style={[
          cardStyles.card,
          {
            backgroundColor: theme.card,
            borderColor: theme.border,
            borderBottomColor: "#C9A84C",
            borderBottomWidth: 3,
          },
        ]}
      >
        {media}
        <View style={cardStyles.info}>
          <Text style={[cardStyles.name, { color: theme.text }]} numberOfLines={2}>
            {hotel.name}
          </Text>
          <Text style={[cardStyles.meta, { color: theme.textSecondary }]} numberOfLines={2}>
            {hotel.description}
          </Text>
          <Text style={cardStyles.walkText}>● {t("walkMinShort", { count: hotel.walkMinutes })}</Text>
          <TouchableOpacity
            style={[cardStyles.btn, { backgroundColor: "#C9A84C", alignSelf: "stretch" }]}
            onPress={() => bookFeatured(hotel)}
          >
            <Text style={[cardStyles.btnText, { color: "#1E3A5F", textAlign: "center" }]}>{t("bookNow")}</Text>
          </TouchableOpacity>
        </View>
      </View>
    )
  }

  // ─── Regular hotel card ───
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
      openWebsite(router, hotel.website, hotel.name)
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
      <HeroBackground
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
      </HeroBackground>
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

  // ─── Screen ───
  return (
    <View style={[styles.screen, { backgroundColor: "#1E3A5F" }]}>
      <StatusBar style="light" />

      <ScrollView
        style={[styles.body, { backgroundColor: "#1E3A5F" }]}
        contentContainerStyle={{ backgroundColor: theme.background, flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
        contentInsetAdjustmentBehavior="never"
        automaticallyAdjustContentInsets={false}
      >
        {/* Header: title, trip dates, search and filters */}
        <View style={[styles.header, { paddingTop: insets.top }]}>
          <View style={styles.headerTop}>
            <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
              <Ionicons name="arrow-back" size={22} color="#fff" />
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>{t("hotels")}</Text>
              <Text style={styles.subtitle}>Well-known hotels near the Holy Mosques</Text>
              <TripDetailsChip trip={trip} onPress={() => setTripOpen(true)} />
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

          {/* Category pills */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.pillsRow}
            contentContainerStyle={{ gap: 8, paddingRight: 16 }}
          >
            {CATEGORY_FILTERS.map(filter => (
              <TouchableOpacity
                key={filter}
                style={[styles.pill, activeCategory === filter && styles.pillActive]}
                onPress={() => setActiveCategory(filter)}
              >
                <Text style={[styles.pillText, activeCategory === filter && styles.pillTextActive]}>
                  {filter}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* City pills */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.cityPillsRow}
            contentContainerStyle={{ gap: 8, paddingRight: 16 }}
          >
            {CITY_FILTERS.map(filter => (
              <TouchableOpacity
                key={filter}
                style={[styles.cityPill, activeFilter === filter && styles.cityPillActive]}
                onPress={() => setActiveFilter(filter)}
              >
                <Text style={[styles.cityPillText, activeFilter === filter && styles.cityPillTextActive]}>
                  {filter}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Budget, walking distance and sort */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={[styles.cityPillsRow, { marginTop: 10 }]}
            contentContainerStyle={{ gap: 8, paddingRight: 16 }}
          >
            {([
              ["budget", t("filterBudget")],
              ["premium", t("filterPremium")],
            ] as const).map(([key, label]) => (
              <TouchableOpacity
                key={key}
                style={[styles.cityPill, budgetFilter === key && styles.cityPillActive]}
                onPress={() => setBudgetFilter(current => (current === key ? "all" : key))}
              >
                <Text style={[styles.cityPillText, budgetFilter === key && styles.cityPillTextActive]}>
                  {label}
                </Text>
              </TouchableOpacity>
            ))}
            {([5, 10, 15] as const).map(minutes => (
              <TouchableOpacity
                key={minutes}
                style={[styles.cityPill, distanceFilter === minutes && styles.cityPillActive]}
                onPress={() => setDistanceFilter(current => (current === minutes ? "any" : minutes))}
              >
                <Text style={[styles.cityPillText, distanceFilter === minutes && styles.cityPillTextActive]}>
                  {t("filterWalkMinutes", { count: minutes })}
                </Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={[styles.cityPill, sortClosest && styles.cityPillActive]}
              onPress={() => setSortClosest(current => !current)}
            >
              <Text style={[styles.cityPillText, sortClosest && styles.cityPillTextActive]}>
                {t("sortClosest")}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* Hotel lists */}
        <View key={`${activeCategory}-${activeFilter}`}>
          {featuredSections.map(section => (
            <View key={section.titleKey} style={styles.section}>
              {section.hotels.length > 0 ? (
                <>
                  <View style={styles.sectionHeader}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 8, flex: 1 }}>
                      <AppIcon name={section.city === "Madinah" ? "mosque" : "kaaba"} size={20} />
                      <Text style={[styles.sectionTitle, { color: theme.text }]}>
                        {t(section.titleKey)}
                      </Text>
                    </View>
                    <Text style={styles.seeAll}>{section.hotels.length}</Text>
                  </View>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ gap: 12, paddingHorizontal: 16 }}
                  >
                    {section.hotels.map(hotel => (
                      <FeaturedHotelCard key={hotel.id} hotel={hotel} />
                    ))}
                  </ScrollView>
                </>
              ) : null}
              <TouchableOpacity
                style={styles.budgetLink}
                onPress={() =>
                  openBookingInWebView(
                    router,
                    applyStayToBookingUrl(section.budgetUrl, trip),
                    t(section.budgetLinkKey),
                  )
                }
              >
                <Text style={[styles.budgetLinkText, { color: theme.textSecondary }]}>
                  {t(section.budgetLinkKey)}
                </Text>
                <Ionicons name="arrow-forward" size={14} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>
          ))}

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

          {visibleSections.length === 0 && featuredSections.length === 0 && (
            <View style={styles.empty}>
              <Ionicons name="bed-outline" size={40} color={theme.textSecondary} />
              <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                {t("noHotelsMatchFilters")}
              </Text>
            </View>
          )}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Trip dates sheet */}
      <TripDetailsSheet
        visible={tripOpen}
        initial={trip}
        onClose={closeTrip}
        onSaved={onTripSaved}
      />

      {/* "Where do you want to book?" when a hotel has several partners */}
      <Modal
        visible={partnerHotel != null}
        transparent
        animationType="fade"
        onRequestClose={() => setPartnerHotel(null)}
      >
        <View style={styles.partnerRoot}>
          <TouchableOpacity style={styles.partnerBackdrop} onPress={() => setPartnerHotel(null)} />
          <View style={[styles.partnerSheet, { backgroundColor: theme.card }]}>
            <Text style={[styles.partnerTitle, { color: theme.text }]}>{t("chooseWhereToBook")}</Text>
            {partnerHotel?.partners.map(partner => (
              <TouchableOpacity
                key={partner.url}
                style={styles.partnerBtn}
                onPress={() => {
                  const hotel = partnerHotel
                  setPartnerHotel(null)
                  if (hotel) bookFeatured(hotel, partner)
                }}
              >
                <Text style={styles.partnerBtnText}>{t("bookWithPartner", { name: partner.name })}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity onPress={() => setPartnerHotel(null)}>
              <Text style={[styles.partnerCancel, { color: theme.textSecondary }]}>{t("cancel")}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  )
}

const cardStyles = StyleSheet.create({
  card: { width: 260, borderRadius: 16, overflow: "hidden", borderWidth: 0.5 },
  image: { height: 160, justifyContent: "flex-end", padding: 10, position: "relative", backgroundColor: "#1E3A5F" },
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
    marginTop: 8,
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
  budgetLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 2,
    alignSelf: "flex-start",
  },
  budgetLinkText: { fontSize: 13, fontWeight: "500" },
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

  // Partner picker
  partnerRoot: { flex: 1, justifyContent: "flex-end" },
  partnerBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.45)" },
  partnerSheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 36,
    gap: 10,
  },
  partnerTitle: { fontSize: 17, fontWeight: "bold", marginBottom: 6 },
  partnerBtn: {
    backgroundColor: "#1E3A5F",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  partnerBtnText: { color: "#C9A84C", fontSize: 15, fontWeight: "bold" },
  partnerCancel: { textAlign: "center", fontSize: 14, paddingVertical: 10 },
})