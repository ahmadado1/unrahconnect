import { useTheme } from "@/context/themeContext"
import { HOTELS } from "@/lib/hotels"
import { getRestaurantById, RESTAURANTS, type Restaurant } from "@/lib/restaurants"
import { Ionicons } from "@expo/vector-icons"
import { useRouter } from "expo-router"
import { StatusBar } from "expo-status-bar"
import { useCallback, useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { supabase } from "../lib/supabase"

export default function FavoritesScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { theme, isDark } = useTheme()
  const [hotels, setHotels] = useState<typeof HOTELS>([])
  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [loading, setLoading] = useState(true)
  const { t } = useTranslation()

  const loadFavorites = useCallback(async () => {
    setLoading(true)
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      setHotels([])
      setRestaurants([])
      setLoading(false)
      return
    }

    const { data, error } = await supabase
      .from("favorites")
      .select("item_id, item_type")
      .eq("user_id", user.id)

    if (data && !error) {
      const savedHotelIds = data.filter(f => f.item_type === "hotel").map(f => String(f.item_id))
      setHotels(HOTELS.filter(h => savedHotelIds.includes(h.id)))
      const savedRestaurantIds = data
        .filter(f => f.item_type === "restaurant")
        .map(f => String(f.item_id))
      setRestaurants(
        savedRestaurantIds
          .map(id => getRestaurantById(id) ?? RESTAURANTS.find(r => r.id === id))
          .filter((r): r is Restaurant => !!r)
      )
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    loadFavorites()
  }, [loadFavorites])

  return (
    <View style={[styles.screen, { backgroundColor: theme.background }]}>
      <StatusBar style={isDark ? "light" : "dark"} />

      <View style={[styles.header, { paddingTop: insets.top + 16, backgroundColor: theme.header }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t("favorites")}</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {loading && (
          <Text style={[styles.loadingText, { color: theme.textSecondary }]}>{t("loadingFavorites")}</Text>
        )}

        {!loading && hotels.length === 0 && restaurants.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>❤️</Text>
            <Text style={[styles.emptyTitle, { color: theme.text }]}>{t("noFavorites")}</Text>
            <Text style={[styles.emptySub, { color: theme.textSecondary }]}>{t("noFavoritesSub")}</Text>
          </View>
        )}

        {hotels.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>{t("hotels")}</Text>
            {hotels.map(hotel => (
              <TouchableOpacity
                key={hotel.id}
                style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}
                onPress={() => router.push({ pathname: "/hotel-detail/[id]", params: { id: hotel.id } })}
              >
                <Image source={{ uri: hotel.image }} style={styles.cardImage} resizeMode="cover" />
                <View style={styles.cardInfo}>
                  <Text style={[styles.cardName, { color: theme.text }]}>{hotel.name}</Text>
                  <Text style={[styles.cardMeta, { color: theme.textSecondary }]}>
                    {hotel.city} · {hotel.distanceLabel}
                  </Text>
                  <Text style={[styles.cardPrice, { color: theme.gold }]}>
                    {"★".repeat(hotel.stars)}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={theme.gold} />
              </TouchableOpacity>
            ))}
          </View>
        )}

        {restaurants.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>{t("restaurants")}</Text>
            {restaurants.map(restaurant => (
              <TouchableOpacity
                key={restaurant.id}
                style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}
                onPress={() => router.push({ pathname: "/restaurant-detail/[id]", params: { id: String(restaurant.id) } })}
              >
                <View
                  style={[
                    styles.cardImage,
                    restaurant.imageType === "logo" && styles.logoThumb,
                  ]}
                >
                  <Image
                    source={{ uri: restaurant.image }}
                    style={
                      restaurant.imageType === "logo"
                        ? styles.logoThumbImage
                        : styles.cardImageFill
                    }
                    resizeMode={restaurant.imageType === "logo" ? "contain" : "cover"}
                  />
                </View>
                <View style={styles.cardInfo}>
                  <Text style={[styles.cardName, { color: theme.text }]}>{restaurant.name}</Text>
                  <Text style={[styles.cardMeta, { color: theme.textSecondary }]}>{restaurant.city} · {restaurant.distance}</Text>
                  <Text style={[styles.cardPrice, { color: theme.gold }]}>{restaurant.cuisine} · ★ {restaurant.rating}</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={theme.gold} />
              </TouchableOpacity>
            ))}
          </View>
        )}

        <View style={{ height: 60 }} />
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: { padding: 20, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  backBtn: { backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 20, padding: 8 },
  headerTitle: { color: "#fff", fontSize: 18, fontWeight: "bold" },
  loadingText: { textAlign: "center", marginTop: 40 },
  emptyState: { alignItems: "center", paddingTop: 80, paddingHorizontal: 40 },
  emptyIcon: { fontSize: 60, marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontWeight: "bold", marginBottom: 8 },
  emptySub: { fontSize: 14, textAlign: "center", lineHeight: 22 },
  section: { marginTop: 24, paddingHorizontal: 16 },
  sectionTitle: { fontSize: 17, fontWeight: "bold", marginBottom: 12 },
  card: { borderRadius: 14, padding: 12, flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 10, borderWidth: 0.5 },
  cardImage: { width: 60, height: 60, borderRadius: 10, overflow: "hidden" },
  cardImageFill: { width: "100%", height: "100%" },
  logoThumb: {
    backgroundColor: "#fff",
    padding: 8,
    borderWidth: 0.5,
    borderColor: "rgba(0,0,0,0.08)",
  },
  logoThumbImage: { width: "100%", height: "100%" },
  cardInfo: { flex: 1 },
  cardName: { fontSize: 14, fontWeight: "bold" },
  cardMeta: { fontSize: 12, marginTop: 2 },
  cardPrice: { fontSize: 12, marginTop: 4 },
})
