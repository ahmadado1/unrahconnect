import { Ionicons } from "@expo/vector-icons"
import { Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native"
import { useTranslation } from "react-i18next"
import type { QuranReadMode } from "@/lib/quranReadMode"

const NAVY = "#1E3A5F"
const GOLD = "#C9A84C"

type Props = {
  visible: boolean
  onSelect: (mode: QuranReadMode) => void
}

export default function QuranReadModeModal({ visible, onSelect }: Props) {
  const { t } = useTranslation()

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.iconWrap}>
            <Ionicons name="book" size={28} color={GOLD} />
          </View>
          <Text style={styles.title}>{t("quranReadModeTitle")}</Text>
          <Text style={styles.subtitle}>{t("quranReadModeSubtitle")}</Text>

          <TouchableOpacity
            style={styles.option}
            activeOpacity={0.85}
            onPress={() => onSelect("arabic_only")}
          >
            <View style={styles.optionIcon}>
              <Ionicons name="text" size={24} color={GOLD} />
            </View>
            <View style={styles.optionText}>
              <Text style={styles.optionTitle}>{t("quranReadModeArabicOnly")}</Text>
              <Text style={styles.optionDesc}>{t("quranReadModeArabicOnlyDesc")}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={GOLD} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.option}
            activeOpacity={0.85}
            onPress={() => onSelect("with_translation")}
          >
            <View style={styles.optionIcon}>
              <Ionicons name="globe-outline" size={24} color={GOLD} />
            </View>
            <View style={styles.optionText}>
              <Text style={styles.optionTitle}>{t("quranReadModeWithTranslation")}</Text>
              <Text style={styles.optionDesc}>{t("quranReadModeWithTranslationDesc")}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={GOLD} />
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.72)",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: "rgba(201,168,76,0.35)",
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: "rgba(201,168,76,0.12)",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    marginBottom: 16,
  },
  title: {
    color: NAVY,
    fontSize: 22,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    color: "rgba(30,58,95,0.7)",
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
    marginBottom: 22,
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "rgba(30,58,95,0.04)",
    borderWidth: 1.5,
    borderColor: NAVY,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  optionIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: NAVY,
    alignItems: "center",
    justifyContent: "center",
  },
  optionText: { flex: 1 },
  optionTitle: {
    color: NAVY,
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 4,
  },
  optionDesc: {
    color: "rgba(30,58,95,0.65)",
    fontSize: 13,
    lineHeight: 18,
  },
})
