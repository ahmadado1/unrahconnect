import { Ionicons } from "@expo/vector-icons"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { useAudioPlayer } from "expo-audio"
import * as Location from "expo-location"
import { useEffect, useState } from "react"
import { Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native"
import Svg, { Circle, Defs, Ellipse, G, Pattern, Polygon, Rect } from "react-native-svg"


// ─── CONSTANTS ───────────────────────────────────────────────────────────────

const PRAYER_NAMES = ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"]

const PRAYER_ICONS: Record<string, string> = {
  Fajr: "partly-sunny-outline",
  Dhuhr: "sunny-outline",
  Asr: "sunny-outline",
  Maghrib: "cloudy-night-outline",
  Isha: "moon-outline",
}

// ─── TYPES ───────────────────────────────────────────────────────────────────

type PrayerTimes = {
  Fajr: string
  Dhuhr: string
  Asr: string
  Maghrib: string
  Isha: string
  date: string
  hijri: string
  city: string
}

// ─── PRAYER INFO ─────────────────────────────────────────────────────────────

const PRAYER_INFO: Record<string, {
  arabic: string
  dua: string
  duaTranslit: string
  duaTranslation: string
}> = {
  Fajr: {
    arabic: "صلاة الفجر",
    dua: "اللَّهُمَّ بَاعِدْ بَيْنِي وَبَيْنَ خَطَايَايَ كَمَا بَاعَدْتَ بَيْنَ الْمَشْرِقِ وَالْمَغْرِبِ",
    duaTranslit: "Allahumma ba'id bayni wa bayna khatayaya kama ba'adta baynal mashriqi wal maghrib",
    duaTranslation: "O Allah distance me from my sins as You have distanced the East from the West"
  },
  Dhuhr: {
    arabic: "صلاة الظهر",
    dua: "اللَّهُمَّ اجْعَلْنِي مِنَ التَّوَّابِينَ وَاجْعَلْنِي مِنَ الْمُتَطَهِّرِينَ",
    duaTranslit: "Allahumma aj'alni minat-tawwabina waj'alni minal mutatahhirin",
    duaTranslation: "O Allah make me among those who repent and make me among those who purify themselves"
  },
  Asr: {
    arabic: "صلاة العصر",
    dua: "اللَّهُمَّ إِنِّي أَعُوذُ بِكَ مِنَ الْهَمِّ وَالْحَزَنِ وَالْعَجْزِ وَالْكَسَلِ",
    duaTranslit: "Allahumma inni a'udhu bika minal hammi wal hazan wal ajzi wal kasal",
    duaTranslation: "O Allah I seek refuge in You from worry, grief, inability and laziness"
  },
  Maghrib: {
    arabic: "صلاة المغرب",
    dua: "اللَّهُمَّ إِنِّي أَسْأَلُكَ رَحْمَتَكَ وَمَغْفِرَتَكَ",
    duaTranslit: "Allahumma inni as'aluka rahmataka wa maghfirataka",
    duaTranslation: "O Allah I ask You for Your mercy and Your forgiveness"
  },
  Isha: {
    arabic: "صلاة العشاء",
    dua: "اللَّهُمَّ اجْعَلْ فِي قَلْبِي نُوراً وَفِي لِسَانِي نُوراً",
    duaTranslit: "Allahumma aj'al fi qalbi nuran wa fi lisani nura",
    duaTranslation: "O Allah place light in my heart and light on my tongue"
  },
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────

const timeToMinutes = (time: string) => {
  const [h, m] = time.split(":").map(Number)
  return h * 60 + m
}

const formatCountdown = (minutes: number) => {
  const h = Math.floor(minutes / 60)
  const m = Math.floor(minutes % 60)
  return `${h}:${m.toString().padStart(2, "0")}`
}

// ─── ISLAMIC PATTERN SVG ─────────────────────────────────────────────────────

const IslamicPatternSVG = () => (
  <Svg
    style={StyleSheet.absoluteFill}
    viewBox="0 0 400 900"
    preserveAspectRatio="xMidYMid slice"
  >
    <Defs>
      <Pattern id="islamic_prayer" x="0" y="0" width="60" height="60" patternUnits="userSpaceOnUse">
        <Polygon points="30,5 55,17.5 55,42.5 30,55 5,42.5 5,17.5" fill="none" stroke="#C9A84C" strokeWidth="1" opacity="0.2" />
        <Polygon points="30,12 48,22 48,38 30,48 12,38 12,22" fill="none" stroke="#C9A84C" strokeWidth="1" opacity="0.2" />
        <Circle cx="30" cy="30" r="6" fill="none" stroke="#C9A84C" strokeWidth="1" opacity="0.2" />
      </Pattern>
    </Defs>
    <Rect x="-120" y="-120" width="800" height="1140" fill="url(#islamic_prayer)" />
  </Svg>
)

// ─── GEOMETRIC FLOWER SVG ────────────────────────────────────────────────────

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

// ─── COMPONENT ───────────────────────────────────────────────────────────────

export default function PrayerWidget() {
  const [prayerTimes, setPrayerTimes] = useState<PrayerTimes | null>(null)
  const [currentTime, setCurrentTime] = useState(new Date())
  const [loading, setLoading] = useState(true)
  const [prayerPopup, setPrayerPopup] = useState<string | null>(null)
  const [shownPopups, setShownPopups] = useState<Set<string>>(new Set())
  const [adhanFile, setAdhanFile] = useState(require("../../assets/audio/azan1.mp3"))
const player = useAudioPlayer(adhanFile)

useEffect(() => {
  AsyncStorage.getItem("selected_adhan").then(id => {
    const files: Record<string, any> = {
      "1": require("../../assets/audio/azan1.mp3"),
      "2": require("../../assets/audio/azan2.mp3"),
      "3": require("../../assets/audio/azan3.mp3"),
      "4": require("../../assets/audio/azan4.mp3"),
      "5": require("../../assets/audio/azan5.mp3"),
    }
    if (id && files[id]) setAdhanFile(files[id])
  })
}, [])

  useEffect(() => { fetchPrayerTimes() }, [])

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    if (!prayerTimes) return
    const interval = setInterval(() => {
      const now = new Date()
      const nowStr = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`
      for (const name of PRAYER_NAMES) {
        const prayerTime = prayerTimes[name as keyof PrayerTimes] as string
        if (prayerTime === nowStr && !shownPopups.has(name)) {
          setPrayerPopup(name)
          setShownPopups(prev => new Set([...prev, name]))
          playAdhan()
          break
        }
      }
    }, 30000)
    return () => clearInterval(interval)
  }, [prayerTimes, shownPopups])

  // ─── PLAY ADHAN ──────────────────────────────────────────────────────────

  const playAdhan = () => {
    try {
      player.seekTo(0)
      player.play()
    } catch (e) {
      console.log("Adhan sound error:", e)
    }
  }

  // ─── FETCH ───────────────────────────────────────────────────────────────

  const fetchPrayerTimes = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync()
      let lat = 21.3891
      let lng = 39.8579
      let city = "Makkah"

      if (status === "granted") {
        const location = await Location.getCurrentPositionAsync({})
        lat = location.coords.latitude
        lng = location.coords.longitude
        const geocode = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng })
        city = geocode[0]?.city || geocode[0]?.region || "Your location"
      }

      const today = new Date()
      const res = await fetch(
        `https://api.aladhan.com/v1/timings/${today.getDate()}-${today.getMonth() + 1}-${today.getFullYear()}?latitude=${lat}&longitude=${lng}&method=4`
      )
      const data = await res.json()

      if (data.code === 200) {
        const timings = data.data.timings
        const hijriDate = data.data.date.hijri
        setPrayerTimes({
          Fajr: timings.Fajr,
          Dhuhr: timings.Dhuhr,
          Asr: timings.Asr,
          Maghrib: timings.Maghrib,
          Isha: timings.Isha,
          date: `${hijriDate.day} ${hijriDate.month.en} ${hijriDate.year} AH`,
          hijri: hijriDate.month.en,
          city,
        })
      }
    } catch (e) {
      console.log("Prayer times error:", e)
    } finally {
      setLoading(false)
    }
  }

  // ─── PRAYER LOGIC ────────────────────────────────────────────────────────

  const nowMinutes = currentTime.getHours() * 60 + currentTime.getMinutes()

  const getNextPrayer = () => {
    if (!prayerTimes) return null
    for (const name of PRAYER_NAMES) {
      const prayerMin = timeToMinutes(prayerTimes[name as keyof PrayerTimes] as string)
      if (prayerMin > nowMinutes) {
        return { name, time: prayerTimes[name as keyof PrayerTimes] as string, minutesLeft: prayerMin - nowMinutes }
      }
    }
    return { name: "Fajr", time: prayerTimes!.Fajr, minutesLeft: (24 * 60 - nowMinutes) + timeToMinutes(prayerTimes!.Fajr) }
  }

  const nextPrayer = getNextPrayer()

  const getPrayerStatus = (name: string) => {
    if (!prayerTimes) return "upcoming"
    const prayerMin = timeToMinutes(prayerTimes[name as keyof PrayerTimes] as string)
    if (nextPrayer?.name === name) return "next"
    if (prayerMin < nowMinutes) return "past"
    return "upcoming"
  }

  // ─── RENDER ──────────────────────────────────────────────────────────────

  return (
    <>
      {/* ── PRAYER WIDGET ── */}
      <View style={styles.widget}>

        {/* Top row */}
        <View style={styles.topRow}>
          <Text style={styles.prayerLabel}>PRAYER TIMES</Text>
          <View style={styles.separatorV} />
          {prayerTimes && (
            <View style={styles.locationRow}>
              <Ionicons name="location" size={11} color="#C9A84C" />
              <Text style={styles.locationText}>{prayerTimes.city}</Text>
            </View>
          )}
        </View>

        {/* Hijri date */}
        {prayerTimes && (
          <View style={styles.hijriBadge}>
            <Ionicons name="calendar-outline" size={11} color="#C9A84C" />
            <Text style={styles.hijriText}>{prayerTimes.date}</Text>
          </View>
        )}

        {loading ? (
          <Text style={styles.loadingText}>Getting prayer times...</Text>
        ) : prayerTimes ? (
          <>
            {/* Next prayer box */}
            {nextPrayer && (
              <View style={styles.nextPrayerBox}>
                <View>
                  <Text style={styles.nextLabel}>NEXT — {nextPrayer.name.toUpperCase()}</Text>
                  <Text style={styles.nextTime}>{nextPrayer.time}</Text>
                </View>
                <GeometricFlower />
                <View style={{ alignItems: "flex-end" }}>
                  <Text style={styles.countdownLabel}>Time remaining</Text>
                  <Text style={styles.countdown}>{formatCountdown(nextPrayer.minutesLeft)}</Text>
                </View>
              </View>
            )}

            {/* Prayers list */}
            <View style={styles.prayersList}>
              {PRAYER_NAMES.map(name => {
                const status = getPrayerStatus(name)
                return (
                  <View key={name} style={[
                    styles.prayerRow,
                    status === "next" && styles.prayerRowNext,
                    status === "past" && styles.prayerRowPast,
                  ]}>
                    <View style={styles.prayerLeft}>
                      <Ionicons
                        name={PRAYER_ICONS[name] as any}
                        size={16}
                        color={status === "next" ? "#C9A84C" : status === "past" ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.5)"}
                      />
                      <Text style={[
                        styles.prayerName,
                        status === "past" && styles.prayerNamePast,
                        status === "next" && styles.prayerNameNext,
                      ]}>{name}</Text>
                    </View>
                    <View style={styles.prayerRight}>
                      <Text style={[
                        styles.prayerTime,
                        status === "past" && styles.prayerTimePast,
                        status === "next" && styles.prayerTimeNext,
                      ]}>
                        {prayerTimes[name as keyof PrayerTimes] as string}
                      </Text>
                      {status === "past" ? (
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

        {/* Test button — remove before launch */}
        

      </View>

      {/* ── PRAYER POPUP ── */}
      <Modal visible={prayerPopup !== null} transparent animationType="slide" statusBarTranslucent>
        <View style={styles.popupOverlay}>
          <View style={styles.popupCard}>
            <IslamicPatternSVG />
            <Text style={styles.popupMosque}>🕌</Text>
            <Text style={styles.popupArabic}>{prayerPopup ? PRAYER_INFO[prayerPopup]?.arabic : ""}</Text>
            <Text style={styles.popupTitle}>It's time for {prayerPopup}</Text>
            <View style={styles.popupDivider} />
            <Text style={styles.popupDuaLabel}>Dua before prayer</Text>
            <Text style={styles.popupDuaArabic}>{prayerPopup ? PRAYER_INFO[prayerPopup]?.dua : ""}</Text>
            <Text style={styles.popupDuaTranslit}>{prayerPopup ? PRAYER_INFO[prayerPopup]?.duaTranslit : ""}</Text>
            <Text style={styles.popupDuaTranslation}>{prayerPopup ? PRAYER_INFO[prayerPopup]?.duaTranslation : ""}</Text>

            <TouchableOpacity style={styles.popupBtn} onPress={() => {
              player.pause()
              setPrayerPopup(null)
            }}>
              <Text style={styles.popupBtnText}>I'm going to pray</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.popupBtnSecondary} onPress={() => {
              player.pause()
              const snoozed = prayerPopup
              setPrayerPopup(null)
              setTimeout(() => setPrayerPopup(snoozed), 5 * 60 * 1000)
            }}>
              <Text style={styles.popupBtnSecondaryText}>Remind me in 5 minutes</Text>
            </TouchableOpacity>

          </View>
        </View>
      </Modal>
    </>
  )
}

// ─── STYLES ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  widget: { padding: 16, paddingBottom: 24, overflow: "hidden", position: "relative" },

  topRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 10 },
  prayerLabel: { color: "#C9A84C", fontSize: 11, fontWeight: "700", letterSpacing: 1.2, textTransform: "uppercase" },
  separatorV: { width: 1, height: 12, backgroundColor: "rgba(201,168,76,0.4)" },
  locationRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  locationText: { color: "rgba(255,255,255,0.7)", fontSize: 11 },

  hijriBadge: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "rgba(201,168,76,0.1)", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5, alignSelf: "flex-start", marginBottom: 14, borderWidth: 0.5, borderColor: "rgba(201,168,76,0.3)" },
  hijriText: { color: "#C9A84C", fontSize: 11, fontWeight: "500" },

  loadingText: { color: "rgba(255,255,255,0.4)", fontSize: 13, textAlign: "center", paddingVertical: 20 },

  nextPrayerBox: { backgroundColor: "rgba(10,20,40,0.5)", borderWidth: 1, borderColor: "rgba(201,168,76,0.35)", borderRadius: 16, padding: 16, marginBottom: 16, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  nextLabel: { color: "#C9A84C", fontSize: 10, fontWeight: "700", letterSpacing: 1, marginBottom: 4 },
  nextTime: { color: "#fff", fontSize: 32, fontWeight: "300", letterSpacing: 2 },
  countdownLabel: { color: "rgba(255,255,255,0.4)", fontSize: 10, marginBottom: 4, textAlign: "right" },
  countdown: { color: "#C9A84C", fontSize: 18, fontWeight: "600" },

  prayersList: { gap: 2 },
  prayerRow: { 
    flexDirection: "row", justifyContent: "space-between", alignItems: "center", 
    paddingVertical: 10, paddingHorizontal: 14, borderRadius: 12,
    backgroundColor: "rgba(10,20,40,0.5)",  // add this — dark backing behind each row
    marginBottom: 2,
  },
  prayerRowNext: { backgroundColor: "rgba(201,168,76,0.15)", borderWidth: 0.5, borderColor: "rgba(201,168,76,0.4)" },
  prayerRowPast: { opacity: 0.45 },
  prayerLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  prayerName: { fontSize: 14, fontWeight: "500", color: "#fff" },
  prayerNamePast: { color: "rgba(255,255,255,0.3)" },
  prayerNameNext: { color: "#C9A84C", fontWeight: "600" },
  prayerRight: { flexDirection: "row", alignItems: "center", gap: 10 },
  prayerTime: { fontSize: 14, color: "rgba(255,255,255,0.9)" }, 
  prayerTimePast: { color: "rgba(255,255,255,0.25)" },
  prayerTimeNext: { color: "#C9A84C", fontWeight: "600" },
  checkCircle: { width: 18, height: 18, borderRadius: 9, borderWidth: 0.5, borderColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center" },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "rgba(255,255,255,0.2)" },
  dotNext: { backgroundColor: "#C9A84C" },



  popupOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.85)", justifyContent: "flex-end" },
  popupCard: { backgroundColor: "#1E3A5F", borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 36, paddingBottom: 52, paddingTop: 48, width: "100%", alignItems: "center", borderWidth: 1, borderColor: "rgba(201,168,76,0.3)", borderBottomWidth: 0, overflow: "hidden", minHeight: "85%" },
  popupMosque: { fontSize: 80, marginBottom: 20 },
  popupArabic: { fontSize: 32, color: "#C9A84C", marginBottom: 10, textAlign: "center" },
  popupTitle: { fontSize: 26, fontWeight: "bold", color: "#fff", marginBottom: 24, textAlign: "center" },
  popupDivider: { width: 80, height: 1, backgroundColor: "rgba(201,168,76,0.4)", marginBottom: 24 },
  popupDuaLabel: { fontSize: 11, color: "#C9A84C", fontWeight: "600", letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 16 },
  popupDuaArabic: { fontSize: 20, color: "#fff", textAlign: "right", lineHeight: 36, marginBottom: 14, width: "100%" },
  popupDuaTranslit: { fontSize: 14, color: "#C9A84C", fontStyle: "italic", textAlign: "center", marginBottom: 10, lineHeight: 22 },
  popupDuaTranslation: { fontSize: 14, color: "rgba(255,255,255,0.6)", textAlign: "center", lineHeight: 22, marginBottom: 32 },
  popupBtn: { backgroundColor: "#C9A84C", borderRadius: 25, paddingVertical: 16, width: "100%", alignItems: "center", marginBottom: 14 },
  popupBtnText: { color: "#1E3A5F", fontSize: 16, fontWeight: "bold" },
  popupBtnSecondary: { paddingVertical: 12, alignItems: "center" },
  popupBtnSecondaryText: { color: "rgba(255,255,255,0.5)", fontSize: 14 },
})