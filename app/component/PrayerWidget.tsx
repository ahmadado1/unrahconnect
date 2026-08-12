import { PRAYER_ICONS, PRAYER_NAMES } from "@/lib/prayerConstants"
import { fetchAndCachePrayerTimes, readCachedPrayerTimes, timeToMinutes, type CachedPrayerTimes } from "@/lib/prayerTimes"
import { Ionicons } from "@expo/vector-icons"
import { useTranslation } from "react-i18next"
import { useEffect, useState } from "react"
import { StyleSheet, Text, View } from "react-native"
import Svg, { Circle, Ellipse, G } from "react-native-svg"

type PrayerTimes = CachedPrayerTimes

/** Display order includes Sunrise (Shuruq) as a non-prayer marker after Fajr. */
const PRAYER_DISPLAY_ROWS = [
  "Fajr",
  "Sunrise",
  "Dhuhr",
  "Asr",
  "Maghrib",
  "Isha",
] as const

type DisplayRow = (typeof PRAYER_DISPLAY_ROWS)[number]

const PRAYER_NAME_KEYS: Record<Exclude<DisplayRow, "Sunrise">, string> = {
  Fajr: "prayerNameFajr",
  Dhuhr: "prayerNameDhuhr",
  Asr: "prayerNameAsr",
  Maghrib: "prayerNameMaghrib",
  Isha: "prayerNameIsha",
}

const formatCountdown = (minutes: number) => {
  const h = Math.floor(minutes / 60)
  const m = Math.floor(minutes % 60)
  return `${h}:${m.toString().padStart(2, "0")}`
}

const GeometricFlower = () => (
  <Svg width="60" height="60" viewBox="0 0 60 60">
    <G transform="translate(30,30)">
      {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => (
        <G key={i} transform={`rotate(${angle})`}>
          <Ellipse cx="0" cy="-12" rx="4" ry="8" fill="none" stroke="#C9A84C" strokeWidth="0.8" opacity="0.8" />
        </G>
      ))}
      <Circle cx="0" cy="0" r="4" fill="none" stroke="#C9A84C" strokeWidth="0.8" opacity="0.8" />
      <Circle cx="0" cy="0" r="1.5" fill="#C9A84C" opacity="0.8" />
    </G>
  </Svg>
)

