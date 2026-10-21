// Menu that opens when you tap a verse number in Mushaf mode.
// Same actions as the verse cards in Read mode: play the verse, tafsir, bookmark, choose the reciter.
import TouchableOpacity from "@/app/components/AppPressable"
import { useTheme } from "@/context/themeContext"
import { Ionicons } from "@expo/vector-icons"
import { useTranslation } from "react-i18next"
import { Modal, Pressable, StyleSheet, Text, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"

const NAVY = "#1E3A5F"
const GOLD = "#C9A84C"

type Props = {
  target: { surah: number; ayah: number; name: string } | null
  isPlayingThis: boolean
  isBookmarked: boolean
  /** Bookmarks are saved per surah screen: only verses of the open surah. */
  canBookmark: boolean
  onClose: () => void
  onPlay: () => void
  onTafsir: () => void
  onBookmark: () => void
  onReciter: () => void
}

export default function MushafVerseMenu({ target, isPlayingThis, isBookmarked, canBookmark, onClose, onPlay, onTafsir, onBookmark, onReciter }: Props) {
  const { theme } = useTheme()
  const { t } = useTranslation()
  const insets = useSafeAreaInsets()

  const Row = ({ icon, label, onPress }: { icon: keyof typeof Ionicons.glyphMap; label: string; onPress: () => void }) => (
    <TouchableOpacity style={[styles.row, { borderColor: theme.border }]} onPress={onPress}>
      <View style={styles.rowIcon}>
        <Ionicons name={icon} size={20} color={GOLD} />
      </View>
      <Text style={[styles.rowText, { color: theme.text }]}>{label}</Text>
    </TouchableOpacity>
  )

  return (
    <Modal visible={target !== null} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={[styles.sheet, { backgroundColor: theme.background, paddingBottom: insets.bottom + 14 }]}>
        <View style={styles.handle} />
        {target ? (
          <>
            <View style={styles.head}>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{target.ayah}</Text>
              </View>
              <Text style={[styles.title, { color: theme.text }]} numberOfLines={1}>
                {target.name ? `${target.name} · ` : ""}
                {target.surah}:{target.ayah}
              </Text>
              <TouchableOpacity onPress={onClose} style={styles.close} accessibilityLabel={t("close")}>
                <Ionicons name="close" size={20} color={NAVY} />
              </TouchableOpacity>
            </View>
            <Row icon={isPlayingThis ? "pause-circle" : "play-circle-outline"} label={t("qaPlayVerse")} onPress={onPlay} />
            <Row icon="book-outline" label={t("tafsirTitle")} onPress={onTafsir} />
            {canBookmark ? (
              <Row icon={isBookmarked ? "bookmark" : "bookmark-outline"} label={t(isBookmarked ? "vmRemoveBookmark" : "vmBookmark")} onPress={onBookmark} />
            ) : null}
            <Row icon="mic-outline" label={t("vmReciter")} onPress={onReciter} />
          </>
        ) : null}
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.35)" },
  sheet: { borderTopLeftRadius: 22, borderTopRightRadius: 22, paddingHorizontal: 18, paddingTop: 8 },
  handle: { alignSelf: "center", width: 40, height: 4, borderRadius: 2, backgroundColor: "rgba(0,0,0,0.15)", marginBottom: 12 },
  head: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 8 },
  badge: { minWidth: 34, height: 34, borderRadius: 17, borderWidth: 1.25, borderColor: "#8B6914", backgroundColor: "#F5EDD6", alignItems: "center", justifyContent: "center", paddingHorizontal: 6 },
  badgeText: { color: "#1A1A1A", fontWeight: "700" },
  title: { flex: 1, fontSize: 17, fontWeight: "800" },
  close: { backgroundColor: "rgba(201,168,76,0.2)", borderRadius: 18, padding: 6 },
  row: { flexDirection: "row", alignItems: "center", gap: 14, paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth },
  rowIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: "rgba(201,168,76,0.15)", alignItems: "center", justifyContent: "center" },
  rowText: { fontSize: 16, fontWeight: "600" },
})
