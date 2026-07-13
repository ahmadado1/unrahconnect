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
import { useCallback, useEffect, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import {
  ActivityIndicator,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  type LayoutChangeEvent,
} from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import Svg, {
  Circle,
  Defs,
  Ellipse,
  G,
  LinearGradient,
  Path,
  Rect,
  Stop,
} from "react-native-svg"

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

function formatPrayerClock(time: string | undefined) {
  if (!time) return "--:--"
  const match = time.match(/(\d{1,2}):(\d{2})/)
  if (!match) return time
  return `${match[1].padStart(2, "0")}:${match[2]}`
}

function MosqueIllustration() {
  return (
    <Svg width="220" height="168" viewBox="0 0 220 168">
      <Defs>
        <LinearGradient id="domeGrad" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0%" stopColor="#7A9BC4" stopOpacity="0.95" />
          <Stop offset="100%" stopColor="#4A6F9A" stopOpacity="0.9" />
        </LinearGradient>
        <LinearGradient id="bodyGrad" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0%" stopColor="#5A7FA8" stopOpacity="0.9" />
          <Stop offset="100%" stopColor="#3A5A82" stopOpacity="0.85" />
        </LinearGradient>
        <LinearGradient id="doorGrad" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0%" stopColor="#1E3A5F" />
          <Stop offset="100%" stopColor="#0F2440" />
        </LinearGradient>
      </Defs>

      {/* Soft ground glow */}
      <Ellipse cx="110" cy="158" rx="78" ry="8" fill="#C9A84C" opacity="0.2" />

      {/* Left minaret */}
      <G>
        <Rect x="28" y="52" width="14" height="96" rx="3" fill="url(#bodyGrad)" />
        <Rect x="25" y="48" width="20" height="8" rx="2" fill="#8AABD0" opacity="0.95" />
        <Rect x="31" y="22" width="8" height="28" rx="2" fill="url(#bodyGrad)" />
        <Path d="M31 22 Q35 8 39 22 Z" fill="#9BB8D8" />
        <Circle cx="35" cy="10" r="2.5" fill="#C9A84C" />
        <Rect x="30" y="70" width="10" height="6" rx="1" fill="#FFFFFF" opacity="0.3" />
        <Rect x="30" y="90" width="10" height="6" rx="1" fill="#FFFFFF" opacity="0.3" />
      </G>

      {/* Right minaret */}
      <G>
        <Rect x="178" y="52" width="14" height="96" rx="3" fill="url(#bodyGrad)" />
        <Rect x="175" y="48" width="20" height="8" rx="2" fill="#8AABD0" opacity="0.95" />
        <Rect x="181" y="22" width="8" height="28" rx="2" fill="url(#bodyGrad)" />
        <Path d="M181 22 Q185 8 189 22 Z" fill="#9BB8D8" />
        <Circle cx="185" cy="10" r="2.5" fill="#C9A84C" />
        <Rect x="180" y="70" width="10" height="6" rx="1" fill="#FFFFFF" opacity="0.3" />
        <Rect x="180" y="90" width="10" height="6" rx="1" fill="#FFFFFF" opacity="0.3" />
      </G>

      {/* Side wings */}
      <Path
        d="M48 98 L48 148 L80 148 L80 88 Q64 78 48 98 Z"
        fill="url(#bodyGrad)"
      />
      <Path
        d="M172 98 L172 148 L140 148 L140 88 Q156 78 172 98 Z"
        fill="url(#bodyGrad)"
      />

      {/* Main dome */}
      <Path d="M68 92 Q110 18 152 92 Z" fill="url(#domeGrad)" />
      <Path
        d="M108 28 Q110 14 112 28"
        stroke="#C9A84C"
        strokeWidth="2"
        fill="none"
        opacity="0.85"
      />
      <Circle cx="110" cy="14" r="3" fill="#C9A84C" />

      {/* Crescent */}
      <Path
        d="M110 6 C106 2 112 -2 114 4 C111 2 109 4 110 6 Z"
        fill="#C9A84C"
        opacity="0.95"
      />

      {/* Main body */}
      <Rect x="68" y="90" width="84" height="58" rx="4" fill="url(#bodyGrad)" />

      {/* Facade arches row */}
      {[78, 96, 124, 142].map((x, i) => (
        <Path
          key={i}
          d={`M${x} 118 Q${x + 7} 104 ${x + 14} 118 L${x + 14} 132 L${x} 132 Z`}
          fill="#FFFFFF"
          opacity="0.22"
        />
      ))}

      {/* Ornate central door */}
      <Path
        d="M96 148 L96 118 Q110 96 124 118 L124 148 Z"
        fill="url(#doorGrad)"
      />
      <Path
        d="M100 146 L100 120 Q110 104 120 120 L120 146 Z"
        fill="none"
        stroke="#C9A84C"
        strokeWidth="1.5"
        opacity="0.9"
      />
      <Path
        d="M104 144 L104 122 Q110 110 116 122 L116 144 Z"
        fill="none"
        stroke="#E8D5A8"
        strokeWidth="1"
        opacity="0.55"
      />
      <Circle cx="117" cy="132" r="1.8" fill="#C9A84C" />
    </Svg>
  )
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
  const [screenSize, setScreenSize] = useState({ width: 400, height: 800 })

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

  const onScreenLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout
    if (width > 0 && height > 0) setScreenSize({ width, height })
  }

  useEffect(() => {
    if (!visible || !prayerName) return

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

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
      <View style={styles.screen} onLayout={onScreenLayout}>
        <Svg
          style={StyleSheet.absoluteFill}
          width={screenSize.width}
          height={screenSize.height}
          viewBox={`0 0 ${screenSize.width} ${screenSize.height}`}
          preserveAspectRatio="none"
        >
          <Defs>
            <LinearGradient id="popupBg" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0%" stopColor="#1E3A5F" />
              <Stop offset="100%" stopColor="#0F2440" />
            </LinearGradient>
          </Defs>
          <Rect x="0" y="0" width={screenSize.width} height={screenSize.height} fill="url(#popupBg)" />
        </Svg>

        <View style={styles.glowTop} pointerEvents="none" />
        <View style={styles.glowBottom} pointerEvents="none" />

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
              <View style={styles.timeGlow} pointerEvents="none" />
              <Text style={styles.prayerTime}>{formatPrayerClock(prayerTime)}</Text>
            </View>
          </View>

          {/* Mosque */}
          <View style={styles.mosqueWrap}>
            <MosqueIllustration />
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
    </Modal>
  )
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#1E3A5F",
  },
  glowTop: {
    position: "absolute",
    top: -20,
    left: "15%",
    right: "15%",
    height: 160,
    borderRadius: 100,
    backgroundColor: "rgba(201,168,76,0.12)",
  },
  glowBottom: {
    position: "absolute",
    bottom: -40,
    left: "5%",
    right: "5%",
    height: 140,
    borderRadius: 80,
    backgroundColor: "rgba(15,36,64,0.6)",
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
  timeGlow: {
    position: "absolute",
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: "rgba(201,168,76,0.15)",
  },
  prayerTime: {
    fontSize: 56,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: 1,
    textShadowColor: "rgba(201,168,76,0.35)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 18,
  },
  mosqueWrap: {
    alignItems: "center",
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
