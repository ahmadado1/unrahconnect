// Hotels near the Haram (Makkah) and Al-Masjid an-Nabawi (Madinah).
//
// Layout:
//   • Big Makkah / Madinah switch at the top. It shines until the user switches city once.
//   • Smart search ("cheap near haram", "5 star clock tower", "hilton madinah", small typos ok).
//   • Sections, each hotel shown once: Featured → 5 Star → 4 Star → Budget Friendly.
//   • "Book now" opens Booking.com through our affiliate link, with the trip dates if saved.
import TouchableOpacity from "@/app/components/AppPressable"
import HeroBackground from "@/app/components/HeroBackground"
import KayakCompareSheet from "@/app/components/KayakCompareSheet"
import TripDetailsSheet, { TripDetailsChip, useTripDetails } from "@/app/components/TripDetailsSheet"
import { AppIcon, type AppIconKey, StarRating } from "@/components/AppIcon"
import { useTheme } from "@/context/themeContext"
import i18n from "@/i18n"
import { FEATURED_BUDGET_URLS, loadFeaturedFavorites, toggleFeaturedFavorite } from "@/lib/featuredHotels"
import {
  byDistance,
  HOTEL_CATALOG,
  HOTEL_SECTION_TITLE_KEYS,
  hotelSection,
  type CatalogHotel,
  type HotelSectionKey,
} from "@/lib/hotelCatalog"
import { HOTEL_IMAGE_PLACEHOLDER } from "@/lib/hotelImages"
import type { HotelCity } from "@/lib/hotels"
import { searchHotels } from "@/lib/hotelSearch"
import { affiliateWebViewHref } from "@/lib/openAffiliateWebView"
import { KAYAK_COMPARE_ENABLED } from "@/lib/kayak"
import { applyStayToBookingUrl } from "@/lib/stayLinks"
import { getUserFast, supabase, toggleFavorite } from "@/lib/supabase"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { Ionicons } from "@expo/vector-icons"
import { LinearGradient } from "expo-linear-gradient"
import { useFocusEffect, useRouter } from "expo-router"
import { StatusBar } from "expo-status-bar"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { Alert, Animated, Easing, Image, ScrollView, StyleSheet, Text, TextInput, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"

const NAVY = "#1E3A5F"
const GOLD = "#C9A84C"
/** Once the user has switched city, the switch stops shining (remembered on the phone). */
const CITY_SWITCH_USED_KEY = "hotels_city_switch_used_v1"

type DistanceFilter = "any" | 5 | 10 | 15

const SECTION_ORDER: HotelSectionKey[] = ["featured", "five", "four", "budget"]
const SECTION_ICONS: Record<HotelSectionKey, AppIconKey> = {
  featured: "sparkles",
  five: "star",
  four: "business",
  budget: "cash",
}

function openBooking(router: ReturnType<typeof useRouter>, url: string, hotelName: string) {
  if (!url) {
    Alert.alert(i18n.t("unableToOpen"), i18n.t("noBookingLinkFor", { name: hotelName }))
    return
  }
  router.push(affiliateWebViewHref(url, hotelName))
}

// ─── Big Makkah / Madinah switch, with a light that sweeps across until it is used ───
function CitySwitch({
  city,
  onChange,
  shine,
}: {
  city: HotelCity
  onChange: (c: HotelCity) => void
  shine: boolean
}) {
  const { t } = useTranslation()
  const sweep = useRef(new Animated.Value(0)).current
  const glow = useRef(new Animated.Value(0)).current
  const [width, setWidth] = useState(0)

  useEffect(() => {
    if (!shine) {
      sweep.stopAnimation()
      glow.stopAnimation()
      glow.setValue(0)
      return
    }
    const loop = Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(sweep, { toValue: 1, duration: 1600, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
          Animated.delay(700),
          Animated.timing(sweep, { toValue: 0, duration: 0, useNativeDriver: true }),
        ]),
        Animated.sequence([
          Animated.timing(glow, { toValue: 1, duration: 1150, useNativeDriver: true }),
          Animated.timing(glow, { toValue: 0, duration: 1150, useNativeDriver: true }),
        ]),
      ])
    )
    loop.start()
    return () => loop.stop()
  }, [shine, sweep, glow])

  const translateX = sweep.interpolate({ inputRange: [0, 1], outputRange: [-120, Math.max(width, 200) + 120] })

  return (
    <View style={styles.switchOuter}>
      {/* Soft gold glow around the switch while it shines */}
      {shine ? <Animated.View pointerEvents="none" style={[styles.switchGlow, { opacity: glow }]} /> : null}
      <View style={styles.switchWrap} onLayout={e => setWidth(e.nativeEvent.layout.width)}>
        {(["Makkah", "Madinah"] as const).map(c => {
          const on = c === city
          return (
            <TouchableOpacity
              key={c}
              style={[styles.switchBtn, on && styles.switchBtnOn]}
              onPress={() => onChange(c)}
              accessibilityRole="tab"
              accessibilityState={{ selected: on }}
            >
              <AppIcon name={c === "Makkah" ? "kaaba" : "mosque"} size={20} color={on ? NAVY : "#fff"} />
              <Text style={[styles.switchText, on && styles.switchTextOn]}>{t(c === "Makkah" ? "tp_makkah" : "tp_madinah")}</Text>
            </TouchableOpacity>
          )
        })}
        {shine ? (
          <Animated.View pointerEvents="none" style={[styles.sweep, { transform: [{ translateX }, { skewX: "-20deg" }] }]}>
            <LinearGradient
              colors={["rgba(255,255,255,0)", "rgba(255,255,255,0.55)", "rgba(255,255,255,0)"]}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={StyleSheet.absoluteFill}
            />
          </Animated.View>
        ) : null}
      </View>
    </View>
  )
}

