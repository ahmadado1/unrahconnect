import SurahAudioDownload from "@/app/components/SurahAudioDownload"
import SurahInfoSheet from "@/app/components/SurahInfoSheet"
import TafsirSheet from "@/app/components/TafsirSheet"
import MushafFittedLine, { MUSHAF_FONT_BOLD, MUSHAF_INK } from "@/app/components/MushafFittedLine"
import QuranJumpPicker, { type QuranJumpTarget } from "@/app/components/QuranJumpPicker"
import MushafSettingsDrawer, {
  MushafFontSection,
  MushafReadModeSection,
  MushafTextSizeSection,
} from "@/components/MushafSettingsDrawer"
import { useTheme } from "@/context/themeContext"
import i18n from "@/i18n"
import { considerStoreReview } from "@/lib/storeReviewPrompt"
import { useMushafFontSize } from "@/lib/mushafFontSize"
import {
  MUSHAF_FONT_ASSETS,
  mushafFontMetrics,
  QPC_HAFS_BISMILLAH,
  useMushafFont,
  UTHMANI_MUSHAF_FONT,
  verseModeFont,
  type MushafFontConfig,
} from "@/lib/mushafFonts"
import { juzForPage } from "@/lib/mushafJuz"
import { createMushafJumpId } from "@/lib/mushafJump"
import {
  getCachedQuranReadMode,
  getQuranReadMode,
  setQuranReadMode,
  type QuranReadMode,
} from "@/lib/quranReadMode"
import { AL_KAHF_SURAH_NUMBER } from "@/lib/alKahfWindow"
import { AL_MULK_SURAH_NUMBER } from "@/lib/homeQuranCard"
import { KAHF_AYAH_COUNT, saveKahfWeeklyProgress } from "@/lib/kahfWeekly"
import { scheduleAlKahfReminder, scheduleAlMulkReminder } from "@/lib/notifications"
import { recordQuranLastRead } from "@/lib/quranLastRead"
import { getSurahMeta } from "@/lib/quranSurahMeta"
import { useFonts } from "@expo-google-fonts/scheherazade-new"
import { Ionicons } from "@expo/vector-icons"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { useKeepAwake } from "expo-keep-awake"
import { useFocusEffect, useLocalSearchParams, useRouter, Stack } from "expo-router"
import { StatusBar } from "expo-status-bar"
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { ActivityIndicator, AppState, Dimensions, FlatList, Platform, ScrollView, StyleSheet, Text, View } from "react-native"
import TouchableOpacity from "@/app/components/AppPressable"
import Reanimated, { FadeIn, ZoomIn } from "react-native-reanimated"
import { FlatList as GestureFlatList, GestureHandlerRootView } from "react-native-gesture-handler"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { supabase } from "../../lib/supabase"
import VerseReciterPicker from "@/app/components/VerseReciterPicker"
import { usePremium } from "@/lib/premium"
import {
  getVerseReciter,
  loadVerseReciterId,
  pauseQuran,
  playVerse,
  resumeQuran,
  saveVerseReciterId,
  stopQuranAudio,
} from "@/lib/quranAudio"
import { useQuranPlayback } from "@/lib/useQuranPlayback"
import { buildMushafBlocks, type MushafBlock } from "../../lib/mushafLines"
import {
  fetchAndCachePage,
  getFirstVerseOnPage,
  isUsableMushafPage,
  pageHasQpcHafsText,
  preloadAdjacentPages,
  refreshPageFromNetwork,
  type MushafPageData,
} from "../../lib/quranPageCache"
import {
  fetchAndCacheSurah,
  normalizeReadLanguage,
  peekCachedSurah,
  readSurahOfflineFirst,
} from "../../lib/quranReadCache"

function revelationLabel(type: string, t: (key: string) => string) {
  const value = type.toLowerCase()
  if (value.startsWith("med")) return t("quranMedinan")
  if (value.startsWith("mec") || value.startsWith("mak")) return t("quranMeccan")
  return type
}

// ─── TYPES ───────────────────────────────────────────────────────────────────

type Verse = {
  number: number
  numberInQuran: number
  text: string
  translation: string
  page: number
}

// MushafVerse and MushafPageData imported from lib/quranPageCache

const VERSE_VIEWABILITY = { itemVisiblePercentThreshold: 50 }
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

