import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

const allRestaurants = [
  { id: "r1", name: "Al Baik", distance: "300m from Haram", cuisine: "Fast Food", priceRange: "$", rating: 4.8, isOpen: true, type: "ours", city: "Makkah", description: "A famous and reliable option for quick halal meals near Haram.", features: ["Fast service", "Family seating", "Takeaway"] },
  { id: "r2", name: "Zamzam Restaurant", distance: "150m from Haram", cuisine: "Arabic", priceRange: "$$", rating: 4.7, isOpen: true, type: "ours", city: "Makkah", description: "Traditional Arabic dishes with a clean and welcoming atmosphere.", features: ["Arabic platters", "Prayer break friendly", "Family sections"] },
  { id: "r3", name: "Layali Al Sham", distance: "500m from Nabawi", cuisine: "Syrian", priceRange: "$$", rating: 4.6, isOpen: false, type: "external", city: "Madinah", description: "Authentic Levantine meals with grilled specialties.", features: ["Grills", "Mixed platters", "Desserts"] },
  { id: "r4", name: "Makkah Grill House", distance: "100m from Haram", cuisine: "Grills", priceRange: "$$", rating: 4.5, isOpen: true, type: "ours", city: "Makkah", description: "Charcoal-grilled meats and fresh sides very close to Haram.", features: ["BBQ", "Fresh salads", "Quick service"] },
  { id: "r5", name: "Al Nakheel", distance: "200m from Haram", cuisine: "Arabic", priceRange: "$", rating: 4.3, isOpen: true, type: "external", city: "Makkah", description: "Simple Arabic comfort food at affordable prices.", features: ["Budget friendly", "Casual dining"] },
  { id: "r6", name: "Haram View Cafe", distance: "80m from Haram", cuisine: "Cafe", priceRange: "$", rating: 4.6, isOpen: true, type: "ours", city: "Makkah", description: "Light meals and coffee with a convenient location.", features: ["Coffee", "Snacks", "Desserts"] },
  { id: "r7", name: "Najd Village", distance: "600m from Haram", cuisine: "Arabic", priceRange: "$$$", rating: 4.7, isOpen: true, type: "external", city: "Makkah", description: "Heritage-style dining with classic Saudi recipes.", features: ["Traditional menu", "Group seating"] },
  { id: "r8", name: "Al Romansiah", distance: "800m from Haram", cuisine: "Grills", priceRange: "$$", rating: 4.5, isOpen: true, type: "ours", city: "Makkah", description: "Popular grilled dishes and rice meals for families.", features: ["Family friendly", "Large portions"] },
  { id: "r9", name: "Kabab & Grills", distance: "400m from Nabawi", cuisine: "Kabab", priceRange: "$", rating: 4.4, isOpen: false, type: "external", city: "Madinah", description: "Affordable kabab meals with local flavors.", features: ["Takeaway", "Late hours"] },
  { id: "r10", name: "Istanbul Restaurant", distance: "500m from Haram", cuisine: "Turkish", priceRange: "$$", rating: 4.6, isOpen: true, type: "external", city: "Makkah", description: "Turkish specialties and grilled meats in a relaxed setting.", features: ["Turkish menu", "Family seating"] },
  { id: "r11", name: "Karachi Darbar", distance: "700m from Haram", cuisine: "Pakistani", priceRange: "$", rating: 4.5, isOpen: true, type: "ours", city: "Makkah", description: "Spiced curries and rice dishes with generous servings.", features: ["Biryani", "Curry dishes"] },
  { id: "r12", name: "Indian Palace", distance: "600m from Nabawi", cuisine: "Indian", priceRange: "$$", rating: 4.3, isOpen: true, type: "external", city: "Madinah", description: "Classic Indian dishes near central Madinah.", features: ["Vegetarian options", "Tandoori"] },
  { id: "r13", name: "Bateel Cafe", distance: "400m from Haram", cuisine: "Cafe", priceRange: "$$", rating: 4.7, isOpen: true, type: "external", city: "Makkah", description: "Dates, pastries, and premium coffee in an elegant cafe.", features: ["Specialty coffee", "Desserts"] },
  { id: "r14", name: "Dates & Sweets", distance: "200m from Nabawi", cuisine: "Desserts", priceRange: "$", rating: 4.6, isOpen: true, type: "ours", city: "Madinah", description: "Perfect stop for sweets, dates, and light refreshments.", features: ["Local sweets", "Gift packs"] },
  { id: "r15", name: "Al Maqha Cafe", distance: "300m from Haram", cuisine: "Arabic Coffee", priceRange: "$", rating: 4.4, isOpen: false, type: "external", city: "Makkah", description: "Traditional Arabic coffee and snacks with cozy seating.", features: ["Arabic coffee", "Quiet seating"] },
  { id: "r16", name: "Al Baik Express", distance: "250m from Haram", cuisine: "Fast Food", priceRange: "$", rating: 4.8, isOpen: true, type: "ours", city: "Makkah", description: "Fast and convenient meals during busy pilgrimage hours.", features: ["Express counter", "Takeaway"] },
  { id: "r17", name: "Kudu Burgers", distance: "500m from Nabawi", cuisine: "Burgers", priceRange: "$", rating: 4.3, isOpen: true, type: "external", city: "Madinah", description: "Quick burger meals and drinks at good value.", features: ["Combos", "Late hours"] },
  { id: "r18", name: "Pizza Hut Makkah", distance: "800m from Haram", cuisine: "Pizza", priceRange: "$", rating: 4.1, isOpen: true, type: "external", city: "Makkah", description: "Familiar pizza options for families and groups.", features: ["Family meals", "Delivery"] },
];

