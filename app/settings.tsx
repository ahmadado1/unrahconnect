// Navigation
import { useRouter } from "expo-router"
// Status bar
import { useTheme } from "@/context/themeContext"
import { StatusBar } from "expo-status-bar"
import { useState } from "react"
// Opens external links
import {
  Modal,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native"
// Dynamic island padding
import { useSafeAreaInsets } from "react-native-safe-area-context"
// Icons
import { ensureQuranForLanguage } from "@/lib/quranDownload"
import { applyRtlForLanguage } from "@/lib/rtl"
import { scheduleDailyDhikrReminders } from "@/lib/notifications"
import { LANGUAGES, getLanguageLabel } from "./components/LanguageDropdown"
import { Ionicons } from "@expo/vector-icons"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { useTranslation } from "react-i18next"

export default function SettingsScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { isDark, toggleTheme, theme } = useTheme()

  const { t, i18n: i18nInstance } = useTranslation()

  const [languageModalOpen, setLanguageModalOpen] = useState(false)

  const selectLanguage = async (code: string) => {
    await i18nInstance.changeLanguage(code)
    await AsyncStorage.setItem("language", code)
    await applyRtlForLanguage(code)
    ensureQuranForLanguage(code).catch(console.log)
    await scheduleDailyDhikrReminders().catch(console.log)
    setLanguageModalOpen(false)
  }

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
          <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>
            {t("preferences")}
          </Text>

          {/* Language — modal list (Android Alert only supports 3 buttons) */}
          <TouchableOpacity
            style={[styles.settingRow, { borderBottomColor: theme.border }]}
            onPress={() => setLanguageModalOpen(true)}
          >
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

          {/* Notifications — dedicated screen */}
          <TouchableOpacity
            style={[styles.settingRow, { borderBottomColor: theme.border }]}
            onPress={() => router.push("/notifications")}
          >
            <View style={[styles.settingIcon, { backgroundColor: "#C9A84C" }]}>
              <Ionicons name="notifications" size={18} color="#fff" />
            </View>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingLabel, { color: theme.text }]}>
                {t("notifications")}
              </Text>
              <Text style={[styles.settingValue, { color: theme.textSecondary }]}>
                {t("notificationsManage")}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={theme.gold} />
          </TouchableOpacity>

          {/* Dark mode toggle */}
          <View style={[styles.settingRow, { borderBottomColor: theme.border, borderBottomWidth: 0 }]}>
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
          <TouchableOpacity
            style={[styles.settingRow, { borderBottomColor: theme.border }]}
            onPress={() => router.push("/privacy")}
          >
            <View style={[styles.settingIcon, { backgroundColor: "#1B4332" }]}>
              <Ionicons name="shield-checkmark" size={18} color="#fff" />
            </View>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingLabel, { color: theme.text }]}>
                {t("privacyPolicy")}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={theme.gold} />
          </TouchableOpacity>

          {/* Terms of Service */}
          <TouchableOpacity
            style={[styles.settingRow, { borderBottomColor: theme.border, borderBottomWidth: 0 }]}
            onPress={() => router.push("/terms")}
          >
            <View style={[styles.settingIcon, { backgroundColor: "#1B4332" }]}>
              <Ionicons name="document-text" size={18} color="#fff" />
            </View>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingLabel, { color: theme.text }]}>
                {t("termsOfService")}
              </Text>
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
              <Text style={[styles.settingValue, { color: theme.textSecondary }]}>
                {t("shareFeedback")}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={theme.gold} />
          </TouchableOpacity>

          {/* Share app */}
          <TouchableOpacity
            style={[styles.settingRow, { borderBottomColor: theme.border, borderBottomWidth: 0 }]}
            onPress={() =>
              Share.share({
                message: "Check out UmrahConnect — the complete Umrah & Hajj companion app!",
              })
            }
          >
            <View style={[styles.settingIcon, { backgroundColor: "#2C5F8A" }]}>
              <Ionicons name="share-social" size={18} color="#fff" />
            </View>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingLabel, { color: theme.text }]}>{t("shareApp")}</Text>
              <Text style={[styles.settingValue, { color: theme.textSecondary }]}>
                {t("tellFriends")}
              </Text>
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

      <Modal
        visible={languageModalOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setLanguageModalOpen(false)}
      >
        <View style={styles.modalRoot}>
          <Pressable style={styles.modalBackdrop} onPress={() => setLanguageModalOpen(false)} />
          <View
            style={[
              styles.langSheet,
              {
                backgroundColor: theme.card,
                paddingBottom: Math.max(insets.bottom, 16),
              },
            ]}
          >
            <View style={styles.langHandle} />
            <Text style={[styles.langTitle, { color: theme.text }]}>{t("language")}</Text>
            <Text style={[styles.langSub, { color: theme.textSecondary }]}>
              {t("choosePreferredLanguage")}
            </Text>
            {/* ScrollView so all 6 languages stay reachable on Android (Alert only shows 3 buttons). */}
            <ScrollView
              style={styles.langList}
              bounces={false}
              nestedScrollEnabled
              showsVerticalScrollIndicator={false}
            >
              {LANGUAGES.map((lang, index) => {
                const selected =
                  i18nInstance.language === lang.code ||
                  i18nInstance.language?.startsWith(`${lang.code}-`)
                return (
                  <TouchableOpacity
                    key={lang.code}
                    style={[
                      styles.langOption,
                      { borderBottomColor: theme.border },
                      index === LANGUAGES.length - 1 && { borderBottomWidth: 0 },
                      selected && styles.langOptionSelected,
                    ]}
                    onPress={() => selectLanguage(lang.code)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.langOptionLabel, { color: theme.text }]}>{lang.label}</Text>
                    {selected && <Ionicons name="checkmark-circle" size={22} color="#C9A84C" />}
                  </TouchableOpacity>
                )
              })}
            </ScrollView>
            <TouchableOpacity style={styles.langCancel} onPress={() => setLanguageModalOpen(false)}>
              <Text style={styles.langCancelText}>{t("cancel")}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backBtn: { backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 20, padding: 8 },
  headerTitle: { color: "#fff", fontSize: 18, fontWeight: "bold" },
  section: {
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 14,
    padding: 18,
    borderWidth: 0.5,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 14,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
  },
  settingIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  settingInfo: { flex: 1 },
  settingLabel: { fontSize: 15, fontWeight: "500" },
  settingValue: { fontSize: 12, marginTop: 2 },
  versionBox: { alignItems: "center", marginTop: 24 },
  versionText: { fontSize: 13 },
  versionSub: { fontSize: 12, color: "#C9A84C", marginTop: 4 },
  modalRoot: {
    flex: 1,
    justifyContent: "flex-end",
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  langSheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 10,
    zIndex: 1,
  },
  langHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(0,0,0,0.2)",
    alignSelf: "center",
    marginBottom: 14,
  },
  langTitle: { fontSize: 18, fontWeight: "700", marginBottom: 4 },
  langSub: { fontSize: 13, marginBottom: 12 },
  langList: { maxHeight: 360 },
  langOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 15,
    borderBottomWidth: 0.5,
  },
  langOptionSelected: {
    backgroundColor: "rgba(201,168,76,0.08)",
    marginHorizontal: -8,
    paddingHorizontal: 8,
    borderRadius: 10,
  },
  langOptionLabel: { fontSize: 16 },
  langCancel: { alignItems: "center", paddingVertical: 16, marginTop: 4 },
  langCancelText: { color: "#C9A84C", fontSize: 15, fontWeight: "600" },
})
