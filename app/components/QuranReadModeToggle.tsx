import type { QuranReadMode } from "@/lib/quranReadMode"
import { Ionicons } from "@expo/vector-icons"
import { useTranslation } from "react-i18next"
import { StyleSheet, Text, TouchableOpacity } from "react-native"

const GOLD = "#C9A84C"

type Props = {
  mode: QuranReadMode
  onToggle: () => void
  /** When true, show the destination mode (what tapping will switch to). Default true. */
  showDestination?: boolean
}

/** Header control to switch Mushaf ↔ Verse view. */
export default function QuranReadModeToggle({
  mode,
  onToggle,
  showDestination = true,
}: Props) {
  const { t } = useTranslation()
  // Show the mode you'll switch INTO (clearer than AR+/globe)
  const display: QuranReadMode = showDestination
    ? mode === "mushaf"
      ? "verses"
      : "mushaf"
    : mode

  const isMushaf = display === "mushaf"
  const label = isMushaf ? t("quranReadModeMushafShort") : t("quranReadModeVersesShort")
  const icon = isMushaf ? "book-outline" : "list-outline"

  return (
    <TouchableOpacity
      style={styles.btn}
      onPress={onToggle}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityLabel={
        mode === "mushaf"
          ? "Switch to verse view"
          : "Switch to mushaf view"
      }
    >
      <Ionicons name={icon as any} size={16} color={GOLD} />
      <Text style={styles.label}>{label}</Text>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  btn: {
    backgroundColor: "rgba(201,168,76,0.15)",
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    minHeight: 36,
  },
  label: {
    color: GOLD,
    fontSize: 12,
    fontWeight: "700",
  },
})