export default function RestaurantDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const restaurant = allRestaurants.find(r => r.id === id);

  if (!restaurant) {
    return (
      <View style={styles.notFound}>
        <Text style={styles.notFoundText}>Restaurant not found</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backLink}>Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={[styles.hero, { backgroundColor: restaurant.city === "Makkah" ? "#2C5F8A" : "#1B4332" }]}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={22} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.heartBtn}>
            <Ionicons name="heart-outline" size={22} color="#fff" />
          </TouchableOpacity>
          <View style={styles.heroBadge}>
            <Text style={styles.heroBadgeText}>{restaurant.type === "ours" ? "Featured" : "External"}</Text>
          </View>
        </View>

        <View style={styles.content}>
          <Text style={styles.name}>{restaurant.name}</Text>
          <Text style={styles.meta}>
            {restaurant.city} · {restaurant.distance} · {restaurant.cuisine}
          </Text>
          <Text style={styles.rating}>
            ★ {restaurant.rating} · {restaurant.priceRange} · {restaurant.isOpen ? "Open" : "Closed"}
          </Text>

          <View style={styles.divider} />

          <Text style={styles.sectionTitle}>About</Text>
          <Text style={styles.description}>{restaurant.description}</Text>

          <View style={styles.divider} />

          <Text style={styles.sectionTitle}>Highlights</Text>
          <View style={styles.features}>
            {restaurant.features.map(feature => (
              <View key={feature} style={styles.featureRow}>
                <Ionicons name="checkmark-circle" size={16} color="#C9A84C" />
                <Text style={styles.featureText}>{feature}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#F5F0E8" },
  notFound: { flex: 1, alignItems: "center", justifyContent: "center" },
  notFoundText: { fontSize: 18, color: "#1E3A5F" },
  backLink: { color: "#C9A84C", marginTop: 10 },
  hero: { height: 260, justifyContent: "flex-end", padding: 16 },
  backBtn: { position: "absolute", top: 55, left: 16, backgroundColor: "rgba(0,0,0,0.3)", borderRadius: 20, padding: 8 },
  heartBtn: { position: "absolute", top: 55, right: 16, backgroundColor: "rgba(0,0,0,0.3)", borderRadius: 20, padding: 8 },
  heroBadge: { backgroundColor: "rgba(201,168,76,0.9)", alignSelf: "flex-start", paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20 },
  heroBadgeText: { color: "#1E3A5F", fontSize: 12, fontWeight: "bold" },
  content: { padding: 20 },
  name: { fontSize: 24, fontWeight: "700", color: "#1E3A5F" },
  meta: { color: "#64748B", marginTop: 6 },
  rating: { color: "#C9A84C", marginTop: 8, fontWeight: "600" },
  divider: { height: 1, backgroundColor: "#E0D9CE", marginVertical: 20 },
  sectionTitle: { fontSize: 17, fontWeight: "700", color: "#1E3A5F", marginBottom: 10 },
  description: { fontSize: 14, lineHeight: 22, color: "#475569" },
  features: { gap: 10 },
  featureRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  featureText: { color: "#334155", fontSize: 14 },
});
