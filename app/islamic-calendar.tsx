import { AppIcon, ICON_GOLD } from "@/components/AppIcon"
import { useTheme } from "@/context/themeContext"
import {
  fetchAndCacheIslamicEvents,
  type IslamicEvent,
} from "@/lib/islamicEvents"
import {
  getHijriMonthGrid,
  gregorianToHijri,
  HIJRI_WEEKDAY_LABELS,
  hijriMonthKey,
  shiftHijriMonth,
  type HijriCalendarDay,
} from "@/lib/hijriDate"
import { scheduleIslamicDateReminders } from "@/lib/notifications"
import { Ionicons } from "@expo/vector-icons"
import { useRouter } from "expo-router"
import { StatusBar } from "expo-status-bar"
import { useEffect, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"

const CATEGORY_COLORS = {
  pilgrimage: { bg: "rgba(201,168,76,0.15)", border: "rgba(201,168,76,0.4)", text: "#C9A84C" },
  celebration: { bg: "rgba(45,106,79,0.15)", border: "rgba(45,106,79,0.4)", text: "#2D6A4F" },
  observance: { bg: "rgba(30,58,95,0.15)", border: "rgba(30,58,95,0.4)", text: "#1E3A5F" },
  holy: { bg: "rgba(138,43,226,0.1)", border: "rgba(138,43,226,0.3)", text: "#7B2FBE" },
}

const FILTERS = [
  { id: "all", labelKey: "all" },
  { id: "pilgrimage", labelKey: "calendarFilterPilgrimage" },
  { id: "celebration", labelKey: "calendarFilterCelebration" },
  { id: "holy", labelKey: "calendarFilterHoly" },
  { id: "observance", labelKey: "calendarFilterObservance" },
] as const

function EventCard({ event, theme }: { event: IslamicEvent; theme: any }) {
  const { t } = useTranslation()
  const [expanded, setExpanded] = useState(false)
  const colors = CATEGORY_COLORS[event.category]
  const today = new Date()
  const eventDate = new Date(event.gregorianDate)
  const isUpcoming = eventDate >= today
  const daysUntil = Math.ceil((eventDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

  const countdownLabel =
    daysUntil === 0
      ? t("calendarToday")
      : daysUntil === 1
        ? t("calendarTomorrow")
        : t("daysCountShort", { count: daysUntil })

  return (
    <TouchableOpacity
      style={[styles.eventCard, { backgroundColor: theme.card, borderColor: theme.border }]}
      onPress={() => setExpanded(!expanded)}
      activeOpacity={0.8}
    >
      <View style={styles.eventTop}>
        <View style={styles.eventLeft}>
          <View style={[styles.eventEmojiBg, { backgroundColor: colors.bg, borderColor: colors.border }]}>
            <AppIcon name={event.icon} size={22} color={colors.text} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.eventName, { color: theme.text }]}>{event.name}</Text>
            <Text style={styles.eventHijri}>{event.hijriDate}</Text>
          </View>
        </View>
        <View style={styles.eventRight}>
          <Text style={[styles.eventGregorian, { color: theme.text }]}>{event.gregorianDate}</Text>
          {isUpcoming && daysUntil <= 365 && (
            <View style={[styles.countdownBadge, { backgroundColor: colors.bg, borderColor: colors.border }]}>
              <Text style={[styles.countdownText, { color: colors.text }]}>
                {countdownLabel}
              </Text>
            </View>
          )}
        </View>
      </View>
      {expanded && (
        <View style={styles.eventExpanded}>
          <View style={styles.eventDivider} />
          <Text style={[styles.eventDesc, { color: theme.textSecondary }]}>{event.description}</Text>
        </View>
      )}
    </TouchableOpacity>
  )
}

function gregorianRangeLabel(days: HijriCalendarDay[], locale: string) {
  if (!days.length) return ""
  const first = days[0]
  const last = days[days.length - 1]
  const fmt = (d: HijriCalendarDay) =>
    new Date(d.gregorianYear, d.gregorianMonth - 1, d.gregorianDay).toLocaleDateString(locale, {
      month: "short",
      day: "numeric",
    })
  const year = last.gregorianYear === first.gregorianYear
    ? String(last.gregorianYear)
    : `${first.gregorianYear}–${last.gregorianYear}`
  return `${fmt(first)} – ${fmt(last)} ${year}`
}

export default function IslamicCalendarScreen() {
  const router = useRouter()
  const { theme } = useTheme()
  const insets = useSafeAreaInsets()
  const { t, i18n } = useTranslation()
  const [activeFilter, setActiveFilter] = useState("all")

  const today = new Date()
  const todayHijri = useMemo(() => gregorianToHijri(), [])
  const [viewMonth, setViewMonth] = useState(todayHijri.month)
  const [viewYear, setViewYear] = useState(todayHijri.year)

  const [events, setEvents] = useState<IslamicEvent[]>([])
  const [eventsLoading, setEventsLoading] = useState(true)

  const monthGrid = useMemo(() => getHijriMonthGrid(viewYear, viewMonth), [viewYear, viewMonth])

  useEffect(() => {
    fetchIslamicEvents()
  }, [])

  const fetchIslamicEvents = async () => {
    setEventsLoading(true)
    try {
      const sorted = await fetchAndCacheIslamicEvents()
      if (sorted.length) {
        setEvents(sorted)
        scheduleIslamicDateReminders().catch(console.log)
      }
    } catch (e) {
      console.log("Events fetch error:", e)
    } finally {
      setEventsLoading(false)
    }
  }

  const isToday = (day: HijriCalendarDay) =>
    day.hijriDay === todayHijri.day &&
    day.hijriMonth === todayHijri.month &&
    day.hijriYear === todayHijri.year

  const hasEvent = (day: HijriCalendarDay) => {
    if (day.hijriMonth === 12 && (day.hijriDay === 9 || day.hijriDay === 10)) return true
    if (day.hijriMonth === 10 && day.hijriDay === 1) return true
    if (day.hijriMonth === 9 && day.hijriDay === 1) return true
    if (day.hijriMonth === 1 && day.hijriDay === 1) return true
    if (day.hijriMonth === 1 && day.hijriDay === 10) return true
    if (day.hijriMonth === 7 && day.hijriDay === 27) return true
    if (day.hijriMonth === 3 && day.hijriDay === 12) return true
    return false
  }

  const prevMonth = () => {
    const next = shiftHijriMonth(viewYear, viewMonth, -1)
    setViewYear(next.year)
    setViewMonth(next.month)
  }
  const nextMonth = () => {
    const next = shiftHijriMonth(viewYear, viewMonth, 1)
    setViewYear(next.year)
    setViewMonth(next.month)
  }

  const filteredEvents = activeFilter === "all"
    ? events
    : events.filter(e => e.category === activeFilter)

  const nextEvent = events
    .filter(e => new Date(e.gregorianDate) >= today)
    .sort((a, b) => new Date(a.gregorianDate).getTime() - new Date(b.gregorianDate).getTime())[0]

  return (
    <View style={[styles.screen, { backgroundColor: theme.background }]}>
      <StatusBar style="light" />

      <View style={[styles.header, { paddingTop: insets.top }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>{t("islamicCalendarTitle")}</Text>
        <Text style={styles.subtitle}>{t("islamicCalendarSub")}</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
        <View style={[styles.calendarCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={styles.calNavRow}>
            <TouchableOpacity onPress={prevMonth} style={styles.calNavBtn} accessibilityRole="button">
              <Ionicons name="chevron-back" size={20} color="#1E3A5F" />
            </TouchableOpacity>
            <View style={styles.calMonthInfo}>
              <Text style={[styles.calMonthHijri, { color: theme.text }]}>
                {t(hijriMonthKey(viewMonth), { defaultValue: monthGrid.monthName })} {t("hijriAh", { year: viewYear })}
              </Text>
              <Text style={styles.calMonthGreg}>
                {gregorianRangeLabel(monthGrid.days, i18n.language)}
              </Text>
            </View>
            <TouchableOpacity onPress={nextMonth} style={styles.calNavBtn} accessibilityRole="button">
              <Ionicons name="chevron-forward" size={20} color="#1E3A5F" />
            </TouchableOpacity>
          </View>

          <View style={styles.weekdayRow}>
            {HIJRI_WEEKDAY_LABELS.map((d, i) => (
              <Text key={`${d}-${i}`} style={styles.weekdayText}>
                {t(`hijriWeekday${i}`)}
              </Text>
            ))}
          </View>

          <View style={styles.daysGrid}>
            {Array.from({ length: monthGrid.firstWeekday }).map((_, i) => (
              <View key={`empty-${i}`} style={styles.dayCell} />
            ))}
            {monthGrid.days.map(day => (
              <View
                key={`${day.hijriYear}-${day.hijriMonth}-${day.hijriDay}`}
                style={[styles.dayCell, isToday(day) && styles.dayCellToday]}
              >
                <Text
                  style={[
                    styles.dayHijri,
                    isToday(day) && styles.dayHijriToday,
                    { color: isToday(day) ? "#fff" : theme.text },
                  ]}
                >
                  {day.hijriDay}
                </Text>
                <Text style={[styles.dayGreg, isToday(day) && styles.dayGregToday]}>
                  {day.gregorianDay}
                </Text>
                {hasEvent(day) && !isToday(day) && <View style={styles.eventDot} />}
              </View>
            ))}
          </View>

          <View style={styles.calLegend}>
            <View style={styles.calLegendItem}>
              <View style={[styles.calLegendDot, { backgroundColor: "#1E3A5F" }]} />
              <Text style={[styles.calLegendText, { color: theme.textSecondary }]}>{t("calendarToday")}</Text>
            </View>
            <View style={styles.calLegendItem}>
              <View style={[styles.calLegendDot, { backgroundColor: "#C9A84C" }]} />
              <Text style={[styles.calLegendText, { color: theme.textSecondary }]}>{t("calendarEvent")}</Text>
            </View>
            <Text style={[styles.calLegendText, { color: theme.textSecondary }]}>
              {t("hijriGridLegend")}
            </Text>
          </View>
        </View>

        {nextEvent && (
          <View style={styles.nextEventBanner}>
            <View style={styles.nextEventLeft}>
              <Text style={styles.nextEventLabel}>{t("nextIslamicEvent")}</Text>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <AppIcon name={nextEvent.icon} size={20} color={ICON_GOLD} />
                <Text style={styles.nextEventName}>{nextEvent.name}</Text>
              </View>
              <Text style={styles.nextEventDate}>{nextEvent.gregorianDate}</Text>
            </View>
            <View style={styles.nextEventRight}>
              {(() => {
                const d = Math.ceil((new Date(nextEvent.gregorianDate).getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
                return (
                  <>
                    <Text style={styles.nextEventDays}>{d}</Text>
                    <Text style={styles.nextEventDaysLabel}>{t("daysAway")}</Text>
                  </>
                )
              })()}
            </View>
          </View>
        )}

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pillsContent}>
          {FILTERS.map(f => (
            <TouchableOpacity
              key={f.id}
              style={[styles.pill, { borderColor: "#1E3A5F" }, activeFilter === f.id && styles.pillActive]}
              onPress={() => setActiveFilter(f.id)}
            >
              <Text style={[styles.pillText, { color: "#1E3A5F" }, activeFilter === f.id && styles.pillTextActive]}>
                {t(f.labelKey)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.eventsList}>
          {eventsLoading ? (
            <View style={{ alignItems: "center", paddingVertical: 30 }}>
              <ActivityIndicator color="#C9A84C" size="large" />
              <Text style={{ color: theme.textSecondary, marginTop: 12, fontSize: 13 }}>
                {t("loadingIslamicDates")}
              </Text>
            </View>
          ) : (
            <>
              <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>
                {t("calendarEventsMeta", { count: filteredEvents.length })}
              </Text>
              {filteredEvents.map(event => (
                <EventCard key={event.id} event={event} theme={theme} />
              ))}
            </>
          )}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: { backgroundColor: "#1E3A5F", paddingBottom: 16 },
  backBtn: { flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 12, paddingHorizontal: 20, paddingTop: 16 },
  title: { color: "#fff", fontSize: 26, fontWeight: "bold", paddingHorizontal: 20, marginBottom: 4 },
  subtitle: { color: "#C9A84C", fontSize: 13, paddingHorizontal: 20 },
  calendarCard: { margin: 16, borderRadius: 20, padding: 16, borderWidth: 0.5 },
  calNavRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 },
  calNavBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: "rgba(30,58,95,0.08)", alignItems: "center", justifyContent: "center" },
  calMonthInfo: { alignItems: "center", flex: 1, paddingHorizontal: 8 },
  calMonthHijri: { fontSize: 16, fontWeight: "700", textAlign: "center" },
  calMonthGreg: { fontSize: 12, color: "#C9A84C", marginTop: 2, textAlign: "center" },
  weekdayRow: { flexDirection: "row", marginBottom: 8 },
  weekdayText: { flex: 1, textAlign: "center", fontSize: 11, fontWeight: "600", color: "#C9A84C" },
  daysGrid: { flexDirection: "row", flexWrap: "wrap" },
  dayCell: { width: "14.28%", alignItems: "center", paddingVertical: 6, marginBottom: 4, borderRadius: 10 },
  dayCellToday: { backgroundColor: "#1E3A5F", borderWidth: 1.5, borderColor: "#C9A84C" },
  dayHijri: { fontSize: 15, fontWeight: "600" },
  dayHijriToday: { color: "#fff", fontWeight: "700" },
  dayGreg: { fontSize: 9, color: "#C9A84C", marginTop: 1 },
  dayGregToday: { color: "rgba(201,168,76,0.95)" },
  eventDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: "#C9A84C", marginTop: 1 },
  calLegend: { flexDirection: "row", alignItems: "center", gap: 16, marginTop: 12, paddingTop: 12, borderTopWidth: 0.5, borderTopColor: "rgba(0,0,0,0.06)" },
  calLegendItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  calLegendDot: { width: 8, height: 8, borderRadius: 4 },
  calLegendText: { fontSize: 11 },
  nextEventBanner: { backgroundColor: "#1E3A5F", marginHorizontal: 16, borderRadius: 16, padding: 16, marginBottom: 16, flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderWidth: 0.5, borderColor: "rgba(201,168,76,0.3)" },
  nextEventLeft: { flex: 1 },
  nextEventLabel: { color: "#C9A84C", fontSize: 10, fontWeight: "700", letterSpacing: 0.8, marginBottom: 6 },
  nextEventName: { color: "#fff", fontSize: 17, fontWeight: "bold", marginBottom: 4 },
  nextEventDate: { color: "rgba(255,255,255,0.6)", fontSize: 13 },
  nextEventRight: { alignItems: "center" },
  nextEventDays: { color: "#C9A84C", fontSize: 36, fontWeight: "300" },
  nextEventDaysLabel: { color: "rgba(255,255,255,0.5)", fontSize: 11 },
  pillsContent: { paddingHorizontal: 16, gap: 8, paddingBottom: 16 },
  pill: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 0.5 },
  pillActive: { backgroundColor: "#1E3A5F", borderColor: "#1E3A5F" },
  pillText: { fontSize: 13, fontWeight: "500" },
  pillTextActive: { color: "#fff", fontWeight: "700" },
  eventsList: { paddingHorizontal: 16 },
  sectionLabel: { fontSize: 11, fontWeight: "600", letterSpacing: 0.5, marginBottom: 12 },
  eventCard: { borderRadius: 16, padding: 14, marginBottom: 10, borderWidth: 0.5 },
  eventTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  eventLeft: { flexDirection: "row", alignItems: "center", gap: 12, flex: 1, marginRight: 8 },
  eventEmojiBg: { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center", borderWidth: 0.5, flexShrink: 0 },
  eventName: { fontSize: 14, fontWeight: "600", marginBottom: 3 },
  eventHijri: { fontSize: 11, color: "#C9A84C" },
  eventRight: { alignItems: "flex-end", gap: 6 },
  eventGregorian: { fontSize: 12, fontWeight: "500" },
  countdownBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 99, borderWidth: 0.5 },
  countdownText: { fontSize: 11, fontWeight: "600" },
  eventExpanded: { marginTop: 8 },
  eventDivider: { height: 0.5, backgroundColor: "rgba(201,168,76,0.3)", marginBottom: 10 },
  eventDesc: { fontSize: 13, lineHeight: 20 },
})
