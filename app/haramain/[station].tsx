import { useTheme } from "@/context/themeContext"
import { getHaramainStation, HARAMAIN_PHONE_DISPLAY } from "@/lib/haramainStations"
import { Ionicons } from "@expo/vector-icons"
import { useLocalSearchParams, useRouter } from "expo-router"
import { StatusBar } from "expo-status-bar"
import { useTranslation } from "react-i18next"
import type { ReactNode } from "react"
import {
  ImageBackground,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"

function openDirections(lat: number, lng: number) {
  Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`)
}

function callStation(phone: string) {
  Linking.openURL(`tel:+966${phone}`)
}

function InfoRow({ icon, label, value, theme }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string; theme: any }) {
  return (
    <View style={[styles.infoRow, { borderBottomColor: theme.border }]}>
      <View style={styles.infoIcon}>
        <Ionicons name={icon} size={18} color="#C9A84C" />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>{label}</Text>
        <Text style={[styles.infoValue, { color: theme.text }]}>{value}</Text>
      </View>
    </View>
  )
}

function Section({ title, children, theme }: { title: string; children: ReactNode; theme: any }) {
  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: theme.text }]}>{title}</Text>
      <View style={[styles.sectionCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
        {children}
      </View>
    </View>
  )
}

function BulletList({ keys, t, theme }: { keys: string[]; t: (k: string) => string; theme: any }) {
  return keys.map((key, i) => (
    <View
      key={key}
      style={[styles.bulletRow, { borderBottomColor: theme.border, borderBottomWidth: i < keys.length - 1 ? 0.5 : 0 }]}
    >
      <View style={styles.bulletDot} />
      <Text style={[styles.bulletText, { color: theme.text }]}>{t(key)}</Text>
    </View>
  ))
}

export default function HaramainStationScreen() {
  const { station: stationId } = useLocalSearchParams<{ station: string }>()
  const router = useRouter()
  const { theme } = useTheme()
  const { t } = useTranslation()
  const insets = useSafeAreaInsets()

  const station = getHaramainStation(stationId)

  if (!station) {
    return (
      <View style={[styles.notFound, { backgroundColor: theme.background }]}>
        <Text style={[styles.notFoundText, { color: theme.text }]}>{t("stationNotFound")}</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backLink}>{t("goBack")}</Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <View style={[styles.screen, { backgroundColor: theme.background }]}>
      <StatusBar style="light" />

      <ScrollView showsVerticalScrollIndicator={false}>
        <ImageBackground source={{ uri: station.image }} style={styles.hero}>
          <View style={styles.heroOverlay} />
          <TouchableOpacity style={[styles.backBtn, { top: insets.top + 8 }]} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={22} color="#fff" />
          </TouchableOpacity>
          <View style={styles.heroContent}>
            <Text style={styles.heroEmoji}>{station.emoji}</Text>
            <Text style={styles.heroTitle}>{t(station.titleKey)}</Text>
            <Text style={styles.heroArabic}>{t(station.arabicNameKey)}</Text>
            <Text style={styles.heroSub}>{t("haramainRailway")}</Text>
          </View>
        </ImageBackground>

        <View style={styles.content}>
          {/* Quick stats */}
          <View style={[styles.statsRow, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={styles.stat}>
              <Ionicons name="time-outline" size={20} color="#C9A84C" />
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>{t("hhrJourneyTime")}</Text>
              <Text style={[styles.statValue, { color: theme.text }]}>{t(station.journeyKey)}</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: theme.border }]} />
            <View style={styles.stat}>
              <Ionicons name="cash-outline" size={20} color="#C9A84C" />
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>{t("hhrFromPrice")}</Text>
              <Text style={[styles.statValue, { color: theme.text }]}>{t(station.priceEconomyKey)}</Text>
            </View>
          </View>

          <Section title={t("hhrSectionOverview")} theme={theme}>
            <BulletList keys={station.overviewKeys} t={t} theme={theme} />
            <InfoRow icon="location-outline" label={t("address")} value={t(station.addressKey)} theme={theme} />
            <InfoRow icon="time-outline" label={t("hhrOpeningHours")} value={t(station.hoursKey)} theme={theme} />
          </Section>

          <Section title={t("hhrSectionFacilities")} theme={theme}>
            <BulletList keys={station.facilityKeys} t={t} theme={theme} />
          </Section>

          <Section title={t("hhrSectionGettingThere")} theme={theme}>
            <BulletList keys={station.gettingThereKeys} t={t} theme={theme} />
          </Section>

          <Section title={t("hhrSectionBooking")} theme={theme}>
            <BulletList keys={station.bookingKeys} t={t} theme={theme} />
          </Section>

          <Section title={t("hhrSectionTips")} theme={theme}>
            <BulletList keys={station.tipKeys} t={t} theme={theme} />
          </Section>

          {/* Action buttons */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.actionPrimary}
              onPress={() => openDirections(station.lat, station.lng)}
            >
              <Ionicons name="navigate" size={18} color="#C9A84C" />
              <Text style={styles.actionPrimaryText}>{t("getDirections")}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionPrimary} onPress={() => Linking.openURL(station.bookUrl)}>
              <Ionicons name="ticket" size={18} color="#C9A84C" />
              <Text style={styles.actionPrimaryText}>{t("bookTickets")}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionOutline} onPress={() => callStation(station.phone)}>
              <Ionicons name="call" size={18} color="#1E3A5F" />
              <Text style={styles.actionOutlineText}>{t("callStation")} · {HARAMAIN_PHONE_DISPLAY}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ height: 40 + insets.bottom }} />
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  notFound: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  notFoundText: { fontSize: 16, marginBottom: 12 },
  backLink: { color: "#C9A84C", fontWeight: "600" },
  hero: { height: 260, justifyContent: "flex-end" },
  heroOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(30,58,95,0.72)" },
  backBtn: {
    position: "absolute",
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2,
  },
  heroContent: { padding: 20, paddingBottom: 24 },
  heroEmoji: { fontSize: 36, marginBottom: 8 },
  heroTitle: { color: "#fff", fontSize: 26, fontWeight: "bold" },
  heroArabic: { color: "#C9A84C", fontSize: 16, marginTop: 4 },
  heroSub: { color: "rgba(255,255,255,0.75)", fontSize: 13, marginTop: 6 },
  content: { padding: 16 },
  statsRow: {
    flexDirection: "row",
    borderRadius: 14,
    borderWidth: 0.5,
    padding: 16,
    marginBottom: 8,
  },
  stat: { flex: 1, alignItems: "center", gap: 4 },
  statDivider: { width: 1, marginHorizontal: 8 },
  statLabel: { fontSize: 11, textAlign: "center" },
  statValue: { fontSize: 13, fontWeight: "700", textAlign: "center" },
  section: { marginTop: 20 },
  sectionTitle: { fontSize: 17, fontWeight: "bold", marginBottom: 10 },
  sectionCard: { borderRadius: 14, borderWidth: 0.5, overflow: "hidden" },
  bulletRow: { flexDirection: "row", alignItems: "flex-start", gap: 10, padding: 14 },
  bulletDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#C9A84C", marginTop: 7 },
  bulletText: { flex: 1, fontSize: 14, lineHeight: 21 },
  infoRow: { flexDirection: "row", gap: 12, padding: 14, borderTopWidth: 0.5 },
  infoIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "rgba(201,168,76,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  infoLabel: { fontSize: 11, marginBottom: 2 },
  infoValue: { fontSize: 14, lineHeight: 20 },
  actions: { marginTop: 28, gap: 10 },
  actionPrimary: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#1E3A5F",
    paddingVertical: 14,
    borderRadius: 12,
  },
  actionPrimaryText: { color: "#C9A84C", fontSize: 15, fontWeight: "700" },
  actionOutline: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1.5,
    borderColor: "#1E3A5F",
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: "rgba(201,168,76,0.08)",
  },
  actionOutlineText: { color: "#1E3A5F", fontSize: 14, fontWeight: "600" },
})
