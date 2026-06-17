import { useTheme } from "@/context/themeContext"
import i18n from "@/i18n"
import { ScheherazadeNew_400Regular, ScheherazadeNew_700Bold, useFonts } from "@expo-google-fonts/scheherazade-new"
import { Ionicons } from "@expo/vector-icons"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { useLocalSearchParams, useRouter } from "expo-router"
import { StatusBar } from "expo-status-bar"
import { useEffect, useRef, useState } from "react"
import { ActivityIndicator, Dimensions, FlatList, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native"
import { GestureHandlerRootView } from "react-native-gesture-handler"
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

type MushafWord = {
  text_uthmani: string
  line_number: number
  page_number: number
  char_type_name: string
  position: number
}

type MushafVerse = {
  verse_number: number
  verse_key: string
  juz_number: number
  words: MushafWord[]
}

type MushafPageData = {
  verses: MushafVerse[]
  juzNumber: number
  startingSurahs: number[]
}

type LineItem =
  | { type: "word"; text: string; key: string }
  | { type: "end"; verseNumber: number; key: string }

type PageLine = {
  lineNumber: number
  items: LineItem[]
}

const BISMILLAH = "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ"
const MUSHAF_PAGE_COUNT = 604
const { width: SCREEN_WIDTH } = Dimensions.get("window")

// ─── MUSHAF HELPERS ──────────────────────────────────────────────────────────

async function fetchMushafPage(page: number): Promise<MushafPageData> {
  const cacheKey = `quran_page_${page}`

  try {
    const cached = await AsyncStorage.getItem(cacheKey)
    if (cached) return JSON.parse(cached)
  } catch {}

  const url =
    `https://api.quran.com/api/v4/verses/by_page/${page}?words=true&word_fields=text_uthmani,line_number,page_number`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Failed to fetch page ${page}`)

  const json = await res.json()
  const verses: MushafVerse[] = json.verses ?? []
  const data: MushafPageData = {
    verses,
    juzNumber: verses[0]?.juz_number ?? 1,
    startingSurahs: verses
      .filter(v => v.verse_number === 1)
      .map(v => parseInt(v.verse_key.split(":")[0], 10)),
  }

  try {
    await AsyncStorage.setItem(cacheKey, JSON.stringify(data))
  } catch {}

  return data
}

function buildPageLines(verses: MushafVerse[]): PageLine[] {
  const map = new Map<number, LineItem[]>()

  for (const verse of verses) {
    for (const word of verse.words) {
      const lineNumber = word.line_number
      if (!map.has(lineNumber)) map.set(lineNumber, [])

      const items = map.get(lineNumber)!
      if (word.char_type_name === "end") {
        items.push({
          type: "end",
          verseNumber: verse.verse_number,
          key: `${verse.verse_key}-end`,
        })
      } else {
        items.push({
          type: "word",
          text: word.text_uthmani,
          key: `${verse.verse_key}-${word.position}`,
        })
      }
    }
  }

  return Array.from(map.entries())
    .sort(([a], [b]) => a - b)
    .map(([lineNumber, items]) => ({ lineNumber, items }))
}

function SurahBanner({ name, fontsLoaded }: { name: string; fontsLoaded: boolean }) {
  if (!name) return null

  return (
    <View style={mStyles.surahBanner}>
      <View style={mStyles.surahBannerInner}>
        <View style={mStyles.surahBannerDiamond} />
        <Text
          style={[
            mStyles.surahBannerText,
            fontsLoaded && { fontFamily: "ScheherazadeNew_400Regular" },
          ]}
        >
          {name}
        </Text>
        <View style={mStyles.surahBannerDiamond} />
      </View>
    </View>
  )
}

function MushafPageContent({
  pageNumber,
  fontsLoaded,
  surahNames,
}: {
  pageNumber: number
  fontsLoaded: boolean
  surahNames: Record<number, string>
}) {
  const [pageData, setPageData] = useState<MushafPageData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(false)

    fetchMushafPage(pageNumber)
      .then(data => {
        if (!cancelled) {
          setPageData(data)
          setLoading(false)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setError(true)
          setLoading(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [pageNumber])

  if (loading) {
    return (
      <View style={mStyles.pageLoading}>
        <ActivityIndicator color="#8B6914" size="large" />
      </View>
    )
  }

  if (error || !pageData) {
    return (
      <View style={mStyles.pageLoading}>
        <Text style={mStyles.pageError}>Unable to load page {pageNumber}</Text>
      </View>
    )
  }

  const primarySurah = parseInt(pageData.verses[0]?.verse_key.split(":")[0] ?? "1", 10)
  const primarySurahName = surahNames[primarySurah] ?? ""
  const lines = buildPageLines(pageData.verses)

  return (
    <ScrollView
      style={mStyles.pageScroll}
      contentContainerStyle={mStyles.pageScrollContent}
      showsVerticalScrollIndicator={false}
    >
      <View style={mStyles.pageFrame}>
        <View style={mStyles.ornamentTop}>
          <View style={mStyles.borderLineOuter} />
          <View style={mStyles.borderLineInner} />
        </View>

        <View style={mStyles.metaRow}>
          <Text style={mStyles.metaText}>Juz {pageData.juzNumber}</Text>
          <Text style={mStyles.metaText}>{pageNumber}</Text>
          <Text style={[mStyles.metaText, mStyles.metaSurah]}>{primarySurahName}</Text>
        </View>

        {pageData.startingSurahs.map(surahNum => (
          <View key={`surah-start-${surahNum}`}>
            <SurahBanner name={surahNames[surahNum] ?? ""} fontsLoaded={fontsLoaded} />
            {surahNum !== 9 && surahNum !== 1 && (
              <View style={mStyles.bismillahRow}>
                <Text
                  style={[
                    mStyles.bismillahText,
                    fontsLoaded && { fontFamily: "ScheherazadeNew_400Regular" },
                  ]}
                >
                  {BISMILLAH}
                </Text>
              </View>
            )}
          </View>
        ))}

        {lines.map((line, idx) => (
          <View
            key={line.lineNumber}
            style={[mStyles.lineRow, idx === lines.length - 1 && mStyles.lineRowLast]}
          >
            {line.items.map(item =>
              item.type === "word" ? (
                <Text
                  key={item.key}
                  style={[
                    mStyles.word,
                    fontsLoaded && { fontFamily: "ScheherazadeNew_400Regular" },
                  ]}
                >
                  {item.text}
                </Text>
              ) : (
                <View key={item.key} style={mStyles.verseEndBadge}>
                  <Text style={mStyles.verseEndText}>{item.verseNumber}</Text>
                </View>
              )
            )}
          </View>
        ))}

        <View style={mStyles.ornamentBottom}>
          <View style={mStyles.borderLineInner} />
          <View style={mStyles.borderLineOuter} />
        </View>
      </View>
    </ScrollView>
  )
}

function MushafView({
  currentPage,
  setCurrentPage,
  insets,
  router,
  setViewMode,
  fontsLoaded,
}: {
  currentPage: number
  setCurrentPage: (p: number) => void
  insets: any
  router: any
  setViewMode: (v: "text" | "mushaf") => void
  fontsLoaded: boolean
}) {
  const flatListRef = useRef<FlatList>(null)
  const pages = useRef(Array.from({ length: MUSHAF_PAGE_COUNT }, (_, i) => i + 1)).current
  const [surahNames, setSurahNames] = useState<Record<number, string>>({})

  useEffect(() => {
    const loadSurahNames = async () => {
      try {
        const cached = await AsyncStorage.getItem("quran_surahs")
        if (cached) {
          const map: Record<number, string> = {}
          JSON.parse(cached).forEach((s: { number: number; name: string }) => {
            map[s.number] = s.name
          })
          setSurahNames(map)
          return
        }
      } catch {}

      try {
        const res = await fetch("https://api.quran.com/api/v4/chapters?language=ar")
        const json = await res.json()
        const map: Record<number, string> = {}
        json.chapters?.forEach((c: { id: number; name_arabic: string }) => {
          map[c.id] = c.name_arabic
        })
        setSurahNames(map)
      } catch {}
    }

    loadSurahNames()
  }, [])

  useEffect(() => {
    flatListRef.current?.scrollToIndex({
      index: currentPage - 1,
      animated: true,
    })
  }, [currentPage])

  return (
    <GestureHandlerRootView style={mStyles.mushafRoot}>
      <View style={[mStyles.mushafHeader, { paddingTop: insets.top }]}>
        <TouchableOpacity onPress={() => router.back()} style={mStyles.mushafHeaderBtn}>
          <Ionicons name="chevron-back" size={20} color="#fff" />
          <Text style={mStyles.mushafHeaderBackText}>Quran</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setViewMode("text")} style={mStyles.mushafToggleBtn}>
          <Ionicons name="list-outline" size={16} color="#C9A84C" />
          <Text style={mStyles.mushafToggleText}>Verses</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        ref={flatListRef}
        data={pages}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        initialScrollIndex={currentPage - 1}
        keyExtractor={item => item.toString()}
        style={mStyles.mushafPager}
        getItemLayout={(_, index) => ({
          length: SCREEN_WIDTH,
          offset: SCREEN_WIDTH * index,
          index,
        })}
        onMomentumScrollEnd={e => {
          const newPage = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH) + 1
          setCurrentPage(newPage)
        }}
        renderItem={({ item }) => (
          <View style={{ width: SCREEN_WIDTH, flex: 1 }}>
            <MushafPageContent
              pageNumber={item}
              fontsLoaded={fontsLoaded}
              surahNames={surahNames}
            />
          </View>
        )}
        onScrollToIndexFailed={info => {
          setTimeout(() => {
            flatListRef.current?.scrollToIndex({
              index: info.index,
              animated: false,
            })
          }, 300)
        }}
      />

      <View style={[mStyles.navBar, { paddingBottom: insets.bottom + 6 }]}>
        <TouchableOpacity
          onPress={() => setCurrentPage(Math.max(1, currentPage - 1))}
          style={mStyles.navBtnRow}
          disabled={currentPage <= 1}
        >
          <Ionicons name="chevron-back" size={18} color="#C9A84C" />
          <Text style={mStyles.navLabel}>Prev</Text>
        </TouchableOpacity>

        <View style={mStyles.navCenter}>
          <Text style={mStyles.navPage}>{currentPage}</Text>
          <Text style={mStyles.navTotal}>of {MUSHAF_PAGE_COUNT}</Text>
        </View>

        <TouchableOpacity
          onPress={() => setCurrentPage(Math.min(MUSHAF_PAGE_COUNT, currentPage + 1))}
          style={mStyles.navBtnRow}
          disabled={currentPage >= MUSHAF_PAGE_COUNT}
        >
          <Text style={mStyles.navLabel}>Next</Text>
          <Ionicons name="chevron-forward" size={18} color="#C9A84C" />
        </TouchableOpacity>
      </View>
    </GestureHandlerRootView>
  )
}

  

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────

export default function SurahScreen() {
  const router = useRouter()
  const { theme } = useTheme()
  const insets = useSafeAreaInsets()
  const [initialIndex, setInitialIndex] = useState(0)
  const listRef = useRef<FlatList>(null)
  const [viewMode, setViewMode] = useState<"text" | "mushaf">("text")
  const [currentPage, setCurrentPage] = useState(1)
  const [verseList, setVerseList] = useState<Verse[]>([])
  const [loading, setLoading] = useState(true)
  const [bookmarked, setBookmarked] = useState<Set<number>>(new Set())
  const saveTimer = useRef<any>(null)

  

  const [fontsLoaded] = useFonts({
    ScheherazadeNew_400Regular,
    ScheherazadeNew_700Bold,
  })

  const { surah, name, arabicName, verses, type } = useLocalSearchParams<{
    surah: string
    name: string
    arabicName: string
    verses: string
    type: string
  }>()

  const getTranslationEdition = () => {
  switch (i18n.language) {
    case "fr": return "fr.hamidullah"
    case "ur": return "ur.jalandhry"
    case "tr": return "tr.diyanet"
    case "ar": return "ar.muyassar"
    default: return "en.sahih"
  }
}

  useEffect(() => {
  if (!surah) return
  fetchVerses()
  fetchBookmarks()
}, [surah, i18n.language])  

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


  // ─── FETCH WITH RETRY ──────────────────────────────────────────────────────

const fetchWithRetry = async (url: string, retries = 3): Promise<Response> => {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url)
      if (res.ok) return res
    } catch (e) {
      if (i === retries - 1) throw e
      await new Promise(r => setTimeout(r, 1000 * (i + 1)))
    }
  }
  throw new Error("HTTP Error")
}

  // ─── FETCH VERSES ──────────────────────────────────────────────────────────

  const fetchVerses = async () => {
    if (!surah || Number(surah) < 1 || Number(surah) > 114) return
    try {
      setLoading(true)
  
      // ── Check cache first ──
      const cacheKey = `quran_surah_${surah}_${i18n.language}`
      try {
        const cached = await AsyncStorage.getItem(cacheKey)
        if (cached) {
          const parsed = JSON.parse(cached)
          setVerseList(parsed)
          if (parsed.length > 0) setCurrentPage(parsed[0].page || 1)
          setLoading(false)
          // Still fetch fresh in background
        }
      } catch (e) {}

    // Try multiple APIs in order
    let combined: Verse[] = []

    // API 1: alquran.cloud single edition (Arabic only first)
    try {
      const arabicRes = await fetch(
        `https://api.alquran.cloud/v1/surah/${surah}/quran-uthmani`
      )
      const arabicData = await arabicRes.json()
      
      if (arabicData.status === "OK" && arabicData.data?.ayahs) {
        // Try to get translation separately
        let translations: string[] = []
        try {
          const transRes = await fetch(
            `https://api.alquran.cloud/v1/surah/${surah}/${getTranslationEdition()}`
          )
          const transData = await transRes.json()
          if (transData.status === "OK") {
            translations = transData.data.ayahs.map((a: any) => a.text)
          }
        } catch {
          // Translation failed — use empty strings
        }

        combined = arabicData.data.ayahs.map((ayah: any, index: number) => {
          let text = ayah.text
          if (ayah.numberInSurah === 1 && Number(surah) !== 1 && Number(surah) !== 9) {
            const words = text.split(" ")
            if (words.length > 4) text = words.slice(4).join(" ").trim()
          }
          return {
            number: ayah.numberInSurah,
            numberInQuran: ayah.number,
            text,
            translation: translations[index] ?? "",
            page: ayah.page,
          }
        })
      }
    } catch (e) {
      console.log("Primary API failed:", e)
    }

    if (combined.length === 0) {
      throw new Error("All APIs failed")
    }

    setVerseList(combined)
    if (combined.length > 0) setCurrentPage(combined[0].page || 1)

      // ── Cache the verses ──
        try {
          const cacheKey = `quran_surah_${surah}_${i18n.language}`
          await AsyncStorage.setItem(cacheKey, JSON.stringify(combined))
        } catch (e) {}

    const { data: { session } } = await supabase.auth.getSession()
    if (session) {
      const { data: progress } = await supabase
        .from("quran_progress")
        .select("verse_number")
        .eq("user_id", session.user.id)
        .eq("surah_number", Number(surah))
        .maybeSingle()

      if (progress?.verse_number) {
        const idx = combined.findIndex(v => v.number === progress.verse_number)
        if (idx >= 0) setInitialIndex(idx)
      }
    }
  } catch (e) {
    console.log("Quran API error:", e)
    setVerseList([])
  } finally {
    setLoading(false)
  }
}


  // ─── FETCH BOOKMARKS ───────────────────────────────────────────────────────

  const fetchBookmarks = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return
      const { data } = await supabase
        .from("quran_bookmarks")
        .select("verse_number")
        .eq("user_id", session.user.id)
        .eq("surah_number", Number(surah))
      if (data) setBookmarked(new Set(data.map((b: any) => b.verse_number)))
    } catch (e) {
      console.log("Bookmark fetch error:", e)
    }
  }

  // ─── TOGGLE BOOKMARK ───────────────────────────────────────────────────────

  const toggleBookmark = async (verse: Verse) => {
  try {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      console.log("No session — user not logged in")
      return
    }

    if (bookmarked.has(verse.number)) {
      const { error } = await supabase.from("quran_bookmarks").delete()
        .eq("user_id", session.user.id)
        .eq("surah_number", Number(surah))
        .eq("verse_number", verse.number)
      console.log("Delete error:", error)  // 👈 add this
      setBookmarked(prev => { const next = new Set(prev); next.delete(verse.number); return next })
    } else {
      const { error } = await supabase.from("quran_bookmarks").insert({
        user_id: session.user.id,
        surah_number: Number(surah),
        surah_name: name,
        surah_arabic: arabicName,
        verse_number: verse.number,
        verse_text: verse.text,
        verse_translation: verse.translation,
      })
      console.log("Insert error:", error)  // 👈 add this
      if (!error) {
        setBookmarked(prev => new Set([...prev, verse.number]))
      }
    }
  } catch (e) {
    console.log("Bookmark toggle error:", e)
  }
}

  // ─── SAVE PROGRESS ─────────────────────────────────────────────────────────

  const saveProgress = (verseNumber: number) => {
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) return
        await supabase.from("quran_progress").upsert({
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
      <View style={styles.verseTop}>
        <View style={styles.verseBadge}>
          <Text style={styles.verseBadgeText}>{item.number}</Text>
        </View>
        <TouchableOpacity onPress={() => toggleBookmark(item)}>
          <Ionicons
            name={bookmarked.has(item.number) ? "bookmark" : "bookmark-outline"}
            size={18} color={theme.gold}
          />
        </TouchableOpacity>
      </View>
      <Text style={[styles.verseArabic, fontsLoaded && { fontFamily: "ScheherazadeNew_400Regular" }]}>
        {item.text}
      </Text>
      <View style={styles.verseDivider} />
      <Text style={[styles.verseTranslation, { color: theme.textSecondary }]}>
        {item.translation}
      </Text>
    </View>
  )

  // ─── RENDER ────────────────────────────────────────────────────────────────

  return (
  <View style={[styles.screen, { backgroundColor: theme.background }]}>
    <StatusBar style="light" />

    {viewMode === "mushaf" ? (
      <MushafView
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        insets={insets}
        router={router}
        setViewMode={setViewMode}
        fontsLoaded={fontsLoaded}
      />
    ) : (
      <>
        <View style={[styles.header, { paddingTop: insets.top }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={22} color="#fff" />
            <Text style={styles.backText}>Quran</Text>
          </TouchableOpacity>
          <Text style={[styles.headerArabic, fontsLoaded && { fontFamily: "ScheherazadeNew_700Bold" }]}>
            {arabicName}
          </Text>
          <Text style={styles.headerEnglish}>{name}</Text>
          <Text style={styles.headerMeta}>{verses} verses · {type}</Text>
          <TouchableOpacity
            onPress={() => setViewMode("mushaf")}
            style={styles.toggleBtn}
          >
            <Ionicons name="book-outline" size={20} color="#C9A84C" />
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator color="#C9A84C" size="large" />
            <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
              Loading {name}...
            </Text>
          </View>
        ) : (
          <FlatList
            ref={listRef}
            data={verseList}
            keyExtractor={item => item.number.toString()}
            renderItem={renderVerse}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.readList}
            onScrollToIndexFailed={(info) => {
              setTimeout(() => {
                listRef.current?.scrollToIndex({
                  index: info.index,
                  animated: false,
                  viewPosition: 0,
                })
              }, 500)
            }}
            onViewableItemsChanged={({ viewableItems }) => {
              if (viewableItems.length > 0) {
                const last = viewableItems[viewableItems.length - 1]
                if (last.item) saveProgress(last.item.number)
              }
            }}
            viewabilityConfig={{ itemVisiblePercentThreshold: 50 }}
            ListHeaderComponent={() => {
              if (Number(surah) === 9) return null
              return (
                <View style={[styles.bismillahCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
                  <Text style={[styles.bismillahText, fontsLoaded && { fontFamily: "ScheherazadeNew_700Bold" }, { color: theme.text }]}>
                    بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
                  </Text>
                  <Text style={[styles.bismillahTranslation, { color: theme.textSecondary }]}>
                    In the name of Allah, the Most Gracious, the Most Merciful
                  </Text>
                </View>
              )
            }}
            ListFooterComponent={() => (
              <View style={styles.footer}>
                <View style={styles.footerLine} />
                <Text style={[styles.footerText, { color: theme.textSecondary }]}>End of {name}</Text>
                <View style={styles.footerLine} />
              </View>
            )}
          />
        )}
      </>
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
  headerArabic: { fontSize: 32, color: "#C9A84C", textAlign: "center", marginBottom: 4 },
  headerEnglish: { fontSize: 18, fontWeight: "bold", color: "#fff", textAlign: "center", marginBottom: 4 },
  headerMeta: { fontSize: 12, color: "rgba(255,255,255,0.5)", textAlign: "center" },
  toggleBtn: { position: "absolute", right: 20, bottom: 16, backgroundColor: "rgba(201,168,76,0.15)", padding: 8, borderRadius: 10 },
  loadingContainer: { flex: 1, alignItems: "center", justifyContent: "center", gap: 16 },
  loadingText: { fontSize: 14 },
  readList: { padding: 16, paddingBottom: 100, gap: 12 },
  bismillahCard: { borderRadius: 16, padding: 20, alignItems: "center", borderWidth: 0.5, marginBottom: 4 },
  bismillahText: { fontSize: 26, textAlign: "center", marginBottom: 8 },
  bismillahTranslation: { fontSize: 12, textAlign: "center", lineHeight: 18 },
  verseCard: { borderRadius: 16, padding: 16, borderWidth: 0.5 },
  verseTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 14 },
  verseBadge: { width: 32, height: 32, borderRadius: 16, backgroundColor: "rgba(201,168,76,0.15)", borderWidth: 1, borderColor: "rgba(201,168,76,0.4)", alignItems: "center", justifyContent: "center" },
  verseBadgeText: { color: "#C9A84C", fontSize: 12, fontWeight: "700" },
  verseArabic: { fontSize: 26, textAlign: "right", lineHeight: 50, marginBottom: 14 } as any,
  verseDivider: { height: 0.5, backgroundColor: "rgba(201,168,76,0.3)", marginBottom: 12 },
  verseTranslation: { fontSize: 13, lineHeight: 22 },
  footer: { flexDirection: "row", alignItems: "center", gap: 12, padding: 16, paddingBottom: 40 },
  footerLine: { flex: 1, height: 0.5, backgroundColor: "#C9A84C" },
  footerText: { fontSize: 12, fontWeight: "600" },

  verseEndBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#C9A84C",
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 2,
    backgroundColor: "rgba(201,168,76,0.08)",
  },
  verseEndText: {
    fontSize: 11,
    color: "#C9A84C",
    textAlign: "center",
  },

})

const mStyles = StyleSheet.create({
  mushafRoot: {
    flex: 1,
    backgroundColor: "#FAF6EE",
  },
  mushafHeader: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#1E3A5F",
  },
  mushafHeaderBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  mushafHeaderBackText: {
    color: "#fff",
    fontSize: 14,
  },
  mushafToggleBtn: {
    backgroundColor: "rgba(201,168,76,0.15)",
    borderWidth: 1,
    borderColor: "#C9A84C",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  mushafToggleText: {
    color: "#C9A84C",
    fontSize: 12,
  },
  mushafPager: {
    flex: 1,
  },
  pageScroll: {
    flex: 1,
    backgroundColor: "#FAF6EE",
  },
  pageScrollContent: {
    flexGrow: 1,
    paddingBottom: 8,
  },
  pageLoading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FAF6EE",
  },
  pageError: {
    color: "#8B6914",
    fontSize: 14,
  },
  pageFrame: {
    flex: 1,
    margin: 12,
    backgroundColor: "#FAF6EE",
    borderWidth: 3,
    borderColor: "#8B6914",
    borderRadius: 2,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
    paddingHorizontal: 4,
  },
  metaText: {
    color: "#8B6914",
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  metaSurah: {
    color: "#C9A84C",
    maxWidth: "40%",
    textAlign: "right",
  },
  ornamentTop: { marginBottom: 8 },
  ornamentBottom: { marginTop: 8 },
  borderLineOuter: {
    height: 2,
    backgroundColor: "#8B6914",
    borderRadius: 1,
  },
  borderLineInner: {
    height: 0.8,
    backgroundColor: "#C9A84C",
    marginHorizontal: 6,
    marginVertical: 3,       // was 2
    borderRadius: 1,
  },
  surahBanner: {
    alignItems: "center",
    marginVertical: 8,       // was 6
  },
  surahBannerInner: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#8B6914",
    paddingHorizontal: 20,   // was 16
    paddingVertical: 6,      // was 4
    gap: 12,
    backgroundColor: "#F5EDD6",
  },
  surahBannerDiamond: {
    width: 8,
    height: 8,
    backgroundColor: "#8B6914",
    transform: [{ rotate: "45deg" }],
  },
  surahBannerText: {
    fontSize: 24,            // was 22
    color: "#5C3D00",
    textAlign: "center",
  },
  bismillahRow: {
    alignItems: "center",
    paddingVertical: 8,      // was 6
    borderTopWidth: 0.5,
    borderBottomWidth: 0.5,
    borderColor: "rgba(139,105,20,0.3)",
    marginHorizontal: 4,
    marginBottom: 6,         // was 4
  },
  bismillahText: {
    fontSize: 24,            // was 22
    color: "#1E3A5F",
    textAlign: "center",
  },
  lineRow: {
    flexDirection: "row-reverse",
    justifyContent: "center",
    alignItems: "center",
    flexWrap: "nowrap",
  },
  lineRowLast: {
    justifyContent: "center",
  },
  word: {
    fontSize: 22,            // was 20
    color: "#1E3A5F",
    lineHeight: 44,          // was 36 — this is the key fix
    marginHorizontal: 2,     // was 1
  },
  navBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingTop: 10,
    backgroundColor: "#1E3A5F",
  },
  navBtnRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  navCenter: {
    alignItems: "center",
  },
  navLabel: { color: "#C9A84C", fontSize: 13, fontWeight: "600" },
  navPage: { color: "#fff", fontSize: 18, fontWeight: "600" },
  navTotal: { color: "rgba(255,255,255,0.4)", fontSize: 10 },
  verseEndBadge: {
    width: 32,               // was 28
    height: 32,              // was 28
    borderRadius: 16,        // was 14
    borderWidth: 1,
    borderColor: "#C9A84C",
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 3,     // was 2
    backgroundColor: "rgba(201,168,76,0.08)",
  },
  verseEndText: {
    fontSize: 12,            // was 11
    color: "#C9A84C",
    textAlign: "center",
  },
})