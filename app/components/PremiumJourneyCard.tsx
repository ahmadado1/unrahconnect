// Home card for Premium users. Takes the place of "Continue My Umrah Journey".
//   • Guide not finished → "UmrahConnect Guide" with progress.
//   • Guide finished     → "Trip Planner" with the countdown and checklist progress.
// Free users keep the normal "Continue My Umrah Journey" card.
import TouchableOpacity from "@/app/components/AppPressable"
import { useTheme } from "@/context/themeContext"
import { GUIDE_STEP_COUNT, loadGuideDone } from "@/lib/startGuide"
import { TRIP_CHECKLIST_COUNT, loadTripPlan, tripStatus, type TripPlan } from "@/lib/tripPlan"
import { Ionicons } from "@expo/vector-icons"
import { LinearGradient } from "expo-linear-gradient"
import { useFocusEffect, useRouter } from "expo-router"
import { useCallback, useState } from "react"
import { useTranslation } from "react-i18next"
import { StyleSheet, Text, View } from "react-native"

const NAVY = "#1E3A5F"
const GOLD = "#C9A84C"

export default function PremiumJourneyCard() {
  const router = useRouter()
  const { theme } = useTheme()
  const { t } = useTranslation()
  const [guideDone, setGuideDone] = useState<number | null>(null)
  const [trip, setTrip] = useState<TripPlan | null>(null)

  useFocusEffect(
    useCallback(() => {
      let active = true
      Promise.all([loadGuideDone(), loadTripPlan()]).then(([done, plan]) => {
        if (!active) return
        setGuideDone(done.size)
        setTrip(plan)
      })
      return () => {
        active = false
      }
    }, [])
  )

  if (guideDone === null || !trip) return null

  const guideFinished = guideDone >= GUIDE_STEP_COUNT

  // ─── Guide (not finished yet) ───
  if (!guideFinished) {
    const percent = Math.round((guideDone / GUIDE_STEP_COUNT) * 100)
    return (
      <TouchableOpacity style={[styles.card, { backgroundColor: theme.card, borderColor: GOLD }]} onPress={() => router.push("/start-guide" as any)} activeOpacity={0.85}>
        <View style={styles.icon}>
          <Ionicons name="map" size={22} color={GOLD} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: theme.text }]}>{t("pj_guideTitle")}</Text>
          <Text style={[styles.body, { color: theme.textSecondary }]}>
            {guideDone === 0 ? t("pj_guideNew") : t("sgProgress", { done: guideDone, total: GUIDE_STEP_COUNT })}
          </Text>
          <View style={styles.track}>
            <View style={[styles.fill, { width: `${Math.max(percent, 4)}%` }]} />
          </View>
          <Text style={styles.unlock}>
            <Ionicons name="lock-open-outline" size={11} color={GOLD} /> {t("pj_guideUnlocks")}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={theme.text} />
      </TouchableOpacity>
    )
  }

  // ─── Trip Planner (after the guide) ───
  const status = tripStatus(trip)
  const headline =
    status.kind === "before"
      ? t("tp_daysToGo", { count: status.days })
      : status.kind === "during"
        ? t("tp_dayOfTrip", { day: status.day })
        : status.kind === "after"
          ? t("tp_welcomeBack")
          : t("pj_planTrip")
  const percent = Math.round((trip.done.length / TRIP_CHECKLIST_COUNT) * 100)

  return (
    <TouchableOpacity onPress={() => router.push("/trip-planner" as any)} activeOpacity={0.9} style={styles.tripOuter}>
      <LinearGradient colors={[NAVY, "#2A4F7F"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.tripCard}>
        <View style={styles.tripTop}>
          <Text style={styles.tripLabel}>{t("tp_title").toUpperCase()}</Text>
          <Ionicons name="chevron-forward" size={18} color="#fff" />
        </View>
        <Text style={styles.tripHeadline}>{headline}</Text>
        <Text style={styles.tripSub}>{t("tp_progress", { done: trip.done.length, total: TRIP_CHECKLIST_COUNT })}</Text>
        <View style={[styles.track, { backgroundColor: "rgba(255,255,255,0.18)" }]}>
          <View style={[styles.fill, { width: `${Math.max(percent, 3)}%` }]} />
        </View>
      </LinearGradient>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  card: { marginHorizontal: 16, marginTop: 14, borderRadius: 16, padding: 14, flexDirection: "row", alignItems: "center", gap: 12, borderWidth: 1.2 },
  icon: { width: 48, height: 48, borderRadius: 24, backgroundColor: NAVY, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 15, fontWeight: "800" },
  body: { fontSize: 12, marginTop: 2 },
  track: { height: 5, borderRadius: 999, backgroundColor: "rgba(201,168,76,0.2)", marginTop: 8, overflow: "hidden" },
  fill: { height: "100%", backgroundColor: GOLD, borderRadius: 999 },
  unlock: { color: GOLD, fontSize: 11, fontWeight: "600", marginTop: 6 },
  tripOuter: { marginHorizontal: 16, marginTop: 14, borderRadius: 18, overflow: "hidden" },
  tripCard: { padding: 16, borderRadius: 18 },
  tripTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  tripLabel: { color: "#E8D5A3", fontSize: 11, fontWeight: "800", letterSpacing: 1 },
  tripHeadline: { color: GOLD, fontSize: 24, fontWeight: "800", marginTop: 8 },
  tripSub: { color: "rgba(255,255,255,0.75)", fontSize: 12, marginTop: 2 },
})
