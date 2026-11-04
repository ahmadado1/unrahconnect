// Prayer times on the Guide tab: week strip with a progress ring per day, next-prayer card,
// and one row per prayer with a tracker circle (tap when prayed) and an alert button
// (tap to switch Adhan → notification only → off for that prayer).
import { PRAYER_ICONS, PRAYER_NAMES } from "@/lib/prayerConstants"
import { fetchAndCachePrayerTimes, readCachedPrayerTimes, timeToMinutes, type CachedPrayerTimes } from "@/lib/prayerTimes"
import { ALERT_PRAYERS, loadPrayerModes, setPrayerMode, type AlertPrayer, type PrayerAlertMode } from "@/lib/prayerToggles"
import { getWeekStartingSaturday, loadTracker, onPrayerLogChange, togglePrayed, trackerDayKey, type TrackerData } from "@/lib/prayerTracker"
import { reschedulePrayerNotificationsFromCache } from "@/lib/notifications"
import TouchableOpacity from "@/app/components/AppPressable"
import { Ionicons } from "@expo/vector-icons"
import * as Haptics from "expo-haptics"
import { useFocusEffect } from "expo-router"
import { useTranslation } from "react-i18next"
import { useCallback, useEffect, useState } from "react"
import { AppState, StyleSheet, Text, View, type AppStateStatus } from "react-native"
import Svg, { Circle } from "react-native-svg"

type PrayerTimes = CachedPrayerTimes
type PrayerName = (typeof PRAYER_NAMES)[number]

const GOLD = "#C9A84C"
const GOLD_SOFT = "#E6C873"
const NAVY_DEEP = "#14294A"

/** Sunrise (Shuruq) is shown after Fajr for reference; it is not a prayer. */
const ROWS = ["Fajr", "Sunrise", "Dhuhr", "Asr", "Maghrib", "Isha"] as const
type Row = (typeof ROWS)[number]

const NAME_KEYS: Record<PrayerName, string> = {
  Fajr: "prayerNameFajr",
  Dhuhr: "prayerNameDhuhr",
  Asr: "prayerNameAsr",
  Maghrib: "prayerNameMaghrib",
  Isha: "prayerNameIsha",
}

const MODE_ORDER: PrayerAlertMode[] = ["adhan", "notify", "off"]
const MODE_ICON: Record<PrayerAlertMode, keyof typeof Ionicons.glyphMap> = {
  adhan: "volume-high-outline",
  notify: "notifications-outline",
  off: "notifications-off-outline",
}

const formatCountdown = (minutes: number) => {
  const h = Math.floor(minutes / 60)
  const m = Math.floor(minutes % 60)
  return h > 0 ? `${h}h ${m.toString().padStart(2, "0")}m` : `${m}m`
}

