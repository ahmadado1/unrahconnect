import { useTheme } from "@/context/themeContext"
import { Ionicons } from "@expo/vector-icons"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { useRouter } from "expo-router"
import { StatusBar } from "expo-status-bar"
import { useEffect, useState } from "react"
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"

// ─── CONSTANTS ───────────────────────────────────────────────────────────────

const HIJRI_MONTHS = [
  "Muharram", "Safar", "Rabi al-Awwal", "Rabi al-Thani",
  "Jumada al-Awwal", "Jumada al-Thani", "Rajab", "Sha'ban",
  "Ramadan", "Shawwal", "Dhul Qi'dah", "Dhul Hijjah"
]

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

// Fixed Hijri dates — these never change
const ISLAMIC_EVENTS_HIJRI = [
  { id: "new-year", name: "Islamic New Year", emoji: "🌙", hijriDay: 1, hijriMonth: 1, description: "The first day of the Islamic lunar calendar. A time for reflection and renewing intentions.", category: "observance" as const },
  { id: "ashura", name: "Day of Ashura", emoji: "🕯️", hijriDay: 10, hijriMonth: 1, description: "A day of fasting commemorating the day Allah saved Musa (AS) and his people. Fasting expiates sins of the previous year.", category: "observance" as const },
  { id: "isra", name: "Isra wal Mi'raj", emoji: "✨", hijriDay: 27, hijriMonth: 7, description: "The night journey of the Prophet Muhammad ﷺ from Makkah to Jerusalem and his ascension to the heavens.", category: "holy" as const },
  { id: "ramadan", name: "Ramadan Begins", emoji: "🌙", hijriDay: 1, hijriMonth: 9, description: "The blessed month of fasting, prayer, reflection and community. One of the five pillars of Islam.", category: "observance" as const },
  { id: "laylatul-qadr", name: "Laylatul Qadr", emoji: "⭐", hijriDay: 27, hijriMonth: 9, description: "The Night of Power — better than a thousand months. Seek it in the last 10 nights of Ramadan.", category: "holy" as const },
  { id: "eid-fitr", name: "Eid al-Fitr", emoji: "🎉", hijriDay: 1, hijriMonth: 10, description: "The festival of breaking the fast, celebrating the end of Ramadan with prayer, charity and family.", category: "celebration" as const },
  { id: "arafah", name: "Day of Arafah", emoji: "🕋", hijriDay: 9, hijriMonth: 12, description: "The most important day of Hajj. Fasting expiates sins of the past and coming year for non-pilgrims.", category: "pilgrimage" as const },
  { id: "eid-adha", name: "Eid al-Adha", emoji: "🐑", hijriDay: 10, hijriMonth: 12, description: "The festival of sacrifice, commemorating Ibrahim's willingness to sacrifice his son for Allah.", category: "celebration" as const },
  { id: "mawlid", name: "Mawlid an-Nabi", emoji: "🌟", hijriDay: 12, hijriMonth: 3, description: "The birth of the Prophet Muhammad ﷺ. A time to learn about his life and follow his example.", category: "observance" as const },
]

const CATEGORY_COLORS = {
  pilgrimage: { bg: "rgba(201,168,76,0.15)", border: "rgba(201,168,76,0.4)", text: "#C9A84C" },
  celebration: { bg: "rgba(45,106,79,0.15)", border: "rgba(45,106,79,0.4)", text: "#2D6A4F" },
  observance: { bg: "rgba(30,58,95,0.15)", border: "rgba(30,58,95,0.4)", text: "#1E3A5F" },
  holy: { bg: "rgba(138,43,226,0.1)", border: "rgba(138,43,226,0.3)", text: "#7B2FBE" },
}

const FILTERS = [
  { id: "all", label: "All" },
  { id: "pilgrimage", label: "Hajj & Umrah" },
  { id: "celebration", label: "Celebrations" },
  { id: "holy", label: "Holy Nights" },
  { id: "observance", label: "Observances" },
]

const EVENTS_CACHE_KEY = "islamic_events_cache"
const EVENTS_CACHE_DATE_KEY = "islamic_events_cache_date"

// ─── TYPES ───────────────────────────────────────────────────────────────────

type CalendarDay = {
  gregorianDay: number
  gregorianMonth: number
  gregorianYear: number
  hijriDay: number
  hijriMonth: number
  hijriYear: number
  hijriMonthName: string
}

type IslamicEvent = {
  id: string
  name: string
  emoji: string
  hijriDate: string
  gregorianDate: string
  gregorianYear: number
  description: string
  category: "pilgrimage" | "celebration" | "observance" | "holy"
}

// ─── EVENT CARD ──────────────────────────────────────────────────────────────

