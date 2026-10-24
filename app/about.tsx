import { AppIcon, ICON_GOLD } from "@/components/AppIcon";
import { AnimatedHeroIcon } from "@/components/AnimatedHeroIcon";
import { useTheme } from "@/context/themeContext";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useTranslation } from "react-i18next";
import { Linking, ScrollView, StyleSheet, Text, View } from "react-native"
import TouchableOpacity from "@/app/components/AppPressable"
import { useSafeAreaInsets } from "react-native-safe-area-context";

const INSTAGRAM_HANDLE = "@umrahconnectapp"
const INSTAGRAM_URL = "https://www.instagram.com/umrahconnectapp/"

const FEATURES = [
  { icon: "bed" as const, titleKey: "hotelsTitle", descKey: "aboutHotelsDesc" },
  { icon: "restaurant" as const, titleKey: "restaurantsTitle", descKey: "aboutRestaurantsDesc" },
  { icon: "kaaba" as const, titleKey: "umrahGuideTitle", descKey: "aboutUmrahDesc" },
  { icon: "crescent" as const, titleKey: "hajjGuideTitle", descKey: "aboutHajjDesc" },
  { icon: "bag" as const, titleKey: "mallsShopping", descKey: "aboutShoppingDesc" },
  { icon: "mosque" as const, titleKey: "mosquesZiyarat", descKey: "aboutZiyaratDesc" },
] as const;

export default function AboutScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { theme, isDark } = useTheme()
  const { t } = useTranslation()

  return (
    <View style={[styles.screen, { backgroundColor: theme.background }]}>
      <StatusBar style={isDark ? "light" : "dark"} />

      {/* Header */}
      <View style={[styles.header, {  paddingTop: insets.top, backgroundColor: theme.header }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
          <Text style={styles.headerTitle}>{t("aboutUs")}</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView keyboardDismissMode="on-drag" keyboardShouldPersistTaps="handled"
        style={{ backgroundColor: theme.header }}
        contentContainerStyle={{ backgroundColor: theme.background, flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
      >

        {/* Logo section, always navy */}
        <View style={[styles.logoSection, { backgroundColor: theme.header }]}>
          <AnimatedHeroIcon name="moon" size={60} accent="gold" style={{ marginBottom: 12 }} />
          <Text style={styles.appName}>UmrahConnect</Text>
          <Text style={styles.tagline}>{t("tagline")}</Text>
          <View style={styles.locationRow}>
            <Ionicons name="location" size={14} color="#C9A84C" />
            <Text style={styles.location}>{t("basedInEgypt")}</Text>
          </View>
        </View>

        {/* Mission */}
        <View style={[styles.section, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>{t("ourMission")}</Text>
          <Text style={[styles.sectionText, { color: theme.textSecondary }]}>
            {t("ourMissionText")}
          </Text>
        </View>

        {/* What we offer */}
        <View style={[styles.section, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>{t("whatWeOffer")}</Text>

          {FEATURES.map((feature) => (
            <View key={feature.titleKey} style={styles.featureItem}>
              <AppIcon name={feature.icon} size={24} color={ICON_GOLD} />
              <View style={styles.featureInfo}>
                <Text style={[styles.featureName, { color: theme.text }]}>{t(feature.titleKey)}</Text>
                <Text style={[styles.featureDesc, { color: theme.textSecondary }]}>{t(feature.descKey)}</Text>
              </View>
            </View>
          ))}

        </View>

        {/* Social media */}
        <View style={[styles.section, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>{t("followUs")}</Text>
        {/* Instagram: opens the Instagram app if installed, else the website */}
        <TouchableOpacity
          style={styles.socialRow}
          onPress={() => Linking.openURL(INSTAGRAM_URL)}
          accessibilityRole="link"
          accessibilityLabel={`Instagram ${INSTAGRAM_HANDLE}`}
        >
          <View style={styles.igIcon}>
            <Ionicons name="logo-instagram" size={22} color="#fff" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.socialName, { color: theme.text }]}>Instagram</Text>
            <Text style={[styles.socialHandle, { color: theme.textSecondary }]}>{INSTAGRAM_HANDLE}</Text>
          </View>
          <Ionicons name="open-outline" size={18} color="#C9A84C" />
        </TouchableOpacity>
        </View>

        {/* Version */}
        <View style={styles.versionBox}>
          <Text style={[styles.versionText, { color: theme.textSecondary }]}>{t("version")}</Text>
          <Text style={styles.versionSub}>{t("madeInEgypt")}</Text>
        </View>

        <View style={{ height: 60 }} />
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: { padding: 20, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  backBtn: { backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 20, padding: 8 },
  headerTitle: { color: "#fff", fontSize: 18, fontWeight: "bold" },
  logoSection: { alignItems: "center", padding: 32, paddingTop: 24 },
  appName: { color: "#fff", fontSize: 26, fontWeight: "bold", marginBottom: 6 },
  tagline: { color: "#C9A84C", fontSize: 14, marginBottom: 10 },
  locationRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  location: { color: "rgba(255,255,255,0.6)", fontSize: 13 },
  section: { marginHorizontal: 16, marginTop: 16, borderRadius: 16, padding: 18, borderWidth: 0.5 },
  sectionTitle: { fontSize: 16, fontWeight: "bold", marginBottom: 12 },
  sectionText: { fontSize: 14, lineHeight: 22 },
  featureItem: { flexDirection: "row", gap: 12, marginBottom: 14, alignItems: "flex-start" },
  featureInfo: { flex: 1 },
  featureName: { fontSize: 14, fontWeight: "bold", marginBottom: 2 },
  featureDesc: { fontSize: 13, lineHeight: 20 },
  comingSoon: { fontSize: 14, textAlign: "center", padding: 10 },
  socialRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 4 },
  igIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: "#D6249F", alignItems: "center", justifyContent: "center" },
  socialName: { fontSize: 15, fontWeight: "700" },
  socialHandle: { fontSize: 13, marginTop: 1 },
  versionBox: { alignItems: "center", marginTop: 24 },
  versionText: { fontSize: 13 },
  versionSub: { fontSize: 12, color: "#C9A84C", marginTop: 4 },
})
