import { AppIcon, AppIconKey } from "@/components/AppIcon"
import { useTheme } from "@/context/themeContext"
import {
  arabicGrills,
  cafesAndDesserts,
  internationalChains,
  nearHaramRestaurants,
  nearNabawiRestaurants,
  recommendedRestaurants,
  saudiChains,
  type Restaurant,
} from "@/lib/restaurants"
import { IMAGE_PLACEHOLDER } from "@/lib/restaurantImages"
import { supabase, toggleFavorite } from "@/lib/supabase"
import { Ionicons } from "@expo/vector-icons"
import { useFocusEffect } from "@react-navigation/native"
import { useRouter } from "expo-router"
import { StatusBar } from "expo-status-bar"
import { useCallback, useEffect, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import {
  Image,
  ImageBackground,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"

type CityFilter = "All" | "Makkah" | "Madinah"

export default function RestaurantsScreen() {
  const router = useRouter()
  const [activeFilter, setActiveFilter] = useState<CityFilter>("All")
  const [favoriteRestaurantIds, setFavoriteRestaurantIds] = useState<Set<string>>(new Set())
  const filters: CityFilter[] = ["All", "Makkah", "Madinah"]
  const [searchQuery, setSearchQuery] = useState("")
  const { theme } = useTheme()
  const { t } = useTranslation()
  const insets = useSafeAreaInsets()

  const loadFavoriteRestaurants = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      setFavoriteRestaurantIds(new Set())
      return
    }
    const { data, error } = await supabase
      .from("favorites")
      .select("item_id")
      .eq("user_id", user.id)
      .eq("item_type", "restaurant")
    if (error) {
      console.error("loadFavoriteRestaurants error:", error.message)
      return
    }
    setFavoriteRestaurantIds(new Set((data ?? []).map(row => String(row.item_id))))
  }

  useFocusEffect(
    useCallback(() => {
      loadFavoriteRestaurants()
    }, [])
  )

  const filterRestaurants = useCallback(
    (restaurants: Restaurant[]) =>
      restaurants.filter(r => {
        const matchesCity = activeFilter === "All" || r.city === activeFilter
        const matchesSearch = r.name.toLowerCase().includes(searchQuery.toLowerCase())
        return matchesCity && matchesSearch
      }),
    [activeFilter, searchQuery]
  )

  const visibleSections = useMemo(
    () =>
      (
        [
          { icon: "sparkles" as AppIconKey, title: t("recommended"), restaurants: recommendedRestaurants },
          { icon: "kaaba" as AppIconKey, title: t("nearHaram"), restaurants: nearHaramRestaurants },
          { icon: "mosque" as AppIconKey, title: "Near Nabawi", restaurants: nearNabawiRestaurants },
          { icon: "meat" as AppIconKey, title: t("arabicGrills"), restaurants: arabicGrills },
          { icon: "award" as AppIconKey, title: "Saudi Favourites", restaurants: saudiChains },
          { icon: "globe" as AppIconKey, title: t("international"), restaurants: internationalChains },
          { icon: "coffee" as AppIconKey, title: "Cafes & Hotel Dining", restaurants: cafesAndDesserts },
        ] as const
      )
        .map(section => ({
          icon: section.icon,
          title: section.title,
          restaurants: filterRestaurants(section.restaurants),
        }))
        .filter(section => section.restaurants.length > 0),
    [filterRestaurants, t]
  )

  function RestaurantCard({ restaurant }: { restaurant: Restaurant }) {
    const isFavorited = favoriteRestaurantIds.has(restaurant.id)
    const isHero = !!restaurant.featured
    const isLogo = restaurant.imageType === "logo"
    const [imageUri, setImageUri] = useState(restaurant.image)

    useEffect(() => {
      setImageUri(restaurant.image)
    }, [restaurant.id, restaurant.image])

    const handleImageError = () => {
      if (imageUri === restaurant.image && restaurant.imageFallback) {
        setImageUri(restaurant.imageFallback)
      } else if (imageUri !== IMAGE_PLACEHOLDER) {
        setImageUri(IMAGE_PLACEHOLDER)
      }
    }

    const handleFavoritePress = async () => {
      const newState = await toggleFavorite(restaurant.id, "restaurant")
      setFavoriteRestaurantIds(prev => {
        const next = new Set(prev)
        if (newState) next.add(restaurant.id)
        else next.delete(restaurant.id)
        return next
      })
    }

    return (
      <TouchableOpacity
        style={[cardStyles.card, { backgroundColor: theme.card, borderColor: theme.border }]}
        onPress={() => router.push(`/restaurant-detail/${restaurant.id}`)}
        activeOpacity={0.9}
      >
        {isLogo ? (
          <View style={cardStyles.logoWrap}>
            <View style={cardStyles.logoBox}>
              <Image
                source={{ uri: imageUri }}
                style={cardStyles.logo}
                resizeMode="contain"
                onError={handleImageError}
              />
            </View>
            <View style={[cardStyles.badge, isHero && cardStyles.heroBadge]}>
              <Text style={cardStyles.badgeText}>
                {isHero ? "Al Baik · Iconic" : restaurant.halal ? "Halal" : t("external")}
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
              {restaurant.city} · {restaurant.distance}
            </Text>
          </View>
        ) : (
          <ImageBackground
            source={{ uri: imageUri }}
            style={cardStyles.image}
            imageStyle={{ borderTopLeftRadius: 16, borderTopRightRadius: 16 }}
            onError={handleImageError}
          >
            <View style={[cardStyles.badge, isHero && cardStyles.heroBadge]}>
              <Text style={cardStyles.badgeText}>
                {isHero ? "Al Baik · Iconic" : restaurant.halal ? "Halal" : t("external")}
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
              {restaurant.city} · {restaurant.distance}
            </Text>
          </ImageBackground>
        )}
        <View style={cardStyles.info}>
          <Text style={[cardStyles.name, { color: theme.text }]} numberOfLines={1}>
            {restaurant.name}
          </Text>
          <Text style={[cardStyles.meta, { color: theme.textSecondary }]} numberOfLines={1}>
            {restaurant.cuisine} · {restaurant.distance}
          </Text>
          <View style={cardStyles.footer}>
            <View>
              <Text style={[cardStyles.price, { color: theme.text }]}>
                {restaurant.priceRange} ·{" "}
                <Text style={{ color: restaurant.isOpen ? "#2D6A4F" : "#E24B4A" }}>
                  ● {restaurant.isOpen ? t("open") : t("closed")}
                </Text>
              </Text>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 }}>
                <AppIcon name="star" size={12} color="#C9A84C" />
                <Text style={cardStyles.rating}>{restaurant.rating} · Halal</Text>
              </View>
            </View>
            <TouchableOpacity
              style={[cardStyles.btn, !isHero && cardStyles.btnExternal]}
              onPress={() => router.push(`/restaurant-detail/${restaurant.id}`)}
            >
              <Text style={[cardStyles.btnText, !isHero && cardStyles.btnTextExternal]}>
                {t("directions")}
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
              <Text style={styles.title}>{t("restaurantsTitle")}</Text>
              <Text style={styles.subtitle}>{t("discoverFood")}</Text>
            </View>
          </View>

          <View style={styles.searchBar}>
            <Ionicons name="search" size={16} color="rgba(255,255,255,0.5)" />
            <TextInput
              placeholder={t("searchRestaurants")}
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
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8, flex: 1 }}>
                  <AppIcon name={section.icon} size={20} />
                  <Text style={[styles.sectionTitle, { color: theme.text }]}>{section.title}</Text>
                </View>
                <Text style={styles.seeAll}>{section.restaurants.length}</Text>
              </View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 12, paddingHorizontal: 16 }}
              >
                {section.restaurants.map(restaurant => (
                  <RestaurantCard
                    key={`${section.title}-${restaurant.id}`}
                    restaurant={restaurant}
                  />
                ))}
              </ScrollView>
            </View>
          ))}
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
    backgroundColor: "#F5F5F5",
    justifyContent: "flex-end",
    padding: 10,
    position: "relative",
  },
  logoBox: {
    ...StyleSheet.absoluteFillObject,
    margin: 20,
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 12,
    alignItems: "center",
    justifyContent: "center",
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
  heroBadge: { backgroundColor: "#C9A84C" },
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
  footer: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  price: { fontSize: 13, fontWeight: "bold" },
  rating: { color: "#C9A84C", fontSize: 12, marginTop: 2 },
  btn: { backgroundColor: "#1E3A5F", paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  btnExternal: { backgroundColor: "#C9A84C" },
  btnText: { color: "#fff", fontSize: 12, fontWeight: "bold" },
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
})
