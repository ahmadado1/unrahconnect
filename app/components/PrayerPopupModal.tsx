import { PRAYER_INFO, type PrayerName } from "@/lib/prayerConstants"
import { readCachedPrayerTimes } from "@/lib/prayerTimes"
import {
  getWeekStatusesForPrayer,
  isPrayerMarked,
  markPrayerCompleted,
  type DayPrayerStatus,
} from "@/lib/prayerTracker"
import { Ionicons } from "@expo/vector-icons"
import { useRouter } from "expo-router"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import {
  ActivityIndicator,
  ImageBackground,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  type ImageSourcePropType,
} from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"

type PrayerPopupModalProps = {
  visible: boolean
  prayerName: PrayerName | null
  onDismiss: () => void
  onSnooze: () => void
}

const PRAYER_I18N_KEYS: Record<PrayerName, string> = {
  Fajr: "prayerNameFajr",
  Dhuhr: "prayerNameDhuhr",
  Asr: "prayerNameAsr",
  Maghrib: "prayerNameMaghrib",
  Isha: "prayerNameIsha",
}

const LOCAL_MOSQUE_IMAGE = require("../../assets/images/prayer-mosque.jpg")

/** Remote backups — Unsplash mosque / masjid photos */
const MOSQUE_IMAGE_URLS = [
  "https://images.unsplash.com/photo-1519817650390-64a93db51149?w=800&q=80&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1542379653-b928db2b757b?w=800&q=80&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1564769662533-4f00a87b4056?w=800&q=80&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1573408301185-9519eb9de7b1?w=800&q=80&auto=format&fit=crop",
]

function formatPrayerClock(time: string | undefined) {
  if (!time) return "--:--"
  const match = time.match(/(\d{1,2}):(\d{2})/)
  if (!match) return time
  return `${match[1].padStart(2, "0")}:${match[2]}`
}

function StatusGlyph({ status }: { status: DayPrayerStatus }) {
  if (status === "completed") {
    return <Text style={[styles.statusGlyph, { color: "#3DDC84" }]}>✓</Text>
  }
  if (status === "missed") {
    return <Text style={[styles.statusGlyph, { color: "#FF6B6B" }]}>✗</Text>
  }
  if (status === "today") {
    return (
      <View style={styles.todayRing}>
        <View style={styles.todayRingInner} />
      </View>
    )
  }
  return <Text style={[styles.statusGlyph, { color: "rgba(255,255,255,0.35)" }]}>—</Text>
}

