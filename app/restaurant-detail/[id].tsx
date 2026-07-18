import { useTheme } from "@/context/themeContext"
import { getRestaurantById, openRestaurantDirections } from "@/lib/restaurants"
import { isFavorite, toggleFavorite } from "@/lib/supabase"
import { Ionicons } from "@expo/vector-icons"
import { useLocalSearchParams, useRouter } from "expo-router"
import { StatusBar } from "expo-status-bar"
import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import {
  ImageBackground,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native"
import * as WebBrowser from "expo-web-browser"

export default function RestaurantDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const { theme } = useTheme()
  const restaurant = getRestaurantById(id)
  const [favorited, setFavorited] = useState(false)
  const { t } = useTranslation()

  useEffect(() => {
    if (!restaurant) return
    const checkFav = async () => {
      const result = await isFavorite(restaurant.id, "restaurant")
      setFavorited(result)
    }
    checkFav()
  }, [restaurant])

  const handleFavorite = async () => {
    if (!restaurant) return
    const newState = await toggleFavorite(restaurant.id, "restaurant")
    setFavorited(newState ?? false)
  }

  if (!restaurant) {
    return (
      <View style={[styles.notFound, { backgroundColor: theme.background }]}>
        <Text style={[styles.notFoundText, { color: theme.text }]}>Restaurant not found</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backLink}>Go back</Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <View style={[styles.screen, { backgroundColor: theme.background }]}>
      <StatusBar style="light" />
      <ScrollView showsVerticalScrollIndicator={false}>
        <ImageBackground source={{ uri: restaurant.image }} style={styles.hero}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={22} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.heartBtn} onPress={handleFavorite}>
            <Ionicons
              name={favorited ? "heart" : "heart-outline"}
              size={22}
              color={favorited ? "#C9A84C" : "#fff"}
            />
          </TouchableOpacity>
          <View style={styles.heroBadge}>
            <Text style={styles.heroBadgeText}>
              {restaurant.featured ? "Al Baik · Iconic" : "Halal Certified"}
            </Text>
          </View>
        </ImageBackground>

        <View style={styles.content}>
          <Text style={[styles.name, { color: theme.text }]}>{restaurant.name}</Text>
          <Text style={[styles.meta, { color: theme.textSecondary }]}>
            {restaurant.city} · {restaurant.distance} · {restaurant.cuisine}
          </Text>
          <Text style={styles.rating}>
            ★ {restaurant.rating} · {restaurant.priceRange} ·{" "}
            {restaurant.isOpen ? t("open") : t("closed")} · Halal
          </Text>

          <View style={[styles.divider, { backgroundColor: theme.border }]} />

          <Text style={[styles.sectionTitle, { color: theme.text }]}>About</Text>
          <Text style={[styles.description, { color: theme.textSecondary }]}>
            {restaurant.description}
          </Text>

          <View style={[styles.divider, { backgroundColor: theme.border }]} />

          <Text style={[styles.sectionTitle, { color: theme.text }]}>{t("highlights")}</Text>
          <View style={styles.features}>
            {restaurant.features.map(feature => (
              <View key={feature} style={styles.featureRow}>
                <Ionicons name="checkmark-circle" size={16} color="#C9A84C" />
                <Text style={[styles.featureText, { color: theme.textSecondary }]}>{feature}</Text>
              </View>
            ))}
          </View>

          <View style={[styles.divider, { backgroundColor: theme.border }]} />

          <Text style={[styles.sectionTitle, { color: theme.text }]}>{t("location")}</Text>
          <View
            style={[styles.locationBox, { backgroundColor: theme.card, borderColor: theme.border }]}
          >
            <Ionicons name="location" size={18} color="#C9A84C" />
            <Text style={[styles.locationText, { color: theme.textSecondary }]}>
              {restaurant.address}
            </Text>
          </View>

          <TouchableOpacity
            style={styles.directionsBtn}
            onPress={() => Linking.openURL(openRestaurantDirections(restaurant))}
          >
            <Ionicons name="navigate" size={18} color="#fff" />
            <Text style={styles.directionsBtnText}>{t("getDirections")}</Text>
          </TouchableOpacity>

          {restaurant.website ? (
            <TouchableOpacity
              style={styles.websiteBtn}
              onPress={() => WebBrowser.openBrowserAsync(restaurant.website)}
            >
              <Ionicons name="globe-outline" size={18} color="#1E3A5F" />
              <Text style={styles.websiteBtnText}>Visit Website / App</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  notFound: { flex: 1, alignItems: "center", justifyContent: "center" },
  notFoundText: { fontSize: 18 },
  backLink: { color: "#C9A84C", marginTop: 10 },
  hero: { height: 260, justifyContent: "flex-end", padding: 16 },
  backBtn: {
    position: "absolute",
    top: 55,
    left: 16,
    backgroundColor: "rgba(0,0,0,0.3)",
    borderRadius: 20,
    padding: 8,
  },
  heartBtn: {
    position: "absolute",
    top: 55,
    right: 16,
    backgroundColor: "rgba(0,0,0,0.3)",
    borderRadius: 20,
    padding: 8,
  },
  heroBadge: {
    backgroundColor: "rgba(201,168,76,0.95)",
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
  },
  heroBadgeText: { color: "#1E3A5F", fontSize: 12, fontWeight: "bold" },
  content: { padding: 20 },
  name: { fontSize: 24, fontWeight: "700" },
  meta: { marginTop: 6 },
  rating: { color: "#C9A84C", marginTop: 8, fontWeight: "600" },
  divider: { height: 1, marginVertical: 20 },
  sectionTitle: { fontSize: 17, fontWeight: "700", marginBottom: 10 },
  description: { fontSize: 14, lineHeight: 22 },
  features: { gap: 10 },
  featureRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  featureText: { fontSize: 14 },
  locationBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 14,
    borderRadius: 12,
    borderWidth: 0.5,
  },
  locationText: { fontSize: 14, flex: 1 },
  directionsBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#2C5F8A",
    borderRadius: 12,
    padding: 14,
    marginTop: 12,
  },
  directionsBtnText: { color: "#fff", fontSize: 15, fontWeight: "bold" },
  websiteBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#C9A84C",
    borderRadius: 12,
    padding: 14,
    marginTop: 10,
  },
  websiteBtnText: { color: "#1E3A5F", fontSize: 15, fontWeight: "bold" },
})
