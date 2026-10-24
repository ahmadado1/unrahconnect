import TouchableOpacity from "@/app/components/AppPressable";
import { usePremium } from "@/lib/premium"
import GlowText from "@/app/components/GlowText"
import PremiumEndingBanner from "@/app/components/PremiumEndingBanner"
import PremiumJourneyCard from "@/app/components/PremiumJourneyCard"
import PremiumUpsellCard from "@/app/components/PremiumUpsellCard"
import QuranHomePlayer from "@/app/components/QuranHomePlayer"
import { dhikrForToday } from "@/lib/dhikrList"
import HeroBackground, { prefetchHeroSource } from "@/app/components/HeroBackground";
import QuranHomeCard from "@/app/components/QuranHomeCard";
import QuranGoalCard from "@/app/components/QuranGoalCard";
import MakkahStayCard from "@/app/components/MakkahStayCard";
import QuranGoalSheet from "@/app/components/QuranGoalSheet";
import { loadGoals, onGoalsChange, type QuranGoal } from "@/lib/quranGoals";
import NewGlow from "@/app/components/NewGlow";
import { markFeatureSeen, startPremiumWelcome } from "@/lib/premiumNew";
import { AppIcon, ICON_GOLD } from "@/components/AppIcon";
import { useTheme } from "@/context/themeContext";
import i18n from "@/i18n";
import { getHijriMonthGrid, gregorianToHijri, HIJRI_WEEKDAY_LABELS, hijriMonthKey } from "@/lib/hijriDate";
import { resolveHomeQuranCard, type HomeQuranCardState } from "@/lib/homeQuranCard";
import { loadKahfWeeklyProgress } from "@/lib/kahfWeekly";
import { createMushafJumpId } from "@/lib/mushafJump";
import { fetchAndCachePrayerTimes, getNextPrayerFromTimes, parsePrayerTimeHourMinute, readCachedPrayerTimes, timeToMinutes, type CachedPrayerTimes } from "@/lib/prayerTimes";
import { loadLastReadState } from "@/lib/quranLastRead";
import { loadSurahPreviewText } from "@/lib/quranPreviewText";
import { getQuranReadMode } from "@/lib/quranReadMode";
import { getUmrahProgress, getUserFast, supabase } from "@/lib/supabase";
import { cardShadow, GOLD, NAVY, tabScrollBottom, ui } from "@/lib/ui";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Alert,
  Animated,
  AppState,
  Easing,
  Image,
  ImageBackground,
  Linking,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type AppStateStatus,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";


const UMRAH_PHASE_TITLE_KEYS = [
  "phase_umrah_1_title",
  "phase_umrah_2_title",
  "phase_umrah_3_title",
  "phase_umrah_4_title",
  "phase_umrah_5_title",
  "phase_umrah_6_title",
  "phase_umrah_7_title",
] as const

const UMRAH_TOTAL_PHASES = UMRAH_PHASE_TITLE_KEYS.length

/** Morning Adhkar: 8:00–10:59 · Evening Adhkar: 17:00–17:59 */
function getAdhkarWindow(now = new Date()): "morning" | "evening" | null {
  const hour = now.getHours()
  if (hour >= 8 && hour < 11) return "morning"
  if (hour >= 17 && hour < 18) return "evening"
  return null
}

// ─── DHIKR LIST ──────────────────────────────────────────────────────────────

// The list lives in lib/dhikrList.ts (a new one each day, Salawat on Friday).

// ─── CIRCULAR TIMER ──────────────────────────────────────────────────────────

function formatTimerDisplay(minutesLeft: number) {
  if (minutesLeft < 60) {
    return { value: String(minutesLeft), label: "min left", fontSize: 22 }
  }
  const h = Math.floor(minutesLeft / 60)
  const m = minutesLeft % 60
  return { value: `${h}:${String(m).padStart(2, "0")}`, label: "left", fontSize: 20 }
}

function CircularTimer({ minutesLeft, total = 300 }: { minutesLeft: number; total?: number }) {
  const size = 90
  const strokeWidth = 6
  const progress = total > 0 ? Math.min(minutesLeft / total, 1) : 0
  const { value, label, fontSize } = formatTimerDisplay(minutesLeft)

  return (
    <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
      <View style={{ position: "absolute", width: size, height: size }}>
        {/* Background circle */}
        <View style={{
          width: size, height: size, borderRadius: size / 2,
          borderWidth: strokeWidth, borderColor: "rgba(255,255,255,0.15)",
          position: "absolute"
        }} />
        {/* Progress arc - simulated with rotation */}
        <View style={{
          width: size, height: size, borderRadius: size / 2,
          borderWidth: strokeWidth,
          borderColor: "transparent",
          borderTopColor: "#4CAF50",
          borderRightColor: progress > 0.25 ? "#4CAF50" : "transparent",
          borderBottomColor: progress > 0.5 ? "#4CAF50" : "transparent",
          borderLeftColor: progress > 0.75 ? "#4CAF50" : "transparent",
          position: "absolute",
          transform: [{ rotate: "-90deg" }]
        }} />
      </View>
      <Text style={{ color: "#fff", fontSize, fontWeight: "bold" }}>{value}</Text>
      <Text style={{ color: "rgba(255,255,255,0.6)", fontSize: 10 }}>{label}</Text>
    </View>
  )
}

// ─── BOOKING CARD ────────────────────────────────────────────────────────────

