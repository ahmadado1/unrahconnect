import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { ImageBackground, Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useState, useEffect } from "react";
import { isFavorite, toggleFavorite } from "../../lib/supabase";

const allHotels = [
  { id: "1", name: "Hilton Suites Makkah", distance: "500m from Haram", price: 180, rating: 4.7, stars: 5, type: "ours", city: "Makkah", image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600", description: "Experience luxury at the heart of Makkah. Just steps from Masjid Al-Haram, this hotel offers stunning views and world-class amenities for a truly blessed Umrah experience.", amenities: ["Free WiFi", "Breakfast included", "Airport shuttle", "24/7 room service", "Prayer room"] },
  { id: "2", name: "Swissotel Makkah", distance: "100m from Haram", price: 320, rating: 4.9, stars: 5, type: "ours", city: "Makkah", image: "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=600", description: "One of the closest hotels to Masjid Al-Haram. Swissotel offers breathtaking Kaaba views from select rooms and premium services tailored for pilgrims.", amenities: ["Kaaba view rooms", "Free WiFi", "Buffet breakfast", "Concierge", "Spa"] },
  { id: "3", name: "Marriott Makkah", distance: "800m from Haram", price: 150, rating: 4.5, stars: 4, type: "external", city: "Makkah", image: "https://images.unsplash.com/photo-1582719508461-905c673771fd?w=600", description: "A comfortable and well-located hotel offering great value for pilgrims. Modern rooms with all essential amenities for a peaceful stay during Umrah.", amenities: ["Free WiFi", "Restaurant", "Fitness center", "Business center"] },
  { id: "4", name: "Anwar Al Madinah", distance: "200m from Nabawi", price: 240, rating: 4.9, stars: 5, type: "ours", city: "Madinah", image: "https://images.unsplash.com/photo-1455587734955-081b22074882?w=600", description: "Located just steps from Masjid An-Nabawi, Anwar Al Madinah offers an unparalleled spiritual experience with premium comfort and hospitality.", amenities: ["Free WiFi", "Breakfast included", "Prayer area", "Airport shuttle", "Room service"] },
  { id: "5", name: "Pullman Madinah", distance: "400m from Nabawi", price: 190, rating: 4.6, stars: 5, type: "external", city: "Madinah", image: "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=600", description: "A modern 5-star hotel offering elegant rooms and exceptional service. Perfect location for pilgrims visiting Masjid An-Nabawi.", amenities: ["Free WiFi", "Pool", "Spa", "Multiple restaurants", "Fitness center"] },
  { id: "6", name: "Al Rawda Royal Inn", distance: "600m from Nabawi", price: 120, rating: 4.3, stars: 4, type: "external", city: "Madinah", image: "https://images.unsplash.com/photo-1496417263034-38ec4f0b665a?w=600", description: "A great budget-friendly option in Madinah offering clean comfortable rooms at an affordable price for pilgrims.", amenities: ["Free WiFi", "Restaurant", "24hr reception"] },
  { id: "7", name: "Fairmont Makkah Clock Royal", distance: "50m from Haram", price: 850, rating: 4.9, stars: 5, type: "ours", city: "Makkah", image: "https://images.unsplash.com/photo-1445019980597-93fa8acb246c?w=600", description: "The iconic clock tower hotel offering the most prestigious address in Makkah. Unrivalled Kaaba views and ultra-luxury amenities.", amenities: ["Kaaba view", "Multiple restaurants", "Spa", "Pool", "Butler service", "Free WiFi"] },
  { id: "8", name: "Raffles Makkah Palace", distance: "100m from Haram", price: 650, rating: 4.8, stars: 5, type: "external", city: "Makkah", image: "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=600", description: "Ultra-luxury hotel with direct views of the Kaaba. Raffles delivers world-class hospitality steps from Masjid Al-Haram.", amenities: ["Kaaba view", "Free WiFi", "Spa", "Fine dining", "Concierge"] },
  { id: "9", name: "Conrad Makkah", distance: "200m from Haram", price: 420, rating: 4.7, stars: 5, type: "ours", city: "Makkah", image: "https://images.unsplash.com/photo-1444201983204-c43cbd584d93?w=600", description: "A modern luxury hotel offering elegant rooms and excellent service near Masjid Al-Haram.", amenities: ["Free WiFi", "Breakfast", "Fitness center", "Spa", "Room service"] },
  { id: "10", name: "Swissotel Al Maqam", distance: "80m from Haram", price: 380, rating: 4.8, stars: 5, type: "ours", city: "Makkah", image: "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=600", description: "Ideally located within the Abraj Al Bait complex, offering stunning views and easy access to Masjid Al-Haram.", amenities: ["Free WiFi", "Breakfast", "Multiple restaurants", "Spa", "Prayer room"] },
  { id: "11", name: "Hilton Suites Makkah", distance: "150m from Haram", price: 280, rating: 4.7, stars: 5, type: "ours", city: "Makkah", image: "https://images.unsplash.com/photo-1454496522488-7a8e488e8606?w=600", description: "Spacious suites perfect for families, just steps from Masjid Al-Haram with all modern amenities.", amenities: ["Free WiFi", "Kitchenette", "Family rooms", "Breakfast", "Shuttle"] },
  { id: "12", name: "Le Meridien Towers", distance: "300m from Haram", price: 220, rating: 4.5, stars: 4, type: "external", city: "Makkah", image: "https://images.unsplash.com/photo-1445991842772-097fea258e7b?w=600", description: "A stylish hotel offering contemporary rooms and great facilities at a reasonable distance from Masjid Al-Haram.", amenities: ["Free WiFi", "Restaurant", "Fitness center", "Business center"] },
  { id: "13", name: "Al Kiswah Towers", distance: "900m from Haram", price: 75, rating: 4.1, stars: 3, type: "external", city: "Makkah", image: "https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=600", description: "An affordable option for budget-conscious pilgrims offering clean and comfortable rooms in Makkah.", amenities: ["Free WiFi", "Restaurant", "24hr reception"] },
  { id: "14", name: "Dar Al Tawhid Intercontinental", distance: "1.2km from Haram", price: 95, rating: 4.2, stars: 3, type: "external", city: "Makkah", image: "https://images.unsplash.com/photo-1584132967334-10e028bd69f7?w=600", description: "A well-priced hotel offering good facilities for pilgrims on a budget.", amenities: ["Free WiFi", "Restaurant", "Parking"] },
  { id: "15", name: "Al Shohada Hotel", distance: "800m from Haram", price: 85, rating: 4.0, stars: 3, type: "ours", city: "Madinah", image: "https://images.unsplash.com/photo-1590490360182-c33d57733427?w=600", description: "A budget-friendly option managed by our team offering reliable service and clean rooms for pilgrims.", amenities: ["Free WiFi", "Breakfast", "24hr reception"] },
  { id: "16", name: "Pullman Zamzam Makkah", distance: "400m from Haram", price: 310, rating: 4.6, stars: 5, type: "ours", city: "Madinah", image: "https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=600", description: "A premium family-friendly hotel offering spacious rooms and excellent facilities for families performing Umrah.", amenities: ["Family rooms", "Free WiFi", "Pool", "Kids area", "Multiple restaurants"] },
  { id: "17", name: "Movenpick Hotel Makkah", distance: "600m from Haram", price: 250, rating: 4.5, stars: 5, type: "external", city: "Makkah", image: "https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?w=600", description: "A popular choice for families with spacious rooms and great amenities at a reasonable distance from Masjid Al-Haram.", amenities: ["Free WiFi", "Family rooms", "Restaurant", "Fitness center"] },
  { id: "18", name: "Millennium Makkah", distance: "700m from Nabawi", price: 180, rating: 4.3, stars: 4, type: "ours", city: "Madinah", image: "https://images.unsplash.com/photo-1595576508898-0ad5c879a061?w=600", description: "A comfortable hotel in Madinah offering modern rooms and good facilities for pilgrims visiting Masjid An-Nabawi.", amenities: ["Free WiFi", "Restaurant", "Family rooms", "Prayer area"] },
  { id: "19", name: "Transcontinental Makkah", distance: "300m from Haram", price: 350, rating: 4.6, stars: 5, type: "ours", city: "Makkah", image: "https://images.unsplash.com/photo-1470219556762-1771e7f9427d?w=600", description: "A great hotel near the Haram offering modern rooms and excellent service.", amenities: ["Free WiFi", "Breakfast", "Room service"] },
]

export default function HotelDetailScreen() {
  const { id } = useLocalSearchParams()
  const router = useRouter()
  const hotelId = Array.isArray(id) ? id[0] : id
  const hotel = allHotels.find((h) => h.id === hotelId)
  // Tracks whether this hotel is currently saved as a favorite
  const [favorited, setFavorited] = useState(false)

  // When screen loads check if this hotel is already in favorites
  useEffect(() => {
    if (!hotel) return

    const checkFav = async () => {
      const result = await isFavorite(hotel.id, "hotel")
      setFavorited(result)
    }
    checkFav()
  }, [hotel])

  // Called when user taps the heart button
  const handleFavorite = async () => {
    if (!hotel) return

    const newState = await toggleFavorite(hotel.id, "hotel")
    setFavorited(newState ?? false)
  }

  if (!hotel) {
    return (
      <View style={styles.notFound}>
        <Text style={styles.notFoundText}>Hotel not found</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backLink}>Go back</Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Hero Image */}
        <ImageBackground source={{ uri: hotel.image }} style={styles.hero}>
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
            <Text style={styles.heroBadgeText}>{hotel.type === "ours" ? "Our pick" : "External"}</Text>
          </View>
        </ImageBackground>

        {/* Content */}
        <View style={styles.content}>

          {/* Hotel name and rating */}
          <View style={styles.nameRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.hotelName}>{hotel.name}</Text>
              <Text style={styles.hotelCity}>{hotel.city} · {hotel.distance}</Text>
            </View>
            <View style={styles.ratingBox}>
              <Text style={styles.ratingNum}>{hotel.rating}</Text>
              <Text style={styles.ratingStar}>★</Text>
            </View>
          </View>

          {/* Stars */}
          <Text style={styles.stars}>{"★".repeat(hotel.stars)}{"☆".repeat(5 - hotel.stars)}</Text>

          {/* Price */}
          <View style={styles.priceRow}>
            <Text style={styles.price}>${hotel.price}</Text>
            <Text style={styles.perNight}> / night</Text>
          </View>

          {/* Divider */}
          <View style={styles.divider} />

          {/* Description */}
          <Text style={styles.sectionTitle}>About</Text>
          <Text style={styles.description}>{hotel.description}</Text>

          {/* Divider */}
          <View style={styles.divider} />

          {/* Amenities */}
          <Text style={styles.sectionTitle}>Amenities</Text>
          <View style={styles.amenitiesGrid}>
            {hotel.amenities.map((item, index) => (
              <View key={index} style={styles.amenityItem}>
                <Ionicons name="checkmark-circle" size={16} color="#C9A84C" />
                <Text style={styles.amenityText}>{item}</Text>
              </View>
            ))}
          </View>

          <View style={styles.divider} />

          {/* Location */}
          <Text style={styles.sectionTitle}>Location</Text>
          <View style={styles.locationBox}>
            <Ionicons name="location" size={18} color="#C9A84C" />
            <Text style={styles.locationText}>{hotel.city}, Saudi Arabia · {hotel.distance}</Text>
          </View>

          {/* Get Directions Button */}
          <TouchableOpacity
            style={styles.directionsBtn}
            onPress={() => Linking.openURL(`https://maps.google.com/?q=${hotel.name}, ${hotel.city}, Saudi Arabia`)}
          >
            <Ionicons name="navigate" size={18} color="#fff" />
            <Text style={styles.directionsBtnText}>Get Directions</Text>
          </TouchableOpacity>

        </View>
      </ScrollView>

      {/* Bottom booking bar */}
      <View style={styles.bookingBar}>
        <View>
          <Text style={styles.bookingPrice}>${hotel.price}<Text style={styles.bookingNight}> / night</Text></Text>
          <Text style={styles.bookingRating}>★ {hotel.rating} · {hotel.stars} star</Text>
        </View>
        {hotel.type === "ours" ? (
          <TouchableOpacity style={styles.bookBtn} onPress={() => router.push({
            pathname: "/booking",
            params: {
              hotelName: hotel.name,
              hotelCity: hotel.city,
              hotelPrice: String(hotel.price),
            },
          })}>
            <Text style={styles.bookBtnText}>Book now</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.viewBtn}>
            <Text style={styles.viewBtnText}>View on Booking.com →</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#F5F0E8" },
  notFound: { flex: 1, alignItems: "center", justifyContent: "center" },
  notFoundText: { fontSize: 18, color: "#1E3A5F" },
  backLink: { color: "#C9A84C", marginTop: 10 },

  hero: { height: 300, justifyContent: "flex-end", padding: 16 },
  backBtn: { position: "absolute", top: 55, left: 16, backgroundColor: "rgba(0,0,0,0.3)", borderRadius: 20, padding: 8 },
  heartBtn: { position: "absolute", top: 55, right: 16, backgroundColor: "rgba(0,0,0,0.3)", borderRadius: 20, padding: 8 },
  heroBadge: { backgroundColor: "rgba(201,168,76,0.9)", alignSelf: "flex-start", paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20 },
  heroBadgeText: { color: "#1E3A5F", fontSize: 12, fontWeight: "bold" },

  content: { padding: 20 },
  nameRow: { flexDirection: "row", alignItems: "flex-start", marginBottom: 6 },
  hotelName: { fontSize: 22, fontWeight: "bold", color: "#1E3A5F", flex: 1 },
  hotelCity: { fontSize: 13, color: "#888", marginTop: 4 },
  ratingBox: { backgroundColor: "#1E3A5F", borderRadius: 10, padding: 8, alignItems: "center", flexDirection: "row", gap: 2 },
  ratingNum: { color: "#fff", fontSize: 14, fontWeight: "bold" },
  ratingStar: { color: "#C9A84C", fontSize: 14 },

  stars: { color: "#C9A84C", fontSize: 16, marginBottom: 12 },
  priceRow: { flexDirection: "row", alignItems: "baseline", marginBottom: 4 },
  price: { fontSize: 26, fontWeight: "bold", color: "#1E3A5F" },
  perNight: { fontSize: 14, color: "#888" },

  divider: { height: 0.5, backgroundColor: "#E0D9CE", marginVertical: 20 },

  sectionTitle: { fontSize: 17, fontWeight: "bold", color: "#1E3A5F", marginBottom: 10 },
  description: { fontSize: 14, color: "#555", lineHeight: 22 },

  amenitiesGrid: { gap: 10 },
  amenityItem: { flexDirection: "row", alignItems: "center", gap: 8 },
  amenityText: { fontSize: 14, color: "#444" },

  locationBox: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#fff", padding: 14, borderRadius: 12, borderWidth: 0.5, borderColor: "#E0D9CE" },
  locationText: { fontSize: 14, color: "#444" },

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

  bookingBar: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 20, backgroundColor: "#fff", borderTopWidth: 0.5, borderTopColor: "#E0D9CE", paddingBottom: 34 },
  bookingPrice: { fontSize: 20, fontWeight: "bold", color: "#1E3A5F" },
  bookingNight: { fontSize: 13, color: "#888", fontWeight: "normal" },
  bookingRating: { fontSize: 12, color: "#C9A84C", marginTop: 2 },
  bookBtn: { backgroundColor: "#1E3A5F", paddingHorizontal: 28, paddingVertical: 14, borderRadius: 25 },
  bookBtnText: { color: "#fff", fontSize: 15, fontWeight: "bold" },
  viewBtn: { backgroundColor: "#C9A84C", paddingHorizontal: 20, paddingVertical: 14, borderRadius: 25 },
  viewBtnText: { color: "#1E3A5F", fontSize: 13, fontWeight: "bold" },
})