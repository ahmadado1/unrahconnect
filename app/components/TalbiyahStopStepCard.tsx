import { useTheme } from "@/context/themeContext"
import { useCallback, useEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { Dimensions, StyleSheet, Text, View } from "react-native"
import Animated, {
  FadeInLeft,
  interpolateColor,
  runOnJS,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  type SharedValue,
} from "react-native-reanimated"

const PULSE_MS = 500

type Props = {
  scrollY: SharedValue<number>
}

export default function TalbiyahStopStepCard({ scrollY }: Props) {
  const { theme } = useTheme()
  const { t } = useTranslation()
  const [inView, setInView] = useState(false)
  const anchorRef = useRef<View>(null)

  const pulse = useSharedValue(0.3)

  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(1, { duration: PULSE_MS }),
        withTiming(0.3, { duration: PULSE_MS }),
      ),
      -1,
      false,
    )
  }, [pulse])

  const markInView = useCallback(() => {
    setInView((prev) => prev || true)
  }, [])

  const checkInView = useCallback(() => {
    if (inView) return
    anchorRef.current?.measureInWindow((_x, y, _w, h) => {
      const windowHeight = Dimensions.get("window").height
      if (y + h > 48 && y < windowHeight - 48) {
        markInView()
      }
    })
  }, [inView, markInView])

  useAnimatedReaction(
    () => scrollY.value,
    () => {
      runOnJS(checkInView)()
    },
    [checkInView],
  )

  const pulseStyle = useAnimatedStyle(() => ({
    borderColor: interpolateColor(
      pulse.value,
      [0.3, 1],
      ["rgba(217, 119, 6, 0.3)", "rgba(217, 119, 6, 1)"],
    ),
    shadowOpacity: pulse.value * 0.35,
  }))

  return (
    <View ref={anchorRef} onLayout={checkInView} style={styles.wrapper}>
      {inView ? (
        <Animated.View
          entering={FadeInLeft.duration(400).delay(100)}
          style={[
            styles.card,
            pulseStyle,
            { backgroundColor: theme.card, shadowColor: "#D97706" },
          ]}
        >
          <View style={styles.row}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>6</Text>
            </View>

            <View style={styles.content}>
              <View style={styles.titleRow}>
                <Text style={[styles.title, { color: theme.text }]}>
                  {t("phaseUmrah3Step6Title")}
                </Text>
                <View style={styles.pill}>
                  <Text style={styles.pillText}>{t("phaseUmrah3Step6Badge")}</Text>
                </View>
              </View>
              <Text style={[styles.body, { color: theme.textSecondary }]}>
                {t("phaseUmrah3Step6")}
              </Text>
            </View>
          </View>
        </Animated.View>
      ) : (
        <View style={[styles.placeholder, { borderColor: theme.border }]} />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  wrapper: { marginBottom: 12 },
  placeholder: {
    height: 100,
    borderRadius: 14,
    borderWidth: 0,
    opacity: 0,
  },
  card: {
    borderRadius: 14,
    borderWidth: 1.5,
    padding: 14,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 10,
    elevation: 4,
  },
  row: { flexDirection: "row", gap: 12, alignItems: "flex-start" },
  badge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#1E3A5F",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    marginTop: 2,
  },
  badgeText: { color: "#fff", fontSize: 12, fontWeight: "bold" },
  content: { flex: 1, gap: 8 },
  titleRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 8,
  },
  title: { fontSize: 15, fontWeight: "bold", flexShrink: 1 },
  pill: {
    backgroundColor: "rgba(217, 119, 6, 0.15)",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: "rgba(217, 119, 6, 0.4)",
  },
  pillText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#D97706",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  body: { fontSize: 14, lineHeight: 22 },
})