function BookingCard({ booking, theme }: { booking: any; theme: any }) {
  const { t } = useTranslation()
  const today = new Date().toISOString().split("T")[0]
  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
  const getStatus = () => {
    if (booking.check_in > today) return { label: i18n.t("upcoming"), color: "#2D6A4F" }
    if (booking.check_out >= today) return { label: i18n.t("active"), color: "#C9A84C" }
    return { label: i18n.t("past"), color: "#888" }
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

// ─── QUICK ACCESS ITEM ───────────────────────────────────────────────────────

function QuickItem({
  icon,
  label,
  onPress,
  theme,
  color,
}: {
  icon: any
  label: string
  onPress: () => void
  theme: any
  color: string
}) {
  return (
    <TouchableOpacity style={[qaStyles.item, { backgroundColor: theme.card, borderColor: theme.border }]} onPress={onPress}>
      <View style={[qaStyles.iconBox, { backgroundColor: `${color}18` }]}>
        <Ionicons name={icon} size={28} color={color} />
      </View>
      <Text style={[qaStyles.label, { color: theme.text }]}>{label}</Text>
    </TouchableOpacity>
  )
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────

const getWeatherCondition = (code: number) => {
  if (code === 0) return "Sunny"
  if (code <= 3) return "Partly cloudy"
  if (code <= 48) return "Foggy"
  if (code <= 67) return "Rainy"
  if (code <= 77) return "Snowy"
  if (code <= 82) return "Showers"
  return "Stormy"
}

function formatPrayerTimeDisplay(timeStr: string): string {
  const parsed = parsePrayerTimeHourMinute(timeStr)
  if (!parsed) return "--:--"
  return `${String(parsed.hour).padStart(2, "0")}:${String(parsed.minute).padStart(2, "0")}`
}

function getMinutesUntilPrayer(timeStr: string, now = new Date()): number {
  if (!timeStr || timeStr === "--:--") return 0
  const nowMinutes = now.getHours() * 60 + now.getMinutes()
  const prayerMinutes = timeToMinutes(timeStr)
  let diff = prayerMinutes - nowMinutes
  if (diff < 0) diff += 24 * 60
  return diff
}

function getVerseEdition() {
  switch (i18n.language) {
    case "fr": return "fr.hamidullah"
    case "ur": return "ur.jalandhry"
    case "tr": return "tr.diyanet"
    case "ar": return "ar.muyassar"
    case "bn": return "bn.bengali"
    default: return "en.sahih"
  }
}

function GlowingAiButton({ onPress }: { onPress: () => void }) {
  const glow = useRef(new Animated.Value(0)).current

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(glow, {
          toValue: 1,
          duration: 1400,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(glow, {
          toValue: 0,
          duration: 1400,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    )
    loop.start()
    return () => loop.stop()
  }, [glow])

  const pulseScale = glow.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.12],
  })
  const pulseOpacity = glow.interpolate({
    inputRange: [0, 1],
    outputRange: [0.35, 0.85],
  })

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.85} style={aiBtnStyles.hit}>
      <Animated.View
        pointerEvents="none"
        style={[
          aiBtnStyles.glowRing,
          { opacity: pulseOpacity, transform: [{ scale: pulseScale }] },
        ]}
      />
      <View style={aiBtnStyles.btn}>
        <Ionicons name="sparkles" size={18} color="#1E3A5F" />
      </View>
    </TouchableOpacity>
  )
}

const aiBtnStyles = StyleSheet.create({
  hit: {
    width: 42,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
  },
  glowRing: {
    position: "absolute",
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#C9A84C",
  },
  btn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#C9A84C",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.55)",
  },
})

// ─── HOME SCREEN ─────────────────────────────────────────────────────────────

