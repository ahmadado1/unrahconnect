import { useTheme } from "@/context/themeContext"
import { Ionicons } from "@expo/vector-icons"
import { useRouter } from "expo-router"
import { StatusBar } from "expo-status-bar"
import { useState } from "react"
import { Linking, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"

// ─── SEARCH DATA ─────────────────────────────────────────────────────────────

type SearchResult = {
  id: string
  title: string
  subtitle: string
  emoji: string
  category: string
  action: "navigate" | "link"
  target: string
}

const ALL_ITEMS: SearchResult[] = [
  // ── MAPS ──
  { id: "haram", title: "Masjid Al-Haram", subtitle: "Holy Mosque · Makkah", emoji: "🕋", category: "Maps", action: "navigate", target: "/maps/haram" },
  { id: "nabawi", title: "Masjid Nabawi", subtitle: "Prophet's Mosque · Madinah", emoji: "🕌", category: "Maps", action: "navigate", target: "/maps/nabawi" },
  { id: "mina", title: "Mina", subtitle: "Hajj Site · Makkah", emoji: "⛺", category: "Maps", action: "navigate", target: "/maps/mina" },
  { id: "arafah", title: "Mount Arafah", subtitle: "Hajj Site · Makkah", emoji: "🏔️", category: "Maps", action: "navigate", target: "/maps/arafah" },
  { id: "zamzam", title: "Zamzam Well", subtitle: "Holy Water · Makkah", emoji: "💧", category: "Maps", action: "navigate", target: "/maps/zamzam" },
  { id: "safa", title: "Safa & Marwah", subtitle: "Sa'i Location · Makkah", emoji: "🚶", category: "Maps", action: "navigate", target: "/maps/safa" },
  { id: "hospitals", title: "Hospitals", subtitle: "Medical Centers · Makkah & Madinah", emoji: "🏥", category: "Maps", action: "navigate", target: "/maps/hospital-makkah" },
  { id: "lost", title: "Lost & Found", subtitle: "Pilgrim Support Centers", emoji: "🔍", category: "Maps", action: "navigate", target: "/maps/lost-found" },

  // ── SERVICES ──
  { id: "hotels", title: "Hotels", subtitle: "Book hotels near Haram", emoji: "🏨", category: "Services", action: "navigate", target: "/hotels" },
  { id: "restaurants", title: "Restaurants", subtitle: "Food near holy sites", emoji: "🍽️", category: "Services", action: "navigate", target: "/restaurants" },
  { id: "agents", title: "Find an Agent", subtitle: "Browse travel agencies", emoji: "🏢", category: "Services", action: "navigate", target: "/agent" },
  { id: "haramain", title: "Haramain Railway", subtitle: "High speed train · Official site", emoji: "🚄", category: "Transport", action: "link", target: "https://www.hhr.com.sa" },
  { id: "saptco", title: "SAPTCO Buses", subtitle: "Saudi bus network", emoji: "🚌", category: "Transport", action: "link", target: "https://www.saptco.com.sa" },
  { id: "uber", title: "Uber", subtitle: "Ride booking", emoji: "🚗", category: "Transport", action: "link", target: "https://www.uber.com" },
  { id: "abraj", title: "Abraj Al-Bait Mall", subtitle: "Shopping · Makkah", emoji: "🛍️", category: "Shopping", action: "link", target: "https://maps.google.com/?q=Abraj+Al+Bait+Mall+Makkah" },
  { id: "souq", title: "Souq Al-Zal", subtitle: "Traditional market · Makkah", emoji: "🪬", category: "Shopping", action: "link", target: "https://maps.google.com/?q=Souq+Al+Zal+Makkah" },
  { id: "madinah-mall", title: "Madinah Mall", subtitle: "Shopping · Madinah", emoji: "🏬", category: "Shopping", action: "link", target: "https://maps.google.com/?q=Madinah+Mall+Saudi+Arabia" },
  { id: "ansar", title: "Ansar Mall", subtitle: "Shopping · Madinah", emoji: "🛒", category: "Shopping", action: "link", target: "https://maps.google.com/?q=Ansar+Mall+Madinah" },

  // ── GUIDE ──
  { id: "umrah", title: "Umrah Guide", subtitle: "Step by step Umrah phases", emoji: "🕋", category: "Guide", action: "navigate", target: "/umrah-guide" },
  { id: "hajj", title: "Hajj Guide", subtitle: "Complete Hajj rituals", emoji: "☪️", category: "Guide", action: "navigate", target: "/hajj" },
  { id: "ihram", title: "Ihram", subtitle: "Umrah phase 1 · Purification", emoji: "🤍", category: "Guide", action: "navigate", target: "/umrah-guide" },
  { id: "tawaf", title: "Tawaf", subtitle: "Circling the Kaaba 7 times", emoji: "🔄", category: "Guide", action: "navigate", target: "/umrah-guide" },
  { id: "sai", title: "Sa'i", subtitle: "Walking between Safa and Marwah", emoji: "🚶", category: "Guide", action: "navigate", target: "/umrah-guide" },
  { id: "halq", title: "Halq / Taqsir", subtitle: "Shaving or cutting hair", emoji: "✂️", category: "Guide", action: "navigate", target: "/umrah-guide" },
  { id: "wuquf", title: "Wuquf at Arafah", subtitle: "Hajj · Standing at Arafah", emoji: "🏔️", category: "Guide", action: "navigate", target: "/hajj" },
  { id: "muzdalifah", title: "Muzdalifah", subtitle: "Hajj · Night stay", emoji: "🌙", category: "Guide", action: "navigate", target: "/hajj" },
  { id: "jamarat", title: "Stoning the Jamarat", subtitle: "Hajj · Rami ritual", emoji: "🪨", category: "Guide", action: "navigate", target: "/hajj" },

  // ── QURAN ──
  { id: "quran", title: "Quran", subtitle: "Read 114 surahs", emoji: "📖", category: "Quran", action: "navigate", target: "/quran" },
  { id: "al-fatiha", title: "Al-Fatiha", subtitle: "Surah 1 · The Opening", emoji: "📖", category: "Quran", action: "navigate", target: "/quran" },
  { id: "al-baqarah", title: "Al-Baqarah", subtitle: "Surah 2 · The Cow", emoji: "📖", category: "Quran", action: "navigate", target: "/quran" },
  { id: "al-kahf", title: "Al-Kahf", subtitle: "Surah 18 · The Cave", emoji: "📖", category: "Quran", action: "navigate", target: "/quran" },
  { id: "yasin", title: "Ya-Sin", subtitle: "Surah 36 · Heart of Quran", emoji: "📖", category: "Quran", action: "navigate", target: "/quran" },
  { id: "al-mulk", title: "Al-Mulk", subtitle: "Surah 67 · The Sovereignty", emoji: "📖", category: "Quran", action: "navigate", target: "/quran" },

  // ── MAIDABO ──
  { id: "maidabo", title: "Maidabo Foundation", subtitle: "Donate · Support Niger & Nigeria", emoji: "❤️", category: "Foundation", action: "link", target: "https://maidabo.com" },
  { id: "donate", title: "Donate to Maidabo", subtitle: "Help communities in need", emoji: "🤲", category: "Foundation", action: "link", target: "https://maidabo.com" },

  // ── APP FEATURES ──
  { id: "prayer", title: "Prayer Times", subtitle: "Daily salah schedule", emoji: "🕌", category: "Features", action: "navigate", target: "/(tabs)" },
  { id: "calendar", title: "Islamic Calendar", subtitle: "Key Islamic dates & events", emoji: "📅", category: "Features", action: "navigate", target: "/islamic-calendar" },
  { id: "settings", title: "Settings", subtitle: "App preferences & notifications", emoji: "⚙️", category: "Features", action: "navigate", target: "/settings" },
  { id: "profile", title: "My Profile", subtitle: "Account & personal info", emoji: "👤", category: "Features", action: "navigate", target: "/profile" },
]

const CATEGORY_COLORS: Record<string, string> = {
  Maps: "#1E3A5F",
  Services: "#2D6A4F",
  Transport: "#5C3D00",
  Shopping: "#7B2FBE",
  Guide: "#C9A84C",
  Quran: "#1E3A5F",
  Foundation: "#E24B4A",
  Features: "#555",
}

// ─── COMPONENT ───────────────────────────────────────────────────────────────

export default function SearchScreen() {
  const router = useRouter()
  const { theme } = useTheme()
  const insets = useSafeAreaInsets()
  const [query, setQuery] = useState("")

  const results = query.trim().length < 2
    ? []
    : ALL_ITEMS.filter(item =>
        item.title.toLowerCase().includes(query.toLowerCase()) ||
        item.subtitle.toLowerCase().includes(query.toLowerCase()) ||
        item.category.toLowerCase().includes(query.toLowerCase())
      )

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

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color="#fff" />
        </TouchableOpacity>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={16} color="rgba(255,255,255,0.5)" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search maps, guide, services..."
            placeholderTextColor="rgba(255,255,255,0.4)"
            value={query}
            onChangeText={setQuery}
            autoFocus
            autoCapitalize="none"
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
          // ── EMPTY STATE ──
          <View style={styles.emptyState}>
            <Text style={{ fontSize: 48, marginBottom: 16 }}>🔍</Text>
            <Text style={[styles.emptyTitle, { color: theme.text }]}>Search UmrahConnect</Text>
            <Text style={[styles.emptySub, { color: theme.textSecondary }]}>
              Find holy sites, guide phases, services, Quran surahs, and more
            </Text>

            {/* Quick categories */}
            <View style={styles.quickGrid}>
              {[
                { label: "Maps", emoji: "🗺️", q: "masjid" },
                { label: "Guide", emoji: "🕋", q: "umrah" },
                { label: "Quran", emoji: "📖", q: "surah" },
                { label: "Services", emoji: "🏨", q: "hotel" },
                { label: "Transport", emoji: "🚄", q: "haramain" },
                { label: "Maidabo", emoji: "❤️", q: "maidabo" },
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
          // ── NO RESULTS ──
          <View style={styles.emptyState}>
            <Text style={{ fontSize: 48, marginBottom: 16 }}>😔</Text>
            <Text style={[styles.emptyTitle, { color: theme.text }]}>No results found</Text>
            <Text style={[styles.emptySub, { color: theme.textSecondary }]}>
              Try searching for "Makkah", "Tawaf", "Hajj", "Hotels" or "Quran"
            </Text>
          </View>
        ) : (
          // ── RESULTS ──
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
                      <Text style={[styles.resultSub, { color: theme.textSecondary }]}>{item.subtitle}</Text>
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

// ─── STYLES ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: { backgroundColor: "#1E3A5F", padding: 16, paddingBottom: 16, flexDirection: "row", alignItems: "center", gap: 10 },
  backBtn: { backgroundColor: "rgba(255,255,255,0.15)", borderRadius: 20, padding: 6 },
  searchBar: { flex: 1, flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "rgba(255,255,255,0.12)", borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10 },
  searchInput: { flex: 1, color: "#fff", fontSize: 15 },

  emptyState: { alignItems: "center", paddingTop: 48, paddingHorizontal: 32 },
  emptyTitle: { fontSize: 18, fontWeight: "bold", marginBottom: 8 },
  emptySub: { fontSize: 13, textAlign: "center", lineHeight: 20, marginBottom: 32 },

  quickGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, justifyContent: "center" },
  quickCard: { width: "28%", borderRadius: 14, padding: 14, alignItems: "center", borderWidth: 0.5 },
  quickLabel: { fontSize: 12, fontWeight: "600" },

  results: { padding: 16 },
  resultsCount: { fontSize: 12, marginBottom: 16, fontWeight: "500" },
  group: { marginBottom: 20 },
  groupHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 },
  groupDot: { width: 8, height: 8, borderRadius: 4 },
  groupTitle: { fontSize: 11, fontWeight: "700", letterSpacing: 0.8, textTransform: "uppercase" },
  resultCard: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderRadius: 14, borderWidth: 0.5, marginBottom: 8 },
  resultEmoji: { width: 42, height: 42, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  resultTitle: { fontSize: 14, fontWeight: "600", marginBottom: 2 },
  resultSub: { fontSize: 12 },
})