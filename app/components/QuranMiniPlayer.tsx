// Small Quran player (free users, on Home and the Guide tab).
// First time: "Listen to the Quran" bar that opens the reciter / surah chooser.
// After that: the last surah with play / pause. Free users start the surah again from the beginning
// (only Premium continues at the exact second and gets the big player).
import TouchableOpacity from "@/app/components/AppPressable"
import {
  continueListenSpot,
  getQuranProgress,
  loadListenSpot,
  pauseQuran,
  resumeQuran,
  stopQuranAudio,
  type ListenSpot,
} from "@/lib/quranAudio"
import { useQuranPlayback } from "@/lib/useQuranPlayback"
import { Ionicons } from "@expo/vector-icons"
import { useFocusEffect, useRouter } from "expo-router"
import { useCallback, useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { ActivityIndicator, StyleSheet, Text, View } from "react-native"

const NAVY = "#1E3A5F"
const GOLD = "#C9A84C"

export default function QuranMiniPlayer() {
  const router = useRouter()
  const { t } = useTranslation()
  const playback = useQuranPlayback()
  const [spot, setSpot] = useState<ListenSpot | null>(null)
  const [percent, setPercent] = useState(0)
  const live = playback.kind === "surah"

  // Last surah listened to (shown when nothing is playing).
  useFocusEffect(
    useCallback(() => {
      let active = true
      void loadListenSpot().then(s => active && setSpot(s))
      return () => {
        active = false
      }
    }, [playback.kind])
  )

  // Thin progress line while a surah plays.
  useEffect(() => {
    if (!live) return
    const timer = setInterval(() => {
      const p = getQuranProgress()
      setPercent(p.duration > 0 ? Math.min(100, (p.position / p.duration) * 100) : 0)
    }, 1000)
    return () => clearInterval(timer)
  }, [live])

  const openChooser = () => router.push("/quran-listen" as any)

  const togglePlay = () => {
    if (!live) {
      if (spot) void continueListenSpot({ ...spot, position: 0 })
      else openChooser()
      return
    }
    if (playback.playing) pauseQuran()
    else resumeQuran()
  }

  const title = live ? playback.title : spot ? spot.title : t("qaListenTitle")
  const sub = live
    ? playback.error
      ? t("qaError")
      : playback.reciterName
    : spot
      ? `${t("qaLastPlayed")} · ${spot.reciter.name}`
      : t("qaHomeSub")

  return (
    <TouchableOpacity style={styles.bar} onPress={openChooser} activeOpacity={0.9} accessibilityRole="button" accessibilityLabel={t("qaListenTitle")}>
      <View style={styles.row}>
        <View style={styles.icon}>
          <Ionicons name={live && playback.playing ? "musical-notes" : "headset"} size={20} color={GOLD} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.title} numberOfLines={1}>{title}</Text>
          <Text style={styles.sub} numberOfLines={1}>{sub}</Text>
        </View>
        <TouchableOpacity onPress={togglePlay} hitSlop={8} accessibilityLabel={live && playback.playing ? t("qaPause", { defaultValue: "Pause" }) : t("qaPlay", { defaultValue: "Play" })}>
          {live && playback.loading ? (
            <ActivityIndicator color={GOLD} />
          ) : (
            <Ionicons name={live && playback.playing ? "pause-circle" : "play-circle"} size={38} color={GOLD} />
          )}
        </TouchableOpacity>
        {live ? (
          <TouchableOpacity onPress={() => void stopQuranAudio()} hitSlop={8}>
            <Ionicons name="close" size={20} color="#fff" />
          </TouchableOpacity>
        ) : (
          <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.6)" />
        )}
      </View>
      {live ? (
        <View style={styles.track}>
          <View style={[styles.fill, { width: `${percent}%` }]} />
        </View>
      ) : null}
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  bar: { backgroundColor: NAVY, borderRadius: 16, paddingHorizontal: 14, paddingVertical: 12, borderWidth: 1, borderColor: "rgba(201,168,76,0.5)" },
  row: { flexDirection: "row", alignItems: "center", gap: 12 },
  icon: { width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(201,168,76,0.15)", alignItems: "center", justifyContent: "center" },
  title: { color: "#fff", fontSize: 15, fontWeight: "700" },
  sub: { color: "#E8D5A3", fontSize: 12, marginTop: 2 },
  track: { height: 3, borderRadius: 999, backgroundColor: "rgba(255,255,255,0.2)", marginTop: 10, overflow: "hidden" },
  fill: { height: "100%", backgroundColor: GOLD },
})