export default function HomeScreen() {
  const router = useRouter()
  const { theme } = useTheme()
  const insets = useSafeAreaInsets()
  const { t } = useTranslation()

  const premium = usePremium()
  const [userName, setUserName] = useState("")
  const [user, setUser] = useState<any>(null)
  const [isAgent, setIsAgent] = useState(false)
  const [ayah, setAyah] = useState('"And Allah intends for you ease and does not intend for you hardship."')
  const [ayahRef, setAyahRef] = useState("Quran 2:185")
  const [nextPrayer, setNextPrayer] = useState({ name: "—", time: "--:--" })
  const [prayerTimesState, setPrayerTimesState] = useState<CachedPrayerTimes | null>(null)
  const [locationName, setLocationName] = useState("")
  const [minutesLeft, setMinutesLeft] = useState(0)
  const [umrahProgress, setUmrahProgress] = useState({ step: 1, phase: "", total: UMRAH_TOTAL_PHASES, percent: 0 })
  const [dhikr, setDhikr] = useState(() => dhikrForToday())
  const [dhikrFaved, setDhikrFaved] = useState(false)
  const [bookings, setBookings] = useState<any[]>([])
  const [adhkarWindow, setAdhkarWindow] = useState<"morning" | "evening" | null>(() => getAdhkarWindow())
  const [homeQuranCard, setHomeQuranCard] = useState<HomeQuranCardState>(() => resolveHomeQuranCard({}))
  const [homeQuranPreview, setHomeQuranPreview] = useState("")
  // Quran reading goal (Premium): replaces the Quran preview card while a goal runs.
  // Several goals can run at once: the card shows the most urgent one (list is sorted).
  const [quranGoals, setQuranGoals] = useState<QuranGoal[]>([])
  const quranGoal = quranGoals[0] ?? null
  const runningGoals = quranGoals.filter(g => !g.completedAt).length
  const [goalSheetOpen, setGoalSheetOpen] = useState(false)
  useFocusEffect(
    useCallback(() => {
      void loadGoals().then(setQuranGoals)
    }, [])
  )
  useEffect(() => onGoalsChange(setQuranGoals), [])
  // Premium just started (in the app or on the website): show once what the user got.
  useEffect(() => {
    if (!premium.isPremium) return
    void startPremiumWelcome().then(first => {
      if (first) router.push("/premium-welcome" as any)
    })
  }, [premium.isPremium, router])
  const [refreshing, setRefreshing] = useState(false)
  const hijriToday = gregorianToHijri()
  const hijriMonthGrid = useMemo(
    () => getHijriMonthGrid(hijriToday.year, hijriToday.month),
    [hijriToday.year, hijriToday.month]
  )

  const loadVerse = useCallback(async (forceNew = false) => {
    try {
      const edition = getVerseEdition()
      const today = new Date().toISOString().split("T")[0]

      if (!forceNew) {
        const cached = await AsyncStorage.getItem("cached_verse")
        const cachedDate = await AsyncStorage.getItem("cached_verse_date")
        if (cached && cachedDate === today) {
          const v = JSON.parse(cached)
          if (v.edition === edition && v.text && v.ref) {
            setAyah(v.text)
            setAyahRef(v.ref)
            return
          }
        }
      }

      const randomVerse = Math.floor(Math.random() * 6236) + 1
      const res = await fetch(`https://api.alquran.cloud/v1/ayah/${randomVerse}/${edition}`)
      const data = await res.json()
      if (data.code === 200) {
        const text = `"${data.data.text}"`
        const ref = `Quran: ${data.data.surah.englishName} ${data.data.numberInSurah}`
        setAyah(text)
        setAyahRef(ref)
        await AsyncStorage.setItem("cached_verse", JSON.stringify({ text, ref, edition }))
        await AsyncStorage.setItem("cached_verse_date", today)
      }
    } catch (e) {
      if (forceNew) throw e
    }
  }, [])

  const applyPrayerTimes = useCallback((times: CachedPrayerTimes) => {
    setPrayerTimesState(times)
    const p = getNextPrayerFromTimes(times)
    setNextPrayer(p)
    setMinutesLeft(getMinutesUntilPrayer(p.time))
    if (times.city) setLocationName(times.city)
  }, [])

  const loadPrayer = useCallback(async (preferCacheFirst = true) => {
    try {
      if (preferCacheFirst) {
        const cached = await readCachedPrayerTimes()
        if (cached) applyPrayerTimes(cached)
      }
      // Pull-to-refresh forces a network/GPS refresh; otherwise location-aware cache applies.
      const times = await fetchAndCachePrayerTimes({ force: !preferCacheFirst })
      if (times) applyPrayerTimes(times)
    } catch (e) {
      if (!preferCacheFirst) throw e
    }
  }, [applyPrayerTimes])

  const loadUmrahProgress = useCallback(async () => {
    try {
      const completed = await getUmrahProgress()
      const completedCount = completed.length

      if (completedCount >= UMRAH_TOTAL_PHASES) {
        setUmrahProgress({
          step: UMRAH_TOTAL_PHASES,
          phase: t(UMRAH_PHASE_TITLE_KEYS[UMRAH_TOTAL_PHASES - 1]),
          total: UMRAH_TOTAL_PHASES,
          percent: 100,
        })
        return
      }

      setUmrahProgress({
        step: completedCount + 1,
        phase: t(UMRAH_PHASE_TITLE_KEYS[completedCount]),
        total: UMRAH_TOTAL_PHASES,
        percent: Math.round((completedCount / UMRAH_TOTAL_PHASES) * 100),
      })
    } catch (e) {}
  }, [t])

  const homeQuranKeyRef = useRef("")
  const refreshHomeQuranCard = useCallback(async () => {
    const [lastRead, kahf] = await Promise.all([
      loadLastReadState(),
      loadKahfWeeklyProgress(),
      getQuranReadMode(),
    ])
    const next = resolveHomeQuranCard({
      lastRead: lastRead.entries[0] ?? null,
      kahfAyah: kahf.verseNumber,
      now: new Date(),
    })
    const key = `${next.kind}:${next.surahNumber}:${next.ayah}`
    setHomeQuranCard(next)
    if (homeQuranKeyRef.current === key) return
    homeQuranKeyRef.current = key
    const preview = await loadSurahPreviewText(next.surahNumber, next.ayah)
    setHomeQuranPreview(preview)
  }, [])

  const openHomeQuranCard = useCallback(async () => {
    // Al-Kahf (Friday) and Al-Mulk (10pm–3am) open their own isolated readers.
    if (homeQuranCard.kind === "kahf") return router.push("/quran/kahf" as any)
    if (homeQuranCard.kind === "mulk") return router.push("/quran/mulk" as any)
    const mode = (await getQuranReadMode()) ?? "mushaf"
    router.push({
      pathname: "/quran/[surah]",
      params: {
        surah: String(homeQuranCard.surahNumber),
        name: homeQuranCard.englishName,
        arabicName: homeQuranCard.arabicName,
        verses: String(homeQuranCard.ayahCount),
        type: homeQuranCard.revelationType,
        ayah: String(homeQuranCard.ayah),
        resume: "0",
        mode,
        jump: String(createMushafJumpId()),
        expand: "1",
      },
    })
  }, [homeQuranCard, router])

  const refreshDhikr = useCallback(() => {
    setDhikr(dhikrForToday())
    setDhikrFaved(false)
  }, [])

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    try {
      await Promise.all([
        loadVerse(true),
        loadPrayer(false),
        loadUmrahProgress(),
        refreshHomeQuranCard(),
      ])
      refreshDhikr()
    } catch (e) {
      Alert.alert(t("networkError"))
    } finally {
      setRefreshing(false)
    }
  }, [loadVerse, loadPrayer, loadUmrahProgress, refreshDhikr, refreshHomeQuranCard, t])

  // ── Fetch user ──
  useEffect(() => {
    prefetchHeroSource(require("../../assets/images/hero-mosque.jpeg"))
    const getUser = async () => {
      const { data: { user } } = await getUserFast()
      if (user) {
        setUser(user)
        setUserName(user.user_metadata?.full_name?.split(" ")[0] || t("pilgrim"))
        setIsAgent(user.user_metadata?.user_type === "agent")
      }
    }
    getUser()
  }, [])

  // ── Fetch verse ──
  useEffect(() => {
    loadVerse(false)
  }, [loadVerse])

  // ── Fetch prayer + location ──
  useEffect(() => {
    loadPrayer(true)
  }, [loadPrayer])

  // Advance to the next prayer as soon as the current time passes (not stuck on old name).
  useEffect(() => {
    if (!prayerTimesState) return
    const tick = () => {
      const p = getNextPrayerFromTimes(prayerTimesState)
      setNextPrayer(p)
      setMinutesLeft(getMinutesUntilPrayer(p.time))
    }
    tick()
    const interval = setInterval(tick, 30000)
    return () => clearInterval(interval)
  }, [prayerTimesState])

  // Refresh when returning to the app (picks up city / GPS changes).
  useEffect(() => {
    const onAppState = (state: AppStateStatus) => {
      if (state === "active") void loadPrayer(true)
    }
    const sub = AppState.addEventListener("change", onAppState)
    return () => sub.remove()
  }, [loadPrayer])

  // ── Fetch Umrah progress (same source as umrah-guide) ──
  useFocusEffect(
    useCallback(() => {
      loadUmrahProgress()
      void loadPrayer(true)
      setAdhkarWindow(getAdhkarWindow())
      void refreshHomeQuranCard()
    }, [loadUmrahProgress, loadPrayer, refreshHomeQuranCard])
  )

  // Keep Adhkar card in sync as the clock crosses window boundaries
  useEffect(() => {
    const tick = () => {
      setAdhkarWindow(getAdhkarWindow())
      void refreshHomeQuranCard()
    }
    const interval = setInterval(tick, 30000)
    return () => clearInterval(interval)
  }, [refreshHomeQuranCard])

  // ── Fetch bookings ──
  useEffect(() => {
    const fetchBookings = async () => {
      const { data: { user } } = await getUserFast()
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

  return (
    <View style={[styles.screen, { backgroundColor: NAVY }]}>
      <StatusBar style="light" />
      <ScrollView keyboardDismissMode="on-drag" keyboardShouldPersistTaps="handled"
        style={{ backgroundColor: NAVY }}
        contentContainerStyle={{ backgroundColor: theme.background, flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
        bounces
        contentInsetAdjustmentBehavior="never"
        automaticallyAdjustContentInsets={false}
        contentInset={{ top: 0, left: 0, right: 0, bottom: 0 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#FFFFFF"
            colors={["#FFFFFF"]}
            progressBackgroundColor={NAVY}
          />
        }
      >

        {/* ── HERO ── */}
        <HeroBackground
          source={require("../../assets/images/hero-mosque.jpeg")}
          style={styles.hero}
          imageStyle={styles.heroImage}
        >
          <View style={styles.heroOverlay} />
          <View style={[styles.heroInner, { paddingTop: insets.top }]}>
            {/* Header bar */}
            <View style={styles.headerBar}>
              {/* Full app logo: crescent + Kaaba + "Umrah Connect" (transparent background) */}
              <Image
                source={require("@/assets/images/logo-horizontal.png")}
                style={styles.logoFull}
                resizeMode="contain"
                accessibilityLabel={t("appName")}
              />
              <View style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
                <TouchableOpacity style={styles.iconBtn} onPress={() => router.push("/search" as any)}>
                  <Ionicons name="search-outline" size={20} color="#fff" />
                </TouchableOpacity>
                <GlowingAiButton onPress={() => router.push("/AIGuideScreen" as any)} />
              </View>
            </View>

            {/* Greeting */}
            <View style={styles.heroContent}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <Text style={styles.assalamu}>{t("greeting")}, {userName || t("pilgrim")}</Text>
                {premium.isPremium ? (
                  <View style={styles.premiumChip}>
                    <Ionicons name="star" size={10} color="#1E3A5F" />
                    <Text style={styles.premiumChipText}>{t("premiumBadge")}</Text>
                  </View>
                ) : null}
              </View>
              <Text style={styles.heroGreeting}>{t("whereGlobalizationMatters")}</Text>
              <Text style={styles.heroVerse}>{ayah}</Text>
              <Text style={styles.heroVerseRef}>{ayahRef}</Text>
            </View>
          </View>
          <View style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: 40,
            backgroundColor: theme.background,
            borderTopLeftRadius: 32,
            borderTopRightRadius: 32,
          }} />
        </HeroBackground>

        {/* ── PRAYER CARD ── */}
        <HeroBackground
          source={require("../../assets/images/hero-mosque.jpeg")}
          style={styles.prayerCard}
          imageStyle={{ opacity: 0.15, borderRadius: 24 }}
        >
          <View style={styles.prayerLeft}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 8 }}>
              <Ionicons name="time-outline" size={16} color="rgba(255,255,255,0.7)" />
              <Text style={styles.prayerLabel}>{t("nextPrayer")}</Text>
            </View>
            <Text style={styles.prayerName}>{nextPrayer.name}</Text>
            <Text style={styles.prayerTime}>{formatPrayerTimeDisplay(nextPrayer.time)}</Text>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 8 }}>
              <Ionicons name="location-outline" size={13} color="rgba(255,255,255,0.5)" />
              <Text style={styles.prayerLocation}>{locationName || "—"}</Text>
            </View>
          </View>
          <CircularTimer minutesLeft={minutesLeft} total={minutesLeft} />
        </HeroBackground>

        {/* ── Premium ends in the next 3 days ── */}
        <PremiumEndingBanner />

        {/* ── In Makkah: Tawaf / Sa'i counters and My duas, for the whole stay ── */}
        <MakkahStayCard />

        {/* ── PREMIUM: UmrahConnect Guide → Trip Planner. FREE: Continue My Umrah Journey ── */}
        {premium.isPremium ? (
          <PremiumJourneyCard />
        ) : (
        <TouchableOpacity
          style={[styles.journeyCard, { backgroundColor: theme.card, borderColor: theme.border }]}
          onPress={() => router.push("/umrah-guide" as any)}
          activeOpacity={0.85}
        >
          <Image
            source={require("../../assets/images/kaaba.png")}
            style={styles.journeyKaaba}
          />
          <View style={{ flex: 1 }}>
            <Text style={[styles.journeyTitle, { color: theme.text }]}>{t("ui_continueJourney")}</Text>
            <Text style={[styles.journeyStep, { color: theme.textSecondary }]}>{t("ui_stepOf", { step: umrahProgress.step, total: umrahProgress.total })}</Text>
            <Text style={[styles.journeyPhase, { color: theme.textSecondary }]}>{umrahProgress.phase}</Text>
            <View style={styles.progressBarTrack}>
              <View style={[styles.progressBarFill, { width: `${umrahProgress.percent}%` }]} />
            </View>
            <Text style={styles.progressPercent}>{umrahProgress.percent}%</Text>
          </View>
          <View style={styles.journeyArrow}>
            <Ionicons name="chevron-forward" size={18} color={theme.text} />
          </View>
        </TouchableOpacity>
        )}

        {/* ── FREE: "Get Premium" card ── */}
        {!premium.isPremium ? <PremiumUpsellCard /> : null}

        {/* Adhkar, under Umrah Journey; morning 8–11am, evening 5–6pm only */}
        {adhkarWindow === "morning" && (
          <TouchableOpacity
            style={[styles.adhkarHomeCard, { backgroundColor: theme.card, borderColor: theme.border }]}
            onPress={() => router.push("/MorningAdhkarScreen" as any)}
            activeOpacity={0.85}
          >
            <View style={[styles.adhkarHomeIcon, { backgroundColor: "rgba(201,168,76,0.18)" }]}>
              <AppIcon name="sunny" size={22} color={ICON_GOLD} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.adhkarHomeTitle, { color: theme.text }]}>{t("morningAdhkarTitle")}</Text>
              <Text style={[styles.adhkarHomeSub, { color: theme.textSecondary }]}>{t("morningAdhkarDesc")}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#C9A84C" />
          </TouchableOpacity>
        )}
        {adhkarWindow === "evening" && (
          <TouchableOpacity
            style={[styles.adhkarHomeCard, { backgroundColor: theme.card, borderColor: theme.border }]}
            onPress={() => router.push("/EveningAdhkarScreen" as any)}
            activeOpacity={0.85}
          >
            <View style={[styles.adhkarHomeIcon, { backgroundColor: "rgba(30,58,95,0.12)" }]}>
              <AppIcon name="moon" size={22} color={ICON_GOLD} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.adhkarHomeTitle, { color: theme.text }]}>{t("eveningAdhkarTitle")}</Text>
              <Text style={[styles.adhkarHomeSub, { color: theme.textSecondary }]}>{t("eveningAdhkarDesc")}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#C9A84C" />
          </TouchableOpacity>
        )}

        {/* ── TODAY'S DHIKR ── */}
        <TouchableOpacity
          style={[styles.dhikrCard, { backgroundColor: theme.card, borderColor: theme.border }]}
          onPress={() => router.push({ pathname: "/dhikr", params: { id: dhikr.id } } as any)}
          activeOpacity={0.9}
        >
          <ImageBackground
            source={require("../../assets/images/prayer-mosque.jpg")}
            style={StyleSheet.absoluteFill}
            imageStyle={{ opacity: 0.08, borderRadius: ui.radius }}
          />
          <View style={styles.dhikrHeader}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <View style={styles.dhikrIconBox}>
                <AppIcon name="mosque" size={16} color="#fff" />
              </View>
              <Text style={[styles.dhikrLabel, { color: theme.text }]}>{t("dk_todayLabel")}</Text>
            </View>
            <TouchableOpacity onPress={() => setDhikrFaved(!dhikrFaved)}>
              <Ionicons name={dhikrFaved ? "heart" : "heart-outline"} size={20} color={dhikrFaved ? "#C9A84C" : theme.textSecondary} />
            </TouchableOpacity>
          </View>
          <GlowText style={styles.dhikrArabic}>{dhikr.arabic}</GlowText>
          <Text style={styles.dhikrTranslit}>&apos;{dhikr.translit}&apos;</Text>
          <Text style={[styles.dhikrMeaning, { color: theme.textSecondary }]}>({dhikr.meaning})</Text>
          <Text style={styles.dhikrCountHint}>{t("dk_countHint")}</Text>
        </TouchableOpacity>

        {/* ── QURAN PREVIEW (Mulk at night, Kahf on Friday, else last read) ── */}
        {premium.isPremium && quranGoal ? (
          <QuranGoalCard goal={quranGoal} count={runningGoals} onEdit={() => setGoalSheetOpen(true)} />
        ) : (
          <>
            <QuranHomeCard
              card={homeQuranCard}
              previewText={homeQuranPreview}
              startLabel={t("quranHomeStartReading")}
              loading={!homeQuranPreview}
              onPress={openHomeQuranCard}
            />
            {/* Set a reading goal: Premium only (free users read about it on the Premium screen) */}
            {premium.isPremium ? (
              <NewGlow id="goal" style={{ alignSelf: "center", marginTop: 10 }} radius={999}>
                <TouchableOpacity
                  style={[styles.goalPill, { borderColor: theme.border, backgroundColor: theme.card }]}
                  onPress={() => {
                    void markFeatureSeen("goal")
                    setGoalSheetOpen(true)
                  }}
                  activeOpacity={0.85}
                >
                  <Ionicons name="flag" size={16} color={GOLD} />
                  <Text style={[styles.goalPillText, { color: theme.text }]}>{t("qgSetGoal")}</Text>
                </TouchableOpacity>
              </NewGlow>
            ) : null}
          </>
        )}
        <QuranGoalSheet
          visible={goalSheetOpen}
          onClose={() => setGoalSheetOpen(false)}
        />

        {/* ── LISTEN TO THE QURAN (Premium: continue where you stopped) ── */}
        {/* Quran player: Premium gets the big player (continues at the exact second),
            free users get the small player (starts the last surah again). */}
        <View style={{ marginHorizontal: 16, marginTop: 12 }}>
          <QuranHomePlayer />
        </View>

        {/* ── ISLAMIC (HIJRI) CALENDAR ── */}
        <TouchableOpacity
          style={[styles.hijriCard, { backgroundColor: theme.card, borderColor: theme.border }]}
          onPress={() => router.push("/islamic-calendar")}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel={`${t("islamicCalendarTitle")}, ${t(hijriMonthKey(hijriToday.month), { defaultValue: hijriToday.monthName })} ${hijriToday.day}`}
        >
          <View style={styles.hijriCardHeader}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.hijriCardLabel, { color: theme.textSecondary }]}>
                {t("islamicCalendarTitle")}
              </Text>
              <Text style={[styles.hijriMonthName, { color: theme.text }]} numberOfLines={1}>
                {t(hijriMonthKey(hijriToday.month), { defaultValue: hijriToday.monthName })}{" "}
                <Text style={styles.hijriYear}>{t("hijriAh", { year: hijriToday.year })}</Text>
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#C9A84C" />
          </View>

          <View pointerEvents="none">
            <View style={styles.hijriWeekdayRow}>
              {HIJRI_WEEKDAY_LABELS.map((d, i) => (
                <Text key={`${d}-${i}`} style={styles.hijriWeekdayText}>
                  {t(`hijriWeekday${i}`)}
                </Text>
              ))}
            </View>
            <View style={styles.hijriDaysGrid}>
              {Array.from({ length: hijriMonthGrid.firstWeekday }).map((_, i) => (
                <View key={`empty-${i}`} style={styles.hijriDayCell} />
              ))}
              {hijriMonthGrid.days.map(day => {
                const isToday =
                  day.hijriDay === hijriToday.day &&
                  day.hijriMonth === hijriToday.month &&
                  day.hijriYear === hijriToday.year
                return (
                  <View
                    key={`${day.hijriYear}-${day.hijriMonth}-${day.hijriDay}`}
                    style={[styles.hijriDayCell, isToday && styles.hijriDayCellToday]}
                  >
                    <Text
                      style={[
                        styles.hijriDayText,
                        { color: isToday ? "#fff" : theme.text },
                        isToday && styles.hijriDayTextToday,
                      ]}
                    >
                      {day.hijriDay}
                    </Text>
                  </View>
                )
              })}
            </View>
          </View>
        </TouchableOpacity>

        {/* ── QUICK ACCESS ── */}
        <View style={styles.qaHeader}>
          <Text style={[styles.qaTitle, { color: theme.text }]}>{t("quickAccess")}</Text>
          <TouchableOpacity><Text style={styles.qaViewAll}>{t("seeAll")}</Text></TouchableOpacity>
        </View>
        <ScrollView keyboardDismissMode="on-drag" keyboardShouldPersistTaps="handled" horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.qaRow}>
          <QuickItem icon="cube-outline" label={t("umrahGuide")} onPress={() => router.push("/umrah-guide" as any)} theme={theme} color="#B45309" />
          <QuickItem icon="moon-outline" label={t("hajj")} onPress={() => router.push("/hajj" as any)} theme={theme} color="#C9A84C" />
          <QuickItem icon="map-outline" label={t("maps")} onPress={() => router.push("/(tabs)/maps" as any)} theme={theme} color="#E11D48" />
          <QuickItem icon="hand-left-outline" label={t("duas")} onPress={() => router.push("/duas" as any)} theme={theme} color="#0D9488" />
          <QuickItem icon="bus-outline" label={t("services")} onPress={() => router.push("/(tabs)/services" as any)} theme={theme} color="#0284C7" />
        </ScrollView>

        {/* ── MAIDABO FOUNDATION ── */}
        <View style={styles.donateCard}>
          <View style={styles.donateTopRow}>
            <Image
              source={require("../../assets/images/project.png")}
              style={styles.donateLogo}
              resizeMode="contain"
            />
            <View style={{ flex: 1 }}>
              <Text style={styles.donateTitle}>Maidabo Foundation</Text>
            </View>
          </View>
          <View style={styles.donateDivider} />
          <Text style={styles.donateDesc}>{t("maidaboDesc")}</Text>
          <View style={styles.donateBtnRow}>
            <TouchableOpacity
              style={styles.donateBtn}
              onPress={() => void Linking.openURL("https://maidabofoundation.com/").catch(() => {})}
            >
              <Ionicons name="heart" size={16} color="#fff" />
              <Text style={styles.donateBtnText}>{t("learnMore")}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── BOOKINGS ── */}
        {bookings.length > 0 && (
          <View style={styles.bookingsSection}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
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

        <View style={{ height: tabScrollBottom(insets.bottom) }} />
      </ScrollView>
    </View>
  )
}

