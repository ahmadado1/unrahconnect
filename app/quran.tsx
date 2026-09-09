import { AnimatedHeroIcon } from "@/components/AnimatedHeroIcon"
import QuranReadModeModal from "@/app/components/QuranReadModeModal"
import QuranReadModeToggle from "@/app/components/QuranReadModeToggle"
import { useTheme } from "@/context/themeContext"
import i18n from "@/i18n"
import { loadLastReadState } from "@/lib/quranLastRead"
import { normalizeReadLanguage, warmReadCacheForLanguage } from "@/lib/quranReadCache"
import {
  getCachedQuranReadMode,
  getQuranReadMode,
  setQuranReadMode,
  toggleQuranReadMode,
  type QuranReadMode,
} from "@/lib/quranReadMode"
import { getSurahMeta } from "@/lib/quranSurahMeta"
import { QURAN_QUICK_LINKS } from "@/lib/quickLinks"
import { searchSurahs } from "@/lib/surahSearch"
import type { LastReadEntry } from "@/lib/lastReadRegister"
import { ScheherazadeNew_400Regular, ScheherazadeNew_700Bold, useFonts } from "@expo-google-fonts/scheherazade-new"
import { Ionicons } from "@expo/vector-icons"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { useFocusEffect, useRouter } from "expo-router"
import { StatusBar } from "expo-status-bar"
import { useCallback, useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { ActivityIndicator, FlatList, ScrollView, StyleSheet, Text, TextInput, View } from "react-native"
import TouchableOpacity from "@/app/components/AppPressable"
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

// ─── COMPONENT ───────────────────────────────────────────────────────────────

export default function QuranScreen() {
  const router = useRouter()
  const { theme, isDark } = useTheme()
  const { t } = useTranslation()
  const insets = useSafeAreaInsets()

  const [surahs, setSurahs] = useState<Surah[]>([])
  const [filtered, setFiltered] = useState<Surah[]>([])
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const [bookmarkCount, setBookmarkCount] = useState(0)

  const [lastReadEntries, setLastReadEntries] = useState<LastReadEntry[]>([])

  const cachedMode = getCachedQuranReadMode()
  const [readMode, setReadMode] = useState<QuranReadMode | null>(() => cachedMode)
  const [modeReady, setModeReady] = useState(() => cachedMode !== null)
  // Don't open until storage has been checked — avoids a flash when a preference already exists
  const [showModeModal, setShowModeModal] = useState(false)

  const [fontsLoaded] = useFonts({
    ScheherazadeNew_400Regular,
    ScheherazadeNew_700Bold,
  })

  const hydrateReadMode = useCallback(async () => {
    const mode = await getQuranReadMode()
    setReadMode(mode)
    setModeReady(true)
    // Only prompt when the user has never chosen a mode
    setShowModeModal(mode === null)
  }, [])

  // Fetch surahs and last read position on mount
  // Refresh last read every time screen is focused
  useFocusEffect(
    useCallback(() => {
      fetchLastRead()
      fetchBookmarkCount()
      void hydrateReadMode()
    }, [hydrateReadMode])
  )

  // Hydrate persisted mode as early as possible on cold start
  useEffect(() => {
    void hydrateReadMode()
  }, [hydrateReadMode])
  useEffect(() => {
    fetchSurahs()
  }, [])

  const handleSelectReadMode = async (mode: QuranReadMode) => {
    await setQuranReadMode(mode)
    setReadMode(mode)
    setShowModeModal(false)
  }

  const handleToggleReadMode = async () => {
    if (!readMode) return
    const next = toggleQuranReadMode(readMode)
    setReadMode(next)
    await setQuranReadMode(next)
  }

  useEffect(() => {
    if (!search.trim()) {
      setFiltered(surahs)
      return
    }
    const timer = setTimeout(() => {
      setFiltered(searchSurahs(search, surahs))
    }, 180)
    return () => clearTimeout(timer)
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
      // Try loading from cache first — show immediately for offline use
      const cached = await AsyncStorage.getItem("quran_surahs")
      if (cached) {
        const parsed = JSON.parse(cached)
        setSurahs(parsed)
        setLoading(false)
      }

      // Warm surah verse cache so opening a surah is instant
      const lang = normalizeReadLanguage(i18n.language)
      void warmReadCacheForLanguage(lang)

      // Soft refresh from network (don't block UI if we already have cache)
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 8000)

      try {
        const res = await fetch("https://api.alquran.cloud/v1/surah", {
          signal: controller.signal,
        })
        clearTimeout(timeout)

        const data = await res.json()
        if (data.code === 200) {
          setSurahs(data.data)
          await AsyncStorage.setItem("quran_surahs", JSON.stringify(data.data))
        } else if (!cached) {
          setError(true)
        }
      } catch (e) {
        clearTimeout(timeout)
        if (!cached) {
          console.log("Quran API error:", e)
          setError(true)
        }
      }
    } catch (e) {
      console.log("Quran list error:", e)
      const cached = await AsyncStorage.getItem("quran_surahs")
      if (!cached) setError(true)
    } finally {
      setLoading(false)
    }
  }

  const fetchLastRead = async () => {
    try {
      const state = await loadLastReadState()
      setLastReadEntries(state.entries)
    } catch (e) {
      console.log("Last read fetch error:", e)
    }
  }

  const goToSurah = (item: Surah, options?: { ayah?: number }) => {
    router.push({
      pathname: "/quran/[surah]",
      params: {
        surah: String(item.number),
        name: item.englishName,
        arabicName: item.name,
        verses: String(item.numberOfAyahs),
        type: item.revelationType,
        resume: "0",
        mode: readMode ?? "verses",
        ...(options?.ayah ? { ayah: String(options.ayah) } : {}),
      },
    })
  }

  const openSurahByNumber = (surahNumber: number, ayah?: number) => {
    const item = surahs.find(s => s.number === surahNumber)
    if (item) {
      goToSurah(item, { ayah })
      return
    }
    const meta = getSurahMeta(surahNumber)
    if (!meta) return
    router.push({
      pathname: "/quran/[surah]",
      params: {
        surah: String(meta.number),
        name: meta.englishName,
        arabicName: meta.arabicName,
        verses: String(meta.ayahCount),
        type: meta.revelationType,
        resume: "0",
        mode: readMode ?? "verses",
        ...(ayah ? { ayah: String(ayah) } : {}),
      },
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
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>{t("quran")}</Text>
            <Text style={styles.subtitle}>
              {readMode === "mushaf"
                ? t("quranReadModeSubtitleMushaf")
                : t("quranReadModeSubtitleVerses")}
            </Text>
          </View>
          <View style={styles.headerActions}>
            {modeReady && readMode ? (
              <QuranReadModeToggle mode={readMode} onToggle={handleToggleReadMode} />
            ) : null}
            <TouchableOpacity
              style={styles.bookmarkBtn}
              onPress={() => router.push("/quran/bookmark")}
            >
              <Ionicons name="bookmark" size={20} color="#C9A84C" />
            </TouchableOpacity>
          </View>
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
    <AnimatedHeroIcon name="cloudOffline" size={48} accent="gold" />
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
              {lastReadEntries.length > 0 && (
                <View style={styles.chipSection}>
                  <Text style={styles.continueLabel}>LAST READ</Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.chipRow}
                  >
                    {lastReadEntries.map((entry, index) => (
                      <TouchableOpacity
                        key={`${entry.surahNumber}-${entry.registeredAt}-${index}`}
                        style={[styles.linkChip, { borderColor: theme.gold }]}
                        onPress={() => openSurahByNumber(entry.surahNumber, entry.ayah)}
                      >
                        <Text style={[styles.linkChipText, { color: theme.text }]} numberOfLines={1}>
                          {entry.englishName}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}

              <View style={styles.chipSection}>
                <Text style={styles.continueLabel}>QUICK LINKS</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.chipRow}
                >
                  {QURAN_QUICK_LINKS.map(link => (
                    <TouchableOpacity
                      key={link.label}
                      style={[styles.linkChip, { borderColor: theme.gold }]}
                      onPress={() => openSurahByNumber(link.surahNumber, link.startAyah)}
                    >
                      <Text style={[styles.linkChipText, { color: theme.text }]} numberOfLines={1}>
                        {link.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {/* Bookmarks card */}
                <TouchableOpacity
                  style={[styles.bookmarkCard, { borderColor: theme.gold }]}
                  onPress={() => router.push("/quran/bookmark")}
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
              <AnimatedHeroIcon name="book" size={48} accent="gold" style={{ marginBottom: 12 }} />
              <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                No surahs found for "{search}"
              </Text>
            </View>
          )}
        />
      )}

      <QuranReadModeModal visible={showModeModal} onSelect={handleSelectReadMode} />
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

  continueLabel: { color: "#C9A84C", fontSize: 10, fontWeight: "600", letterSpacing: 0.8, marginBottom: 4 },
  continueName: { fontSize: 13, fontWeight: "500" },
  chipSection: { marginHorizontal: 16, marginTop: 16, marginBottom: 4 },
  chipRow: { flexDirection: "row", gap: 8, paddingBottom: 4 },
  linkChip: {
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: "rgba(201,168,76,0.1)",
  },
  linkChipText: { fontSize: 13, fontWeight: "600" },

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
  emptyText: { fontSize: 14 },

  titleRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16, gap: 12 },
  headerActions: { flexDirection: "row", alignItems: "center", gap: 8 },
  bookmarkBtn: { backgroundColor: "rgba(201,168,76,0.15)", padding: 10, borderRadius: 12 },
})