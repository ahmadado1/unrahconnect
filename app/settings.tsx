// Navigation
import { useRouter } from "expo-router";
// Status bar
import { useTheme } from "@/context/themeContext";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
// Opens external links
import { Alert, Modal, Platform, Pressable, ScrollView, Share, StyleSheet, Switch, Text, TouchableOpacity, View } from "react-native";
// Dynamic island padding
import { useSafeAreaInsets } from "react-native-safe-area-context";
// Icons
import { cancelAllNotifications, requestNotificationPermission, reschedulePrayerNotificationsFromCache, scheduleDailyDhikrReminders, scheduleDailyVerseNotification, scheduleIslamicDateReminders, scheduleTestAdhanNotification, setupPrayerNotificationChannel } from "@/lib/notifications";
import { ensureQuranForLanguage } from "@/lib/quranDownload";
import { applyRtlForLanguage } from "@/lib/rtl";
import { LANGUAGES, getLanguageLabel } from "./components/LanguageDropdown";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useTranslation } from "react-i18next";

function parseStoredTime(hourStr: string | null, minuteStr: string | null, fallbackHour: number, fallbackMinute: number) {
  const hour = Number(hourStr ?? fallbackHour)
  const minute = Number(minuteStr ?? fallbackMinute)
  const d = new Date()
  d.setSeconds(0, 0)
  d.setHours(Number.isFinite(hour) ? hour : fallbackHour, Number.isFinite(minute) ? minute : fallbackMinute)
  return d
}

function formatTime(date: Date) {
  const h = date.getHours()
  const m = date.getMinutes()
  const ampm = h >= 12 ? "PM" : "AM"
  const h12 = h % 12 || 12
  return `${h12}:${String(m).padStart(2, "0")} ${ampm}`
}

