import { useTheme } from "@/context/themeContext"
import { ScheherazadeNew_400Regular, ScheherazadeNew_700Bold, useFonts } from "@expo-google-fonts/scheherazade-new"
import { Ionicons } from "@expo/vector-icons"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { useFocusEffect, useRouter } from "expo-router"
import { StatusBar } from "expo-status-bar"
import { useCallback, useEffect, useState } from "react"
import { ActivityIndicator, FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { supabase } from "../lib/supabase"

// ─── TYPES ───────────────────────────────────────────────────────────────────

type Surah = {
  number: number
  name: string
  englishName: string
  englishNameTranslation: string
  numberOfAyahs: number
  revelationType: string
}

// Last reading position fetched from Supabase
type LastRead = {
  surah_number: number
  surah_name: string
  surah_arabic: string
  verse_number: number
}

// ─── COMPONENT ───────────────────────────────────────────────────────────────

export default function QuranScreen() {
  const router = useRouter()
  const { theme, isDark } = useTheme()
  const insets = useSafeAreaInsets()

  const [surahs, setSurahs] = useState<Surah[]>([])
  const [filtered, setFiltered] = useState<Surah[]>([])
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const [bookmarkCount, setBookmarkCount] = useState(0)

  // Last read position — shown in Continue Reading card
  const [lastRead, setLastRead] = useState<LastRead | null>(null)

  const [fontsLoaded] = useFonts({
    ScheherazadeNew_400Regular,
    ScheherazadeNew_700Bold,
  })

  // Fetch surahs and last read position on mount
  // Refresh last read every time screen is focused
  useFocusEffect(
    useCallback(() => {
      fetchLastRead()
      fetchBookmarkCount()
    }, [])
  )
  useEffect(() => {
    fetchSurahs()
  }, [])

  // Filter surahs when search changes
  useEffect(() => {
    if (!search.trim()) {
      setFiltered(surahs)
      return
    }
    const q = search.toLowerCase()
    setFiltered(
      surahs.filter(s =>
        s.englishName.toLowerCase().includes(q) ||
        s.englishNameTranslation.toLowerCase().includes(q) ||
        s.number.toString().includes(q)
      )
    )
  }, [search, surahs])

  // Bookmark 

  const fetchBookmarkCount = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return
      const { count } = await supabase
        .from("quran_bookmarks")
        .select("*", { count: "exact", head: true })
        .eq("user_id", session.user.id)
      setBookmarkCount(count || 0)
    } catch (e) {
      console.log("Bookmark count error:", e)
    }
  }

  // ─── FETCH SURAHS ──────────────────────────────────────────────────────────

  const fetchSurahs = async () => {
    try {
      // Try loading from cache first
      const cached = await AsyncStorage.getItem("quran_surahs")
      if (cached) {
        const parsed = JSON.parse(cached)
        setSurahs(parsed)
        setFiltered(parsed)
        setLoading(false)
      }
  
      // Then fetch fresh from API
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 8000)
  
      const res = await fetch("https://api.alquran.cloud/v1/surah", {
        signal: controller.signal
      })
      clearTimeout(timeout)
  
      const data = await res.json()
      if (data.code === 200) {
        setSurahs(data.data)
        setFiltered(data.data)
        // Save to cache for offline use
        await AsyncStorage.setItem("quran_surahs", JSON.stringify(data.data))
      } else if (!cached) {
        setError(true)
      }
    } catch (e) {
      console.log("Quran API error:", e)
      // Only show error if no cache available
      const cached = await AsyncStorage.getItem("quran_surahs")
      if (!cached) setError(true)
    } finally {
      setLoading(false)
    }
  }

  // ─── FETCH LAST READ ───────────────────────────────────────────────────────

  // Gets the most recently read surah and verse from Supabase
  const fetchLastRead = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const { data } = await supabase
        .from("quran_progress")
        .select("*")
        .eq("user_id", session.user.id)
        .order("updated_at", { ascending: false })
        .limit(1)
        .single()

      if (data) setLastRead(data)
    } catch (e) {
      console.log("Last read fetch error:", e)
    }
  }

  // ─── NAVIGATE TO SURAH ─────────────────────────────────────────────────────

  const goToSurah = (item: Surah) => {
    router.push({
      pathname: "/quran/[surah]",
      params: {
        surah: item.number,
        name: item.englishName,
        arabicName: item.name,
        verses: item.numberOfAyahs,
        type: item.revelationType
      }
    })
  }

  // ─── RENDER SURAH ROW ──────────────────────────────────────────────────────

  const renderSurah = ({ item }: { item: Surah }) => (
    <TouchableOpacity
      style={[styles.surahRow, { borderBottomColor: theme.border }]}
      onPress={() => goToSurah(item)}
    >
      {/* Number badge */}
      <View style={styles.numBadge}>
        <Text style={styles.numText}>{item.number}</Text>
      </View>

      {/* English name and metadata */}
      <View style={styles.surahInfo}>
        <Text style={[styles.surahEn, { color: theme.text }]}>{item.englishName}</Text>
        <Text style={styles.surahMeta}>
          {item.numberOfAyahs} verses · {item.revelationType}
        </Text>
      </View>

      {/* Arabic name */}
      <Text style={[styles.surahAr, fontsLoaded && { fontFamily: "ScheherazadeNew_400Regular" }]}>
        {item.name}
      </Text>
    </TouchableOpacity>
  )

  // ─── RENDER ────────────────────────────────────────────────────────────────

  return (
    <View style={[styles.screen, { backgroundColor: theme.background }]}>
      <StatusBar style="light" />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color="#fff" />
          <Text style={styles.backText}>Guide</Text>
        </TouchableOpacity>

        <View style={styles.titleRow}>
        <View>
            <Text style={styles.title}>Quran</Text>
            <Text style={styles.subtitle}>114 surahs · Arabic & translation</Text>
        </View>
        <TouchableOpacity
            style={styles.bookmarkBtn}
            onPress={() => router.push("/quran/bookmarks")}
        >
            <Ionicons name="bookmark" size={20} color="#C9A84C" />
        </TouchableOpacity>
        </View>

        {/* Search bar */}
        <View style={styles.searchBar}>
          <Ionicons name="search" size={16} color="rgba(255,255,255,0.4)" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search surah..."
            placeholderTextColor="rgba(255,255,255,0.4)"
            value={search}
            onChangeText={setSearch}
            autoCapitalize="none"
          />
          {search ? (
            <TouchableOpacity onPress={() => setSearch("")}>
              <Ionicons name="close-circle" size={16} color="rgba(255,255,255,0.4)" />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {loading ? (
  <View style={styles.loadingContainer}>
    <ActivityIndicator color="#C9A84C" size="large" />
    <Text style={[styles.loadingText, { color: theme.textSecondary }]}>Loading Quran...</Text>
  </View>
) : error ? (
  <View style={styles.loadingContainer}>
    <Text style={{ fontSize: 40 }}>📡</Text>
    <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
      No internet connection
    </Text>
    <TouchableOpacity
      style={{ backgroundColor: "#1E3A5F", padding: 14, borderRadius: 25, marginTop: 8 }}
      onPress={() => { setError(false); setLoading(true); fetchSurahs() }}
    >
      <Text style={{ color: "#fff", fontWeight: "600" }}>Try again</Text>
    </TouchableOpacity>
  </View>
) : (
  // ... your FlatList
        <FlatList
          data={filtered}
          keyExtractor={item => item.number.toString()}
          renderItem={renderSurah}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100 }}

          ListHeaderComponent={() => (
            <>
              {/* Continue Reading card — only shown if user has read before */}
              {lastRead && (
                <TouchableOpacity
                  style={[styles.continueCard, { borderColor: theme.gold }]}
                  onPress={() => {
                    // Find the full surah data so we can pass all params
                    const surahData = surahs.find(s => s.number === lastRead.surah_number)
                    if (surahData) goToSurah(surahData)
                  }}
                >
                  {/* Book emoji */}
                  <Text style={styles.continueEmoji}>📖</Text>

                  <View style={styles.continueInfo}>
                    {/* Label */}
                    <Text style={styles.continueLabel}>CONTINUE READING</Text>

                    {/* Arabic surah name */}
                    <Text style={[
                      styles.continueArabic,
                      fontsLoaded && { fontFamily: "ScheherazadeNew_400Regular" }
                    ]}>
                      {lastRead.surah_arabic}
                    </Text>

                    {/* English name and verse */}
                    <Text style={[styles.continueName, { color: theme.text }]}>
                      {lastRead.surah_name} · Verse {lastRead.verse_number}
                    </Text>
                  </View>

                  <Ionicons name="chevron-forward" size={20} color={theme.gold} />
                </TouchableOpacity>
              )}

              {/* Bookmarks card */}
                <TouchableOpacity
                  style={[styles.bookmarkCard, { borderColor: theme.gold }]}
                  onPress={() => router.push("/quran/bookmarks")}
                >
                  <Ionicons name="bookmark" size={28} color="#C9A84C" />
                  <View style={styles.bookmarkInfo}>
                    <Text style={styles.continueLabel}>MY BOOKMARKS</Text>
                    <Text style={[styles.continueName, { color: theme.text }]}>
                      {bookmarkCount} saved {bookmarkCount === 1 ? "verse" : "verses"}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={theme.gold} />
                </TouchableOpacity>

              {/* All Surahs label */}
              <View style={[styles.listHeader, { borderBottomColor: theme.border }]}>
                <Text style={[styles.listHeaderText, { color: theme.textSecondary }]}>
                  ALL SURAHS
                </Text>
                <Text style={[styles.listHeaderCount, { color: theme.textSecondary }]}>
                  {filtered.length} / 114
                </Text>
              </View>
            </>
          )}

          ListEmptyComponent={() => (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyEmoji}>📖</Text>
              <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                No surahs found for "{search}"
              </Text>
            </View>
          )}
        />
      )}
    </View>
  )
}

