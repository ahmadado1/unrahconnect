import { useTheme } from "@/context/themeContext"
import { Ionicons } from "@expo/vector-icons"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { Pressable, StyleSheet, Text, View } from "react-native"
import Animated, { FadeInDown } from "react-native-reanimated"

const YAMANI_ARABIC =
  "رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ"
const YAMANI_TRANSLIT =
  "Rabbana atina fid-dunya hasanatan wa fil-akhirati hasanatan wa qina adhaban-nar"

export default function YamaniDuaExpander() {
  const { theme } = useTheme()
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const [playing, setPlaying] = useState(false)

  return (
    <View style={styles.wrap}>
      <Pressable
        onPress={() => setOpen((v) => !v)}
        style={({ pressed }) => [
          styles.btn,
          { borderColor: theme.border, backgroundColor: theme.background },
          pressed && { opacity: 0.8 },
        ]}
      >
        <Ionicons name="book-outline" size={16} color="#C9A84C" />
        <Text style={styles.btnText}>{t("tawafShowDua")}</Text>
        <Ionicons name={open ? "chevron-up" : "chevron-down"} size={16} color="#C9A84C" />
      </Pressable>

      {open ? (
        <Animated.View
          entering={FadeInDown.duration(350)}
          style={[styles.panel, { backgroundColor: theme.background, borderColor: theme.border }]}
        >
          <Text style={[styles.arabic, { color: theme.text }]}>{YAMANI_ARABIC}</Text>
          <Text style={styles.translit}>{YAMANI_TRANSLIT}</Text>
          <Text style={[styles.translation, { color: theme.textSecondary }]}>
            {t("phaseUmrah4Dua2Translation")}
          </Text>
          <Pressable
            onPress={() => setPlaying((p) => !p)}
            style={({ pressed }) => [styles.playBtn, pressed && { opacity: 0.8 }]}
          >
            <Ionicons
              name={playing ? "pause-circle" : "play-circle"}
              size={22}
              color="#C9A84C"
            />
            <Text style={styles.playText}>
              {playing ? t("tawafAudioPlaying") : t("tawafPlayAudio")}
            </Text>
          </Pressable>
        </Animated.View>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: { gap: 8, marginTop: 2 },
  btn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 0.5,
  },
  btnText: { flex: 1, fontSize: 13, fontWeight: "600", color: "#C9A84C" },
  panel: { borderRadius: 12, borderWidth: 0.5, padding: 14, gap: 10 },
  arabic: { fontSize: 20, textAlign: "right", lineHeight: 34 },
  translit: { fontSize: 13, color: "#C9A84C", fontStyle: "italic", lineHeight: 20 },
  translation: { fontSize: 13, lineHeight: 20 },
  playBtn: { flexDirection: "row", alignItems: "center", gap: 8, alignSelf: "flex-start", marginTop: 4 },
  playText: { fontSize: 13, fontWeight: "600", color: "#C9A84C" },
})
