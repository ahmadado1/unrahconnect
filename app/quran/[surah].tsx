import { useTheme } from "@/context/themeContext"
import i18n from "@/i18n"
import { ScheherazadeNew_400Regular, ScheherazadeNew_700Bold, useFonts } from "@expo-google-fonts/scheherazade-new"
import { Ionicons } from "@expo/vector-icons"
import { useLocalSearchParams, useRouter } from "expo-router"
import { StatusBar } from "expo-status-bar"
import { useEffect, useRef, useState } from "react"
import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { supabase } from "../../lib/supabase"

// ─── TYPES ───────────────────────────────────────────────────────────────────

type Verse = {
  number: number
  numberInQuran: number
  text: string
  translation: string
  page: number
}

// ─── COMPONENT ───────────────────────────────────────────────────────────────

export default function SurahScreen() {
  const router = useRouter()
  const { theme } = useTheme()
  const insets = useSafeAreaInsets()
  const [initialIndex, setInitialIndex] = useState(0)
  const listRef = useRef<FlatList>(null)

  const getTranslationEdition = () => {
    const lang = i18n.language
    switch(lang) {
      case "fr": return "fr.hamidullah"
      case "ur": return "ur.jalandhry"
      case "tr": return "tr.diyanet"
      case "ar": return "ar.muyassar"
      default: return "en.asad"
    }
  }

  // Params from quran.tsx
  const { surah, name, arabicName, verses, type } = useLocalSearchParams<{
    surah: string
    name: string
    arabicName: string
    verses: string
    type: string
  }>()

  // All verses for this surah
  const [verseList, setVerseList] = useState<Verse[]>([])

  // True while fetching
  const [loading, setLoading] = useState(true)

  // Set of bookmarked verse numbers for this surah
  const [bookmarked, setBookmarked] = useState<Set<number>>(new Set())

  // Load Scheherazade Arabic font
  const [fontsLoaded] = useFonts({
    ScheherazadeNew_400Regular,
    ScheherazadeNew_700Bold,
  })

  // Fetch verses and bookmarks on mount
  useEffect(() => {
    fetchVerses()
    fetchBookmarks()
  }, [])

  // ─── FETCH VERSES ──────────────────────────────────────────────────────────

  const fetchVerses = async () => {
    try {
      const [arabicRes, translationRes] = await Promise.all([
        fetch(`https://api.alquran.cloud/v1/surah/${surah}/quran-uthmani`),
        fetch(`https://api.alquran.cloud/v1/surah/${surah}/${getTranslationEdition()}`)
      ])
  
      const arabicData = await arabicRes.json()
      const translationData = await translationRes.json()
  
      if (arabicData.code === 200 && translationData.code === 200) {
        const combined = arabicData.data.ayahs.map((ayah: any, index: number) => {
          let text = ayah.text
          if (ayah.numberInSurah === 1 && Number(surah) !== 1 && Number(surah) !== 9) {
            const words = text.split(" ")
            // Bismillah is always exactly 4 words: بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ
            if (words.length > 4) {
              text = words.slice(4).join(" ").trim()
            }
          }
          return {
            number: ayah.numberInSurah,
            numberInQuran: ayah.number,
            text,
            translation: translationData.data.ayahs[index]?.text || "",
            page: ayah.page
          }
        })
        setVerseList(combined)
  
        // Fetch last saved verse to scroll to it
        const { data: { session } } = await supabase.auth.getSession()
        if (session) {
          const { data: progress } = await supabase
            .from("quran_progress")
            .select("verse_number")
            .eq("user_id", session.user.id)
            .eq("surah_number", Number(surah))
            .single()
  
          if (progress?.verse_number) {
            const idx = combined.findIndex((v: Verse) => v.number === progress.verse_number)
            if (idx > 0) setInitialIndex(idx)
          }
        }
      }
    } catch (e) {
      console.log("Verse fetch error:", e)
    } finally {
      // Always hide loading spinner when done
      setLoading(false)
    }
  }

  useEffect(() => {
    if (initialIndex > 0 && verseList.length > 0 && !loading) {
      setTimeout(() => {
        listRef.current?.scrollToIndex({
          index: initialIndex,
          animated: false,
          viewPosition: 0,
        })
      }, 500)
    }
  }, [initialIndex, verseList, loading])

  // ─── FETCH BOOKMARKS ───────────────────────────────────────────────────────

  // Load existing bookmarks for this surah from Supabase
  const fetchBookmarks = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const { data } = await supabase
        .from("quran_bookmarks")
        .select("verse_number")
        .eq("user_id", session.user.id)
        .eq("surah_number", Number(surah))

      if (data) {
        // Store bookmarked verse numbers in a Set for fast lookup
        setBookmarked(new Set(data.map((b: any) => b.verse_number)))
      }
    } catch (e) {
      console.log("Bookmark fetch error:", e)
    }
  }

  // ─── TOGGLE BOOKMARK ───────────────────────────────────────────────────────

  const toggleBookmark = async (verse: Verse) => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      if (bookmarked.has(verse.number)) {
        // Remove bookmark from Supabase
        await supabase
          .from("quran_bookmarks")
          .delete()
          .eq("user_id", session.user.id)
          .eq("surah_number", Number(surah))
          .eq("verse_number", verse.number)

        // Remove from local state
        setBookmarked(prev => {
          const next = new Set(prev)
          next.delete(verse.number)
          return next
        })
      } else {
        // Add bookmark to Supabase
        await supabase
          .from("quran_bookmarks")
          .insert({
            user_id: session.user.id,
            surah_number: Number(surah),
            surah_name: name,
            surah_arabic: arabicName,
            verse_number: verse.number,
            verse_text: verse.text,
            verse_translation: verse.translation,
          })

        // Add to local state
        setBookmarked(prev => new Set([...prev, verse.number]))
      }
    } catch (e) {
      console.log("Bookmark toggle error:", e)
    }
  }

  // ─── SAVE PROGRESS ─────────────────────────────────────────────────────────

  // Called automatically as user scrolls through verses
  // ─── SAVE PROGRESS ─────────────────────────────────────────────────────────

  // Debounce timer — prevents saving on every scroll event
  const saveTimer = useRef<any>(null)

  // Saves progress 2 seconds after user stops scrolling
  const saveProgress = (verseNumber: number) => {
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) return
        await supabase
          .from("quran_progress")
          .upsert({
            user_id: session.user.id,
            surah_number: Number(surah),
            surah_name: name,
            surah_arabic: arabicName,
            verse_number: verseNumber,
            updated_at: new Date().toISOString(),
          }, { onConflict: "user_id,surah_number" })
      } catch (e) {
        console.log("Progress save error:", e)
      }
    }, 2000)
  }

  // ─── RENDER VERSE ──────────────────────────────────────────────────────────

  const renderVerse = ({ item }: { item: Verse }) => (
    <View style={[styles.verseCard, { backgroundColor: theme.card, borderColor: theme.border }]}>

      {/* Top row — verse number and bookmark button */}
      <View style={styles.verseTop}>
        {/* Gold circle with verse number */}
        <View style={styles.verseBadge}>
          <Text style={styles.verseBadgeText}>{item.number}</Text>
        </View>

        {/* Bookmark button — filled if bookmarked */}
        <TouchableOpacity onPress={() => toggleBookmark(item)}>
          <Ionicons
            name={bookmarked.has(item.number) ? "bookmark" : "bookmark-outline"}
            size={18}
            color={theme.gold}
          />
        </TouchableOpacity>
      </View>

      {/* Arabic verse text — Scheherazade font, right aligned */}
      <Text style={[
        styles.verseArabic,
        fontsLoaded && { fontFamily: "ScheherazadeNew_400Regular" }
      ]}>
        {item.text}
      </Text>

      {/* Gold divider between Arabic and translation */}
      <View style={styles.verseDivider} />

      {/* English translation */}
      <Text style={[styles.verseTranslation, { color: theme.textSecondary }]}>
        {item.translation}
      </Text>

    </View>
  )

  // ─── RENDER ────────────────────────────────────────────────────────────────

  return (
    <View style={[styles.screen, { backgroundColor: theme.background }]}>
      <StatusBar style="light" />

      {/* Navy header */}
      <View style={[styles.header, { paddingTop: insets.top }]}>

        {/* Back to Quran list */}
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color="#fff" />
          <Text style={styles.backText}>Quran</Text>
        </TouchableOpacity>

        {/* Arabic surah name */}
        <Text style={[
          styles.headerArabic,
          fontsLoaded && { fontFamily: "ScheherazadeNew_700Bold" }
        ]}>
          {arabicName}
        </Text>

        {/* English name */}
        <Text style={styles.headerEnglish}>{name}</Text>

        {/* Verse count and type */}
        <Text style={styles.headerMeta}>
          {verses} verses · {type}
        </Text>

      </View>

      {loading ? (
        // Loading spinner
        <View style={styles.loadingContainer}>
          <ActivityIndicator color="#C9A84C" size="large" />
          <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
            Loading {name}...
          </Text>
        </View>
      ) : (
        <FlatList
          data={verseList}
          keyExtractor={item => item.number.toString()}
          renderItem={renderVerse}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.readList}
          
          // Save progress as user scrolls — tracks last visible verse
          onViewableItemsChanged={({ viewableItems }) => {
            if (viewableItems.length > 0) {
              const last = viewableItems[viewableItems.length - 1]
              if (last.item) saveProgress(last.item.number)
            }
          }}
          viewabilityConfig={{
            // Verse must be 50% visible to count as read
            itemVisiblePercentThreshold: 50
          }}

          // Bismillah at top
            ListHeaderComponent={() => {
                if (Number(surah) === 9) return null
                return (
                <View style={[styles.bismillahCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
                    <Text style={[
                    styles.bismillahText,
                    fontsLoaded && { fontFamily: "ScheherazadeNew_700Bold" },
                    { color: theme.text }
                    ]}>
                    بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
                    </Text>
                    <Text style={[styles.bismillahTranslation, { color: theme.textSecondary }]}>
                    In the name of Allah, the Most Gracious, the Most Merciful
                    </Text>
                </View>
                )
            }}

          // End of surah footer
          ListFooterComponent={() => (
            <View style={styles.footer}>
              <View style={styles.footerLine} />
              <Text style={[styles.footerText, { color: theme.textSecondary }]}>
                End of {name}
              </Text>
              <View style={styles.footerLine} />
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

  // Navy header
  header: { backgroundColor: "#1E3A5F", padding: 20, paddingBottom: 16 },
  backBtn: { flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 12 },
  backText: { color: "rgba(255,255,255,0.6)", fontSize: 14 },
  headerArabic: { fontSize: 32, color: "#C9A84C", textAlign: "center", marginBottom: 4 },
  headerEnglish: { fontSize: 18, fontWeight: "bold", color: "#fff", textAlign: "center", marginBottom: 4 },
  headerMeta: { fontSize: 12, color: "rgba(255,255,255,0.5)", textAlign: "center" },

  // Loading
  loadingContainer: { flex: 1, alignItems: "center", justifyContent: "center", gap: 16 },
  loadingText: { fontSize: 14 },

  // Verse list
  readList: { padding: 16, paddingBottom: 100, gap: 12 },

  // Bismillah card
  bismillahCard: { borderRadius: 16, padding: 20, alignItems: "center", borderWidth: 0.5, marginBottom: 4 },
  bismillahText: { fontSize: 26, textAlign: "center", marginBottom: 8 },
  bismillahTranslation: { fontSize: 12, textAlign: "center", lineHeight: 18 },

  // Verse card
  verseCard: { borderRadius: 16, padding: 16, borderWidth: 0.5 },
  verseTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 14 },
  verseBadge: { width: 32, height: 32, borderRadius: 16, backgroundColor: "rgba(201,168,76,0.15)", borderWidth: 1, borderColor: "rgba(201,168,76,0.4)", alignItems: "center", justifyContent: "center" },
  verseBadgeText: { color: "#C9A84C", fontSize: 12, fontWeight: "700" },
  verseArabic: { fontSize: 26, textAlign: "right", lineHeight: 50, marginBottom: 14 } as any,
  verseDivider: { height: 0.5, backgroundColor: "rgba(201,168,76,0.3)", marginBottom: 12 },
  verseTranslation: { fontSize: 13, lineHeight: 22 },

  // End of surah footer
  footer: { flexDirection: "row", alignItems: "center", gap: 12, padding: 16, paddingBottom: 40 },
  footerLine: { flex: 1, height: 0.5, backgroundColor: "#C9A84C" },
  footerText: { fontSize: 12, fontWeight: "600" },
})