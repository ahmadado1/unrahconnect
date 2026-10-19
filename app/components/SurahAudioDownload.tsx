// "Download audio" button for one surah.
//   variant="card"   → in Read mode, at the top of the surah (uses your Listen reciter, or Alafasy).
//   variant="player" → small round button in the Quran player (the reciter that is playing).
// Once downloaded: "Downloaded" with Play (card) / a check mark (player). Long-press to delete.
import TouchableOpacity from "@/app/components/AppPressable"
import { useTheme } from "@/context/themeContext"
import { fetchSurahReciters, playSurah, type SurahReciter } from "@/lib/quranAudio"
import { cancelSurahDownload, deleteSurahAudio, downloadedSurahUri, downloadSurahAudio } from "@/lib/quranAudioDownloads"
import { getSurahMeta } from "@/lib/quranSurahMeta"
import { Ionicons } from "@expo/vector-icons"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { ActivityIndicator, Alert, StyleSheet, Text, View } from "react-native"

const NAVY = "#1E3A5F"
const GOLD = "#C9A84C"
/** Same key the Listen screen uses for "last reciter". */
const LAST_RECITER_KEY = "quran_listen_reciter"

type Props = {
  surah: number
  variant: "card" | "player"
  /** Player: the reciter already known. Card: leave empty (we pick one). */
  reciter?: SurahReciter | null
}

export default function SurahAudioDownload({ surah, variant, reciter: given }: Props) {
  const { theme } = useTheme()
  const { t } = useTranslation()
  const [picked, setPicked] = useState<SurahReciter | null>(null)
  // Player: the reciter that is playing. Card: the one we picked below.
  const reciter = given ?? picked
  const [saved, setSaved] = useState(false)
  const [progress, setProgress] = useState<number | null>(null)

  // Card: pick the reciter from the Listen screen, else Alafasy, else the first one with this surah.
  useEffect(() => {
    if (given) return
    let active = true
    void Promise.all([fetchSurahReciters(), AsyncStorage.getItem(LAST_RECITER_KEY)]).then(([list, lastId]) => {
      if (!active) return
      const withSurah = list.filter(r => r.surahs.has(surah))
      const pick =
        withSurah.find(r => String(r.id) === lastId) ??
        withSurah.find(r => /afasy/i.test(r.name)) ??
        withSurah[0] ??
        null
      setPicked(pick)
    }).catch(() => {})
    return () => {
      active = false
    }
  }, [given, surah])

  // Already on the phone?
  useEffect(() => {
    if (!reciter) return
    let active = true
    void downloadedSurahUri(reciter.id, surah).then(uri => active && setSaved(Boolean(uri)))
    return () => {
      active = false
    }
    // Only when the reciter or surah really changes (the player passes a new object often).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reciter?.id, surah])

  if (!reciter) return null
  const title = `${surah}. ${getSurahMeta(surah)?.englishName ?? ""}`
  const downloading = progress !== null

  const start = async () => {
    setProgress(0)
    const ok = await downloadSurahAudio(reciter, surah, f => setProgress(f))
    setProgress(null)
    setSaved(ok)
    if (!ok) Alert.alert(t("qdFailTitle"), t("qdFail"))
  }
  const cancel = () => {
    void cancelSurahDownload(reciter.id, surah)
    setProgress(null)
  }
  const remove = () => {
    Alert.alert(t("qdDeleteTitle"), t("qdDelete", { surah: title }), [
      { text: t("pw_notNow"), style: "cancel" },
      {
        text: t("qdDeleteYes"),
        style: "destructive",
        onPress: () => {
          void deleteSurahAudio(reciter.id, surah).then(() => setSaved(false))
        },
      },
    ])
  }

  // ─── Small round button in the player ───
  if (variant === "player") {
    return (
      <TouchableOpacity
        onPress={downloading ? cancel : saved ? remove : start}
        onLongPress={saved ? remove : undefined}
        hitSlop={10}
        accessibilityLabel={saved ? t("qdSaved") : t("qdDownload")}
        style={styles.round}
      >
        {downloading ? (
          <Text style={styles.roundPct}>{Math.round((progress ?? 0) * 100)}%</Text>
        ) : (
          <Ionicons name={saved ? "checkmark-circle" : "cloud-download-outline"} size={22} color={saved ? "#4ADE80" : "#fff"} />
        )}
      </TouchableOpacity>
    )
  }

  // ─── Card at the top of the surah in Read mode ───
  return (
    <View style={[styles.card, { backgroundColor: theme.card, borderColor: saved ? "rgba(74,222,128,0.5)" : theme.border }]}>
      <View style={styles.icon}>
        <Ionicons name={saved ? "checkmark" : "headset"} size={18} color={GOLD} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.title, { color: theme.text }]}>{saved ? t("qdSaved") : t("qdListenOffline")}</Text>
        <Text style={[styles.sub, { color: theme.textSecondary }]} numberOfLines={1}>
          {downloading ? t("qdDownloading", { pct: Math.round((progress ?? 0) * 100) }) : reciter.name}
        </Text>
        {downloading ? (
          <View style={styles.track}>
            <View style={[styles.fill, { width: `${Math.round((progress ?? 0) * 100)}%` }]} />
          </View>
        ) : null}
      </View>
      {downloading ? (
        <TouchableOpacity onPress={cancel} hitSlop={8} accessibilityLabel={t("qdCancel")}>
          <Ionicons name="close-circle" size={26} color={theme.textSecondary} />
        </TouchableOpacity>
      ) : saved ? (
        <TouchableOpacity onPress={() => void playSurah(reciter, surah, title)} onLongPress={remove} style={styles.btn}>
          <Ionicons name="play" size={14} color={NAVY} />
          <Text style={styles.btnText}>{t("qdPlay")}</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity onPress={start} style={styles.btn}>
          {progress === 0 ? <ActivityIndicator size="small" color={NAVY} /> : <Ionicons name="cloud-download-outline" size={15} color={NAVY} />}
          <Text style={styles.btnText}>{t("qdDownload")}</Text>
        </TouchableOpacity>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  card: { flexDirection: "row", alignItems: "center", gap: 12, borderRadius: 16, borderWidth: 0.5, padding: 12, marginBottom: 12 },
  icon: { width: 36, height: 36, borderRadius: 18, backgroundColor: NAVY, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 14, fontWeight: "800" },
  sub: { fontSize: 12, marginTop: 2 },
  track: { height: 4, borderRadius: 999, backgroundColor: "rgba(201,168,76,0.2)", marginTop: 6, overflow: "hidden" },
  fill: { height: "100%", backgroundColor: GOLD },
  btn: { flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: GOLD, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 7 },
  btnText: { color: NAVY, fontSize: 13, fontWeight: "800" },
  round: { width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(255,255,255,0.15)", alignItems: "center", justifyContent: "center" },
  roundPct: { color: "#fff", fontSize: 11, fontWeight: "800" },
})
