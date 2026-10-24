// "About this surah" sheet: the basics (always, offline) + background and themes (Quran.com).
import TouchableOpacity from "@/app/components/AppPressable"
import { useTheme } from "@/context/themeContext"
import { getSurahMeta } from "@/lib/quranSurahMeta"
import { getSurahInfo, type SurahInfo } from "@/lib/surahInfo"
import { Ionicons } from "@expo/vector-icons"
import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"

const NAVY = "#1E3A5F"
const GOLD = "#C9A84C"

type Props = { visible: boolean; surah: number; onClose: () => void }

export default function SurahInfoSheet({ visible, surah, onClose }: Props) {
  const { theme } = useTheme()
  const { t, i18n } = useTranslation()
  const insets = useSafeAreaInsets()
  const meta = getSurahMeta(surah)
  const [info, setInfo] = useState<SurahInfo | null>(null)
  const [state, setState] = useState<"loading" | "ready" | "none">("loading")

  useEffect(() => {
    if (!visible) return
    let active = true
    const load = async () => {
      setState("loading")
      const res = await getSurahInfo(surah, i18n.language)
      if (!active) return
      setInfo(res)
      setState(res ? "ready" : "none")
    }
    void load()
    return () => {
      active = false
    }
  }, [visible, surah, i18n.language])

  const rtl = /^(ar|ur)/.test(i18n.language)
  const align = { textAlign: rtl ? ("right" as const) : ("left" as const), writingDirection: rtl ? ("rtl" as const) : ("ltr" as const) }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={[styles.sheet, { backgroundColor: theme.background, paddingBottom: insets.bottom + 16 }]}>
        <View style={styles.handle} />
        <View style={styles.head}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.title, { color: theme.text }]}>{t("surahInfoTitle")}</Text>
            <Text style={styles.sub}>
              {surah}. {meta?.englishName} · {meta?.arabicName}
            </Text>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.close} accessibilityLabel={t("close", { defaultValue: "Close" })}>
            <Ionicons name="close" size={20} color={NAVY} />
          </TouchableOpacity>
        </View>

        {/* Basics: always available, even offline */}
        <View style={styles.facts}>
          <View style={[styles.fact, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Text style={styles.factValue}>{meta?.ayahCount ?? "?"}</Text>
            <Text style={[styles.factLabel, { color: theme.textSecondary }]}>{t("surahInfoVerses")}</Text>
          </View>
          <View style={[styles.fact, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Text style={styles.factValue}>{meta?.revelationType === "Medinan" ? t("surahInfoMadinah") : t("surahInfoMakkah")}</Text>
            <Text style={[styles.factLabel, { color: theme.textSecondary }]}>{t("surahInfoRevealed")}</Text>
          </View>
          <View style={[styles.fact, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Text style={styles.factValue}>{surah}</Text>
            <Text style={[styles.factLabel, { color: theme.textSecondary }]}>{t("surahInfoNumber")}</Text>
          </View>
        </View>

        <ScrollView keyboardDismissMode="on-drag" keyboardShouldPersistTaps="handled" style={{ marginTop: 6 }} contentContainerStyle={{ paddingBottom: 12 }}>
          {state === "loading" ? (
            <View style={styles.center}>
              <ActivityIndicator color={GOLD} />
            </View>
          ) : state === "none" || !info ? (
            <Text style={[styles.muted, { color: theme.textSecondary }]}>{t("surahInfoOffline")}</Text>
          ) : (
            <>
              {info.blocks.map((b, i) =>
                b.kind === "heading" ? (
                  <Text key={i} style={[styles.heading, { color: theme.text }, align]}>{b.text}</Text>
                ) : (
                  <Text key={i} style={[styles.text, { color: theme.text }, align]}>{b.text}</Text>
                )
              )}
              {info.source ? (
                <Text style={[styles.source, { color: theme.textSecondary }]}>{t("surahInfoSource", { source: info.source })}</Text>
              ) : null}
            </>
          )}
        </ScrollView>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.35)" },
  sheet: { maxHeight: "85%", borderTopLeftRadius: 22, borderTopRightRadius: 22, paddingHorizontal: 18, paddingTop: 8 },
  handle: { alignSelf: "center", width: 40, height: 4, borderRadius: 2, backgroundColor: "rgba(0,0,0,0.15)", marginBottom: 10 },
  head: { flexDirection: "row", alignItems: "center", gap: 10 },
  title: { fontSize: 18, fontWeight: "800" },
  sub: { color: GOLD, fontSize: 13, fontWeight: "700", marginTop: 2 },
  close: { backgroundColor: "rgba(201,168,76,0.2)", borderRadius: 18, padding: 6 },
  facts: { flexDirection: "row", gap: 8, marginTop: 14 },
  fact: { flex: 1, borderRadius: 14, borderWidth: 0.5, paddingVertical: 10, alignItems: "center" },
  factValue: { color: GOLD, fontSize: 16, fontWeight: "800" },
  factLabel: { fontSize: 11, marginTop: 2, textAlign: "center" },
  center: { alignItems: "center", paddingVertical: 30 },
  muted: { fontSize: 14, lineHeight: 20, textAlign: "center", paddingVertical: 20 },
  heading: { fontSize: 16, fontWeight: "800", marginTop: 14, marginBottom: 4 },
  text: { fontSize: 16, lineHeight: 26 },
  source: { fontSize: 12, marginTop: 16 },
})
