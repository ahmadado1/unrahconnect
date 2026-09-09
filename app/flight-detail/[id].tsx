import { AppIcon } from "@/components/AppIcon"
import { useTheme } from "@/context/themeContext"
import { getFlightPlatformById } from "@/lib/flights"
import { openExternalUrl } from "@/lib/openAffiliateWebView"
import i18n from "@/i18n"
import { Ionicons } from "@expo/vector-icons"
import { useLocalSearchParams, useRouter } from "expo-router"
import { StatusBar } from "expo-status-bar"
import { useTranslation } from "react-i18next"
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native"
import TouchableOpacity from "@/app/components/AppPressable"
import ScreenState from "@/app/components/ScreenState"
import { useSafeAreaInsets } from "react-native-safe-area-context"

const NAVY = "#1E3A5F"
const GOLD = "#C9A84C"

function openUrl(
  router: ReturnType<typeof useRouter>,
  url: string,
  title?: string,
) {
  if (!url) {
    Alert.alert(i18n.t("unableToOpen"), i18n.t("unableToOpenGeneric"))
    return
  }
  openExternalUrl(router, url, title)
}

export default function FlightDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const { theme } = useTheme()
  const insets = useSafeAreaInsets()
  const { t } = useTranslation()
  const platform = getFlightPlatformById(id)

  if (!platform) {
    return <ScreenState kind="missing" title={t("flightOptionNotFound")} />
  }

  return (
    <View style={[styles.screen, { backgroundColor: theme.background }]}>
      <StatusBar style="light" />
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={[styles.hero, { backgroundColor: platform.brandColor, paddingTop: insets.top + 8 }]}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={22} color="#fff" />
          </TouchableOpacity>
          <AppIcon name={platform.icon} size={48} color="#fff" style={{ marginBottom: 8 }} />
          <Text style={styles.heroName}>{platform.name}</Text>
          <Text style={styles.heroTagline}>{platform.tagline}</Text>
          <Text style={styles.heroSite}>{platform.websiteLabel}</Text>
        </View>

        <View style={styles.content}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            {t("about", { defaultValue: "About" })}
          </Text>
          <Text style={[styles.description, { color: theme.textSecondary }]}>
            {platform.description}
          </Text>

          <View style={[styles.tipCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={styles.tipHeader}>
              <Ionicons name="bulb-outline" size={18} color={GOLD} />
              <Text style={[styles.tipTitle, { color: theme.text }]}>
                {t("pilgrimTip", { defaultValue: "Pilgrim tip" })}
              </Text>
            </View>
            <Text style={[styles.tipText, { color: theme.textSecondary }]}>{platform.pilgrimTip}</Text>
          </View>

          <TouchableOpacity
            style={[styles.primaryBtn, { backgroundColor: platform.brandColor }]}
            onPress={() => openUrl(router, platform.jeddahUrl, platform.name)}
            activeOpacity={0.9}
          >
            <Ionicons name="airplane-outline" size={18} color="#fff" />
            <Text style={styles.primaryBtnText}>
              {t("searchFlightsJeddah", { defaultValue: "Search Flights to Jeddah" })}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.primaryBtn, { backgroundColor: NAVY }]}
            onPress={() => openUrl(router, platform.madinahUrl, platform.name)}
            activeOpacity={0.9}
          >
            <Ionicons name="airplane-outline" size={18} color={GOLD} />
            <Text style={[styles.primaryBtnText, { color: GOLD }]}>
              {t("searchFlightsMadinah", { defaultValue: "Search Flights to Madinah" })}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.outlineBtn, { borderColor: theme.border }]}
            onPress={() => openUrl(router, platform.website, platform.name)}
            activeOpacity={0.9}
          >
            <Ionicons name="globe-outline" size={18} color={GOLD} />
            <Text style={[styles.outlineBtnText, { color: theme.text }]}>
              {t("visitWebsite", { defaultValue: "Visit Website" })}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  notFound: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  notFoundText: { fontSize: 18 },
  backLink: { color: GOLD, marginTop: 10 },
  hero: {
    paddingHorizontal: 20,
    paddingBottom: 28,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "rgba(0,0,0,0.25)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  heroEmoji: { fontSize: 36, marginBottom: 10 },
  heroName: { color: "#fff", fontSize: 26, fontWeight: "bold" },
  heroTagline: { color: "rgba(255,255,255,0.9)", fontSize: 14, marginTop: 8, lineHeight: 20 },
  heroSite: { color: "rgba(255,255,255,0.7)", fontSize: 12, marginTop: 10, fontWeight: "600" },
  content: { padding: 20 },
  sectionTitle: { fontSize: 17, fontWeight: "bold", marginBottom: 10 },
  description: { fontSize: 14, lineHeight: 22, marginBottom: 18 },
  tipCard: {
    borderRadius: 16,
    borderWidth: 0.5,
    padding: 14,
    marginBottom: 20,
  },
  tipHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 },
  tipTitle: { fontSize: 14, fontWeight: "700" },
  tipText: { fontSize: 13, lineHeight: 19 },
  primaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 16,
    paddingVertical: 15,
    marginBottom: 10,
  },
  primaryBtnText: { color: "#fff", fontSize: 15, fontWeight: "700" },
  outlineBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 16,
    paddingVertical: 15,
    borderWidth: 1,
    marginTop: 4,
  },
  outlineBtnText: { fontSize: 15, fontWeight: "600" },
})
