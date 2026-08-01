import { AppIcon } from "@/components/AppIcon"
import { useTheme } from "@/context/themeContext"
import { Ionicons } from "@expo/vector-icons"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { Audio } from "expo-av"
import { useRouter } from "expo-router"
import { StatusBar } from "expo-status-bar"
import { useEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { ImageBackground, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import PrayerWidget from "../component/PrayerWidget"
import QuranDownloadProgress from "../components/QuranDownloadProgress"
import { ADHAN_OPTIONS, DEFAULT_ADHAN_ID, getAdhanFile } from "@/lib/prayerConstants"
import { reschedulePrayerNotificationsFromCache } from "@/lib/notifications"

const ADHANS = ADHAN_OPTIONS.map(opt => ({
  id: opt.id,
  name: opt.name,
  fajrLabel: opt.fajrLabel,
}))

const PREVIEW_MS = 12_000

export default function GuideScreen() {
  const router = useRouter()
  const { theme, isDark } = useTheme()
  const { t } = useTranslation()
  const insets = useSafeAreaInsets()
  const [adhanPickerOpen, setAdhanPickerOpen] = useState(false)
  const [selectedAdhan, setSelectedAdhan] = useState(DEFAULT_ADHAN_ID)
  const [previewId, setPreviewId] = useState<string | null>(null)
  const [previewFajr, setPreviewFajr] = useState(false)
  const previewSoundRef = useRef<Audio.Sound | null>(null)
  const previewTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const previewBusyRef = useRef(false)

  useEffect(() => {
    AsyncStorage.getItem("selected_adhan").then(id => {
      if (id && ADHAN_OPTIONS.some(opt => opt.id === id)) setSelectedAdhan(id)
    })
  }, [])

  useEffect(() => {
    return () => {
      if (previewTimerRef.current) clearTimeout(previewTimerRef.current)
      const sound = previewSoundRef.current
      previewSoundRef.current = null
      if (sound) void sound.unloadAsync().catch(() => {})
    }
  }, [])

  const stopPreview = async () => {
    if (previewTimerRef.current) {
      clearTimeout(previewTimerRef.current)
      previewTimerRef.current = null
    }
    setPreviewId(null)
    setPreviewFajr(false)
    const sound = previewSoundRef.current
    previewSoundRef.current = null
    if (sound) {
      try {
        await sound.stopAsync()
      } catch {}
      try {
        await sound.unloadAsync()
      } catch {}
    }
    // Restore background-capable session so prayer Adhan still works after preview
    try {
      const { configureAdhanAudioMode } = await import("@/lib/adhanAudio")
      await configureAdhanAudioMode()
    } catch {}
  }

  const closeAdhanPicker = () => {
    void stopPreview()
    setAdhanPickerOpen(false)
  }

  const handleSelectAdhan = async (id: string) => {
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
      const { configureAdhanAudioMode } = await import("@/lib/adhanAudio")
      await configureAdhanAudioMode()

      const source = getAdhanFile(id, fajr ? "Fajr" : "Dhuhr")
      const { sound } = await Audio.Sound.createAsync(source, {
        shouldPlay: true,
        volume: 1,
        isLooping: false,
      })
      previewSoundRef.current = sound
      setPreviewId(id)
      setPreviewFajr(fajr)
      previewTimerRef.current = setTimeout(() => {
        void stopPreview()
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
    <View style={[styles.screen, { backgroundColor: theme.background }]}>
      <StatusBar style="light" />

      <ScrollView showsVerticalScrollIndicator={false}>

        <ImageBackground
          source={require("../../assets/images/image56.png")}
          style={styles.heroArea}
          imageStyle={styles.heroImage}
        >
          <View style={styles.overlayTop} />
          <View style={styles.overlayBottom} />

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
                onPress={() => setAdhanPickerOpen(true)}
              >
                <Ionicons name="headset-outline" size={20} color="#C9A84C" />
              </TouchableOpacity>
            </View>
          </View>

          <PrayerWidget />
        </ImageBackground>

        {/* Guide Cards */}
        <View style={styles.content}>
          <TouchableOpacity
            style={[styles.guideCard, { backgroundColor: theme.card, borderColor: theme.border }]}
            onPress={() => router.push("/umrah-guide")}
          >
            <View style={[styles.cardIcon, { backgroundColor: isDark ? "#1a3a2a" : "#E1F5EE" }]}>
              <AppIcon name="kaaba" size={28}  />
            </View>
            <View style={styles.cardInfo}>
              <Text style={[styles.cardTitle, { color: theme.text }]}>{t("umrahGuideTitle")}</Text>
              <Text style={styles.cardSub}>{t("umrahGuidePhaseSub")}</Text>
              <Text style={[styles.cardDesc, { color: theme.textSecondary }]}>{t("umrahGuideDesc")}</Text>
            </View>
            <Ionicons name="chevron-forward" size={22} color={theme.gold} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.guideCard, { backgroundColor: theme.card, borderColor: theme.border }]}
            onPress={() => router.push("/hajj")}
          >
            <View style={[styles.cardIcon, { backgroundColor: isDark ? "#3a2a1a" : "#FAEEDA" }]}>
              <AppIcon name="crescent" size={28}  />
            </View>
            <View style={styles.cardInfo}>
              <Text style={[styles.cardTitle, { color: theme.text }]}>{t("hajjGuideTitle")}</Text>
              <Text style={styles.cardSub}>{t("hajjGuideSub")}</Text>
              <Text style={[styles.cardDesc, { color: theme.textSecondary }]}>{t("hajjGuideDesc")}</Text>
            </View>
            <Ionicons name="chevron-forward" size={22} color={theme.gold} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.guideCard, { backgroundColor: theme.card, borderColor: theme.border }]}
            onPress={() => router.push("/quran")}
          >
            <View style={[styles.cardIcon, { backgroundColor: isDark ? "#2a1a3a" : "#EEEDFE" }]}>
              <AppIcon name="book" size={28}  />
            </View>
            <View style={styles.cardInfo}>
              <Text style={[styles.cardTitle, { color: theme.text }]}>{t("quranReader")}</Text>
              <Text style={styles.cardSub}>{t("quranReaderSub")}</Text>
              <Text style={[styles.cardDesc, { color: theme.textSecondary }]}>{t("quranReaderDesc")}</Text>
            </View>
            <Ionicons name="chevron-forward" size={22} color={theme.gold} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.guideCard, { backgroundColor: theme.card, borderColor: theme.border }]}
            onPress={() => router.push("/AIGuideScreen")}
          >
            <View style={[styles.cardIcon, { backgroundColor: isDark ? "#1a2a3a" : "#E6F1FB" }]}>
              <AppIcon name="sparkles" size={28}  />
            </View>
            <View style={styles.cardInfo}>
              <Text style={[styles.cardTitle, { color: theme.text }]}>AI Guide</Text>
              <Text style={styles.cardSub}>Ask anything</Text>
              <Text style={[styles.cardDesc, { color: theme.textSecondary }]}>
                Umrah, Hajj, Haram navigation & app help
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={22} color={theme.gold} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.guideCard, { backgroundColor: theme.card, borderColor: theme.border }]}
            onPress={() => router.push("/islamic-calendar")}
          >
            <View style={[styles.cardIcon, { backgroundColor: isDark ? "#2a1a3a" : "#EEEDFE" }]}>
              <AppIcon name="calendar" size={28}  />
            </View>
            <View style={styles.cardInfo}>
              <Text style={[styles.cardTitle, { color: theme.text }]}>{t("islamicDates")}</Text>
              <Text style={styles.cardSub}>{t("islamicDatesSub")}</Text>
            </View>
            <Ionicons name="chevron-forward" size={22} color={theme.gold} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.comingSoon, { backgroundColor: theme.card, borderColor: theme.border }]}
            onPress={() => router.push("/qiblah")}
            activeOpacity={0.7}
          >
            <View style={styles.comingSoonItem}>
              <Ionicons name="compass-outline" size={20} color={theme.gold} />
              <Text style={[styles.comingSoonText, { color: theme.text }]}>{t("qiblaDirection")}</Text>
              <Ionicons name="chevron-forward" size={16} color={theme.textSecondary} />
            </View>
          </TouchableOpacity>
        </View>

        <View style={{ height: 100 }} />
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
              Fajr uses a special adhan with «الصلاة خير من النوم»
            </Text>

            <ScrollView
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
                  </Text>
                  <Text style={[styles.fajrMeta, { color: theme.textSecondary }]}>
                    Fajr: {adhan.fajrLabel}
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.previewBtn}
                  onPress={() => void handlePreview(adhan.id, false)}
                >
                  <Ionicons
                    name={previewId === adhan.id && !previewFajr ? "pause-circle" : "play-circle"}
                    size={26}
                    color="#C9A84C"
                  />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.previewBtn}
                  onPress={() => void handlePreview(adhan.id, true)}
                >
                  <Ionicons
                    name={previewId === adhan.id && previewFajr ? "moon" : "moon-outline"}
                    size={22}
                    color="#C9A84C"
                  />
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
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  heroArea: { overflow: "hidden" },
  heroImage: { resizeMode: "cover", opacity: 0.9 },
  overlayTop: { position: "absolute", top: 0, left: 0, right: 0, height: "50%", backgroundColor: "rgba(15,28,58,0.93)" },
  overlayBottom: { position: "absolute", top: "35%", left: 0, right: 0, bottom: 0, backgroundColor: "rgba(10,18,40,0.45)" },

  header: { padding: 20, paddingBottom: 0 },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  title: { color: "#fff", fontSize: 26, fontWeight: "bold", marginTop: 15 },
  subtitle: { color: "#C9A84C", fontSize: 13, marginTop: 2, paddingBottom: 16 },
  adhanBtn: { marginTop: 18, width: 38, height: 38, borderRadius: 10, backgroundColor: "rgba(201,168,76,0.15)", borderWidth: 0.5, borderColor: "rgba(201,168,76,0.4)", alignItems: "center", justifyContent: "center" },

  content: { padding: 16, gap: 12 },
  guideCard: { borderRadius: 16, padding: 16, flexDirection: "row", alignItems: "center", gap: 14, borderWidth: 0.5 },
  cardIcon: { width: 56, height: 56, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  cardInfo: { flex: 1 },
  cardTitle: { fontSize: 17, fontWeight: "bold", marginBottom: 2 },
  cardSub: { fontSize: 12, color: "#C9A84C", marginBottom: 6 },
  cardDesc: { fontSize: 13, lineHeight: 18 },
  comingSoon: { borderRadius: 16, padding: 16, borderWidth: 0.5 },
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
  adhanRow: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderRadius: 14, borderWidth: 0.5, marginBottom: 8 },
  adhanRowActive: { borderColor: "#C9A84C", backgroundColor: "rgba(201,168,76,0.08)" },
  adhanRadio: { width: 20, height: 20, borderRadius: 10, borderWidth: 1.5, borderColor: "#ccc", alignItems: "center", justifyContent: "center" },
  adhanRadioActive: { borderColor: "#C9A84C" },
  adhanRadioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: "#C9A84C" },
  adhanName: { fontSize: 14 },
  fajrMeta: { fontSize: 11, marginTop: 2 },
  fajrNote: { fontSize: 12, paddingHorizontal: 4, marginBottom: 12, lineHeight: 17 },
  previewBtn: { padding: 4 },
  selectBtn: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1, borderColor: "#C9A84C" },
  selectBtnActive: { backgroundColor: "#C9A84C" },
  selectBtnText: { fontSize: 12, color: "#C9A84C", fontWeight: "500" },
  selectBtnTextActive: { color: "#1E3A5F", fontWeight: "700" },

  // Done button
  doneBtn: { backgroundColor: "#1E3A5F", borderRadius: 25, padding: 16, alignItems: "center", marginTop: 8 },
  doneBtnText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
})