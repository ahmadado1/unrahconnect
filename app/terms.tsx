import { useTheme } from "@/context/themeContext";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useTranslation } from "react-i18next";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function TermsScreen() {
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
        <Text style={styles.headerTitle}>{t("termsOfServiceTitle")}</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} style={styles.content}>
        <Text style={[styles.lastUpdated, { color: theme.textSecondary }]}>{t("lastUpdated")}</Text>

        <Text style={[styles.sectionTitle, { color: theme.text }]}>{t("termsAcceptTitle")}</Text>
        <Text style={[styles.body, { color: theme.textSecondary }]}>{t("termsAcceptBody")}</Text>

        <Text style={[styles.sectionTitle, { color: theme.text }]}>{t("termsUseTitle")}</Text>
        <Text style={[styles.body, { color: theme.textSecondary }]}>{t("termsUseBody")}</Text>

        <Text style={[styles.sectionTitle, { color: theme.text }]}>{t("termsAccountsTitle")}</Text>
        <Text style={[styles.body, { color: theme.textSecondary }]}>{t("termsAccountsBody")}</Text>

        <Text style={[styles.sectionTitle, { color: theme.text }]}>{t("termsInfoTitle")}</Text>
        <Text style={[styles.body, { color: theme.textSecondary }]}>{t("termsInfoBody")}</Text>

        <Text style={[styles.sectionTitle, { color: theme.text }]}>{t("termsBookingsTitle")}</Text>
        <Text style={[styles.body, { color: theme.textSecondary }]}>{t("termsBookingsBody")}</Text>

        <Text style={[styles.sectionTitle, { color: theme.text }]}>{t("termsLinksTitle")}</Text>
        <Text style={[styles.body, { color: theme.textSecondary }]}>{t("termsLinksBody")}</Text>

        <Text style={[styles.sectionTitle, { color: theme.text }]}>{t("termsLiabilityTitle")}</Text>
        <Text style={[styles.body, { color: theme.textSecondary }]}>{t("termsLiabilityBody")}</Text>

        <Text style={[styles.sectionTitle, { color: theme.text }]}>{t("termsChangesTitle")}</Text>
        <Text style={[styles.body, { color: theme.textSecondary }]}>{t("termsChangesBody")}</Text>

        <Text style={[styles.sectionTitle, { color: theme.text }]}>{t("contactUs")}</Text>
        <Text style={[styles.body, { color: theme.textSecondary }]}>{t("termsContactBody")}</Text>

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
