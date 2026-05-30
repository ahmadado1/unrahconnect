import { useTheme } from "@/context/themeContext";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useTranslation } from "react-i18next";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function GuideScreen() {
  const router = useRouter()
  const { theme, isDark } = useTheme()
  const { t } = useTranslation()

  return (
    <View style={[styles.screen, { backgroundColor: theme.background }]}>
      <StatusBar style="light" />
      {/* Dynamic island — always navy */}
      <SafeAreaView edges={["top"]} style={styles.safeTop} />

      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Header — always navy */}
        <View style={styles.header}>
          <Text style={styles.title}>{t("guide")}</Text>
          <Text style={styles.subtitle}>{t("chooseJourney")}</Text>
        </View>

        <View style={styles.content}>

          {/* Umrah Card */}
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

          {/* Hajj Card */}
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

          {/* Coming soon */}
          <View style={[styles.comingSoon, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Text style={[styles.comingSoonTitle, { color: theme.textSecondary }]}>{t("comingSoon")}</Text>
            <View style={styles.comingSoonItem}>
              <Ionicons name="book-outline" size={20} color={theme.gold} />
              <Text style={[styles.comingSoonText, { color: theme.text }]}>{t("quranReader")}</Text>
            </View>
            <View style={styles.comingSoonItem}>
              <Ionicons name="time-outline" size={20} color={theme.gold} />
              <Text style={[styles.comingSoonText, { color: theme.text }]}>{t("prayerTimes")}</Text>
            </View>
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
  safeTop: { backgroundColor: "#1E3A5F" },
  header: { backgroundColor: "#1E3A5F", padding: 20, paddingBottom: 24 },
  title: { color: "#fff", fontSize: 26, fontWeight: "bold" },
  subtitle: { color: "#C9A84C", fontSize: 13, marginTop: 4 },
  content: { padding: 16 },
  guideCard: { borderRadius: 16, padding: 16, marginBottom: 16, flexDirection: "row", alignItems: "center", gap: 14, borderWidth: 0.5 },
  cardIcon: { width: 56, height: 56, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  cardEmoji: { fontSize: 28 },
  cardInfo: { flex: 1 },
  cardTitle: { fontSize: 17, fontWeight: "bold", marginBottom: 2 },
  cardSub: { fontSize: 12, color: "#C9A84C", marginBottom: 6 },
  cardDesc: { fontSize: 13, lineHeight: 18 },
  comingSoon: { borderRadius: 16, padding: 16, borderWidth: 0.5, marginTop: 8 },
  comingSoonTitle: { fontSize: 13, fontWeight: "600", marginBottom: 12, textTransform: "uppercase", letterSpacing: 0.5 },
  comingSoonItem: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 12 },
  comingSoonText: { fontSize: 14 },
})