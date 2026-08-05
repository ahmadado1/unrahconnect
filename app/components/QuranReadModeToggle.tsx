import type { QuranReadMode } from "@/lib/quranReadMode"
import { Ionicons } from "@expo/vector-icons"
import { StyleSheet, Text, TouchableOpacity, View } from "react-native"

const GOLD = "#C9A84C"

type Props = {
  mode: QuranReadMode
  onToggle: () => void
}

/** Compact header control showing current Quran read mode; one tap switches. */
export default function QuranReadModeToggle({ mode, onToggle }: Props) {
  const isArabicOnly = mode === "arabic_only"

  return (
    <TouchableOpacity
      style={styles.btn}
      onPress={onToggle}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityLabel={
        isArabicOnly ? "Arabic only. Tap for translation." : "Arabic with translation. Tap for Arabic only."
      }
    >
      <Ionicons name={isArabicOnly ? "text" : "globe-outline"} size={18} color={GOLD} />
      <View style={styles.badge}>
        <Text style={styles.badgeText}>{isArabicOnly ? "AR" : "AR+"}</Text>
      </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  btn: {
    backgroundColor: "rgba(201,168,76,0.15)",
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 44,
    gap: 2,
  },
  badge: {
    backgroundColor: "rgba(201,168,76,0.2)",
    borderRadius: 6,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  badgeText: {
    color: GOLD,
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.4,
  },
})