/** Small ring that fills as prayers are marked (0–5). */
function DayRing({ done, selected }: { done: number; selected: boolean }) {
  const size = 34
  const stroke = 3
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const pct = Math.min(1, done / 5)
  return (
    <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
      <Circle cx={size / 2} cy={size / 2} r={r} stroke={selected ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.12)"} strokeWidth={stroke} fill="none" />
      {pct > 0 ? (
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={GOLD}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${c * pct} ${c}`}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      ) : null}
    </Svg>
  )
}

export default function PrayerWidget() {
  const { t, i18n } = useTranslation()
  const [prayerTimes, setPrayerTimes] = useState<PrayerTimes | null>(null)
  const [now, setNow] = useState(new Date())
  const [tracker, setTracker] = useState<TrackerData>({})
  const [modes, setModes] = useState<Record<AlertPrayer, PrayerAlertMode> | null>(null)
  /** Day picked in the week strip; null = today. */
  const [pickedKey, setPickedKey] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  const load = useCallback(async () => {
    const cached = await readCachedPrayerTimes()
    if (cached) setPrayerTimes(cached)
    void loadTracker().then(setTracker)
    void loadPrayerModes().then(setModes)
    const fresh = await fetchAndCachePrayerTimes()
    if (fresh) setPrayerTimes(fresh)
  }, [])

  // Runs on first show and every time the tab comes back into view.
  useFocusEffect(
    useCallback(() => {
      void load()
    }, [load])
  )

  useEffect(() => {
    const sub = AppState.addEventListener("change", (state: AppStateStatus) => {
      if (state === "active") void load()
    })
    return () => sub.remove()
  }, [load])

  // Ticked from the prayer popup ("Pray now" / "I prayed"): refresh the circles.
  useEffect(() => onPrayerLogChange(() => void loadTracker().then(setTracker)), [])

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  // Hide the small message after a moment.
  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => setToast(null), 2200)
    return () => clearTimeout(timer)
  }, [toast])

  const todayKey = trackerDayKey(now)
  const selectedKey = pickedKey ?? todayKey

  const isToday = selectedKey === todayKey
  const nowMinutes = now.getHours() * 60 + now.getMinutes()
  // Saturday-to-Friday week (same as the prayer popup). Future days can't be marked.
  const days = getWeekStartingSaturday(now)
  const todayStart = new Date(now)
  todayStart.setHours(0, 0, 0, 0)

  let nextPrayer: { name: PrayerName; time: string; minutesLeft: number } | null = null
  /** The prayer whose time is running now (from its time until the next prayer; Fajr ends at sunrise). */
  let currentPrayer: PrayerName | null = null
  if (prayerTimes) {
    for (const name of PRAYER_NAMES) {
      const at = timeToMinutes(prayerTimes[name])
      if (at <= nowMinutes) currentPrayer = name
      else if (!nextPrayer) nextPrayer = { name, time: prayerTimes[name], minutesLeft: at - nowMinutes }
    }
    nextPrayer ??= {
      name: "Fajr",
      time: prayerTimes.Fajr,
      minutesLeft: 24 * 60 - nowMinutes + timeToMinutes(prayerTimes.Fajr),
    }
    if (currentPrayer === "Fajr" && prayerTimes.Sunrise && timeToMinutes(prayerTimes.Sunrise) <= nowMinutes) {
      currentPrayer = null
    }
  }

  const label = (row: Row) =>
    row === "Sunrise" ? t("sunrise", { defaultValue: "Sunrise" }) : t(NAME_KEYS[row], { defaultValue: row })

  const done = new Set(tracker[selectedKey] ?? [])
  const doneCount = ALERT_PRAYERS.filter(p => done.has(p)).length

  const showToast = (text: string) => setToast(text)

  const onTrack = async (prayer: PrayerName, canMark: boolean) => {
    if (!canMark) {
      showToast(t("prayerNotYet", { defaultValue: "You can mark it once its time has come" }))
      return
    }
    void Haptics.selectionAsync().catch(() => {})
    setTracker(await togglePrayed(selectedKey, prayer))
  }

  const onMode = async (prayer: AlertPrayer) => {
    if (!modes) return
    const next = MODE_ORDER[(MODE_ORDER.indexOf(modes[prayer]) + 1) % MODE_ORDER.length]
    void Haptics.selectionAsync().catch(() => {})
    setModes({ ...modes, [prayer]: next })
    await setPrayerMode(prayer, next)
    const modeLabel =
      next === "adhan"
        ? t("prayerModeAdhan", { defaultValue: "Adhan" })
        : next === "notify"
          ? t("prayerModeNotify", { defaultValue: "Notification only" })
          : t("prayerModeOff", { defaultValue: "No alert" })
    showToast(`${label(prayer)}: ${modeLabel}`)
    void reschedulePrayerNotificationsFromCache().catch(() => {})
  }

  const weekday = (d: Date) => {
    try {
      return d.toLocaleDateString(i18n.language, { weekday: "narrow" })
    } catch {
      return ["S", "M", "T", "W", "T", "F", "S"][d.getDay()]
    }
  }

  return (
    <View style={styles.widget}>
      {/* Location and Hijri date */}
      <View style={styles.topRow}>
        <View style={styles.pill}>
          <Ionicons name="location" size={12} color={GOLD} />
          <Text style={styles.pillText} numberOfLines={1}>{prayerTimes?.city || "—"}</Text>
        </View>
        <View style={styles.pill}>
          <Ionicons name="calendar-outline" size={12} color={GOLD} />
          <Text style={styles.pillText} numberOfLines={1}>{prayerTimes?.date || "—"}</Text>
        </View>
      </View>

      {/* Week strip: tap a day to see or fix what you marked */}
      <View style={styles.week}>
        {days.map(d => {
          const key = trackerDayKey(d)
          const selected = key === selectedKey
          const future = d.getTime() > todayStart.getTime()
          const count = ALERT_PRAYERS.filter(p => (tracker[key] ?? []).includes(p)).length
          return (
            <TouchableOpacity
              key={key}
              style={[styles.day, selected && styles.daySelected, future && styles.dayFuture]}
              onPress={() => setPickedKey(key === todayKey ? null : key)}
              disabled={future}
              accessibilityRole="button"
              accessibilityLabel={`${d.toDateString()}, ${count}/5`}
            >
              <View style={styles.dayRing}>
                <DayRing done={count} selected={selected} />
                <Text style={[styles.dayNum, selected && styles.dayNumSelected]}>{d.getDate()}</Text>
              </View>
              <Text style={[styles.dayName, key === todayKey && styles.dayNameToday]}>{weekday(d)}</Text>
            </TouchableOpacity>
          )
        })}
      </View>

      {/* Next prayer (today only) */}
      {isToday ? (
        <View style={styles.nextCard}>
          <View style={{ flex: 1 }}>
            <Text style={styles.nextLabel}>{t("nextPrayer")}</Text>
            <Text style={styles.nextName}>{nextPrayer ? label(nextPrayer.name) : "—"}</Text>
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={styles.nextTime}>{nextPrayer?.time || "--:--"}</Text>
            <Text style={styles.nextIn}>
              {nextPrayer ? `${t("timeRemaining")} · ${formatCountdown(nextPrayer.minutesLeft)}` : ""}
            </Text>
          </View>
        </View>
      ) : (
        <View style={styles.pastBanner}>
          <Ionicons name="checkmark-done-outline" size={16} color={GOLD} />
          <Text style={styles.pastBannerText}>
            {t("prayerPastDayHint", { defaultValue: "Mark the prayers you prayed that day" })}
          </Text>
        </View>
      )}

      {/* Prayer rows */}
      <View style={styles.list}>
        {ROWS.map(row => {
          const isSunrise = row === "Sunrise"
          const time = isSunrise ? prayerTimes?.Sunrise : prayerTimes?.[row]
          const startedToday = !!time && timeToMinutes(time) <= nowMinutes
          const isNow = isToday && !isSunrise && currentPrayer === row
          const prayed = !isSunrise && done.has(row)
          const canMark = !isToday || startedToday

          if (isSunrise) {
            return (
              <View key={row} style={styles.sunriseRow}>
                <View style={styles.trackSpacer} />
                <Ionicons name="sunny-outline" size={15} color="rgba(255,255,255,0.45)" />
                <Text style={styles.sunriseName}>{label(row)}</Text>
                <View style={{ flex: 1 }} />
                {isToday ? <Text style={styles.sunriseTime}>{time || "--:--"}</Text> : null}
                <View style={styles.modeSpacer} />
              </View>
            )
          }

          const mode = modes?.[row as AlertPrayer] ?? "adhan"
          return (
            <View key={row} style={[styles.row, isNow && styles.rowNow]}>
              <TouchableOpacity
                style={[styles.track, prayed && styles.trackDone, !canMark && styles.trackLocked]}
                onPress={() => void onTrack(row, canMark)}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: prayed }}
                accessibilityLabel={label(row)}
                hitSlop={8}
              >
                {prayed ? <Ionicons name="checkmark" size={16} color={NAVY_DEEP} /> : null}
              </TouchableOpacity>
              <Ionicons
                name={PRAYER_ICONS[row] as keyof typeof Ionicons.glyphMap}
                size={17}
                color={isNow ? GOLD : "rgba(255,255,255,0.7)"}
              />
              <Text style={[styles.name, isNow && styles.nameNow]}>{label(row)}</Text>
              {isNow ? (
                <View style={styles.nowBadge}>
                  <Text style={styles.nowText}>{t("prayerNow", { defaultValue: "Now" })}</Text>
                </View>
              ) : null}
              <View style={{ flex: 1 }} />
              {isToday ? <Text style={[styles.time, isNow && styles.timeNow]}>{time || "--:--"}</Text> : null}
              {isToday ? (
                <TouchableOpacity
                  style={[styles.modeBtn, mode === "off" && styles.modeBtnOff]}
                  onPress={() => void onMode(row as AlertPrayer)}
                  accessibilityRole="button"
                  accessibilityLabel={`${label(row)} alert: ${mode}`}
                  hitSlop={6}
                >
                  <Ionicons
                    name={MODE_ICON[mode]}
                    size={18}
                    color={mode === "off" ? "rgba(255,255,255,0.4)" : mode === "adhan" ? GOLD : "rgba(255,255,255,0.85)"}
                  />
                </TouchableOpacity>
              ) : (
                <View style={styles.modeSpacer} />
              )}
            </View>
          )
        })}
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          {toast ??
            t("prayedCount", {
              defaultValue: "{{done}} of 5 prayers marked",
              done: doneCount,
            })}
        </Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  widget: { paddingHorizontal: 16, paddingBottom: 22 },
  topRow: { flexDirection: "row", gap: 8, marginBottom: 14, flexWrap: "wrap" },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255,255,255,0.07)",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    maxWidth: "62%",
  },
  pillText: { color: "rgba(255,255,255,0.85)", fontSize: 12, fontWeight: "600" },

  week: { flexDirection: "row", justifyContent: "space-between", marginBottom: 14 },
  day: { alignItems: "center", paddingVertical: 6, paddingHorizontal: 4, borderRadius: 14, minWidth: 42 },
  daySelected: { backgroundColor: "rgba(255,255,255,0.09)" },
  dayFuture: { opacity: 0.45 },
  dayRing: { width: 34, height: 34, alignItems: "center", justifyContent: "center" },
  dayNum: { color: "rgba(255,255,255,0.75)", fontSize: 13, fontWeight: "700" },
  dayNumSelected: { color: "#fff" },
  dayName: { color: "rgba(255,255,255,0.5)", fontSize: 11, fontWeight: "600", marginTop: 4 },
  dayNameToday: { color: GOLD },

  nextCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(201,168,76,0.12)",
    borderWidth: 1,
    borderColor: "rgba(201,168,76,0.45)",
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  nextLabel: { color: GOLD_SOFT, fontSize: 11, fontWeight: "700", letterSpacing: 1, textTransform: "uppercase" },
  nextName: { color: "#fff", fontSize: 22, fontWeight: "700", marginTop: 2 },
  nextTime: { color: "#fff", fontSize: 26, fontWeight: "300", letterSpacing: 1 },
  nextIn: { color: GOLD_SOFT, fontSize: 12, fontWeight: "600", marginTop: 2 },

  pastBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 14,
    padding: 12,
    marginBottom: 12,
  },
  pastBannerText: { color: "rgba(255,255,255,0.85)", fontSize: 13, fontWeight: "500" },

  list: { gap: 8 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    minHeight: 56,
    paddingHorizontal: 12,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  rowNow: { backgroundColor: "rgba(201,168,76,0.14)", borderColor: GOLD },
  track: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.45)",
    alignItems: "center",
    justifyContent: "center",
  },
  trackDone: { backgroundColor: GOLD, borderColor: GOLD },
  trackLocked: { borderColor: "rgba(255,255,255,0.18)" },
  trackSpacer: { width: 26 },
  name: { color: "#fff", fontSize: 16, fontWeight: "600" },
  nameNow: { color: GOLD_SOFT },
  nowBadge: { backgroundColor: GOLD, borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2 },
  nowText: { color: NAVY_DEEP, fontSize: 11, fontWeight: "800" },
  time: { color: "#fff", fontSize: 16, fontWeight: "500", fontVariant: ["tabular-nums"] },
  timeNow: { color: GOLD_SOFT, fontWeight: "700" },
  modeBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  modeBtnOff: { backgroundColor: "rgba(255,255,255,0.04)" },
  modeSpacer: { width: 38 },

  sunriseRow: { flexDirection: "row", alignItems: "center", gap: 10, minHeight: 40, paddingHorizontal: 12 },
  sunriseName: { color: "rgba(255,255,255,0.6)", fontSize: 14, fontWeight: "500" },
  sunriseTime: { color: "rgba(255,255,255,0.6)", fontSize: 14, fontVariant: ["tabular-nums"] },

  footer: { marginTop: 12, alignItems: "center", minHeight: 18 },
  footerText: { color: "rgba(255,255,255,0.6)", fontSize: 12, fontWeight: "500" },
})
