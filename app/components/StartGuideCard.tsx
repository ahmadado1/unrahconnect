// Home card for the "Getting started" guide. Shows progress; hides itself when every step is done
// or when the user taps ✕ (the guide stays in Me → App guide).
import TouchableOpacity from "@/app/components/AppPressable"
import { useTheme } from "@/context/themeContext"
import { GUIDE_STEP_COUNT, isGuideHiddenOnHome, loadGuideDone, setGuideHiddenOnHome } from "@/lib/startGuide"
import { Ionicons } from "@expo/vector-icons"
import { useFocusEffect, useRouter } from "expo-router"
import { useCallback, useState } from "react"
import { useTranslation } from "react-i18next"
import { StyleSheet, Text, View } from "react-native"

const NAVY = "#1E3A5F"
const GOLD = "#C9A84C"

export default function StartGuideCard() {
  const router = useRouter()
  const { theme } = useTheme()
  const { t } = useTranslation()
  const [doneCount, setDoneCount] = useState<number | null>(null)
  const [hidden, setHidden] = useState(true)

  useFocusEffect(
    useCallback(() => {
      let active = true
      Promise.all([loadGuideDone(), isGuideHiddenOnHome()]).then(([done, isHidden]) => {
        if (!active) return
        setDoneCount(done.size)
        setHidden(isHidden)
      })
      return () => {
        active = false
      }
    }, [])
  )

  if (hidden || doneCount === null || doneCount >= GUIDE_STEP_COUNT) return null
  const percent = Math.round((doneCount / GUIDE_STEP_COUNT) * 100)

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: theme.card, borderColor: GOLD }]}
      onPress={() => router.push("/start-guide" as any)}
    >
      <View style={styles.icon}>
        <Ionicons name="map" size={20} color={GOLD} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.title, { color: theme.text }]}>{t("sgCardTitle")}</Text>
        <Text style={[styles.body, { color: theme.textSecondary }]}>
          {doneCount === 0 ? t("sgCardBodyNew") : t("sgProgress", { done: doneCount, total: GUIDE_STEP_COUNT })}
        </Text>
        <View style={styles.track}>
          <View style={[styles.fill, { width: `${Math.max(percent, 4)}%` }]} />
        </View>
      </View>
      <TouchableOpacity
        hitSlop={10}
        onPress={() => {
          setHidden(true)
          void setGuideHiddenOnHome(true)
        }}
        accessibilityLabel={t("sgHide")}
      >
        <Ionicons name="close" size={18} color={theme.textSecondary} />
      </TouchableOpacity>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  card: { marginHorizontal: 16, marginTop: 14, borderRadius: 16, padding: 14, flexDirection: "row", alignItems: "center", gap: 12, borderWidth: 1.2 },
  icon: { width: 40, height: 40, borderRadius: 20, backgroundColor: NAVY, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 15, fontWeight: "bold" },
  body: { fontSize: 12, marginTop: 2 },
  track: { height: 5, borderRadius: 999, backgroundColor: "rgba(201,168,76,0.2)", marginTop: 8, overflow: "hidden" },
  fill: { height: "100%", backgroundColor: GOLD, borderRadius: 999 },
})
