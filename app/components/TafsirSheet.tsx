// Tafsir of one verse, in a sheet that slides up from the bottom.
// Shows the user's chosen tafsir for their language, with chips to switch to another trusted one.
import TouchableOpacity from "@/app/components/AppPressable"
import { useTheme } from "@/context/themeContext"
import { chosenTafsir, getTafsir, saveTafsirChoice, tafsirsFor, type TafsirEdition, type TafsirResult } from "@/lib/tafsir"
import { Ionicons } from "@expo/vector-icons"
import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"

const NAVY = "#1E3A5F"
const GOLD = "#C9A84C"

type Props = {
  visible: boolean
  surah: number
  ayah: number
  surahName: string
  onClose: () => void
}

export default function TafsirSheet({ visible, surah, ayah, surahName, onClose }: Props) {
  const { theme } = useTheme()
  const { t, i18n } = useTranslation()
  const insets = useSafeAreaInsets()
  const editions = tafsirsFor(i18n.language)
  const [edition, setEdition] = useState<TafsirEdition | null>(null)
  const [result, setResult] = useState<TafsirResult | null>(null)
  const [state, setState] = useState<"loading" | "ready" | "error">("loading")

  // Which tafsir: the one picked before for this language.
  useEffect(() => {
    if (!visible) return
    let active = true
    void chosenTafsir(i18n.language).then(e => active && setEdition(e))
    return () => {
      active = false
    }
  }, [visible, i18n.language])

  // Load the text (from the phone if saved, else from the internet).
  useEffect(() => {
    if (!visible || !edition) return
    let active = true
    const load = async () => {
      setState("loading")
      const res = await getTafsir(edition, surah, ayah).catch(() => null)
      if (!active) return
      setResult(res)
      setState(res ? "ready" : "error")
    }
    void load()
    return () => {
      active = false
    }
  }, [visible, edition, surah, ayah])

  const pick = (e: TafsirEdition) => {
    setEdition(e)
    void saveTafsirChoice(i18n.language, e.slug)
  }

  const rtl = /^(ar|ur)/.test(i18n.language)

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={[styles.sheet, { backgroundColor: theme.background, paddingBottom: insets.bottom + 16 }]}>
        <View style={styles.handle} />
        <View style={styles.head}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.title, { color: theme.text }]}>{t("tafsirTitle")}</Text>
            <Text style={styles.sub}>
              {surahName} · {surah}:{ayah}
            </Text>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.close} accessibilityLabel={t("close", { defaultValue: "Close" })}>
            <Ionicons name="close" size={20} color={NAVY} />
          </TouchableOpacity>
        </View>

        {editions.length > 1 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.chipsRow}
            contentContainerStyle={styles.chips}
          >
            {editions.map(e => {
              const on = e.slug === edition?.slug
              return (
                <TouchableOpacity key={e.slug} onPress={() => pick(e)} style={[styles.chip, { borderColor: GOLD }, on && styles.chipOn]}>
                  <Text style={[styles.chipText, { color: on ? NAVY : theme.text }]} numberOfLines={1}>
                    {e.name}
                  </Text>
                </TouchableOpacity>
              )
            })}
          </ScrollView>
        ) : null}

        <ScrollView style={styles.body} contentContainerStyle={{ paddingBottom: 12 }}>
          {state === "loading" ? (
            <View style={styles.center}>
              <ActivityIndicator color={GOLD} />
              <Text style={[styles.muted, { color: theme.textSecondary }]}>{t("tafsirLoading")}</Text>
            </View>
          ) : state === "error" || !result ? (
            <View style={styles.center}>
              <Ionicons name="cloud-offline-outline" size={28} color={theme.textSecondary} />
              <Text style={[styles.muted, { color: theme.textSecondary }]}>{t("tafsirError")}</Text>
            </View>
          ) : (
            <>
              {result.fromAyah !== ayah ? (
                <Text style={styles.group}>{t("tafsirGroup", { from: result.fromAyah })}</Text>
              ) : null}
              <Text style={[styles.text, { color: theme.text, textAlign: rtl ? "right" : "left", writingDirection: rtl ? "rtl" : "ltr" }]}>
                {result.text}
              </Text>
              <Text style={[styles.source, { color: theme.textSecondary }]}>
                {t("tafsirSource", { name: result.edition.name, author: result.edition.author })}
              </Text>
            </>
          )}
        </ScrollView>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.35)" },
  sheet: { maxHeight: "80%", borderTopLeftRadius: 22, borderTopRightRadius: 22, paddingHorizontal: 18, paddingTop: 8 },
  handle: { alignSelf: "center", width: 40, height: 4, borderRadius: 2, backgroundColor: "rgba(0,0,0,0.15)", marginBottom: 10 },
  head: { flexDirection: "row", alignItems: "center", gap: 10 },
  title: { fontSize: 18, fontWeight: "800" },
  sub: { color: GOLD, fontSize: 13, fontWeight: "700", marginTop: 2 },
  close: { backgroundColor: "rgba(201,168,76,0.2)", borderRadius: 18, padding: 6 },
  // flexGrow 0: the row keeps its own height (otherwise the sheet squeezes it and cuts the names).
  chipsRow: { flexGrow: 0, flexShrink: 0 },
  chips: { gap: 8, paddingVertical: 12, alignItems: "center" },
  chip: { borderWidth: 1.2, borderRadius: 999, paddingHorizontal: 16, minHeight: 36, justifyContent: "center" },
  chipOn: { backgroundColor: GOLD },
  chipText: { fontSize: 14, fontWeight: "700", lineHeight: 20 },
  body: { marginTop: 4 },
  center: { alignItems: "center", gap: 10, paddingVertical: 30 },
  muted: { fontSize: 14, textAlign: "center", lineHeight: 20 },
  group: { color: GOLD, fontSize: 13, fontWeight: "700", marginBottom: 8 },
  text: { fontSize: 17, lineHeight: 28 },
  source: { fontSize: 12, marginTop: 16, lineHeight: 18 },
})
