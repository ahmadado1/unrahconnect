// "Listen instead of reading" card, shown above the first page of the isolated
// Surah Al-Kahf and Surah Al-Mulk readers.
//   • Premium: plays the whole surah (default reciter: Yasser Al-Dosari). Change reciter any time.
//     When the recitation reaches the end, the surah is ticked as done (same tick as reading).
//   • Free: a small locked row that explains it's a Premium feature.
import { QURAN_AUDIO_FREE } from "@/lib/quranAudio"
import { showPremiumPrompt } from "@/lib/premiumPrompt"
import TouchableOpacity from "@/app/components/AppPressable"
import { clock } from "@/app/components/QuranBigPlayer"
import { usePremium } from "@/lib/premium"
import {
  fetchSurahReciters,
  getQuranProgress,
  loadFavReciters,
  pauseQuran,
  playSurah,
  reciterMatches,
  resumeQuran,
  seekQuran,
  type SurahReciter,
} from "@/lib/quranAudio"
import { getSurahMeta } from "@/lib/quranSurahMeta"
import { useQuranPlayback } from "@/lib/useQuranPlayback"
import { Ionicons } from "@expo/vector-icons"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { useEffect, useMemo, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { ActivityIndicator, FlatList, Modal, Pressable, StyleSheet, Text, TextInput, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"

const NAVY = "#1E3A5F"
const GOLD = "#C9A84C"
/** Default voice for these surahs. */
const DEFAULT_RECITER = "yasser dosari"

export default function IsolatedSurahListenCard({
  surah,
  done,
  onListened,
}: {
  surah: number
  /** Already ticked for this week / night */
  done: boolean
  /** Called once when the recitation reaches the end */
  onListened: () => void
}) {
  const { t } = useTranslation()
  const insets = useSafeAreaInsets()
  const { isPremium: hasPremium } = usePremium()
  // Quran audio is free for everyone (QURAN_AUDIO_FREE), otherwise Premium only.
  const isPremium = hasPremium || QURAN_AUDIO_FREE
  const playback = useQuranPlayback()
  const meta = getSurahMeta(surah)
  const storageKey = `isolated_reciter_${surah}`

  const [reciters, setReciters] = useState<SurahReciter[]>([])
  const [reciter, setReciter] = useState<SurahReciter | null>(null)
  const [loading, setLoading] = useState(true)
  const [picking, setPicking] = useState(false)
  const [search, setSearch] = useState("")
  const [favIds, setFavIds] = useState<number[]>([])
  const [progress, setProgress] = useState({ position: 0, duration: 0 })
  const [trackWidth, setTrackWidth] = useState(1)
  const reportedRef = useRef(done)

  // ─── Load reciters that have this surah, pick the saved one or Yasser Al-Dosari ───
  useEffect(() => {
    if (!isPremium) return
    let active = true
    Promise.all([fetchSurahReciters(), AsyncStorage.getItem(storageKey), loadFavReciters()])
      .then(([list, savedId, favs]) => {
        if (!active) return
        const withSurah = list.filter(r => r.surahs.has(surah))
        setReciters(withSurah)
        setFavIds(favs)
        const chosen =
          withSurah.find(r => String(r.id) === savedId) ??
          withSurah.find(r => reciterMatches(r.name, DEFAULT_RECITER)) ??
          withSurah[0] ??
          null
        setReciter(chosen)
      })
      .catch(() => {})
      .finally(() => active && setLoading(false))
    return () => {
      active = false
    }
  }, [isPremium, surah, storageKey])

  const live = playback.kind === "surah" && playback.surah === surah

  // ─── Progress, and tick the surah when the recitation reaches the end ───
  useEffect(() => {
    if (!live) return
    const timer = setInterval(() => {
      const next = getQuranProgress()
      setProgress(next)
      if (!reportedRef.current && next.duration > 0 && next.position / next.duration >= 0.97) {
        reportedRef.current = true
        onListened()
      }
    }, 500)
    return () => clearInterval(timer)
  }, [live, onListened])

  const pickerList = useMemo(() => {
    const matches = reciters.filter(r => reciterMatches(r.name, search))
    const favs = matches.filter(r => favIds.includes(r.id))
    return [...favs, ...matches.filter(r => !favIds.includes(r.id))]
  }, [reciters, search, favIds])

  // ─── Free users: small locked teaser ───
  if (!isPremium) {
    return (
      <TouchableOpacity style={styles.lockedRow} onPress={() => showPremiumPrompt()}>
        <Ionicons name="headset" size={18} color={GOLD} />
        <Text style={styles.lockedText}>{t("isoListenInstead")}</Text>
        <View style={styles.pro}>
          <Ionicons name="star" size={9} color={NAVY} />
          <Text style={styles.proText}>{t("premiumBadge").toUpperCase()}</Text>
        </View>
        <Ionicons name="lock-closed" size={15} color={GOLD} />
      </TouchableOpacity>
    )
  }

  const title = `${surah}. ${meta?.englishName ?? ""}`
  const start = () => reciter && void playSurah(reciter, surah, title)
  const togglePlay = () => {
    if (!live) return start()
    if (playback.playing) pauseQuran()
    else resumeQuran()
  }
  const choose = (next: SurahReciter) => {
    setReciter(next)
    setPicking(false)
    setSearch("")
    void AsyncStorage.setItem(storageKey, String(next.id))
    // If this surah is already playing, switch voice straight away.
    if (live) void playSurah(next, surah, title)
  }

  const percent = live && progress.duration > 0 ? Math.min(100, (progress.position / progress.duration) * 100) : 0

  return (
    <View style={styles.card}>
      <View style={styles.top}>
        <TouchableOpacity onPress={togglePlay} style={styles.playBtn} disabled={!reciter}>
          {loading || (live && playback.loading) ? (
            <ActivityIndicator color={NAVY} />
          ) : (
            <Ionicons name={live && playback.playing ? "pause" : "play"} size={24} color={NAVY} style={!(live && playback.playing) ? { marginLeft: 2 } : undefined} />
          )}
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{done ? t("isoDoneTonight") : t("isoListenInstead")}</Text>
          <Text style={styles.sub} numberOfLines={1}>
            {live && playback.error ? t("qaError") : (reciter?.name ?? (loading ? "…" : t("networkError")))}
          </Text>
        </View>
        {done ? <Ionicons name="checkmark-circle" size={24} color="#4ADE80" /> : null}
        <TouchableOpacity onPress={() => setPicking(true)} style={styles.changeBtn} disabled={!reciters.length}>
          <Ionicons name="swap-horizontal" size={13} color={GOLD} />
          <Text style={styles.changeText}>{t("isoChangeReciter")}</Text>
        </TouchableOpacity>
      </View>

      {live ? (
        <>
          <Pressable
            onLayout={e => setTrackWidth(Math.max(1, e.nativeEvent.layout.width))}
            onPress={e => progress.duration > 0 && seekQuran((e.nativeEvent.locationX / trackWidth) * progress.duration)}
            style={styles.trackHit}
          >
            <View style={styles.track}>
              <View style={[styles.fill, { width: `${percent}%` }]} />
            </View>
          </Pressable>
          <View style={styles.bottom}>
            <Text style={styles.time}>{clock(progress.position)}</Text>
            <View style={styles.skipRow}>
              <TouchableOpacity onPress={() => seekQuran(progress.position - 15)} hitSlop={8}>
                <Ionicons name="play-back" size={18} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => seekQuran(progress.position + 15)} hitSlop={8}>
                <Ionicons name="play-forward" size={18} color="#fff" />
              </TouchableOpacity>
            </View>
            <Text style={styles.time}>{progress.duration ? clock(progress.duration) : "--:--"}</Text>
          </View>
        </>
      ) : null}

      {/* ─── Change reciter ─── */}
      <Modal visible={picking} animationType="slide" transparent onRequestClose={() => setPicking(false)}>
        <View style={styles.sheetBackdrop}>
          <View style={[styles.sheet, { paddingBottom: insets.bottom + 12 }]}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>{t("qaChooseReciter")}</Text>
              <TouchableOpacity onPress={() => setPicking(false)} hitSlop={10}>
                <Ionicons name="close" size={22} color="#fff" />
              </TouchableOpacity>
            </View>
            <View style={styles.searchBox}>
              <Ionicons name="search" size={16} color="rgba(255,255,255,0.6)" />
              <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder={t("qaSearchReciter")}
                placeholderTextColor="rgba(255,255,255,0.5)"
                style={styles.searchInput}
              />
            </View>
            <FlatList keyboardDismissMode="on-drag"
              data={pickerList}
              keyExtractor={r => String(r.id)}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => {
                const selected = item.id === reciter?.id
                return (
                  <TouchableOpacity style={[styles.reciterRow, selected && styles.reciterRowOn]} onPress={() => choose(item)}>
                    <Ionicons name={favIds.includes(item.id) ? "heart" : "mic-outline"} size={16} color={GOLD} />
                    <Text style={styles.reciterName} numberOfLines={1}>{item.name}</Text>
                    {selected ? <Ionicons name="checkmark" size={18} color={GOLD} /> : null}
                  </TouchableOpacity>
                )
              }}
              ListEmptyComponent={<Text style={styles.emptyText}>{t("qaNoReciter")}</Text>}
            />
          </View>
        </View>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  card: { marginHorizontal: 12, marginTop: 8, marginBottom: 4, backgroundColor: NAVY, borderRadius: 16, padding: 12, borderWidth: 1, borderColor: "rgba(201,168,76,0.5)" },
  top: { flexDirection: "row", alignItems: "center", gap: 10 },
  playBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: GOLD, alignItems: "center", justifyContent: "center" },
  title: { color: "#fff", fontSize: 14, fontWeight: "800" },
  sub: { color: "#E8D5A3", fontSize: 12, marginTop: 1 },
  changeBtn: { flexDirection: "row", alignItems: "center", gap: 4, borderWidth: 1, borderColor: GOLD, borderRadius: 999, paddingHorizontal: 9, paddingVertical: 4 },
  changeText: { color: GOLD, fontSize: 11, fontWeight: "700" },
  trackHit: { marginTop: 10, paddingVertical: 6 },
  track: { height: 4, borderRadius: 999, backgroundColor: "rgba(255,255,255,0.2)", overflow: "hidden" },
  fill: { height: "100%", backgroundColor: GOLD },
  bottom: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  skipRow: { flexDirection: "row", gap: 26 },
  time: { color: "rgba(255,255,255,0.65)", fontSize: 11, minWidth: 40 },
  lockedRow: { marginHorizontal: 12, marginTop: 8, marginBottom: 4, flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 12, paddingVertical: 9, borderRadius: 12, borderWidth: 1, borderColor: "rgba(201,168,76,0.5)", backgroundColor: "rgba(30,58,95,0.06)" },
  lockedText: { flex: 1, color: NAVY, fontSize: 13, fontWeight: "700" },
  pro: { flexDirection: "row", alignItems: "center", gap: 3, backgroundColor: GOLD, borderRadius: 999, paddingHorizontal: 6, paddingVertical: 1 },
  proText: { color: NAVY, fontSize: 9, fontWeight: "800" },
  sheetBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "flex-end" },
  sheet: { maxHeight: "75%", backgroundColor: NAVY, borderTopLeftRadius: 22, borderTopRightRadius: 22, padding: 16 },
  sheetHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  sheetTitle: { color: "#fff", fontSize: 17, fontWeight: "800" },
  searchBox: { flexDirection: "row", alignItems: "center", gap: 8, marginVertical: 12, backgroundColor: "rgba(255,255,255,0.12)", borderRadius: 12, paddingHorizontal: 12 },
  searchInput: { flex: 1, color: "#fff", paddingVertical: 10, fontSize: 14 },
  reciterRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 12, paddingHorizontal: 8, borderRadius: 10 },
  reciterRowOn: { backgroundColor: "rgba(201,168,76,0.15)" },
  reciterName: { flex: 1, color: "#fff", fontSize: 14 },
  emptyText: { color: "rgba(255,255,255,0.7)", textAlign: "center", marginTop: 20 },
})
