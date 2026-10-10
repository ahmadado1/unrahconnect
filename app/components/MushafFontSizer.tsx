import { useTranslation } from "react-i18next"
import { StyleSheet, Text, TouchableOpacity, View } from "react-native"

export default function MushafFontSizer({
  onDecrease,
  onIncrease,
  canDecrease,
  canIncrease,
}: {
  onDecrease: () => void
  onIncrease: () => void
  canDecrease: boolean
  canIncrease: boolean
}) {
  const { t } = useTranslation()

  return (
    <View style={styles.group}>
      <TouchableOpacity
        onPress={onDecrease}
        disabled={!canDecrease}
        style={styles.btn}
        accessibilityLabel={t("quranSmallerText")}
        hitSlop={6}
      >
        <Text style={[styles.label, !canDecrease && styles.disabled]}>−</Text>
      </TouchableOpacity>
      <Text style={styles.mark}>أ</Text>
      <TouchableOpacity
        onPress={onIncrease}
        disabled={!canIncrease}
        style={styles.btn}
        accessibilityLabel={t("quranLargerText")}
        hitSlop={6}
      >
        <Text style={[styles.label, !canIncrease && styles.disabled]}>+</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  group: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(201,168,76,0.15)",
    borderWidth: 1,
    borderColor: "#C9A84C",
    borderRadius: 8,
  },
  btn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  label: {
    color: "#C9A84C",
    fontSize: 16,
    fontWeight: "700",
    minWidth: 12,
    textAlign: "center",
  },
  mark: {
    color: "#C9A84C",
    fontSize: 15,
    fontWeight: "700",
  },
  disabled: {
    opacity: 0.35,
  },
})
