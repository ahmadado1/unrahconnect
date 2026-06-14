import { useTheme } from "@/context/themeContext";
import i18n from "@/i18n";
import { schedulePrayerNotifications } from "@/lib/notifications";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Location from "expo-location";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Image, Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { supabase } from "../../lib/supabase";
import DrawerMenu from "../component/DrawerMenu";




// ─── BOOKING CARD ────────────────────────────────────────────────────────────

function BookingCard({ booking, theme }: { booking: any; theme: any }) {
  const { t } = useTranslation()
  const today = new Date().toISOString().split("T")[0]
  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
  const getStatus = () => {
    if (booking.check_in > today) return { label: "Upcoming", color: "#2D6A4F" }
    if (booking.check_out >= today) return { label: "Active", color: "#C9A84C" }
    return { label: "Past", color: "#888" }
  }
  const status = getStatus()

  return (
    <View style={[bookingStyles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
      <View style={bookingStyles.cardTop}>
        <View style={{ flex: 1 }}>
          <Text style={[bookingStyles.hotelName, { color: theme.text }]}>{booking.hotel_name}</Text>
          <Text style={[bookingStyles.city, { color: theme.textSecondary }]}>{booking.hotel_city}</Text>
        </View>
        <View style={[bookingStyles.statusBadge, { backgroundColor: status.color + "22" }]}>
          <Text style={[bookingStyles.statusText, { color: status.color }]}>{status.label}</Text>
        </View>
      </View>
      <View style={[bookingStyles.divider, { backgroundColor: theme.border }]} />
      <View style={bookingStyles.details}>
        <View style={bookingStyles.detailItem}>
          <Text style={[bookingStyles.detailLabel, { color: theme.textSecondary }]}>{t("checkIn")}</Text>
          <Text style={[bookingStyles.detailValue, { color: theme.text }]}>{formatDate(booking.check_in)}</Text>
        </View>
        <View style={bookingStyles.detailItem}>
          <Text style={[bookingStyles.detailLabel, { color: theme.textSecondary }]}>{t("checkOut")}</Text>
          <Text style={[bookingStyles.detailValue, { color: theme.text }]}>{formatDate(booking.check_out)}</Text>
        </View>
        <View style={bookingStyles.detailItem}>
          <Text style={[bookingStyles.detailLabel, { color: theme.textSecondary }]}>{t("total")}</Text>
          <Text style={[bookingStyles.detailValue, { color: "#C9A84C" }]}>${booking.total_price}</Text>
        </View>
      </View>
      <Text style={[bookingStyles.nights, { color: theme.textSecondary }]}>
        {booking.nights} {booking.nights === 1 ? "night" : "nights"} · {booking.guests} {booking.guests === 1 ? "guest" : "guests"}
      </Text>
    </View>
  )
}

// ─── GLANCE CARD ─────────────────────────────────────────────────────────────

function GlanceCard({ icon, label, value, sub, theme }: { icon: string; label: string; value: string; sub: string; theme: any }) {
  return (
    <View style={[glanceStyles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
      <View style={glanceStyles.iconBox}>
        <Ionicons name={icon as any} size={18} color="#C9A84C" />
      </View>
      <Text style={[glanceStyles.label, { color: theme.textSecondary }]}>{label}</Text>
      <Text style={[glanceStyles.value, { color: theme.text }]}>{value}</Text>
      <Text style={glanceStyles.sub}>{sub}</Text>
    </View>
  )
}

// ─── JOURNEY CARD ────────────────────────────────────────────────────────────

function JourneyCard({ emoji, title, sub, onPress, theme }: { emoji: string; title: string; sub: string; onPress: () => void; theme: any }) {
  return (
    <TouchableOpacity style={[journeyStyles.card, { backgroundColor: theme.card, borderColor: theme.border }]} onPress={onPress}>
      <Text style={journeyStyles.emoji}>{emoji}</Text>
      <Text style={[journeyStyles.title, { color: theme.text }]}>{title}</Text>
      <Text style={journeyStyles.sub}>{sub}</Text>
    </TouchableOpacity>
  )
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────

const PRAYER_NAMES = ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"]

const timeToMinutes = (time: string) => {
  const [h, m] = time.split(":").map(Number)
  return h * 60 + m
}

const getWeatherCondition = (code: number) => {
  if (code === 0) return "Sunny"
  if (code <= 3) return "Partly cloudy"
  if (code <= 48) return "Foggy"
  if (code <= 67) return "Rainy"
  if (code <= 77) return "Snowy"
  if (code <= 82) return "Showers"
  return "Stormy"
}

// ─── HOME SCREEN ─────────────────────────────────────────────────────────────

export default function HomeScreen() {
  const router = useRouter()
  const { theme } = useTheme()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [ayah, setAyah] = useState("Loading verse...")
  const [ayahRef, setAyahRef] = useState("")
  const [userName, setUserName] = useState("")
  const [bookings, setBookings] = useState<any[]>([])
  const insets = useSafeAreaInsets()
  const { t } = useTranslation()

  // Location-based data
  const [hijriDate, setHijriDate] = useState({ day: "--", month: "---", year: "----" })
  const [weather, setWeather] = useState({ temp: "--°C", condition: "Loading" })
  const [nextPrayer, setNextPrayer] = useState({ name: "---", time: "--:--" })

  // Fetch user name
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) setUserName(user.user_metadata?.full_name?.split(" ")[0] || "")
    }
    getUser()
  }, [])

  // Fetch verse of the day
  useEffect(() => {
  const VERSE_KEY = "cached_verse"
  const VERSE_DATE_KEY = "cached_verse_date"

  const getVerseEdition = () => {
    switch(i18n.language) {
      case "fr": return "fr.hamidullah"
      case "ur": return "ur.jalandhry"
      case "tr": return "tr.diyanet"
      case "ar": return "ar.muyassar"
      default: return "en.asad"
    }
  }

  const fetchVerse = async () => {
    // Show cached verse immediately
    try {
      const cachedVerse = await AsyncStorage.getItem(VERSE_KEY)
      const cachedDate = await AsyncStorage.getItem(VERSE_DATE_KEY)
      const today = new Date().toISOString().split("T")[0]

      if (cachedVerse && cachedDate === today) {
        const v = JSON.parse(cachedVerse)
        setAyah(v.text)
        setAyahRef(v.ref)
        return // Don't fetch if we already have today's verse
      }
    } catch (e) {}

    // Fetch new verse
    try {
      const randomVerse = Math.floor(Math.random() * 6236) + 1
      const res = await fetch(`https://api.alquran.cloud/v1/ayah/${randomVerse}/${getVerseEdition()}`)
      const data = await res.json()
      if (data.code === 200) {
        const text = `"${data.data.text}"`
        const ref = `Quran — ${data.data.surah.englishName} ${data.data.numberInSurah}`
        setAyah(text)
        setAyahRef(ref)
        const today = new Date().toISOString().split("T")[0]
        await AsyncStorage.setItem(VERSE_KEY, JSON.stringify({ text, ref }))
        await AsyncStorage.setItem(VERSE_DATE_KEY, today)
      }
    } catch (e) {
      setAyah("In the name of Allah, the Most Gracious, the Most Merciful.")
      setAyahRef("Quran — 1:1")
    }
  }

  fetchVerse()
}, [])

  // Fetch location-based data: prayer times, hijri date, weather
  useEffect(() => {
  const CACHE_KEY = "home_location_data"

  const fetchLocationData = async () => {
    // ── Load cache immediately ──
    try {
      const cached = await AsyncStorage.getItem(CACHE_KEY)
      if (cached) {
        const c = JSON.parse(cached)
        setHijriDate(c.hijriDate)
        setWeather(c.weather)
        setNextPrayer(c.nextPrayer)
      }
    } catch (e) {}

    // ── Fetch fresh in background ──
    try {
      const { status } = await Location.requestForegroundPermissionsAsync()
      let lat = 21.3891
      let lng = 39.8579

      if (status === "granted") {
        const location = await Location.getCurrentPositionAsync({})
        lat = location.coords.latitude
        lng = location.coords.longitude
      }

      const today = new Date()
      const pRes = await fetch(
        `https://api.aladhan.com/v1/timings/${today.getDate()}-${today.getMonth() + 1}-${today.getFullYear()}?latitude=${lat}&longitude=${lng}&method=4`
      )
      const pData = await pRes.json()

      if (pData.code === 200) {
        const h = pData.data.date.hijri
        const newHijri = { day: h.day, month: h.month.en, year: h.year }
        setHijriDate(newHijri)

        const timings = pData.data.timings
        const nowMinutes = today.getHours() * 60 + today.getMinutes()
        let newNextPrayer = { name: "Fajr", time: timings.Fajr }
        for (const name of PRAYER_NAMES) {
          const prayerMin = timeToMinutes(timings[name])
          if (prayerMin > nowMinutes) {
            newNextPrayer = { name, time: timings[name] }
            break
          }
        }
        setNextPrayer(newNextPrayer)

        const notifEnabled = await AsyncStorage.getItem("notifications_enabled")
        if (notifEnabled !== "false") {
          schedulePrayerNotifications({
            fajr: timings.Fajr, dhuhr: timings.Dhuhr,
            asr: timings.Asr, maghrib: timings.Maghrib, isha: timings.Isha,
          }).catch(e => console.log("Prayer notification error:", e))
        }

        // ── Weather ──
        try {
          const wRes = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,weathercode`
          )
          const wData = await wRes.json()
          const temp = Math.round(wData.current.temperature_2m)
          const condition = getWeatherCondition(wData.current.weathercode)
          const newWeather = { temp: `${temp}°C`, condition }
          setWeather(newWeather)

          // ── Save to cache ──
          await AsyncStorage.setItem(CACHE_KEY, JSON.stringify({
            hijriDate: newHijri,
            weather: newWeather,
            nextPrayer: newNextPrayer,
          }))
        } catch (e) {}
      }
    } catch (e) {
      console.log("Location data error:", e)
    }
  }

  fetchLocationData()
}, [])

  // Fetch bookings
  useEffect(() => {
    const fetchBookings = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase
        .from("bookings")
        .select("*")
        .eq("user_id", user.id)
        .order("check_in", { ascending: true })
      if (data) setBookings(data)
    }
    fetchBookings()
  }, [])

  const today = new Date().toISOString().split("T")[0]
  const upcoming = bookings.filter(b => b.check_in >= today)
  const past = bookings.filter(b => b.check_in < today)

  const hour = new Date().getHours()
  const timeGreeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening"

  return (
    <View style={[styles.screen, { backgroundColor: theme.background }]}>
      <StatusBar style="light" />

      

        {/* ── HEADER ── */}
        <View style={[styles.header, { paddingTop: insets.top }]}>
          <View style={styles.headerTop}>
            <View style={styles.headerLeft}>
              <View style={styles.logoCircle}>
                <Text style={styles.logoEmoji}>🌙</Text>
              </View>
              <View>
                <Text style={styles.greeting}>{t("greeting")}</Text>
                <Text style={styles.appName}>UmrahConnect</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.menuBtn} onPress={() => setDrawerOpen(true)}>
              <View style={styles.bar} />
              <View style={styles.bar} />
              <View style={styles.bar} />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView showsVerticalScrollIndicator={false}  bounces={false}>

        {/* ── HERO BANNER ── */}
        <View style={styles.heroBanner}>
          <Text style={styles.heroWelcome}>{timeGreeting}, {userName || t("pilgrim")} 🌙</Text>
          <Text style={styles.heroTitle}>{t("completeCompanion")}</Text>
          <Text style={styles.heroSub}>{t("spiritualSub")}</Text>
        </View>

        {/* ── TODAY AT A GLANCE ── */}
        <Text style={[styles.sectionTitle, { color: theme.text }]}>{t("todayAtAGlance")}</Text>
        <View style={styles.glanceGrid}>
          <GlanceCard icon="time-outline" label={t("nextPrayer")} value={nextPrayer.name} sub={nextPrayer.time} theme={theme} />
<GlanceCard icon="partly-sunny-outline" label={t("weather")} value={weather.temp} sub={weather.condition} theme={theme} />
<GlanceCard icon="calendar-outline" label={t("hijriDate")} value={`${hijriDate.day} ${hijriDate.month}`} sub={`${hijriDate.year} AH`} theme={theme} />
<GlanceCard icon="bookmark-outline" label={t("quran")} value="Reading" sub="Al-Baqarah" theme={theme} />
        </View>


        {/* ── MY JOURNEY ── */}
        <Text style={[styles.sectionTitle, { color: theme.text }]}>{t("myJourney")}</Text>
        <View style={styles.journeyGrid}>
          <JourneyCard emoji="📖" title={t("quran")} sub="114 surahs" onPress={() => router.push("/quran")} theme={theme} />
          <JourneyCard emoji="🤲" title={t("duasZikr")} sub={t("supplications")} onPress={() => router.push("/duas")} theme={theme} />
        </View>

        {/* ── VERSE OF THE DAY ── */}
        <View style={styles.verseCard}>
          <Text style={styles.verseLabel}>✦ {t("verseOfDay")}</Text>
          <Text style={styles.verseText}>{ayah}</Text>
          <Text style={styles.verseRef}>{ayahRef}</Text>
        </View>

        {/* ── QUICK ACCESS ── */}
        <Text style={[styles.sectionTitle, { color: theme.text }]}>{t("quickAccess")}</Text>
        <View style={styles.quickRow}>
          <TouchableOpacity
            style={[styles.quickCard, { backgroundColor: theme.card, borderColor: theme.border }]}
            onPress={() => router.push("/(tabs)/services")}
          >
            <Text style={styles.quickEmoji}>🏨</Text>
            <Text style={[styles.quickTitle, { color: theme.text }]}>{t("services")}</Text>
            <Text style={[styles.quickSub, { color: theme.textSecondary }]}>{t("servicesSub")}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.quickCard, { backgroundColor: theme.card, borderColor: theme.border }]}
            onPress={() => router.push("/(tabs)/maps")}
          >
            <Text style={styles.quickEmoji}>🗺️</Text>
            <Text style={[styles.quickTitle, { color: theme.text }]}>{t("maps")}</Text>
            <Text style={[styles.quickSub, { color: theme.textSecondary }]}>{t("mapsSub")}</Text>
          </TouchableOpacity>
        </View>

        

        {/* ── DAILY REMINDER ── */}
        <View style={[styles.reminderCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={styles.reminderIcon}>
            <Ionicons name="notifications-outline" size={20} color="#C9A84C" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.reminderTitle, { color: theme.text }]}>{t("rememberDua")}</Text>
            <Text style={[styles.reminderSub, { color: theme.textSecondary }]}>{t("rememberDuaSub")}</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#C9A84C" />
        </View>

        {/* ── DONATE ── */}
        {/* ── DONATE ── */}
          <TouchableOpacity
            style={styles.donateCard}
            onPress={() => Linking.openURL("https://maidabo.com")}
            activeOpacity={0.85}
          >
            <View style={styles.donateTopRow}>
              <Image
                source={require("../../assets/images/project.png")}
                style={styles.donateLogo}
                resizeMode="contain"
              />
              <View style={{ flex: 1 }}>
                <Text style={styles.donateTitle}>{t("supportMaidabo")}</Text>
                <Text style={styles.donateSub}>{t("maidaboSub")}</Text>
              </View>
            </View>
            <View style={styles.donateDivider} />
            <Text style={styles.donateDesc}>
              {t("maidaboDesc")}
            </Text>
            <View style={styles.donateBtnRow}>
              <TouchableOpacity
                style={styles.donateBtn}
                onPress={() => Linking.openURL("https://maidabo.com")}
              >
                <Ionicons name="heart" size={16} color="#fff" />
                <Text style={styles.donateBtnText}>{t("donateNow")}</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>

        {/* ── BOOKINGS ── */}
        {bookings.length > 0 && (
          <View style={styles.bookingsSection}>
            <Text style={[styles.sectionTitle, { color: theme.text, marginHorizontal: 0, marginTop: 0 }]}>
              {t("myBookings")}
            </Text>
            {upcoming.length > 0 && (
              <>
                <Text style={[styles.groupLabel, { color: theme.textSecondary }]}>{t("upcoming")}</Text>
                {upcoming.map(b => <BookingCard key={b.id} booking={b} theme={theme} />)}
              </>
            )}
            {past.length > 0 && (
              <>
                <Text style={[styles.groupLabel, { color: theme.textSecondary }]}>{t("past")}</Text>
                {past.map(b => <BookingCard key={b.id} booking={b} theme={theme} />)}
              </>
            )}
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      <DrawerMenu isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </View>
  )
}

// ─── STYLES ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: { backgroundColor: "#1E3A5F", paddingBottom: 20 },
  headerTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, paddingTop: 16 },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  logoCircle: { width: 48, height: 48, borderRadius: 24, backgroundColor: "rgba(201,168,76,0.2)", borderWidth: 1.5, borderColor: "#C9A84C", alignItems: "center", justifyContent: "center" },
  logoEmoji: { fontSize: 24 },
  greeting: { color: "#C9A84C", fontSize: 12 },
  appName: { color: "#fff", fontSize: 22, fontWeight: "bold" },
  menuBtn: { width: 40, height: 40, borderRadius: 10, backgroundColor: "rgba(255,255,255,0.12)", alignItems: "center", justifyContent: "center", gap: 5, paddingVertical: 10 },
  bar: { width: 20, height: 2, backgroundColor: "#fff", borderRadius: 2 },
  heroBanner: { backgroundColor: "#1E3A5F", marginHorizontal: 16, marginTop: 16, borderRadius: 18, padding: 20, alignItems: "center", borderWidth: 0.5, borderColor: "rgba(201,168,76,0.3)" },
  heroWelcome: { color: "#C9A84C", fontSize: 12, fontWeight: "600", letterSpacing: 0.5, marginBottom: 6 },
  heroTitle: { color: "#fff", fontSize: 18, fontWeight: "bold", textAlign: "center", marginBottom: 4 },
  heroSub: { color: "rgba(255,255,255,0.5)", fontSize: 12 },
  sectionTitle: { fontSize: 17, fontWeight: "bold", marginHorizontal: 16, marginTop: 20, marginBottom: 12 },
  glanceGrid: { flexDirection: "row", flexWrap: "wrap", marginHorizontal: 16, gap: 8 },
  journeyGrid: { flexDirection: "row", flexWrap: "wrap", marginHorizontal: 16, gap: 8 },
  quickRow: { flexDirection: "row", marginHorizontal: 16, gap: 10 },
  quickCard: { flex: 1, borderRadius: 16, padding: 16, alignItems: "center", borderWidth: 0.5, marginBottom: 20 },
  quickEmoji: { fontSize: 28, marginBottom: 8 },
  quickTitle: { fontSize: 14, fontWeight: "600", marginBottom: 2 },
  quickSub: { fontSize: 11 },
  verseCard: { backgroundColor: "#1E3A5F", margin: 16, borderRadius: 16, padding: 18, borderWidth: 0.5, borderColor: "rgba(201,168,76,0.25)" },
  verseLabel: { color: "#C9A84C", fontSize: 11, fontWeight: "600", letterSpacing: 0.6, marginBottom: 10 },
  verseText: { color: "rgba(255,255,255,0.9)", fontSize: 14, lineHeight: 22, fontStyle: "italic", marginBottom: 10 },
  verseRef: { color: "#C9A84C", fontSize: 11, textAlign: "right" },
  reminderCard: { marginHorizontal: 16, borderRadius: 14, padding: 14, flexDirection: "row", alignItems: "center", gap: 12, borderWidth: 0.5 },
  reminderIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: "#1E3A5F", alignItems: "center", justifyContent: "center" },
  reminderTitle: { fontSize: 13, fontWeight: "600", marginBottom: 2 },
  reminderSub: { fontSize: 11, lineHeight: 16 },
  bookingsSection: { marginHorizontal: 16, marginTop: 20 },
  groupLabel: { fontSize: 11, fontWeight: "600", letterSpacing: 0.5, marginBottom: 8, marginTop: 4 },

  donateCard: { marginHorizontal: 16, marginTop: 20, borderRadius: 20, padding: 20, backgroundColor: "#1E3A5F", borderWidth: 1, borderColor: "rgba(201,168,76,0.4)" },
  donateTopRow: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 14 },
  donateLogo: { width: 52, height: 52, borderRadius: 26, backgroundColor: "#fff" },
  donateTitle: { color: "#C9A84C", fontSize: 16, fontWeight: "bold", marginBottom: 3 },
  donateSub: { color: "rgba(255,255,255,0.6)", fontSize: 12, lineHeight: 17 },
  donateDivider: { height: 0.5, backgroundColor: "rgba(201,168,76,0.3)", marginBottom: 14 },
  donateDesc: { color: "rgba(255,255,255,0.8)", fontSize: 13, lineHeight: 20, textAlign: "center", marginBottom: 18 },
  donateBtnRow: { alignItems: "center" },
  donateBtn: { backgroundColor: "#C9A84C", borderRadius: 25, paddingVertical: 12, paddingHorizontal: 36, flexDirection: "row", alignItems: "center", gap: 8 },
  donateBtnText: { color: "#1E3A5F", fontSize: 15, fontWeight: "bold" },
})

const glanceStyles = StyleSheet.create({
  card: { width: "48%", backgroundColor: "#fff", borderRadius: 14, padding: 12, borderWidth: 0.5, borderColor: "rgba(0,0,0,0.07)", alignItems: "flex-start", gap: 4 },
  iconBox: { width: 36, height: 36, borderRadius: 10, backgroundColor: "#1E3A5F", alignItems: "center", justifyContent: "center", marginBottom: 4 },
  label: { fontSize: 11, color: "#999" },
  value: { fontSize: 15, fontWeight: "700", color: "#1E3A5F" },
  sub: { fontSize: 11, color: "#C9A84C" },
})

const journeyStyles = StyleSheet.create({
  card: { width: "48%", backgroundColor: "#fff", borderRadius: 14, padding: 14, borderWidth: 0.5, borderColor: "rgba(0,0,0,0.07)", alignItems: "center" },
  emoji: { fontSize: 26, marginBottom: 8 },
  title: { fontSize: 13, fontWeight: "600", color: "#1E3A5F", marginBottom: 2, textAlign: "center" },
  sub: { fontSize: 10, color: "#C9A84C", textAlign: "center" },
})

const bookingStyles = StyleSheet.create({
  card: { borderRadius: 14, padding: 16, marginBottom: 12, borderWidth: 0.5 },
  cardTop: { flexDirection: "row", alignItems: "flex-start", marginBottom: 12 },
  hotelName: { fontSize: 16, fontWeight: "bold", marginBottom: 2 },
  city: { fontSize: 13 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statusText: { fontSize: 12, fontWeight: "600" },
  divider: { height: 0.5, marginBottom: 12 },
  details: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
  detailItem: { alignItems: "center" },
  detailLabel: { fontSize: 11, marginBottom: 2 },
  detailValue: { fontSize: 13, fontWeight: "600" },
  nights: { fontSize: 12, textAlign: "center", marginTop: 4 },

  
})