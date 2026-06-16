import { useTheme } from "@/context/themeContext";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useTranslation } from "react-i18next";
import { Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function ContactScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { theme, isDark } = useTheme()
  const { t } = useTranslation()

  const phone = "+201222151335"
  const whatsapp = "+201222151335"
  const email = "ahmadado6002@gmail.com"

  return (
    <View style={[styles.screen, { backgroundColor: theme.background }]}>
      <StatusBar style={isDark ? "light" : "dark"} />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 16, backgroundColor: theme.header }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t("contactUs")}</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Top section — always navy */}
        <View style={[styles.topSection, { backgroundColor: theme.header }]}>
          <Text style={styles.topEmoji}>📞</Text>
          <Text style={styles.topTitle}>{t("getInTouch")}</Text>
          <Text style={styles.topSub}>{t("getInTouchSub")}</Text>
        </View>

        {/* Contact buttons */}
        <View style={[styles.section, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>{t("reachUs")}</Text>

          {/* WhatsApp */}
          <TouchableOpacity
            style={[styles.contactBtn, { borderBottomColor: theme.border }]}
            onPress={() => Linking.openURL(`https://wa.me/${whatsapp.replace("+", "")}`)}
          >
            <View style={[styles.contactIcon, { backgroundColor: "#25D366" }]}>
              <Ionicons name="logo-whatsapp" size={22} color="#fff" />
            </View>
            <View style={styles.contactInfo}>
              <Text style={[styles.contactLabel, { color: theme.textSecondary }]}>{t("whatsapp")}</Text>
              <Text style={[styles.contactValue, { color: theme.text }]}>{whatsapp}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={theme.gold} />
          </TouchableOpacity>

          {/* Phone */}
          <TouchableOpacity
            style={[styles.contactBtn, { borderBottomColor: theme.border }]}
            onPress={() => Linking.openURL(`tel:${phone}`)}
          >
            <View style={[styles.contactIcon, { backgroundColor: "#1E3A5F" }]}>
              <Ionicons name="call" size={22} color="#fff" />
            </View>
            <View style={styles.contactInfo}>
              <Text style={[styles.contactLabel, { color: theme.textSecondary }]}>{t("phone")}</Text>
              <Text style={[styles.contactValue, { color: theme.text }]}>{phone}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={theme.gold} />
          </TouchableOpacity>

          {/* Email */}
          <TouchableOpacity
            style={[styles.contactBtn, { borderBottomColor: theme.border }]}
            onPress={() => Linking.openURL(`mailto:${email}`)}
          >
            <View style={[styles.contactIcon, { backgroundColor: "#C9A84C" }]}>
              <Ionicons name="mail" size={22} color="#1E3A5F" />
            </View>
            <View style={styles.contactInfo}>
              <Text style={[styles.contactLabel, { color: theme.textSecondary }]}>{t("email")}</Text>
              <Text style={[styles.contactValue, { color: theme.text }]}>{email}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={theme.gold} />
          </TouchableOpacity>

        </View>

        {/* Response time */}
        <View style={[styles.section, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>{t("responseTime")}</Text>
          <View style={styles.responseItem}>
            <Ionicons name="time-outline" size={18} color={theme.gold} />
            <Text style={[styles.responseText, { color: theme.textSecondary }]}>{t("whatsappResponse")}</Text>
          </View>
          <View style={styles.responseItem}>
            <Ionicons name="time-outline" size={18} color={theme.gold} />
            <Text style={[styles.responseText, { color: theme.textSecondary }]}>{t("whatsappResponse")}</Text>
          </View>
          <View style={styles.responseItem}>
            <Ionicons name="time-outline" size={18} color={theme.gold} />
            <Text style={[styles.responseText, { color: theme.textSecondary }]}>{t("phoneResponse")}</Text>
          </View>
        </View>

        {/* Location */}
        <View style={[styles.section, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>{t("basedIn")}</Text>
          <View style={styles.responseItem}>
            <Ionicons name="location" size={18} color={theme.gold} />
            <Text style={[styles.responseText, { color: theme.textSecondary }]}>{t("egyptServing")}</Text>
          </View>
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
  topSection: { alignItems: "center", padding: 28 },
  topEmoji: { fontSize: 50, marginBottom: 12 },
  topTitle: { color: "#fff", fontSize: 22, fontWeight: "bold", marginBottom: 6 },
  topSub: { color: "rgba(255,255,255,0.6)", fontSize: 13, textAlign: "center" },
  section: { marginHorizontal: 16, marginTop: 16, borderRadius: 14, padding: 18, borderWidth: 0.5 },
  sectionTitle: { fontSize: 16, fontWeight: "bold", marginBottom: 14 },
  contactBtn: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 12, borderBottomWidth: 0.5 },
  contactIcon: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  contactInfo: { flex: 1 },
  contactLabel: { fontSize: 12 },
  contactValue: { fontSize: 14, fontWeight: "500", marginTop: 2 },
  responseItem: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 10 },
  responseText: { fontSize: 14 },
})