// ─── STYLES ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  goalPill: { flexDirection: "row", alignItems: "center", gap: 8, alignSelf: "center", borderWidth: 1, borderRadius: 999, paddingHorizontal: 16, paddingVertical: 9 },
  goalPillText: { fontSize: 14, fontWeight: "700" },
  goalPillPremium: { backgroundColor: GOLD, color: NAVY, fontSize: 10, fontWeight: "800", paddingHorizontal: 7, paddingVertical: 2, borderRadius: 999, overflow: "hidden" },
  premiumChip: { flexDirection: "row", alignItems: "center", gap: 3, backgroundColor: "#C9A84C", borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 },
  premiumChipText: { color: "#1E3A5F", fontSize: 10, fontWeight: "bold" },
  screen: { flex: 1 },

  // Hero
  hero: {
    minHeight: 420,
    backgroundColor: "#1E3A5F",
    overflow: "hidden",
  },
  heroImage: {
    resizeMode: "cover",
  },
  heroOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(0,0,20,0.6)",
  },
  heroInner: { flexGrow: 1, justifyContent: "space-between" },
  headerBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  logoRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  logoCircle: { width: 46, height: 46, alignItems: "center", justifyContent: "center" },
  logoImage: { width: 46, height: 46 },
  // logo-horizontal.png is 891 × 240
  logoFull: { height: 46, width: Math.round((46 * 891) / 240), flexShrink: 1 },
  logoName: { color: "#fff", fontSize: 18, fontWeight: "bold" },
  logoTagline: { color: "rgba(255,255,255,0.5)", fontSize: 10 },
  iconBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: "rgba(255,255,255,0.15)", alignItems: "center", justifyContent: "center" },
  heroContent: { padding: 20, paddingBottom: 80 },
  assalamu: { color: "rgba(255,255,255,0.7)", fontSize: 13, marginBottom: 4 },
  heroGreeting: { color: "#fff", fontSize: 32, fontWeight: "bold", lineHeight: 40, marginBottom: 12 },
  heroVerse: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 13,
    lineHeight: 20,
    fontStyle: "italic",
    marginBottom: 10,
    flexShrink: 0,
  },
  heroVerseRef: { color: "#C9A84C", fontSize: 12, fontWeight: "600" },

  // Prayer card
  prayerCard: {
    marginHorizontal: 16,
    marginTop: -60,
    borderRadius: ui.radius,
    padding: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: NAVY,
    overflow: "hidden",
    minHeight: 140,
    zIndex: 10,
    ...cardShadow,
  },
  prayerLeft: { flex: 1 },
  prayerLabel: { color: "rgba(255,255,255,0.6)", fontSize: 13 },
  prayerName: { color: "#fff", fontSize: 26, fontWeight: "bold", marginBottom: 2 },
  prayerTime: { color: "#C9A84C", fontSize: 22, fontWeight: "700" },
  prayerLocation: { color: "rgba(255,255,255,0.5)", fontSize: 12 },

  // Journey card
  journeyCard: { marginHorizontal: 16, marginTop: 14, borderRadius: ui.radius, padding: ui.cardPad, flexDirection: "row", alignItems: "center", gap: 14, borderWidth: ui.hairline, ...cardShadow },
  journeyKaaba: { width: 70, height: 70, borderRadius: 16 },
  journeyTitle: { fontSize: 15, fontWeight: "700", marginBottom: 2 },
  journeyStep: { fontSize: 12, marginBottom: 1 },
  journeyPhase: { fontSize: 12, marginBottom: 8 },
  progressBarTrack: { height: 5, backgroundColor: "rgba(0,0,0,0.08)", borderRadius: 3, overflow: "hidden" },
  progressBarFill: { height: 5, backgroundColor: "#C9A84C", borderRadius: 3 },
  progressPercent: { color: "#C9A84C", fontSize: 11, marginTop: 4, fontWeight: "600" },
  journeyArrow: { width: 32, height: 32, borderRadius: 16, backgroundColor: "rgba(0,0,0,0.06)", alignItems: "center", justifyContent: "center" },

  // Timed Adhkar card (under Umrah Journey)
  adhkarHomeCard: {
    marginHorizontal: 16,
    marginTop: 10,
    borderRadius: ui.radius,
    padding: ui.cardPad,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 0.5,
    borderLeftWidth: 3,
    borderLeftColor: "#C9A84C",
  },
  adhkarHomeIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  adhkarHomeTitle: { fontSize: 14, fontWeight: "700", marginBottom: 2 },
  adhkarHomeSub: { fontSize: 12, lineHeight: 16 },

  // Dhikr card
  dhikrCard: { marginHorizontal: 16, marginTop: 14, borderRadius: ui.radius, padding: 20, borderWidth: ui.hairline, overflow: "hidden", ...cardShadow },
  dhikrHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  dhikrIconBox: { width: 32, height: 32, borderRadius: 16, backgroundColor: "#2D6A4F", alignItems: "center", justifyContent: "center" },
  dhikrLabel: { fontSize: 15, fontWeight: "600" },
  dhikrArabic: { fontSize: 28, color: "#1E3A5F", textAlign: "center", lineHeight: 50, marginBottom: 8 },
  dhikrTranslit: { color: "#C9A84C", fontSize: 14, textAlign: "center", fontStyle: "italic", marginBottom: 4 },
  dhikrMeaning: { fontSize: 13, textAlign: "center" },
  dhikrCountHint: { color: "#C9A84C", fontSize: 11, fontWeight: "700", textAlign: "center", marginTop: 8 },

  // Hijri calendar card (mini month preview)
  hijriCard: {
    marginHorizontal: 16,
    marginTop: 14,
    borderRadius: ui.radius,
    padding: 16,
    borderWidth: ui.hairline,
    ...cardShadow,
  },
  hijriCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    gap: 8,
  },
  hijriCardLabel: { fontSize: 12, fontWeight: "600", marginBottom: 2 },
  hijriMonthName: { fontSize: 16, fontWeight: "700" },
  hijriYear: { fontSize: 13, color: "#C9A84C", fontWeight: "600" },
  hijriWeekdayRow: { flexDirection: "row", marginBottom: 4 },
  hijriWeekdayText: {
    flex: 1,
    textAlign: "center",
    fontSize: 9,
    fontWeight: "600",
    color: "#C9A84C",
  },
  hijriDaysGrid: { flexDirection: "row", flexWrap: "wrap" },
  hijriDayCell: {
    width: "14.28%",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 4,
    borderRadius: 8,
  },
  hijriDayCellToday: {
    backgroundColor: "#1E3A5F",
    borderWidth: 1.5,
    borderColor: "#C9A84C",
  },
  hijriDayText: { fontSize: 12, fontWeight: "600" },
  hijriDayTextToday: { color: "#fff", fontWeight: "700" },

  // Quick Access
  qaHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginHorizontal: 16, marginTop: 20, marginBottom: 12 },
  qaTitle: { fontSize: 17, fontWeight: "bold" },
  qaViewAll: { color: "#C9A84C", fontSize: 13, fontWeight: "600" },
  qaRow: { paddingHorizontal: 16, gap: 12 },

  // Maidabo + bookings
  sectionTitle: { fontSize: 17, fontWeight: "bold", marginBottom: 12 },
  bookingsSection: { marginHorizontal: 16, marginTop: 20 },
  groupLabel: { fontSize: 11, fontWeight: "600", letterSpacing: 0.5, marginBottom: 8, marginTop: 4 },
  donateCard: {
    marginHorizontal: 16,
    marginTop: 20,
    borderRadius: ui.radius,
    padding: 20,
    backgroundColor: NAVY,
    borderWidth: 1,
    borderColor: "rgba(201,168,76,0.4)",
  },
  donateTopRow: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 14 },
  donateLogo: { width: 52, height: 52, borderRadius: 26, backgroundColor: "#fff" },
  donateTitle: { color: "#C9A84C", fontSize: 16, fontWeight: "bold", marginBottom: 3 },
  donateSub: { color: "rgba(255,255,255,0.6)", fontSize: 12, lineHeight: 17 },
  donateDivider: { height: 0.5, backgroundColor: "rgba(201,168,76,0.3)", marginBottom: 14 },
  donateDesc: { color: "rgba(255,255,255,0.8)", fontSize: 13, lineHeight: 20, textAlign: "center", marginBottom: 18 },
  donateBtnRow: { alignItems: "center" },
  donateBtn: {
    backgroundColor: GOLD,
    borderRadius: ui.radius,
    paddingVertical: 12,
    paddingHorizontal: 36,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  donateBtnText: { color: "#1E3A5F", fontSize: 15, fontWeight: "bold" },
})

const qaStyles = StyleSheet.create({
  item: { width: 96, alignItems: "center", borderRadius: 18, paddingVertical: 14, paddingHorizontal: 10, borderWidth: 0.5 },
  iconBox: { width: 52, height: 52, borderRadius: 14, backgroundColor: "rgba(30,58,95,0.08)", alignItems: "center", justifyContent: "center", marginBottom: 8 },
  label: { fontSize: 13, textAlign: "center", fontWeight: "700" },
})

const bookingStyles = StyleSheet.create({
  card: { borderRadius: ui.radius, padding: ui.cardPad, marginBottom: 12, borderWidth: ui.hairline, ...cardShadow },
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