function EventCard({ event, theme }: { event: IslamicEvent; theme: any }) {
  const [expanded, setExpanded] = useState(false)
  const colors = CATEGORY_COLORS[event.category]
  const today = new Date()
  const eventDate = new Date(event.gregorianDate)
  const isUpcoming = eventDate >= today
  const daysUntil = Math.ceil((eventDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

  return (
    <TouchableOpacity
      style={[styles.eventCard, { backgroundColor: theme.card, borderColor: theme.border }]}
      onPress={() => setExpanded(!expanded)}
      activeOpacity={0.8}
    >
      <View style={styles.eventTop}>
        <View style={styles.eventLeft}>
          <View style={[styles.eventEmojiBg, { backgroundColor: colors.bg, borderColor: colors.border }]}>
            <Text style={styles.eventEmoji}>{event.emoji}</Text>
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
                {daysUntil === 0 ? "Today!" : daysUntil === 1 ? "Tomorrow" : `${daysUntil}d`}
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

// ─── SCREEN ──────────────────────────────────────────────────────────────────

export default function IslamicCalendarScreen() {
  const router = useRouter()
  const { theme } = useTheme()
  const insets = useSafeAreaInsets()
  const [activeFilter, setActiveFilter] = useState("all")

  // Calendar state
  const today = new Date()
  const [viewMonth, setViewMonth] = useState(today.getMonth() + 1)
  const [viewYear, setViewYear] = useState(today.getFullYear())
  const [calendarDays, setCalendarDays] = useState<CalendarDay[]>([])
  const [calendarLoading, setCalendarLoading] = useState(true)
  const [hijriMonthName, setHijriMonthName] = useState("")
  const [hijriMonthYear, setHijriMonthYear] = useState("")

  // Events state
  const [events, setEvents] = useState<IslamicEvent[]>([])
  const [eventsLoading, setEventsLoading] = useState(true)

  useEffect(() => { fetchCalendar() }, [viewMonth, viewYear])
  useEffect(() => { fetchIslamicEvents() }, [])

  // ─── FETCH CALENDAR ──────────────────────────────────────────────────────

  const fetchCalendar = async () => {
    setCalendarLoading(true)
    try {
      const res = await fetch(`https://api.aladhan.com/v1/gToHCalendar/${viewMonth}/${viewYear}`)
      const data = await res.json()
      if (data.code === 200) {
        const days: CalendarDay[] = data.data.map((d: any) => ({
          gregorianDay: parseInt(d.gregorian.day),
          gregorianMonth: viewMonth,
          gregorianYear: viewYear,
          hijriDay: parseInt(d.hijri.day),
          hijriMonth: parseInt(d.hijri.month.number),
          hijriYear: parseInt(d.hijri.year),
          hijriMonthName: d.hijri.month.en,
        }))
        setCalendarDays(days)
        const midDay = days[Math.floor(days.length / 2)]
        setHijriMonthName(midDay.hijriMonthName)
        setHijriMonthYear(`${midDay.hijriYear} AH`)
      }
    } catch (e) {
      console.log("Calendar fetch error:", e)
    } finally {
      setCalendarLoading(false)
    }
  }

  // ─── FETCH EVENTS DYNAMICALLY ────────────────────────────────────────────

  const fetchIslamicEvents = async () => {
    setEventsLoading(true)
    try {
      // Check cache first — only refetch once per month
      const cachedDate = await AsyncStorage.getItem(EVENTS_CACHE_DATE_KEY)
      const cachedEvents = await AsyncStorage.getItem(EVENTS_CACHE_KEY)
      const now = new Date()

      if (cachedDate && cachedEvents) {
        const lastFetch = new Date(cachedDate)
        // Use cache if fetched this month
        if (lastFetch.getMonth() === now.getMonth() && lastFetch.getFullYear() === now.getFullYear()) {
          setEvents(JSON.parse(cachedEvents))
          setEventsLoading(false)
          return
        }
      }

      // Get current Hijri year
      const todayRes = await fetch(
        `https://api.aladhan.com/v1/gToH?date=${now.getDate()}-${now.getMonth() + 1}-${now.getFullYear()}`
      )
      const todayData = await todayRes.json()
      const currentHijriYear = parseInt(todayData.data.hijri.year)

      const allEvents: IslamicEvent[] = []

      // Fetch for current and next Hijri year
      for (const hijriYear of [currentHijriYear, currentHijriYear + 1]) {
        for (const event of ISLAMIC_EVENTS_HIJRI) {
          try {
            const res = await fetch(
              `https://api.aladhan.com/v1/hToG?date=${event.hijriDay}-${event.hijriMonth}-${hijriYear}`
            )
            const data = await res.json()
            if (data.code === 200) {
              const g = data.data.gregorian
              const gregorianDateStr = `${g.month.en} ${parseInt(g.day)}, ${g.year}`
              allEvents.push({
                id: `${event.id}-${hijriYear}`,
                name: event.name,
                emoji: event.emoji,
                hijriDate: `${event.hijriDay} ${HIJRI_MONTHS[event.hijriMonth - 1]} ${hijriYear} AH`,
                gregorianDate: gregorianDateStr,
                gregorianYear: parseInt(g.year),
                description: event.description,
                category: event.category,
              })
            }
          } catch (e) {
            console.log(`Failed to fetch ${event.name}:`, e)
          }
        }
      }

      // Sort by date
      const sorted = allEvents.sort((a, b) =>
        new Date(a.gregorianDate).getTime() - new Date(b.gregorianDate).getTime()
      )

      setEvents(sorted)

      // Cache for next time
      await AsyncStorage.setItem(EVENTS_CACHE_KEY, JSON.stringify(sorted))
      await AsyncStorage.setItem(EVENTS_CACHE_DATE_KEY, now.toISOString())

    } catch (e) {
      console.log("Events fetch error:", e)
    } finally {
      setEventsLoading(false)
    }
  }

  // ─── HELPERS ─────────────────────────────────────────────────────────────

  const firstDayOfMonth = new Date(viewYear, viewMonth - 1, 1).getDay()
  const monthName = new Date(viewYear, viewMonth - 1).toLocaleString("en-US", { month: "long" })

  const isToday = (day: CalendarDay) =>
    day.gregorianDay === today.getDate() &&
    day.gregorianMonth === today.getMonth() + 1 &&
    day.gregorianYear === today.getFullYear()

  const hasEvent = (day: CalendarDay) => {
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
    if (viewMonth === 1) { setViewMonth(12); setViewYear(y => y - 1) }
    else setViewMonth(m => m - 1)
  }
  const nextMonth = () => {
    if (viewMonth === 12) { setViewMonth(1); setViewYear(y => y + 1) }
    else setViewMonth(m => m + 1)
  }

  // Filter and sort events
  const filteredEvents = activeFilter === "all"
    ? events
    : events.filter(e => e.category === activeFilter)

  // Next upcoming event
  const nextEvent = events
    .filter(e => new Date(e.gregorianDate) >= today)
    .sort((a, b) => new Date(a.gregorianDate).getTime() - new Date(b.gregorianDate).getTime())[0]

  return (
    <View style={[styles.screen, { backgroundColor: theme.background }]}>
      <StatusBar style="light" />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color="#fff" />
          <Text style={styles.backText}>Guide</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Islamic Calendar</Text>
        <Text style={styles.subtitle}>Dates update automatically each year</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} bounces={false}>

        {/* ── CALENDAR GRID ── */}
        <View style={[styles.calendarCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={styles.calNavRow}>
            <TouchableOpacity onPress={prevMonth} style={styles.calNavBtn}>
              <Ionicons name="chevron-back" size={20} color="#1E3A5F" />
            </TouchableOpacity>
            <View style={styles.calMonthInfo}>
              <Text style={[styles.calMonthGreg, { color: theme.text }]}>{monthName} {viewYear}</Text>
              <Text style={styles.calMonthHijri}>{hijriMonthName} {hijriMonthYear}</Text>
            </View>
            <TouchableOpacity onPress={nextMonth} style={styles.calNavBtn}>
              <Ionicons name="chevron-forward" size={20} color="#1E3A5F" />
            </TouchableOpacity>
          </View>

          <View style={styles.weekdayRow}>
            {WEEKDAYS.map(d => (
              <Text key={d} style={styles.weekdayText}>{d}</Text>
            ))}
          </View>

          {calendarLoading ? (
            <View style={styles.calLoading}>
              <ActivityIndicator color="#C9A84C" />
            </View>
          ) : (
            <View style={styles.daysGrid}>
              {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                <View key={`empty-${i}`} style={styles.dayCell} />
              ))}
              {calendarDays.map((day, i) => (
                <View key={i} style={[styles.dayCell, isToday(day) && styles.dayCellToday]}>
                  <Text style={[styles.dayGreg, isToday(day) && styles.dayGregToday, { color: isToday(day) ? "#fff" : theme.text }]}>
                    {day.gregorianDay}
                  </Text>
                  <Text style={[styles.dayHijri, isToday(day) && styles.dayHijriToday]}>
                    {day.hijriDay}
                  </Text>
                  {hasEvent(day) && !isToday(day) && <View style={styles.eventDot} />}
                </View>
              ))}
            </View>
          )}

          <View style={styles.calLegend}>
            <View style={styles.calLegendItem}>
              <View style={[styles.calLegendDot, { backgroundColor: "#1E3A5F" }]} />
              <Text style={[styles.calLegendText, { color: theme.textSecondary }]}>Today</Text>
            </View>
            <View style={styles.calLegendItem}>
              <View style={[styles.calLegendDot, { backgroundColor: "#C9A84C" }]} />
              <Text style={[styles.calLegendText, { color: theme.textSecondary }]}>Event</Text>
            </View>
            <Text style={[styles.calLegendText, { color: theme.textSecondary }]}>Small = Hijri day</Text>
          </View>
        </View>

        {/* ── NEXT EVENT BANNER ── */}
        {nextEvent && (
          <View style={styles.nextEventBanner}>
            <View style={styles.nextEventLeft}>
              <Text style={styles.nextEventLabel}>NEXT ISLAMIC EVENT</Text>
              <Text style={styles.nextEventName}>{nextEvent.emoji} {nextEvent.name}</Text>
              <Text style={styles.nextEventDate}>{nextEvent.gregorianDate}</Text>
            </View>
            <View style={styles.nextEventRight}>
              {(() => {
                const d = Math.ceil((new Date(nextEvent.gregorianDate).getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
                return (
                  <>
                    <Text style={styles.nextEventDays}>{d}</Text>
                    <Text style={styles.nextEventDaysLabel}>days away</Text>
                  </>
                )
              })()}
            </View>
          </View>
        )}

        {/* ── FILTER PILLS ── */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pillsContent}>
          {FILTERS.map(f => (
            <TouchableOpacity
              key={f.id}
              style={[styles.pill, { borderColor: "#1E3A5F" }, activeFilter === f.id && styles.pillActive]}
              onPress={() => setActiveFilter(f.id)}
            >
              <Text style={[styles.pillText, { color: "#1E3A5F" }, activeFilter === f.id && styles.pillTextActive]}>
                {f.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* ── EVENTS LIST ── */}
        <View style={styles.eventsList}>
          {eventsLoading ? (
            <View style={{ alignItems: "center", paddingVertical: 30 }}>
              <ActivityIndicator color="#C9A84C" size="large" />
              <Text style={{ color: theme.textSecondary, marginTop: 12, fontSize: 13 }}>
                Loading Islamic dates...
              </Text>
            </View>
          ) : (
            <>
              <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>
                {filteredEvents.length} events · dates subject to moon sighting · tap to expand
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

// ─── STYLES ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: { backgroundColor: "#1E3A5F", paddingBottom: 16 },
  backBtn: { flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 12, paddingHorizontal: 20, paddingTop: 16 },
  backText: { color: "rgba(255,255,255,0.6)", fontSize: 14 },
  title: { color: "#fff", fontSize: 26, fontWeight: "bold", paddingHorizontal: 20, marginBottom: 4 },
  subtitle: { color: "#C9A84C", fontSize: 13, paddingHorizontal: 20 },
  calendarCard: { margin: 16, borderRadius: 20, padding: 16, borderWidth: 0.5 },
  calNavRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 },
  calNavBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: "rgba(30,58,95,0.08)", alignItems: "center", justifyContent: "center" },
  calMonthInfo: { alignItems: "center" },
  calMonthGreg: { fontSize: 16, fontWeight: "700" },
  calMonthHijri: { fontSize: 12, color: "#C9A84C", marginTop: 2 },
  weekdayRow: { flexDirection: "row", marginBottom: 8 },
  weekdayText: { flex: 1, textAlign: "center", fontSize: 11, fontWeight: "600", color: "#C9A84C" },
  daysGrid: { flexDirection: "row", flexWrap: "wrap" },
  dayCell: { width: "14.28%", alignItems: "center", paddingVertical: 4, marginBottom: 4, borderRadius: 8 },
  dayCellToday: { backgroundColor: "#1E3A5F" },
  dayGreg: { fontSize: 14, fontWeight: "500" },
  dayGregToday: { color: "#fff", fontWeight: "700" },
  dayHijri: { fontSize: 9, color: "#C9A84C", marginTop: 1 },
  dayHijriToday: { color: "rgba(201,168,76,0.9)" },
  eventDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: "#C9A84C", marginTop: 1 },
  calLegend: { flexDirection: "row", alignItems: "center", gap: 16, marginTop: 12, paddingTop: 12, borderTopWidth: 0.5, borderTopColor: "rgba(0,0,0,0.06)" },
  calLegendItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  calLegendDot: { width: 8, height: 8, borderRadius: 4 },
  calLegendText: { fontSize: 11 },
  calLoading: { height: 180, alignItems: "center", justifyContent: "center" },
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
  eventEmoji: { fontSize: 22 },
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