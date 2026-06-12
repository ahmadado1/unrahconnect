import { useTheme } from "@/context/themeContext"
import { ScheherazadeNew_400Regular, useFonts } from "@expo-google-fonts/scheherazade-new"
import { Ionicons } from "@expo/vector-icons"
import { useRouter } from "expo-router"
import { StatusBar } from "expo-status-bar"
import { useEffect, useState } from "react"
import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { supabase } from "../../lib/supabase"

// ─── TYPE ────────────────────────────────────────────────────────────────────

type Bookmark = {
  id: string
  surah_number: number
  surah_name: string
  surah_arabic: string
  verse_number: number
  verse_text: string
  verse_translation: string
  created_at: string
}



// ─── COMPONENT ───────────────────────────────────────────────────────────────

export default function BookmarksScreen() {
  console.log("BookmarksScreen mounted")  // just this line added here
  const router = useRouter()
  const { theme } = useTheme()
  const insets = useSafeAreaInsets()

  // All bookmarked verses
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([])

  // True while fetching
  const [loading, setLoading] = useState(true)

  // Load Scheherazade font for Arabic text
  const [fontsLoaded] = useFonts({ ScheherazadeNew_400Regular })

  // Fetch bookmarks on mount
  useEffect(() => {
    fetchBookmarks()
  }, [])

  // ─── FETCH ─────────────────────────────────────────────────────────────────

  const fetchBookmarks = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    console.log("User:", user?.id)
    
    if (!user) { 
      setLoading(false)
      return 
    }

    // Test RLS by checking session
    const { data: { session } } = await supabase.auth.getSession()
    console.log("Session exists:", !!session)
    console.log("Session user:", session?.user?.id)

    const { data, error } = await supabase
      .from("quran_bookmarks")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })

    console.log("Data count:", data?.length)
    console.log("Error:", JSON.stringify(error))

    if (data) setBookmarks(data)
  } catch (e) {
    console.log("Bookmarks fetch error:", e)
  } finally {
    setLoading(false)
  }
}

  // ─── DELETE BOOKMARK ───────────────────────────────────────────────────────

  const deleteBookmark = async (bookmark: Bookmark) => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      await supabase
        .from("quran_bookmarks")
        .delete()
        .eq("id", bookmark.id)

      // Remove from local state
      setBookmarks(prev => prev.filter(b => b.id !== bookmark.id))
    } catch (e) {
      console.log("Delete bookmark error:", e)
    }
  }

  // ─── RENDER BOOKMARK ───────────────────────────────────────────────────────

  const renderBookmark = ({ item }: { item: Bookmark }) => (
    <View style={[styles.bookmarkCard, { backgroundColor: theme.card, borderColor: theme.border }]}>

      {/* Header — surah name and verse number */}
      <View style={styles.bookmarkHeader}>
        <View style={styles.bookmarkMeta}>
          {/* Surah number badge */}
          <View style={styles.surahBadge}>
            <Text style={styles.surahBadgeText}>{item.surah_number}</Text>
          </View>
          <View>
            <Text style={[styles.surahName, { color: theme.text }]}>{item.surah_name}</Text>
            <Text style={styles.verseMeta}>Verse {item.verse_number}</Text>
          </View>
        </View>

        {/* Delete bookmark button */}
        <TouchableOpacity onPress={() => deleteBookmark(item)}>
          <Ionicons name="bookmark" size={20} color="#C9A84C" />
        </TouchableOpacity>
      </View>

      {/* Arabic text */}
      <Text style={[
        styles.arabicText,
        fontsLoaded && { fontFamily: "ScheherazadeNew_400Regular" }
      ]}>
        {item.verse_text}
      </Text>

      {/* Gold divider */}
      <View style={styles.divider} />

      {/* Translation */}
      <Text style={[styles.translation, { color: theme.textSecondary }]}>
        {item.verse_translation}
      </Text>

    </View>
  )

  // ─── RENDER ────────────────────────────────────────────────────────────────

  return (
    <View style={[styles.screen, { backgroundColor: theme.background }]}>
      <StatusBar style="light" />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color="#fff" />
          <Text style={styles.backText}>Quran</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Bookmarks</Text>
        <Text style={styles.subtitle}>Your saved verses</Text>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color="#C9A84C" size="large" />
        </View>
      ) : bookmarks.length === 0 ? (
        // Empty state
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyEmoji}>🔖</Text>
          <Text style={[styles.emptyTitle, { color: theme.text }]}>No bookmarks yet</Text>
          <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
            Tap the bookmark icon on any verse to save it here
          </Text>
        </View>
      ) : (
        <FlatList
          data={bookmarks}
          keyExtractor={item => item.id}
          renderItem={renderBookmark}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.list}
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
  subtitle: { color: "#C9A84C", fontSize: 13 },
  loadingContainer: { flex: 1, alignItems: "center", justifyContent: "center" },
  list: { padding: 16, paddingBottom: 100, gap: 12 },

  // Bookmark card
  bookmarkCard: { borderRadius: 16, padding: 16, borderWidth: 0.5 },
  bookmarkHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 14 },
  bookmarkMeta: { flexDirection: "row", alignItems: "center", gap: 10 },
  surahBadge: { width: 36, height: 36, borderRadius: 10, backgroundColor: "#1E3A5F", alignItems: "center", justifyContent: "center" },
  surahBadgeText: { color: "#C9A84C", fontSize: 12, fontWeight: "700" },
  surahName: { fontSize: 14, fontWeight: "600" },
  verseMeta: { fontSize: 12, color: "#C9A84C" },
  arabicText: { fontSize: 22, textAlign: "right", lineHeight: 44, marginBottom: 12 },
  divider: { height: 0.5, backgroundColor: "rgba(201,168,76,0.3)", marginBottom: 12 },
  translation: { fontSize: 13, lineHeight: 20 },

  // Empty state
  emptyContainer: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12, padding: 32 },
  emptyEmoji: { fontSize: 48 },
  emptyTitle: { fontSize: 18, fontWeight: "bold" },
  emptyText: { fontSize: 14, textAlign: "center", lineHeight: 20 },
})