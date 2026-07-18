// Navigation
import { useRouter } from "expo-router";
// Status bar
import { useTheme } from "@/context/themeContext";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
// Opens external links
import { ScrollView, Share, StyleSheet, Switch, Text, TouchableOpacity, View } from "react-native";
// Dynamic island padding
import { useSafeAreaInsets } from "react-native-safe-area-context";
// Icons
import { cancelAllNotifications, requestNotificationPermission, reschedulePrayerNotificationsFromCache, scheduleDailyDhikrReminders, scheduleDailyVerseNotification, scheduleIslamicDateReminders, setupPrayerNotificationChannel } from "@/lib/notifications";
import { ensureQuranForLanguage } from "@/lib/quranDownload";
import { applyRtlForLanguage } from "@/lib/rtl";
import { LANGUAGES, getLanguageLabel } from "./components/LanguageDropdown";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTranslation } from "react-i18next";
import { Alert } from "react-native";

export default function SettingsScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { isDark, toggleTheme, theme } = useTheme()

  const { t, i18n: i18nInstance } = useTranslation()

  const [notifications, setNotifications] = useState(true)

// Load saved notification preference
useEffect(() => {
  AsyncStorage.getItem("notifications_enabled").then(val => {
    setNotifications(val !== "false")
  })
}, [])

  return (
    <View style={[styles.screen, { backgroundColor: theme.background }]}>
      <StatusBar style={isDark ? "light" : "dark"} />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 16, backgroundColor: theme.header }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t("settings")}</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Preferences section */}
        <View style={[styles.section, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>{t("preferences")}</Text>

          {/* Language */}
            <TouchableOpacity
              style={[styles.settingRow, { borderBottomColor: theme.border }]}
              onPress={() => {
                Alert.alert(
                  t("language"),
                  t("choosePreferredLanguage"),
                  [
                    ...LANGUAGES.map(lang => ({
                      text: lang.label,
                      onPress: async () => {
                        await i18nInstance.changeLanguage(lang.code)
                        await AsyncStorage.setItem("language", lang.code)
                        await applyRtlForLanguage(lang.code)
                        ensureQuranForLanguage(lang.code).catch(console.log)
                      }
                    })),
                    { text: t("cancel"), style: "cancel" as const }
                  ],
                  { cancelable: true }
                )
              }}>
                <View style={[styles.settingIcon, { backgroundColor: "#1E3A5F" }]}>
                  <Ionicons name="language" size={18} color="#fff" />
                </View>
                <View style={styles.settingInfo}>
                  <Text style={[styles.settingLabel, { color: theme.text }]}>{t("language")}</Text>
                  <Text style={[styles.settingValue, { color: theme.textSecondary }]}>
                    {getLanguageLabel(i18nInstance.language)}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={theme.gold} />
              </TouchableOpacity>

          {/* Notifications toggle */}
          <View style={[styles.settingRow, { borderBottomColor: theme.border }]}>
            <View style={[styles.settingIcon, { backgroundColor: "#C9A84C" }]}>
              <Ionicons name="notifications" size={18} color="#fff" />
            </View>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingLabel, { color: theme.text }]}>{t("notifications")}</Text>
              <Text style={[styles.settingValue, { color: theme.textSecondary }]}>{t("receiveUpdates")}</Text>
            </View>
            <Switch
              value={notifications}
              onValueChange={async (val) => {
                setNotifications(val)
                await AsyncStorage.setItem("notifications_enabled", val.toString())
                if (val) {
                  const granted = await requestNotificationPermission()
                  if (granted) {
                    await setupPrayerNotificationChannel().catch(console.log)
                    await scheduleDailyVerseNotification()
                    await scheduleDailyDhikrReminders().catch(console.log)
                    await reschedulePrayerNotificationsFromCache().catch(console.log)
                    await scheduleIslamicDateReminders().catch(console.log)
                  }
                } else {
                  await cancelAllNotifications()
                }
              }}
              trackColor={{ false: "#E0D9CE", true: "#1E3A5F" }}
              thumbColor={notifications ? "#C9A84C" : "#fff"}
            />
          </View>

          {/* Dark mode toggle */}
          <View style={[styles.settingRow, { borderBottomColor: theme.border }]}>
            <View style={[styles.settingIcon, { backgroundColor: "#2C5F8A" }]}>
              <Ionicons name="moon" size={18} color="#fff" />
            </View>
            <View style={styles.settingInfo}>
            <Text style={[styles.settingLabel, { color: theme.text }]}>{t("darkMode")}</Text>
            <Text style={[styles.settingValue, { color: theme.textSecondary }]}>
              {isDark ? t("darkThemeOn") : t("lightThemeOn")}
            </Text>
            </View>
            <Switch
              value={isDark}
              onValueChange={toggleTheme}
              trackColor={{ false: "#E0D9CE", true: "#1E3A5F" }}
              thumbColor={isDark ? "#C9A84C" : "#fff"}
            />
          </View>

        </View>

        {/* Legal section */}
        <View style={[styles.section, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>{t("legal")}</Text>

          {/* Privacy Policy */}
          <TouchableOpacity style={[styles.settingRow, { borderBottomColor: theme.border }]} onPress={() => router.push("/privacy")}>
            <View style={[styles.settingIcon, { backgroundColor: "#1B4332" }]}>
              <Ionicons name="shield-checkmark" size={18} color="#fff" />
            </View>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingLabel, { color: theme.text }]}>{t("privacyPolicy")}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={theme.gold} />
          </TouchableOpacity>

          {/* Terms of Service */}
          <TouchableOpacity style={[styles.settingRow, { borderBottomColor: theme.border }]} onPress={() => router.push("/terms")}>
            <View style={[styles.settingIcon, { backgroundColor: "#1B4332" }]}>
              <Ionicons name="document-text" size={18} color="#fff" />
            </View>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingLabel, { color: theme.text }]}>{t("termsOfService")}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={theme.gold} />
          </TouchableOpacity>

        </View>

        {/* App section */}
        <View style={[styles.section, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>{t("app")}</Text>

          {/* Rate the app */}
          <TouchableOpacity style={[styles.settingRow, { borderBottomColor: theme.border }]}>
            <View style={[styles.settingIcon, { backgroundColor: "#C9A84C" }]}>
              <Ionicons name="star" size={18} color="#1E3A5F" />
            </View>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingLabel, { color: theme.text }]}>{t("rateApp")}</Text>
              <Text style={[styles.settingValue, { color: theme.textSecondary }]}>{t("shareFeedback")}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={theme.gold} />
          </TouchableOpacity>

          {/* Share app */}
          <TouchableOpacity style={[styles.settingRow, { borderBottomColor: theme.border }]} onPress={() => Share.share({ message: "Check out UmrahConnect — the complete Umrah & Hajj companion app! 🕋🌙" })}>
            <View style={[styles.settingIcon, { backgroundColor: "#2C5F8A" }]}>
              <Ionicons name="share-social" size={18} color="#fff" />
            </View>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingLabel, { color: theme.text }]}>{t("shareApp")}</Text>
              <Text style={[styles.settingValue, { color: theme.textSecondary }]}>{t("tellFriends")}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={theme.gold} />
          </TouchableOpacity>

        </View>

        {/* Version */}
        <View style={styles.versionBox}>
          <Text style={[styles.versionText, { color: theme.textSecondary }]}>UmrahConnect v1.0</Text>
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
  section: { marginHorizontal: 16, marginTop: 16, borderRadius: 14, padding: 18, borderWidth: 0.5 },
  sectionTitle: { fontSize: 13, fontWeight: "600", marginBottom: 14, textTransform: "uppercase", letterSpacing: 0.5 },
  settingRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 12, borderBottomWidth: 0.5 },
  settingIcon: { width: 36, height: 36, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  settingInfo: { flex: 1 },
  settingLabel: { fontSize: 15, fontWeight: "500" },
  settingValue: { fontSize: 12, marginTop: 2 },
  comingSoonBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10 },
  comingSoonText: { fontSize: 11, color: "#C9A84C", fontWeight: "600" },
  versionBox: { alignItems: "center", marginTop: 24 },
  versionText: { fontSize: 13 },
  versionSub: { fontSize: 12, color: "#C9A84C", marginTop: 4 },
})