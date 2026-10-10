import { AppIcon, AppIconKey } from "@/components/AppIcon"
import { useTheme } from "@/context/themeContext"
import { openGoogleMapsUrl } from "@/lib/openMaps"
import { GOLD, NAVY, ui } from "@/lib/ui"
import { Ionicons } from "@expo/vector-icons"
import { useRouter } from "expo-router"
import { StatusBar } from "expo-status-bar"
import { useTranslation } from "react-i18next"
import { ScrollView, StyleSheet, Text, View } from "react-native"
import TouchableOpacity from "@/app/components/AppPressable"
import { useSafeAreaInsets } from "react-native-safe-area-context"

const SHOPPING = [
  { id: "abraj", icon: "bag" as AppIconKey, titleKey: "abrajMall", subKey: "abrajSub", lat: 21.4183, lng: 39.826 },
  { id: "zal", icon: "storefront" as AppIconKey, titleKey: "souqZal", subKey: "souqZalSub", lat: 21.4157, lng: 39.8198 },
  { id: "madinah-mall", icon: "storefront" as AppIconKey, titleKey: "madinahMall", subKey: "madinahMallSub", lat: 24.4672, lng: 39.615 },
  { id: "ansar", icon: "cart" as AppIconKey, titleKey: "ansarMall", subKey: "ansarMallSub", lat: 24.4698, lng: 39.6118 },
] as const

function openDirections(lat: number, lng: number, name: string) {
  void openGoogleMapsUrl(
    `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`,
    { name, latitude: lat, longitude: lng, directions: true },
  )
}

export default function ShoppingScreen() {
  const router = useRouter()
  const { theme } = useTheme()
  const { t } = useTranslation()
  const insets = useSafeAreaInsets()

  return (
    <View style={[styles.screen, { backgroundColor: theme.background }]}>
      <StatusBar style="light" />
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn} accessibilityRole="button" accessibilityLabel={t("back")}>
            <Ionicons name="arrow-back" size={22} color="#fff" />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>{t("shopping")}</Text>
            <Text style={styles.subtitle}>{t("shoppingSub")}</Text>
          </View>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 28 }]}
        contentInsetAdjustmentBehavior="never"
      >
        {SHOPPING.map(place => (
          <View key={place.id} style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={styles.row}>
              <AppIcon name={place.icon} size={26} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.listTitle, { color: theme.text }]}>{t(place.titleKey)}</Text>
                <Text style={[styles.listSub, { color: theme.textSecondary }]}>{t(place.subKey)}</Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => openDirections(place.lat, place.lng, t(place.titleKey))}
            >
              <Ionicons name="navigate-outline" size={14} color={GOLD} />
              <Text style={styles.actionText}>{t("getDirections")}</Text>
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>
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
  card: { borderRadius: ui.radius, borderWidth: ui.hairline, marginBottom: ui.gap, padding: ui.cardPad },
  row: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  listTitle: { fontSize: 14, fontWeight: "600" },
  listSub: { fontSize: 11, marginTop: 2, lineHeight: 16 },
  actionBtn: {
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: ui.radius,
    backgroundColor: NAVY,
  },
  actionText: { color: GOLD, fontSize: 12, fontWeight: "600" },
})
