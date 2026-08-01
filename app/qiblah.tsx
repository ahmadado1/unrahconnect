import { AppIcon, ICON_GOLD } from "@/components/AppIcon"
import { useTheme } from "@/context/themeContext"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { Ionicons } from "@expo/vector-icons"
import * as Location from "expo-location"
import { useRouter } from "expo-router"
import { StatusBar } from "expo-status-bar"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import {
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"

/** Precise Kaaba center (Masjid al-Haram), WGS84 */
const KAABA_LAT = 21.422487
const KAABA_LNG = 39.826206

const ALIGN_ENTER_DEG = 6
const ALIGN_EXIT_DEG = 12
const HEADING_SMOOTH = 0.18
const LOCATION_CACHE_KEY = "qibla_last_location"
const LOCATION_TIMEOUT_MS = 4000

function toRad(deg: number) {
  return (deg * Math.PI) / 180
}

function toDeg(rad: number) {
  return (rad * 180) / Math.PI
}

function normalize360(deg: number) {
  return ((deg % 360) + 360) % 360
}

/** Shortest signed delta from `from` to `to` in (-180, 180] */
function angleDelta(from: number, to: number) {
  return ((to - from + 540) % 360) - 180
}

function lerpAngle(from: number, to: number, t: number) {
  return from + angleDelta(from, to) * t
}

/** Great-circle initial bearing from user → Kaaba (degrees clockwise from true north) */
function calculateQiblahBearing(lat: number, lng: number): number {
  const φ1 = toRad(lat)
  const φ2 = toRad(KAABA_LAT)
  const Δλ = toRad(KAABA_LNG - lng)

  const y = Math.sin(Δλ) * Math.cos(φ2)
  const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ)

  return normalize360(toDeg(Math.atan2(y, x)))
}

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371.0088
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function pickHeading(data: Location.LocationHeadingObject): number | null {
  if (typeof data.trueHeading === "number" && data.trueHeading >= 0) {
    return data.trueHeading
  }
  if (typeof data.magHeading === "number" && data.magHeading >= 0) {
    return data.magHeading
  }
  return null
}