export default function PrayerPopupModal({
  visible,
  prayerName,
  onDismiss,
  onSnooze,
}: PrayerPopupModalProps) {
  const { t, i18n } = useTranslation()
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const [prayerTime, setPrayerTime] = useState<string>("")
  const [weekStatuses, setWeekStatuses] = useState<
    { date: Date; status: DayPrayerStatus }[]
  >([])
  const [marking, setMarking] = useState(false)
  const [alreadyMarked, setAlreadyMarked] = useState(false)
  const [bgSource, setBgSource] = useState<ImageSourcePropType>(LOCAL_MOSQUE_IMAGE)
  const remoteIndexRef = useRef(0)

  const info = prayerName ? PRAYER_INFO[prayerName] : null

  const dayLabels = useMemo(() => {
    const locale = i18n.language || "en"
    return weekStatuses.map(({ date }) =>
      date.toLocaleDateString(locale, { weekday: "short" }).replace(/\.$/, "").slice(0, 3)
    )
  }, [weekStatuses, i18n.language])

  const refreshWeek = useCallback(async (name: PrayerName) => {
    const [statuses, marked] = await Promise.all([
      getWeekStatusesForPrayer(name),
      isPrayerMarked(name),
    ])
    setWeekStatuses(statuses)
    setAlreadyMarked(marked)
  }, [])

  useEffect(() => {
    if (!visible || !prayerName) return

    // Prefer bundled mosque image; remotes are fallback only
    remoteIndexRef.current = 0
    setBgSource(LOCAL_MOSQUE_IMAGE)

    let cancelled = false
    ;(async () => {
      const times = await readCachedPrayerTimes()
      if (!cancelled && times) setPrayerTime(times[prayerName] ?? "")
      if (!cancelled) await refreshWeek(prayerName)
    })()

    return () => {
      cancelled = true
    }
  }, [visible, prayerName, refreshWeek])

  const displayName = prayerName
    ? t(PRAYER_I18N_KEYS[prayerName], { defaultValue: prayerName })
    : ""

  const handleMarkPrayed = async () => {
    if (!prayerName || marking) return
    setMarking(true)
    try {
      await markPrayerCompleted(prayerName)
      setAlreadyMarked(true)
      await refreshWeek(prayerName)
    } finally {
      setMarking(false)
    }
  }

  const navigateAfterClose = (path: "/quran" | "/qiblah") => {
    onDismiss()
    setTimeout(() => router.push(path), 180)
  }

  const handleImageError = () => {
    if (remoteIndexRef.current >= MOSQUE_IMAGE_URLS.length) return
    const uri = MOSQUE_IMAGE_URLS[remoteIndexRef.current]
    remoteIndexRef.current += 1
    setBgSource({ uri })
  }

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
      <ImageBackground
        source={bgSource}
        style={styles.screen}
        resizeMode="cover"
        onError={handleImageError}
      >
        <View style={styles.overlay}>
          <View
            style={[
              styles.content,
              { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 20 },
            ]}
          >
            {/* Top bar — Mark as Prayed (small pill, top right) */}
            <View style={styles.topBar}>
              <TouchableOpacity onPress={onSnooze} hitSlop={12} style={styles.snoozeHit}>
                <Ionicons name="time-outline" size={18} color="rgba(255,255,255,0.55)" />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.markPill, alreadyMarked && styles.markPillDone]}
                onPress={handleMarkPrayed}
                activeOpacity={0.85}
                disabled={marking || alreadyMarked}
              >
                {marking ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.markPillText}>
                    {alreadyMarked ? `✓ ${t("markAsPrayed")}` : t("markAsPrayed")}
                  </Text>
                )}
              </TouchableOpacity>
            </View>

            {/* Prayer name + time */}
            <View style={styles.headerBlock}>
              <Text style={styles.prayerArabic}>{info?.arabic ?? ""}</Text>
              <Text style={styles.prayerName}>{displayName}</Text>
              <View style={styles.timeWrap}>
                <Text style={styles.prayerTime}>{formatPrayerClock(prayerTime)}</Text>
              </View>
            </View>

            {/* Week row */}
            <View style={styles.weekRow}>
              {weekStatuses.map((item, i) => {
                const isToday = item.date.toDateString() === new Date().toDateString()
                return (
                  <View key={i} style={styles.dayCol}>
                    <View style={[styles.dayLabelWrap, isToday && styles.dayLabelToday]}>
                      <Text style={[styles.dayLabel, isToday && styles.dayLabelTodayText]}>
                        {dayLabels[i] ?? ""}
                      </Text>
                    </View>
                    <StatusGlyph status={item.status} />
                  </View>
                )
              })}
            </View>

            {/* Actions */}
            <View style={styles.actionsBlock}>
              <TouchableOpacity style={styles.prayNowBtn} onPress={onDismiss} activeOpacity={0.9}>
                <Text style={styles.prayNowText}>{t("prayNow")}</Text>
              </TouchableOpacity>

              <View style={styles.navRow}>
                <TouchableOpacity
                  style={styles.navBtn}
                  onPress={() => navigateAfterClose("/quran")}
                  activeOpacity={0.85}
                >
                  <Ionicons name="book-outline" size={18} color="#FFFFFF" />
                  <Text style={styles.navBtnText}>{t("quran")}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.navBtn}
                  onPress={() => navigateAfterClose("/qiblah")}
                  activeOpacity={0.85}
                >
                  <Ionicons name="compass-outline" size={18} color="#FFFFFF" />
                  <Text style={styles.navBtnText}>{t("qibla")}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </ImageBackground>
    </Modal>
  )
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#0F2440",
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(15, 36, 64, 0.75)",
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    alignItems: "center",
    justifyContent: "space-between",
  },
  topBar: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  snoozeHit: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  markPill: {
    backgroundColor: "#2E9E5B",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    minHeight: 34,
    justifyContent: "center",
  },
  markPillDone: {
    backgroundColor: "rgba(46,158,91,0.55)",
  },
  markPillText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },
  prayerArabic: {
    fontSize: 22,
    color: "rgba(255,255,255,0.75)",
    textAlign: "center",
    marginBottom: 4,
  },
  prayerName: {
    fontSize: 28,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: 0.4,
    textAlign: "center",
  },
  headerBlock: {
    width: "100%",
    alignItems: "center",
  },
  timeWrap: {
    marginTop: 10,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 80,
  },
  prayerTime: {
    fontSize: 56,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: 1,
    textShadowColor: "rgba(0,0,0,0.35)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 8,
  },
  weekRow: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 2,
  },
  dayCol: {
    alignItems: "center",
    width: 40,
    gap: 6,
  },
  dayLabelWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  dayLabelToday: {
    backgroundColor: "rgba(201,168,76,0.25)",
    borderWidth: 1.5,
    borderColor: "#C9A84C",
  },
  dayLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "rgba(255,255,255,0.7)",
  },
  dayLabelTodayText: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  statusGlyph: {
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 18,
  },
  todayRing: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: "#3DDC84",
    alignItems: "center",
    justifyContent: "center",
  },
  todayRingInner: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "transparent",
  },
  actionsBlock: {
    width: "100%",
    gap: 12,
  },
  prayNowBtn: {
    width: "100%",
    backgroundColor: "#C9A84C",
    borderRadius: 22,
    paddingVertical: 16,
    alignItems: "center",
  },
  prayNowText: {
    color: "#0F2440",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  navRow: {
    width: "100%",
    flexDirection: "row",
    gap: 10,
  },
  navBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "rgba(15, 36, 64, 0.85)",
    borderRadius: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  navBtnText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
})
