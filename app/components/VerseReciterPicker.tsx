// Bottom sheet to choose the verse-by-verse reciter. A few are free, the rest are Premium ⭐.
import TouchableOpacity from "@/app/components/AppPressable"
import { useTheme } from "@/context/themeContext"
import { usePremium } from "@/lib/premium"
import { VERSE_RECITERS, type VerseReciter } from "@/lib/quranAudio"
import { Ionicons } from "@expo/vector-icons"
import { useTranslation } from "react-i18next"
import { Alert, Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"

const NAVY = "#1E3A5F"
const GOLD = "#C9A84C"

export default function VerseReciterPicker({
  visible,
  selectedId,
  onSelect,
  onClose,
}: {
  visible: boolean
  selectedId: string
  onSelect: (reciter: VerseReciter) => void
  onClose: () => void
}) {
  const { theme } = useTheme()
  const { t } = useTranslation()
  const insets = useSafeAreaInsets()
  const { isPremium } = usePremium()

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={[styles.sheet, { backgroundColor: theme.card, paddingBottom: insets.bottom + 16 }]}>
        <View style={styles.handle} />
        <Text style={[styles.title, { color: theme.text }]}>{t("qaChooseReciter")}</Text>
        <ScrollView style={{ maxHeight: 460 }} showsVerticalScrollIndicator={false}>
          {VERSE_RECITERS.map(reciter => {
            const locked = !reciter.free && !isPremium
            const selected = reciter.id === selectedId
            return (
              <TouchableOpacity
                key={reciter.id}
                style={[styles.row, { borderColor: selected ? GOLD : theme.border }, selected && styles.rowSelected]}
                onPress={() => {
                  if (locked) {
                    Alert.alert(t("premiumFeature"), t("premiumFeatureBody"))
                    return
                  }
                  onSelect(reciter)
                }}
              >
                <View style={[styles.avatar, locked && { opacity: 0.6 }]}>
                  <Ionicons name="mic" size={16} color={GOLD} />
                </View>
                <Text style={[styles.name, { color: theme.text }, locked && { opacity: 0.6 }]}>{reciter.name}</Text>
                {!reciter.free ? (
                  <View style={styles.pro}>
                    <Ionicons name="star" size={9} color={NAVY} />
                    <Text style={styles.proText}>{t("premiumBadge").toUpperCase()}</Text>
                  </View>
                ) : null}
                <Ionicons
                  name={selected ? "checkmark-circle" : locked ? "lock-closed" : "ellipse-outline"}
                  size={20}
                  color={selected || locked ? GOLD : theme.textSecondary}
                />
              </TouchableOpacity>
            )
          })}
        </ScrollView>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)" },
  sheet: { borderTopLeftRadius: 22, borderTopRightRadius: 22, padding: 16 },
  handle: { alignSelf: "center", width: 40, height: 4, borderRadius: 2, backgroundColor: "rgba(128,128,128,0.4)", marginBottom: 12 },
  title: { fontSize: 17, fontWeight: "bold", marginBottom: 12 },
  row: { flexDirection: "row", alignItems: "center", gap: 10, padding: 12, borderRadius: 14, borderWidth: 0.5, marginBottom: 8 },
  rowSelected: { borderWidth: 1.5, backgroundColor: "rgba(201,168,76,0.08)" },
  avatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: NAVY, alignItems: "center", justifyContent: "center" },
  name: { flex: 1, fontSize: 14, fontWeight: "600" },
  pro: { flexDirection: "row", alignItems: "center", gap: 3, backgroundColor: GOLD, borderRadius: 999, paddingHorizontal: 6, paddingVertical: 1 },
  proText: { color: NAVY, fontSize: 9, fontWeight: "800" },
})
