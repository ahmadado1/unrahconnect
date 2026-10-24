// Dhikr counter page. Opened from "Today's Dhikr" on Home and from the Friday Salawat reminder.
// Pick a goal (10, 33, 100 or no limit), tap the big circle to count. Saved for today on the phone.
import TouchableOpacity from "@/app/components/AppPressable"
import { useTheme } from "@/context/themeContext"
import { DHIKR_LIST, dhikrById, dhikrForToday, type Dhikr } from "@/lib/dhikrList"
import { Ionicons } from "@expo/vector-icons"
import AsyncStorage from "@react-native-async-storage/async-storage"
import * as Haptics from "expo-haptics"
import { useLocalSearchParams, useRouter } from "expo-router"
import { StatusBar } from "expo-status-bar"
import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { Animated, Pressable, ScrollView, StyleSheet, Text, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"

const NAVY = "#1E3A5F"
const GOLD = "#C9A84C"
const GOALS = [10, 33, 100, 0] // 0 = no limit
const todayKey = () => new Date().toDateString()

export default function DhikrScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { theme } = useTheme()
  const { t } = useTranslation()
  const params = useLocalSearchParams<{ id?: string }>()
  const [dhikr, setDhikr] = useState<Dhikr>(() => dhikrById(params.id) ?? dhikrForToday())
  const [goal, setGoal] = useState(33)
  const [count, setCount] = useState(0)
  const [pulse] = useState(() => new Animated.Value(1))
  const storageKey = `dhikr_count_${dhikr.id}`

  // Load today's count for this dhikr (it starts again from 0 each day).
  useEffect(() => {
    let active = true
    AsyncStorage.getItem(storageKey)
      .then(raw => {
        if (!active) return
        const saved = raw ? (JSON.parse(raw) as { day: string; count: number; goal: number }) : null
        setCount(saved && saved.day === todayKey() ? saved.count : 0)
        if (saved?.goal !== undefined) setGoal(saved.goal)
      })
      .catch(() => {})
    return () => {
      active = false
    }
  }, [storageKey])

  const save = (nextCount: number, nextGoal = goal) => {
    void AsyncStorage.setItem(storageKey, JSON.stringify({ day: todayKey(), count: nextCount, goal: nextGoal })).catch(() => {})
  }

  const reachedGoal = goal > 0 && count >= goal

  const tap = () => {
    const next = count + 1
    setCount(next)
    save(next)
    // Little bounce on every tap, a stronger buzz when the goal is reached.
    Animated.sequence([
      Animated.timing(pulse, { toValue: 0.94, duration: 70, useNativeDriver: true }),
      Animated.timing(pulse, { toValue: 1, duration: 110, useNativeDriver: true }),
    ]).start()
    if (goal > 0 && next === goal) void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    else void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
  }

  const reset = () => {
    setCount(0)
    save(0)
  }

  const chooseGoal = (g: number) => {
    setGoal(g)
    save(count, g)
  }

  const percent = goal > 0 ? Math.min(100, (count / goal) * 100) : 0

  return (
    <View style={[styles.screen, { backgroundColor: theme.background }]}>
      <StatusBar style="light" />
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={22} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t("dk_title")}</Text>
          <TouchableOpacity onPress={reset} style={styles.backBtn} accessibilityLabel={t("dk_reset")}>
            <Ionicons name="refresh" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
        <Text style={styles.arabic}>{dhikr.arabic}</Text>
        <Text style={styles.translit}>{dhikr.translit}</Text>
        <Text style={styles.meaning}>{dhikr.meaning}</Text>
      </View>

      <ScrollView keyboardDismissMode="on-drag" keyboardShouldPersistTaps="handled" contentContainerStyle={{ alignItems: "center", paddingBottom: insets.bottom + 30 }}>
        {/* Goal */}
        <View style={styles.goals}>
          {GOALS.map(g => {
            const on = g === goal
            return (
              <TouchableOpacity key={g} onPress={() => chooseGoal(g)} style={[styles.goalChip, { borderColor: GOLD }, on && styles.goalOn]}>
                <Text style={[styles.goalText, { color: on ? NAVY : theme.text }]}>{g === 0 ? "∞" : `${g}×`}</Text>
              </TouchableOpacity>
            )
          })}
        </View>

        {/* Big tap circle */}
        <Pressable onPress={tap} accessibilityRole="button" accessibilityLabel={t("dk_tap")}>
          <Animated.View style={[styles.circle, reachedGoal && styles.circleDone, { transform: [{ scale: pulse }] }]}>
            <Text style={styles.count}>{count}</Text>
            <Text style={styles.countSub}>{goal > 0 ? t("dk_of", { goal }) : t("dk_tap")}</Text>
            {reachedGoal ? <Ionicons name="checkmark-circle" size={28} color="#4ADE80" style={{ marginTop: 6 }} /> : null}
          </Animated.View>
        </Pressable>

        {goal > 0 ? (
          <View style={styles.track}>
            <View style={[styles.fill, { width: `${percent}%` }]} />
          </View>
        ) : null}
        {reachedGoal ? <Text style={[styles.doneText, { color: theme.text }]}>{t("dk_done")}</Text> : null}

        {/* Other dhikr */}
        <Text style={[styles.otherLabel, { color: theme.textSecondary }]}>{t("dk_other")}</Text>
        <View style={styles.otherWrap}>
          {DHIKR_LIST.map(d => {
            const on = d.id === dhikr.id
            return (
              <TouchableOpacity
                key={d.id}
                onPress={() => setDhikr(d)}
                style={[styles.otherChip, { backgroundColor: theme.card, borderColor: on ? GOLD : theme.border }]}
              >
                <Text style={[styles.otherArabic, { color: theme.text }]} numberOfLines={1}>{d.arabic}</Text>
              </TouchableOpacity>
            )
          })}
        </View>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: { backgroundColor: NAVY, paddingHorizontal: 16, paddingBottom: 22, borderBottomLeftRadius: 24, borderBottomRightRadius: 24, alignItems: "center" },
  headerRow: { flexDirection: "row", alignItems: "center", alignSelf: "stretch", justifyContent: "space-between" },
  backBtn: { backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 20, padding: 6 },
  headerTitle: { color: "#fff", fontSize: 17, fontWeight: "bold" },
  arabic: { color: GOLD, fontSize: 30, marginTop: 18, textAlign: "center", lineHeight: 52 },
  translit: { color: "#fff", fontSize: 14, fontStyle: "italic", marginTop: 4, textAlign: "center" },
  meaning: { color: "rgba(255,255,255,0.7)", fontSize: 12, marginTop: 4, textAlign: "center" },
  goals: { flexDirection: "row", gap: 10, marginTop: 22 },
  goalChip: { borderWidth: 1.2, borderRadius: 999, paddingHorizontal: 16, paddingVertical: 7 },
  goalOn: { backgroundColor: GOLD },
  goalText: { fontSize: 14, fontWeight: "800" },
  circle: { width: 230, height: 230, borderRadius: 115, backgroundColor: NAVY, borderWidth: 4, borderColor: GOLD, alignItems: "center", justifyContent: "center", marginTop: 28, shadowColor: "#000", shadowOpacity: 0.2, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 8 },
  circleDone: { borderColor: "#4ADE80" },
  count: { color: "#fff", fontSize: 64, fontWeight: "800" },
  countSub: { color: "#E8D5A3", fontSize: 13, marginTop: 2 },
  track: { width: 230, height: 6, borderRadius: 999, backgroundColor: "rgba(201,168,76,0.2)", marginTop: 18, overflow: "hidden" },
  fill: { height: "100%", backgroundColor: GOLD },
  doneText: { marginTop: 10, fontSize: 14, fontWeight: "700" },
  otherLabel: { marginTop: 30, fontSize: 12, fontWeight: "800", letterSpacing: 0.6, textTransform: "uppercase" },
  otherWrap: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: 8, paddingHorizontal: 16, marginTop: 10 },
  otherChip: { borderWidth: 1, borderRadius: 14, paddingHorizontal: 12, paddingVertical: 8, maxWidth: "47%" },
  otherArabic: { fontSize: 15 },
})
