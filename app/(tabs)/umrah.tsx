import { showPremiumPrompt } from "@/lib/premiumPrompt"
import PremiumPromptHost from "@/app/components/PremiumPromptHost"
import { AppIcon } from "@/components/AppIcon"
import { useTheme } from "@/context/themeContext"
import { isAlKahfReminderWindow } from "@/lib/alKahfWindow"
import { isMulkNightWindow } from "@/lib/homeQuranCard"
import { isMulkCompleteTonight } from "@/lib/mulkNightly"
import { Ionicons } from "@expo/vector-icons"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { useFocusEffect, useRouter } from "expo-router"
import { StatusBar } from "expo-status-bar"
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react"
import { useTranslation } from "react-i18next"
import {
  AppState,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native"
import TouchableOpacity from "@/app/components/AppPressable"
import { GOLD, NAVY, tabScrollBottom, ui } from "@/lib/ui"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import PrayerWidget from "../component/PrayerWidget"
import QuranDownloadProgress from "../components/QuranDownloadProgress"
import { configureAdhanAudioMode, startAdhanPreview, stopAdhanPreview, subscribeAdhanPlaying } from "@/lib/adhanAudio"
import { ADHAN_OPTIONS, DEFAULT_ADHAN_ID, getAdhanFile, resolveAdhanId } from "@/lib/prayerConstants"
import { reschedulePrayerNotificationsFromCache } from "@/lib/notifications"
import { fetchAndCachePrayerTimes, readCachedPrayerTimes, type CachedPrayerTimes } from "@/lib/prayerTimes"
import { usePremium } from "@/lib/premium"
import { markFeatureSeen, useFeatureIsNew, type PremiumFeatureId } from "@/lib/premiumNew"

const ADHANS = ADHAN_OPTIONS.map(opt => ({
  id: opt.id,
  name: opt.name,
  style: opt.style,
  premium: Boolean((opt as { premium?: boolean }).premium),
}))

const PREVIEW_MS = 12_000

export default function GuideScreen() {
  const router = useRouter()
  const { theme, isDark } = useTheme()
  const { t } = useTranslation()
  const insets = useSafeAreaInsets()
  const premium = usePremium()
  const [adhanPickerOpen, setAdhanPickerOpen] = useState(false)
  const [selectedAdhan, setSelectedAdhan] = useState<string>(DEFAULT_ADHAN_ID)
  const [previewId, setPreviewId] = useState<string | null>(null)
  const [previewFajr, setPreviewFajr] = useState(false)
  const previewTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const previewBusyRef = useRef(false)
  const [prayerTimes, setPrayerTimes] = useState<CachedPrayerTimes | null>(null)
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    AsyncStorage.getItem("selected_adhan").then(id => {
      if (!id) return
      const resolved = resolveAdhanId(id)
      if (ADHAN_OPTIONS.some(opt => opt.id === resolved)) {
        setSelectedAdhan(resolved)
        if (resolved !== id) void AsyncStorage.setItem("selected_adhan", resolved)
      }
    })
  }, [])

  useEffect(() => {
    let mounted = true
    const load = async () => {
      const cached = await readCachedPrayerTimes()
      if (mounted && cached) setPrayerTimes(cached)
      const fresh = await fetchAndCachePrayerTimes()
      if (mounted && fresh) setPrayerTimes(fresh)
    }
    void load()
    const tick = setInterval(() => setNow(new Date()), 60_000)
    const sub = AppState.addEventListener("change", state => {
      if (state === "active") {
        setNow(new Date())
        void load()
      }
    })
    return () => {
      mounted = false
      clearInterval(tick)
      sub.remove()
    }
  }, [])

  const showAlKahfCard = isAlKahfReminderWindow(prayerTimes, now)
  // Surah Al-Mulk card: only at night, 10pm–3am (same idea as the Friday Kahf card).
  const showAlMulkCard = isMulkNightWindow(now)
  const [mulkDone, setMulkDone] = useState(false)
  useFocusEffect(
    useCallback(() => {
      void isMulkCompleteTonight().then(setMulkDone).catch(() => {})
    }, [])
  )
  const stopPreviewRef = useRef<() => Promise<void>>(async () => {})

  const stopPreview = async () => {
    if (previewTimerRef.current) {
      clearTimeout(previewTimerRef.current)
      previewTimerRef.current = null
    }
    setPreviewId(null)
    setPreviewFajr(false)
    await stopAdhanPreview()
  }
  stopPreviewRef.current = stopPreview

  useEffect(() => {
    return () => {
      if (previewTimerRef.current) clearTimeout(previewTimerRef.current)
      void stopAdhanPreview()
    }
  }, [])

  useEffect(() => {
    return subscribeAdhanPlaying(isPlaying => {
      if (isPlaying) {
        void stopPreviewRef.current()
      }
    })
  }, [])

  const closeAdhanPicker = () => {
    void stopPreview()
    setAdhanPickerOpen(false)
  }

  const handleSelectAdhan = async (id: string) => {
    // Premium voices: free users can listen to the preview, but not pick it.
    if (ADHANS.find(adhan => adhan.id === id)?.premium && !premium.isPremium) {
      showPremiumPrompt()
      return
    }
    try {
      await stopPreview()
      setSelectedAdhan(id)
      await AsyncStorage.setItem("selected_adhan", id)
      await reschedulePrayerNotificationsFromCache(id)
    } catch (e) {
      console.log("Select adhan failed:", e)
    }
  }

  const handlePreview = async (id: string, fajr = false) => {
    if (previewBusyRef.current) return

    if (previewId === id && previewFajr === fajr) {
      await stopPreview()
      return
    }

    previewBusyRef.current = true
    try {
      await stopPreview()
      await configureAdhanAudioMode()

      const source = getAdhanFile(id, fajr ? "Fajr" : "Dhuhr")
      const started = await startAdhanPreview(source)
      if (!started) return

      setPreviewId(id)
      setPreviewFajr(fajr)
      previewTimerRef.current = setTimeout(() => {
        void stopPreviewRef.current()
      }, PREVIEW_MS)
    } catch (e) {
      console.log("Adhan preview failed:", e)
      setPreviewId(null)
      setPreviewFajr(false)
    } finally {
      previewBusyRef.current = false
    }
  }

  return (
    <View style={[styles.screen, { backgroundColor: NAVY }]}>
      <StatusBar style="light" />

      <ScrollView keyboardDismissMode="on-drag" keyboardShouldPersistTaps="handled"
        style={{ backgroundColor: NAVY }}
        contentContainerStyle={{ backgroundColor: theme.background, flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
        contentInsetAdjustmentBehavior="never"
        automaticallyAdjustContentInsets={false}
        contentInset={{ top: 0, left: 0, right: 0, bottom: 0 }}
      >

        {/* Plain navy header + prayer times (no photo behind them). */}
        <View style={styles.heroArea}>

          {/* Header */}
          <View style={[styles.header, { paddingTop: insets.top }]}>
            <View style={styles.headerRow}>
              <View>
                <Text style={styles.title}>{t("guide")}</Text>
                <Text style={styles.subtitle}>{t("prayerTimesGuide")}</Text>
                <QuranDownloadProgress />
              </View>
              {/* Adhan picker button */}
              <TouchableOpacity
                style={styles.adhanBtn}
                onPress={() => {
                  void markFeatureSeen("voices")
                  setAdhanPickerOpen(true)
                }}
              >
                <Ionicons name="headset-outline" size={20} color="#C9A84C" />
              </TouchableOpacity>
            </View>
          </View>

          <PrayerWidget />
        </View>

        {/* Guide sections: journey (2 big tiles), this week's surah (when due), Quran (2 tiles), tools (grid) */}
        <View style={styles.content}>
          <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>
            {t("guideSecJourney", { defaultValue: "Your pilgrimage" })}
          </Text>
          <View style={styles.tileRow}>
            <TouchableOpacity style={[styles.bigTile, styles.bigTileNavy]} onPress={() => router.push("/umrah-guide")}>
              <View style={styles.bigTileIconNavy}>
                <AppIcon name="kaaba" size={30} />
              </View>
              <Text style={styles.bigTileTitleLight}>{t("umrahGuideTitle")}</Text>
              <Text style={styles.bigTileSubLight}>{t("guideUmrahShort", { defaultValue: "7 steps · duas & tips" })}</Text>
              <Ionicons name="arrow-forward" size={18} color={GOLD} style={styles.bigTileArrow} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.bigTile, { backgroundColor: theme.card, borderColor: theme.border }]}
              onPress={() => router.push("/hajj")}
            >
              <View style={[styles.bigTileIcon, { backgroundColor: isDark ? "#3a2f14" : "#FAEEDA" }]}>
                <AppIcon name="crescent" size={30} />
              </View>
              <Text style={[styles.bigTileTitle, { color: theme.text }]}>{t("hajjGuideTitle")}</Text>
              <Text style={[styles.bigTileSub, { color: theme.textSecondary }]}>
                {t("guideHajjShort", { defaultValue: "9 steps · 8th–13th Dhul Hijjah" })}
              </Text>
              <Ionicons name="arrow-forward" size={18} color={theme.gold} style={styles.bigTileArrow} />
            </TouchableOpacity>
          </View>

          <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>
            {t("guideSecQuran", { defaultValue: "Quran" })}
          </Text>
          <View style={styles.tileRow}>
            <TouchableOpacity
              style={[styles.midTile, { backgroundColor: theme.card, borderColor: theme.border }]}
              onPress={() => router.push("/quran")}
            >
              <View style={[styles.midIcon, { backgroundColor: isDark ? "#2a1a3a" : "#EEEDFE" }]}>
                <AppIcon name="book" size={24} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.midTitle, { color: theme.text }]} numberOfLines={1}>
                  {t("guideReadQuran", { defaultValue: "Read" })}
                </Text>
                <Text style={[styles.midSub, { color: theme.textSecondary }]} numberOfLines={1}>{t("guideReadSub", { defaultValue: "114 surahs" })}</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.midTile, { backgroundColor: theme.card, borderColor: theme.border }]}
              onPress={() => router.push("/quran-listen" as any)}
            >
              <View style={[styles.midIcon, { backgroundColor: isDark ? "#3a2f14" : "#FFF6DF" }]}>
                <Ionicons name="headset" size={22} color={GOLD} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.midTitle, { color: theme.text }]} numberOfLines={1}>
                  {t("guideListenQuran", { defaultValue: "Listen" })}
                </Text>
                <Text style={[styles.midSub, { color: theme.textSecondary }]} numberOfLines={1}>{t("guideListenSub", { defaultValue: "Famous reciters" })}</Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Friday Al-Kahf / nightly Al-Mulk: only when it's time, under the Quran buttons */}
          {showAlKahfCard ? (
            <TouchableOpacity
              style={[styles.dueCard, { backgroundColor: theme.card, borderColor: theme.gold }]}
              onPress={() => router.push("/quran/kahf" as any)}
            >
              <View style={[styles.dueIcon, { backgroundColor: isDark ? "#3a2f14" : "#FFF6DF" }]}>
                <AppIcon name="book" size={24} />
              </View>
              <View style={styles.cardInfo}>
                <Text style={[styles.dueTitle, { color: theme.text }]}>{t("alKahfCardTitle")}</Text>
                <Text style={styles.cardSub}>{t("alKahfCardSub")}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={theme.gold} />
            </TouchableOpacity>
          ) : null}
          {showAlMulkCard ? (
            <TouchableOpacity
              style={[styles.dueCard, { backgroundColor: theme.card, borderColor: theme.gold }]}
              onPress={() => router.push("/quran/mulk" as any)}
            >
              <View style={[styles.dueIcon, { backgroundColor: isDark ? "#1a2240" : "#E8ECF8" }]}>
                <Ionicons name="moon" size={22} color={GOLD} />
              </View>
              <View style={styles.cardInfo}>
                <Text style={[styles.dueTitle, { color: theme.text }]}>{t("alMulkCardTitle")}</Text>
                <Text style={styles.cardSub}>{mulkDone ? `✓ ${t("alMulkCompletedBadge")}` : t("alMulkCardSub")}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={theme.gold} />
            </TouchableOpacity>
          ) : null}

          <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>
            {t("guideSecTools", { defaultValue: "Tools" })}
          </Text>
          {/* AI Guide: the one tool people use most, full width */}
          <TouchableOpacity
            style={[styles.aiCard, { backgroundColor: theme.card, borderColor: theme.border }]}
            onPress={() => router.push("/AIGuideScreen")}
            accessibilityRole="button"
          >
            <View style={[styles.aiIcon, { backgroundColor: isDark ? "#1a2a3a" : "#E6F1FB" }]}>
              <AppIcon name="sparkles" size={26} />
            </View>
            <View style={styles.cardInfo}>
              <Text style={[styles.aiTitle, { color: theme.text }]}>{t("ui_aiGuide")}</Text>
              <Text style={[styles.toolSub, { color: theme.textSecondary }]} numberOfLines={1}>
                {t("guideAiSub", { defaultValue: "Ask anything about Umrah, Hajj and the app" })}
              </Text>
            </View>
            <View style={styles.aiGo}>
              <Ionicons name="chatbubble-ellipses-outline" size={18} color={NAVY} />
            </View>
          </TouchableOpacity>

          {/* Other tools: even 2-column grid */}
          <View style={styles.toolGrid}>
            <ToolCard
              label={t("guideQibla", { defaultValue: "Qibla" })}
              sub={t("guideQiblaSub", { defaultValue: "Find the direction" })}
              icon={<Ionicons name="compass-outline" size={22} color={GOLD} />}
              iconBg={isDark ? "#1a3a2a" : "#E1F5EE"}
              onPress={() => router.push("/qiblah")}
            />
            <ToolCard
              label={t("guideDates", { defaultValue: "Islamic dates" })}
              sub={t("guideDatesSub", { defaultValue: "Hijri calendar" })}
              icon={<AppIcon name="calendar" size={22} />}
              iconBg={isDark ? "#2a1a3a" : "#EEEDFE"}
              onPress={() => router.push("/islamic-calendar")}
            />
            {premium.isPremium ? (
              <>
                <ToolCard
                  label={t("guideCompanion", { defaultValue: "Makkah companion" })}
                  sub={t("guideCompanionSub", { defaultValue: "Tawaf & Sa'i counter" })}
                  icon={<AppIcon name="kaaba" size={22} />}
                  iconBg={isDark ? "#3a2f14" : "#FFF6DF"}
                  newId="companion"
                  onPress={() => {
                    void markFeatureSeen("companion")
                    router.push("/makkah-companion" as any)
                  }}
                />
                <ToolCard
                  label={t("guideMiqat", { defaultValue: "Miqat alert" })}
                  sub={t("guideMiqatSub", { defaultValue: "Before you reach it" })}
                  icon={<Ionicons name="airplane" size={20} color={GOLD} />}
                  iconBg={isDark ? "#3a2f14" : "#FFF6DF"}
                  newId="miqat"
                  onPress={() => {
                    void markFeatureSeen("miqat")
                    router.push("/miqat-alert" as any)
                  }}
                />
              </>
            ) : null}
          </View>
        </View>

        <View style={{ height: tabScrollBottom(insets.bottom) }} />
      </ScrollView>

      {/* ── ADHAN PICKER MODAL ── */}
      <Modal
        visible={adhanPickerOpen}
        transparent
        animationType="slide"
        statusBarTranslucent
        onRequestClose={closeAdhanPicker}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: theme.card }]}>
            
            {/* Handle */}
            <View style={styles.modalHandle} />
            
            <Text style={[styles.modalTitle, { color: theme.text }]}>{t("chooseAdhan")}</Text>
            <Text style={[styles.modalSub, { color: theme.textSecondary }]}>
              {t("adhanPickerSub")}
            </Text>
            <Text style={[styles.fajrNote, { color: theme.textSecondary }]}>
              {t("adhanFajrNote")}
            </Text>

            <ScrollView keyboardDismissMode="on-drag"
              style={{ maxHeight: 420 }}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
            {ADHANS.map(adhan => (
              <View
                key={adhan.id}
                style={[
                  styles.adhanRow,
                  { borderColor: theme.border },
                  selectedAdhan === adhan.id && styles.adhanRowActive
                ]}
              >
                <View style={[
                  styles.adhanRadio,
                  selectedAdhan === adhan.id && styles.adhanRadioActive
                ]}>
                  {selectedAdhan === adhan.id && (
                    <View style={styles.adhanRadioDot} />
                  )}
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={[
                    styles.adhanName,
                    { color: theme.text },
                    selectedAdhan === adhan.id && { color: "#C9A84C", fontWeight: "600" }
                  ]}>
                    {adhan.name}
                    {adhan.premium ? "  ⭐" : ""}
                  </Text>
                  <Text style={[styles.fajrMeta, { color: theme.textSecondary }]}>
                    {adhan.style}
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.previewBtn}
                  onPress={() => void handlePreview(adhan.id, false)}
                  accessibilityLabel={t("adhanPreviewRegular")}
                >
                  <Ionicons
                    name={previewId === adhan.id && !previewFajr ? "pause-circle" : "play-circle"}
                    size={26}
                    color="#C9A84C"
                  />
                  <Text style={[styles.previewLabel, { color: theme.textSecondary }]}>
                    {t("adhanPreviewRegular")}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.previewBtn}
                  onPress={() => void handlePreview(adhan.id, true)}
                  accessibilityLabel={t("adhanPreviewFajr")}
                >
                  <Ionicons
                    name={previewId === adhan.id && previewFajr ? "moon" : "moon-outline"}
                    size={22}
                    color="#C9A84C"
                  />
                  <Text style={[styles.previewLabel, { color: theme.textSecondary }]}>
                    {t("adhanPreviewFajr")}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.selectBtn, selectedAdhan === adhan.id && styles.selectBtnActive]}
                  onPress={() => void handleSelectAdhan(adhan.id)}
                >
                  <Text style={[
                    styles.selectBtnText,
                    selectedAdhan === adhan.id && styles.selectBtnTextActive
                  ]}>
                    {selectedAdhan === adhan.id ? t("selected") : t("select")}
                  </Text>
                </TouchableOpacity>
              </View>
            ))}
            </ScrollView>

            <TouchableOpacity style={styles.doneBtn} onPress={closeAdhanPicker}>
              <Text style={styles.doneBtnText}>{t("done")}</Text>
            </TouchableOpacity>
          </View>
        </View>
        {/* Premium card shows on top of this pop-up */}
        <PremiumPromptHost overlay />
      </Modal>
    </View>
  )
}

