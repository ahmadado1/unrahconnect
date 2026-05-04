import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

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
};

const topPicks: Restaurant[] = [
  { id: "r1", name: "Al Baik", distance: "300m from Haram", cuisine: "🍗 Fast Food", priceRange: "$", rating: 4.8, isOpen: true, type: "ours", city: "Makkah" },
  { id: "r2", name: "Zamzam Restaurant", distance: "150m from Haram", cuisine: "🍖 Arabic", priceRange: "$$", rating: 4.7, isOpen: true, type: "ours", city: "Makkah" },
  { id: "r3", name: "Layali Al Sham", distance: "500m from Nabawi", cuisine: "🌍 Syrian", priceRange: "$$", rating: 4.6, isOpen: false, type: "external", city: "Madinah" },
];

const nearHaram: Restaurant[] = [
  { id: "r4", name: "Makkah Grill House", distance: "100m from Haram", cuisine: "🍖 Grills", priceRange: "$$", rating: 4.5, isOpen: true, type: "ours", city: "Makkah" },
  { id: "r5", name: "Al Nakheel", distance: "200m from Haram", cuisine: "🍖 Arabic", priceRange: "$", rating: 4.3, isOpen: true, type: "external", city: "Makkah" },
  { id: "r6", name: "Haram View Cafe", distance: "80m from Haram", cuisine: "☕ Cafe", priceRange: "$", rating: 4.6, isOpen: true, type: "ours", city: "Makkah" },
];

const arabicGrills: Restaurant[] = [
  { id: "r7", name: "Najd Village", distance: "600m from Haram", cuisine: "🍖 Arabic", priceRange: "$$$", rating: 4.7, isOpen: true, type: "external", city: "Makkah" },
  { id: "r8", name: "Al Romansiah", distance: "800m from Haram", cuisine: "🍖 Grills", priceRange: "$$", rating: 4.5, isOpen: true, type: "ours", city: "Makkah" },
  { id: "r9", name: "Kabab & Grills", distance: "400m from Nabawi", cuisine: "🍖 Kabab", priceRange: "$", rating: 4.4, isOpen: false, type: "external", city: "Madinah" },
];

const international: Restaurant[] = [
  { id: "r10", name: "Istanbul Restaurant", distance: "500m from Haram", cuisine: "🌍 Turkish", priceRange: "$$", rating: 4.6, isOpen: true, type: "external", city: "Makkah" },
  { id: "r11", name: "Karachi Darbar", distance: "700m from Haram", cuisine: "🌍 Pakistani", priceRange: "$", rating: 4.5, isOpen: true, type: "ours", city: "Makkah" },
  { id: "r12", name: "Indian Palace", distance: "600m from Nabawi", cuisine: "🌍 Indian", priceRange: "$$", rating: 4.3, isOpen: true, type: "external", city: "Madinah" },
];

const cafesAndDesserts: Restaurant[] = [
  { id: "r13", name: "Bateel Cafe", distance: "400m from Haram", cuisine: "☕ Cafe", priceRange: "$$", rating: 4.7, isOpen: true, type: "external", city: "Makkah" },
  { id: "r14", name: "Dates & Sweets", distance: "200m from Nabawi", cuisine: "🍰 Desserts", priceRange: "$", rating: 4.6, isOpen: true, type: "ours", city: "Madinah" },
  { id: "r15", name: "Al Maqha Cafe", distance: "300m from Haram", cuisine: "☕ Arabic Coffee", priceRange: "$", rating: 4.4, isOpen: false, type: "external", city: "Makkah" },
];

const fastFood: Restaurant[] = [
  { id: "r16", name: "Al Baik Express", distance: "250m from Haram", cuisine: "🍗 Fast Food", priceRange: "$", rating: 4.8, isOpen: true, type: "ours", city: "Makkah" },
  { id: "r17", name: "Kudu Burgers", distance: "500m from Nabawi", cuisine: "🍔 Burgers", priceRange: "$", rating: 4.3, isOpen: true, type: "external", city: "Madinah" },
  { id: "r18", name: "Pizza Hut Makkah", distance: "800m from Haram", cuisine: "🍕 Pizza", priceRange: "$", rating: 4.1, isOpen: true, type: "external", city: "Makkah" },
];

export default function RestaurantsScreen() {
  const [activeFilter, setActiveFilter] = useState("All");
  const filters = ["All", "Makkah", "Madinah"];

  function RestaurantCard({ restaurant }: { restaurant: Restaurant }) {
    const router = useRouter();

    return (
      <TouchableOpacity
        style={cardStyles.card}
        onPress={() => router.push(`/restaurant-detail/${restaurant.id}`)}
      >
        <View style={[cardStyles.image, { backgroundColor: restaurant.city === "Makkah" ? "#2C5F8A" : "#1B4332" }]}>
          <View style={cardStyles.badge}>
            <Text style={cardStyles.badgeText}>{restaurant.type === "ours" ? "⭐ Featured" : "External"}</Text>
          </View>
          <TouchableOpacity style={cardStyles.heart}>
            <Ionicons name="heart-outline" size={18} color="#fff" />
          </TouchableOpacity>
          <Text style={cardStyles.imageLabel}>
            {restaurant.city} · {restaurant.distance}
          </Text>
        </View>
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

  const renderSection = (title: string, restaurants: Restaurant[]) => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{title}</Text>
        <TouchableOpacity>
          <Text style={styles.seeAll}>See all →</Text>
        </TouchableOpacity>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingHorizontal: 16 }}>
        {restaurants.map(restaurant => (
          <RestaurantCard key={restaurant.id} restaurant={restaurant} />
        ))}
      </ScrollView>
    </View>
  );

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
            {filters.map(filter => (
              <TouchableOpacity
                key={filter}
                style={[styles.pill, activeFilter === filter && styles.pillActive]}
                onPress={() => setActiveFilter(filter)}
              >
                <Text style={[styles.pillText, activeFilter === filter && styles.pillTextActive]}>{filter}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {renderSection("🌟 Top Picks", topPicks)}
        {renderSection("🕋 Near Haram", nearHaram)}
        {renderSection("🍖 Arabic & Grills", arabicGrills)}
        {renderSection("🌍 International", international)}
        {renderSection("☕ Cafes & Desserts", cafesAndDesserts)}
        {renderSection("🥡 Fast Food", fastFood)}

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