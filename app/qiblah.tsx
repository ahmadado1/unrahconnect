import { useTheme } from "@/context/themeContext"
import { Ionicons } from "@expo/vector-icons"
import * as Location from "expo-location"
import { useRouter } from "expo-router"
import { StatusBar } from "expo-status-bar"
import { useEffect, useRef, useState } from "react"
import { Animated, StyleSheet, Text, TouchableOpacity, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"

const KAABA_LAT = 21.4225
const KAABA_LNG = 39.8262

function calculateQiblahBearing(lat: number, lng: number): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180
  const toDeg = (rad: number) => (rad * 180) / Math.PI

  const lat1 = toRad(lat)
  const lat2 = toRad(KAABA_LAT)
  const deltaLng = toRad(KAABA_LNG - lng)

  const y = Math.sin(deltaLng) * Math.cos(lat2)
  const x =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(deltaLng)

  let bearing = toDeg(Math.atan2(y, x))
  bearing = (bearing + 360) % 360
  return bearing
}

export default function QiblahScreen() {
  const router = useRouter()
  const { theme } = useTheme()
  const insets = useSafeAreaInsets()

  const [qiblahBearing, setQiblahBearing] = useState<number | null>(null)
  const [heading, setHeading] = useState(0)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [distance, setDistance] = useState<number | null>(null)

  const rotateAnim = useRef(new Animated.Value(0)).current
  const headingSubscriptionRef = useRef<Location.LocationSubscription | null>(null)

  useEffect(() => {
    setupQiblah()
    return () => {
      headingSubscriptionRef.current?.remove()
    }
  }, [])

  const setupQiblah = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync()
      if (status !== "granted") {
        setErrorMsg("Location permission is needed to find Qiblah direction")
        setLoading(false)
        return
      }

      const location = await Location.getCurrentPositionAsync({})
      const { latitude, longitude } = location.coords

      const bearing = calculateQiblahBearing(latitude, longitude)
      setQiblahBearing(bearing)

      const dist = calculateDistance(latitude, longitude, KAABA_LAT, KAABA_LNG)
      setDistance(dist)

      headingSubscriptionRef.current = await Location.watchHeadingAsync((data) => {
        const h = data.trueHeading >= 0 ? data.trueHeading : data.magHeading
        setHeading(h)
      })

      setLoading(false)
    } catch (e) {
      setErrorMsg("Could not get your location. Please try again.")
      setLoading(false)
    }
  }

  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number) => {
    const toRad = (deg: number) => (deg * Math.PI) / 180
    const R = 6371
    const dLat = toRad(lat2 - lat1)
    const dLng = toRad(lng2 - lng1)
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return Math.round(R * c)
  }

  const lastRotationRef = useRef(0)