export default function SettingsScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { isDark, toggleTheme, theme } = useTheme()

  const { t, i18n: i18nInstance } = useTranslation()

  const [notifications, setNotifications] = useState(true)
  const [languageModalOpen, setLanguageModalOpen] = useState(false)
  const [morningAdhkar, setMorningAdhkar] = useState(true)
  const [eveningAdhkar, setEveningAdhkar] = useState(true)
  const [morningTime, setMorningTime] = useState(() => parseStoredTime(null, null, 8, 0))
  const [eveningTime, setEveningTime] = useState(() => parseStoredTime(null, null, 17, 0))
  const [pickerTarget, setPickerTarget] = useState<"morning" | "evening" | null>(null)

  useEffect(() => {
    Promise.all([
      AsyncStorage.getItem("notifications_enabled"),
      AsyncStorage.getItem("adhkar_morning_enabled"),
      AsyncStorage.getItem("adhkar_evening_enabled"),
      AsyncStorage.getItem("adhkar_morning_hour"),
      AsyncStorage.getItem("adhkar_morning_minute"),
      AsyncStorage.getItem("adhkar_evening_hour"),
      AsyncStorage.getItem("adhkar_evening_minute"),
    ]).then(([notif, morningEn, eveningEn, mH, mM, eH, eM]) => {
      setNotifications(notif !== "false")
      setMorningAdhkar(morningEn !== "false")
      setEveningAdhkar(eveningEn !== "false")
      setMorningTime(parseStoredTime(mH, mM, 8, 0))
      setEveningTime(parseStoredTime(eH, eM, 17, 0))
    })
  }, [])

  const rescheduleAdhkar = async () => {
    if (notifications) {
      await scheduleDailyDhikrReminders().catch(console.log)
    }
  }

  const selectLanguage = async (code: string) => {
    await i18nInstance.changeLanguage(code)
    await AsyncStorage.setItem("language", code)
    await applyRtlForLanguage(code)
    ensureQuranForLanguage(code).catch(console.log)
    await scheduleDailyDhikrReminders().catch(console.log)
    setLanguageModalOpen(false)
  }

  const onTimeChange = async (event: { type?: string }, selected?: Date) => {
    if (Platform.OS === "android") {
      setPickerTarget(null)
      if (event?.type === "dismissed") return
    }
    if (!selected || !pickerTarget) return

    if (pickerTarget === "morning") {
      setMorningTime(selected)
      await AsyncStorage.setItem("adhkar_morning_hour", String(selected.getHours()))
      await AsyncStorage.setItem("adhkar_morning_minute", String(selected.getMinutes()))
    } else {
      setEveningTime(selected)
      await AsyncStorage.setItem("adhkar_evening_hour", String(selected.getHours()))
      await AsyncStorage.setItem("adhkar_evening_minute", String(selected.getMinutes()))
    }
    await rescheduleAdhkar()
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
        <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>{t("preferences")}</Text>

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

          {/* Morning Adhkar reminder */}
          <View style={[styles.settingRow, { borderBottomColor: theme.border, opacity: notifications ? 1 : 0.45 }]}>
            <View style={[styles.settingIcon, { backgroundColor: "#C9A84C" }]}>
              <Ionicons name="sunny" size={18} color="#1E3A5F" />
            </View>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingLabel, { color: theme.text }]}>{t("morningAdhkarReminder")}</Text>
              <TouchableOpacity
                disabled={!notifications || !morningAdhkar}
                onPress={() => setPickerTarget("morning")}
              >
                <Text style={[styles.settingValue, { color: theme.gold }]}>
                  {formatTime(morningTime)} · {t("tapToChangeTime")}
                </Text>
              </TouchableOpacity>
            </View>
            <Switch
              value={morningAdhkar}
              disabled={!notifications}
              onValueChange={async (val) => {
                setMorningAdhkar(val)
                await AsyncStorage.setItem("adhkar_morning_enabled", val.toString())
                await rescheduleAdhkar()
              }}
              trackColor={{ false: "#E0D9CE", true: "#1E3A5F" }}
              thumbColor={morningAdhkar ? "#C9A84C" : "#fff"}
            />
          </View>

          {/* Evening Adhkar reminder */}
          <View style={[styles.settingRow, { borderBottomColor: theme.border, opacity: notifications ? 1 : 0.45 }]}>
            <View style={[styles.settingIcon, { backgroundColor: "#1E3A5F" }]}>
              <Ionicons name="moon" size={18} color="#C9A84C" />
            </View>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingLabel, { color: theme.text }]}>{t("eveningAdhkarReminder")}</Text>
              <TouchableOpacity
                disabled={!notifications || !eveningAdhkar}
                onPress={() => setPickerTarget("evening")}
              >
                <Text style={[styles.settingValue, { color: theme.gold }]}>
                  {formatTime(eveningTime)} · {t("tapToChangeTime")}
                </Text>
              </TouchableOpacity>
            </View>
            <Switch
              value={eveningAdhkar}
              disabled={!notifications}
              onValueChange={async (val) => {
                setEveningAdhkar(val)
                await AsyncStorage.setItem("adhkar_evening_enabled", val.toString())
                await rescheduleAdhkar()
              }}
              trackColor={{ false: "#E0D9CE", true: "#1E3A5F" }}
              thumbColor={eveningAdhkar ? "#C9A84C" : "#fff"}
            />
          </View>

          {/* Test Adhan lock-screen sound (60s) */}
          <TouchableOpacity
            style={[styles.settingRow, { borderBottomColor: theme.border }]}
            onPress={async () => {
              const ok = await scheduleTestAdhanNotification(60)
              if (ok) {
                Alert.alert(t("testAdhanScheduledTitle"), t("testAdhanScheduledBody"))
              } else {
                Alert.alert(t("testAdhanPermissionTitle"), t("testAdhanPermissionBody"))
              }
            }}
          >
            <View style={[styles.settingIcon, { backgroundColor: "#1E3A5F" }]}>
              <Ionicons name="volume-high" size={18} color="#fff" />
            </View>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingLabel, { color: theme.text }]}>{t("testAdhanAlert")}</Text>
              <Text style={[styles.settingValue, { color: theme.textSecondary }]}>
                {t("testAdhanAlertSub")}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={theme.gold} />
          </TouchableOpacity>

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

      {pickerTarget && Platform.OS === "android" && (
        <DateTimePicker
          value={pickerTarget === "morning" ? morningTime : eveningTime}
          mode="time"
          display="default"
          onChange={onTimeChange}
        />
      )}

      <Modal
        visible={pickerTarget !== null && Platform.OS === "ios"}
        animationType="slide"
        transparent
        onRequestClose={() => setPickerTarget(null)}
      >
        <View style={styles.modalRoot}>
          <Pressable style={styles.modalBackdrop} onPress={() => setPickerTarget(null)} />
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
            <Text style={[styles.langTitle, { color: theme.text }]}>
              {pickerTarget === "evening" ? t("eveningAdhkarReminder") : t("morningAdhkarReminder")}
            </Text>
            <DateTimePicker
              value={pickerTarget === "evening" ? eveningTime : morningTime}
              mode="time"
              display="spinner"
              onChange={onTimeChange}
              style={{ alignSelf: "center" }}
            />
            <TouchableOpacity style={styles.langCancel} onPress={() => setPickerTarget(null)}>
              <Text style={styles.langCancelText}>{t("done")}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  langOptionSelected: { backgroundColor: "rgba(201,168,76,0.08)", marginHorizontal: -8, paddingHorizontal: 8, borderRadius: 10 },
  langOptionLabel: { fontSize: 16 },
  langCancel: { alignItems: "center", paddingVertical: 16, marginTop: 4 },
  langCancelText: { color: "#C9A84C", fontSize: 15, fontWeight: "600" },
})