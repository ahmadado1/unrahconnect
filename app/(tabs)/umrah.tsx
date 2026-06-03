import { useTheme } from "@/context/themeContext";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useTranslation } from "react-i18next";
import { ImageBackground, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import PrayerWidget from "../component/PrayerWidget";

export default function GuideScreen() {
  const router = useRouter()
  const { theme, isDark } = useTheme()
  const { t } = useTranslation()
  const insets = useSafeAreaInsets()

  return (
    <View style={[styles.screen, { backgroundColor: theme.background }]}>
      <StatusBar style="light" />

      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Header + Widget — one seamless ImageBackground */}
        <ImageBackground
          source={require("../../assets/images/image56.png")}
          style={styles.heroArea}
          imageStyle={styles.heroImage}
        >
          {/* Dark overlay — heavy at top, lighter at bottom */}
          <View style={styles.overlayTop} />
          <View style={styles.overlayBottom} />

          {/* Header */}
          <View style={[styles.header, { paddingTop: insets.top }]}>
            <Text style={styles.title}>{t("guide")}</Text>
            <Text style={styles.subtitle}>Prayer times & pilgrimage guide</Text>
          </View>

          {/* Prayer widget — now inside the same background */}
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
              <Text style={[styles.cardTitle, { color: theme.text }]}>Quran Reader</Text>
              <Text style={styles.cardSub}>114 surahs · Arabic & translation</Text>
              <Text style={[styles.cardDesc, { color: theme.textSecondary }]}>Full Quran with audio recitation</Text>
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
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1 },

  // Hero area — header + widget share one image
  heroArea: { overflow: "hidden" },
  heroImage: { resizeMode: "cover", opacity: 0.9 },

  // Two overlays simulate a top-to-bottom fade
  overlayTop: {
    position: "absolute", top: 0, left: 0, right: 0, height: "50%",
    backgroundColor: "rgba(15,28,58,0.93)"
  },
  overlayBottom: {
    position: "absolute", top: "35%", left: 0, right: 0, bottom: 0,
    backgroundColor: "rgba(10,18,40,0.45)"
  },

  header: { padding: 20, paddingBottom: 0 },
  title: { color: "#fff", fontSize: 26, fontWeight: "bold", marginTop: 15 },
  subtitle: { color: "#C9A84C", fontSize: 13, marginTop: 2, paddingBottom: 16 },

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
})