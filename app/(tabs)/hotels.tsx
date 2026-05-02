import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function HotelsScreen() {
  const [activeFilter, setActiveFilter] = useState("All");
  const filters = ["All", "Makkah", "Madinah"];

  const makkahHotels = [
    { id: "1", name: "Hilton Suites Maddinah", distance: "500m from Nabawi", price: 180, rating: 4.7, stars: 5, type: "ours", city: "Madinah" },
    { id: "2", name: "Swissotel Makkah", distance: "100m from Haram", price: 320, rating: 4.9, stars: 5, type: "ours", city: "Makkah" },
    { id: "3", name: "Marriott Makkah", distance: "800m from Haram", price: 150, rating: 4.5, stars: 4, type: "external", city: "Makkah" },
  ]
  
  const madinahHotels = [
    { id: "4", name: "Anwar Al Madinah", distance: "200m from Nabawi", price: 240, rating: 4.9, stars: 5, type: "ours", city: "Madinah" },
    { id: "5", name: "Pullman Makkah", distance: "400m from Haram", price: 190, rating: 4.6, stars: 5, type: "external", city: "Makkah" },
    { id: "6", name: "Al Rawda Royal Inn", distance: "600m from Nabawi", price: 120, rating: 4.3, stars: 4, type: "external", city: "Madinah" },
  ]

  const kaabViewHotels = [
    { id: "7", name: "Fairmont Makkah Clock Royal", distance: "50m from Haram", price: 850, rating: 4.9, stars: 5, type: "ours", city: "Makkah" },
    { id: "8", name: "Raffles Makkah Palace", distance: "100m from Haram", price: 650, rating: 4.8, stars: 5, type: "external", city: "Makkah" },
    { id: "9", name: "Conrad Makkah", distance: "200m from Haram", price: 420, rating: 4.7, stars: 5, type: "ours", city: "Makkah" },
  ]
  
  const closestHotels = [
    { id: "10", name: "Swissotel Al Maqam", distance: "80m from Haram", price: 380, rating: 4.8, stars: 5, type: "ours", city: "Makkah" },
    { id: "11", name: "Hilton Suites Makkah", distance: "150m from Haram", price: 280, rating: 4.7, stars: 5, type: "ours", city: "Makkah" },
    { id: "12", name: "Le Meridien Towers", distance: "300m from Haram", price: 220, rating: 4.5, stars: 4, type: "external", city: "Madinah" },
  ]
  
  const budgetHotels = [
    { id: "13", name: "Al Kiswah Towers", distance: "900m from Haram", price: 75, rating: 4.1, stars: 3, type: "external", city: "Madinah" },
    { id: "14", name: "Dar Al Tawhid Intercontinental", distance: "1.2km from Haram", price: 95, rating: 4.2, stars: 3, type: "external", city: "Makkah" },
    { id: "15", name: "Al Shohada Hotel", distance: "800m from Haram", price: 85, rating: 4.0, stars: 3, type: "ours", city: "Madinah" },
  ]
  
  const familyHotels = [
    { id: "16", name: "Pullman Zamzam Makkah", distance: "400m from Haram", price: 310, rating: 4.6, stars: 5, type: "ours", city: "Madinah" },
    { id: "17", name: "Movenpick Hotel Makkah", distance: "600m from Haram", price: 250, rating: 4.5, stars: 5, type: "external", city: "Makkah" },
    { id: "18", name: "Millennium Makkah", distance: "700m from Haram", price: 180, rating: 4.3, stars: 4, type: "ours", city: "Makkah" },
  ]
  
  function HotelCard({ hotel }: { hotel: any }) {
    return (
      <View style={cardStyles.card}>
        <View style={[cardStyles.image, { backgroundColor: hotel.city === "Makkah" ? "#2C5F8A" : "#1B4332" }]}>
          <View style={cardStyles.badge}>
            <Text style={cardStyles.badgeText}>{hotel.type === "ours" ? "Our pick" : "External"}</Text>
          </View>
          <TouchableOpacity style={cardStyles.heart}>
            <Ionicons name="heart-outline" size={18} color="#fff" />
          </TouchableOpacity>
          <Text style={cardStyles.imageLabel}>{hotel.city} · {hotel.distance}</Text>
        </View>
        <View style={cardStyles.info}>
          <Text style={cardStyles.name}>{hotel.name}</Text>
          <Text style={cardStyles.meta}>{"★".repeat(hotel.stars)} · {hotel.distance}</Text>
          <View style={cardStyles.footer}>
            <View>
              <Text style={cardStyles.price}>${hotel.price} / night</Text>
              <Text style={cardStyles.rating}>★ {hotel.rating}</Text>
            </View>
            <TouchableOpacity style={[cardStyles.btn, hotel.type === "external" && cardStyles.btnExternal]}>
              <Text style={[cardStyles.btnText, hotel.type === "external" && cardStyles.btnTextExternal]}>
                {hotel.type === "ours" ? "Book now" : "View →"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    )
  }
  
  const cardStyles = StyleSheet.create({
    card: { width: 260, backgroundColor: "#fff", borderRadius: 16, overflow: "hidden", borderWidth: 0.5, borderColor: "#E0D9CE" },
    image: { height: 180, justifyContent: "flex-end", padding: 10, position: "relative" },
    badge: { position: "absolute", top: 10, left: 10, backgroundColor: "rgba(201,168,76,0.9)", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
    badgeText: { color: "#1E3A5F", fontSize: 11, fontWeight: "bold" },
    heart: { position: "absolute", top: 10, right: 10, backgroundColor: "rgba(0,0,0,0.3)", borderRadius: 20, padding: 6 },
    imageLabel: { color: "rgba(255,255,255,0.8)", fontSize: 11 },
    info: { padding: 14 },
    name: { color: "#1E3A5F", fontSize: 15, fontWeight: "bold", marginBottom: 4 },
    meta: { color: "#888", fontSize: 12, marginBottom: 10 },
    footer: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
    price: { color: "#1E3A5F", fontSize: 14, fontWeight: "bold" },
    rating: { color: "#C9A84C", fontSize: 12 },
    btn: { backgroundColor: "#1E3A5F", paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
    btnExternal: { backgroundColor: "#C9A84C" },
    btnText: { color: "#fff", fontSize: 12, fontWeight: "bold" },
    btnTextExternal: { color: "#1E3A5F" },
  })

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />
      <SafeAreaView edges={["top"]} style={styles.safeTop} />

    <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.title}>Hotels</Text>
            <Text style={styles.subtitle}>Find your perfect stay</Text>
          </View>
          <TouchableOpacity style={styles.iconBtn}>
            <Ionicons name="options-outline" size={22} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={styles.searchBar}>
          <Ionicons name="search" size={16} color="rgba(255,255,255,0.5)" />
          <TextInput
            placeholder="Search hotels..."
            placeholderTextColor="rgba(255,255,255,0.45)"
            style={styles.searchInput}
          />
        </View>

        {/* Filter Pills */}
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
              onPress={() => setActiveFilter(filter)}
            >
              <Text style={[styles.pillText, activeFilter === filter && styles.pillTextActive]}>
                {filter}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Body */}
      

        {/* Section — Recommended */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>⭐ Recommended</Text>
            <TouchableOpacity>
              <Text style={styles.seeAll}>See all →</Text>
            </TouchableOpacity>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingHorizontal: 16 }}>
            {makkahHotels.map((hotel) => (
              <HotelCard key={hotel.id} hotel={hotel} />
            ))}
          </ScrollView>
        </View>

        {/* Section — Makkah */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>⭐️ Top Picks</Text>
            <TouchableOpacity>
              <Text style={styles.seeAll}>See all →</Text>
            </TouchableOpacity>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingHorizontal: 16 }}>
            {makkahHotels.map((hotel) => (
              <HotelCard key={hotel.id} hotel={hotel} />
            ))}
          </ScrollView>
        </View>

        {/* Section — Madinah */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>5 Star Hotels</Text>
            <TouchableOpacity>
              <Text style={styles.seeAll}>See all →</Text>
            </TouchableOpacity>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingHorizontal: 16 }}>
            {madinahHotels.map((hotel) => (
              <HotelCard key={hotel.id} hotel={hotel} />
            ))}
          </ScrollView>
        </View>
        
        {/* Section — Kaaba View */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>🕋 Kaaba View</Text>
            <TouchableOpacity>
              <Text style={styles.seeAll}>See all →</Text>
            </TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingHorizontal: 16 }}>
            {kaabViewHotels.map((hotel) => (
              <HotelCard key={hotel.id} hotel={hotel} />
            ))}
          </ScrollView>
        </View>

        {/* Section — Closest to Haram */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>🚶 Closest to Haram</Text>
            <TouchableOpacity>
              <Text style={styles.seeAll}>See all →</Text>
            </TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingHorizontal: 16 }}>
            {closestHotels.map((hotel) => (
              <HotelCard key={hotel.id} hotel={hotel} />
            ))}
          </ScrollView>
        </View>

        {/* Section — Budget Friendly */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>💰 Budget Friendly</Text>
            <TouchableOpacity>
              <Text style={styles.seeAll}>See all →</Text>
            </TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingHorizontal: 16 }}>
            {budgetHotels.map((hotel) => (
              <HotelCard key={hotel.id} hotel={hotel} />
            ))}
          </ScrollView>
        </View>

        {/* Section — Family Rooms */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>🛏️ Family Rooms</Text>
            <TouchableOpacity>
              <Text style={styles.seeAll}>See all →</Text>
            </TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingHorizontal: 16 }}>
            {familyHotels.map((hotel) => (
              <HotelCard key={hotel.id} hotel={hotel} />
            ))}
          </ScrollView>
        </View>

        {/* Section — Madinah Picks */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>🌙 Madinah Picks</Text>
            <TouchableOpacity>
              <Text style={styles.seeAll}>See all →</Text>
            </TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingHorizontal: 16 }}>
            {madinahHotels.map((hotel) => (
              <HotelCard key={hotel.id} hotel={hotel} />
            ))}
          </ScrollView>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

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