function SurahBanner({
  name,
  fontsLoaded,
  fontSize,
}: {
  name: string
  fontsLoaded: boolean
  fontSize: number
}) {
  if (!name || !fontsLoaded) return null

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
              { fontSize: Math.round(fontSize * 0.95), fontFamily: MUSHAF_FONT_BOLD },
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

function BismillahLine({
  fontsLoaded,
  fontSize,
  mushafFont,
}: {
  fontsLoaded: boolean
  fontSize: number
  mushafFont: MushafFontConfig
}) {
  if (!fontsLoaded) return null
  const metrics = mushafFontMetrics(mushafFont, fontSize)
  return (
    <View style={mStyles.bismillahRow}>
      <Text
        style={[
          mStyles.bismillahText,
          {
            fontSize: metrics.fontSize,
            lineHeight: metrics.bismillahLineHeight,
            fontFamily: mushafFont.family,
          },
        ]}
      >
        {mushafFont.textField === "text_qpc_hafs" ? QPC_HAFS_BISMILLAH : BISMILLAH}
      </Text>
    </View>
  )
}

type MushafFocus = {
  id: number
  surah: number
  ayah: number
  page: number
}

function paragraphHasVerse(block: MushafBlock, verseKey: string) {
  return block.type === "paragraph" && block.pieces.some(piece => piece.key.startsWith(`${verseKey}-`))
}

function MushafTextFlow({
  blocks,
  fontsLoaded,
  surahNames,
  fontSize,
  mushafFont,
  headerSurah,
  headerHighlighted,
  headerRef,
  verseKey,
  verseHighlighted,
  verseAnchorRef,
  onParagraphSettled,
  onAnchorLayout,
}: {
  blocks: MushafBlock[]
  fontsLoaded: boolean
  surahNames: Record<number, string>
  fontSize: number
  mushafFont: MushafFontConfig
  headerSurah?: number
  headerHighlighted: boolean
  headerRef?: { current: View | null }
  verseKey?: string
  verseHighlighted: boolean
  verseAnchorRef?: { current: View | null }
  onParagraphSettled: (blockKey: string) => void
  onAnchorLayout?: () => void
}) {
  return (
    <View style={mStyles.textFlow}>
      {blocks.map(block => {
        if (block.type === "surahStart") {
          const { surahNumber } = block
          const isTarget = headerSurah === surahNumber
          return (
            <View
              key={block.key}
              ref={isTarget ? headerRef : undefined}
              collapsable={isTarget ? false : undefined}
              onLayout={isTarget ? onAnchorLayout : undefined}
              style={mStyles.flowSurahBlock}
            >
              {isTarget && headerHighlighted ? (
                <View pointerEvents="none" style={mStyles.headerGlow} />
              ) : null}
              <SurahBanner
                name={surahNames[surahNumber] ?? ""}
                fontsLoaded={fontsLoaded}
                fontSize={fontSize}
              />
              {surahNumber !== 9 && surahNumber !== 1 && (
                <BismillahLine fontsLoaded={fontsLoaded} fontSize={fontSize} mushafFont={mushafFont} />
              )}
            </View>
          )
        }

        const isVerseAnchor = Boolean(verseKey && paragraphHasVerse(block, verseKey))
        return (
          <MushafFittedLine
            key={block.key}
            block={block}
            fontsLoaded={fontsLoaded}
            fontSize={fontSize}
            mushafFont={mushafFont}
            anchorVerseKey={isVerseAnchor ? verseKey : undefined}
            anchorRef={isVerseAnchor ? verseAnchorRef : undefined}
            highlighted={isVerseAnchor && verseHighlighted}
            onSettled={() => onParagraphSettled(block.key)}
            onAnchorLayout={isVerseAnchor ? onAnchorLayout : undefined}
          />
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
  focus,
  pageHeight,
  fontSize,
  mushafFont,
  surahEndKey,
  onSurahEndReady,
}: {
  pageNumber: number
  fontsLoaded: boolean
  surahNames: Record<number, string>
  targetSurah?: number
  /** Set only for the page opened from a surah, ayah, or jump. Swiping does not set this. */
  focus: MushafFocus | null
  pageHeight: number
  fontSize: number
  mushafFont: MushafFontConfig
  /** `surah:ayah` of the last ayah. Set only on the page currently on screen. */
  surahEndKey?: string
  onSurahEndReady?: () => void
}) {
  const { t } = useTranslation()
  const [pageData, setPageData] = useState<MushafPageData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [retryCount, setRetryCount] = useState(0)
  const [highlighted, setHighlighted] = useState(false)
  const [qpcSettled, setQpcSettled] = useState(mushafFont.textField !== "text_qpc_hafs")
  const [settledIds, setSettledIds] = useState<Record<string, true>>({})
  const scrollRef = useRef<ScrollView>(null)
  const contentRef = useRef<View>(null)
  const portRef = useRef<View>(null)
  const anchorRef = useRef<View>(null)
  const alignRef = useRef<() => void>(() => {})
  const alignedKey = useRef("")

  useEffect(() => {
    let active = true
    const requested = pageNumber
    setLoading(true)
    setError(false)
    setPageData(null)
    setHighlighted(false)

    fetchAndCachePage(requested).then(data => {
      if (!active || requested !== pageNumber) return
      if (!isUsableMushafPage(data)) {
        setPageData(null)
        setError(true)
        setLoading(false)
        return
      }
      setPageData(data)
      setError(false)
      setLoading(false)
    })

    return () => {
      active = false
    }
  }, [pageNumber, retryCount])

  const needsQpcText = mushafFont.textField === "text_qpc_hafs"
  const hasQpcText = pageHasQpcHafsText(pageData)

  // Pages cached before text_qpc_hafs was requested: fetch once, keep showing Scheherazade New until then.
  useEffect(() => {
    if (!isUsableMushafPage(pageData)) {
      setQpcSettled(false)
      return
    }
    if (!needsQpcText || hasQpcText) {
      setQpcSettled(true)
      return
    }
    let active = true
    setQpcSettled(false)
    refreshPageFromNetwork(pageNumber).then(fresh => {
      if (!active) return
      if (pageHasQpcHafsText(fresh)) setPageData(fresh)
      else setQpcSettled(true)
    })
    return () => {
      active = false
    }
  }, [needsQpcText, hasQpcText, pageData, pageNumber])

  const pageFont = needsQpcText && !hasQpcText ? UTHMANI_MUSHAF_FONT : mushafFont
  const flowBlocks = isUsableMushafPage(pageData) ? buildMushafBlocks(pageData.verses) : []
  const paragraphCount = flowBlocks.filter(block => block.type === "paragraph").length
  const focusKey = focus ? `${focus.id}:${focus.page}:${focus.surah}:${focus.ayah}` : ""
  const layoutKey = `${pageNumber}:${pageFont.id}:${fontSize}:${hasQpcText}:${pageData?.verses.length ?? 0}`
  const toHeader = !focus || focus.ayah <= 1
  const verseKey = focus && focus.ayah > 1 ? `${focus.surah}:${focus.ayah}` : undefined
  const startsAtTop =
    flowBlocks[0]?.type === "surahStart" && flowBlocks[0].surahNumber === focus?.surah

  const paragraphsSettled =
    paragraphCount === 0 ||
    flowBlocks.every(block => block.type !== "paragraph" || settledIds[`${layoutKey}:${block.key}`])

  const onParagraphSettled = useCallback((blockKey: string) => {
    const id = `${layoutKey}:${blockKey}`
    setSettledIds(prev => (prev[id] ? prev : { ...prev, [id]: true }))
  }, [layoutKey])

  alignRef.current = () => {
    if (!focus || focus.page !== pageNumber || !focusKey) return
    if (alignedKey.current === focusKey) return
    if (toHeader && startsAtTop && flowBlocks.length > 0) {
      alignedKey.current = focusKey
      return
    }
    const anchor = anchorRef.current
    const content = contentRef.current
    const port = portRef.current
    const scroll = scrollRef.current
    if (!anchor || !content || !port || !scroll) return
    anchor.measureInWindow((_ax, anchorY, _aw, anchorH) => {
      if (alignedKey.current === focusKey || anchorH < 2) return
      content.measureInWindow((_cx, contentY) => {
        const yInContent = anchorY - contentY
        if (!Number.isFinite(yInContent) || yInContent < 1) return
        port.measureInWindow((_px, portY) => {
          if (alignedKey.current === focusKey) return
          const delta = anchorY - portY
          if (delta < 40 && delta > -16) {
            if (!paragraphsSettled) return
            alignedKey.current = focusKey
            setHighlighted(true)
            return
          }
          scroll.scrollTo({ y: Math.max(0, yInContent - 12), animated: false })
        })
      })
    })
  }

  useEffect(() => {
    if (!focus || focus.page !== pageNumber || !focusKey) return
    if (toHeader && startsAtTop && flowBlocks.length > 0) return
    alignedKey.current = ""
    const started = Date.now()
    let frame = 0
    let alive = true
    const tick = () => {
      if (!alive) return
      alignRef.current()
      if (alignedKey.current === focusKey) return
      if (Date.now() - started < 4000) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => {
      alive = false
      cancelAnimationFrame(frame)
    }
  }, [focus, focusKey, pageNumber, pageData, fontsLoaded, qpcSettled, startsAtTop, toHeader, flowBlocks.length, layoutKey])

  useEffect(() => {
    if (!highlighted) return
    const timer = setTimeout(() => setHighlighted(false), 1500)
    return () => clearTimeout(timer)
  }, [highlighted])

  useEffect(() => {
    if (!onSurahEndReady || !surahEndKey || loading || error || !isUsableMushafPage(pageData)) return
    if (!pageData.verses.some(verse => verse.verse_key === surahEndKey)) return
    onSurahEndReady()
  }, [onSurahEndReady, surahEndKey, loading, error, pageData])

  if (loading) {
    return (
      <View style={mStyles.pageContainer}>
        <View style={mStyles.pageLoading}>
          <ActivityIndicator color="#8B6914" size="large" />
        </View>
      </View>
    )
  }

  if (error || !isUsableMushafPage(pageData)) {
    return (
      <View style={mStyles.pageContainer}>
        <View style={mStyles.pageLoading}>
          <Text style={mStyles.pageError}>{t("quranPageLoadFailed")}</Text>
          <TouchableOpacity
            onPress={() => setRetryCount(count => count + 1)}
            style={mStyles.pageRetry}
            accessibilityLabel={t("quranPageRetry")}
          >
            <Text style={mStyles.pageRetryText}>{t("quranPageRetry")}</Text>
          </TouchableOpacity>
        </View>
      </View>
    )
  }

  const primarySurah = parseInt(pageData.verses[0]?.verse_key.split(":")[0] ?? "1", 10)
  const primarySurahName = surahNames[targetSurah ?? primarySurah] ?? surahNames[primarySurah] ?? ""
  // Prefer API juz; always clamp via Madani page→juz so layout never glues juz+page (e.g. "Juz 350")
  const juzNumber = juzForPage(pageNumber)

  return (
    <View style={[mStyles.pageContainer, pageHeight > 0 && { height: pageHeight }]}>
      <View style={mStyles.pageMetaBar}>
        <Text style={mStyles.metaText}>{t("quranJuz", { number: juzNumber })}</Text>
        <Text style={mStyles.metaSeparator}>·</Text>
        <Text style={mStyles.metaText}>{t("quranPage", { number: pageNumber })}</Text>
        <Text style={[mStyles.metaText, mStyles.metaSurah]} numberOfLines={1}>
          {primarySurahName}
        </Text>
      </View>

      <View ref={portRef} style={mStyles.pageScroll} collapsable={false}>
      <ScrollView
        ref={scrollRef}
        style={mStyles.pageScroll}
        contentContainerStyle={mStyles.pageScrollContent}
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled
        directionalLockEnabled
        scrollEventThrottle={16}
        onContentSizeChange={() => alignRef.current()}
      >
        <View ref={contentRef} collapsable={false} onLayout={() => alignRef.current()}>
        <View style={mStyles.pageFrameOuter}>
          <View style={mStyles.pageFrameInner}>
            <View style={mStyles.pageContent}>
              <View style={mStyles.ornamentTop}>
                <View style={mStyles.borderLineOuter} />
                <View style={mStyles.borderLineInner} />
              </View>

              <MushafTextFlow
                blocks={flowBlocks}
                fontsLoaded={fontsLoaded}
                surahNames={surahNames}
                fontSize={fontSize}
                mushafFont={pageFont}
                headerSurah={focus && toHeader ? focus.surah : undefined}
                headerHighlighted={highlighted && toHeader}
                headerRef={toHeader ? anchorRef : undefined}
                verseKey={verseKey}
                verseHighlighted={highlighted && !toHeader}
                verseAnchorRef={verseKey ? anchorRef : undefined}
                onParagraphSettled={onParagraphSettled}
                onAnchorLayout={() => alignRef.current()}
              />

              <View style={mStyles.ornamentBottom}>
                <View style={mStyles.borderLineInner} />
                <View style={mStyles.borderLineOuter} />
              </View>
            </View>
          </View>
        </View>
        </View>
      </ScrollView>
      </View>
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
  mushafFocus,
  onJump,
  onOpenSettings,
  fontSize,
  mushafFont,
  surahEndKey,
  onSurahEndReady,
}: {
  currentPage: number
  setCurrentPage: (p: number) => void
  insets: any
  router: any
  fontsLoaded: boolean
  targetSurah?: number
  targetAyah?: number
  mushafFocus: MushafFocus | null
  onJump: (target: QuranJumpTarget) => void
  onOpenSettings: () => void
  fontSize: number
  mushafFont: MushafFontConfig
  surahEndKey?: string
  onSurahEndReady?: () => void
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
  const [pageHeight, setPageHeight] = useState(0)
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

  // Sync pager when page changes via Prev/Next / jump (not from swipe itself).
  // A new jump shows the page immediately so the inner scroll can measure it.
  useEffect(() => {
    if (pageFromSwipeRef.current) {
      pageFromSwipeRef.current = false
      return
    }
    const jumping = mushafFocus?.page === indexToPage(pageIndex)
    const animated = hasSyncedPagerRef.current && !jumping
    hasSyncedPagerRef.current = true
    const timer = setTimeout(() => {
      flatListRef.current?.scrollToIndex({
        index: pageIndex,
        animated,
      })
    }, jumping ? 0 : 50)
    return () => clearTimeout(timer)
  }, [pageIndex, targetSurah, mushafFocus?.id])

  return (
    <GestureHandlerRootView style={mStyles.mushafRoot}>
      <View style={[mStyles.mushafHeader, { paddingTop: insets.top }]}>
        <TouchableOpacity onPress={() => router.back()} style={mStyles.mushafHeaderBtn}>
          <Ionicons name="chevron-back" size={20} color="#fff" />
          <Text style={mStyles.mushafHeaderBackText}>{t("quran")}</Text>
        </TouchableOpacity>

        <View style={mStyles.mushafHeaderActions}>
          <TouchableOpacity
            onPress={() => setJumpOpen(true)}
            style={mStyles.mushafToggleBtn}
            accessibilityLabel={t("quranGoToA11y")}
          >
            <Ionicons name="search-outline" size={16} color="#C9A84C" />
            <Text style={mStyles.mushafToggleText}>{t("quranGoTo")}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={onOpenSettings}
            style={[mStyles.mushafToggleBtn, mStyles.mushafMenuBtn]}
            accessibilityLabel={t("mushafSettingsOpen")}
          >
            <Ionicons name="menu" size={18} color="#C9A84C" />
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
        extraData={`${mushafFont.id}:${fontSize}:${mushafFocus?.id ?? 0}:${mushafFocus?.page ?? 0}:${mushafFocus?.surah ?? 0}:${mushafFocus?.ayah ?? 0}`}
        style={mStyles.mushafPager}
        onLayout={event => {
          const height = event.nativeEvent.layout.height
          setPageHeight(current => (Math.abs(current - height) < 1 ? current : height))
        }}
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
            key={item}
            pageNumber={item}
            fontsLoaded={fontsLoaded}
            surahNames={surahNames}
            targetSurah={targetSurah}
            focus={mushafFocus && item === mushafFocus.page ? mushafFocus : null}
            pageHeight={pageHeight}
            fontSize={fontSize}
            mushafFont={mushafFont}
            surahEndKey={item === currentPage ? surahEndKey : undefined}
            onSurahEndReady={item === currentPage ? onSurahEndReady : undefined}
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
          onPress={() => setCurrentPage(Math.min(MUSHAF_PAGE_COUNT, currentPage + 1))}
          style={mStyles.navBtnRow}
          disabled={currentPage >= MUSHAF_PAGE_COUNT}
        >
          <Ionicons name="chevron-back" size={18} color="#C9A84C" />
          <Text style={mStyles.navLabel}>{t("quranNext")}</Text>
        </TouchableOpacity>

        <View style={mStyles.navCenter}>
          <Text style={mStyles.navPage}>{currentPage}</Text>
          <Text style={mStyles.navTotal}>{t("quranPageOf", { total: MUSHAF_PAGE_COUNT })}</Text>
        </View>

        <TouchableOpacity
          onPress={() => setCurrentPage(Math.max(1, currentPage - 1))}
          style={mStyles.navBtnRow}
          disabled={currentPage <= 1}
        >
          <Text style={mStyles.navLabel}>{t("quranPrev")}</Text>
          <Ionicons name="chevron-forward" size={18} color="#C9A84C" />
        </TouchableOpacity>
      </View>
    </GestureHandlerRootView>
  )
}

  

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────

// One verse card in Read (verse) mode. memo() keeps the long list smooth: a card only
// re-renders when its own data changes (playing, bookmark, font), not on every scroll.
type VerseRowProps = {
  verse: Verse
  isCurrent: boolean
  isLoading: boolean
  isPlaying: boolean
  isBookmarked: boolean
  arabicStyle: any
  cardColor: string
  borderColor: string
  gold: string
  translationColor: string
  playLabel: string
  onPlay: (ayah: number) => void
  onBookmark: (verse: Verse) => void
  onTafsir: (ayah: number) => void
  tafsirLabel: string
}

const VerseRow = memo(function VerseRow({
  verse,
  isCurrent,
  isLoading,
  isPlaying,
  isBookmarked,
  arabicStyle,
  cardColor,
  borderColor,
  gold,
  translationColor,
  playLabel,
  onPlay,
  onBookmark,
  onTafsir,
  tafsirLabel,
}: VerseRowProps) {
  return (
    <View style={[styles.verseCard, { backgroundColor: cardColor, borderColor }, isCurrent && styles.verseCardPlaying]}>
      <View style={styles.verseTop}>
        <View style={styles.verseBadge}>
          <Text style={styles.verseBadgeText}>{verse.number}</Text>
        </View>
        <View style={styles.verseActions}>
          {/* ▶ Listen to this ayah */}
          <TouchableOpacity onPress={() => onPlay(verse.number)} hitSlop={8} accessibilityLabel={playLabel}>
            {isCurrent && isLoading ? (
              <ActivityIndicator size="small" color={gold} />
            ) : (
              <Ionicons name={isCurrent && isPlaying ? "pause-circle" : "play-circle-outline"} size={22} color={gold} />
            )}
          </TouchableOpacity>
          {/* Tafsir: short explanation of this verse */}
          <TouchableOpacity onPress={() => onTafsir(verse.number)} hitSlop={8} accessibilityLabel={tafsirLabel}>
            <Ionicons name="book-outline" size={19} color={gold} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => onBookmark(verse)}>
            <Ionicons name={isBookmarked ? "bookmark" : "bookmark-outline"} size={18} color={gold} />
          </TouchableOpacity>
        </View>
      </View>
      <Text style={arabicStyle}>{verse.text}</Text>
      {verse.translation ? (
        <>
          <View style={styles.verseDivider} />
          <Text style={[styles.verseTranslation, { color: translationColor }]}>{verse.translation}</Text>
        </>
      ) : null}
    </View>
  )
})

export default function SurahScreen() {
  useKeepAwake()
  const router = useRouter()
  const { theme, isDark } = useTheme()
  const { t } = useTranslation()
  const insets = useSafeAreaInsets()
  const [scrollToVerseIndex, setScrollToVerseIndex] = useState<number | null>(null)
  const listRef = useRef<FlatList>(null)
  const didScrollForSurahRef = useRef<string | null>(null)
  const { surah, name, arabicName, verses, type, resume, ayah, mode, expand, jump } = useLocalSearchParams<{
    surah: string
    name: string
    arabicName: string
    verses: string
    type: string
    resume?: string
    ayah?: string
    mode?: string
    expand?: string
    jump?: string
  }>()
  const shouldResume = resume === "1"
  const requestedAyah = ayah ? Number(ayah) : NaN
  const expandFromCard = expand === "1"

  const resolveInitialMode = (): QuranReadMode => {
    if (mode === "mushaf" || mode === "verses") return mode
    if (mode === "text") return "verses" // legacy param
    return getCachedQuranReadMode() ?? "verses"
  }

  const [viewMode, setViewMode] = useState<QuranReadMode>(resolveInitialMode)
  const [jumpOpen, setJumpOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const closeSettings = useCallback(() => setSettingsOpen(false), [])
  const { fontSize, decrease, increase, canDecrease, canIncrease } = useMushafFontSize()
  const { font: mushafFont, setFontId } = useMushafFont()
  // Read (verse) mode uses the same font as the Mushaf (Madinah font → Amiri Quran, see verseModeFont)
  // and the same text size setting.
  const verseFont = verseModeFont(mushafFont)
  const verseMetrics = mushafFontMetrics(verseFont, fontSize - 2)
  // Same ink as the Mushaf page (soft navy-black, not pure black). Dark mode uses the light theme text.
  const verseTextStyle = {
    color: isDark ? theme.text : MUSHAF_INK.color,
    fontFamily: verseFont.family,
    fontSize: verseMetrics.fontSize,
    lineHeight: Math.round(verseMetrics.fontSize * Math.max(1.9, verseFont.lineHeight)),
  }
  const [visibleVerseNumber, setVisibleVerseNumber] = useState(1)
  // Tafsir sheet (verse number) and "About this surah" sheet
  const [tafsirAyah, setTafsirAyah] = useState<number | null>(null)
  const [surahInfoOpen, setSurahInfoOpen] = useState(false)

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
  const [mushafFocus, setMushafFocus] = useState<MushafFocus>(() => ({
    id: createMushafJumpId(),
    page: initialAyahVerse?.page || initialCached?.[0]?.page || 1,
    surah: initialSurahNum,
    ayah: Number.isFinite(requestedAyah) ? requestedAyah : 1,
  }))
  const [verseList, setVerseList] = useState<Verse[]>(() => initialCached ?? [])
  const [loading, setLoading] = useState(() => !initialCached?.length)
  const [bookmarked, setBookmarked] = useState<Set<number>>(new Set())

  // ─── Verse audio (EveryAyah) ───────────────────────────────────────────────
  const playback = useQuranPlayback()
  const { isPremium } = usePremium()
  const [reciterId, setReciterId] = useState("alafasy")
  const [reciterPickerOpen, setReciterPickerOpen] = useState(false)
  const surahNumber = Number(surah)
  const playingHere = playback.kind === "verse" && playback.surah === surahNumber

  useEffect(() => {
    loadVerseReciterId().then(id => {
      const saved = getVerseReciter(id)
      // A Premium reciter saved earlier falls back to a free one if Premium ended.
      setReciterId(!saved.free && !isPremium ? "alafasy" : saved.id)
    })
  }, [isPremium])

  const onVersePlay = (ayahNumber: number) => {
    if (playingHere && playback.ayah === ayahNumber) {
      if (playback.playing) pauseQuran()
      else resumeQuran()
      return
    }
    void playVerse({
      surah: surahNumber,
      ayah: ayahNumber,
      lastAyah: Number(verses) || ayahNumber,
      reciter: getVerseReciter(reciterId),
      continuous: false, // play only this verse, then stop
      title: String(name || ""),
    })
  }
  const saveTimer = useRef<any>(null)
  const loadRequestRef = useRef(0)
  const switchingRef = useRef(false)
  const lastAyahRef = useRef(1)
  const reviewTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const reviewNotedRef = useRef(false)

  const disarmSurahReview = useCallback(() => {
    if (!reviewTimerRef.current) return
    clearTimeout(reviewTimerRef.current)
    reviewTimerRef.current = null
  }, [])

  const armSurahReview = useCallback(() => {
    if (reviewNotedRef.current || reviewTimerRef.current || loading) return
    reviewTimerRef.current = setTimeout(() => {
      reviewTimerRef.current = null
      reviewNotedRef.current = true
      void considerStoreReview()
    }, 2000)
  }, [loading])

  useEffect(() => {
    if (viewMode !== "mushaf" || loading) return
    const ayahCount = Number(verses)
    const last = verseList.find(verse => verse.number === ayahCount)
    if (!last || last.page !== currentPage) disarmSurahReview()
  }, [viewMode, loading, verses, verseList, currentPage, disarmSurahReview])

  useEffect(() => {
    if (viewMode === "mushaf") {
      const onPage = verseList.filter(v => v.page === currentPage)
      if (onPage.length) {
        lastAyahRef.current = onPage[0].number
        return
      }
    }
    lastAyahRef.current = visibleVerseNumber || 1
  }, [viewMode, currentPage, verseList, visibleVerseNumber])

  // Save the exact spot WHILE reading (page in Mushaf mode, verse in Verses mode),
  // so Last Read is right even if the app is closed without pressing back.
  const lastPageRef = useRef(currentPage)
  lastPageRef.current = currentPage
  const viewModeRef = useRef(viewMode)
  viewModeRef.current = viewMode
  useEffect(() => {
    if (loading || !Number(surah)) return
    const timer = setTimeout(() => {
      void recordQuranLastRead({
        surahNumber: Number(surah),
        englishName: String(name ?? ""),
        arabicName: String(arabicName ?? ""),
        ayah: lastAyahRef.current || 1,
        page: viewMode === "mushaf" ? currentPage : undefined,
        mode: viewMode,
      })
    }, 1500)
    return () => clearTimeout(timer)
  }, [loading, surah, name, arabicName, viewMode, currentPage, visibleVerseNumber])

  useEffect(() => {
    const sub = AppState.addEventListener("change", next => {
      if (next !== "background" || !Number(surah)) return
      void recordQuranLastRead({
        surahNumber: Number(surah),
        englishName: String(name ?? ""),
        arabicName: String(arabicName ?? ""),
        ayah: lastAyahRef.current || 1,
        page: viewModeRef.current === "mushaf" ? lastPageRef.current : undefined,
        mode: viewModeRef.current,
      })
    })
    return () => sub.remove()
  }, [surah, name, arabicName])

  // Register Last Read on exit (back, tab change, or jump to another Surah) — not on enter.
  useFocusEffect(
    useCallback(() => {
      const capturedSurah = Number(surah)
      const capturedName = String(name ?? "")
      const capturedArabic = String(arabicName ?? "")
      return () => {
        if (!capturedSurah) return
        void recordQuranLastRead({
          surahNumber: capturedSurah,
          englishName: capturedName,
          arabicName: capturedArabic,
          ayah: lastAyahRef.current || 1,
          page: viewModeRef.current === "mushaf" ? lastPageRef.current : undefined,
          mode: viewModeRef.current,
        })
        const ayah = lastAyahRef.current || 1
        if (capturedSurah === AL_KAHF_SURAH_NUMBER) {
          void saveKahfWeeklyProgress({
            verseNumber: ayah,
            completed: ayah >= KAHF_AYAH_COUNT,
          }).then(() => scheduleAlKahfReminder().catch(() => {}))
        }
        if (capturedSurah === AL_MULK_SURAH_NUMBER) {
          void scheduleAlMulkReminder().catch(() => {})
        }
      }
    }, [surah, name, arabicName]),
  )

  // Keep view mode from jump / navigation params
  useEffect(() => {
    if (mode === "mushaf" || mode === "verses") setViewMode(mode)
    else if (mode === "text") setViewMode("verses")
  }, [mode, surah])

  const [fontsLoaded] = useFonts(MUSHAF_FONT_ASSETS)

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

  const focusMushaf = (page: number, ayahNumber: number) => {
    setMushafFocus({
      id: createMushafJumpId(),
      page,
      surah: Number(surah),
      ayah: ayahNumber,
    })
  }

  const appliedJump = useRef(typeof jump === "string" ? jump : undefined)
  useEffect(() => {
    const jumpId = Array.isArray(jump) ? jump[0] : jump
    if (!jumpId || appliedJump.current === jumpId) return
    const ayahNum = Number.isFinite(requestedAyah) && requestedAyah >= 1 ? requestedAyah : 1
    const cached = peekCachedSurah(Number(surah), normalizeReadLanguage(i18n.language))
    const page = cached?.find(verse => verse.number === ayahNum)?.page || cached?.[0]?.page
    if (!page) return
    appliedJump.current = jumpId
    focusMushaf(page, ayahNum)
  }, [jump, surah, requestedAyah])

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
      focusMushaf(page, ayahNum)
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
      focusMushaf(target.page, target.ayah)
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
        jump: String(createMushafJumpId()),
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
    focusMushaf(page, loaded[target]?.number || 1)
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
      console.log("No session, user not logged in")
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

  // Follow the recitation: keep the ayah being read on screen.
  useEffect(() => {
    if (!playingHere || viewMode !== "verses" || !playback.ayah) return
    const index = verseList.findIndex(v => v.number === playback.ayah)
    if (index < 0) return
    listRef.current?.scrollToIndex({ index, animated: true, viewPosition: 0.25 })
  }, [playingHere, playback.ayah, viewMode, verseList])

  // ─── RENDER VERSE ──────────────────────────────────────────────────────────

  // Stable handlers for the verse cards (they always call the latest version).
  const versePlayRef = useRef(onVersePlay)
  const bookmarkRef = useRef(toggleBookmark)
  useEffect(() => {
    versePlayRef.current = onVersePlay
    bookmarkRef.current = toggleBookmark
  })
  const handleVersePlay = useCallback((ayah: number) => versePlayRef.current(ayah), [])
  const handleBookmark = useCallback((verse: Verse) => {
    void bookmarkRef.current(verse)
  }, [])

  const verseArabicStyle = useMemo(
    () => [styles.verseArabic, { color: verseTextStyle.color }, fontsLoaded && verseTextStyle],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [fontsLoaded, verseTextStyle.color, verseTextStyle.fontFamily, verseTextStyle.fontSize, verseTextStyle.lineHeight]
  )
  const playLabel = t("qaPlayVerse")
  const tafsirLabel = t("tafsirTitle")

  // Which verses are on screen (stable function: FlatList must not get a new one each render).
  const viewableRef = useRef<(items: any[]) => void>(() => {})
  useEffect(() => {
    viewableRef.current = viewableItems => {
      if (viewableItems.length === 0) return
      const first = viewableItems[0]?.item
      const last = viewableItems[viewableItems.length - 1]?.item
      if (first?.number) setVisibleVerseNumber(prev => (prev === first.number ? prev : first.number))
      if (last?.number) saveProgress(last.number)
      const ayahCount = Number(verses)
      if (Number.isFinite(ayahCount) && ayahCount > 0 && (last?.number ?? 0) >= ayahCount) armSurahReview()
      else disarmSurahReview()
    }
  })
  const handleViewableItems = useCallback(({ viewableItems }: { viewableItems: any[] }) => viewableRef.current(viewableItems), [])

  const renderVerse = ({ item }: { item: Verse }) => {
    const isCurrent = playingHere && playback.ayah === item.number
    return (
      <VerseRow
        verse={item}
        isCurrent={isCurrent}
        isLoading={isCurrent && playback.loading}
        isPlaying={isCurrent && playback.playing}
        isBookmarked={bookmarked.has(item.number)}
        arabicStyle={verseArabicStyle}
        cardColor={theme.card}
        borderColor={theme.border}
        gold={theme.gold}
        translationColor={theme.textSecondary}
        playLabel={playLabel}
        onPlay={handleVersePlay}
        onBookmark={handleBookmark}
        onTafsir={setTafsirAyah}
        tafsirLabel={tafsirLabel}
      />
    )
  }

  // ─── RENDER ────────────────────────────────────────────────────────────────

  const selectReadMode = (next: QuranReadMode) => {
    if (next === viewMode) return
    setSettingsOpen(false)
    if (next === "verses") void switchToVerses()
    else void switchToMushaf()
  }

  return (
  <GestureHandlerRootView style={styles.screen}>
  <Reanimated.View
    style={[styles.screen, { backgroundColor: theme.background }]}
    entering={expandFromCard ? ZoomIn.duration(380) : FadeIn.duration(160)}
  >
    <Stack.Screen
      options={
        expandFromCard
          ? { animation: "fade", animationDuration: 280 }
          : { animation: "slide_from_right" }
      }
    />
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
        mushafFocus={mushafFocus}
        onJump={handleJump}
        onOpenSettings={() => setSettingsOpen(true)}
        fontSize={fontSize}
        mushafFont={mushafFont}
        surahEndKey={Number(verses) > 0 ? `${surah}:${verses}` : undefined}
        onSurahEndReady={armSurahReview}
      />
    ) : (
      <>
        <View style={[styles.header, { paddingTop: insets.top }]}>
          <View style={styles.headerTop}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
              <Ionicons name="chevron-back" size={22} color="#fff" />
              <Text style={styles.backText}>{t("quran")}</Text>
            </TouchableOpacity>
            <View style={styles.headerTopActions}>
              <TouchableOpacity
                onPress={() => setSurahInfoOpen(true)}
                style={styles.jumpBtn}
                accessibilityLabel={t("surahInfoTitle")}
              >
                <Ionicons name="information-circle-outline" size={19} color="#C9A84C" />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setReciterPickerOpen(true)}
                style={styles.jumpBtn}
                accessibilityLabel={t("qaChooseReciter")}
              >
                <Ionicons name="headset-outline" size={18} color="#C9A84C" />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setJumpOpen(true)}
                style={styles.jumpBtn}
                accessibilityLabel={t("quranGoToA11y")}
              >
                <Ionicons name="search-outline" size={18} color="#C9A84C" />
                <Text style={styles.jumpBtnLabel}>{t("quranGoTo")}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setSettingsOpen(true)}
                style={styles.jumpBtn}
                accessibilityLabel={t("mushafSettingsOpen")}
              >
                <Ionicons name="menu" size={18} color="#C9A84C" />
              </TouchableOpacity>
            </View>
          </View>
          <Text style={[styles.headerArabic, fontsLoaded && { fontFamily: "ScheherazadeNew_700Bold" }]}>
            {arabicName}
          </Text>
          <Text style={styles.headerEnglish}>{name}</Text>
          <Text style={styles.headerMeta}>
            {t("quranSurahMeta", {
              count: verses,
              type: revelationLabel(String(type ?? ""), t),
            })}
          </Text>
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
              {t("quranLoadingSurah", { name })}
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
            onViewableItemsChanged={handleViewableItems}
            viewabilityConfig={VERSE_VIEWABILITY}
            windowSize={7}
            maxToRenderPerBatch={6}
            updateCellsBatchingPeriod={60}
            removeClippedSubviews={Platform.OS === "android"}
            ListHeaderComponent={
              <>
              {/* Download this surah's audio to listen with no internet */}
              <SurahAudioDownload surah={surahNumber} variant="card" />
              {Number(surah) === 9 ? null : (
                <View style={[styles.bismillahCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
                  <Text style={[styles.bismillahText, fontsLoaded && { fontFamily: verseFont.family }, { color: isDark ? theme.text : MUSHAF_INK.color }]}>
                    بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
                  </Text>
                  <Text style={[styles.bismillahTranslation, { color: theme.textSecondary }]}>
                    In the name of Allah, the Most Gracious, the Most Merciful
                  </Text>
                </View>
              )}
              </>
            }
            ListFooterComponent={
              <View style={styles.footer}>
                <View style={styles.footerLine} />
                <Text style={[styles.footerText, { color: theme.textSecondary }]}>End of {name}</Text>
                <View style={styles.footerLine} />
              </View>
            }
          />
        )}
      </>
    )}

    {/* ─── Mini player while an ayah of this surah is playing ─── */}
    {playingHere ? (
      <View style={[styles.playerBar, { bottom: insets.bottom + 12 }]}>
        <Ionicons name="headset" size={18} color="#C9A84C" />
        <View style={{ flex: 1 }}>
          <Text style={styles.playerTitle} numberOfLines={1}>
            {t("qaNowAyah", { surah: name, ayah: playback.ayah ?? "" })}
          </Text>
          <Text style={styles.playerSub} numberOfLines={1}>
            {playback.error ? t("qaError") : playback.reciterName}
          </Text>
        </View>
        <TouchableOpacity onPress={() => setReciterPickerOpen(true)} hitSlop={8}>
          <Ionicons name="people-outline" size={20} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => (playback.playing ? pauseQuran() : resumeQuran())} hitSlop={8}>
          <Ionicons name={playback.playing ? "pause" : "play"} size={22} color="#C9A84C" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => void stopQuranAudio()} hitSlop={8}>
          <Ionicons name="close" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    ) : null}
  </Reanimated.View>
  <TafsirSheet
    visible={tafsirAyah !== null}
    surah={surahNumber}
    ayah={tafsirAyah ?? 1}
    surahName={String(name || "")}
    onClose={() => setTafsirAyah(null)}
  />
  <SurahInfoSheet visible={surahInfoOpen} surah={surahNumber} onClose={() => setSurahInfoOpen(false)} />
  <VerseReciterPicker
    visible={reciterPickerOpen}
    selectedId={reciterId}
    onClose={() => setReciterPickerOpen(false)}
    onSelect={reciter => {
      setReciterId(reciter.id)
      void saveVerseReciterId(reciter.id)
      setReciterPickerOpen(false)
      // Switch voice straight away if something is playing.
      if (playingHere && playback.ayah) {
        void playVerse({
          surah: surahNumber,
          ayah: playback.ayah,
          lastAyah: Number(verses) || playback.ayah,
          reciter,
          continuous: false,
          title: String(name || ""),
        })
      }
    }}
  />
  <MushafSettingsDrawer visible={settingsOpen} onClose={closeSettings}>
    <MushafReadModeSection mode={viewMode} onSelect={selectReadMode} />
    <MushafTextSizeSection
      fontSize={fontSize}
      onDecrease={decrease}
      onIncrease={increase}
      canDecrease={canDecrease}
      canIncrease={canIncrease}
    />
    <MushafFontSection selectedId={mushafFont.id} onSelect={setFontId} fontsLoaded={fontsLoaded} />
  </MushafSettingsDrawer>
  </GestureHandlerRootView>
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
  bismillahTranslation: { fontSize: 14, textAlign: "center", lineHeight: 21 },
  verseCard: { borderRadius: 16, padding: 16, borderWidth: 0.5 },
  verseCardPlaying: { borderColor: "#C9A84C", borderWidth: 1.5, backgroundColor: "rgba(201,168,76,0.08)" },
  verseActions: { flexDirection: "row", alignItems: "center", gap: 14 },
  playerBar: { position: "absolute", left: 12, right: 12, flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: "#1E3A5F", borderRadius: 18, paddingHorizontal: 14, paddingVertical: 10, shadowColor: "#000", shadowOpacity: 0.25, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 8 },
  playerTitle: { color: "#fff", fontSize: 13, fontWeight: "700" },
  playerSub: { color: "#E8D5A3", fontSize: 11, marginTop: 1 },
  verseTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 14 },
  verseBadge: { width: 32, height: 32, borderRadius: 16, backgroundColor: "#F5EDD6", borderWidth: 1, borderColor: "#8B6914", alignItems: "center", justifyContent: "center" },
  verseBadgeText: { color: "#1A1A1A", fontSize: 12, fontWeight: "700" },
  verseArabic: { fontSize: 26, textAlign: "justify", writingDirection: "rtl", lineHeight: 50, marginBottom: 14, fontWeight: "400" } as any,
  verseDivider: { height: 0.5, backgroundColor: "rgba(201,168,76,0.3)", marginBottom: 12 },
  verseTranslation: { fontSize: 16, lineHeight: 27 },
  footer: { flexDirection: "row", alignItems: "center", gap: 12, padding: 16, paddingBottom: 40 },
  footerLine: { flex: 1, height: 0.5, backgroundColor: "#C9A84C" },
  footerText: { fontSize: 12, fontWeight: "600" },

  verseEndBadge: {
    width: 28,
    height: 28,
    borderRadius: 16,
    borderWidth: 1.25,
    borderColor: "#8B6914",
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 2,
    backgroundColor: "#F5EDD6",
  },
  verseEndText: {
    fontSize: 11,
    color: "#1A1A1A",
    fontWeight: "700",
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
  mushafMenuBtn: {
    paddingHorizontal: 7,
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
    minHeight: 0,
    backgroundColor: "#FAF6EE",
  },
  pageScrollContent: {
    flexGrow: 1,
    paddingBottom: 8,
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
    textAlign: "center",
  },
  pageRetry: {
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#8B6914",
  },
  pageRetryText: {
    color: "#8B6914",
    fontSize: 14,
    fontWeight: "700",
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
  },
  pageContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
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
    fontSize: 28,
    textAlign: "center",
    lineHeight: 64,
    ...MUSHAF_INK,
  },
  textFlow: {
    width: "100%",
  },
  flowSurahBlock: {
    width: "100%",
  },
  headerGlow: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: "rgba(201,168,76,0.28)",
    borderRadius: 8,
    shadowColor: "#C9A84C",
    shadowOpacity: 0.95,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 0 },
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
})