export default function PrayerWidget() {
  const { t } = useTranslation()
  const [prayerTimes, setPrayerTimes] = useState<PrayerTimes | null>(null)
  const [currentTime, setCurrentTime] = useState(new Date())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const cached = await readCachedPrayerTimes()
      if (cached) setPrayerTimes(cached)

      const fresh = await fetchAndCachePrayerTimes()
      if (fresh) setPrayerTimes(fresh)
      setLoading(false)
    }

    load()
  }, [])

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const nowMinutes = currentTime.getHours() * 60 + currentTime.getMinutes()

  const getNextPrayer = () => {
    if (!prayerTimes) return null
    for (const name of PRAYER_NAMES) {
      const prayerMin = timeToMinutes(prayerTimes[name])
      if (prayerMin > nowMinutes) {
        return { name, time: prayerTimes[name], minutesLeft: prayerMin - nowMinutes }
      }
    }
    return {
      name: "Fajr",
      time: prayerTimes.Fajr,
      minutesLeft: 24 * 60 - nowMinutes + timeToMinutes(prayerTimes.Fajr),
    }
  }

  const nextPrayer = getNextPrayer()

  const getPrayerStatus = (name: DisplayRow) => {
    if (!prayerTimes) return "upcoming"
    const timeValue =
      name === "Sunrise" ? prayerTimes.Sunrise : prayerTimes[name as (typeof PRAYER_NAMES)[number]]
    if (!timeValue) return "upcoming"
    const prayerMin = timeToMinutes(timeValue)
    if (name === "Sunrise") {
      return prayerMin < nowMinutes ? "past" : "upcoming"
    }
    if (prayerMin <= nowMinutes && nowMinutes <= prayerMin + 5) return "next"
    if (nextPrayer?.name === name) return "next"
    if (prayerMin < nowMinutes) return "past"
    return "upcoming"
  }

  const getCurrentPrayer = () => {
    if (!prayerTimes) return null
    for (const name of PRAYER_NAMES) {
      const prayerMin = timeToMinutes(prayerTimes[name])
      if (prayerMin <= nowMinutes && nowMinutes <= prayerMin + 5) {
        return { name, time: prayerTimes[name] }
      }
    }
    return null
  }

  const currentPrayer = getCurrentPrayer()

  const prayerLabel = (name: DisplayRow) => {
    if (name === "Sunrise") return t("sunrise", { defaultValue: "Sunrise" })
    return t(PRAYER_NAME_KEYS[name], { defaultValue: name })
  }

  return (
    <View style={styles.widget}>
      <View style={styles.topRow}>
        <Text style={styles.prayerLabel}>{t("prayerTimes")}</Text>
        <View style={styles.separatorV} />
        {prayerTimes && (
          <View style={styles.locationRow}>
            <Ionicons name="location" size={11} color="#C9A84C" />
            <Text style={styles.locationText}>{prayerTimes.city}</Text>
          </View>
        )}
      </View>

      {prayerTimes && (
        <View style={styles.hijriBadge}>
          <Ionicons name="calendar-outline" size={11} color="#C9A84C" />
          <Text style={styles.hijriText}>{prayerTimes.date}</Text>
        </View>
      )}

      {loading ? (
        <Text style={styles.loadingText}>{t("gettingPrayerTimes")}</Text>
      ) : prayerTimes ? (
        <>
          {nextPrayer && (
            <View style={styles.nextPrayerBox}>
              <View>
                <Text style={styles.nextLabel}>
                  {currentPrayer
                    ? `${t("currentPrayer")} — ${prayerLabel(currentPrayer.name)}`
                    : `${t("nextPrayer")} — ${prayerLabel(nextPrayer.name)}`}
                </Text>
                <Text style={styles.nextTime}>
                  {currentPrayer ? currentPrayer.time : nextPrayer.time}
                </Text>
              </View>
              <GeometricFlower />
              <View style={{ alignItems: "flex-end" }}>
                <Text style={styles.countdownLabel}>{t("timeRemaining")}</Text>
                <Text style={styles.countdown}>{formatCountdown(nextPrayer.minutesLeft)}</Text>
              </View>
            </View>
          )}

          <View style={styles.prayersList}>
            {PRAYER_DISPLAY_ROWS.map(name => {
              const timeValue =
                name === "Sunrise" ? prayerTimes.Sunrise : prayerTimes[name]
              if (!timeValue) return null
              const status = getPrayerStatus(name)
              const isSunrise = name === "Sunrise"
              return (
                <View
                  key={name}
                  style={[
                    styles.prayerRow,
                    status === "next" && styles.prayerRowNext,
                    status === "past" && styles.prayerRowPast,
                    isSunrise && styles.prayerRowSunrise,
                  ]}
                >
                  <View style={styles.prayerLeft}>
                    <Ionicons
                      name={
                        isSunrise
                          ? "sunny-outline"
                          : (PRAYER_ICONS[name as (typeof PRAYER_NAMES)[number]] as any)
                      }
                      size={16}
                      color={
                        isSunrise
                          ? "rgba(201,168,76,0.55)"
                          : status === "next"
                            ? "#C9A84C"
                            : status === "past"
                              ? "rgba(255,255,255,0.25)"
                              : "rgba(255,255,255,0.5)"
                      }
                    />
                    <Text
                      style={[
                        styles.prayerName,
                        status === "past" && styles.prayerNamePast,
                        status === "next" && styles.prayerNameNext,
                        isSunrise && styles.prayerNameSunrise,
                      ]}
                    >
                      {prayerLabel(name)}
                    </Text>
                  </View>
                  <View style={styles.prayerRight}>
                    <Text
                      style={[
                        styles.prayerTime,
                        status === "past" && styles.prayerTimePast,
                        status === "next" && styles.prayerTimeNext,
                        isSunrise && styles.prayerTimeSunrise,
                      ]}
                    >
                      {timeValue}
                    </Text>
                    {isSunrise ? (
                      <View style={styles.sunriseMark}>
                        <Ionicons name="ellipse-outline" size={10} color="rgba(201,168,76,0.45)" />
                      </View>
                    ) : status === "past" ? (
                      <View style={styles.checkCircle}>
                        <Ionicons name="checkmark" size={10} color="rgba(255,255,255,0.4)" />
                      </View>
                    ) : (
                      <View style={[styles.dot, status === "next" && styles.dotNext]} />
                    )}
                  </View>
                </View>
              )
            })}
          </View>
        </>
      ) : (
        <Text style={styles.loadingText}>Could not load prayer times</Text>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  widget: { padding: 16, paddingBottom: 24, overflow: "hidden", position: "relative" },
  topRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 10 },
  prayerLabel: { color: "#C9A84C", fontSize: 11, fontWeight: "700", letterSpacing: 1.2, textTransform: "uppercase" },
  separatorV: { width: 1, height: 12, backgroundColor: "rgba(201,168,76,0.4)" },
  locationRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  locationText: { color: "rgba(255,255,255,0.7)", fontSize: 11 },
  hijriBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(201,168,76,0.1)",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    alignSelf: "flex-start",
    marginBottom: 14,
    borderWidth: 0.5,
    borderColor: "rgba(201,168,76,0.3)",
  },
  hijriText: { color: "#C9A84C", fontSize: 11, fontWeight: "500" },
  loadingText: { color: "rgba(255,255,255,0.4)", fontSize: 13, textAlign: "center", paddingVertical: 20 },
  nextPrayerBox: {
    backgroundColor: "rgba(0,0,0,0.7)",
    borderWidth: 1,
    borderColor: "rgba(201,168,76,0.5)",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  nextLabel: { color: "#C9A84C", fontSize: 10, fontWeight: "700", letterSpacing: 1, marginBottom: 4 },
  nextTime: { color: "#fff", fontSize: 32, fontWeight: "300", letterSpacing: 2 },
  countdownLabel: { color: "rgba(255,255,255,0.4)", fontSize: 10, marginBottom: 4, textAlign: "right" },
  countdown: { color: "#C9A84C", fontSize: 18, fontWeight: "600" },
  prayersList: { gap: 2 },
  prayerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: "rgba(0,0,0,0.6)",
    marginBottom: 2,
  },
  prayerRowNext: { backgroundColor: "rgba(201,168,76,0.15)", borderWidth: 0.5, borderColor: "rgba(201,168,76,0.4)" },
  prayerRowPast: { opacity: 0.45 },
  prayerRowSunrise: {
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 0.5,
    borderColor: "rgba(201,168,76,0.18)",
    borderStyle: "dashed",
  },
  prayerLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  prayerName: { fontSize: 14, fontWeight: "500", color: "#fff" },
  prayerNamePast: { color: "rgba(255,255,255,0.3)" },
  prayerNameNext: { color: "#C9A84C", fontWeight: "600" },
  prayerNameSunrise: { color: "rgba(255,255,255,0.55)", fontWeight: "400", fontStyle: "italic" },
  prayerRight: { flexDirection: "row", alignItems: "center", gap: 10 },
  prayerTime: { fontSize: 14, color: "rgba(255,255,255,0.9)" },
  prayerTimePast: { color: "rgba(255,255,255,0.25)" },
  prayerTimeNext: { color: "#C9A84C", fontWeight: "600" },
  prayerTimeSunrise: { color: "rgba(255,255,255,0.45)" },
  checkCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 0.5,
    borderColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  sunriseMark: {
    width: 18,
    height: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "rgba(255,255,255,0.2)" },
  dotNext: { backgroundColor: "#C9A84C" },
})
