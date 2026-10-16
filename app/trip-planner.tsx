// Trip Planner (Premium). Unlocks on Home after the UmrahConnect guide is finished.
//   1. Trip dates  → countdown ("12 days to go" / "Day 3 of your trip")
//   2. Your stay   → nights in Makkah and Madinah, and which city comes first
//   3. Checklist   → documents, packing, preparation (some items open the screen that helps)
// Saved on the phone.
import TouchableOpacity from "@/app/components/AppPressable"
import { useTheme } from "@/context/themeContext"
import { usePremium } from "@/lib/premium"
import {
  EMPTY_TRIP,
  TRIP_CHECKLIST,
  TRIP_CHECKLIST_COUNT,
  loadTripPlan,
  parseDay,
  saveTripPlan,
  toDay,
  tripStatus,
  type TripPlan,
} from "@/lib/tripPlan"
import { Ionicons } from "@expo/vector-icons"
import DateTimePicker from "@react-native-community/datetimepicker"
import { useRouter } from "expo-router"
import { StatusBar } from "expo-status-bar"
import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { Platform, ScrollView, StyleSheet, Text, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"

const NAVY = "#1E3A5F"
const GOLD = "#C9A84C"

export default function TripPlannerScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { theme } = useTheme()
  const { t, i18n } = useTranslation()
  const { isPremium } = usePremium()
  const [plan, setPlan] = useState<TripPlan>(EMPTY_TRIP)
  const [androidPicker, setAndroidPicker] = useState<"depart" | "return" | null>(null)

  useEffect(() => {
    void loadTripPlan().then(setPlan)
  }, [])

  const update = (patch: Partial<TripPlan>) => {
    setPlan(prev => {
      const next = { ...prev, ...patch }
      void saveTripPlan(next)
      return next
    })
  }

  const toggleItem = (id: string) =>
    update({ done: plan.done.includes(id) ? plan.done.filter(x => x !== id) : [...plan.done, id] })

  // Picking dates. Return date can't be before departure. Nights follow the dates.
  const pickDate = (which: "depart" | "return", date: Date) => {
    const day = toDay(date)
    if (which === "depart") {
      const keepReturn = plan.returnDate && plan.returnDate >= day ? plan.returnDate : null
      update({ departDate: day, returnDate: keepReturn })
    } else {
      const nights = plan.departDate ? Math.max(0, Math.round((parseDay(day).getTime() - parseDay(plan.departDate).getTime()) / 86400000)) : 0
      const makkah = Math.min(plan.makkahNights, nights)
      update({ returnDate: day, makkahNights: makkah, madinahNights: Math.max(0, nights - makkah) })
    }
  }

  const formatDay = (day: string | null) =>
    day ? parseDay(day).toLocaleDateString(i18n.language, { day: "numeric", month: "short", year: "numeric" }) : t("tp_pickDate")

  const status = tripStatus(plan)
  const doneCount = plan.done.length
  const percent = Math.round((doneCount / TRIP_CHECKLIST_COUNT) * 100)

  const headline =
    status.kind === "before"
      ? t("tp_daysToGo", { count: status.days })
      : status.kind === "during"
        ? t("tp_dayOfTrip", { day: status.day })
        : status.kind === "after"
          ? t("tp_welcomeBack")
          : t("tp_setDates")

  const dateRow = (which: "depart" | "return") => {
    const value = which === "depart" ? plan.departDate : plan.returnDate
    const minimum = which === "return" && plan.departDate ? parseDay(plan.departDate) : new Date()
    return (
      <View style={styles.dateRow}>
        <Ionicons name={which === "depart" ? "airplane-outline" : "home-outline"} size={18} color={GOLD} />
        <Text style={[styles.dateLabel, { color: theme.text }]}>{t(which === "depart" ? "tp_depart" : "tp_return")}</Text>
        {Platform.OS === "ios" ? (
          <DateTimePicker
            value={value ? parseDay(value) : minimum}
            minimumDate={minimum}
            mode="date"
            display="compact"
            accentColor={GOLD}
            onChange={(_e, date) => date && pickDate(which, date)}
          />
        ) : (
          <TouchableOpacity style={[styles.dateBtn, { borderColor: theme.border }]} onPress={() => setAndroidPicker(which)}>
            <Text style={{ color: value ? theme.text : theme.textSecondary }}>{formatDay(value)}</Text>
          </TouchableOpacity>
        )}
      </View>
    )
  }

  const nightsRow = (city: "makkah" | "madinah") => {
    const key = city === "makkah" ? "makkahNights" : "madinahNights"
    const value = plan[key]
    return (
      <View style={styles.nightsRow}>
        <Text style={[styles.cityName, { color: theme.text }]}>{t(city === "makkah" ? "tp_makkah" : "tp_madinah")}</Text>
        <TouchableOpacity style={styles.stepBtn} onPress={() => update({ [key]: Math.max(0, value - 1) } as Partial<TripPlan>)}>
          <Ionicons name="remove" size={18} color={NAVY} />
        </TouchableOpacity>
        <Text style={[styles.nightsValue, { color: theme.text }]}>{t("tp_nights", { count: value })}</Text>
        <TouchableOpacity style={styles.stepBtn} onPress={() => update({ [key]: Math.min(60, value + 1) } as Partial<TripPlan>)}>
          <Ionicons name="add" size={18} color={NAVY} />
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <View style={[styles.screen, { backgroundColor: theme.background }]}>
      <StatusBar style="light" />

      {/* ─── Header with countdown ─── */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={22} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t("tp_title")}</Text>
          <View style={styles.pro}>
            <Ionicons name="star" size={9} color={NAVY} />
            <Text style={styles.proText}>{t("premiumBadge").toUpperCase()}</Text>
          </View>
        </View>
        <Text style={styles.headline}>{headline}</Text>
        <Text style={styles.headerSub}>{t("tp_progress", { done: doneCount, total: TRIP_CHECKLIST_COUNT })}</Text>
        <View style={styles.track}>
          <View style={[styles.fill, { width: `${Math.max(percent, 3)}%` }]} />
        </View>
      </View>

      {!isPremium ? (
        <Text style={[styles.locked, { color: theme.textSecondary }]}>{t("premiumFeatureBody")}</Text>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 40 }}>
          {/* 1. Dates */}
          <View style={[styles.section, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>{t("tp_dates")}</Text>
            {dateRow("depart")}
            {dateRow("return")}
          </View>

          {/* 2. Stay */}
          <View style={[styles.section, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>{t("tp_stay")}</Text>
            <View style={styles.segment}>
              {(["makkah", "madinah"] as const).map(city => {
                const on = plan.firstCity === city
                return (
                  <TouchableOpacity key={city} style={[styles.segBtn, on && styles.segOn]} onPress={() => update({ firstCity: city })}>
                    <Text style={[styles.segText, { color: on ? NAVY : theme.textSecondary }]}>
                      {t(city === "makkah" ? "tp_makkahFirst" : "tp_madinahFirst")}
                    </Text>
                  </TouchableOpacity>
                )
              })}
            </View>
            {plan.firstCity === "makkah" ? (
              <>
                {nightsRow("makkah")}
                {nightsRow("madinah")}
              </>
            ) : (
              <>
                {nightsRow("madinah")}
                {nightsRow("makkah")}
              </>
            )}
          </View>

          {/* 3. Checklist */}
          {TRIP_CHECKLIST.map(group => (
            <View key={group.id} style={[styles.section, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>{t(`tp_group_${group.id}`)}</Text>
              {group.items.map(item => {
                const done = plan.done.includes(item.id)
                return (
                  <View key={item.id} style={styles.itemRow}>
                    <TouchableOpacity onPress={() => toggleItem(item.id)} style={styles.itemMain} accessibilityRole="checkbox" accessibilityState={{ checked: done }}>
                      <Ionicons name={done ? "checkmark-circle" : "ellipse-outline"} size={24} color={done ? GOLD : theme.textSecondary} />
                      <Ionicons name={item.icon as any} size={16} color={theme.textSecondary} />
                      <Text style={[styles.itemText, { color: theme.text }, done && styles.itemDone]}>{t(`tp_item_${item.id}`)}</Text>
                    </TouchableOpacity>
                    {item.route ? (
                      <TouchableOpacity onPress={() => router.push(item.route as any)} hitSlop={8} style={styles.openBtn}>
                        <Text style={styles.openText}>{t("tp_open")}</Text>
                      </TouchableOpacity>
                    ) : null}
                  </View>
                )
              })}
            </View>
          ))}
        </ScrollView>
      )}

      {androidPicker && Platform.OS === "android" ? (
        <DateTimePicker
          value={
            (androidPicker === "depart" ? plan.departDate : plan.returnDate)
              ? parseDay((androidPicker === "depart" ? plan.departDate : plan.returnDate)!)
              : new Date()
          }
          minimumDate={androidPicker === "return" && plan.departDate ? parseDay(plan.departDate) : new Date()}
          mode="date"
          onChange={(event, date) => {
            const which = androidPicker
            setAndroidPicker(null)
            if (event.type === "set" && date && which) pickDate(which, date)
          }}
        />
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: { backgroundColor: NAVY, paddingHorizontal: 16, paddingBottom: 18, borderBottomLeftRadius: 22, borderBottomRightRadius: 22 },
  headerRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  backBtn: { backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 20, padding: 6 },
  headerTitle: { flex: 1, color: "#fff", fontSize: 18, fontWeight: "bold" },
  pro: { flexDirection: "row", alignItems: "center", gap: 3, backgroundColor: GOLD, borderRadius: 999, paddingHorizontal: 7, paddingVertical: 2 },
  proText: { color: NAVY, fontSize: 9, fontWeight: "800" },
  headline: { color: GOLD, fontSize: 28, fontWeight: "800", marginTop: 16 },
  headerSub: { color: "rgba(255,255,255,0.75)", fontSize: 12, marginTop: 4 },
  track: { height: 6, borderRadius: 999, backgroundColor: "rgba(255,255,255,0.18)", marginTop: 10, overflow: "hidden" },
  fill: { height: "100%", backgroundColor: GOLD, borderRadius: 999 },
  locked: { textAlign: "center", marginTop: 50, paddingHorizontal: 30 },
  section: { borderRadius: 16, borderWidth: 0.5, padding: 14, marginBottom: 12 },
  sectionTitle: { fontSize: 15, fontWeight: "800", marginBottom: 10 },
  dateRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 6 },
  dateLabel: { flex: 1, fontSize: 14, fontWeight: "600" },
  dateBtn: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 7 },
  segment: { flexDirection: "row", backgroundColor: "rgba(201,168,76,0.12)", borderRadius: 12, padding: 3, marginBottom: 10 },
  segBtn: { flex: 1, alignItems: "center", paddingVertical: 8, borderRadius: 10 },
  segOn: { backgroundColor: GOLD },
  segText: { fontSize: 13, fontWeight: "700" },
  nightsRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 6 },
  cityName: { flex: 1, fontSize: 14, fontWeight: "600" },
  stepBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: GOLD, alignItems: "center", justifyContent: "center" },
  nightsValue: { minWidth: 76, textAlign: "center", fontSize: 14, fontWeight: "700" },
  itemRow: { flexDirection: "row", alignItems: "center", paddingVertical: 7 },
  itemMain: { flex: 1, flexDirection: "row", alignItems: "center", gap: 10 },
  itemText: { flex: 1, fontSize: 14 },
  itemDone: { textDecorationLine: "line-through", opacity: 0.55 },
  openBtn: { borderWidth: 1, borderColor: GOLD, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3 },
  openText: { color: GOLD, fontSize: 11, fontWeight: "700" },
})
