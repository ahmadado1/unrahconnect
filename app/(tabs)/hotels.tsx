import { useTheme } from "@/context/themeContext";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { ImageBackground, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { supabase, toggleFavorite } from "../../lib/supabase";

type Hotel = {
  id: string;
  name: string;
  distance: string;
  price: number;
  rating: number;
  stars: number;
  type: "ours" | "external";
  city: "Makkah" | "Madinah";
  image: string;
};

export default function HotelsScreen() {
  const [activeFilter, setActiveFilter] = useState("All");
  const [favoriteHotelIds, setFavoriteHotelIds] = useState<Set<string>>(new Set())
  const [searchQuery, setSearchQuery] = useState("")
  const { theme, isDark } = useTheme()
  const insets = useSafeAreaInsets()
  const { t } = useTranslation()

  const filters = ["All", "Makkah", "Madinah"]

  const loadFavoriteHotels = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setFavoriteHotelIds(new Set()); return }
    const { data, error } = await supabase.from("favorites").select("item_id").eq("user_id", user.id).eq("item_type", "hotel")
    if (error) { console.error("loadFavoriteHotels error:", error.message); return }
    setFavoriteHotelIds(new Set((data ?? []).map((row) => String(row.item_id))))
  }

  useFocusEffect(useCallback(() => { loadFavoriteHotels() }, []))

  const makkahHotels: Hotel[] = [
    { id: "1", name: "Hilton Suites Makkah", distance: "500m from Haram", price: 180, rating: 4.7, stars: 5, type: "ours", city: "Makkah", image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600" },
    { id: "2", name: "Swissotel Makkah", distance: "100m from Haram", price: 320, rating: 4.9, stars: 5, type: "ours", city: "Makkah", image: "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=600" },
    { id: "3", name: "Marriott Makkah", distance: "800m from Haram", price: 150, rating: 4.5, stars: 4, type: "external", city: "Makkah", image: "https://images.unsplash.com/photo-1582719508461-905c673771fd?w=600" },
  ];
  const madinahHotels: Hotel[] = [
    { id: "4", name: "Anwar Al Madinah", distance: "200m from Nabawi", price: 240, rating: 4.9, stars: 5, type: "ours", city: "Madinah", image: "https://images.unsplash.com/photo-1455587734955-081b22074882?w=600" },
    { id: "5", name: "Pullman Madinah", distance: "400m from Nabawi", price: 190, rating: 4.6, stars: 5, type: "external", city: "Madinah", image: "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=600" },
    { id: "6", name: "Al Rawda Royal Inn", distance: "600m from Nabawi", price: 120, rating: 4.3, stars: 4, type: "external", city: "Madinah", image: "https://images.unsplash.com/photo-1496417263034-38ec4f0b665a?w=600" },
  ];
  const kaabaViewHotels: Hotel[] = [
    { id: "7", name: "Fairmont Makkah Clock Royal", distance: "50m from Haram", price: 850, rating: 4.9, stars: 5, type: "ours", city: "Makkah", image: "https://images.unsplash.com/photo-1445019980597-93fa8acb246c?w=600" },
    { id: "8", name: "Raffles Makkah Palace", distance: "100m from Haram", price: 650, rating: 4.8, stars: 5, type: "external", city: "Makkah", image: "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=600" },
    { id: "9", name: "Conrad Makkah", distance: "200m from Haram", price: 420, rating: 4.7, stars: 5, type: "ours", city: "Makkah", image: "https://images.unsplash.com/photo-1444201983204-c43cbd584d93?w=600" },
    { id: "19", name: "Transcontinental Makkah", distance: "300m from Haram", price: 350, rating: 4.6, stars: 5, type: "ours", city: "Makkah", image: "https://images.unsplash.com/photo-1470219556762-1771e7f9427d?w=600" },
  ];
  const closestHotels: Hotel[] = [
    { id: "10", name: "Swissotel Al Maqam", distance: "80m from Haram", price: 380, rating: 4.8, stars: 5, type: "ours", city: "Makkah", image: "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=600" },
    { id: "11", name: "Hilton Suites Makkah", distance: "150m from Haram", price: 280, rating: 4.7, stars: 5, type: "ours", city: "Makkah", image: "https://images.unsplash.com/photo-1454496522488-7a8e488e8606?w=600" },
    { id: "12", name: "Le Meridien Towers", distance: "300m from Haram", price: 220, rating: 4.5, stars: 4, type: "external", city: "Madinah", image: "https://images.unsplash.com/photo-1445991842772-097fea258e7b?w=600" },
  ];
  const budgetHotels: Hotel[] = [
    { id: "13", name: "Al Kiswah Towers", distance: "900m from Haram", price: 75, rating: 4.1, stars: 3, type: "external", city: "Madinah", image: "https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=600" },
    { id: "14", name: "Dar Al Tawhid Intercontinental", distance: "1.2km from Haram", price: 95, rating: 4.2, stars: 3, type: "external", city: "Makkah", image: "https://images.unsplash.com/photo-1584132967334-10e028bd69f7?w=600" },
    { id: "15", name: "Al Shohada Hotel", distance: "800m from Haram", price: 85, rating: 4.0, stars: 3, type: "ours", city: "Madinah", image: "https://images.unsplash.com/photo-1590490360182-c33d57733427?w=600" },
  ];
  const familyHotels: Hotel[] = [
    { id: "16", name: "Pullman Zamzam Makkah", distance: "400m from Haram", price: 310, rating: 4.6, stars: 5, type: "ours", city: "Makkah", image: "https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=600" },
    { id: "17", name: "Movenpick Hotel Makkah", distance: "600m from Haram", price: 250, rating: 4.5, stars: 5, type: "external", city: "Makkah", image: "https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?w=600" },
    { id: "18", name: "Millennium Makkah", distance: "700m from Haram", price: 180, rating: 4.3, stars: 4, type: "ours", city: "Makkah", image: "https://images.unsplash.com/photo-1595576508898-0ad5c879a061?w=600" },
  ];

  const filterHotels = (hotels: Hotel[]) => {
    return hotels.filter((hotel) => {
      const matchesCity = activeFilter === "All" || hotel.city === activeFilter
      const matchesSearch = hotel.name.toLowerCase().includes(searchQuery.toLowerCase())
      return matchesCity && matchesSearch
    });
  };

  const fiveStarHotels: Hotel[] = [
    ...makkahHotels, ...madinahHotels, ...kaabaViewHotels, ...familyHotels,
  ].filter((hotel, index, list) => hotel.stars === 5 && list.findIndex((h) => h.id === hotel.id) === index);

  function HotelCard({ hotel }: { hotel: Hotel }) {
    const router = useRouter();
    const isFavorited = favoriteHotelIds.has(hotel.id)

    const handleFavoritePress = async () => {
      const newState = await toggleFavorite(hotel.id, "hotel")
      setFavoriteHotelIds((prev) => {
        const next = new Set(prev)
        if (newState) next.add(hotel.id)
        else next.delete(hotel.id)
        return next
      })
    }

    return (
      <TouchableOpacity
        style={[cardStyles.card, { backgroundColor: theme.card, borderColor: theme.border }]}
        onPress={() => router.push({ pathname: "/hotel-detail/[id]", params: { id: hotel.id } })}
      >
        <ImageBackground source={{ uri: hotel.image }} style={cardStyles.image} imageStyle={{ borderTopLeftRadius: 16, borderTopRightRadius: 16 }}>
          <View style={cardStyles.badge}>
            <Text style={cardStyles.badgeText}>{hotel.type === "ours" ? t("ourPick") : t("external")}</Text>
          </View>
          <TouchableOpacity style={cardStyles.heart} onPress={(e) => { e.stopPropagation(); handleFavoritePress() }}>
            <Ionicons name={isFavorited ? "heart" : "heart-outline"} size={18} color={isFavorited ? "#C9A84C" : "#fff"} />
          </TouchableOpacity>
          <Text style={cardStyles.imageLabel}>{hotel.city} · {hotel.distance}</Text>
        </ImageBackground>
        <View style={cardStyles.info}>
          <Text style={[cardStyles.name, { color: theme.text }]}>{hotel.name}</Text>
          <Text style={[cardStyles.meta, { color: theme.textSecondary }]}>{"★".repeat(hotel.stars)} · {hotel.distance}</Text>
          <View style={cardStyles.footer}>
            <View>
              <Text style={[cardStyles.price, { color: theme.text }]}>${hotel.price} {t("perNight")}</Text>
              <Text style={cardStyles.rating}>★ {hotel.rating}</Text>
            </View>
            <TouchableOpacity style={[cardStyles.btn, hotel.type === "external" && cardStyles.btnExternal]}>
              <Text style={[cardStyles.btnText, hotel.type === "external" && cardStyles.btnTextExternal]}>
                {hotel.type === "ours" ? t("bookNow") : t("viewExternal")}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  const renderSection = (title: string, hotels: Hotel[]) => {
    const filtered = filterHotels(hotels);
    if (filtered.length === 0) return null;
    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>{title}</Text>
          <TouchableOpacity>
          <Text style={styles.seeAll}>{t("seeAll")}</Text>
          </TouchableOpacity>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingHorizontal: 16 }}>
          {filtered.map((hotel) => <HotelCard key={hotel.id} hotel={hotel} />)}
        </ScrollView>
      </View>
    );
  };

  const recommended: Hotel[] = [makkahHotels[1], kaabaViewHotels[1], madinahHotels[1]].filter((h): h is Hotel => Boolean(h));

  return (
    <View style={[styles.screen, { backgroundColor: theme.background }]}>
      <StatusBar style="light" />
      {/* Dynamic island — always navy */}
      

      <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>

        {/* Header — always navy */}
        <View style={[styles.header, { paddingTop: insets.top }]}>
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.title}>{t("hotels")}</Text>
              <Text style={styles.subtitle}>{t("findPerfectStay")}</Text>
            </View>
            <TouchableOpacity style={styles.iconBtn}>
              <Ionicons name="options-outline" size={22} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* Search bar */}
          <View style={styles.searchBar}>
            <Ionicons name="search" size={16} color="rgba(255,255,255,0.5)" />
            <TextInput
              placeholder={t("searchHotels")}
              placeholderTextColor="rgba(255,255,255,0.45)"
              style={styles.searchInput}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          {/* Filter pills */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pillsRow} contentContainerStyle={{ gap: 8 }}>
            {filters.map((filter, index) => {
              const labels = [t("all"), t("makkah"), t("madinah")]
              return (
                <TouchableOpacity
                  key={filter}
                  style={[styles.pill, activeFilter === filter && styles.pillActive]}
                  onPress={() => setActiveFilter(filter)}
                >
                  <Text style={[styles.pillText, activeFilter === filter && styles.pillTextActive]}>
                    {labels[index]}
                  </Text>
                </TouchableOpacity>
              )
            })}
         </ScrollView>
        </View>

        {renderSection(t("recommended"), recommended)}
        {renderSection(t("makkahTopPicks"), makkahHotels)}
        {renderSection(t("fiveStarHotels"), fiveStarHotels)}
        {renderSection(t("kaabaView"), kaabaViewHotels)}
        {renderSection(t("closestHaram"), closestHotels)}
        {renderSection(t("budgetFriendly"), budgetHotels)}
        {renderSection(t("familyRooms"), familyHotels)}
        {renderSection(t("madinahPicks"), madinahHotels)}
        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const cardStyles = StyleSheet.create({
  card: { width: 260, borderRadius: 16, overflow: "hidden", borderWidth: 0.5 },
  image: { height: 180, justifyContent: "flex-end", padding: 10, position: "relative" },
  badge: { position: "absolute", top: 10, left: 10, backgroundColor: "rgba(201,168,76,0.9)", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  badgeText: { color: "#1E3A5F", fontSize: 11, fontWeight: "bold" },
  heart: { position: "absolute", top: 10, right: 10, backgroundColor: "rgba(0,0,0,0.3)", borderRadius: 20, padding: 6 },
  imageLabel: { color: "rgba(255,255,255,0.8)", fontSize: 11 },
  info: { padding: 14 },
  name: { fontSize: 15, fontWeight: "bold", marginBottom: 4 },
  meta: { fontSize: 12, marginBottom: 10 },
  footer: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  price: { fontSize: 14, fontWeight: "bold" },
  rating: { color: "#C9A84C", fontSize: 12 },
  btn: { backgroundColor: "#1E3A5F", paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  btnExternal: { backgroundColor: "#C9A84C" },
  btnText: { color: "#fff", fontSize: 12, fontWeight: "bold" },
  btnTextExternal: { color: "#1E3A5F" },
});

const styles = StyleSheet.create({
  screen: { flex: 1 },
  safeTop: { backgroundColor: "#1E3A5F" },
  header: { backgroundColor: "#1E3A5F", paddingBottom: 16 },
  headerTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 },
  title: { color: "#fff", fontSize: 26, fontWeight: "bold" },
  subtitle: { color: "#C9A84C", fontSize: 13, marginTop: 2 },
  iconBtn: { width: 40, height: 40, borderRadius: 10, backgroundColor: "rgba(255,255,255,0.12)", alignItems: "center", justifyContent: "center" },
  body: { flex: 1 },
  section: { marginTop: 24 },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, marginBottom: 12 },
  sectionTitle: { fontSize: 17, fontWeight: "bold" },
  seeAll: { color: "#C9A84C", fontSize: 13 },
  searchBar: { flexDirection: "row", alignItems: "center", backgroundColor: "rgba(255,255,255,0.12)", marginHorizontal: 16, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, gap: 8, marginBottom: 14 },
  searchInput: { flex: 1, color: "#fff", fontSize: 14 },
  pillsRow: { paddingHorizontal: 16 },
  pill: { paddingHorizontal: 18, paddingVertical: 7, borderRadius: 20, backgroundColor: "rgba(255,255,255,0.12)" },
  pillActive: { backgroundColor: "#C9A84C" },
  pillText: { color: "rgba(255,255,255,0.7)", fontSize: 13, fontWeight: "500" },
  pillTextActive: { color: "#1E3A5F", fontWeight: "bold" },
});