// ─── STYLES ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: { backgroundColor: "#1E3A5F", padding: 20, paddingBottom: 16 },
  backBtn: { flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 12 },
  backText: { color: "rgba(255,255,255,0.6)", fontSize: 14 },
  title: { color: "#fff", fontSize: 26, fontWeight: "bold", marginBottom: 4 },
  subtitle: { color: "#C9A84C", fontSize: 13, marginBottom: 16 },
  searchBar: { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: "rgba(255,255,255,0.12)", borderRadius: 12, padding: 12 },
  searchInput: { flex: 1, color: "#fff", fontSize: 15 },
  loadingContainer: { flex: 1, alignItems: "center", justifyContent: "center", gap: 16 },
  loadingText: { fontSize: 14 },

  // Continue Reading card
  continueCard: { margin: 16, marginBottom: 8, borderRadius: 16, padding: 16, flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: "rgba(201,168,76,0.1)", borderWidth: 1 },
  continueEmoji: { fontSize: 32 },
  continueInfo: { flex: 1 },
  continueLabel: { color: "#C9A84C", fontSize: 10, fontWeight: "600", letterSpacing: 0.8, marginBottom: 4 },
  continueArabic: { fontSize: 20, color: "#1E3A5F", marginBottom: 2 },
  continueName: { fontSize: 13, fontWeight: "500" },

  // All Surahs header
  listHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 16, borderBottomWidth: 0.5 },
  listHeaderText: { fontSize: 11, fontWeight: "600", letterSpacing: 0.8 },
  listHeaderCount: { fontSize: 11 },

  // Bookmark 
  bookmarkCard: { 
    marginHorizontal: 16, marginBottom: 8, borderRadius: 16, padding: 16, 
    flexDirection: "row", alignItems: "center", gap: 12, 
    backgroundColor: "rgba(201,168,76,0.08)", borderWidth: 1 
  },
  bookmarkInfo: { flex: 1 },

  // Surah row
  surahRow: { flexDirection: "row", alignItems: "center", padding: 16, borderBottomWidth: 0.5, gap: 12 },
  numBadge: { width: 40, height: 40, borderRadius: 10, backgroundColor: "#1E3A5F", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  numText: { color: "#C9A84C", fontSize: 13, fontWeight: "700" },
  surahInfo: { flex: 1 },
  surahEn: { fontSize: 15, fontWeight: "600", marginBottom: 3 },
  surahMeta: { fontSize: 12, color: "#C9A84C" },
  surahAr: { fontSize: 22, color: "#1E3A5F", textAlign: "right" },

  // Empty search state
  emptyContainer: { alignItems: "center", paddingTop: 60, gap: 12 },
  emptyEmoji: { fontSize: 40 },
  emptyText: { fontSize: 14 },

  titleRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
bookmarkBtn: { backgroundColor: "rgba(201,168,76,0.15)", padding: 10, borderRadius: 12 },
})