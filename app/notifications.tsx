import { ICON_GOLD } from "@/components/AppIcon"
import { useTheme } from "@/context/themeContext"
import {
  cancelAllNotifications,
  requestNotificationPermission,
  reschedulePrayerNotificationsFromCache,
  scheduleDailyDhikrReminders,
  scheduleDailyVerseNotification,
  scheduleIslamicDateReminders,
  scheduleTestAdhanNotification,
  setupPrayerNotificationChannel,
} from "@/lib/notifications"
import { Ionicons } from "@expo/vector-icons"
import AsyncStorage from "@react-native-async-storage/async-storage"
import DateTimePicker from "@react-native-community/datetimepicker"
import * as Notifications from "expo-notifications"
import { useFocusEffect, useRouter } from "expo-router"
import { StatusBar } from "expo-status-bar"
import { useCallback, useState } from "react"
import { useTranslation } from "react-i18next"
import {
  Alert,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"

function parseStoredTime(
  hourStr: string | null,
  minuteStr: string | null,
  fallbackHour: number,
  fallbackMinute: number
) {
  const hour = Number(hourStr ?? fallbackHour)
  const minute = Number(minuteStr ?? fallbackMinute)
  const d = new Date()
  d.setSeconds(0, 0)
  d.setHours(
    Number.isFinite(hour) ? hour : fallbackHour,
    Number.isFinite(minute) ? minute : fallbackMinute
  )
  return d
}

function formatTime(date: Date) {
  const h = date.getHours()
  const m = date.getMinutes()
  const ampm = h >= 12 ? "PM" : "AM"
  const h12 = h % 12 || 12
  return `${h12}:${String(m).padStart(2, "0")} ${ampm}`
}

export default function NotificationsScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { theme, isDark } = useTheme()
  const { t } = useTranslation()

  const [master, setMaster] = useState(true)
  const [prayerAlerts, setPrayerAlerts] = useState(true)
  const [morningAdhkar, setMorningAdhkar] = useState(true)
  const [eveningAdhkar, setEveningAdhkar] = useState(true)
  const [dailyVerse, setDailyVerse] = useState(true)
  const [islamicDates, setIslamicDates] = useState(true)
  const [morningTime, setMorningTime] = useState(() => parseStoredTime(null, null, 8, 0))
  const [eveningTime, setEveningTime] = useState(() => parseStoredTime(null, null, 17, 0))
  const [pickerTarget, setPickerTarget] = useState<"morning" | "evening" | null>(null)

  const loadPrefs = useCallback(async () => {
    const [
      notif,
      prayer,
      morningEn,
      eveningEn,
      verse,
      islamic,
      mH,
      mM,
      eH,
      eM,
    ] = await Promise.all([
      AsyncStorage.getItem("notifications_enabled"),
      AsyncStorage.getItem("prayer_alerts_enabled"),
      AsyncStorage.getItem("adhkar_morning_enabled"),
      AsyncStorage.getItem("adhkar_evening_enabled"),
      AsyncStorage.getItem("daily_verse_enabled"),
      AsyncStorage.getItem("islamic_dates_enabled"),
      AsyncStorage.getItem("adhkar_morning_hour"),
      AsyncStorage.getItem("adhkar_morning_minute"),
      AsyncStorage.getItem("adhkar_evening_hour"),
      AsyncStorage.getItem("adhkar_evening_minute"),
    ])
    setMaster(notif !== "false")
    setPrayerAlerts(prayer !== "false")
    setMorningAdhkar(morningEn !== "false")
    setEveningAdhkar(eveningEn !== "false")
    setDailyVerse(verse !== "false")
    setIslamicDates(islamic !== "false")
    setMorningTime(parseStoredTime(mH, mM, 8, 0))
    setEveningTime(parseStoredTime(eH, eM, 17, 0))
  }, [])

  useFocusEffect(
    useCallback(() => {
      void loadPrefs()
    }, [loadPrefs])
  )

  const enableAllChannels = async () => {
    const granted = await requestNotificationPermission()
    if (!granted) {
      Alert.alert(t("testAdhanPermissionTitle"), t("testAdhanPermissionBody"))
      return false
    }
    await setupPrayerNotificationChannel().catch(console.log)
    if (prayerAlerts) {
      await reschedulePrayerNotificationsFromCache().catch(console.log)
    }
    await scheduleDailyVerseNotification().catch(console.log)
    await scheduleDailyDhikrReminders().catch(console.log)
    await scheduleIslamicDateReminders().catch(console.log)
    return true
  }

  const onMasterChange = async (val: boolean) => {
    setMaster(val)
    await AsyncStorage.setItem("notifications_enabled", String(val))
    if (val) {
      await enableAllChannels()
    } else {
      await cancelAllNotifications()
    }
  }

  const onPrayerChange = async (val: boolean) => {
    setPrayerAlerts(val)
    await AsyncStorage.setItem("prayer_alerts_enabled", String(val))
    if (!master) return
    if (val) {
      await reschedulePrayerNotificationsFromCache().catch(console.log)
    } else {
      const all = await Notifications.getAllScheduledNotificationsAsync()
      for (const n of all) {
        if (n.identifier.startsWith("prayer-")) {
          await Notifications.cancelScheduledNotificationAsync(n.identifier).catch(() => {})
        }
      }
    }
  }

  const rescheduleAdhkar = async () => {
    if (master) await scheduleDailyDhikrReminders().catch(console.log)
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

  const dimmed = !master

  const Row = ({
    icon,
    iconBg,
    iconColor = "#fff",
    label,
    value,
    switchValue,
    onSwitch,
    onPressValue,
    last,
    alwaysActive,
  }: {
    icon: keyof typeof Ionicons.glyphMap
    iconBg: string
    iconColor?: string
    label: string
    value?: string
    switchValue: boolean
    onSwitch: (v: boolean) => void
    onPressValue?: () => void
    last?: boolean
    alwaysActive?: boolean
  }) => (
    <View
      style={[
        styles.row,
        {
          borderBottomColor: theme.border,
          opacity: !alwaysActive && dimmed ? 0.45 : 1,
        },
        last && { borderBottomWidth: 0 },
      ]}
    >
      <View style={[styles.iconWrap, { backgroundColor: iconBg }]}>
        <Ionicons name={icon} size={18} color={iconColor} />
      </View>
      <View style={styles.info}>
        <Text style={[styles.label, { color: theme.text }]}>{label}</Text>
        {!!value &&
          (onPressValue ? (
            <TouchableOpacity
              disabled={(!alwaysActive && dimmed) || !switchValue}
              onPress={onPressValue}
            >
              <Text style={[styles.sub, { color: theme.gold }]}>{value}</Text>
            </TouchableOpacity>
          ) : (
            <Text style={[styles.sub, { color: theme.textSecondary }]}>{value}</Text>
          ))}
      </View>
      <Switch
        value={switchValue}
        disabled={!alwaysActive && dimmed}
        onValueChange={onSwitch}
        trackColor={{ false: "#E0D9CE", true: "#1E3A5F" }}
        thumbColor={switchValue ? "#C9A84C" : "#fff"}
      />
    </View>
  )

  return (
    <View style={[styles.screen, { backgroundColor: theme.background }]}>
      <StatusBar style={isDark ? "light" : "dark"} />

      <View style={[styles.header, { paddingTop: insets.top + 16, backgroundColor: theme.header }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t("notifications")}</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.intro}>
          <Ionicons name="notifications" size={22} color={ICON_GOLD} />
          <Text style={[styles.introText, { color: theme.textSecondary }]}>
            {t("notificationsManage")}
          </Text>
        </View>

        {/* Master */}
        <View style={[styles.section, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>
            {t("generalNotifications", { defaultValue: "General" })}
          </Text>
          <Row
            icon="notifications"
            iconBg="#C9A84C"
            label={t("notifications")}
            value={t("receiveUpdates")}
            switchValue={master}
            onSwitch={onMasterChange}
            alwaysActive
          />
          <Row
            icon="book"
            iconBg="#1E3A5F"
            label={t("dailyVerse")}
            value={t("dailyVerseSub")}
            switchValue={dailyVerse}
            onSwitch={async val => {
              setDailyVerse(val)
              await AsyncStorage.setItem("daily_verse_enabled", String(val))
              if (master) {
                if (val) await scheduleDailyVerseNotification()
                else await Notifications.cancelScheduledNotificationAsync("daily-verse").catch(() => {})
              }
            }}
          />
          <Row
            icon="calendar"
            iconBg="#0E7490"
            label={t("islamicDates")}
            value={t("islamicDatesSub")}
            switchValue={islamicDates}
            onSwitch={async val => {
              setIslamicDates(val)
              await AsyncStorage.setItem("islamic_dates_enabled", String(val))
              if (master) {
                await scheduleIslamicDateReminders().catch(console.log)
              }
            }}
            last
          />
        </View>

        {/* Prayer / Adhan */}
        <View style={[styles.section, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>
            {t("prayerTimes")}
          </Text>
          <Row
            icon="alarm"
            iconBg="#1E3A5F"
            label={t("prayerAdhanAlerts", { defaultValue: "Prayer Adhan alerts" })}
            value={t("prayerAdhanAlertsSub", {
              defaultValue: "Adhan notification at each prayer time",
            })}
            switchValue={prayerAlerts}
            onSwitch={onPrayerChange}
          />
          <TouchableOpacity
            style={[styles.row, { borderBottomColor: theme.border, borderBottomWidth: 0 }]}
            onPress={async () => {
              const ok = await scheduleTestAdhanNotification(60)
              if (ok) {
                Alert.alert(t("testAdhanScheduledTitle"), t("testAdhanScheduledBody"))
              } else {
                Alert.alert(t("testAdhanPermissionTitle"), t("testAdhanPermissionBody"))
              }
            }}
          >
            <View style={[styles.iconWrap, { backgroundColor: "#1E3A5F" }]}>
              <Ionicons name="volume-high" size={18} color="#fff" />
            </View>
            <View style={styles.info}>
              <Text style={[styles.label, { color: theme.text }]}>{t("testAdhanAlert")}</Text>
              <Text style={[styles.sub, { color: theme.textSecondary }]}>
                {t("testAdhanAlertSub")}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={theme.gold} />
          </TouchableOpacity>
        </View>

        {/* Adhkar */}
        <View style={[styles.section, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>
            {t("adhkarSection", { defaultValue: "Adhkar" })}
          </Text>
          <Row
            icon="sunny"
            iconBg="#C9A84C"
            iconColor="#1E3A5F"
            label={t("morningAdhkarReminder")}
            value={`${formatTime(morningTime)} · ${t("tapToChangeTime")}`}
            switchValue={morningAdhkar}
            onSwitch={async val => {
              setMorningAdhkar(val)
              await AsyncStorage.setItem("adhkar_morning_enabled", String(val))
              await rescheduleAdhkar()
            }}
            onPressValue={() => setPickerTarget("morning")}
          />
          <Row
            icon="moon"
            iconBg="#1E3A5F"
            label={t("eveningAdhkarReminder")}
            value={`${formatTime(eveningTime)} · ${t("tapToChangeTime")}`}
            switchValue={eveningAdhkar}
            onSwitch={async val => {
              setEveningAdhkar(val)
              await AsyncStorage.setItem("adhkar_evening_enabled", String(val))
              await rescheduleAdhkar()
            }}
            onPressValue={() => setPickerTarget("evening")}
            last
          />
        </View>

        <View style={{ height: 48 }} />
      </ScrollView>

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
              styles.sheet,
              {
                backgroundColor: theme.card,
                paddingBottom: Math.max(insets.bottom, 16),
              },
            ]}
          >
            <View style={styles.handle} />
            <Text style={[styles.sheetTitle, { color: theme.text }]}>
              {pickerTarget === "evening"
                ? t("eveningAdhkarReminder")
                : t("morningAdhkarReminder")}
            </Text>
            <DateTimePicker
              value={pickerTarget === "evening" ? eveningTime : morningTime}
              mode="time"
              display="spinner"
              onChange={onTimeChange}
              style={{ alignSelf: "center" }}
            />
            <TouchableOpacity style={styles.doneBtn} onPress={() => setPickerTarget(null)}>
              <Text style={styles.doneText}>{t("done")}</Text>
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
  intro: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 4,
  },
  introText: { flex: 1, fontSize: 13, lineHeight: 18 },
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
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  info: { flex: 1 },
  label: { fontSize: 15, fontWeight: "500" },
  sub: { fontSize: 12, marginTop: 2 },
  modalRoot: { flex: 1, justifyContent: "flex-end" },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  sheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 10,
    zIndex: 1,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(0,0,0,0.2)",
    alignSelf: "center",
    marginBottom: 14,
  },
  sheetTitle: { fontSize: 18, fontWeight: "700", marginBottom: 8 },
  doneBtn: {
    marginTop: 8,
    backgroundColor: "#C9A84C",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
  },
  doneText: { color: "#1E3A5F", fontWeight: "700", fontSize: 15 },
})
