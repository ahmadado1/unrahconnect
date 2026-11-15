// Checklist chips: tappable for the agency (dashboard), read-only for the pilgrim (agency page).
import TouchableOpacity from "@/app/components/AppPressable"
import { CHECK_ITEMS, type CheckItem } from "@/lib/tripChecklist"
import { Ionicons } from "@expo/vector-icons"
import { useTranslation } from "react-i18next"
import { StyleSheet, Text, View } from "react-native"

const NAVY = "#1E3A5F"
const GREEN = "#2F855A"

export default function TripChecklistChips({
  done,
  onToggle,
  dark,
}: {
  done: Set<CheckItem>
  onToggle?: (item: CheckItem, next: boolean) => void
  dark?: boolean
}) {
  const { t } = useTranslation()
  return (
    <View style={styles.wrap}>
      {CHECK_ITEMS.map(item => {
        const on = done.has(item)
        const chip = (
          <View style={[styles.chip, on ? styles.chipOn : { borderColor: dark ? "rgba(255,255,255,0.3)" : "rgba(30,58,95,0.25)" }]}>
            <Ionicons name={on ? "checkmark-circle" : "ellipse-outline"} size={14} color={on ? "#fff" : dark ? "#fff" : NAVY} />
            <Text style={[styles.text, { color: on ? "#fff" : dark ? "#fff" : NAVY }]}>{t(`chk_${item}`)}</Text>
          </View>
        )
        return onToggle ? (
          <TouchableOpacity key={item} onPress={() => onToggle(item, !on)} accessibilityRole="checkbox" accessibilityState={{ checked: on }}>
            {chip}
          </TouchableOpacity>
        ) : (
          <View key={item}>{chip}</View>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 8 },
  chip: { flexDirection: "row", alignItems: "center", gap: 4, borderWidth: 1, borderRadius: 999, paddingHorizontal: 9, paddingVertical: 5 },
  chipOn: { backgroundColor: GREEN, borderColor: GREEN },
  text: { fontSize: 12, fontWeight: "600" },
})
