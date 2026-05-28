import { useTheme } from "@/context/themeContext";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { ImageBackground, Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { isFavorite, toggleFavorite } from "../../lib/supabase";

const allRestaurants = [
  { id: "r1", name: "Al Baik", distance: "300m from Haram", cuisine: "Fast Food", priceRange: "$", rating: 4.8, isOpen: true, type: "ours", city: "Makkah", image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600", description: "A famous and reliable option for quick halal meals near Haram.", features: ["Fast service", "Family seating", "Takeaway"] },
  { id: "r2", name: "Zamzam Restaurant", distance: "150m from Haram", cuisine: "Arabic", priceRange: "$$", rating: 4.7, isOpen: true, type: "ours", city: "Makkah", image: "https://images.unsplash.com/photo-1559339352-11d035aa65de?w=600", description: "Traditional Arabic dishes with a clean and welcoming atmosphere.", features: ["Arabic platters", "Prayer break friendly", "Family sections"] },
  { id: "r3", name: "Layali Al Sham", distance: "500m from Nabawi", cuisine: "Syrian", priceRange: "$$", rating: 4.6, isOpen: false, type: "external", city: "Madinah", image: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600", description: "Authentic Levantine meals with grilled specialties.", features: ["Grills", "Mixed platters", "Desserts"] },
  { id: "r4", name: "Makkah Grill House", distance: "100m from Haram", cuisine: "Grills", priceRange: "$$", rating: 4.5, isOpen: true, type: "ours", city: "Makkah", image: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600", description: "Charcoal-grilled meats and fresh sides very close to Haram.", features: ["BBQ", "Fresh salads", "Quick service"] },
  { id: "r5", name: "Al Nakheel", distance: "200m from Haram", cuisine: "Arabic", priceRange: "$", rating: 4.3, isOpen: true, type: "external", city: "Makkah", image: "https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=600", description: "Simple Arabic comfort food at affordable prices.", features: ["Budget friendly", "Casual dining"] },
  { id: "r6", name: "Haram View Cafe", distance: "80m from Haram", cuisine: "Cafe", priceRange: "$", rating: 4.6, isOpen: true, type: "ours", city: "Makkah", image: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600", description: "Light meals and coffee with a convenient location.", features: ["Coffee", "Snacks", "Desserts"] },
  { id: "r7", name: "Najd Village", distance: "600m from Haram", cuisine: "Arabic", priceRange: "$$$", rating: 4.7, isOpen: true, type: "external", city: "Makkah", image: "https://images.unsplash.com/photo-1590846406792-0adc7f938f1d?w=600", description: "Heritage-style dining with classic Saudi recipes.", features: ["Traditional menu", "Group seating"] },
  { id: "r8", name: "Al Romansiah", distance: "800m from Haram", cuisine: "Grills", priceRange: "$$", rating: 4.5, isOpen: true, type: "ours", city: "Makkah", image: "https://images.unsplash.com/photo-1544025162-d76694265947?w=600", description: "Popular grilled dishes and rice meals for families.", features: ["Family friendly", "Large portions"] },
  { id: "r9", name: "Kabab & Grills", distance: "400m from Nabawi", cuisine: "Kabab", priceRange: "$", rating: 4.4, isOpen: false, type: "external", city: "Madinah", image: "https://images.unsplash.com/photo-1529006557810-274b9b2fc783?w=600", description: "Affordable kabab meals with local flavors.", features: ["Takeaway", "Late hours"] },
  { id: "r10", name: "Istanbul Restaurant", distance: "500m from Haram", cuisine: "Turkish", priceRange: "$$", rating: 4.6, isOpen: true, type: "external", city: "Makkah", image: "https://images.unsplash.com/photo-1552566626-52f8b828add9?w=600", description: "Turkish specialties and grilled meats in a relaxed setting.", features: ["Turkish menu", "Family seating"] },
  { id: "r11", name: "Karachi Darbar", distance: "700m from Haram", cuisine: "Pakistani", priceRange: "$", rating: 4.5, isOpen: true, type: "ours", city: "Makkah", image: "https://images.unsplash.com/photo-1466978913421-dad2ebd01d17?w=600", description: "Spiced curries and rice dishes with generous servings.", features: ["Biryani", "Curry dishes"] },
  { id: "r12", name: "Indian Palace", distance: "600m from Nabawi", cuisine: "Indian", priceRange: "$$", rating: 4.3, isOpen: true, type: "external", city: "Madinah", image: "https://images.unsplash.com/photo-1517244683847-7456b63c5969?w=600", description: "Classic Indian dishes near central Madinah.", features: ["Vegetarian options", "Tandoori"] },
  { id: "r13", name: "Bateel Cafe", distance: "400m from Haram", cuisine: "Cafe", priceRange: "$$", rating: 4.7, isOpen: true, type: "external", city: "Makkah", image: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=600", description: "Dates, pastries, and premium coffee in an elegant cafe.", features: ["Specialty coffee", "Desserts"] },
  { id: "r14", name: "Dates & Sweets", distance: "200m from Nabawi", cuisine: "Desserts", priceRange: "$", rating: 4.6, isOpen: true, type: "ours", city: "Madinah", image: "https://images.unsplash.com/photo-1488477181946-6428a0291777?w=600", description: "Perfect stop for sweets, dates, and light refreshments.", features: ["Local sweets", "Gift packs"] },
  { id: "r15", name: "Al Maqha Cafe", distance: "300m from Haram", cuisine: "Arabic Coffee", priceRange: "$", rating: 4.4, isOpen: false, type: "external", city: "Makkah", image: "https://images.unsplash.com/photo-1511920170033-f8396924c348?w=600", description: "Traditional Arabic coffee and snacks with cozy seating.", features: ["Arabic coffee", "Quiet seating"] },
  { id: "r16", name: "Al Baik Express", distance: "250m from Haram", cuisine: "Fast Food", priceRange: "$", rating: 4.8, isOpen: true, type: "ours", city: "Makkah", image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600", description: "Fast and convenient meals during busy pilgrimage hours.", features: ["Express counter", "Takeaway"] },
  { id: "r17", name: "Kudu Burgers", distance: "500m from Nabawi", cuisine: "Burgers", priceRange: "$", rating: 4.3, isOpen: true, type: "external", city: "Madinah", image: "https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=600", description: "Quick burger meals and drinks at good value.", features: ["Combos", "Late hours"] },
  { id: "r18", name: "Pizza Hut Makkah", distance: "800m from Haram", cuisine: "Pizza", priceRange: "$", rating: 4.1, isOpen: true, type: "external", city: "Makkah", image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600", description: "Familiar pizza options for families and groups.", features: ["Family meals", "Delivery"] },
]

export default function RestaurantDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const { theme } = useTheme()
  const restaurant = allRestaurants.find(r => r.id === id)
  const [favorited, setFavorited] = useState(false)

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

        {/* Hero image — always full color */}
        <ImageBackground source={{ uri: restaurant.image }} style={styles.hero}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={22} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.heartBtn} onPress={handleFavorite}>
            <Ionicons name={favorited ? "heart" : "heart-outline"} size={22} color={favorited ? "#C9A84C" : "#fff"} />
          </TouchableOpacity>
          <View style={styles.heroBadge}>
            <Text style={styles.heroBadgeText}>{restaurant.type === "ours" ? "Featured" : "External"}</Text>
          </View>
        </ImageBackground>

        <View style={styles.content}>

          {/* Name */}
          <Text style={[styles.name, { color: theme.text }]}>{restaurant.name}</Text>
          <Text style={[styles.meta, { color: theme.textSecondary }]}>
            {restaurant.city} · {restaurant.distance} · {restaurant.cuisine}
          </Text>
          <Text style={styles.rating}>
            ★ {restaurant.rating} · {restaurant.priceRange} · {restaurant.isOpen ? "Open" : "Closed"}
          </Text>

          <View style={[styles.divider, { backgroundColor: theme.border }]} />

          {/* About */}
          <Text style={[styles.sectionTitle, { color: theme.text }]}>About</Text>
          <Text style={[styles.description, { color: theme.textSecondary }]}>{restaurant.description}</Text>

          <View style={[styles.divider, { backgroundColor: theme.border }]} />

          {/* Highlights */}
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Highlights</Text>
          <View style={styles.features}>
            {restaurant.features.map(feature => (
              <View key={feature} style={styles.featureRow}>
                <Ionicons name="checkmark-circle" size={16} color="#C9A84C" />
                <Text style={[styles.featureText, { color: theme.textSecondary }]}>{feature}</Text>
              </View>
            ))}
          </View>

          <View style={[styles.divider, { backgroundColor: theme.border }]} />

          {/* Location */}
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Location</Text>
          <View style={[styles.locationBox, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Ionicons name="location" size={18} color="#C9A84C" />
            <Text style={[styles.locationText, { color: theme.textSecondary }]}>{restaurant.city}, Saudi Arabia · {restaurant.distance}</Text>
          </View>

          {/* Directions */}
          <TouchableOpacity
            style={styles.directionsBtn}
            onPress={() => Linking.openURL(`https://maps.google.com/?q=${restaurant.name}, ${restaurant.city}, Saudi Arabia`)}
          >
            <Ionicons name="navigate" size={18} color="#fff" />
            <Text style={styles.directionsBtnText}>Get Directions</Text>
          </TouchableOpacity>

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
  backBtn: { position: "absolute", top: 55, left: 16, backgroundColor: "rgba(0,0,0,0.3)", borderRadius: 20, padding: 8 },
  heartBtn: { position: "absolute", top: 55, right: 16, backgroundColor: "rgba(0,0,0,0.3)", borderRadius: 20, padding: 8 },
  heroBadge: { backgroundColor: "rgba(201,168,76,0.9)", alignSelf: "flex-start", paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20 },
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
  locationBox: { flexDirection: "row", alignItems: "center", gap: 8, padding: 14, borderRadius: 12, borderWidth: 0.5 },
  locationText: { fontSize: 14 },
  directionsBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: "#2C5F8A", borderRadius: 12, padding: 14, marginTop: 12 },
  directionsBtnText: { color: "#fff", fontSize: 15, fontWeight: "bold" },
})