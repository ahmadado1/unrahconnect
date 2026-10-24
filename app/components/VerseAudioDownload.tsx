// "Verse-by-verse audio offline" card in Read mode.
// Saves one small file per verse for the verse reciter you picked (the play button next to
// each verse), so tapping a verse plays with no internet. Long-press "Saved" to delete.
import TouchableOpacity from "@/app/components/AppPressable"
import { useTheme } from "@/context/themeContext"
import type { VerseReciter } from "@/lib/quranAudio"
import {
  cancelSurahVersesDownload,
  deleteSurahVerses,
  downloadSurahVerses,
  isSurahVersesDownloaded,
} from "@/lib/quranAudioDownloads"
import { getSurahMeta } from "@/lib/quranSurahMeta"
import { Ionicons } from "@expo/vector-icons"
import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { Alert, StyleSheet, Text, View } from "react-native"

const NAVY = "#1E3A5F"
const GOLD = "#C9A84C"

type Props = { surah: number; ayahCount: number; reciter: VerseReciter }

export default function VerseAudioDownload({ surah, ayahCount, reciter }: Props) {
  const { theme } = useTheme()
  const { t } = useTranslation()
  // Which reciter + surah is saved (so switching reciter shows "not saved" until checked).
  const key = `${reciter.folder}:${surah}`
  const [savedKey, setSavedKey] = useState<string | null>(null)
  const saved = savedKey === key
  const setSaved = (ok: boolean) => setSavedKey(ok ? key : null)
  const [progress, setProgress] = useState<number | null>(null)

  // Already saved for this reciter?
  useEffect(() => {
    let active = true
    void isSurahVersesDownloaded(reciter.folder, surah).then(ok => active && setSavedKey(ok ? `${reciter.folder}:${surah}` : null))
    return () => {
      active = false
    }
  }, [reciter.folder, surah])

  const downloading = progress !== null
  const pct = Math.round((progress ?? 0) * 100)

  const start = async () => {
    setProgress(0)
    const ok = await downloadSurahVerses(reciter.folder, surah, ayahCount, f => setProgress(f))
    setProgress(null)
    setSaved(ok)
    if (!ok) Alert.alert(t("qdFailTitle"), t("qdFail"))
  }
  const cancel = () => {
    cancelSurahVersesDownload(reciter.folder, surah)
    setProgress(null)
  }
  const remove = () => {
    const title = `${surah}. ${getSurahMeta(surah)?.englishName ?? ""}`
    Alert.alert(t("qdDeleteTitle"), t("qdDelete", { surah: title }), [
      { text: t("pw_notNow"), style: "cancel" },
      {
        text: t("qdDeleteYes"),
        style: "destructive",
        onPress: () => void deleteSurahVerses(reciter.folder, surah, ayahCount).then(() => setSaved(false)),
      },
    ])
  }

  return (
    <View style={[styles.card, { backgroundColor: theme.card, borderColor: saved ? "rgba(74,222,128,0.5)" : theme.border }]}>
      <View style={styles.icon}>
        <Ionicons name={saved ? "checkmark" : "list"} size={18} color={GOLD} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.title, { color: theme.text }]}>{saved ? t("qvSaved") : t("qvListenOffline")}</Text>
        <Text style={[styles.sub, { color: theme.textSecondary }]} numberOfLines={1}>
          {downloading ? t("qdDownloading", { pct }) : reciter.name}
        </Text>
        {downloading ? (
          <View style={styles.track}>
            <View style={[styles.fill, { width: `${pct}%` }]} />
          </View>
        ) : null}
      </View>
      {downloading ? (
        <TouchableOpacity onPress={cancel} hitSlop={8} accessibilityLabel={t("qdCancel")}>
          <Ionicons name="close-circle" size={26} color={theme.textSecondary} />
        </TouchableOpacity>
      ) : saved ? (
        <TouchableOpacity onPress={remove} onLongPress={remove} hitSlop={8} accessibilityLabel={t("qdDeleteTitle")}>
          <Ionicons name="checkmark-circle" size={26} color="#4ADE80" />
        </TouchableOpacity>
      ) : (
        <TouchableOpacity onPress={() => void start()} style={styles.btn}>
          <Ionicons name="cloud-download-outline" size={15} color={NAVY} />
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
})
