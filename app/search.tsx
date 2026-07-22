import { useTheme } from "@/context/themeContext"
import { HOTELS } from "@/lib/hotels"
import { RESTAURANTS } from "@/lib/restaurants"
import { Ionicons } from "@expo/vector-icons"
import { useRouter } from "expo-router"
import { StatusBar } from "expo-status-bar"
import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { Linking, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"

type SearchResult = {
  id: string
  title: string
  subtitle: string
  emoji: string
  category: string
  action: "navigate" | "link"
  target: string
}

const CATEGORY_COLORS: Record<string, string> = {
  Maps: "#1E3A5F",
  Services: "#2D6A4F",
  Hotels: "#1B4F9C",
  Restaurants: "#C9A84C",
  Flights: "#0770E3",
  Agents: "#1E3A5F",
  Transport: "#5C3D00",
  Shopping: "#7B2FBE",
  Guide: "#C9A84C",
  Quran: "#1E3A5F",
  Foundation: "#E24B4A",
  Features: "#555",
}

function buildStaticItems(t: (key: string) => string): SearchResult[] {
  return [
    // Maps
    { id: "haram", title: "Masjid Al-Haram", subtitle: "Holy Mosque · Makkah", emoji: "🕋", category: "Maps", action: "navigate", target: "/maps/haram" },
    { id: "nabawi", title: "Masjid Nabawi", subtitle: "Prophet's Mosque · Madinah", emoji: "🕌", category: "Maps", action: "navigate", target: "/maps/nabawi" },
    { id: "mina", title: "Mina", subtitle: "Hajj Site · Makkah", emoji: "⛺", category: "Maps", action: "navigate", target: "/maps/mina" },
    { id: "arafah", title: "Mount Arafah", subtitle: "Hajj Site · Makkah", emoji: "🏔️", category: "Maps", action: "navigate", target: "/maps/arafah" },
    { id: "zamzam", title: "Zamzam Well", subtitle: "Holy Water · Makkah", emoji: "💧", category: "Maps", action: "navigate", target: "/maps/zamzam" },
    { id: "safa", title: "Safa & Marwah", subtitle: "Sa'i Location · Makkah", emoji: "🚶", category: "Maps", action: "navigate", target: "/maps/safa" },
    { id: "hospitals", title: "Hospitals", subtitle: "Medical Centers · Makkah & Madinah", emoji: "🏥", category: "Maps", action: "navigate", target: "/maps/hospital-makkah" },
    { id: "lost", title: "Lost & Found", subtitle: "Pilgrim Support Centers", emoji: "🔍", category: "Maps", action: "navigate", target: "/maps/lost-found" },

    // Services
    { id: "hotels", title: t("hotels"), subtitle: t("hotelsSub"), emoji: "🏨", category: "Services", action: "navigate", target: "/hotels" },
    { id: "restaurants", title: t("restaurants"), subtitle: t("restaurantsSub"), emoji: "🍽️", category: "Services", action: "navigate", target: "/restaurants" },
    { id: "agents", title: t("findAgent"), subtitle: t("findAgentSub"), emoji: "🤝", category: "Services", action: "navigate", target: "/travel-agents" },
    { id: "favorites", title: t("favorites"), subtitle: "Saved hotels & restaurants", emoji: "❤️", category: "Services", action: "navigate", target: "/favorites" },
    { id: "saudia", title: "Saudia Airlines", subtitle: "Official Saudi carrier — Jeddah & Madinah", emoji: "✈️", category: "Flights", action: "navigate", target: "/flight-detail/saudia" },
    { id: "kayak", title: "Kayak", subtitle: "Compare hundreds of flight sites", emoji: "✈️", category: "Flights", action: "navigate", target: "/flight-detail/kayak" },
    { id: "skyscanner", title: "Skyscanner", subtitle: "Find the best flight deals worldwide", emoji: "✈️", category: "Flights", action: "navigate", target: "/flight-detail/skyscanner" },
    { id: "travel-agents-ng", title: "Travel Agents · Nigeria", subtitle: "46 trusted Umrah & Hajj agents", emoji: "🇳🇬", category: "Agents", action: "navigate", target: "/travel-agents/nigeria" },

    // Transport
    { id: "haramain-makkah", title: t("makkahStation"), subtitle: t("makkahStationAddress"), emoji: "🚄", category: "Transport", action: "navigate", target: "/haramain/makkah" },
    { id: "haramain-madinah", title: t("madinahStation"), subtitle: t("madinahStationAddress"), emoji: "🚄", category: "Transport", action: "navigate", target: "/haramain/madinah" },
    { id: "saptco", title: t("saptcoBuses"), subtitle: t("saptcoSub"), emoji: "🚌", category: "Transport", action: "link", target: "https://www.saptco.com.sa" },
    { id: "uber", title: t("uber"), subtitle: t("uberSub"), emoji: "🚗", category: "Transport", action: "link", target: "https://www.uber.com" },

    // Shopping
    { id: "abraj", title: t("abrajMall"), subtitle: t("abrajSub"), emoji: "🛍️", category: "Shopping", action: "link", target: "https://maps.google.com/?q=Abraj+Al+Bait+Mall+Makkah" },
    { id: "souq", title: t("souqZal"), subtitle: t("souqZalSub"), emoji: "🪬", category: "Shopping", action: "link", target: "https://maps.google.com/?q=Souq+Al+Zal+Makkah" },
    { id: "madinah-mall", title: t("madinahMall"), subtitle: t("madinahMallSub"), emoji: "🏬", category: "Shopping", action: "link", target: "https://maps.google.com/?q=Madinah+Mall+Saudi+Arabia" },
    { id: "ansar", title: t("ansarMall"), subtitle: t("ansarMallSub"), emoji: "🛒", category: "Shopping", action: "link", target: "https://maps.google.com/?q=Ansar+Mall+Madinah" },

    // Guide
    { id: "umrah", title: t("umrahGuide"), subtitle: "Step by step Umrah phases", emoji: "🕋", category: "Guide", action: "navigate", target: "/umrah-guide" },
    { id: "hajj", title: t("hajj"), subtitle: "Complete Hajj rituals", emoji: "☪️", category: "Guide", action: "navigate", target: "/hajj" },
    { id: "ai-guide", title: "AI Guide", subtitle: "Ask Umrah & Hajj questions", emoji: "🤖", category: "Guide", action: "navigate", target: "/AIGuideScreen" },
    { id: "ihram", title: "Ihram", subtitle: "Umrah phase 1", emoji: "🤍", category: "Guide", action: "navigate", target: "/umrah/1" },
    { id: "tawaf", title: "Tawaf", subtitle: "Circling the Kaaba", emoji: "🔄", category: "Guide", action: "navigate", target: "/umrah/4" },
    { id: "sai", title: "Sa'i", subtitle: "Between Safa and Marwah", emoji: "🚶", category: "Guide", action: "navigate", target: "/umrah/5" },
    { id: "halq", title: "Halq / Taqsir", subtitle: "Shaving or cutting hair", emoji: "✂️", category: "Guide", action: "navigate", target: "/umrah/6" },

    // Quran
    { id: "quran", title: t("quran"), subtitle: "Read 114 surahs", emoji: "📖", category: "Quran", action: "navigate", target: "/quran" },
    { id: "al-fatiha", title: "Al-Fatiha", subtitle: "Surah 1 · The Opening", emoji: "📖", category: "Quran", action: "navigate", target: "/quran/1" },
    { id: "al-baqarah", title: "Al-Baqarah", subtitle: "Surah 2 · The Cow", emoji: "📖", category: "Quran", action: "navigate", target: "/quran/2" },
    { id: "al-kahf", title: "Al-Kahf", subtitle: "Surah 18 · The Cave", emoji: "📖", category: "Quran", action: "navigate", target: "/quran/18" },
    { id: "yasin", title: "Ya-Sin", subtitle: "Surah 36", emoji: "📖", category: "Quran", action: "navigate", target: "/quran/36" },
    { id: "al-mulk", title: "Al-Mulk", subtitle: "Surah 67", emoji: "📖", category: "Quran", action: "navigate", target: "/quran/67" },

    // Features
    { id: "prayer", title: t("prayerTimes"), subtitle: "Daily salah schedule", emoji: "🕌", category: "Features", action: "navigate", target: "/(tabs)" },
    { id: "calendar", title: t("islamicCalendarTitle"), subtitle: "Key Islamic dates", emoji: "📅", category: "Features", action: "navigate", target: "/islamic-calendar" },
    { id: "settings", title: t("settings"), subtitle: t("preferences"), emoji: "⚙️", category: "Features", action: "navigate", target: "/settings" },
    { id: "profile", title: t("profile"), subtitle: "Account & personal info", emoji: "👤", category: "Features", action: "navigate", target: "/profile" },
    { id: "maidabo", title: "Maidabo Foundation", subtitle: "Donate · Support Niger & Nigeria", emoji: "❤️", category: "Foundation", action: "link", target: "https://maidabo.com" },
  ]
}

export default function SearchScreen() {
  const router = useRouter()
  const { theme } = useTheme()
  const insets = useSafeAreaInsets()
  const { t } = useTranslation()
  const [query, setQuery] = useState("")

  const allItems = useMemo(() => {
    const staticItems = buildStaticItems(t)
    const hotelItems: SearchResult[] = HOTELS.map(hotel => ({
      id: `hotel-${hotel.id}`,
      title: hotel.name,
      subtitle: `${hotel.city} · ${hotel.distanceLabel}`,
      emoji: "🏨",
      category: "Hotels",
      action: "navigate" as const,
      target: `/hotel-detail/${hotel.id}`,
    }))
    const restaurantItems: SearchResult[] = RESTAURANTS.map(restaurant => ({
      id: `restaurant-${restaurant.id}`,
      title: restaurant.name,
      subtitle: `${restaurant.city} · ${restaurant.cuisine} · ${restaurant.distance}`,
      emoji: "🍽️",
      category: "Restaurants",
      action: "navigate" as const,
      target: `/restaurant-detail/${restaurant.id}`,
    }))
    return [...staticItems, ...hotelItems, ...restaurantItems]
  }, [t])

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (q.length < 2) return []
    return allItems.filter(
      item =>
        item.title.toLowerCase().includes(q) ||
        item.subtitle.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q)
    )
  }, [allItems, query])

  const grouped = results.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = []
    acc[item.category].push(item)
    return acc
  }, {} as Record<string, SearchResult[]>)

  const handlePress = (item: SearchResult) => {
    if (item.action === "link") {
      Linking.openURL(item.target)
    } else {
      router.push(item.target as any)
    }
  }

  return (
    <View style={[styles.screen, { backgroundColor: theme.background }]}>
      <StatusBar style="light" />

      <View style={[styles.header, { paddingTop: insets.top }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color="#fff" />
        </TouchableOpacity>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={16} color="rgba(255,255,255,0.5)" />
          <TextInput
            style={styles.searchInput}
            placeholder={t("searchSub")}
            placeholderTextColor="rgba(255,255,255,0.4)"
            value={query}
            onChangeText={setQuery}
            autoFocus
            autoCapitalize="none"
            returnKeyType="search"
          />
          {query ? (
            <TouchableOpacity onPress={() => setQuery("")}>
              <Ionicons name="close-circle" size={16} color="rgba(255,255,255,0.4)" />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {query.trim().length < 2 ? (
          <View style={styles.emptyState}>
            <Text style={{ fontSize: 48, marginBottom: 16 }}>🔍</Text>
            <Text style={[styles.emptyTitle, { color: theme.text }]}>{t("search")}</Text>
            <Text style={[styles.emptySub, { color: theme.textSecondary }]}>
              {t("searchSub")}
            </Text>

            <View style={styles.quickGrid}>
              {[
                { label: "Maps", emoji: "🗺️", q: "masjid" },
                { label: "Hotels", emoji: "🏨", q: "fairmont" },
                { label: "Food", emoji: "🍽️", q: "al baik" },
                { label: "Guide", emoji: "🕋", q: "umrah" },
                { label: "Quran", emoji: "📖", q: "fatiha" },
                { label: "Train", emoji: "🚄", q: "haramain" },
              ].map(cat => (
                <TouchableOpacity
                  key={cat.label}
                  style={[styles.quickCard, { backgroundColor: theme.card, borderColor: theme.border }]}
                  onPress={() => setQuery(cat.q)}
                >
                  <Text style={{ fontSize: 24, marginBottom: 6 }}>{cat.emoji}</Text>
                  <Text style={[styles.quickLabel, { color: theme.text }]}>{cat.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ) : results.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={{ fontSize: 48, marginBottom: 16 }}>😔</Text>
            <Text style={[styles.emptyTitle, { color: theme.text }]}>No results found</Text>
            <Text style={[styles.emptySub, { color: theme.textSecondary }]}>
              Try "Makkah", "Al Baik", "Fairmont", "Tawaf", or "Quran"
            </Text>
          </View>
        ) : (
          <View style={styles.results}>
            <Text style={[styles.resultsCount, { color: theme.textSecondary }]}>
              {results.length} results for "{query}"
            </Text>
            {Object.entries(grouped).map(([category, items]) => (
              <View key={category} style={styles.group}>
                <View style={styles.groupHeader}>
                  <View style={[styles.groupDot, { backgroundColor: CATEGORY_COLORS[category] || "#888" }]} />
                  <Text style={[styles.groupTitle, { color: theme.textSecondary }]}>{category}</Text>
                </View>
                {items.map(item => (
                  <TouchableOpacity
                    key={item.id}
                    style={[styles.resultCard, { backgroundColor: theme.card, borderColor: theme.border }]}
                    onPress={() => handlePress(item)}
                  >
                    <View style={[styles.resultEmoji, { backgroundColor: `${CATEGORY_COLORS[item.category]}15` }]}>
                      <Text style={{ fontSize: 20 }}>{item.emoji}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.resultTitle, { color: theme.text }]}>{item.title}</Text>
                      <Text style={[styles.resultSub, { color: theme.textSecondary }]} numberOfLines={1}>
                        {item.subtitle}
                      </Text>
                    </View>
                    <Ionicons
                      name={item.action === "link" ? "open-outline" : "chevron-forward"}
                      size={16}
                      color="#C9A84C"
                    />
                  </TouchableOpacity>
                ))}
              </View>
            ))}
          </View>
        )}
        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    backgroundColor: "#1E3A5F",
    padding: 16,
    paddingBottom: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  backBtn: { backgroundColor: "rgba(255,255,255,0.15)", borderRadius: 20, padding: 6 },
  searchBar: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  searchInput: { flex: 1, color: "#fff", fontSize: 15 },

  emptyState: { alignItems: "center", paddingTop: 48, paddingHorizontal: 32 },
  emptyTitle: { fontSize: 18, fontWeight: "bold", marginBottom: 8 },
  emptySub: { fontSize: 13, textAlign: "center", lineHeight: 20, marginBottom: 32 },

  quickGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, justifyContent: "center" },
  quickCard: {
    width: "28%",
    borderRadius: 14,
    padding: 14,
    alignItems: "center",
    borderWidth: 0.5,
  },
  quickLabel: { fontSize: 12, fontWeight: "600" },

  results: { padding: 16 },
  resultsCount: { fontSize: 12, marginBottom: 16, fontWeight: "500" },
  group: { marginBottom: 20 },
  groupHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 },
  groupDot: { width: 8, height: 8, borderRadius: 4 },
  groupTitle: { fontSize: 11, fontWeight: "700", letterSpacing: 0.8, textTransform: "uppercase" },
  resultCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 14,
    borderWidth: 0.5,
    marginBottom: 8,
  },
  resultEmoji: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  resultTitle: { fontSize: 14, fontWeight: "600", marginBottom: 2 },
  resultSub: { fontSize: 12 },
})