async function readCachedLocation(): Promise<{ latitude: number; longitude: number } | null> {
  try {
    const raw = await AsyncStorage.getItem(LOCATION_CACHE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (
      typeof parsed?.latitude === "number" &&
      typeof parsed?.longitude === "number" &&
      Number.isFinite(parsed.latitude) &&
      Number.isFinite(parsed.longitude)
    ) {
      return { latitude: parsed.latitude, longitude: parsed.longitude }
    }
  } catch {}
  return null
}

async function cacheLocation(latitude: number, longitude: number) {
  try {
    await AsyncStorage.setItem(
      LOCATION_CACHE_KEY,
      JSON.stringify({ latitude, longitude, savedAt: Date.now() })
    )
  } catch {}
}

async function getLocationFast(): Promise<{ latitude: number; longitude: number } | null> {
  // Prefer last known (works offline immediately)
  try {
    const last = await Location.getLastKnownPositionAsync()
    if (last?.coords) {
      return { latitude: last.coords.latitude, longitude: last.coords.longitude }
    }
  } catch {}

  // Fresh fix with a hard timeout so we never hang on loading
  try {
    const location = await Promise.race([
      Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
      new Promise<null>((resolve) => setTimeout(() => resolve(null), LOCATION_TIMEOUT_MS)),
    ])
    if (location?.coords) {
      return { latitude: location.coords.latitude, longitude: location.coords.longitude }
    }
  } catch {}

  return readCachedLocation()
}

export default function QiblahScreen() {
  const router = useRouter()
  const { theme } = useTheme()
  const insets = useSafeAreaInsets()
  const { t } = useTranslation()

  const [qiblahBearing, setQiblahBearing] = useState<number | null>(null)
  const [heading, setHeading] = useState(0)
  const [headingAccuracy, setHeadingAccuracy] = useState<number | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [distance, setDistance] = useState<number | null>(null)
  const [aligned, setAligned] = useState(false)
  const [usingTrueNorth, setUsingTrueNorth] = useState(true)
  const [usingCachedLocation, setUsingCachedLocation] = useState(false)

  const dialAnim = useRef(new Animated.Value(0)).current
  const lastDialRef = useRef(0)
  const smoothHeadingRef = useRef<number | null>(null)
  const headingSubRef = useRef<Location.LocationSubscription | null>(null)

  const stopHeadingWatch = useCallback(() => {
    headingSubRef.current?.remove()
    headingSubRef.current = null
  }, [])

  const animateDialTo = useCallback(
    (absoluteHeading: number) => {
      const targetRaw = -absoluteHeading
      const prev = lastDialRef.current
      const next = prev + angleDelta(normalize360(prev), normalize360(targetRaw))
      lastDialRef.current = next
      dialAnim.setValue(next)
    },
    [dialAnim]
  )

  const applyLocation = useCallback((latitude: number, longitude: number, fromCache: boolean) => {
    const bearing = calculateQiblahBearing(latitude, longitude)
    setQiblahBearing(bearing)
    setDistance(Math.round(haversineKm(latitude, longitude, KAABA_LAT, KAABA_LNG)))
    setUsingCachedLocation(fromCache)
    void cacheLocation(latitude, longitude)
  }, [])

  const startHeadingWatch = useCallback(async () => {
    stopHeadingWatch()
    try {
      headingSubRef.current = await Location.watchHeadingAsync(data => {
        const raw = pickHeading(data)
        if (raw === null) return

        setUsingTrueNorth(typeof data.trueHeading === "number" && data.trueHeading >= 0)
        if (typeof data.accuracy === "number") setHeadingAccuracy(data.accuracy)

        if (smoothHeadingRef.current === null) {
          smoothHeadingRef.current = raw
        } else {
          smoothHeadingRef.current = lerpAngle(smoothHeadingRef.current, raw, HEADING_SMOOTH)
        }

        const smoothed = normalize360(smoothHeadingRef.current)
        setHeading(smoothed)
        animateDialTo(smoothed)
      })
    } catch {
      // Compass may be unavailable on some simulators — still show bearing UI
    }
  }, [animateDialTo, stopHeadingWatch])

  const setupQiblah = useCallback(async () => {
    setLoading(true)
    setErrorMsg(null)
    stopHeadingWatch()
    smoothHeadingRef.current = null

    try {
      // Instant offline path: reuse last saved coords while permission / GPS catch up
      const cached = await readCachedLocation()
      if (cached) {
        applyLocation(cached.latitude, cached.longitude, true)
        setLoading(false)
        void startHeadingWatch()
      }

      const { status } = await Location.requestForegroundPermissionsAsync()
      if (status !== "granted") {
        if (!cached) {
          setErrorMsg(
            t("qiblaPermissionNeeded", {
              defaultValue: "Location permission is needed to find Qiblah direction",
            })
          )
        }
        setLoading(false)
        return
      }

      const coords = await getLocationFast()
      if (coords) {
        const isSameCache =
          cached &&
          Math.abs(cached.latitude - coords.latitude) < 0.0001 &&
          Math.abs(cached.longitude - coords.longitude) < 0.0001
        applyLocation(coords.latitude, coords.longitude, !!cached && !!isSameCache)
        setLoading(false)
        await startHeadingWatch()
        return
      }

      if (!cached) {
        setErrorMsg(
          t("qiblaLocationFailed", {
            defaultValue: "Could not get your location. Please try again.",
          })
        )
      }
      setLoading(false)
    } catch {
      const cachedFallback = await readCachedLocation()
      if (cachedFallback) {
        applyLocation(cachedFallback.latitude, cachedFallback.longitude, true)
        void startHeadingWatch()
      } else {
        setErrorMsg(
          t("qiblaLocationFailed", {
            defaultValue: "Could not get your location. Please try again.",
          })
        )
      }
      setLoading(false)
    }
  }, [applyLocation, startHeadingWatch, stopHeadingWatch, t])

  useEffect(() => {
    setupQiblah()
    return () => {
      stopHeadingWatch()
    }
  }, [setupQiblah, stopHeadingWatch])

  useEffect(() => {
    if (qiblahBearing === null) return
    const diff = Math.abs(angleDelta(heading, qiblahBearing))
    setAligned(prev => {
      if (prev) return diff < ALIGN_EXIT_DEG
      return diff < ALIGN_ENTER_DEG
    })
  }, [heading, qiblahBearing])

  const dialSpin = dialAnim.interpolate({
    inputRange: [-100000, 100000],
    outputRange: ["-100000deg", "100000deg"],
  })

  const accuracyLabel = useMemo(() => {
    if (headingAccuracy === null || headingAccuracy < 0) return null
    if (headingAccuracy <= 15) return { text: "High accuracy", color: "#2E8B57" }
    if (headingAccuracy <= 35) return { text: "Medium accuracy", color: "#C9A84C" }
    return { text: "Low accuracy — calibrate compass", color: "#E07A5F" }
  }, [headingAccuracy])

  const offsetDeg =
    qiblahBearing === null ? 0 : Math.round(angleDelta(heading, qiblahBearing))

  return (
    <View style={[styles.screen, { backgroundColor: theme.background }]}>
      <StatusBar style="light" />

      <View style={[styles.header, { paddingTop: insets.top }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color="#fff" />
          <Text style={styles.backText}>{t("home", { defaultValue: "Home" })}</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{t("qiblaDirection")}</Text>
        <Text style={styles.subtitle}>Find the direction to the Kaaba</Text>
      </View>

      <View style={styles.content}>
        {loading && qiblahBearing === null && (
          <Text style={[styles.statusText, { color: theme.textSecondary }]}>
            Finding your location...
          </Text>
        )}

        {errorMsg && qiblahBearing === null && (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle-outline" size={32} color="#C9A84C" />
            <Text style={[styles.errorText, { color: theme.text }]}>{errorMsg}</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={setupQiblah}>
              <Text style={styles.retryText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        )}

        {qiblahBearing !== null && (
          <>
            {usingCachedLocation && (
              <Text style={[styles.cacheHint, { color: theme.textSecondary }]}>
                Using last known location (works offline)
              </Text>
            )}

            {aligned ? (
              <View style={styles.alignedBadge}>
                <Ionicons name="checkmark-circle" size={18} color="#fff" />
                <Text style={styles.alignedText}>Facing Qiblah</Text>
              </View>
            ) : (
              <View style={styles.offsetBadge}>
                <Text style={[styles.offsetText, { color: theme.text }]}>
                  Turn {Math.abs(offsetDeg)}°{" "}
                  {offsetDeg > 0 ? "right" : offsetDeg < 0 ? "left" : ""}
                </Text>
              </View>
            )}

            <View style={styles.compassWrapper}>
              <View style={styles.topPointer}>
                <Ionicons name="caret-down" size={22} color="#C9A84C" />
              </View>

              <View
                style={[
                  styles.compassDial,
                  {
                    borderColor: aligned ? "#2E8B57" : theme.border,
                    backgroundColor: theme.card,
                  },
                ]}
              >
                <Animated.View
                  style={[styles.rose, { transform: [{ rotate: dialSpin }] }]}
                >
                  <Text style={[styles.cardinalN, { color: "#C9A84C" }]}>N</Text>
                  <Text style={[styles.cardinalE, { color: theme.textSecondary }]}>E</Text>
                  <Text style={[styles.cardinalS, { color: theme.textSecondary }]}>S</Text>
                  <Text style={[styles.cardinalW, { color: theme.textSecondary }]}>W</Text>

                  {Array.from({ length: 72 }, (_, i) => {
                    const deg = i * 5
                    const isMajor = deg % 30 === 0
                    return (
                      <View
                        key={deg}
                        style={[
                          styles.tick,
                          {
                            height: isMajor ? 12 : 6,
                            backgroundColor: isMajor ? "#C9A84C" : "rgba(201,168,76,0.35)",
                            transform: [{ rotate: `${deg}deg` }, { translateY: -128 }],
                          },
                        ]}
                      />
                    )
                  })}

                  <View
                    style={[
                      styles.kaabaArm,
                      { transform: [{ rotate: `${qiblahBearing}deg` }] },
                    ]}
                  >
                    <AppIcon name="kaaba" size={22} color={ICON_GOLD} />
                    <View style={styles.needleLine} />
                  </View>
                </Animated.View>

                <View style={[styles.centerDot, aligned && styles.centerDotAligned]} />
              </View>
            </View>

            <View style={styles.infoRow}>
              <View style={styles.infoCard}>
                <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>Qiblah</Text>
                <Text style={[styles.infoValue, { color: theme.text }]}>
                  {Math.round(qiblahBearing)}°
                </Text>
              </View>
              <View style={styles.infoCard}>
                <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>Heading</Text>
                <Text style={[styles.infoValue, { color: theme.text }]}>
                  {Math.round(heading)}°
                </Text>
              </View>
              <View style={styles.infoCard}>
                <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>Distance</Text>
                <Text style={[styles.infoValue, { color: theme.text }]}>
                  {distance?.toLocaleString()} km
                </Text>
              </View>
            </View>

            {accuracyLabel && (
              <Text style={[styles.accuracyText, { color: accuracyLabel.color }]}>
                {accuracyLabel.text}
                {!usingTrueNorth ? " · magnetic north" : " · true north"}
              </Text>
            )}

            <Text style={[styles.hint, { color: theme.textSecondary }]}>
              Hold your phone flat. Rotate until the Kaaba lines up with the gold marker at the top.
              If the compass drifts, wave your phone in a figure-8 to recalibrate.
            </Text>

            <TouchableOpacity style={styles.recalibrateBtn} onPress={setupQiblah}>
              <Ionicons name="refresh" size={16} color="#C9A84C" />
              <Text style={styles.recalibrateText}>Recalibrate</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1 },

  header: { backgroundColor: "#1E3A5F", paddingBottom: 24 },
  backBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 12,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  backText: { color: "rgba(255,255,255,0.6)", fontSize: 14 },
  title: { color: "#fff", fontSize: 26, fontWeight: "bold", paddingHorizontal: 20, marginBottom: 4 },
  subtitle: { color: "#C9A84C", fontSize: 13, paddingHorizontal: 20 },

  content: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },

  statusText: { fontSize: 14 },
  cacheHint: { fontSize: 12, marginBottom: 10, fontStyle: "italic" },

  errorBox: { alignItems: "center", gap: 12, padding: 24 },
  errorText: { fontSize: 14, textAlign: "center" },
  retryBtn: {
    backgroundColor: "#C9A84C",
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 20,
    marginTop: 8,
  },
  retryText: { color: "#0F2440", fontWeight: "700", fontSize: 14 },

  alignedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#2E8B57",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 16,
  },
  alignedText: { color: "#fff", fontWeight: "700", fontSize: 13 },
  offsetBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 16,
    backgroundColor: "rgba(201,168,76,0.12)",
  },
  offsetText: { fontWeight: "600", fontSize: 13 },

  compassWrapper: { marginBottom: 28, alignItems: "center" },
  topPointer: { marginBottom: 2, zIndex: 2 },
  compassDial: {
    width: 280,
    height: 280,
    borderRadius: 140,
    borderWidth: 2.5,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  rose: {
    width: 280,
    height: 280,
    alignItems: "center",
    justifyContent: "center",
  },
  cardinalN: { position: "absolute", top: 18, fontSize: 16, fontWeight: "800" },
  cardinalE: { position: "absolute", right: 18, fontSize: 14, fontWeight: "600" },
  cardinalS: { position: "absolute", bottom: 18, fontSize: 14, fontWeight: "600" },
  cardinalW: { position: "absolute", left: 18, fontSize: 14, fontWeight: "600" },

  tick: {
    position: "absolute",
    width: 2,
    left: 139,
    top: 140,
    marginTop: -6,
    borderRadius: 1,
  },

  kaabaArm: {
    position: "absolute",
    width: 280,
    height: 280,
    alignItems: "center",
    justifyContent: "flex-start",
    paddingTop: 28,
  },
  needleLine: {
    width: 3,
    height: 78,
    backgroundColor: "#C9A84C",
    marginTop: 2,
    borderRadius: 2,
  },

  centerDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "#1E3A5F",
    borderWidth: 2,
    borderColor: "#C9A84C",
    position: "absolute",
  },
  centerDotAligned: {
    backgroundColor: "#2E8B57",
    borderColor: "#fff",
  },

  infoRow: { flexDirection: "row", gap: 8, marginBottom: 12 },
  infoCard: { alignItems: "center", paddingHorizontal: 12, minWidth: 72 },
  infoLabel: { fontSize: 11, marginBottom: 4 },
  infoValue: { fontSize: 17, fontWeight: "700" },

  accuracyText: { fontSize: 12, fontWeight: "600", marginBottom: 10 },
  hint: { fontSize: 12, textAlign: "center", paddingHorizontal: 20, lineHeight: 18 },

  recalibrateBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 16,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  recalibrateText: { color: "#C9A84C", fontWeight: "600", fontSize: 13 },
})
