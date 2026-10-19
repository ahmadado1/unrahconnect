// "Listen" screen: whole-surah recitations from mp3quran.net.
// Step 1: pick a reciter (a few are free, the rest are Premium ⭐).
// Step 2: pick a surah. A player bar at the bottom shows progress, pause and stop.
// Tap the ☆ on a reciter to pin them to "My favourites" at the top.
// Premium: a big player card (previous/next surah, ±15s, tap the bar to jump, open full page)
// and it continues exactly where you stopped last time. Free: the small player bar.
// Audio keeps playing when the screen locks.
import { QURAN_AUDIO_FREE } from "@/lib/quranAudio"
import { showPremiumPrompt } from "@/lib/premiumPrompt"
import TouchableOpacity from "@/app/components/AppPressable"
import QuranBigPlayer from "@/app/components/QuranBigPlayer"
import { useTheme } from "@/context/themeContext"
import { usePremium } from "@/lib/premium"
import {
  fetchSurahReciters,
  getQuranProgress,
  loadFavReciters,
  pauseQuran,
  playSurah,
  reciterMatches,
  resumeQuran,
  saveFavReciters,
  seekQuran,
  stopQuranAudio,
  type SurahReciter,
} from "@/lib/quranAudio"
import { SURAH_META } from "@/lib/quranSurahMeta"
import { useQuranPlayback } from "@/lib/useQuranPlayback"
import { Ionicons } from "@expo/vector-icons"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { useRouter } from "expo-router"
import { StatusBar } from "expo-status-bar"
import { useEffect, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { ActivityIndicator, FlatList, StyleSheet, Text, TextInput, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"

const NAVY = "#1E3A5F"
const GOLD = "#C9A84C"
const LAST_RECITER_KEY = "quran_listen_reciter"

function clock(seconds: number) {
  const s = Math.max(0, Math.floor(seconds))
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`
}

export default function QuranListenScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { theme } = useTheme()
  const { t } = useTranslation()
  const { isPremium: hasPremium } = usePremium()
  // Quran audio is free for everyone (QURAN_AUDIO_FREE), otherwise Premium only.
  const isPremium = hasPremium || QURAN_AUDIO_FREE
  const playback = useQuranPlayback()

  const [reciters, setReciters] = useState<SurahReciter[]>([])
  const [loading, setLoading] = useState(true)
  const [failed, setFailed] = useState(false)
  const [reciter, setReciter] = useState<SurahReciter | null>(null)
  const [search, setSearch] = useState("")
  const [progress, setProgress] = useState({ position: 0, duration: 0 })
  const [favIds, setFavIds] = useState<number[]>([])

  // ─── Favourite reciters (saved on the phone) ───────────────────────────────
  useEffect(() => {
    void loadFavReciters().then(setFavIds)
  }, [])

  const toggleFav = (id: number) => {
    setFavIds(prev => {
      const next = prev.includes(id) ? prev.filter(x => x !== id) : [id, ...prev]
      void saveFavReciters(next)
      return next
    })
  }

  // ─── Load reciters (cached for a week) ─────────────────────────────────────
  useEffect(() => {
    let active = true
    Promise.all([fetchSurahReciters(), AsyncStorage.getItem(LAST_RECITER_KEY)])
      .then(([list, lastId]) => {
        if (!active) return
        setReciters(list)
        const last = list.find(r => String(r.id) === lastId)
        if (last && (last.free || isPremium)) setReciter(last)
      })
      .catch(() => active && setFailed(true))
      .finally(() => active && setLoading(false))
    return () => {
      active = false
    }
  }, [isPremium])

  // ─── Progress bar (updates twice a second while a surah plays) ─────────────
  useEffect(() => {
    if (playback.kind !== "surah") return
    const timer = setInterval(() => setProgress(getQuranProgress()), 500)
    return () => clearInterval(timer)
  }, [playback.kind])

  // Search understands different spellings ("Yasser Al-Dosari" = "yaser dossary").
  // Favourites come first, in the order they were starred.
  const { favReciters, otherReciters } = useMemo(() => {
    const matches = reciters.filter(r => reciterMatches(r.name, search))
    const fav = favIds.map(id => matches.find(r => r.id === id)).filter((r): r is SurahReciter => Boolean(r))
    return { favReciters: fav, otherReciters: matches.filter(r => !favIds.includes(r.id)) }
  }, [reciters, search, favIds])

  const renderReciter = (item: SurahReciter) => {
    const locked = !item.free && !isPremium
    const isFav = favIds.includes(item.id)
    return (
      <TouchableOpacity
        key={item.id}
        style={[styles.row, { backgroundColor: theme.card, borderColor: isFav ? GOLD : theme.border }]}
        onPress={() => chooseReciter(item)}
      >
        <View style={[styles.avatar, locked && { opacity: 0.6 }]}>
          <Ionicons name="mic" size={16} color={GOLD} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.rowTitle, { color: theme.text }, locked && { opacity: 0.6 }]}>{item.name}</Text>
          {item.moshafName ? (
            <Text style={[styles.rowSub, { color: theme.textSecondary }]} numberOfLines={1}>{item.moshafName}</Text>
          ) : null}
        </View>
        {QURAN_AUDIO_FREE ? null : item.free ? (
          <Text style={styles.freeTag}>{t("qaFree")}</Text>
        ) : (
          <View style={styles.pro}>
            <Ionicons name="star" size={9} color={NAVY} />
            <Text style={styles.proText}>{t("premiumBadge").toUpperCase()}</Text>
          </View>
        )}
        {/* Favourite star */}
        <TouchableOpacity onPress={() => toggleFav(item.id)} hitSlop={10} accessibilityLabel={t("qaFavourite")}>
          <Ionicons name={isFav ? "heart" : "heart-outline"} size={20} color={isFav ? GOLD : theme.textSecondary} />
        </TouchableOpacity>
        <Ionicons name={locked ? "lock-closed" : "chevron-forward"} size={18} color={GOLD} />
      </TouchableOpacity>
    )
  }

  const filteredSurahs = useMemo(() => {
    if (!reciter) return []
    const q = search.trim().toLowerCase()
    return SURAH_META.filter(s => reciter.surahs.has(s.number)).filter(
      s => !q || s.englishName.toLowerCase().includes(q) || s.arabicName.includes(q) || String(s.number) === q
    )
  }, [reciter, search])

  const chooseReciter = (next: SurahReciter) => {
    if (!next.free && !isPremium) {
      showPremiumPrompt()
      return
    }
    setReciter(next)
    setSearch("")
    void AsyncStorage.setItem(LAST_RECITER_KEY, String(next.id))
  }

  const playingSurah = playback.kind === "surah" ? playback.surah : null
  const percent = progress.duration > 0 ? Math.min(100, (progress.position / progress.duration) * 100) : 0

  return (
    <View style={[styles.screen, { backgroundColor: theme.background }]}>
      <StatusBar style="light" />

      {/* ─── Header ─────────────────────────────────────────────────────────── */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => (reciter ? (setReciter(null), setSearch("")) : router.back())} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={22} color="#fff" />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>{reciter ? reciter.name : t("qaListenTitle")}</Text>
            <Text style={styles.headerSub}>{reciter ? t("qaChooseSurah") : t("qaListenSub")}</Text>
          </View>
        </View>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={16} color="rgba(255,255,255,0.6)" />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder={reciter ? t("qaSearchSurah") : t("qaSearchReciter")}
            placeholderTextColor="rgba(255,255,255,0.5)"
            style={styles.searchInput}
          />
        </View>
      </View>

      {loading ? (
        <ActivityIndicator color={GOLD} style={{ marginTop: 40 }} />
      ) : failed ? (
        <Text style={[styles.empty, { color: theme.textSecondary }]}>{t("networkError")}</Text>
      ) : !reciter ? (
        /* ─── Step 1: reciters ─── */
        <FlatList
          data={otherReciters}
          keyExtractor={r => String(r.id)}
          contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + (isPremium ? 240 : 110) }}
          keyboardShouldPersistTaps="handled"
          ListHeaderComponent={
            <>
              {favReciters.length ? (
                <>
                  <Text style={[styles.sectionLabel, { color: GOLD }]}>{t("qaFavourites")}</Text>
                  {favReciters.map(renderReciter)}
                  <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>{t("qaAllReciters")}</Text>
                </>
              ) : !search ? (
                <Text style={[styles.hint, { color: theme.textSecondary }]}>{t("qaFavouriteHint")}</Text>
              ) : null}
            </>
          }
          ListEmptyComponent={
            favReciters.length ? null : <Text style={[styles.empty, { color: theme.textSecondary }]}>{t("qaNoReciter")}</Text>
          }
          renderItem={({ item }) => renderReciter(item)}
        />
      ) : (
        /* ─── Step 2: surahs ─── */
        <FlatList
          data={filteredSurahs}
          keyExtractor={s => String(s.number)}
          contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + (isPremium ? 240 : 110) }}
          renderItem={({ item }) => {
            const isThis = playingSurah === item.number
            return (
              <TouchableOpacity
                style={[styles.row, { backgroundColor: theme.card, borderColor: isThis ? GOLD : theme.border }, isThis && styles.rowPlaying]}
                onPress={() => {
                  if (isThis) {
                    if (playback.playing) pauseQuran()
                    else resumeQuran()
                    return
                  }
                  void playSurah(reciter, item.number, `${item.number}. ${item.englishName}`)
                }}
              >
                <View style={styles.number}>
                  <Text style={styles.numberText}>{item.number}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.rowTitle, { color: theme.text }]}>{item.englishName}</Text>
                  <Text style={[styles.rowSub, { color: theme.textSecondary }]}>
                    {t("qaAyahs", { count: item.ayahCount })}
                  </Text>
                </View>
                <Text style={[styles.arabic, { color: theme.text }]}>{item.arabicName}</Text>
                {isThis && playback.loading ? (
                  <ActivityIndicator size="small" color={GOLD} />
                ) : (
                  <Ionicons name={isThis && playback.playing ? "pause-circle" : "play-circle"} size={26} color={GOLD} />
                )}
              </TouchableOpacity>
            )
          }}
        />
      )}

      {/* ─── Player bar ───────────────────────────────────────────────────────── */}
      {isPremium ? (
        <View style={[styles.bigPlayerWrap, { bottom: insets.bottom + 12 }]}>
          <QuranBigPlayer variant="card" />
        </View>
      ) : playback.kind === "surah" ? (
        <View style={[styles.player, { bottom: insets.bottom + 12 }]}>
          <View style={styles.playerTop}>
            <View style={{ flex: 1 }}>
              <Text style={styles.playerTitle} numberOfLines={1}>{playback.title}</Text>
              <Text style={styles.playerSub} numberOfLines={1}>{playback.error ? t("qaError") : playback.reciterName}</Text>
            </View>
            <TouchableOpacity onPress={() => seekQuran(progress.position - 15)} hitSlop={8}>
              <Ionicons name="play-back" size={20} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => (playback.playing ? pauseQuran() : resumeQuran())} hitSlop={8}>
              <Ionicons name={playback.playing ? "pause-circle" : "play-circle"} size={34} color={GOLD} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => seekQuran(progress.position + 15)} hitSlop={8}>
              <Ionicons name="play-forward" size={20} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => void stopQuranAudio()} hitSlop={8}>
              <Ionicons name="close" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
          <View style={styles.track}>
            <View style={[styles.fill, { width: `${percent}%` }]} />
          </View>
          <View style={styles.times}>
            <Text style={styles.time}>{clock(progress.position)}</Text>
            <Text style={styles.time}>{progress.duration ? clock(progress.duration) : "--:--"}</Text>
          </View>
        </View>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: { backgroundColor: NAVY, paddingHorizontal: 16, paddingBottom: 14 },
  headerRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  backBtn: { backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 20, padding: 6 },
  headerTitle: { color: "#fff", fontSize: 18, fontWeight: "bold" },
  headerSub: { color: GOLD, fontSize: 12, marginTop: 1 },
  searchBox: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 12, backgroundColor: "rgba(255,255,255,0.12)", borderRadius: 12, paddingHorizontal: 12 },
  searchInput: { flex: 1, color: "#fff", paddingVertical: 10, fontSize: 14 },
  empty: { textAlign: "center", marginTop: 40 },
  sectionLabel: { fontSize: 12, fontWeight: "800", letterSpacing: 0.6, textTransform: "uppercase", marginBottom: 8, marginTop: 4 },
  hint: { fontSize: 12, marginBottom: 10, textAlign: "center" },
  row: { flexDirection: "row", alignItems: "center", gap: 10, padding: 12, borderRadius: 14, borderWidth: 0.5, marginBottom: 8 },
  rowPlaying: { borderWidth: 1.5, backgroundColor: "rgba(201,168,76,0.08)" },
  avatar: { width: 34, height: 34, borderRadius: 17, backgroundColor: NAVY, alignItems: "center", justifyContent: "center" },
  rowTitle: { fontSize: 14, fontWeight: "600" },
  rowSub: { fontSize: 11, marginTop: 1 },
  freeTag: { fontSize: 10, fontWeight: "700", color: "#2F855A", backgroundColor: "#E6F4EA", paddingHorizontal: 7, paddingVertical: 2, borderRadius: 999, overflow: "hidden" },
  pro: { flexDirection: "row", alignItems: "center", gap: 3, backgroundColor: GOLD, borderRadius: 999, paddingHorizontal: 6, paddingVertical: 1 },
  proText: { color: NAVY, fontSize: 9, fontWeight: "800" },
  number: { width: 34, height: 34, borderRadius: 17, borderWidth: 1, borderColor: GOLD, alignItems: "center", justifyContent: "center" },
  numberText: { color: GOLD, fontWeight: "700", fontSize: 12 },
  arabic: { fontSize: 18 },
  bigPlayerWrap: { position: "absolute", left: 12, right: 12 },
  player: { position: "absolute", left: 12, right: 12, backgroundColor: NAVY, borderRadius: 18, padding: 12, shadowColor: "#000", shadowOpacity: 0.25, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 8 },
  playerTop: { flexDirection: "row", alignItems: "center", gap: 14 },
  playerTitle: { color: "#fff", fontWeight: "700", fontSize: 14 },
  playerSub: { color: "#E8D5A3", fontSize: 11, marginTop: 1 },
  track: { height: 4, borderRadius: 999, backgroundColor: "rgba(255,255,255,0.2)", marginTop: 10, overflow: "hidden" },
  fill: { height: "100%", backgroundColor: GOLD },
  times: { flexDirection: "row", justifyContent: "space-between", marginTop: 4 },
  time: { color: "rgba(255,255,255,0.6)", fontSize: 10 },
})