export default function HotelsScreen() {
  const router = useRouter()
  const { theme } = useTheme()
  const { t } = useTranslation()
  const insets = useSafeAreaInsets()

  const [city, setCity] = useState<HotelCity>("Makkah")
  const [shine, setShine] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [distanceFilter, setDistanceFilter] = useState<DistanceFilter>("any")

  const [directoryFavorites, setDirectoryFavorites] = useState<Set<string>>(new Set())
  const [localFavorites, setLocalFavorites] = useState<Set<string>>(new Set())
  const { trip, open: tripOpen, setOpen: setTripOpen, close: closeTrip, onSaved: onTripSaved } = useTripDetails(true)

  // Shine the city switch until the user has used it once.
  useEffect(() => {
    AsyncStorage.getItem(CITY_SWITCH_USED_KEY)
      .then(v => setShine(v !== "1"))
      .catch(() => setShine(true))
  }, [])

  const changeCity = (c: HotelCity) => {
    setCity(c)
    if (shine) {
      setShine(false)
      AsyncStorage.setItem(CITY_SWITCH_USED_KEY, "1").catch(() => {})
    }
  }

  // Favorites: directory hotels are saved to the account, the others on the phone.
  const loadFavorites = useCallback(async () => {
    void loadFeaturedFavorites().then(setLocalFavorites)
    const {
      data: { user },
    } = await getUserFast()
    if (!user) {
      setDirectoryFavorites(new Set())
      return
    }
    const { data } = await supabase.from("favorites").select("item_id").eq("user_id", user.id).eq("item_type", "hotel")
    setDirectoryFavorites(new Set((data ?? []).map(row => String(row.item_id))))
  }, [])

  useFocusEffect(
    useCallback(() => {
      void loadFavorites()
    }, [loadFavorites])
  )

  // ─── Search ───
  const search = useMemo(() => {
    const q = searchQuery.trim()
    if (!q) return null
    return searchHotels(q, HOTEL_CATALOG)
  }, [searchQuery])

  // The search named a city ("cheap medina"): switch to it.
  useEffect(() => {
    if (search?.city && search.city !== city) changeCity(search.city)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search?.city])

  const matchesDistance = useCallback(
    (h: CatalogHotel) => distanceFilter === "any" || (!h.shuttle && h.walkMinutes <= distanceFilter),
    [distanceFilter]
  )

  /** Search results: this city first; if nothing here, the other city. */
  const results = useMemo(() => {
    if (!search) return null
    const here = search.hotels.filter(h => h.city === city && matchesDistance(h))
    if (here.length) return { hotels: here, otherCity: null as HotelCity | null }
    const other = search.hotels.filter(h => h.city !== city && matchesDistance(h))
    return { hotels: other, otherCity: other[0]?.city ?? null }
  }, [search, city, matchesDistance])

  const sections = useMemo(() => {
    const inCity = HOTEL_CATALOG.filter(h => h.city === city && matchesDistance(h))
    return SECTION_ORDER.map(key => ({
      key,
      hotels: inCity.filter(h => hotelSection(h) === key).sort(byDistance),
    })).filter(s => s.hotels.length > 0)
  }, [city, matchesDistance])

  const [compareHotel, setCompareHotel] = useState<CatalogHotel | null>(null)

  const book = (hotel: CatalogHotel) => openBooking(router, applyStayToBookingUrl(hotel.bookingUrl, trip), hotel.name)

  // ─── Hotel card ───
  function HotelCard({ hotel, wide = false }: { hotel: CatalogHotel; wide?: boolean }) {
    const [imageUri, setImageUri] = useState(hotel.image)
    const [showLogo, setShowLogo] = useState(hotel.imageType === "logo")

    useEffect(() => {
      setImageUri(hotel.image)
      setShowLogo(hotel.imageType === "logo")
    }, [hotel.id, hotel.image, hotel.imageType])

    const onImageError = () => {
      if (imageUri !== hotel.imageFallback) {
        setImageUri(hotel.imageFallback)
        setShowLogo(true)
      } else if (imageUri !== HOTEL_IMAGE_PLACEHOLDER) {
        setImageUri(HOTEL_IMAGE_PLACEHOLDER)
        setShowLogo(false)
      }
    }

    const isFav = hotel.detailId ? directoryFavorites.has(hotel.detailId) : localFavorites.has(hotel.id)
    const toggleFav = async () => {
      if (hotel.detailId) {
        const id = hotel.detailId
        const on = await toggleFavorite(id, "hotel")
        setDirectoryFavorites(prev => {
          const next = new Set(prev)
          if (on) next.add(id)
          else next.delete(id)
          return next
        })
      } else {
        setLocalFavorites(await toggleFeaturedFavorite(hotel.id))
      }
    }

    const badge = (
      <View style={[cardStyles.badge, hotel.featured ? cardStyles.badgeFeatured : null]}>
        <Text style={[cardStyles.badgeText, hotel.featured ? { color: GOLD } : null]}>
          {hotel.featured ? t("featured") : `${hotel.stars}★`}
        </Text>
      </View>
    )
    const heart = (
      <TouchableOpacity style={[cardStyles.heart, showLogo && cardStyles.heartOnLight]} onPress={() => void toggleFav()}>
        <Ionicons name={isFav ? "heart" : "heart-outline"} size={18} color={isFav ? GOLD : showLogo ? NAVY : "#fff"} />
      </TouchableOpacity>
    )

    const media = showLogo ? (
      <View style={cardStyles.logoWrap}>
        <View style={cardStyles.logoBox}>
          <Image resizeMethod="resize" source={{ uri: imageUri }} style={cardStyles.logo} resizeMode="contain" onError={onImageError} />
        </View>
        {badge}
        {heart}
      </View>
    ) : (
      <HeroBackground
        source={{ uri: imageUri }}
        style={cardStyles.image}
        imageStyle={{ borderTopLeftRadius: 16, borderTopRightRadius: 16 }}
        onError={onImageError}
      >
        {badge}
        {heart}
      </HeroBackground>
    )

    const open = () => {
      if (hotel.detailId) router.push({ pathname: "/hotel-detail/[id]", params: { id: hotel.detailId } })
      else book(hotel)
    }

    return (
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={open}
        style={[
          cardStyles.card,
          wide && cardStyles.cardWide,
          { backgroundColor: theme.card, borderColor: theme.border, borderBottomColor: GOLD, borderBottomWidth: hotel.featured ? 3 : 1 },
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
          <View style={cardStyles.row}>
            <StarRating count={hotel.stars} size={12} color={GOLD} />
            <Text style={cardStyles.walkText}>
              {hotel.shuttle ? t("hotelShuttle") : t("walkMinShort", { count: hotel.walkMinutes })}
            </Text>
          </View>
          <TouchableOpacity style={cardStyles.btn} onPress={() => book(hotel)}>
            <Text style={cardStyles.btnText}>{t("bookNow")}</Text>
          </TouchableOpacity>
          {KAYAK_COMPARE_ENABLED ? (
            <TouchableOpacity style={cardStyles.compareBtn} onPress={() => setCompareHotel(hotel)}>
              <Ionicons name="pricetags-outline" size={13} color={GOLD} />
              <Text style={cardStyles.compareText}>{t("kyCompare")}</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </TouchableOpacity>
    )
  }

  const cityName = (c: HotelCity) => t(c === "Makkah" ? "tp_makkah" : "tp_madinah")

  return (
    <View style={[styles.screen, { backgroundColor: NAVY }]}>
      <StatusBar style="light" />
      <ScrollView keyboardDismissMode="on-drag" automaticallyAdjustKeyboardInsets
        style={styles.body}
        contentContainerStyle={{ backgroundColor: theme.background, flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentInsetAdjustmentBehavior="never"
        automaticallyAdjustContentInsets={false}
      >
        {/* Header: title, trip dates, city switch, search, walking distance */}
        <View style={[styles.header, { paddingTop: insets.top }]}>
          <View style={styles.headerTop}>
            <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
              <Ionicons name="arrow-back" size={22} color="#fff" />
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>{t("hotels")}</Text>
              <Text style={styles.subtitle}>{t("ui_hotelsSub")}</Text>
              <TripDetailsChip trip={trip} onPress={() => setTripOpen(true)} />
            </View>
          </View>

          <CitySwitch city={city} onChange={changeCity} shine={shine} />

          <View style={styles.searchBar}>
            <Ionicons name="search" size={16} color="rgba(255,255,255,0.6)" />
            <TextInput
              placeholder={t("searchHotelsSmart")}
              placeholderTextColor="rgba(255,255,255,0.45)"
              style={styles.searchInput}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCorrect={false}
              returnKeyType="search"
            />
            {searchQuery ? (
              <TouchableOpacity onPress={() => setSearchQuery("")} hitSlop={10} accessibilityLabel={t("close")}>
                <Ionicons name="close-circle" size={18} color="rgba(255,255,255,0.6)" />
              </TouchableOpacity>
            ) : null}
          </View>

          <ScrollView keyboardDismissMode="on-drag" keyboardShouldPersistTaps="handled" horizontal showsHorizontalScrollIndicator={false} style={styles.pillsRow} contentContainerStyle={{ gap: 8, paddingRight: 16 }}>
            {([5, 10, 15] as const).map(minutes => (
              <TouchableOpacity
                key={minutes}
                style={[styles.pill, distanceFilter === minutes && styles.pillActive]}
                onPress={() => setDistanceFilter(cur => (cur === minutes ? "any" : minutes))}
              >
                <Text style={[styles.pillText, distanceFilter === minutes && styles.pillTextActive]}>
                  {t("filterWalkMinutes", { count: minutes })}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {results ? (
          /* ─── Search results ─── */
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleRow}>
                <Ionicons name="search" size={18} color={GOLD} />
                <Text style={[styles.sectionTitle, { color: theme.text }]}>
                  {results.otherCity ? t("hotelsFoundIn", { city: cityName(results.otherCity) }) : t("hotelsSearchResults")}
                </Text>
              </View>
              <Text style={styles.count}>{results.hotels.length}</Text>
            </View>
            {results.hotels.length ? (
              <View style={styles.grid}>
                {results.hotels.map(h => (
                  <HotelCard key={h.id} hotel={h} wide />
                ))}
              </View>
            ) : (
              <View style={styles.empty}>
                <Ionicons name="bed-outline" size={40} color={theme.textSecondary} />
                <Text style={[styles.emptyText, { color: theme.textSecondary }]}>{t("noHotelsMatchFilters")}</Text>
                <Text style={[styles.emptyHint, { color: theme.textSecondary }]}>{t("hotelsSearchHint")}</Text>
              </View>
            )}
          </View>
        ) : (
          /* ─── Featured → 5 Star → 4 Star → Budget Friendly ─── */
          <View key={city}>
            {sections.map(section => (
              <View key={section.key} style={styles.section}>
                <View style={styles.sectionHeader}>
                  <View style={styles.sectionTitleRow}>
                    <AppIcon name={SECTION_ICONS[section.key]} size={20} />
                    <Text style={[styles.sectionTitle, { color: theme.text }]}>{t(HOTEL_SECTION_TITLE_KEYS[section.key])}</Text>
                  </View>
                  <Text style={styles.count}>{section.hotels.length}</Text>
                </View>
                <ScrollView keyboardDismissMode="on-drag" keyboardShouldPersistTaps="handled" horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingHorizontal: 16 }}>
                  {section.hotels.map(h => (
                    <HotelCard key={h.id} hotel={h} />
                  ))}
                </ScrollView>
                {section.key === "budget" ? (
                  <TouchableOpacity
                    style={styles.moreLink}
                    onPress={() =>
                      openBooking(
                        router,
                        applyStayToBookingUrl(FEATURED_BUDGET_URLS[city], trip),
                        t(city === "Makkah" ? "browseMoreBudgetMakkah" : "browseMoreBudgetMadinah")
                      )
                    }
                  >
                    <Text style={[styles.moreLinkText, { color: theme.textSecondary }]}>
                      {t(city === "Makkah" ? "browseMoreBudgetMakkah" : "browseMoreBudgetMadinah")}
                    </Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            ))}
            {sections.length === 0 ? (
              <View style={styles.empty}>
                <Ionicons name="bed-outline" size={40} color={theme.textSecondary} />
                <Text style={[styles.emptyText, { color: theme.textSecondary }]}>{t("noHotelsMatchFilters")}</Text>
              </View>
            ) : null}
          </View>
        )}

        <View style={{ height: insets.bottom + 40 }} />
      </ScrollView>

      <TripDetailsSheet visible={tripOpen} initial={trip} onClose={closeTrip} onSaved={onTripSaved} />
      {KAYAK_COMPARE_ENABLED ? (
        <KayakCompareSheet
          hotel={compareHotel}
          trip={trip}
          onClose={() => setCompareHotel(null)}
          onNeedDates={() => {
            setCompareHotel(null)
            setTripOpen(true)
          }}
        />
      ) : null}
    </View>
  )
}

const cardStyles = StyleSheet.create({
  card: { width: 260, borderRadius: 16, overflow: "hidden", borderWidth: 0.5 },
  cardWide: { width: "100%" },
  image: { height: 160, justifyContent: "flex-end", padding: 10, backgroundColor: NAVY },
  logoWrap: { height: 160, backgroundColor: "#F4F6F8", justifyContent: "flex-end", padding: 10 },
  logoBox: {
    ...StyleSheet.absoluteFill,
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
    backgroundColor: "rgba(201,168,76,0.95)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  badgeFeatured: { backgroundColor: NAVY },
  badgeText: { color: NAVY, fontSize: 11, fontWeight: "bold" },
  heart: { position: "absolute", top: 10, right: 10, backgroundColor: "rgba(0,0,0,0.3)", borderRadius: 20, padding: 6 },
  heartOnLight: { backgroundColor: "rgba(255,255,255,0.9)" },
  info: { padding: 14 },
  name: { fontSize: 15, fontWeight: "bold", marginBottom: 4 },
  meta: { fontSize: 12, marginBottom: 8, lineHeight: 17 },
  row: { flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" },
  walkText: { color: "#2D6A4F", fontSize: 13, fontWeight: "600" },
  btn: { backgroundColor: GOLD, paddingVertical: 9, borderRadius: 20, marginTop: 10, alignItems: "center" },
  btnText: { color: NAVY, fontSize: 13, fontWeight: "bold" },
  compareBtn: { flexDirection: "row", gap: 5, justifyContent: "center", alignItems: "center", borderWidth: 1, borderColor: GOLD, paddingVertical: 7, borderRadius: 20, marginTop: 6 },
  compareText: { color: GOLD, fontSize: 12, fontWeight: "bold" },
})

const styles = StyleSheet.create({
  screen: { flex: 1 },
  body: { flex: 1, backgroundColor: NAVY },
  header: { backgroundColor: NAVY, paddingBottom: 16 },
  headerTop: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 20, paddingTop: 16, paddingBottom: 14 },
  title: { color: "#fff", fontSize: 26, fontWeight: "bold" },
  subtitle: { color: GOLD, fontSize: 13, marginTop: 2 },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },

  // City switch
  switchOuter: { marginHorizontal: 16, marginBottom: 14 },
  switchGlow: {
    ...StyleSheet.absoluteFill,
    margin: -4,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: GOLD,
    shadowColor: GOLD,
    shadowOpacity: 0.9,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 0 },
  },
  switchWrap: {
    flexDirection: "row",
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 18,
    padding: 5,
    gap: 5,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(201,168,76,0.5)",
  },
  switchBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 14, borderRadius: 14 },
  switchBtnOn: { backgroundColor: GOLD },
  switchText: { color: "#fff", fontSize: 17, fontWeight: "800", letterSpacing: 0.3 },
  switchTextOn: { color: NAVY },
  sweep: { position: "absolute", top: 0, bottom: 0, width: 70 },

  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.12)",
    marginHorizontal: 16,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 11,
    gap: 8,
    marginBottom: 12,
  },
  searchInput: { flex: 1, color: "#fff", fontSize: 14 },
  pillsRow: { paddingHorizontal: 16 },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
  },
  pillActive: { borderColor: GOLD, backgroundColor: "rgba(201,168,76,0.18)" },
  pillText: { color: "rgba(255,255,255,0.7)", fontSize: 12, fontWeight: "500" },
  pillTextActive: { color: GOLD, fontWeight: "700" },

  section: { marginTop: 24 },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, marginBottom: 12 },
  sectionTitleRow: { flexDirection: "row", alignItems: "center", gap: 8, flex: 1 },
  sectionTitle: { fontSize: 18, fontWeight: "800" },
  count: { color: GOLD, fontSize: 13, fontWeight: "700" },
  grid: { paddingHorizontal: 16, gap: 14 },
  moreLink: { paddingHorizontal: 16, paddingTop: 12, alignSelf: "flex-start" },
  moreLinkText: { fontSize: 13, fontWeight: "500" },
  empty: { alignItems: "center", paddingVertical: 48, paddingHorizontal: 30, gap: 10 },
  emptyText: { fontSize: 14, textAlign: "center" },
  emptyHint: { fontSize: 12, textAlign: "center", lineHeight: 18 },
})