useEffect(() => {
  if (qiblahBearing === null) return

  let rotation = qiblahBearing - heading

  // Normalize to -180 to 180 relative to last rotation to avoid spin-around glitch
  const prev = lastRotationRef.current
  let delta = rotation - prev
  delta = ((delta + 180) % 360 + 360) % 360 - 180
  const target = prev + delta

  lastRotationRef.current = target

  Animated.timing(rotateAnim, {
    toValue: target,
    duration: 200,
    useNativeDriver: true,
  }).start()
}, [heading, qiblahBearing])

  const isAligned = () => {
    if (qiblahBearing === null) return false
    const diff = Math.abs(((qiblahBearing - heading + 540) % 360) - 180)
    return diff < 8
  }

  const spin = rotateAnim.interpolate({
    inputRange: [-100000, 100000],
    outputRange: ["-100000deg", "100000deg"],
  })

  return (
    <View style={[styles.screen, { backgroundColor: theme.background }]}>
      <StatusBar style="light" />

      <View style={[styles.header, { paddingTop: insets.top }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color="#fff" />
          <Text style={styles.backText}>Home</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Qiblah Direction</Text>
        <Text style={styles.subtitle}>Find the direction to the Kaaba</Text>
      </View>

      <View style={styles.content}>
        {loading && (
          <Text style={[styles.statusText, { color: theme.textSecondary }]}>
            Finding your location...
          </Text>
        )}

        {errorMsg && (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle-outline" size={32} color="#C9A84C" />
            <Text style={[styles.errorText, { color: theme.text }]}>{errorMsg}</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={setupQiblah}>
              <Text style={styles.retryText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        )}

        {!loading && !errorMsg && qiblahBearing !== null && (
          <>
            {isAligned() && (
              <View style={styles.alignedBadge}>
                <Ionicons name="checkmark-circle" size={18} color="#fff" />
                <Text style={styles.alignedText}>Facing Qiblah</Text>
              </View>
            )}

            <View style={styles.compassWrapper}>
              <View style={[styles.compassDial, { borderColor: theme.border }]}>
                <Text style={[styles.cardinalN, { color: theme.text }]}>N</Text>
                <Text style={[styles.cardinalE, { color: theme.textSecondary }]}>E</Text>
                <Text style={[styles.cardinalS, { color: theme.textSecondary }]}>S</Text>
                <Text style={[styles.cardinalW, { color: theme.textSecondary }]}>W</Text>

                <Animated.View
                  style={[
                    styles.needleContainer,
                    { transform: [{ rotate: spin }] },
                  ]}
                >
                  <View style={styles.needleTop}>
                    <Text style={styles.kaabaIcon}>🕋</Text>
                  </View>
                  <View style={styles.needleLine} />
                </Animated.View>

                <View style={styles.centerDot} />
              </View>
            </View>

            <View style={styles.infoRow}>
              <View style={styles.infoCard}>
                <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>Qiblah Bearing</Text>
                <Text style={[styles.infoValue, { color: theme.text }]}>
                  {Math.round(qiblahBearing)}°
                </Text>
              </View>
              <View style={styles.infoCard}>
                <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>Distance to Kaaba</Text>
                <Text style={[styles.infoValue, { color: theme.text }]}>
                  {distance?.toLocaleString()} km
                </Text>
              </View>
            </View>

            <Text style={[styles.hint, { color: theme.textSecondary }]}>
              Hold your phone flat and rotate until the Kaaba icon points up
            </Text>
          </>
        )}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1 },

  header: { backgroundColor: "#1E3A5F", paddingBottom: 24 },
  backBtn: { flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 12, paddingHorizontal: 20, paddingTop: 16 },
  backText: { color: "rgba(255,255,255,0.6)", fontSize: 14 },
  title: { color: "#fff", fontSize: 26, fontWeight: "bold", paddingHorizontal: 20, marginBottom: 4 },
  subtitle: { color: "#C9A84C", fontSize: 13, paddingHorizontal: 20 },

  content: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },

  statusText: { fontSize: 14 },

  errorBox: { alignItems: "center", gap: 12, padding: 24 },
  errorText: { fontSize: 14, textAlign: "center" },
  retryBtn: { backgroundColor: "#C9A84C", paddingHorizontal: 24, paddingVertical: 10, borderRadius: 20, marginTop: 8 },
  retryText: { color: "#fff", fontWeight: "600", fontSize: 14 },

  alignedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#2E8B57",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 24,
  },
  alignedText: { color: "#fff", fontWeight: "700", fontSize: 13 },

  compassWrapper: { marginBottom: 32 },
  compassDial: {
    width: 280,
    height: 280,
    borderRadius: 140,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  cardinalN: { position: "absolute", top: 12, fontSize: 16, fontWeight: "700" },
  cardinalE: { position: "absolute", right: 16, fontSize: 14, fontWeight: "500" },
  cardinalS: { position: "absolute", bottom: 12, fontSize: 16, fontWeight: "500" },
  cardinalW: { position: "absolute", left: 16, fontSize: 14, fontWeight: "500" },

  needleContainer: {
    width: 280,
    height: 280,
    alignItems: "center",
    justifyContent: "flex-start",
    position: "absolute",
  },
  needleTop: { marginTop: 20, alignItems: "center" },
  kaabaIcon: { fontSize: 36 },
  needleLine: {
    width: 3,
    height: 100,
    backgroundColor: "#C9A84C",
    marginTop: 4,
    borderRadius: 2,
  },

  centerDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#1E3A5F",
    position: "absolute",
  },

  infoRow: { flexDirection: "row", gap: 12, marginBottom: 20 },
  infoCard: { alignItems: "center", paddingHorizontal: 20 },
  infoLabel: { fontSize: 12, marginBottom: 4 },
  infoValue: { fontSize: 18, fontWeight: "700" },

  hint: { fontSize: 12, textAlign: "center", paddingHorizontal: 32, fontStyle: "italic" },
})