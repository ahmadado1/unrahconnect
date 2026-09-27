import MushafFittedLine from "@/app/components/MushafFittedLine"
import { useTheme } from "@/context/themeContext"
import { AL_KAHF_SURAH_NUMBER } from "@/lib/alKahfWindow"
import { buildMushafBlocks } from "@/lib/mushafLines"
import {
  KAHF_AYAH_COUNT,
  KAHF_FALLBACK_END_PAGE,
  KAHF_FALLBACK_START_PAGE,
  kahfProgressFraction,
  loadKahfWeeklyProgress,
  markKahfWeekComplete,
  resolveKahfPageRange,
  saveKahfWeeklyProgress,
  type KahfWeeklyProgress,
} from "@/lib/kahfWeekly"
import { juzForPage } from "@/lib/mushafJuz"
import { scheduleAlKahfReminder } from "@/lib/notifications"
import {
  fetchAndCachePage,
  preloadAdjacentPages,
  type MushafPageData,
  type MushafVerse,
} from "@/lib/quranPageCache"
import { recordQuranLastRead } from "@/lib/quranLastRead"
import { getSurahMeta } from "@/lib/quranSurahMeta"
import { ScheherazadeNew_400Regular, ScheherazadeNew_700Bold, useFonts } from "@expo-google-fonts/scheherazade-new"
import { Ionicons } from "@expo/vector-icons"
import { useFocusEffect, useRouter } from "expo-router"
import { useKeepAwake } from "expo-keep-awake"
import { StatusBar } from "expo-status-bar"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import {
  ActivityIndicator,
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native"
import TouchableOpacity from "@/app/components/AppPressable"
import { FlatList, GestureHandlerRootView } from "react-native-gesture-handler"
import { useSafeAreaInsets } from "react-native-safe-area-context"

const BISMILLAH = "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ"
const { width: SCREEN_WIDTH } = Dimensions.get("window")
const meta = getSurahMeta(AL_KAHF_SURAH_NUMBER)

function kahfVersesOnPage(data: MushafPageData | null): MushafVerse[] {
  if (!data?.verses?.length) return []
  return data.verses.filter(v => v.verse_key.startsWith(`${AL_KAHF_SURAH_NUMBER}:`))
}

function maxAyahOnPage(verses: MushafVerse[]): number {
  if (!verses.length) return 0
  return Math.max(...verses.map(v => v.verse_number))
}

function KahfPage({
  pageNumber,
  fontsLoaded,
  isLast,
  completed,
  onMaxAyah,
  onMarkComplete,
}: {
  pageNumber: number
  fontsLoaded: boolean
  isLast: boolean
  completed: boolean
  onMaxAyah: (ayah: number, page: number) => void
  onMarkComplete: () => void
}) {
  const { t } = useTranslation()
  const [pageData, setPageData] = useState<MushafPageData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const onMaxAyahRef = useRef(onMaxAyah)
  onMaxAyahRef.current = onMaxAyah

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(false)
    fetchAndCachePage(pageNumber)
      .then(data => {
        if (cancelled) return
        setPageData(data)
        setLoading(false)
        const ayah = maxAyahOnPage(kahfVersesOnPage(data))
        if (ayah > 0) onMaxAyahRef.current(ayah, pageNumber)
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
      <View style={styles.pageContainer}>
        <View style={styles.pageLoading}>
          <ActivityIndicator color="#8B6914" size="large" />
        </View>
      </View>
    )
  }

  if (error || !pageData) {
    return (
      <View style={styles.pageContainer}>
        <View style={styles.pageLoading}>
          <Text style={styles.pageError}>Unable to load page {pageNumber}</Text>
        </View>
      </View>
    )
  }

  const verses = kahfVersesOnPage(pageData)
  const flowBlocks = buildMushafBlocks(verses)
  const juzNumber = juzForPage(pageNumber)

  return (
    <View style={styles.pageContainer}>
      <View style={styles.pageMetaBar}>
        <Text style={styles.metaText}>Juz {juzNumber}</Text>
        <Text style={styles.metaSeparator}>·</Text>
        <Text style={styles.metaText}>Page {pageNumber}</Text>
        <Text style={[styles.metaText, styles.metaSurah]} numberOfLines={1}>
          {meta?.arabicName ?? "الكهف"}
        </Text>
      </View>

      <ScrollView
        style={styles.pageScroll}
        contentContainerStyle={styles.pageScrollContent}
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled
      >
        <View style={styles.pageFrameOuter}>
          <View style={styles.pageFrameInner}>
            <View style={styles.pageContent}>
              <View style={styles.ornamentTop}>
                <View style={styles.borderLineOuter} />
                <View style={styles.borderLineInner} />
              </View>

              <View style={styles.textFlow}>
                {flowBlocks.map(block => {
                  if (block.type === "surahStart") {
                    return (
                      <View key={block.key} style={styles.flowSurahBlock}>
                        <View style={styles.surahBanner}>
                          <View style={styles.surahBannerFrame}>
                            <View style={styles.surahBannerInner}>
                              <Text
                                style={[
                                  styles.surahBannerText,
                                  fontsLoaded && { fontFamily: "AmiriQuran" },
                                ]}
                              >
                                {meta?.arabicName ?? "سورة الكهف"}
                              </Text>
                            </View>
                          </View>
                        </View>
                        <View style={styles.bismillahRow}>
                          <Text
                            style={[
                              styles.bismillahText,
                              fontsLoaded && { fontFamily: "AmiriQuran" },
                            ]}
                          >
                            {BISMILLAH}
                          </Text>
                        </View>
                      </View>
                    )
                  }
                  return (
                    <MushafFittedLine key={block.key} block={block} fontsLoaded={fontsLoaded} />
                  )
                })}
              </View>

              <View style={styles.ornamentBottom}>
                <View style={styles.borderLineInner} />
                <View style={styles.borderLineOuter} />
              </View>
            </View>
          </View>
        </View>

        {isLast ? (
          <View style={styles.completeWrap}>
            <Text style={styles.completeHint}>{t("alKahfMarkHint")}</Text>
            {completed ? (
              <View style={styles.completedBadge}>
                <Ionicons name="checkmark-circle" size={22} color="#2D6A4F" />
                <Text style={styles.completedBadgeText}>{t("alKahfCompletedBadge")}</Text>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.completeBtn}
                onPress={onMarkComplete}
                activeOpacity={0.85}
              >
                <Ionicons name="checkmark-circle-outline" size={22} color="#1E3A5F" />
                <Text style={styles.completeBtnText}>{t("alKahfCompleteBtn")}</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : null}
      </ScrollView>
    </View>
  )
}

export default function KahfReadingScreen() {
  useKeepAwake()
  const router = useRouter()
  const { theme } = useTheme()
  const { t, i18n } = useTranslation()
  const insets = useSafeAreaInsets()
  const [fontsLoaded] = useFonts({
    ScheherazadeNew_400Regular,
    ScheherazadeNew_700Bold,
    AmiriQuran: require("../../assets/fonts/AmiriQuran-Regular.ttf"),
  })

  const [range, setRange] = useState({
    start: KAHF_FALLBACK_START_PAGE,
    end: KAHF_FALLBACK_END_PAGE,
  })
  const [currentPage, setCurrentPage] = useState(KAHF_FALLBACK_START_PAGE)
  const [progress, setProgress] = useState<KahfWeeklyProgress | null>(null)
  const [ready, setReady] = useState(false)
  const flatListRef = useRef<FlatList<number>>(null)
  const pageFromSwipeRef = useRef(false)
  const hasSyncedPagerRef = useRef(false)
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const currentPageRef = useRef(currentPage)
  currentPageRef.current = currentPage

  const pages = useMemo(() => {
    const list: number[] = []
    for (let p = range.start; p <= range.end; p++) list.push(p)
    return list
  }, [range.start, range.end])

  const pageIndex = Math.min(
    Math.max(currentPage - range.start, 0),
    Math.max(pages.length - 1, 0),
  )
  const isLast = currentPage >= range.end
  const fraction = progress ? kahfProgressFraction(progress) : 0

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const [stored, pagesRange] = await Promise.all([
        loadKahfWeeklyProgress(),
        resolveKahfPageRange(i18n.language),
      ])
      if (cancelled) return
      setRange(pagesRange)
      setProgress(stored)
      const resumePage =
        stored.pageNumber >= pagesRange.start && stored.pageNumber <= pagesRange.end
          ? stored.pageNumber
          : pagesRange.start
      setCurrentPage(stored.completed ? pagesRange.start : resumePage)
      setReady(true)
    })()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!ready) return
    preloadAdjacentPages(currentPage)
  }, [currentPage, ready])

  const persistProgress = useCallback((ayah: number, page: number) => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(() => {
      void saveKahfWeeklyProgress({ verseNumber: ayah, pageNumber: page }).then(next => {
        setProgress(prev => {
          const becameStarted = (!prev || prev.verseNumber <= 0) && next.verseNumber > 0
          const becameDone = Boolean(next.completed && !prev?.completed)
          if (becameStarted || becameDone) {
            void scheduleAlKahfReminder().catch(() => {})
          }
          return next
        })
      })
    }, 400)
  }, [])

  const lastReadAyahRef = useRef(1)
  lastReadAyahRef.current = progress?.verseNumber || 1

  useFocusEffect(
    useCallback(() => {
      return () => {
        void recordQuranLastRead({
          surahNumber: AL_KAHF_SURAH_NUMBER,
          englishName: meta?.englishName ?? "Al-Kahf",
          arabicName: meta?.arabicName ?? "الكهف",
          ayah: lastReadAyahRef.current || 1,
        })
      }
    }, []),
  )

  const ayahByPageRef = useRef<Record<number, number>>({})
  const onMaxAyah = useCallback(
    (ayah: number, page: number) => {
      ayahByPageRef.current[page] = ayah
      if (page === currentPageRef.current) persistProgress(ayah, page)
    },
    [persistProgress],
  )

  useEffect(() => {
    if (!ready) return
    const ayah = ayahByPageRef.current[currentPage]
    if (ayah) persistProgress(ayah, currentPage)
  }, [currentPage, ready, persistProgress])

  const onMarkComplete = useCallback(async () => {
    const next = await markKahfWeekComplete()
    setProgress(next)
    await scheduleAlKahfReminder().catch(() => {})
  }, [])

  useEffect(() => {
    if (!ready) return
    if (pageFromSwipeRef.current) {
      pageFromSwipeRef.current = false
      return
    }
    const animated = hasSyncedPagerRef.current
    hasSyncedPagerRef.current = true
    const timer = setTimeout(() => {
      flatListRef.current?.scrollToIndex({ index: pageIndex, animated })
    }, 50)
    return () => clearTimeout(timer)
  }, [pageIndex, ready])

  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    }
  }, [])

  const goToPage = (page: number) => {
    const next = Math.min(range.end, Math.max(range.start, page))
    setCurrentPage(next)
    void saveKahfWeeklyProgress({ pageNumber: next }).then(setProgress)
  }

  if (!ready) {
    return (
      <View style={[styles.root, { paddingTop: insets.top, backgroundColor: "#1E3A5F" }]}>
        <StatusBar style="light" />
        <View style={styles.loadingBox}>
          <ActivityIndicator color="#C9A84C" />
        </View>
      </View>
    )
  }

  return (
    <GestureHandlerRootView style={styles.root}>
      <StatusBar style="light" />
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn} hitSlop={12}>
          <Ionicons name="chevron-back" size={20} color="#fff" />
          <Text style={styles.headerBack}>{t("quran")}</Text>
        </TouchableOpacity>
        <View style={styles.headerTitles}>
          <Text style={styles.headerArabic}>{meta?.arabicName ?? "الكهف"}</Text>
          <Text style={styles.headerEnglish}>{t("alKahfCardTitle")}</Text>
        </View>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${Math.round(fraction * 100)}%` }]} />
      </View>
      <Text style={[styles.progressLabel, { color: theme.textSecondary }]}>
        {progress?.completed
          ? t("alKahfCompletedBadge")
          : t("alKahfHomeProgress", {
              read: progress?.verseNumber ?? 0,
              total: KAHF_AYAH_COUNT,
            })}
      </Text>

      <FlatList
        ref={flatListRef}
        data={pages}
        horizontal
        pagingEnabled
        nestedScrollEnabled
        showsHorizontalScrollIndicator={false}
        initialScrollIndex={pageIndex}
        keyExtractor={item => String(item)}
        style={styles.pager}
        windowSize={5}
        maxToRenderPerBatch={3}
        initialNumToRender={2}
        getItemLayout={(_, index) => ({
          length: SCREEN_WIDTH,
          offset: SCREEN_WIDTH * index,
          index,
        })}
        onMomentumScrollEnd={e => {
          const index = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH)
          const newPage = pages[index]
          if (!newPage || newPage === currentPage) return
          pageFromSwipeRef.current = true
          setCurrentPage(newPage)
          void saveKahfWeeklyProgress({ pageNumber: newPage }).then(setProgress)
        }}
        renderItem={({ item }) => (
          <KahfPage
            pageNumber={item}
            fontsLoaded={fontsLoaded}
            isLast={item === range.end}
            completed={Boolean(progress?.completed)}
            onMaxAyah={onMaxAyah}
            onMarkComplete={onMarkComplete}
          />
        )}
        onScrollToIndexFailed={info => {
          flatListRef.current?.scrollToOffset({
            offset: SCREEN_WIDTH * info.index,
            animated: false,
          })
        }}
      />

      <View style={[styles.navBar, { paddingBottom: insets.bottom + 6 }]}>
        <TouchableOpacity
          onPress={() => goToPage(currentPage - 1)}
          style={styles.navBtnRow}
          disabled={currentPage <= range.start}
        >
          <Ionicons
            name="chevron-back"
            size={18}
            color={currentPage <= range.start ? "rgba(201,168,76,0.35)" : "#C9A84C"}
          />
          <Text
            style={[
              styles.navLabel,
              currentPage <= range.start && styles.navLabelDisabled,
            ]}
          >
            {t("quranPrev")}
          </Text>
        </TouchableOpacity>

        <View style={styles.navCenter}>
          <Text style={styles.navPage}>
            {t("alKahfPageOf", {
              current: pageIndex + 1,
              total: pages.length,
            })}
          </Text>
        </View>

        <TouchableOpacity
          onPress={() => goToPage(currentPage + 1)}
          style={styles.navBtnRow}
          disabled={isLast}
        >
          <Text style={[styles.navLabel, isLast && styles.navLabelDisabled]}>
            {t("quranNext")}
          </Text>
          <Ionicons
            name="chevron-forward"
            size={18}
            color={isLast ? "rgba(201,168,76,0.35)" : "#C9A84C"}
          />
        </TouchableOpacity>
      </View>
    </GestureHandlerRootView>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#FAF6EE" },
  loadingBox: { flex: 1, alignItems: "center", justifyContent: "center" },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1E3A5F",
  },
  headerBtn: { flexDirection: "row", alignItems: "center", gap: 4, minWidth: 72 },
  headerBack: { color: "#fff", fontSize: 14 },
  headerTitles: { flex: 1, alignItems: "center" },
  headerArabic: { color: "#C9A84C", fontSize: 20 },
  headerEnglish: { color: "#fff", fontSize: 13, fontWeight: "700" },
  headerSpacer: { minWidth: 72 },
  progressTrack: {
    height: 4,
    backgroundColor: "rgba(201,168,76,0.2)",
  },
  progressFill: {
    height: 4,
    backgroundColor: "#C9A84C",
  },
  progressLabel: {
    fontSize: 11,
    fontWeight: "600",
    textAlign: "center",
    paddingVertical: 6,
    backgroundColor: "#FAF6EE",
  },
  pager: { flex: 1 },
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
    borderBottomWidth: 0.5,
    borderBottomColor: "rgba(139,105,20,0.25)",
  },
  metaText: {
    color: "#8B6914",
    fontSize: 12,
    fontWeight: "600",
  },
  metaSeparator: { color: "rgba(139,105,20,0.45)", fontSize: 12, fontWeight: "600" },
  metaSurah: { color: "#C9A84C", flex: 1, textAlign: "right", marginLeft: "auto" },
  pageScroll: { flex: 1 },
  pageScrollContent: { paddingBottom: 24, paddingHorizontal: 4 },
  pageLoading: { flex: 1, alignItems: "center", justifyContent: "center" },
  pageError: { color: "#8B6914", fontSize: 14 },
  pageFrameOuter: {
    marginHorizontal: 4,
    marginVertical: 8,
    borderWidth: 2.5,
    borderColor: "#8B6914",
    padding: 4,
    backgroundColor: "#FAF6EE",
  },
  pageFrameInner: {
    borderWidth: 1,
    borderColor: "#8B6914",
    overflow: "hidden",
  },
  pageContent: {
    paddingHorizontal: 8,
    paddingTop: 12,
    paddingBottom: 12,
    overflow: "hidden",
  },
  ornamentTop: { marginBottom: 8 },
  ornamentBottom: { marginTop: 8 },
  borderLineOuter: { height: 2.5, backgroundColor: "#8B6914", borderRadius: 1 },
  borderLineInner: {
    height: 1,
    backgroundColor: "#8B6914",
    marginVertical: 4,
    borderRadius: 1,
  },
  textFlow: {
    width: "100%",
  },
  flowSurahBlock: { width: "100%", flexBasis: "100%" },
  surahBanner: { alignItems: "center", marginVertical: 8, width: "100%" },
  surahBannerFrame: {
    borderWidth: 1,
    borderColor: "#8B6914",
    paddingHorizontal: 6,
    paddingVertical: 4,
    backgroundColor: "#F5EDD6",
  },
  surahBannerInner: {
    borderWidth: 1,
    borderColor: "#8B6914",
    paddingHorizontal: 28,
    paddingVertical: 8,
    backgroundColor: "#FAF6EE",
  },
  surahBannerText: { fontSize: 22, color: "#5C3D00", textAlign: "center" },
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
    fontSize: 28,
    color: "#0E1C33",
    textAlign: "center",
    lineHeight: 56,
  },
  completeWrap: {
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 16,
    alignItems: "center",
    gap: 12,
  },
  completeHint: {
    fontSize: 13,
    color: "#8B6914",
    textAlign: "center",
    lineHeight: 18,
  },
  completeBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#C9A84C",
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 24,
  },
  completeBtnText: { color: "#1E3A5F", fontSize: 15, fontWeight: "800" },
  completedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: "rgba(45,106,79,0.12)",
  },
  completedBadgeText: { color: "#2D6A4F", fontSize: 14, fontWeight: "700" },
  navBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingTop: 10,
    backgroundColor: "#1E3A5F",
  },
  navBtnRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  navCenter: { alignItems: "center" },
  navLabel: { color: "#C9A84C", fontSize: 13, fontWeight: "600" },
  navLabelDisabled: { color: "rgba(201,168,76,0.35)" },
  navPage: { color: "#fff", fontSize: 14, fontWeight: "600" },
})
