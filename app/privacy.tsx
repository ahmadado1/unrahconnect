import { useTheme } from "@/context/themeContext";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useTranslation } from "react-i18next";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function PrivacyScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { theme, isDark } = useTheme()
  const { t } = useTranslation()

  return (
    <View style={[styles.screen, { backgroundColor: theme.background }]}>
      <StatusBar style={isDark ? "light" : "dark"} />

      <View style={[styles.header, { paddingTop: insets.top + 16, backgroundColor: theme.header }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t("privacyPolicyTitle")}</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} style={styles.content}>
        <Text style={[styles.lastUpdated, { color: theme.textSecondary }]}>{t("lastUpdated")}</Text>

        <Text style={[styles.sectionTitle, { color: theme.text }]}>{t("privacyIntroTitle")}</Text>
        <Text style={[styles.body, { color: theme.textSecondary }]}>{t("privacyIntroBody")}</Text>

        <Text style={[styles.sectionTitle, { color: theme.text }]}>{t("privacyCollectTitle")}</Text>
        <Text style={[styles.body, { color: theme.textSecondary }]}>{t("privacyCollectBody")}</Text>

        <Text style={[styles.sectionTitle, { color: theme.text }]}>{t("privacyUseTitle")}</Text>
        <Text style={[styles.body, { color: theme.textSecondary }]}>{t("privacyUseBody")}</Text>

        <Text style={[styles.sectionTitle, { color: theme.text }]}>{t("privacyStorageTitle")}</Text>
        <Text style={[styles.body, { color: theme.textSecondary }]}>{t("privacyStorageBody")}</Text>

        <Text style={[styles.sectionTitle, { color: theme.text }]}>{t("privacySharingTitle")}</Text>
        <Text style={[styles.body, { color: theme.textSecondary }]}>{t("privacySharingBody")}</Text>

        <Text style={[styles.sectionTitle, { color: theme.text }]}>{t("privacyRightsTitle")}</Text>
        <Text style={[styles.body, { color: theme.textSecondary }]}>{t("privacyRightsBody")}</Text>

        <Text style={[styles.sectionTitle, { color: theme.text }]}>{t("contactUs")}</Text>
        <Text style={[styles.body, { color: theme.textSecondary }]}>{t("privacyContactBody")}</Text>

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
  content: { padding: 20 },
  lastUpdated: { fontSize: 12, marginBottom: 20 },
  sectionTitle: { fontSize: 16, fontWeight: "bold", marginTop: 20, marginBottom: 8 },
  body: { fontSize: 14, lineHeight: 24 },
})