/** One tool in the Guide tab grid: icon, name, short line, and a small "New" pill for new Premium tools. */
function ToolCard({
  label,
  sub,
  icon,
  iconBg,
  onPress,
  newId,
}: {
  label: string
  sub: string
  icon: ReactNode
  iconBg: string
  onPress: () => void
  newId?: PremiumFeatureId
}) {
  const { theme } = useTheme()
  const { t } = useTranslation()
  const { isNew } = useFeatureIsNew(newId ?? "companion")
  const showNew = !!newId && isNew
  return (
    <TouchableOpacity
      style={[styles.toolCard, { backgroundColor: theme.card, borderColor: showNew ? GOLD : theme.border }]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <View style={styles.toolTop}>
        <View style={[styles.toolIcon, { backgroundColor: iconBg }]}>{icon}</View>
        {showNew ? (
          <View style={styles.newPill}>
            <Text style={styles.newPillText}>{t("pwNew")}</Text>
          </View>
        ) : (
          <Ionicons name="chevron-forward" size={16} color={theme.textSecondary} />
        )}
      </View>
      <Text style={[styles.toolLabel, { color: theme.text }]} numberOfLines={1}>{label}</Text>
      <Text style={[styles.toolSub, { color: theme.textSecondary }]} numberOfLines={1}>{sub}</Text>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  heroArea: { overflow: "hidden", backgroundColor: NAVY },

  header: { padding: 20, paddingBottom: 0 },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  title: { color: "#fff", fontSize: 26, fontWeight: "bold", marginTop: 15 },
  subtitle: { color: "#C9A84C", fontSize: 13, marginTop: 2, paddingBottom: 16 },
  adhanBtn: { marginTop: 18, width: 38, height: 38, borderRadius: 10, backgroundColor: "rgba(201,168,76,0.15)", borderWidth: 0.5, borderColor: "rgba(201,168,76,0.4)", alignItems: "center", justifyContent: "center" },

  content: { padding: 16, gap: 12 },
  sectionTitle: { fontSize: 12, fontWeight: "700", letterSpacing: 1, textTransform: "uppercase", marginTop: 6, marginLeft: 2 },
  tileRow: { flexDirection: "row", gap: 12 },
  bigTile: { flex: 1, minHeight: 168, borderRadius: 20, padding: 16, borderWidth: ui.hairline },
  bigTileNavy: { backgroundColor: NAVY, borderColor: NAVY },
  bigTileIcon: { width: 52, height: 52, borderRadius: 16, alignItems: "center", justifyContent: "center", marginBottom: 14 },
  bigTileIconNavy: { width: 52, height: 52, borderRadius: 16, alignItems: "center", justifyContent: "center", marginBottom: 14, backgroundColor: "rgba(201,168,76,0.16)" },
  bigTileTitle: { fontSize: 17, fontWeight: "800" },
  bigTileTitleLight: { fontSize: 17, fontWeight: "800", color: "#fff" },
  bigTileSub: { fontSize: 12.5, marginTop: 4, lineHeight: 17 },
  bigTileSubLight: { fontSize: 12.5, marginTop: 4, lineHeight: 17, color: "rgba(255,255,255,0.72)" },
  bigTileArrow: { position: "absolute", right: 14, bottom: 14 },
  dueCard: { borderRadius: 16, padding: 12, flexDirection: "row", alignItems: "center", gap: 12, borderWidth: 1 },
  dueIcon: { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  dueTitle: { fontSize: 15, fontWeight: "700" },
  midTile: { flex: 1, borderRadius: 16, padding: 12, flexDirection: "row", alignItems: "center", gap: 10, borderWidth: ui.hairline },
  midIcon: { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  midTitle: { fontSize: 15, fontWeight: "700" },
  midSub: { fontSize: 11.5, marginTop: 2 },
  aiCard: { borderRadius: 18, padding: 14, flexDirection: "row", alignItems: "center", gap: 12, borderWidth: ui.hairline },
  aiIcon: { width: 50, height: 50, borderRadius: 15, alignItems: "center", justifyContent: "center" },
  aiTitle: { fontSize: 16, fontWeight: "800" },
  aiGo: { width: 38, height: 38, borderRadius: 19, backgroundColor: GOLD, alignItems: "center", justifyContent: "center" },
  toolGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", rowGap: 12 },
  toolCard: { width: "48.3%", borderRadius: 18, padding: 14, borderWidth: ui.hairline },
  toolTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 },
  toolIcon: { width: 44, height: 44, borderRadius: 13, alignItems: "center", justifyContent: "center" },
  toolLabel: { fontSize: 15, fontWeight: "700" },
  toolSub: { fontSize: 12, marginTop: 2 },
  newPill: { backgroundColor: GOLD, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  newPillText: { color: NAVY, fontSize: 10, fontWeight: "800", letterSpacing: 0.5 },
  guideCard: { borderRadius: ui.radius, padding: ui.cardPad, flexDirection: "row", alignItems: "center", gap: 14, borderWidth: ui.hairline },
  alKahfCard: { borderWidth: 1 },
  cardIcon: { width: 56, height: 56, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  cardInfo: { flex: 1 },
  cardTitle: { fontSize: 17, fontWeight: "bold", marginBottom: 2 },
  cardSub: { fontSize: 12, color: "#C9A84C", marginBottom: 6 },
  cardDesc: { fontSize: 13, lineHeight: 18 },
  comingSoon: { borderRadius: ui.radius, padding: ui.cardPad, borderWidth: ui.hairline },
  comingSoonTitle: { fontSize: 13, fontWeight: "600", marginBottom: 12, textTransform: "uppercase", letterSpacing: 0.5 },
  comingSoonItem: { flexDirection: "row", alignItems: "center", gap: 10 },
  comingSoonText: { fontSize: 14 },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "flex-end" },
  modalCard: { borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: 40 },
  modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: "rgba(0,0,0,0.2)", alignSelf: "center", marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: "bold", marginBottom: 4 },
  modalSub: { fontSize: 13, marginBottom: 20 },

  // Adhan rows
  adhanRow: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderRadius: ui.radius, borderWidth: ui.hairline, marginBottom: 8 },
  adhanRowActive: { borderColor: GOLD, backgroundColor: "rgba(201,168,76,0.08)" },
  adhanRadio: { width: 20, height: 20, borderRadius: 10, borderWidth: 1.5, borderColor: "#ccc", alignItems: "center", justifyContent: "center" },
  adhanRadioActive: { borderColor: "#C9A84C" },
  adhanRadioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: "#C9A84C" },
  adhanName: { fontSize: 14 },
  fajrMeta: { fontSize: 11, marginTop: 2 },
  fajrNote: { fontSize: 12, paddingHorizontal: 4, marginBottom: 12, lineHeight: 17 },
  previewBtn: { padding: 4, alignItems: "center", minWidth: 44, gap: 2 },
  previewLabel: { fontSize: 9, fontWeight: "600" },
  selectBtn: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1, borderColor: "#C9A84C" },
  selectBtnActive: { backgroundColor: "#C9A84C" },
  selectBtnText: { fontSize: 12, color: "#C9A84C", fontWeight: "500" },
  selectBtnTextActive: { color: "#1E3A5F", fontWeight: "700" },

  // Done button
  doneBtn: { backgroundColor: NAVY, borderRadius: ui.radius, padding: 16, alignItems: "center", marginTop: 8 },
  doneBtnText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
})