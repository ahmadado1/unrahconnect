import { useTheme } from "@/context/themeContext";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { ImageBackground, Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { isFavorite, toggleFavorite } from "../../lib/supabase";

const allHotels = [
  { id: "1", name: "Hilton Suites Makkah", distance: "500m from Haram", price: 180, rating: 4.7, stars: 5, type: "ours", city: "Makkah", image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600", description: "Experience luxury at the heart of Makkah. Just steps from Masjid Al-Haram, this hotel offers stunning views and world-class amenities for a truly blessed Umrah experience.", amenities: ["Free WiFi", "Breakfast included", "Airport shuttle", "24/7 room service", "Prayer room"] },
  { id: "2", name: "Swissotel Makkah", distance: "100m from Haram", price: 320, rating: 4.9, stars: 5, type: "ours", city: "Makkah", image: "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=600", description: "One of the closest hotels to Masjid Al-Haram. Swissotel offers breathtaking Kaaba views from select rooms and premium services tailored for pilgrims.", amenities: ["Kaaba view rooms", "Free WiFi", "Buffet breakfast", "Concierge", "Spa"] },
  { id: "3", name: "Marriott Makkah", distance: "800m from Haram", price: 150, rating: 4.5, stars: 4, type: "external", city: "Makkah", image: "https://images.unsplash.com/photo-1582719508461-905c673771fd?w=600", description: "A comfortable and well-located hotel offering great value for pilgrims.", amenities: ["Free WiFi", "Restaurant", "Fitness center", "Business center"] },
  { id: "4", name: "Anwar Al Madinah", distance: "200m from Nabawi", price: 240, rating: 4.9, stars: 5, type: "ours", city: "Madinah", image: "https://images.unsplash.com/photo-1455587734955-081b22074882?w=600", description: "Located just steps from Masjid An-Nabawi, Anwar Al Madinah offers an unparalleled spiritual experience.", amenities: ["Free WiFi", "Breakfast included", "Prayer area", "Airport shuttle", "Room service"] },
  { id: "5", name: "Pullman Madinah", distance: "400m from Nabawi", price: 190, rating: 4.6, stars: 5, type: "external", city: "Madinah", image: "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=600", description: "A modern 5-star hotel offering elegant rooms and exceptional service.", amenities: ["Free WiFi", "Pool", "Spa", "Multiple restaurants", "Fitness center"] },
  { id: "6", name: "Al Rawda Royal Inn", distance: "600m from Nabawi", price: 120, rating: 4.3, stars: 4, type: "external", city: "Madinah", image: "https://images.unsplash.com/photo-1496417263034-38ec4f0b665a?w=600", description: "A great budget-friendly option in Madinah offering clean comfortable rooms.", amenities: ["Free WiFi", "Restaurant", "24hr reception"] },
  { id: "7", name: "Fairmont Makkah Clock Royal", distance: "50m from Haram", price: 850, rating: 4.9, stars: 5, type: "ours", city: "Makkah", image: "https://images.unsplash.com/photo-1445019980597-93fa8acb246c?w=600", description: "The iconic clock tower hotel offering the most prestigious address in Makkah.", amenities: ["Kaaba view", "Multiple restaurants", "Spa", "Pool", "Butler service", "Free WiFi"] },
  { id: "8", name: "Raffles Makkah Palace", distance: "100m from Haram", price: 650, rating: 4.8, stars: 5, type: "external", city: "Makkah", image: "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=600", description: "Ultra-luxury hotel with direct views of the Kaaba.", amenities: ["Kaaba view", "Free WiFi", "Spa", "Fine dining", "Concierge"] },
  { id: "9", name: "Conrad Makkah", distance: "200m from Haram", price: 420, rating: 4.7, stars: 5, type: "ours", city: "Makkah", image: "https://images.unsplash.com/photo-1444201983204-c43cbd584d93?w=600", description: "A modern luxury hotel offering elegant rooms and excellent service near Masjid Al-Haram.", amenities: ["Free WiFi", "Breakfast", "Fitness center", "Spa", "Room service"] },
  { id: "10", name: "Swissotel Al Maqam", distance: "80m from Haram", price: 380, rating: 4.8, stars: 5, type: "ours", city: "Makkah", image: "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=600", description: "Ideally located within the Abraj Al Bait complex, offering stunning views and easy access to Masjid Al-Haram.", amenities: ["Free WiFi", "Breakfast", "Multiple restaurants", "Spa", "Prayer room"] },
  { id: "11", name: "Hilton Suites Makkah", distance: "150m from Haram", price: 280, rating: 4.7, stars: 5, type: "ours", city: "Makkah", image: "https://images.unsplash.com/photo-1454496522488-7a8e488e8606?w=600", description: "Spacious suites perfect for families, just steps from Masjid Al-Haram.", amenities: ["Free WiFi", "Kitchenette", "Family rooms", "Breakfast", "Shuttle"] },
  { id: "12", name: "Le Meridien Towers", distance: "300m from Haram", price: 220, rating: 4.5, stars: 4, type: "external", city: "Makkah", image: "https://images.unsplash.com/photo-1445991842772-097fea258e7b?w=600", description: "A stylish hotel offering contemporary rooms and great facilities.", amenities: ["Free WiFi", "Restaurant", "Fitness center", "Business center"] },
  { id: "13", name: "Al Kiswah Towers", distance: "900m from Haram", price: 75, rating: 4.1, stars: 3, type: "external", city: "Makkah", image: "https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=600", description: "An affordable option for budget-conscious pilgrims.", amenities: ["Free WiFi", "Restaurant", "24hr reception"] },
  { id: "14", name: "Dar Al Tawhid Intercontinental", distance: "1.2km from Haram", price: 95, rating: 4.2, stars: 3, type: "external", city: "Makkah", image: "https://images.unsplash.com/photo-1584132967334-10e028bd69f7?w=600", description: "A well-priced hotel offering good facilities for pilgrims on a budget.", amenities: ["Free WiFi", "Restaurant", "Parking"] },
  { id: "15", name: "Al Shohada Hotel", distance: "800m from Haram", price: 85, rating: 4.0, stars: 3, type: "ours", city: "Madinah", image: "https://images.unsplash.com/photo-1590490360182-c33d57733427?w=600", description: "A budget-friendly option managed by our team offering reliable service.", amenities: ["Free WiFi", "Breakfast", "24hr reception"] },
  { id: "16", name: "Pullman Zamzam Makkah", distance: "400m from Haram", price: 310, rating: 4.6, stars: 5, type: "ours", city: "Madinah", image: "https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=600", description: "A premium family-friendly hotel offering spacious rooms.", amenities: ["Family rooms", "Free WiFi", "Pool", "Kids area", "Multiple restaurants"] },
  { id: "17", name: "Movenpick Hotel Makkah", distance: "600m from Haram", price: 250, rating: 4.5, stars: 5, type: "external", city: "Makkah", image: "https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?w=600", description: "A popular choice for families with spacious rooms and great amenities.", amenities: ["Free WiFi", "Family rooms", "Restaurant", "Fitness center"] },
  { id: "18", name: "Millennium Makkah", distance: "700m from Nabawi", price: 180, rating: 4.3, stars: 4, type: "ours", city: "Madinah", image: "https://images.unsplash.com/photo-1595576508898-0ad5c879a061?w=600", description: "A comfortable hotel in Madinah offering modern rooms.", amenities: ["Free WiFi", "Restaurant", "Family rooms", "Prayer area"] },
  { id: "19", name: "Transcontinental Makkah", distance: "300m from Haram", price: 350, rating: 4.6, stars: 5, type: "ours", city: "Makkah", image: "https://images.unsplash.com/photo-1470219556762-1771e7f9427d?w=600", description: "A great hotel near the Haram offering modern rooms and excellent service.", amenities: ["Free WiFi", "Breakfast", "Room service"] },
]

export default function HotelDetailScreen() {
  const { id } = useLocalSearchParams()
  const router = useRouter()
  const { theme } = useTheme()
  const hotelId = Array.isArray(id) ? id[0] : id
  const hotel = allHotels.find((h) => h.id === hotelId)
  const [favorited, setFavorited] = useState(false)
  const { t } = useTranslation()

  useEffect(() => {
    if (!hotel) return
    const checkFav = async () => {
      const result = await isFavorite(hotel.id, "hotel")
      setFavorited(result)
    }
    checkFav()
  }, [hotel])

  const handleFavorite = async () => {
    if (!hotel) return
    const newState = await toggleFavorite(hotel.id, "hotel")
    setFavorited(newState ?? false)
  }

  if (!hotel) {
    return (
      <View style={[styles.notFound, { backgroundColor: theme.background }]}>
        <Text style={[styles.notFoundText, { color: theme.text }]}>Hotel not found</Text>
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

        {/* Hero Image — always full color */}
        <ImageBackground source={{ uri: hotel.image }} style={styles.hero}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={22} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.heartBtn} onPress={handleFavorite}>
            <Ionicons name={favorited ? "heart" : "heart-outline"} size={22} color={favorited ? "#C9A84C" : "#fff"} />
          </TouchableOpacity>
          <View style={styles.heroBadge}>
           <Text style={styles.heroBadgeText}>{hotel.type === "ours" ? t("ourPick") : t("external")}</Text>
          </View>
        </ImageBackground>

        <View style={styles.content}>

          {/* Name and rating */}
          <View style={styles.nameRow}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.hotelName, { color: theme.text }]}>{hotel.name}</Text>
              <Text style={[styles.hotelCity, { color: theme.textSecondary }]}>{hotel.city} · {hotel.distance}</Text>
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
            <Text style={[styles.price, { color: theme.text }]}>${hotel.price}</Text>
            <Text style={[styles.perNight, { color: theme.textSecondary }]}> {t("nightPrice")}</Text>
          </View>

          <View style={[styles.divider, { backgroundColor: theme.border }]} />

          {/* Description */}
          <Text style={[styles.sectionTitle, { color: theme.text }]}>{t("about")}</Text>
          <Text style={[styles.description, { color: theme.textSecondary }]}>{hotel.description}</Text>

          <View style={[styles.divider, { backgroundColor: theme.border }]} />

          {/* Amenities */}
          <Text style={[styles.sectionTitle, { color: theme.text }]}>{t("amenities")}</Text>
          <View style={styles.amenitiesGrid}>
            {hotel.amenities.map((item, index) => (
              <View key={index} style={styles.amenityItem}>
                <Ionicons name="checkmark-circle" size={16} color="#C9A84C" />
                <Text style={[styles.amenityText, { color: theme.textSecondary }]}>{item}</Text>
              </View>
            ))}
          </View>

          <View style={[styles.divider, { backgroundColor: theme.border }]} />

          {/* Location */}
          <Text style={[styles.sectionTitle, { color: theme.text }]}>{t("location")}</Text>
          <View style={[styles.locationBox, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Ionicons name="location" size={18} color="#C9A84C" />
            <Text style={[styles.locationText, { color: theme.textSecondary }]}>{hotel.city}, Saudi Arabia · {hotel.distance}</Text>
          </View>

          {/* Directions button */}
          <TouchableOpacity
            style={styles.directionsBtn}
            onPress={() => Linking.openURL(`https://maps.google.com/?q=${hotel.name}, ${hotel.city}, Saudi Arabia`)}
          >
            <Ionicons name="navigate" size={18} color="#fff" />
            <Text style={styles.directionsBtnText}>{t("getDirections")}</Text>
          </TouchableOpacity>

        </View>
      </ScrollView>

      {/* Bottom booking bar — always white/navy */}
      <View style={[styles.bookingBar, { backgroundColor: theme.card, borderTopColor: theme.border }]}>
        <View>
          <Text style={[styles.bookingPrice, { color: theme.text }]}>${hotel.price}<Text style={[styles.bookingNight, { color: theme.textSecondary }]}> {t("nightPrice")}</Text></Text>
          <Text style={styles.bookingRating}>★ {hotel.rating} · {hotel.stars} {t("star")}</Text>
        </View>
        {hotel.type === "ours" ? (
          <TouchableOpacity
            style={styles.bookBtn}
            onPress={() => router.push({ pathname: "/booking", params: { hotelName: hotel.name, hotelCity: hotel.city, hotelPrice: String(hotel.price) } })}
          >
            <Text style={styles.bookBtnText}>{t("bookNow")}</Text>
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
  screen: { flex: 1 },
  notFound: { flex: 1, alignItems: "center", justifyContent: "center" },
  notFoundText: { fontSize: 18 },
  backLink: { color: "#C9A84C", marginTop: 10 },
  hero: { height: 300, justifyContent: "flex-end", padding: 16 },
  backBtn: { position: "absolute", top: 55, left: 16, backgroundColor: "rgba(0,0,0,0.3)", borderRadius: 20, padding: 8 },
  heartBtn: { position: "absolute", top: 55, right: 16, backgroundColor: "rgba(0,0,0,0.3)", borderRadius: 20, padding: 8 },
  heroBadge: { backgroundColor: "rgba(201,168,76,0.9)", alignSelf: "flex-start", paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20 },
  heroBadgeText: { color: "#1E3A5F", fontSize: 12, fontWeight: "bold" },
  content: { padding: 20 },
  nameRow: { flexDirection: "row", alignItems: "flex-start", marginBottom: 6 },
  hotelName: { fontSize: 22, fontWeight: "bold", flex: 1 },
  hotelCity: { fontSize: 13, marginTop: 4 },
  ratingBox: { backgroundColor: "#1E3A5F", borderRadius: 10, padding: 8, alignItems: "center", flexDirection: "row", gap: 2 },
  ratingNum: { color: "#fff", fontSize: 14, fontWeight: "bold" },
  ratingStar: { color: "#C9A84C", fontSize: 14 },
  stars: { color: "#C9A84C", fontSize: 16, marginBottom: 12 },
  priceRow: { flexDirection: "row", alignItems: "baseline", marginBottom: 4 },
  price: { fontSize: 26, fontWeight: "bold" },
  perNight: { fontSize: 14 },
  divider: { height: 0.5, marginVertical: 20 },
  sectionTitle: { fontSize: 17, fontWeight: "bold", marginBottom: 10 },
  description: { fontSize: 14, lineHeight: 22 },
  amenitiesGrid: { gap: 10 },
  amenityItem: { flexDirection: "row", alignItems: "center", gap: 8 },
  amenityText: { fontSize: 14 },
  locationBox: { flexDirection: "row", alignItems: "center", gap: 8, padding: 14, borderRadius: 12, borderWidth: 0.5 },
  locationText: { fontSize: 14 },
  directionsBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: "#2C5F8A", borderRadius: 12, padding: 14, marginTop: 12 },
  directionsBtnText: { color: "#fff", fontSize: 15, fontWeight: "bold" },
  bookingBar: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 20, borderTopWidth: 0.5, paddingBottom: 34 },
  bookingPrice: { fontSize: 20, fontWeight: "bold" },
  bookingNight: { fontSize: 13, fontWeight: "normal" },
  bookingRating: { fontSize: 12, color: "#C9A84C", marginTop: 2 },
  bookBtn: { backgroundColor: "#1E3A5F", paddingHorizontal: 28, paddingVertical: 14, borderRadius: 25 },
  bookBtnText: { color: "#fff", fontSize: 15, fontWeight: "bold" },
  viewBtn: { backgroundColor: "#C9A84C", paddingHorizontal: 20, paddingVertical: 14, borderRadius: 25 },
  viewBtnText: { color: "#1E3A5F", fontSize: 13, fontWeight: "bold" },
})