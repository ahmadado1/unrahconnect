import FindFlightsCard from "@/app/components/FindFlightsCard"
import TripDetailsSheet, { TripDetailsChip, useTripDetails } from "@/app/components/TripDetailsSheet"
import { AppIcon } from "@/components/AppIcon"
import { useTheme } from "@/context/themeContext"
import { FLIGHT_PLATFORMS } from "@/lib/flights"
import { GOLD, NAVY, ui } from "@/lib/ui"
import { Ionicons } from "@expo/vector-icons"
import { useRouter } from "expo-router"
import { StatusBar } from "expo-status-bar"
import { useTranslation } from "react-i18next"
import { ScrollView, StyleSheet, Text, View } from "react-native"
import TouchableOpacity from "@/app/components/AppPressable"
import { useSafeAreaInsets } from "react-native-safe-area-context"

export default function FlightsScreen() {
  const router = useRouter()
  const { theme } = useTheme()
  const { t } = useTranslation()
  const insets = useSafeAreaInsets()
  const { trip, open: tripOpen, setOpen: setTripOpen, close: closeTrip, onSaved: onTripSaved } = useTripDetails(false)

  return (
    <View style={[styles.screen, { backgroundColor: theme.background }]}>
      <StatusBar style="light" />
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn} accessibilityRole="button" accessibilityLabel={t("back")}>
            <Ionicons name="arrow-back" size={22} color="#fff" />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>{t("coverAviasales")}</Text>
            <Text style={styles.subtitle}>{t("flightsCompare")}</Text>
          </View>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 28 }]}
        contentInsetAdjustmentBehavior="never"
      >
        <FindFlightsCard />
        <TripDetailsChip trip={trip} onPress={() => setTripOpen(true)} light />
        {FLIGHT_PLATFORMS.map(platform => (
          <TouchableOpacity
            key={platform.id}
            style={[
              styles.expandCard,
              {
                backgroundColor: theme.card,
                borderColor: theme.border,
                borderLeftColor: platform.brandColor,
              },
            ]}
            onPress={() => router.push(`/flight-detail/${platform.id}` as any)}
            activeOpacity={0.85}
          >
            <View style={styles.expandHeader}>
              <View style={[styles.flightIcon, { backgroundColor: `${platform.brandColor}18` }]}>
                <AppIcon name={platform.icon} size={26} color={platform.brandColor} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.listTitle, { color: theme.text }]}>{platform.name}</Text>
                <Text style={[styles.listSub, { color: theme.textSecondary }]}>{platform.tagline}</Text>
                <Text style={[styles.flightSite, { color: platform.brandColor }]}>{platform.websiteLabel}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={GOLD} />
            </View>
          </TouchableOpacity>
        ))}
        <Text style={[styles.footer, { color: theme.textSecondary }]}>{t("flightsAviasalesNote")}</Text>
      </ScrollView>
      <TripDetailsSheet visible={tripOpen} initial={trip} onClose={closeTrip} onSaved={onTripSaved} />
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: { backgroundColor: NAVY, paddingBottom: 16 },
  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 4,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  title: { color: "#fff", fontSize: 26, fontWeight: "bold" },
  subtitle: { color: GOLD, fontSize: 13, marginTop: 2 },
  content: { padding: ui.space },
  expandCard: {
    borderRadius: ui.radius,
    borderWidth: ui.hairline,
    borderLeftWidth: 3,
    marginBottom: ui.gap,
    padding: ui.cardPad,
  },
  expandHeader: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  flightIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  listTitle: { fontSize: 14, fontWeight: "600" },
  listSub: { fontSize: 11, marginTop: 2, lineHeight: 16 },
  flightSite: { fontSize: 11, fontWeight: "600", marginTop: 4 },
  footer: { fontSize: 12, textAlign: "center", marginTop: 8, marginBottom: 12 },
})
