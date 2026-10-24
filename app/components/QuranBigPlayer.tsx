// Big Quran player.
//   variant="card" → a large card at the bottom of the Listen screen (Premium), with a button to open the full page.
//   variant="home" → the player on Home (everyone). First time: any button opens "choose a reciter and surah".
//                    After that it shows the last surah you listened to.
//   variant="full" → the full-page player (app/quran-player.tsx, Premium).
// Premium continues at the exact second you stopped. Free users start that surah again from the beginning.
import SurahAudioDownload from "@/app/components/SurahAudioDownload"
import { QURAN_AUDIO_FREE } from "@/lib/quranAudio"
import TouchableOpacity from "@/app/components/AppPressable"
import { usePremium } from "@/lib/premium"
import {
  continueListenSpot,
  currentSurahReciter,
  playSurah,
  getQuranProgress,
  loadListenSpot,
  pauseQuran,
  playNeighbourSurah,
  resumeQuran,
  seekQuran,
  stopQuranAudio,
  type ListenSpot,
} from "@/lib/quranAudio"
import { getSurahMeta } from "@/lib/quranSurahMeta"
import { useQuranPlayback } from "@/lib/useQuranPlayback"
import { Ionicons } from "@expo/vector-icons"
import { useFocusEffect, useRouter } from "expo-router"
import { useCallback, useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native"

const NAVY = "#1E3A5F"
const GOLD = "#C9A84C"

export function clock(seconds: number) {
  const s = Math.max(0, Math.floor(seconds))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = String(s % 60).padStart(2, "0")
  return h ? `${h}:${String(m).padStart(2, "0")}:${sec}` : `${m}:${sec}`
}

export const surahTitle = (n: number) => `${n}. ${getSurahMeta(n)?.englishName ?? ""}`

export default function QuranBigPlayer({ variant }: { variant: "card" | "full" | "home" }) {
  const router = useRouter()
  const { t } = useTranslation()
  const { isPremium: hasPremium } = usePremium()
  // Quran audio is free for everyone (QURAN_AUDIO_FREE), otherwise Premium only.
  const isPremium = hasPremium || QURAN_AUDIO_FREE
  const playback = useQuranPlayback()
  const [progress, setProgress] = useState({ position: 0, duration: 0 })
  const [spot, setSpot] = useState<ListenSpot | null>(null)
  const [trackWidth, setTrackWidth] = useState(1)

  const live = playback.kind === "surah"

  // Last saved spot (only used when nothing is playing right now).
  useFocusEffect(
    useCallback(() => {
      let active = true
      void loadListenSpot().then(s => active && setSpot(s))
      return () => {
        active = false
      }
    }, [playback.kind])
  )

  // Progress bar: refresh twice a second while a surah is loaded.
  useEffect(() => {
    if (!live) return
    const timer = setInterval(() => setProgress(getQuranProgress()), 500)
    return () => clearInterval(timer)
  }, [live])

  const home = variant === "home"
  const openChooser = () => router.push("/quran-listen" as any)

  if (!live && !spot) {
    if (variant === "card") return null
    if (variant === "full") return <Text style={styles.empty}>{t("qaNothingPlaying")}</Text>
    // ─── Home, first time: looks like a player, every button opens the reciter / surah chooser ───
    return (
      <TouchableOpacity style={[styles.card, styles.homeCard]} onPress={openChooser} activeOpacity={0.9}>
        <View style={styles.cardTop}>
          <View style={[styles.cardArt, styles.homeArt]}>
            <Ionicons name="headset" size={28} color={GOLD} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.homeTitle}>{t("qaListenTitle")}</Text>
            <Text style={styles.cardSub}>{t("qaPickFirst")}</Text>
          </View>
        </View>
        <View style={[styles.track, { marginTop: 16 }]} />
        <View style={[styles.controls, { marginTop: 14 }]}>
          <TouchableOpacity onPress={openChooser} hitSlop={8}>
            <Ionicons name="play-skip-back" size={26} color="rgba(255,255,255,0.45)" />
          </TouchableOpacity>
          <TouchableOpacity onPress={openChooser} style={[styles.playBtn, styles.playBtnHome]}>
            <Ionicons name="play" size={32} color={NAVY} style={{ marginLeft: 3 }} />
          </TouchableOpacity>
          <TouchableOpacity onPress={openChooser} hitSlop={8}>
            <Ionicons name="play-skip-forward" size={26} color="rgba(255,255,255,0.45)" />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    )
  }

  const surahNo = live ? playback.surah : spot!.surah
  const meta = surahNo ? getSurahMeta(surahNo) : undefined
  const title = live ? playback.title : spot!.title
  const reciterName = live ? playback.reciterName : spot!.reciter.name
  // Free users don't get "continue where you stopped": the saved surah starts from 0.
  const canResume = isPremium
  const position = live ? progress.position : canResume ? spot!.position : 0
  const duration = live ? progress.duration : spot!.duration
  const percent = duration > 0 ? Math.min(100, (position / duration) * 100) : 0

  const togglePlay = () => {
    if (!live && spot) return void continueListenSpot(canResume ? spot : { ...spot, position: 0 })
    if (playback.playing) pauseQuran()
    else resumeQuran()
  }
  const skip = (seconds: number) => {
    if (live) seekQuran(progress.position + seconds)
  }
  const neighbour = (delta: 1 | -1) => {
    if (live) return void playNeighbourSurah(delta, surahTitle)
    // Paused on the saved surah: start the surah before / after it with the same reciter.
    if (!spot) return
    const surahs = new Set(spot.reciter.surahs)
    let next = spot.surah + delta
    while (next >= 1 && next <= 114 && !surahs.has(next)) next += delta
    if (next < 1 || next > 114) return
    void playSurah({ ...spot.reciter, surahs }, next, surahTitle(next))
  }
  const seekTo = (x: number) => {
    if (live && duration > 0) seekQuran((x / trackWidth) * duration)
  }

  const full = variant === "full"
  const playIcon = live && playback.playing ? "pause" : "play"
  // Previous / next work when playing or paused on a saved surah. ±15s only while playing.
  const navColor = live || spot ? "#fff" : "rgba(255,255,255,0.35)"
  const skipColor = live ? "#fff" : "rgba(255,255,255,0.35)"

  return (
    <View style={full ? styles.fullWrap : [styles.card, home && styles.homeCard]}>
      {/* ─── Top: artwork + names ─── */}
      {full ? (
        <View style={styles.fullArt}>
          <Text style={styles.fullArabic}>{meta?.arabicName ?? ""}</Text>
          <Text style={styles.fullAyahs}>{meta ? t("qaAyahs", { count: meta.ayahCount }) : ""}</Text>
        </View>
      ) : null}

      <View style={full ? styles.fullNames : styles.cardTop}>
        {!full ? (
          <View style={[styles.cardArt, home && styles.homeArt]}>
            <Text style={[styles.cardArabic, home && { fontSize: 17 }]} numberOfLines={1}>{meta?.arabicName ?? ""}</Text>
          </View>
        ) : null}
        <View style={{ flex: 1 }}>
          {!live ? <Text style={styles.continueTag}>{canResume ? t("qaContinueTag") : t("qaLastPlayed")}</Text> : null}
          <Text style={full ? styles.fullTitle : [styles.cardTitle, home && styles.homeTitle]} numberOfLines={1}>{title}</Text>
          <Text style={full ? styles.fullSub : styles.cardSub} numberOfLines={1}>
            {live && playback.error ? t("qaError") : reciterName}
          </Text>
        </View>
        {/* Download this surah to listen offline (full player and Listen screen card) */}
        {!home && surahNo && (live ? currentSurahReciter() : spot?.reciter) ? (
          <SurahAudioDownload
            surah={surahNo}
            variant="player"
            reciter={(live ? currentSurahReciter() : { ...spot!.reciter, surahs: new Set(spot!.reciter.surahs) }) as any}
          />
        ) : null}
        {!full ? (
          <>
            {/* Full-page player is Premium; free users go to the reciter / surah list instead */}
            <TouchableOpacity
              onPress={() => router.push((hasPremium ? "/quran-player" : "/quran-listen") as any)}
              hitSlop={10}
              accessibilityLabel={t("qaOpenPlayer")}
            >
              <Ionicons name={hasPremium ? "expand" : "list"} size={20} color="#fff" />
            </TouchableOpacity>
            {live ? (
              <TouchableOpacity onPress={() => void stopQuranAudio()} hitSlop={10}>
                <Ionicons name="close" size={22} color="#fff" />
              </TouchableOpacity>
            ) : null}
          </>
        ) : null}
      </View>

      {/* ─── Progress (tap anywhere on the bar to jump) ─── */}
      <Pressable
        onLayout={e => setTrackWidth(Math.max(1, e.nativeEvent.layout.width))}
        onPress={e => seekTo(e.nativeEvent.locationX)}
        style={styles.trackHit}
      >
        <View style={styles.track}>
          <View style={[styles.fill, { width: `${percent}%` }]} />
        </View>
        <View style={[styles.knob, { left: `${percent}%` }]} />
      </Pressable>
      <View style={styles.times}>
        <Text style={styles.time}>{clock(position)}</Text>
        <Text style={styles.time}>{duration ? clock(duration) : "--:--"}</Text>
      </View>

      {/* ─── Controls ─── */}
      <View style={[styles.controls, full && { marginTop: 18 }]}>
        <TouchableOpacity onPress={() => neighbour(-1)} hitSlop={8} accessibilityLabel={t("qaPrevSurah")}>
          <Ionicons name="play-skip-back" size={full ? 30 : home ? 26 : 24} color={navColor} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => skip(-15)} hitSlop={8} accessibilityLabel="-15s">
          <Ionicons name="play-back" size={full ? 28 : 22} color={skipColor} />
        </TouchableOpacity>
        <TouchableOpacity onPress={togglePlay} style={[styles.playBtn, full && styles.playBtnFull, home && styles.playBtnHome]}>
          {live && playback.loading ? (
            <ActivityIndicator color={NAVY} />
          ) : (
            <Ionicons name={playIcon} size={full ? 38 : 28} color={NAVY} style={playIcon === "play" ? { marginLeft: 3 } : undefined} />
          )}
        </TouchableOpacity>
        <TouchableOpacity onPress={() => skip(15)} hitSlop={8} accessibilityLabel="+15s">
          <Ionicons name="play-forward" size={full ? 28 : 22} color={skipColor} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => neighbour(1)} hitSlop={8} accessibilityLabel={t("qaNextSurah")}>
          <Ionicons name="play-skip-forward" size={full ? 30 : home ? 26 : 24} color={navColor} />
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  empty: { color: "rgba(255,255,255,0.7)", textAlign: "center", marginTop: 60 },
  // Card
  card: {
    backgroundColor: NAVY,
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(201,168,76,0.45)",
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 10,
  },
  cardTop: { flexDirection: "row", alignItems: "center", gap: 12 },
  cardArt: { width: 54, height: 54, borderRadius: 14, backgroundColor: "rgba(201,168,76,0.18)", borderWidth: 1, borderColor: GOLD, alignItems: "center", justifyContent: "center", paddingHorizontal: 4 },
  cardArabic: { color: GOLD, fontSize: 15, fontWeight: "700" },
  cardTitle: { color: "#fff", fontSize: 16, fontWeight: "800" },
  cardSub: { color: "#E8D5A3", fontSize: 12, marginTop: 2 },
  continueTag: { color: GOLD, fontSize: 10, fontWeight: "800", letterSpacing: 0.8, marginBottom: 2 },
  // Full page
  fullWrap: { flex: 1, paddingHorizontal: 28, justifyContent: "center" },
  fullArt: {
    alignSelf: "center",
    width: 250,
    height: 250,
    borderRadius: 125,
    borderWidth: 2,
    borderColor: GOLD,
    backgroundColor: "rgba(201,168,76,0.12)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 34,
  },
  fullArabic: { color: GOLD, fontSize: 40, fontWeight: "700", textAlign: "center", paddingHorizontal: 16 },
  fullAyahs: { color: "rgba(255,255,255,0.65)", fontSize: 13, marginTop: 8 },
  fullNames: { flexDirection: "row", alignItems: "center", marginBottom: 6 },
  fullTitle: { color: "#fff", fontSize: 24, fontWeight: "800" },
  fullSub: { color: "#E8D5A3", fontSize: 15, marginTop: 4 },
  // Progress
  trackHit: { marginTop: 14, paddingVertical: 8, justifyContent: "center" },
  track: { height: 5, borderRadius: 999, backgroundColor: "rgba(255,255,255,0.2)", overflow: "hidden" },
  fill: { height: "100%", backgroundColor: GOLD },
  knob: { position: "absolute", width: 14, height: 14, borderRadius: 7, backgroundColor: GOLD, marginLeft: -7, top: 3.5 },
  times: { flexDirection: "row", justifyContent: "space-between" },
  time: { color: "rgba(255,255,255,0.65)", fontSize: 11 },
  // Controls
  controls: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 8, paddingHorizontal: 6 },
  playBtn: { width: 58, height: 58, borderRadius: 29, backgroundColor: GOLD, alignItems: "center", justifyContent: "center" },
  playBtnFull: { width: 78, height: 78, borderRadius: 39 },
  // Home (bigger)
  homeCard: { padding: 18, borderRadius: 24 },
  homeArt: { width: 66, height: 66, borderRadius: 18 },
  homeTitle: { color: "#fff", fontSize: 18, fontWeight: "800" },
  playBtnHome: { width: 66, height: 66, borderRadius: 33 },
})
