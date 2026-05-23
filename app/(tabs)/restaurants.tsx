import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useMemo, useState } from "react";
import { ImageBackground, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase, toggleFavorite } from "../../lib/supabase";

type Restaurant = {
  id: string;
  name: string;
  distance: string;
  cuisine: string;
  priceRange: string;
  rating: number;
  isOpen: boolean;
  type: "ours" | "external";
  city: "Makkah" | "Madinah";
  image: string;
};

const topPicks: Restaurant[] = [
  { id: "r1", name: "Al Baik", distance: "300m from Haram", cuisine: "🍗 Fast Food", priceRange: "$", rating: 4.8, isOpen: true, type: "ours", city: "Makkah", image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600" },
  { id: "r2", name: "Zamzam Restaurant", distance: "150m from Haram", cuisine: "🍖 Arabic", priceRange: "$$", rating: 4.7, isOpen: true, type: "ours", city: "Makkah", image: "https://images.unsplash.com/photo-1559339352-11d035aa65de?w=600" },
  { id: "r3", name: "Layali Al Sham", distance: "500m from Nabawi", cuisine: "🌍 Syrian", priceRange: "$$", rating: 4.6, isOpen: false, type: "external", city: "Madinah", image: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600" },
];

const nearHaram: Restaurant[] = [
  { id: "r4", name: "Makkah Grill House", distance: "100m from Haram", cuisine: "🍖 Grills", priceRange: "$$", rating: 4.5, isOpen: true, type: "ours", city: "Makkah", image: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600" },
  { id: "r5", name: "Al Nakheel", distance: "200m from Haram", cuisine: "🍖 Arabic", priceRange: "$", rating: 4.3, isOpen: true, type: "external", city: "Makkah", image: "https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=600" },
  { id: "r6", name: "Haram View Cafe", distance: "80m from Haram", cuisine: "☕ Cafe", priceRange: "$", rating: 4.6, isOpen: true, type: "ours", city: "Makkah", image: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600" },
];

const arabicGrills: Restaurant[] = [
  { id: "r7", name: "Najd Village", distance: "600m from Haram", cuisine: "🍖 Arabic", priceRange: "$$$", rating: 4.7, isOpen: true, type: "external", city: "Makkah", image: "https://images.unsplash.com/photo-1590846406792-0adc7f938f1d?w=600" },
  { id: "r8", name: "Al Romansiah", distance: "800m from Haram", cuisine: "🍖 Grills", priceRange: "$$", rating: 4.5, isOpen: true, type: "ours", city: "Makkah", image: "https://images.unsplash.com/photo-1544025162-d76694265947?w=600" },
  { id: "r9", name: "Kabab & Grills", distance: "400m from Nabawi", cuisine: "🍖 Kabab", priceRange: "$", rating: 4.4, isOpen: false, type: "external", city: "Madinah", image: "https://images.unsplash.com/photo-1529006557810-274b9b2fc783?w=600" },
];

const international: Restaurant[] = [
  { id: "r10", name: "Istanbul Restaurant", distance: "500m from Haram", cuisine: "🌍 Turkish", priceRange: "$$", rating: 4.6, isOpen: true, type: "external", city: "Makkah", image: "https://images.unsplash.com/photo-1552566626-52f8b828add9?w=600" },
  { id: "r11", name: "Karachi Darbar", distance: "700m from Haram", cuisine: "🌍 Pakistani", priceRange: "$", rating: 4.5, isOpen: true, type: "ours", city: "Makkah", image: "https://images.unsplash.com/photo-1466978913421-dad2ebd01d17?w=600" },
  { id: "r12", name: "Indian Palace", distance: "600m from Nabawi", cuisine: "🌍 Indian", priceRange: "$$", rating: 4.3, isOpen: true, type: "external", city: "Madinah", image: "https://images.unsplash.com/photo-1517244683847-7456b63c5969?w=600" },
];

const cafesAndDesserts: Restaurant[] = [
  { id: "r13", name: "Bateel Cafe", distance: "400m from Haram", cuisine: "☕ Cafe", priceRange: "$$", rating: 4.7, isOpen: true, type: "external", city: "Makkah", image: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=600" },
  { id: "r14", name: "Dates & Sweets", distance: "200m from Nabawi", cuisine: "🍰 Desserts", priceRange: "$", rating: 4.6, isOpen: true, type: "ours", city: "Madinah", image: "https://images.unsplash.com/photo-1488477181946-6428a0291777?w=600" },
  { id: "r15", name: "Al Maqha Cafe", distance: "300m from Haram", cuisine: "☕ Arabic Coffee", priceRange: "$", rating: 4.4, isOpen: false, type: "external", city: "Makkah", image: "https://images.unsplash.com/photo-1511920170033-f8396924c348?w=600" },
];

const fastFood: Restaurant[] = [
  { id: "r16", name: "Al Baik Express", distance: "250m from Haram", cuisine: "🍗 Fast Food", priceRange: "$", rating: 4.8, isOpen: true, type: "ours", city: "Makkah", image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600" },
  { id: "r17", name: "Kudu Burgers", distance: "500m from Nabawi", cuisine: "🍔 Burgers", priceRange: "$", rating: 4.3, isOpen: true, type: "external", city: "Madinah", image: "https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=600" },
  { id: "r18", name: "Pizza Hut Makkah", distance: "800m from Haram", cuisine: "🍕 Pizza", priceRange: "$", rating: 4.1, isOpen: true, type: "external", city: "Makkah", image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600" },
];

// Curated lists for city-specific sections (must include city: "Makkah" or "Madinah" on each item)
const makkahRestaurants: Restaurant[] = [
  topPicks[0]!,
  topPicks[1]!,
  nearHaram[0]!,
];

const madinahRestaurants: Restaurant[] = [
  topPicks[2]!,
  arabicGrills[2]!,
  international[2]!,
];

// Hand-picked mix for Recommended — add entries here (same objects as in other arrays)
const recommended: Restaurant[] = [topPicks[0]!, nearHaram[0]!, topPicks[2]!];

type CityFilter = "All" | "Makkah" | "Madinah";

export default function RestaurantsScreen() {
  // Tracks which pill is selected; drives all section filtering below
  const [activeFilter, setActiveFilter] = useState<CityFilter>("All");
  const [favoriteRestaurantIds, setFavoriteRestaurantIds] = useState<Set<string>>(new Set())
  const filters: CityFilter[] = ["All", "Makkah", "Madinah"];

  const loadFavoriteRestaurants = async () => {
    const { data: { user } } = await supabase.auth.getUser()
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

    setFavoriteRestaurantIds(new Set((data ?? []).map((row) => String(row.item_id))))
  }

  useFocusEffect(
    useCallback(() => {
      loadFavoriteRestaurants()
    }, [])
  )

  /**
   * City filter — same pattern as filterHotels on the Hotels tab.
   * 1. "All" → return the section list unchanged
   * 2. "Makkah" / "Madinah" → keep only items whose `city` field matches the pill
   */
  const filterRestaurants = useCallback(
    (restaurants: Restaurant[]) => {
      if (activeFilter === "All") return restaurants;
      return restaurants.filter((restaurant) => restaurant.city === activeFilter);
    },
    [activeFilter]
  );

  // Recompute visible sections whenever the pill changes (fixes stale UI after tap)
  const visibleSections = useMemo(
    () =>
      [
        { title: "⭐ Recommended", restaurants: recommended },
        { title: "🕋 Makkah Top Picks", restaurants: makkahRestaurants },
        { title: "🕋 Near Haram", restaurants: nearHaram },
        { title: "🍖 Arabic & Grills", restaurants: arabicGrills },
        { title: "🌍 International", restaurants: international },
        { title: "☕ Cafes & Desserts", restaurants: cafesAndDesserts },
        { title: "🥡 Fast Food", restaurants: fastFood },
        { title: "🌙 Madinah Picks", restaurants: madinahRestaurants },
      ]
        .map((section) => ({
          title: section.title,
          restaurants: filterRestaurants(section.restaurants),
        }))
        // Hide entire section when no restaurants match the active city
        .filter((section) => section.restaurants.length > 0),
    [filterRestaurants]
  );

  function RestaurantCard({ restaurant }: { restaurant: Restaurant }) {
    const router = useRouter();
    const isFavorited = favoriteRestaurantIds.has(restaurant.id)

    const handleFavoritePress = async () => {
      const newState = await toggleFavorite(restaurant.id, "restaurant")
      setFavoriteRestaurantIds((prev) => {
        const next = new Set(prev)
        if (newState) next.add(restaurant.id)
        else next.delete(restaurant.id)
        return next
      })
    }

    return (
      <TouchableOpacity
        style={cardStyles.card}
        onPress={() => router.push(`/restaurant-detail/${restaurant.id}`)}
      >
        <ImageBackground source={{ uri: restaurant.image }} style={cardStyles.image} imageStyle={{ borderTopLeftRadius: 16, borderTopRightRadius: 16 }}>
          <View style={cardStyles.badge}>
            <Text style={cardStyles.badgeText}>{restaurant.type === "ours" ? "⭐ Featured" : "External"}</Text>
          </View>
          <TouchableOpacity
            style={cardStyles.heart}
            onPress={(event) => {
              event.stopPropagation()
              handleFavoritePress()
            }}
          >
            <Ionicons name={isFavorited ? "heart" : "heart-outline"} size={18} color={isFavorited ? "#C9A84C" : "#fff"} />
          </TouchableOpacity>
          <Text style={cardStyles.imageLabel}>
            {restaurant.city} · {restaurant.distance}
          </Text>
        </ImageBackground>
        <View style={cardStyles.info}>
          <Text style={cardStyles.name}>{restaurant.name}</Text>
          <Text style={cardStyles.meta}>{restaurant.cuisine} · {restaurant.distance}</Text>
          <View style={cardStyles.footer}>
            <View>
              <Text style={cardStyles.price}>{restaurant.priceRange} · <Text style={{ color: restaurant.isOpen ? "#2D6A4F" : "#E24B4A" }}>● {restaurant.isOpen ? "Open" : "Closed"}</Text></Text>
              <Text style={cardStyles.rating}>★ {restaurant.rating}</Text>
            </View>
            <TouchableOpacity style={[cardStyles.btn, restaurant.type === "external" && cardStyles.btnExternal]}>
              <Text style={[cardStyles.btnText, restaurant.type === "external" && cardStyles.btnTextExternal]}>
                {restaurant.type === "ours" ? "Reserve" : "Directions →"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />
      <SafeAreaView edges={["top"]} style={styles.safeTop} />

      <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.title}>Restaurants</Text>
              <Text style={styles.subtitle}>Discover food near you</Text>
            </View>
            <TouchableOpacity style={styles.iconBtn}>
              <Ionicons name="options-outline" size={22} color="#fff" />
            </TouchableOpacity>
          </View>

          <View style={styles.searchBar}>
            <Ionicons name="search" size={16} color="rgba(255,255,255,0.5)" />
            <TextInput
              placeholder="Search restaurants..."
              placeholderTextColor="rgba(255,255,255,0.45)"
              style={styles.searchInput}
            />
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.pillsRow}
            contentContainerStyle={{ gap: 8 }}
          >
            {filters.map((filter) => (
              <TouchableOpacity
                key={filter}
                style={[styles.pill, activeFilter === filter && styles.pillActive]}
                // Updates activeFilter → useMemo rebuilds visibleSections → list re-renders
                onPress={() => setActiveFilter(filter)}
              >
                <Text style={[styles.pillText, activeFilter === filter && styles.pillTextActive]}>{filter}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* key forces ScrollView children to refresh when the city pill changes */}
        <View key={activeFilter}>
          {visibleSections.map((section) => (
            <View key={section.title} style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>{section.title}</Text>
                <TouchableOpacity>
                  <Text style={styles.seeAll}>See all →</Text>
                </TouchableOpacity>
              </View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 12, paddingHorizontal: 16 }}
              >
                {section.restaurants.map((restaurant) => (
                  <RestaurantCard key={restaurant.id} restaurant={restaurant} />
                ))}
              </ScrollView>
            </View>
          ))}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const cardStyles = StyleSheet.create({
  card: { width: 260, backgroundColor: "#fff", borderRadius: 16, overflow: "hidden", borderWidth: 0.5, borderColor: "#E0D9CE" },
  image: { height: 160, justifyContent: "flex-end", padding: 10, position: "relative" },
  badge: { position: "absolute", top: 10, left: 10, backgroundColor: "rgba(201,168,76,0.9)", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  badgeText: { color: "#1E3A5F", fontSize: 11, fontWeight: "bold" },
  heart: { position: "absolute", top: 10, right: 10, backgroundColor: "rgba(0,0,0,0.3)", borderRadius: 20, padding: 6 },
  imageLabel: { color: "rgba(255,255,255,0.8)", fontSize: 11 },
  info: { padding: 14 },
  name: { color: "#1E3A5F", fontSize: 15, fontWeight: "bold", marginBottom: 4 },
  meta: { color: "#888", fontSize: 12, marginBottom: 10 },
  footer: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  price: { color: "#1E3A5F", fontSize: 13, fontWeight: "bold" },
  rating: { color: "#C9A84C", fontSize: 12, marginTop: 2 },
  btn: { backgroundColor: "#1E3A5F", paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  btnExternal: { backgroundColor: "#C9A84C" },
  btnText: { color: "#fff", fontSize: 12, fontWeight: "bold" },
  btnTextExternal: { color: "#1E3A5F" },
});

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#F5F0E8" },
  safeTop: { backgroundColor: "#1E3A5F" },
  header: { backgroundColor: "#1E3A5F", paddingBottom: 16 },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
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
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, marginBottom: 12 },
  sectionTitle: { color: "#1E3A5F", fontSize: 17, fontWeight: "bold" },
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
});