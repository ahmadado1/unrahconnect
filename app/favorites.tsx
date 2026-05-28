import { useTheme } from "@/context/themeContext";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useState } from "react";
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { supabase } from "../lib/supabase";

export default function FavoritesScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { theme, isDark } = useTheme()
  const [hotels, setHotels] = useState<any[]>([])
  const [restaurants, setRestaurants] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const allHotels = [
    { id: "1", name: "Hilton Suites Makkah", distance: "500m from Haram", price: 180, rating: 4.7, city: "Makkah", image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600" },
    { id: "2", name: "Swissotel Makkah", distance: "100m from Haram", price: 320, rating: 4.9, city: "Makkah", image: "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=600" },
    { id: "3", name: "Marriott Makkah", distance: "800m from Haram", price: 150, rating: 4.5, city: "Makkah", image: "https://images.unsplash.com/photo-1582719508461-905c673771fd?w=600" },
    { id: "4", name: "Anwar Al Madinah", distance: "200m from Nabawi", price: 240, rating: 4.9, city: "Madinah", image: "https://images.unsplash.com/photo-1455587734955-081b22074882?w=600" },
    { id: "5", name: "Pullman Madinah", distance: "400m from Nabawi", price: 190, rating: 4.6, city: "Madinah", image: "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=600" },
    { id: "6", name: "Al Rawda Royal Inn", distance: "600m from Nabawi", price: 120, rating: 4.3, city: "Madinah", image: "https://images.unsplash.com/photo-1496417263034-38ec4f0b665a?w=600" },
    { id: "7", name: "Fairmont Makkah Clock Royal", distance: "50m from Haram", price: 850, rating: 4.9, city: "Makkah", image: "https://images.unsplash.com/photo-1445019980597-93fa8acb246c?w=600" },
    { id: "8", name: "Raffles Makkah Palace", distance: "100m from Haram", price: 650, rating: 4.8, city: "Makkah", image: "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=600" },
    { id: "9", name: "Conrad Makkah", distance: "200m from Haram", price: 420, rating: 4.7, city: "Makkah", image: "https://images.unsplash.com/photo-1444201983204-c43cbd584d93?w=600" },
    { id: "10", name: "Swissotel Al Maqam", distance: "80m from Haram", price: 380, rating: 4.8, city: "Makkah", image: "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=600" },
    { id: "11", name: "Hilton Suites Makkah", distance: "150m from Haram", price: 280, rating: 4.7, city: "Makkah", image: "https://images.unsplash.com/photo-1454496522488-7a8e488e8606?w=600" },
    { id: "12", name: "Le Meridien Towers", distance: "300m from Haram", price: 220, rating: 4.5, city: "Makkah", image: "https://images.unsplash.com/photo-1445991842772-097fea258e7b?w=600" },
    { id: "13", name: "Al Kiswah Towers", distance: "900m from Haram", price: 75, rating: 4.1, city: "Makkah", image: "https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=600" },
    { id: "14", name: "Dar Al Tawhid Intercontinental", distance: "1.2km from Haram", price: 95, rating: 4.2, city: "Makkah", image: "https://images.unsplash.com/photo-1584132967334-10e028bd69f7?w=600" },
    { id: "15", name: "Al Shohada Hotel", distance: "800m from Haram", price: 85, rating: 4.0, city: "Madinah", image: "https://images.unsplash.com/photo-1590490360182-c33d57733427?w=600" },
    { id: "16", name: "Pullman Zamzam Makkah", distance: "400m from Haram", price: 310, rating: 4.6, city: "Makkah", image: "https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=600" },
    { id: "17", name: "Movenpick Hotel Makkah", distance: "600m from Haram", price: 250, rating: 4.5, city: "Makkah", image: "https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?w=600" },
    { id: "18", name: "Millennium Makkah", distance: "700m from Nabawi", price: 180, rating: 4.3, city: "Madinah", image: "https://images.unsplash.com/photo-1595576508898-0ad5c879a061?w=600" },
    { id: "19", name: "Transcontinental Makkah", distance: "300m from Haram", price: 350, rating: 4.6, city: "Makkah", image: "https://images.unsplash.com/photo-1470219556762-1771e7f9427d?w=600" },
  ]

  const allRestaurants = [
    { id: "r1", name: "Al Baik", distance: "300m from Haram", cuisine: "Fast Food", rating: 4.8, city: "Makkah", image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600" },
    { id: "r2", name: "Zamzam Restaurant", distance: "150m from Haram", cuisine: "Arabic", rating: 4.7, city: "Makkah", image: "https://images.unsplash.com/photo-1559339352-11d035aa65de?w=600" },
    { id: "r3", name: "Layali Al Sham", distance: "500m from Nabawi", cuisine: "Syrian", rating: 4.6, city: "Madinah", image: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600" },
    { id: "r4", name: "Makkah Grill House", distance: "100m from Haram", cuisine: "Grills", rating: 4.5, city: "Makkah", image: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600" },
    { id: "r5", name: "Al Nakheel", distance: "200m from Haram", cuisine: "Arabic", rating: 4.3, city: "Makkah", image: "https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=600" },
    { id: "r6", name: "Haram View Cafe", distance: "80m from Haram", cuisine: "Cafe", rating: 4.6, city: "Makkah", image: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600" },
    { id: "r7", name: "Najd Village", distance: "600m from Haram", cuisine: "Arabic", rating: 4.7, city: "Makkah", image: "https://images.unsplash.com/photo-1590846406792-0adc7f938f1d?w=600" },
    { id: "r8", name: "Al Romansiah", distance: "800m from Haram", cuisine: "Grills", rating: 4.5, city: "Makkah", image: "https://images.unsplash.com/photo-1544025162-d76694265947?w=600" },
    { id: "r9", name: "Kabab & Grills", distance: "400m from Nabawi", cuisine: "Kabab", rating: 4.4, city: "Madinah", image: "https://images.unsplash.com/photo-1529006557810-274b9b2fc783?w=600" },
    { id: "r10", name: "Istanbul Restaurant", distance: "500m from Haram", cuisine: "Turkish", rating: 4.6, city: "Makkah", image: "https://images.unsplash.com/photo-1552566626-52f8b828add9?w=600" },
    { id: "r11", name: "Karachi Darbar", distance: "700m from Haram", cuisine: "Pakistani", rating: 4.5, city: "Makkah", image: "https://images.unsplash.com/photo-1466978913421-dad2ebd01d17?w=600" },
    { id: "r12", name: "Indian Palace", distance: "600m from Nabawi", cuisine: "Indian", rating: 4.3, city: "Madinah", image: "https://images.unsplash.com/photo-1517244683847-7456b63c5969?w=600" },
    { id: "r13", name: "Bateel Cafe", distance: "400m from Haram", cuisine: "Cafe", rating: 4.7, city: "Makkah", image: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=600" },
    { id: "r14", name: "Dates & Sweets", distance: "200m from Nabawi", cuisine: "Desserts", rating: 4.6, city: "Madinah", image: "https://images.unsplash.com/photo-1488477181946-6428a0291777?w=600" },
    { id: "r15", name: "Al Maqha Cafe", distance: "300m from Haram", cuisine: "Arabic Coffee", rating: 4.4, city: "Makkah", image: "https://images.unsplash.com/photo-1511920170033-f8396924c348?w=600" },
    { id: "r16", name: "Al Baik Express", distance: "250m from Haram", cuisine: "Fast Food", rating: 4.8, city: "Makkah", image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600" },
    { id: "r17", name: "Kudu Burgers", distance: "500m from Nabawi", cuisine: "Burgers", rating: 4.3, city: "Madinah", image: "https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=600" },
    { id: "r18", name: "Pizza Hut Makkah", distance: "800m from Haram", cuisine: "Pizza", rating: 4.1, city: "Makkah", image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600" },
  ]

  const loadFavorites = useCallback(async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setHotels([]); setRestaurants([]); setLoading(false); return }

    const { data, error } = await supabase
      .from("favorites")
      .select("item_id, item_type")
      .eq("user_id", user.id)

    if (data && !error) {
      const savedHotelIds = data.filter(f => f.item_type === "hotel").map(f => String(f.item_id))
      setHotels(allHotels.filter(h => savedHotelIds.includes(h.id)))
      const savedRestaurantIds = data.filter(f => f.item_type === "restaurant").map(f => String(f.item_id))
      setRestaurants(allRestaurants.filter(r => savedRestaurantIds.includes(r.id)))
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    loadFavorites()
  }, [loadFavorites])

  return (
    <View style={[styles.screen, { backgroundColor: theme.background }]}>
      <StatusBar style={isDark ? "light" : "dark"} />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 16, backgroundColor: theme.header }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Favorites</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Loading */}
        {loading && (
          <Text style={[styles.loadingText, { color: theme.textSecondary }]}>Loading favorites...</Text>
        )}

        {/* Empty state */}
        {!loading && hotels.length === 0 && restaurants.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>❤️</Text>
            <Text style={[styles.emptyTitle, { color: theme.text }]}>No favorites yet</Text>
            <Text style={[styles.emptySub, { color: theme.textSecondary }]}>Tap the heart on any hotel or restaurant to save it here</Text>
          </View>
        )}

        {/* Hotels */}
        {hotels.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>🏨 Hotels</Text>
            {hotels.map(hotel => (
              <TouchableOpacity
                key={hotel.id}
                style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}
                onPress={() => router.push({ pathname: "/hotel-detail/[id]", params: { id: String(hotel.id) } })}
              >
                <Image source={{ uri: hotel.image }} style={styles.cardImage} />
                <View style={styles.cardInfo}>
                  <Text style={[styles.cardName, { color: theme.text }]}>{hotel.name}</Text>
                  <Text style={[styles.cardMeta, { color: theme.textSecondary }]}>{hotel.city} · {hotel.distance}</Text>
                  <Text style={[styles.cardPrice, { color: theme.gold }]}>${hotel.price} / night · ★ {hotel.rating}</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={theme.gold} />
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Restaurants */}
        {restaurants.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>🍽️ Restaurants</Text>
            {restaurants.map(restaurant => (
              <TouchableOpacity
                key={restaurant.id}
                style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}
                onPress={() => router.push({ pathname: "/restaurant-detail/[id]", params: { id: String(restaurant.id) } })}
              >
                <Image source={{ uri: restaurant.image }} style={styles.cardImage} />
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
  cardImage: { width: 60, height: 60, borderRadius: 10 },
  cardInfo: { flex: 1 },
  cardName: { fontSize: 14, fontWeight: "bold" },
  cardMeta: { fontSize: 12, marginTop: 2 },
  cardPrice: { fontSize: 12, marginTop: 4 },
})