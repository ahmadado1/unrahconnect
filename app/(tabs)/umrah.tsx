import { useTheme } from "@/context/themeContext"
import { Ionicons } from "@expo/vector-icons"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { useAudioPlayer } from "expo-audio"
import { useRouter } from "expo-router"
import { StatusBar } from "expo-status-bar"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { ImageBackground, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import PrayerWidget from "../component/PrayerWidget"

// ─── ADHAN OPTIONS ───────────────────────────────────────────────────────────

const ADHANS = [
  { id: "1", name: "Makkah Style", file: require("../../assets/audio/azan1.mp3") },
  { id: "2", name: "Mishary Al-Afasy", file: require("../../assets/audio/azan2.mp3") },
  { id: "3", name: "Madinah Style", file: require("../../assets/audio/azan3.mp3") },
  { id: "4", name: "Abdul Basit", file: require("../../assets/audio/azan4.mp3") },
  { id: "5", name: "Egyptian Style", file: require("../../assets/audio/azan5.mp3") },
]

export default function GuideScreen() {
  const router = useRouter()
  const { theme, isDark } = useTheme()
  const { t } = useTranslation()
  const insets = useSafeAreaInsets()
  const [adhanPickerOpen, setAdhanPickerOpen] = useState(false)
  const [selectedAdhan, setSelectedAdhan] = useState("1")
  const [previewId, setPreviewId] = useState<string | null>(null)
  const previewPlayer = useAudioPlayer(
    ADHANS.find(a => a.id === previewId)?.file ?? ADHANS[0].file
  )

  const handleSelectAdhan = async (id: string) => {
    setSelectedAdhan(id)
    await AsyncStorage.setItem("selected_adhan", id)
  }

  const handlePreview = (id: string) => {
    previewPlayer.seekTo(0)
    setPreviewId(id)
    previewPlayer.play()
    setTimeout(() => previewPlayer.pause(), 8000)
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
              <Text style={styles.cardEmoji}>🕋</Text>
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
              <Text style={styles.cardEmoji}>☪️</Text>
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
              <Text style={styles.cardEmoji}>📖</Text>
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
            onPress={() => router.push("/islamic-calendar")}
          >
            <View style={[styles.cardIcon, { backgroundColor: isDark ? "#2a1a3a" : "#EEEDFE" }]}>
              <Text style={styles.cardEmoji}>📆</Text>
            </View>
            <View style={styles.cardInfo}>
              <Text style={[styles.cardTitle, { color: theme.text }]}>{t("islamicDates")}</Text>
              <Text style={styles.cardSub}>{t("islamicDatesSub")}</Text>
            </View>
            <Ionicons name="chevron-forward" size={22} color={theme.gold} />
          </TouchableOpacity>

          <View style={[styles.comingSoon, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Text style={[styles.comingSoonTitle, { color: theme.textSecondary }]}>{t("comingSoon")}</Text>
            <View style={styles.comingSoonItem}>
              <Ionicons name="compass-outline" size={20} color={theme.gold} />
              <Text style={[styles.comingSoonText, { color: theme.text }]}>{t("qiblaDirection")}</Text>
            </View>
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* ── ADHAN PICKER MODAL ── */}
      <Modal
        visible={adhanPickerOpen}
        transparent
        animationType="slide"
        statusBarTranslucent
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: theme.card }]}>
            
            {/* Handle */}
            <View style={styles.modalHandle} />
            
            <Text style={[styles.modalTitle, { color: theme.text }]}>{t("chooseAdhan")}</Text>
            <Text style={[styles.modalSub, { color: theme.textSecondary }]}>
              {t("adhanPickerSub")}
            </Text>

            {ADHANS.map(adhan => (
              <View
                key={adhan.id}
                style={[
                  styles.adhanRow,
                  { borderColor: theme.border },
                  selectedAdhan === adhan.id && styles.adhanRowActive
                ]}
              >
                {/* Selected indicator */}
                <View style={[
                  styles.adhanRadio,
                  selectedAdhan === adhan.id && styles.adhanRadioActive
                ]}>
                  {selectedAdhan === adhan.id && (
                    <View style={styles.adhanRadioDot} />
                  )}
                </View>

                <Text style={[
                  styles.adhanName,
                  { color: theme.text },
                  selectedAdhan === adhan.id && { color: "#C9A84C", fontWeight: "600" }
                ]}>
                  {adhan.name}
                </Text>

                {/* Preview button */}
                <TouchableOpacity
                  style={styles.previewBtn}
                  onPress={() => handlePreview(adhan.id)}
                >
                  <Ionicons
                    name={previewId === adhan.id ? "pause-circle" : "play-circle"}
                    size={28}
                    color="#C9A84C"
                  />
                </TouchableOpacity>

                {/* Select button */}
                <TouchableOpacity
                  style={[styles.selectBtn, selectedAdhan === adhan.id && styles.selectBtnActive]}
                  onPress={() => handleSelectAdhan(adhan.id)}
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

            <TouchableOpacity
              style={styles.doneBtn}
              onPress={() => {
                previewPlayer.pause()
                setPreviewId(null)
                setAdhanPickerOpen(false)
              }}
            >
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
  cardEmoji: { fontSize: 28 },
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
  adhanName: { flex: 1, fontSize: 14 },
  previewBtn: { padding: 4 },
  selectBtn: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1, borderColor: "#C9A84C" },
  selectBtnActive: { backgroundColor: "#C9A84C" },
  selectBtnText: { fontSize: 12, color: "#C9A84C", fontWeight: "500" },
  selectBtnTextActive: { color: "#1E3A5F", fontWeight: "700" },

  // Done button
  doneBtn: { backgroundColor: "#1E3A5F", borderRadius: 25, padding: 16, alignItems: "center", marginTop: 8 },
  doneBtnText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
})