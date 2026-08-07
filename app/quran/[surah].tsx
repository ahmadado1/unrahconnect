import QuranJumpPicker, { type QuranJumpTarget } from "@/app/components/QuranJumpPicker"
import QuranReadModeToggle from "@/app/components/QuranReadModeToggle"
import { useTheme } from "@/context/themeContext"
import i18n from "@/i18n"
import { juzForPage } from "@/lib/mushafJuz"
import {
  getCachedQuranReadMode,
  getQuranReadMode,
  setQuranReadMode,
  type QuranReadMode,
} from "@/lib/quranReadMode"
import { getSurahMeta } from "@/lib/quranSurahMeta"
import { ScheherazadeNew_400Regular, ScheherazadeNew_700Bold, useFonts } from "@expo-google-fonts/scheherazade-new"
import { Ionicons } from "@expo/vector-icons"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router"
import { StatusBar } from "expo-status-bar"
import { useCallback, useEffect, useRef, useState, type MutableRefObject, type RefObject } from "react"
import { useTranslation } from "react-i18next"
import { ActivityIndicator, Dimensions, FlatList, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native"
import { FlatList as GestureFlatList, GestureHandlerRootView } from "react-native-gesture-handler"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { supabase } from "../../lib/supabase"
import {
  fetchAndCachePage,
  getFirstVerseOnPage,
  preloadAdjacentPages,
  type MushafPageData,
  type MushafVerse,
} from "../../lib/quranPageCache"
import {
  fetchAndCacheSurah,
  normalizeReadLanguage,
  peekCachedSurah,
  readSurahOfflineFirst,
} from "../../lib/quranReadCache"

// ─── TYPES ───────────────────────────────────────────────────────────────────

type Verse = {
  number: number
  numberInQuran: number
  text: string
  translation: string
  page: number
}

// MushafVerse and MushafPageData imported from lib/quranPageCache

type FlowItem =
  | { type: "word"; text: string; key: string }
  | { type: "end"; verseNumber: number; key: string }
  | { type: "surahStart"; surahNumber: number; key: string }

const BISMILLAH = "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ"
const MUSHAF_PAGE_COUNT = 604
const { width: SCREEN_WIDTH } = Dimensions.get("window")

const MUSHAF_INSETS = {
  scrollPaddingH: 4,
  frameOuterMargin: 4,
  frameOuterBorder: 2.5,
  frameOuterPadding: 4,
  frameInnerBorder: 1,
  contentPaddingH: 12,
} as const

const MUSHAF_INNER_FRAME_WIDTH =
  SCREEN_WIDTH -
  MUSHAF_INSETS.scrollPaddingH * 2 -
  MUSHAF_INSETS.frameOuterMargin * 2 -
  MUSHAF_INSETS.frameOuterBorder * 2 -
  MUSHAF_INSETS.frameOuterPadding * 2 -
  MUSHAF_INSETS.frameInnerBorder * 2

// ─── MUSHAF HELPERS ──────────────────────────────────────────────────────────

async function fetchMushafPage(page: number): Promise<MushafPageData> {
  const data = await fetchAndCachePage(page)
  if (!data) throw new Error(`Failed to fetch page ${page}`)
  return data
}

function buildPageFlow(verses: MushafVerse[]): FlowItem[] {
  const items: FlowItem[] = []

  for (const verse of verses) {
    if (verse.verse_number === 1) {
      const surahNumber = parseInt(verse.verse_key.split(":")[0], 10)
      items.push({
        type: "surahStart",
        surahNumber,
        key: `surah-start-${surahNumber}-${verse.verse_key}`,
      })
    }

    for (const word of verse.words) {
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

  return items
}

function SurahBanner({ name, fontsLoaded }: { name: string; fontsLoaded: boolean }) {
  if (!name) return null

  return (
    <View style={mStyles.surahBanner}>
      <View style={mStyles.surahBannerFrame}>
        <View style={mStyles.surahBannerInner}>
          <View style={mStyles.surahBannerSide}>
            <View style={mStyles.surahBannerDiamondOuter} />
            <View style={mStyles.surahBannerDiamondInner} />
          </View>
          <Text
            style={[
              mStyles.surahBannerText,
              fontsLoaded && { fontFamily: "ScheherazadeNew_700Bold" },
            ]}
          >
            {name}
          </Text>
          <View style={mStyles.surahBannerSide}>
            <View style={mStyles.surahBannerDiamondInner} />
            <View style={mStyles.surahBannerDiamondOuter} />
          </View>
        </View>
      </View>
    </View>
  )
}

function MushafTextFlow({
  items,
  fontsLoaded,
  surahNames,
  targetSurah,
  pageScrollRef,
  didScrollToSurah,
}: {
  items: FlowItem[]
  fontsLoaded: boolean
  surahNames: Record<number, string>
  targetSurah?: number
  pageScrollRef: RefObject<ScrollView | null>
  didScrollToSurah: MutableRefObject<boolean>
}) {
  return (
    <View style={mStyles.textFlow}>
      {items.map(item => {
        if (item.type === "surahStart") {
          const { surahNumber } = item
          return (
            <View
              key={item.key}
              style={mStyles.flowSurahBlock}
              onLayout={e => {
                if (!targetSurah || surahNumber !== targetSurah || didScrollToSurah.current) return
                didScrollToSurah.current = true
                const node = e.target as unknown as {
                  measureInWindow?: (cb: (x: number, y: number) => void) => void
                }
                node.measureInWindow?.((x, y) => {
                  pageScrollRef.current?.measureInWindow((sx, sy) => {
                    pageScrollRef.current?.scrollTo({
                      y: Math.max(0, y - sy - 4),
                      animated: false,
                    })
                  })
                })
              }}
            >
              <SurahBanner
                name={surahNames[surahNumber] ?? ""}
                fontsLoaded={fontsLoaded}
              />
              {surahNumber !== 9 && surahNumber !== 1 && (
                <View style={mStyles.bismillahRow}>
                  <Text
                    style={[
                      mStyles.bismillahText,
                      fontsLoaded && { fontFamily: "ScheherazadeNew_700Bold" },
                    ]}
                  >
                    {BISMILLAH}
                  </Text>
                </View>
              )}
            </View>
          )
        }

        if (item.type === "word") {
          return (
            <Text
              key={item.key}
              style={[
                mStyles.word,
                fontsLoaded && { fontFamily: "ScheherazadeNew_700Bold" },
              ]}
            >
              {item.text}
            </Text>
          )
        }

        return (
          <View key={item.key} style={mStyles.verseEndBadge}>
            <Text style={mStyles.verseEndText}>{item.verseNumber}</Text>
          </View>
        )
      })}
    </View>
  )
}

function MushafPageContent({
  pageNumber,
  fontsLoaded,
  surahNames,
  targetSurah,
}: {
  pageNumber: number
  fontsLoaded: boolean
  surahNames: Record<number, string>
  targetSurah?: number
}) {
  const scrollRef = useRef<ScrollView>(null)
  const [pageData, setPageData] = useState<MushafPageData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const didScrollToSurah = useRef(false)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(false)
    didScrollToSurah.current = false

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

  useEffect(() => {
    scrollRef.current?.scrollTo({ y: 0, animated: false })
    didScrollToSurah.current = false
  }, [pageNumber, targetSurah])

  if (loading) {
    return (
      <View style={mStyles.pageContainer}>
        <View style={mStyles.pageLoading}>
          <ActivityIndicator color="#8B6914" size="large" />
        </View>
      </View>
    )
  }

  if (error || !pageData) {
    return (
      <View style={mStyles.pageContainer}>
        <View style={mStyles.pageLoading}>
          <Text style={mStyles.pageError}>Unable to load page {pageNumber}</Text>
        </View>
      </View>
    )
  }

  const primarySurah = parseInt(pageData.verses[0]?.verse_key.split(":")[0] ?? "1", 10)
  const primarySurahName = surahNames[targetSurah ?? primarySurah] ?? surahNames[primarySurah] ?? ""
  const flowItems = buildPageFlow(pageData.verses)
  // Prefer API juz; always clamp via Madani page→juz so layout never glues juz+page (e.g. "Juz 350")
  const juzNumber = juzForPage(pageNumber)

  return (
    <View style={mStyles.pageContainer}>
      <View style={mStyles.pageMetaBar}>
        <Text style={mStyles.metaText}>Juz {juzNumber}</Text>
        <Text style={mStyles.metaSeparator}>·</Text>
        <Text style={mStyles.metaText}>Page {pageNumber}</Text>
        <Text style={[mStyles.metaText, mStyles.metaSurah]} numberOfLines={1}>
          {primarySurahName}
        </Text>
      </View>

      <ScrollView
        ref={scrollRef}
        style={mStyles.pageScroll}
        contentContainerStyle={mStyles.pageScrollContent}
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled
        directionalLockEnabled
        scrollEventThrottle={16}
      >
        <View style={mStyles.pageFrameOuter}>
          <View style={mStyles.pageFrameInner}>
            <View style={mStyles.pageContent}>
              <View style={mStyles.ornamentTop}>
                <View style={mStyles.borderLineOuter} />
                <View style={mStyles.borderLineInner} />
              </View>

              <MushafTextFlow
                items={flowItems}
                fontsLoaded={fontsLoaded}
                surahNames={surahNames}
                targetSurah={targetSurah}
                pageScrollRef={scrollRef}
                didScrollToSurah={didScrollToSurah}
              />

              <View style={mStyles.ornamentBottom}>
                <View style={mStyles.borderLineInner} />
                <View style={mStyles.borderLineOuter} />
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  )
}

function MushafView({
  currentPage,
  setCurrentPage,
  insets,
  router,
  fontsLoaded,
  targetSurah,
  targetAyah,
  onJump,
  onSwitchToVerses,
}: {
  currentPage: number
  setCurrentPage: (p: number) => void
  insets: any
  router: any
  fontsLoaded: boolean
  targetSurah?: number
  targetAyah?: number
  onJump: (target: QuranJumpTarget) => void
  onSwitchToVerses: () => void
}) {
  const { t } = useTranslation()
  const flatListRef = useRef<GestureFlatList<number>>(null)
  /**
   * RTL mushaf order: index 0 = page 604 … last = page 1.
   * Swipe right (lower index) → higher page number, as in a printed Arabic mushaf.
   */
  const pages = useRef(
    Array.from({ length: MUSHAF_PAGE_COUNT }, (_, i) => MUSHAF_PAGE_COUNT - i),
  ).current
  const pageToIndex = (page: number) => MUSHAF_PAGE_COUNT - page
  const indexToPage = (index: number) => MUSHAF_PAGE_COUNT - index

  const [surahNames, setSurahNames] = useState<Record<number, string>>({})
  const [jumpOpen, setJumpOpen] = useState(false)
  const pageIndex = pageToIndex(
    Math.min(Math.max(currentPage, 1), MUSHAF_PAGE_COUNT),
  )
  const pageFromSwipeRef = useRef(false)
  const hasSyncedPagerRef = useRef(false)

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

  // Prefetch current ±1 so swipe doesn't hit a loading spinner
  useEffect(() => {
    preloadAdjacentPages(currentPage)
  }, [currentPage])

  // Sync pager when page changes via Prev/Next / jump (not from swipe itself)
  useEffect(() => {
    if (pageFromSwipeRef.current) {
      pageFromSwipeRef.current = false
      return
    }
    const animated = hasSyncedPagerRef.current
    hasSyncedPagerRef.current = true
    const timer = setTimeout(() => {
      flatListRef.current?.scrollToIndex({
        index: pageIndex,
        animated,
      })
    }, 50)
    return () => clearTimeout(timer)
  }, [pageIndex, targetSurah])

  return (
    <GestureHandlerRootView style={mStyles.mushafRoot}>
      <View style={[mStyles.mushafHeader, { paddingTop: insets.top }]}>
        <TouchableOpacity onPress={() => router.back()} style={mStyles.mushafHeaderBtn}>
          <Ionicons name="chevron-back" size={20} color="#fff" />
          <Text style={mStyles.mushafHeaderBackText}>Quran</Text>
        </TouchableOpacity>

        <View style={mStyles.mushafHeaderActions}>
          <TouchableOpacity
            onPress={() => setJumpOpen(true)}
            style={mStyles.mushafToggleBtn}
            accessibilityLabel="Go to surah and ayah"
          >
            <Ionicons name="search-outline" size={16} color="#C9A84C" />
            <Text style={mStyles.mushafToggleText}>Go to</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={onSwitchToVerses}
            style={mStyles.mushafToggleBtn}
            accessibilityLabel="Switch to verse view"
          >
            <Ionicons name="list-outline" size={16} color="#C9A84C" />
            <Text style={mStyles.mushafToggleText}>{t("quranReadModeVersesShort")}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <QuranJumpPicker
        visible={jumpOpen}
        onClose={() => setJumpOpen(false)}
        onJump={onJump}
        initialSurah={targetSurah}
        initialAyah={targetAyah}
      />

      <GestureFlatList
        ref={flatListRef}
        data={pages}
        horizontal
        pagingEnabled
        nestedScrollEnabled
        showsHorizontalScrollIndicator={false}
        initialScrollIndex={pageIndex}
        keyExtractor={item => item.toString()}
        style={mStyles.mushafPager}
        windowSize={5}
        maxToRenderPerBatch={3}
        initialNumToRender={3}
        getItemLayout={(_, index) => ({
          length: SCREEN_WIDTH,
          offset: SCREEN_WIDTH * index,
          index,
        })}
        onMomentumScrollEnd={e => {
          const index = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH)
          const newPage = indexToPage(index)
          if (newPage < 1 || newPage > MUSHAF_PAGE_COUNT || newPage === currentPage) return
          pageFromSwipeRef.current = true
          setCurrentPage(newPage)
        }}
        renderItem={({ item }) => (
          <MushafPageContent
            pageNumber={item}
            fontsLoaded={fontsLoaded}
            surahNames={surahNames}
            targetSurah={targetSurah}
          />
        )}
        onScrollToIndexFailed={info => {
          flatListRef.current?.scrollToOffset({
            offset: SCREEN_WIDTH * info.index,
            animated: false,
          })
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
  const { t } = useTranslation()
  const insets = useSafeAreaInsets()
  const [scrollToVerseIndex, setScrollToVerseIndex] = useState<number | null>(null)
  const listRef = useRef<FlatList>(null)
  const didScrollForSurahRef = useRef<string | null>(null)
  const { surah, name, arabicName, verses, type, resume, ayah, mode } = useLocalSearchParams<{
    surah: string
    name: string
    arabicName: string
    verses: string
    type: string
    resume?: string
    ayah?: string
    mode?: string
  }>()
  const shouldResume = resume === "1"
  const requestedAyah = ayah ? Number(ayah) : NaN

  const resolveInitialMode = (): QuranReadMode => {
    if (mode === "mushaf" || mode === "verses") return mode
    if (mode === "text") return "verses" // legacy param
    return getCachedQuranReadMode() ?? "verses"
  }

  const [viewMode, setViewMode] = useState<QuranReadMode>(resolveInitialMode)
  const [jumpOpen, setJumpOpen] = useState(false)
  const [visibleVerseNumber, setVisibleVerseNumber] = useState(1)

  const initialLang = normalizeReadLanguage(i18n.language)
  const initialSurahNum = surah ? Number(surah) : 0
  const initialCached = initialSurahNum > 0 ? peekCachedSurah(initialSurahNum, initialLang) : null
  const initialAyahVerse =
    Number.isFinite(requestedAyah) && initialCached
      ? initialCached.find(v => v.number === requestedAyah)
      : undefined

  const [currentPage, setCurrentPage] = useState(
    () => initialAyahVerse?.page || initialCached?.[0]?.page || 1,
  )
  const [verseList, setVerseList] = useState<Verse[]>(() => initialCached ?? [])
  const [loading, setLoading] = useState(() => !initialCached?.length)
  const [bookmarked, setBookmarked] = useState<Set<number>>(new Set())
  const saveTimer = useRef<any>(null)
  const loadRequestRef = useRef(0)
  const switchingRef = useRef(false)

  // Keep view mode from jump / navigation params
  useEffect(() => {
    if (mode === "mushaf" || mode === "verses") setViewMode(mode)
    else if (mode === "text") setViewMode("verses")
  }, [mode, surah])

  const [fontsLoaded] = useFonts({
    ScheherazadeNew_400Regular,
    ScheherazadeNew_700Bold,
  })

  useFocusEffect(
    useCallback(() => {
      let active = true
      getQuranReadMode().then(storedMode => {
        // Don't override an explicit navigation param mid-session
        if (!active || !storedMode) return
        if (!mode) setViewMode(storedMode)
      })
      return () => {
        active = false
      }
    }, [mode]),
  )

  const persistViewMode = async (next: QuranReadMode) => {
    setViewMode(next)
    await setQuranReadMode(next)
  }

  /** Mushaf → Verse: land on the first ayah of the current page (may change surah). */
  const switchToVerses = async () => {
    if (switchingRef.current) return
    switchingRef.current = true
    try {
      const first = await getFirstVerseOnPage(currentPage)
      await persistViewMode("verses")

      if (!first) {
        didScrollForSurahRef.current = null
        setScrollToVerseIndex(0)
        return
      }

      if (first.surah === Number(surah)) {
        const idx = verseList.findIndex(v => v.number === first.ayah)
        didScrollForSurahRef.current = null
        setScrollToVerseIndex(idx >= 0 ? idx : 0)
        setVisibleVerseNumber(first.ayah)
        return
      }

      const meta = getSurahMeta(first.surah)
      if (!meta) return
      router.replace({
        pathname: "/quran/[surah]",
        params: {
          surah: String(meta.number),
          name: meta.englishName,
          arabicName: meta.arabicName,
          verses: String(meta.ayahCount),
          type: meta.revelationType,
          resume: "0",
          ayah: String(first.ayah),
          mode: "verses",
        },
      })
    } finally {
      switchingRef.current = false
    }
  }

  /** Verse → Mushaf: open the page containing the verse currently on screen. */
  const switchToMushaf = async () => {
    if (switchingRef.current) return
    switchingRef.current = true
    try {
      const ayahNum =
        visibleVerseNumber ||
        (scrollToVerseIndex != null ? verseList[scrollToVerseIndex]?.number : undefined) ||
        verseList[0]?.number ||
        1
      const page =
        verseList.find(v => v.number === ayahNum)?.page ||
        verseList[0]?.page ||
        currentPage ||
        1
      setCurrentPage(page)
      await persistViewMode("mushaf")
    } finally {
      switchingRef.current = false
    }
  }

  const resolveScrollTarget = async (loaded: Verse[]): Promise<number> => {
    // Explicit jump / deep-link to a specific ayah
    if (Number.isFinite(requestedAyah) && requestedAyah >= 1) {
      const idx = loaded.findIndex(v => v.number === requestedAyah)
      if (idx >= 0) return idx
    }

    // Surah list → always open at the first ayah of that surah
    if (!shouldResume) return 0

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return 0

      const { data: progress } = await supabase
        .from("quran_progress")
        .select("verse_number")
        .eq("user_id", session.user.id)
        .eq("surah_number", Number(surah))
        .maybeSingle()

      if (progress?.verse_number) {
        const idx = loaded.findIndex(v => v.number === progress.verse_number)
        if (idx >= 0) return idx
      }
    } catch {
      // fall through to ayah 1
    }
    return 0
  }

  const handleJump = (target: QuranJumpTarget) => {
    const sameSurah = Number(surah) === target.surah.number

    if (sameSurah) {
      setCurrentPage(target.page)
      const idx = verseList.findIndex(v => v.number === target.ayah)
      didScrollForSurahRef.current = null
      setScrollToVerseIndex(idx >= 0 ? idx : 0)
      return
    }

    router.replace({
      pathname: "/quran/[surah]",
      params: {
        surah: String(target.surah.number),
        name: target.surah.englishName,
        arabicName: target.surah.arabicName,
        verses: String(target.surah.ayahCount),
        type: target.surah.revelationType,
        resume: "0",
        ayah: String(target.ayah),
        mode: viewMode === "mushaf" ? "mushaf" : "verses",
      },
    })
  }

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

  const applyLoadedVerses = async (loaded: Verse[], requestId: number) => {
    setVerseList(loaded)
    setLoading(false)
    void fetchBookmarks()

    const target = await resolveScrollTarget(loaded)
    if (loadRequestRef.current !== requestId) return
    const page = loaded[target]?.page || loaded[0]?.page || 1
    setCurrentPage(page)
    setScrollToVerseIndex(target)
  }

  useEffect(() => {
    if (!surah) return

    const requestId = ++loadRequestRef.current
    const surahNum = Number(surah)
    const lang = normalizeReadLanguage(i18n.language)
    didScrollForSurahRef.current = null
    setScrollToVerseIndex(null)

    const load = async () => {
      const instant = peekCachedSurah(surahNum, lang)
      if (instant?.length) {
        if (loadRequestRef.current !== requestId) return
        await applyLoadedVerses(instant, requestId)
        return
      }

      // Prefer disk cache (any language) so read mode works offline after download.
      const cached = await readSurahOfflineFirst(surahNum, lang)
      if (loadRequestRef.current !== requestId) return

      if (cached?.length) {
        await applyLoadedVerses(cached, requestId)
        // Soft-refresh preferred language in background (don't re-trigger scroll)
        void fetchAndCacheSurah(surahNum, lang).then(fresh => {
          if (loadRequestRef.current !== requestId || !fresh?.length) return
          if (normalizeReadLanguage(i18n.language) === lang) {
            setVerseList(fresh)
          }
        })
        return
      }

      // Only show loading spinner when we truly have nothing offline.
      setVerseList([])
      setLoading(true)

      try {
        const combined = await fetchAndCacheSurah(surahNum, lang)
        if (loadRequestRef.current !== requestId) return

        if (combined?.length) {
          await applyLoadedVerses(combined, requestId)
        } else {
          setLoading(false)
        }
      } catch (e) {
        console.log("Quran API error:", e)
        if (loadRequestRef.current === requestId) {
          setLoading(false)
        }
      }
    }

    load()
  }, [surah, i18n.language, shouldResume, requestedAyah])

  // Jump to the selected surah's ayah once verses are ready (index 0 = first ayah)
  useEffect(() => {
    if (loading || scrollToVerseIndex === null || verseList.length === 0) return
    if (viewMode !== "verses") return

    const surahKey = `${surah}:${scrollToVerseIndex}`
    if (didScrollForSurahRef.current === surahKey) return

    const index = Math.min(Math.max(scrollToVerseIndex, 0), verseList.length - 1)

    const timer = setTimeout(() => {
      if (index <= 0) {
        listRef.current?.scrollToOffset({ offset: 0, animated: false })
      } else {
        listRef.current?.scrollToIndex({
          index,
          animated: false,
          viewPosition: 0,
        })
      }
      didScrollForSurahRef.current = surahKey
      const verseNum = verseList[index]?.number
      if (verseNum) setVisibleVerseNumber(verseNum)
    }, 50)

    return () => clearTimeout(timer)
  }, [loading, scrollToVerseIndex, verseList.length, surah, viewMode])


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
      console.log("Delete error:", error)
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
      console.log("Insert error:", error)
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
      <Text
        style={[
          styles.verseArabic,
          fontsLoaded && { fontFamily: "ScheherazadeNew_400Regular" },
        ]}
      >
        {item.text}
      </Text>
      {item.translation ? (
        <>
          <View style={styles.verseDivider} />
          <Text style={[styles.verseTranslation, { color: theme.textSecondary }]}>
            {item.translation}
          </Text>
        </>
      ) : null}
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
        fontsLoaded={fontsLoaded}
        targetSurah={Number(surah) || undefined}
        targetAyah={Number.isFinite(requestedAyah) ? requestedAyah : scrollToVerseIndex != null ? verseList[scrollToVerseIndex]?.number : 1}
        onJump={handleJump}
        onSwitchToVerses={switchToVerses}
      />
    ) : (
      <>
        <View style={[styles.header, { paddingTop: insets.top }]}>
          <View style={styles.headerTop}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
              <Ionicons name="chevron-back" size={22} color="#fff" />
              <Text style={styles.backText}>Quran</Text>
            </TouchableOpacity>
            <View style={styles.headerTopActions}>
              <TouchableOpacity
                onPress={() => setJumpOpen(true)}
                style={styles.jumpBtn}
                accessibilityLabel="Go to surah and ayah"
              >
                <Ionicons name="search-outline" size={18} color="#C9A84C" />
                <Text style={styles.jumpBtnLabel}>Go to</Text>
              </TouchableOpacity>
              <QuranReadModeToggle mode="verses" onToggle={switchToMushaf} />
            </View>
          </View>
          <Text style={[styles.headerArabic, fontsLoaded && { fontFamily: "ScheherazadeNew_700Bold" }]}>
            {arabicName}
          </Text>
          <Text style={styles.headerEnglish}>{name}</Text>
          <Text style={styles.headerMeta}>{verses} verses · {type}</Text>
        </View>

        <QuranJumpPicker
          visible={jumpOpen}
          onClose={() => setJumpOpen(false)}
          onJump={handleJump}
          initialSurah={Number(surah) || 1}
          initialAyah={
            Number.isFinite(requestedAyah)
              ? requestedAyah
              : scrollToVerseIndex != null
                ? verseList[scrollToVerseIndex]?.number ?? 1
                : 1
          }
        />

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator color="#C9A84C" size="large" />
            <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
              Loading {name}...
            </Text>
          </View>
        ) : verseList.length === 0 ? (
          <View style={styles.loadingContainer}>
            <Ionicons name="cloud-offline-outline" size={40} color={theme.textSecondary} />
            <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
              {t("unableToLoadVerses")}
            </Text>
          </View>
        ) : (
          <FlatList
            ref={listRef}
            key={`surah-verses-${surah}`}
            data={verseList}
            keyExtractor={item => `${surah}-${item.number}`}
            renderItem={renderVerse}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.readList}
            initialNumToRender={Math.min(verseList.length, 12)}
            onScrollToIndexFailed={info => {
              listRef.current?.scrollToOffset({
                offset: Math.max(0, info.averageItemLength * info.index),
                animated: false,
              })
              setTimeout(() => {
                listRef.current?.scrollToIndex({
                  index: info.index,
                  animated: false,
                  viewPosition: 0,
                })
              }, 250)
            }}
            onViewableItemsChanged={({ viewableItems }) => {
              if (viewableItems.length > 0) {
                const first = viewableItems[0]?.item
                const last = viewableItems[viewableItems.length - 1]?.item
                if (first?.number) setVisibleVerseNumber(first.number)
                if (last?.number) saveProgress(last.number)
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
  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  headerTopActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  jumpBtn: {
    minHeight: 36,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: "rgba(201,168,76,0.15)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  jumpBtnLabel: {
    color: "#C9A84C",
    fontSize: 12,
    fontWeight: "700",
  },
  backBtn: { flexDirection: "row", alignItems: "center", gap: 4 },
  backText: { color: "rgba(255,255,255,0.6)", fontSize: 14 },
  headerArabic: { fontSize: 32, color: "#C9A84C", textAlign: "center", marginBottom: 4 },
  headerEnglish: { fontSize: 18, fontWeight: "bold", color: "#fff", textAlign: "center", marginBottom: 4 },
  headerMeta: { fontSize: 12, color: "rgba(255,255,255,0.5)", textAlign: "center" },
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
  pageContainer: {
    flex: 1,
    width: SCREEN_WIDTH,
    backgroundColor: "#FAF6EE",
  },
  pageMetaBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: "#FAF6EE",
    borderBottomWidth: 0.5,
    borderBottomColor: "rgba(139,105,20,0.25)",
  },
  metaSeparator: {
    color: "rgba(139,105,20,0.45)",
    fontSize: 12,
    fontWeight: "600",
  },
  mushafHeaderActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  pageScroll: {
    flex: 1,
    backgroundColor: "#FAF6EE",
  },
  pageScrollContent: {
    paddingBottom: 24,
    paddingHorizontal: 4,
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
  pageFrameOuter: {
    marginHorizontal: 4,
    marginVertical: 8,
    borderWidth: 2.5,
    borderColor: "#8B6914",
    padding: 4,
    backgroundColor: "#FAF6EE",
    alignSelf: "stretch",
  },
  pageFrameInner: {
    borderWidth: 1,
    borderColor: "#8B6914",
    backgroundColor: "#FAF6EE",
    overflow: "hidden",
  },
  pageContent: {
    paddingHorizontal: 12,
    paddingTop: 20,
    paddingBottom: 20,
    overflow: "hidden",
    width: "100%",
  },
  metaText: {
    color: "#8B6914",
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  metaSurah: {
    color: "#C9A84C",
    flex: 1,
    textAlign: "right",
    marginLeft: "auto",
  },
  ornamentTop: { marginBottom: 8 },
  ornamentBottom: { marginTop: 8 },
  borderLineOuter: {
    height: 2.5,
    backgroundColor: "#8B6914",
    borderRadius: 1,
  },
  borderLineInner: {
    height: 1,
    backgroundColor: "#8B6914",
    marginVertical: 4,
    borderRadius: 1,
  },
  surahBanner: {
    alignItems: "center",
    marginVertical: 8,
    width: "100%",
  },
  surahBannerFrame: {
    borderWidth: 1,
    borderColor: "#8B6914",
    paddingHorizontal: 6,
    paddingVertical: 4,
    backgroundColor: "#F5EDD6",
    maxWidth: "100%",
  },
  surahBannerInner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#8B6914",
    paddingHorizontal: 28,
    paddingVertical: 8,
    gap: 16,
    backgroundColor: "#FAF6EE",
  },
  surahBannerSide: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  surahBannerDiamondOuter: {
    width: 10,
    height: 10,
    borderWidth: 1,
    borderColor: "#8B6914",
    backgroundColor: "#F5EDD6",
    transform: [{ rotate: "45deg" }],
  },
  surahBannerDiamondInner: {
    width: 6,
    height: 6,
    backgroundColor: "#8B6914",
    transform: [{ rotate: "45deg" }],
  },
  surahBannerText: {
    fontSize: 22,
    color: "#5C3D00",
    textAlign: "center",
    flexShrink: 1,
  },
  bismillahRow: {
    alignItems: "center",
    paddingVertical: 8,
    borderTopWidth: 0.5,
    borderBottomWidth: 0.5,
    borderColor: "rgba(139,105,20,0.3)",
    marginBottom: 6,
    width: "100%",
  },
  bismillahText: {
    fontSize: 26,
    color: "#1E3A5F",
    textAlign: "center",
    lineHeight: 48,
  },
  textFlow: {
    flexDirection: "row-reverse",
    flexWrap: "wrap",
    alignItems: "center",
    width: "100%",
    overflow: "hidden",
  },
  flowSurahBlock: {
    width: "100%",
    flexBasis: "100%",
  },
  word: {
    fontSize: 26,
    color: "#1E3A5F",
    lineHeight: 52,
    marginHorizontal: 1,
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
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#C9A84C",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(201,168,76,0.08)",
    flexShrink: 0,
  },
  verseEndText: {
    fontSize: 11,
    color: "#C9A84C",
    textAlign: "center",
  },
})