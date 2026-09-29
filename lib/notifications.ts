import i18n from "@/i18n"
import {
  fetchAndCacheIslamicEvents,
  getEventNotificationCopy,
  ISLAMIC_EVENTS_HIJRI,
  type IslamicEvent,
} from "@/lib/islamicEvents"
import { isAdhanPlaying, isAdhanPlayingFor } from "@/lib/adhanAudio"
import {
  cancelPrayerAlarms,
  scheduleTestPrayerAlarm,
  syncPrayerAlarms,
} from "@/modules/prayer-alarm"
import { triggerPrayerAlert } from "@/lib/prayerAlert"
import { DEFAULT_ADHAN_ID, prayerNameFromNotification } from "@/lib/prayerConstants"
import { ADHAN_RECITERS, getAdhanLockSoundName, resolveAdhanId } from "@/lib/adhanCatalog"
import {
  emptyKahfProgress,
  getKahfFridayDate,
  getKahfWeekId,
  loadKahfWeeklyProgress,
  KAHF_READER_ROUTE,
} from "@/lib/kahfWeekly"
import { parsePrayerTimeHourMinute, readCachedPrayerTimes } from "@/lib/prayerTimes"
import {
  HAJJ_JOURNEY_PHASES,
  UMRAH_JOURNEY_PHASES,
  journeyNotifKind,
  kahfNotifKind,
  mulkNotifKind,
  nextWeekdayAt,
  isSameLocalDay,
  type JourneyNotifKind,
  type KahfNotifKind,
  type MulkNotifKind,
} from "@/lib/progressNotifCopy"
import { loadLastReadState } from "@/lib/quranLastRead"
import { ayahCountForSurah } from "@/lib/quranSurahMeta"
import { AL_MULK_SURAH_NUMBER } from "@/lib/homeQuranCard"
import { getHajjProgress, getUmrahProgress } from "@/lib/supabase"
import AsyncStorage from "@react-native-async-storage/async-storage"
import * as Device from "expo-device"
import * as Location from "expo-location"
import * as Notifications from "expo-notifications"
import {
  AndroidAudioContentType,
  AndroidAudioUsage,
} from "expo-notifications"
import { Platform } from "react-native"

export const PRAYER_CHANNEL_ID = "prayer-adhan"
/**
 * Android channels with lock-screen Adhan clips.
 * v11 uses the reciter lock clips in assets/adhan.
 * iOS custom notification sounds do NOT support MP3
 * (Apple requires aiff/wav/caf, under 30 seconds). WAV works on both iOS and Android.
 * The iOS 26 alarm uses the same basename. Full Adhan playback stays the long mp3.
 * Basename must match app.json expo-notifications plugin sounds exactly.
 */
const PRAYER_CHANNEL_PREFIX = "prayer-adhan-v11"

export function getPrayerChannelId(adhanId: string, isFajr = false) {
  return isFajr
    ? `${PRAYER_CHANNEL_PREFIX}-${adhanId}-fajr`
    : `${PRAYER_CHANNEL_PREFIX}-${adhanId}`
}

/**
 * Must match basename of files in app.json → notification.sounds / plugin sounds.
 * Always .wav (iOS-safe). Full Adhan in-app still uses the long .mp3 via expo-audio.
 */
export function getNotificationAdhanSound(adhanId: string, isFajr = false) {
  return getAdhanLockSoundName(adhanId, isFajr)
}

async function getSelectedAdhanId() {
  return (await AsyncStorage.getItem("selected_adhan")) || DEFAULT_ADHAN_ID
}

async function ensureAndroidChannel(adhanId: string, isFajr: boolean) {
  const channelId = getPrayerChannelId(adhanId, isFajr)
  // Expo docs: provide ONLY the base filename (e.g. azan3_lock.wav)
  const adhanSound = getNotificationAdhanSound(adhanId, isFajr)

  await Notifications.setNotificationChannelAsync(channelId, {
    name: isFajr ? "Fajr Adhan" : "Prayer Adhan",
    description: isFajr
      ? "Fajr prayer Adhan with full-volume alert"
      : "Prayer time Adhan alerts",
    importance: Notifications.AndroidImportance.MAX,
    sound: adhanSound,
    vibrationPattern: [0, 250, 250, 250],
    enableVibrate: true,
    bypassDnd: true,
    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
    // ALARM usage is more reliable than ringtone for prayer alerts on Android
    audioAttributes: {
      usage: AndroidAudioUsage.ALARM,
      contentType: AndroidAudioContentType.SONIFICATION,
      flags: {
        enforceAudibility: true,
        requestHardwareAudioVideoSynchronization: false,
      },
    },
  })

  console.log("[Notifications] Android channel ready:", channelId, "sound:", adhanSound)
  return channelId
}

export async function setupPrayerNotificationChannel(selectedAdhan?: string) {
  if (Platform.OS !== "android") return null

  const adhanId = resolveAdhanId(selectedAdhan || (await getSelectedAdhanId()))

  // Pre-create channels for every Adhan voice so switching never hits a missing channel.
  for (const reciter of ADHAN_RECITERS) {
    await ensureAndroidChannel(reciter.id, false)
    await ensureAndroidChannel(reciter.id, true)
  }

  // Remove silent / outdated channels (Android locks sound after channel create).
  await Notifications.deleteNotificationChannelAsync(PRAYER_CHANNEL_ID).catch(() => {})
  const retiredIds = ["1", "2", "3", "4", "5", ...ADHAN_RECITERS.map(reciter => reciter.id)]
  for (const id of retiredIds) {
    for (const prefix of [
      "prayer-adhan-v2-",
      "prayer-adhan-v3-",
      "prayer-adhan-v4-",
      "prayer-adhan-v5-",
      "prayer-adhan-v6-silent-",
      "prayer-adhan-v7-",
      "prayer-adhan-v8-",
      "prayer-adhan-v9-",
      "prayer-adhan-v10-",
    ]) {
      await Notifications.deleteNotificationChannelAsync(`${prefix}${id}`).catch(() => {})
      await Notifications.deleteNotificationChannelAsync(`${prefix}${id}-fajr`).catch(() => {})
    }
  }

  return getPrayerChannelId(adhanId, false)
}

Notifications.setNotificationHandler({
  handleNotification: async notification => {
    const identifier = notification.request.identifier
    const data = notification.request.content.data as Record<string, unknown> | undefined
    const isTest = identifier === "prayer-adhan-test"
    const isPrayer = identifier.startsWith("prayer-") || isTest

    if (isPrayer && !isTest) {
      const prayerName = prayerNameFromNotification(identifier, data)
      if (prayerName) {
        // App open: full Adhan via expo-audio (not the short notification clip).
        const prayerAlerts =
          (await AsyncStorage.getItem("prayer_alerts_enabled")) !== "false"
        const master = (await AsyncStorage.getItem("notifications_enabled")) !== "false"
        if (master && prayerAlerts && !isAdhanPlayingFor(prayerName)) {
          triggerPrayerAlert(prayerName, {
            playSound: true,
            forceRestart: false,
            continueIfPlaying: true,
            forceShow: true,
          })
        }
      }
    }

    return {
      shouldShowAlert: true,
      // Foreground: suppress system sound for real prayer alerts — expo-audio plays full track.
      // Test notification keeps system sound so we can verify the lock-screen WAV clip.
      shouldPlaySound: !isPrayer || isTest,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
    }
  },
})

export async function requestNotificationPermission(): Promise<boolean> {
  if (!Device.isDevice) {
    console.log("Notifications only work on real devices")
    return false
  }

  const permissions = await Notifications.getPermissionsAsync()
  console.log("Notification permission (current):", permissions.status)

  if (permissions.status !== "granted") {
    const newPermissions = await Notifications.requestPermissionsAsync({
      ios: {
        allowAlert: true,
        allowBadge: true,
        allowSound: true,
        allowCriticalAlerts: false,
      },
      android: {},
    })
    console.log("Notification permission (after request):", newPermissions.status)
    if (newPermissions.status !== "granted") return false
  }

  // Android 13+ needs POST_NOTIFICATIONS; also ensure prayer channels exist early.
  if (Platform.OS === "android") {
    await setupPrayerNotificationChannel().catch(e =>
      console.warn("[Notifications] Android channel setup failed:", e)
    )
  }

  return true
}

/** Verse of the day is shown in the app. Do not schedule a daily push for it. */
export async function scheduleDailyVerseNotification() {
  await Notifications.cancelScheduledNotificationAsync("daily-verse").catch(() => {})
  return false
}

/** Prevent overlapping cancel/schedule races that leave zero prayer alarms. */
let schedulePrayerChain: Promise<void> = Promise.resolve()

function prayersFromTimes(
  prayerTimes: {
    fajr: string
    dhuhr: string
    asr: string
    maghrib: string
    isha: string
  },
  adhanId: string
) {
  const prayers = [
    { name: "Fajr", time: prayerTimes.fajr, arabic: "الفجر" },
    { name: "Dhuhr", time: prayerTimes.dhuhr, arabic: "الظهر" },
    { name: "Asr", time: prayerTimes.asr, arabic: "العصر" },
    { name: "Maghrib", time: prayerTimes.maghrib, arabic: "المغرب" },
    { name: "Isha", time: prayerTimes.isha, arabic: "العشاء" },
  ]
  return prayers.flatMap(prayer => {
    const parsed = parsePrayerTimeHourMinute(prayer.time)
    if (!parsed) return []
    return [
      {
        prayerName: prayer.name,
        hour: parsed.hour,
        minute: parsed.minute,
        soundName: getNotificationAdhanSound(adhanId, prayer.name === "Fajr"),
        title: `${prayer.name} — ${prayer.arabic}`,
      },
    ]
  })
}

export async function schedulePrayerNotifications(
  prayerTimes: {
    fajr: string
    dhuhr: string
    asr: string
    maghrib: string
    isha: string
  },
  selectedAdhan?: string
) {
  const run = async () => {
    const notifEnabled = await AsyncStorage.getItem("notifications_enabled")
    if (notifEnabled === "false") {
      console.warn("[Notifications] Skipping prayer schedule — master notifications off")
      cancelPrayerAlarms()
      return
    }
    const prayerAlerts = (await AsyncStorage.getItem("prayer_alerts_enabled")) !== "false"
    if (!prayerAlerts) {
      console.warn("[Notifications] Skipping prayer schedule — prayer alerts off")
      cancelPrayerAlarms()
      return
    }

    const adhanId = resolveAdhanId(selectedAdhan || (await getSelectedAdhanId()))
    const alarmDrafts = prayersFromTimes(prayerTimes, adhanId)

    const granted = await requestNotificationPermission()
    if (!granted) {
      console.warn("[Notifications] Skipping prayer schedule — permission not granted")
      await syncPrayerAlarms(alarmDrafts)
      return
    }
    await setupPrayerNotificationChannel(adhanId)
    const regularChannelId =
      Platform.OS === "android" ? getPrayerChannelId(adhanId, false) : null
    const fajrChannelId =
      Platform.OS === "android" ? getPrayerChannelId(adhanId, true) : null

    const scheduled = await Notifications.getAllScheduledNotificationsAsync()
    await Promise.all(
      scheduled
        .filter(notif => notif.identifier.startsWith("prayer-"))
        .map(notif =>
          Notifications.cancelScheduledNotificationAsync(notif.identifier).catch(() => {})
        )
    )

    const prayers = [
      { name: "Fajr", time: prayerTimes.fajr, arabic: "الفجر" },
      { name: "Dhuhr", time: prayerTimes.dhuhr, arabic: "الظهر" },
      { name: "Asr", time: prayerTimes.asr, arabic: "العصر" },
      { name: "Maghrib", time: prayerTimes.maghrib, arabic: "المغرب" },
      { name: "Isha", time: prayerTimes.isha, arabic: "العشاء" },
    ]

    let scheduledOk = 0
    for (const prayer of prayers) {
      const parsed = parsePrayerTimeHourMinute(prayer.time)
      if (!parsed) {
        console.warn(`[Notifications] Skipping ${prayer.name} — invalid time:`, prayer.time)
        continue
      }
      const { hour, minute } = parsed
      const isFajr = prayer.name === "Fajr"
      const sound = getNotificationAdhanSound(adhanId, isFajr)
      const channelId = isFajr ? fajrChannelId : regularChannelId

      console.log(
        "Scheduling notification for:",
        prayer.name,
        `${hour}:${String(minute).padStart(2, "0")}`,
        "sound:",
        sound,
        channelId ? `channel:${channelId}` : "ios"
      )

      await Notifications.scheduleNotificationAsync({
        identifier: `prayer-${prayer.name.toLowerCase()}-now`,
        content: {
          title: `${prayer.name} — ${prayer.arabic}`,
          body:
            i18n.language === "ar"
              ? `حان وقت صلاة ${prayer.arabic} · الله أكبر`
              : i18n.language === "fr"
                ? `C'est l'heure de la prière : ${prayer.name}. Allahou Akbar`
                : i18n.language === "tr"
                  ? `${prayer.name} namazı vakti. Allahu Ekber`
                  : i18n.language === "ur"
                    ? `${prayer.name} کی نماز کا وقت ہو گیا۔ اللہ اکبر`
                    : i18n.language === "bn"
                      ? `${prayer.name} নামাজের সময় হয়েছে। আল্লাহু আকবার`
                      : `It's time for ${prayer.name} prayer. Allahu Akbar`,
          // Background/closed: OS plays short lock WAV. Foreground: handler suppresses this.
          sound,
          priority: Notifications.AndroidNotificationPriority.MAX,
          ...(Platform.OS === "ios"
            ? { interruptionLevel: "timeSensitive" as const }
            : {}),
          data: {
            screen: "prayer",
            prayerName: prayer.name,
          },
          ...(Platform.OS === "android" && channelId ? { channelId } : {}),
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour,
          minute,
          ...(Platform.OS === "android" && channelId ? { channelId } : {}),
        },
      })
      scheduledOk++
    }

    const after = await Notifications.getAllScheduledNotificationsAsync()
    const prayerCount = after.filter(n => n.identifier.startsWith("prayer-")).length
    console.log(
      `[Notifications] Scheduled ${prayerCount}/${scheduledOk} prayer alerts (adhan ${adhanId}, ${Platform.OS})`
    )
    await syncPrayerAlarms(alarmDrafts)
  }

  const next = schedulePrayerChain.then(run, run)
  schedulePrayerChain = next.catch(() => {})
  await next
}

/**
 * Fire a one-off Adhan lock-sound notification in ~60s so you can lock the phone and verify audio.
 */
export async function scheduleTestAdhanNotification(seconds = 15) {
  const granted = await requestNotificationPermission()
  if (!granted) {
    console.warn("[Notifications] Test Adhan blocked — permission not granted")
    return false
  }

  const adhanId = resolveAdhanId(await getSelectedAdhanId())
  const sound = getNotificationAdhanSound(adhanId, false)
  const channelId = await setupPrayerNotificationChannel(adhanId)

  await Notifications.cancelScheduledNotificationAsync("prayer-adhan-test").catch(() => {})

  console.log(
    "[Notifications] Scheduling TEST Adhan in",
    seconds,
    "s | sound:",
    sound,
    "| channel:",
    channelId,
    "| platform:",
    Platform.OS
  )

  await Notifications.scheduleNotificationAsync({
    identifier: "prayer-adhan-test",
    content: {
      title: "Test Prayer Notification",
      body: "Testing Adhan sound — lock your phone now",
      sound,
      priority: Notifications.AndroidNotificationPriority.MAX,
      ...(Platform.OS === "ios"
        ? { interruptionLevel: "timeSensitive" as const }
        : {}),
      data: { screen: "prayer", prayerName: "Dhuhr", test: true },
      ...(Platform.OS === "android" && channelId ? { channelId } : {}),
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: Math.max(5, Math.floor(seconds)),
      repeats: false,
      ...(Platform.OS === "android" && channelId ? { channelId } : {}),
    },
  })

  const pending = await Notifications.getAllScheduledNotificationsAsync()
  const test = pending.find(n => n.identifier === "prayer-adhan-test")
  console.log(
    "[Notifications] TEST scheduled OK:",
    !!test,
    "content.sound=",
    (test?.content as { sound?: string } | undefined)?.sound
  )

  await scheduleTestPrayerAlarm("Dhuhr", Math.max(5, Math.floor(seconds)), sound, "Test Prayer")

  return true
}

export async function reschedulePrayerNotificationsFromCache(selectedAdhan?: string) {
  const notifEnabled = await AsyncStorage.getItem("notifications_enabled")
  if (notifEnabled === "false") {
    cancelPrayerAlarms()
    return false
  }

  const prayerAlerts = (await AsyncStorage.getItem("prayer_alerts_enabled")) !== "false"
  if (!prayerAlerts) {
    cancelPrayerAlarms()
    return false
  }

  const { fetchAndCachePrayerTimes, isPrayerTimesCacheFresh, readCachedPrayerTimes } =
    await import("@/lib/prayerTimes")

  let times = await readCachedPrayerTimes()
  if (!isPrayerTimesCacheFresh(times)) {
    times = await fetchAndCachePrayerTimes({ force: true })
  }
  if (!times) return false

  await schedulePrayerNotifications(
    {
      fajr: times.Fajr,
      dhuhr: times.Dhuhr,
      asr: times.Asr,
      maghrib: times.Maghrib,
      isha: times.Isha,
    },
    selectedAdhan
  )
  return true
}

export async function scheduleDailyDhikrReminders() {
  const notifEnabled = await AsyncStorage.getItem("notifications_enabled")
  if (notifEnabled === "false") return false

  const morningEnabled = (await AsyncStorage.getItem("adhkar_morning_enabled")) !== "false"
  const eveningEnabled = (await AsyncStorage.getItem("adhkar_evening_enabled")) !== "false"

  const morningHour = Number((await AsyncStorage.getItem("adhkar_morning_hour")) ?? "8")
  const morningMinute = Number((await AsyncStorage.getItem("adhkar_morning_minute")) ?? "0")
  const eveningHour = Number((await AsyncStorage.getItem("adhkar_evening_hour")) ?? "17")
  const eveningMinute = Number((await AsyncStorage.getItem("adhkar_evening_minute")) ?? "0")

  const slots: Array<{
    id: string
    hour: number
    minute: number
    title: string
    body: string
    period: "morning" | "evening"
    route: string
  }> = []

  if (morningEnabled) {
    slots.push({
      id: "adhkar-reminder-morning",
      hour: Number.isFinite(morningHour) ? morningHour : 8,
      minute: Number.isFinite(morningMinute) ? morningMinute : 0,
      title: i18n.t("morningAdhkarNotifTitle"),
      body: i18n.t("morningAdhkarNotifBody"),
      period: "morning",
      route: "/MorningAdhkarScreen",
    })
  }
  if (eveningEnabled) {
    slots.push({
      id: "adhkar-reminder-evening",
      hour: Number.isFinite(eveningHour) ? eveningHour : 17,
      minute: Number.isFinite(eveningMinute) ? eveningMinute : 0,
      title: i18n.t("eveningAdhkarNotifTitle"),
      body: i18n.t("eveningAdhkarNotifBody"),
      period: "evening",
      route: "/EveningAdhkarScreen",
    })
  }

  // Cancel legacy + current slots
  const cancelIds = [
    "dhikr-reminder",
    "dhikr-reminder-morning",
    "dhikr-reminder-evening",
    "adhkar-reminder-morning",
    "adhkar-reminder-evening",
  ]
  for (const id of cancelIds) {
    await Notifications.cancelScheduledNotificationAsync(id).catch(() => {})
  }

  if (slots.length === 0) return true

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("adhkar-reminders", {
      name: "Morning & Evening Adhkar",
      importance: Notifications.AndroidImportance.DEFAULT,
      sound: "default",
      vibrationPattern: [0, 200, 100, 200],
      enableVibrate: true,
    })
  }

  for (const slot of slots) {
    await Notifications.scheduleNotificationAsync({
      identifier: slot.id,
      content: {
        title: slot.title,
        body: slot.body,
        sound: true,
        data: {
          screen: "adhkar",
          period: slot.period,
          route: slot.route,
        },
        ...(Platform.OS === "android" ? { channelId: "adhkar-reminders" } : {}),
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: slot.hour,
        minute: slot.minute,
        ...(Platform.OS === "android" ? { channelId: "adhkar-reminders" } : {}),
      },
    })
  }

  return true
}

/** @deprecated Use scheduleDailyDhikrReminders — kept for compatibility */
export async function scheduleDhikrReminder(_hour?: number, _minute?: number) {
  return scheduleDailyDhikrReminders()
}

const AL_KAHF_NOTIF_IDS = [
  "al-kahf-thursday-eve",
  "al-kahf-friday",
  "al-kahf-friday-next",
  "al-kahf-friday-evening",
] as const

function kahfNotifCopy(kind: KahfNotifKind): { title: string; body: string } {
  switch (kind) {
    case "continue":
      return {
        title: i18n.t("alKahfNotifFriContinueTitle", { defaultValue: "Continue Surah Al-Kahf" }),
        body: i18n.t("alKahfNotifFriContinueBody", {
          defaultValue: "Pick up Surah Al-Kahf from where you stopped.",
        }),
      }
    case "finish":
      return {
        title: i18n.t("alKahfNotifFriFinishTitle", { defaultValue: "Finish your Kahf" }),
        body: i18n.t("alKahfNotifFriFinishBody", {
          defaultValue: "You're almost there — finish Surah Al-Kahf before Friday ends.",
        }),
      }
    case "dontMiss":
      return {
        title: i18n.t("alKahfNotifFriDontMissTitle", { defaultValue: "Don't miss Surah Al-Kahf today" }),
        body: i18n.t("alKahfNotifFriDontMissBody", {
          defaultValue: "It's Friday — take a moment to read Surah Al-Kahf.",
        }),
      }
    case "start":
    default:
      return {
        title: i18n.t("alKahfNotifThuStartTitle", { defaultValue: "Start reciting Surah Al-Kahf" }),
        body: i18n.t("alKahfNotifThuStartBody", {
          defaultValue: "Tomorrow is Friday — start Surah Al-Kahf when you're ready.",
        }),
      }
  }
}

function kahfNotifContent(kind: KahfNotifKind) {
  const copy = kahfNotifCopy(kind)
  return {
    title: copy.title,
    body: copy.body,
    sound: true as const,
    data: {
      screen: "al-kahf",
      route: KAHF_READER_ROUTE,
      surah: 18,
    },
    ...(Platform.OS === "android" ? { channelId: "quran-reminders" } : {}),
  }
}

async function cancelAlKahfReminders() {
  for (const id of AL_KAHF_NOTIF_IDS) {
    await Notifications.cancelScheduledNotificationAsync(id).catch(() => {})
  }
}

const AL_MULK_NOTIF_ID = "al-mulk-night"
const AL_MULK_NOTIF_ID_NEXT = "al-mulk-night-next"

function mulkNotifCopy(kind: MulkNotifKind): { title: string; body: string } {
  switch (kind) {
    case "continue":
      return {
        title: i18n.t("alMulkNotifContinueTitle", { defaultValue: "Continue Surah Al-Mulk" }),
        body: i18n.t("alMulkNotifContinueBody", {
          defaultValue: "Pick up Surah Al-Mulk from where you stopped.",
        }),
      }
    case "finish":
      return {
        title: i18n.t("alMulkNotifFinishTitle", { defaultValue: "Finish Surah Al-Mulk" }),
        body: i18n.t("alMulkNotifFinishBody", {
          defaultValue: "Finish Surah Al-Mulk before you sleep.",
        }),
      }
    default:
      return {
        title: i18n.t("alMulkNotifStartTitle", {
          defaultValue: i18n.t("alMulkNotifTitle", { defaultValue: "Surah Al-Mulk" }),
        }),
        body: i18n.t("alMulkNotifStartBody", {
          defaultValue: i18n.t("alMulkNotifBody", {
            defaultValue: "Read Surah Al-Mulk before you sleep.",
          }),
        }),
      }
  }
}

function mulkNotifContent(kind: MulkNotifKind = "start") {
  const copy = mulkNotifCopy(kind)
  return {
    title: copy.title,
    body: copy.body,
    sound: true as const,
    data: {
      screen: "al-mulk",
      route: "/quran/67",
      surah: 67,
    },
    ...(Platform.OS === "android" ? { channelId: "quran-reminders" } : {}),
  }
}

async function ensureQuranReminderChannel() {
  if (Platform.OS !== "android") return
  await Notifications.setNotificationChannelAsync("quran-reminders", {
    name: "Quran Reminders",
    importance: Notifications.AndroidImportance.DEFAULT,
    sound: "default",
    vibrationPattern: [0, 200, 100, 200],
    enableVibrate: true,
  })
}

function nextLocalTime(hour: number, minute: number, now = new Date(), extraDays = 0): Date {
  const target = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hour, minute, 0, 0)
  target.setDate(target.getDate() + extraDays)
  if (target.getTime() <= now.getTime()) target.setDate(target.getDate() + 1)
  return target
}

/** Nightly Al-Mulk reminder around 10pm, including Friday nights. */
export async function scheduleAlMulkReminder() {
  await Notifications.cancelScheduledNotificationAsync(AL_MULK_NOTIF_ID).catch(() => {})
  await Notifications.cancelScheduledNotificationAsync(AL_MULK_NOTIF_ID_NEXT).catch(() => {})

  const notifEnabled = await AsyncStorage.getItem("notifications_enabled")
  if (notifEnabled === "false") return false

  await ensureQuranReminderChannel()

  const now = new Date()
  const lastRead = (await loadLastReadState()).entries.find(e => e.surahNumber === AL_MULK_SURAH_NUMBER)
  const readToday = Boolean(lastRead && isSameLocalDay(lastRead.registeredAt, now))
  const tonightKind = mulkNotifKind({
    lastAyah: lastRead?.ayah ?? null,
    ayahCount: ayahCountForSurah(AL_MULK_SURAH_NUMBER),
    readToday,
  })

  const tonight = nextLocalTime(22, 0, now)
  const isTonight = tonight.getDate() === now.getDate() && tonight.getMonth() === now.getMonth()
  const firstKind: MulkNotifKind = isTonight && tonightKind !== "skip" ? tonightKind : "start"
  const firstAt = isTonight && tonightKind === "skip" ? nextLocalTime(22, 0, now, 1) : tonight
  const secondAt = new Date(firstAt)
  secondAt.setDate(secondAt.getDate() + 1)

  await Notifications.scheduleNotificationAsync({
    identifier: AL_MULK_NOTIF_ID,
    content: mulkNotifContent(firstKind),
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: firstAt,
      ...(Platform.OS === "android" ? { channelId: "quran-reminders" } : {}),
    },
  })

  await Notifications.scheduleNotificationAsync({
    identifier: AL_MULK_NOTIF_ID_NEXT,
    content: mulkNotifContent("start"),
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: secondAt,
      ...(Platform.OS === "android" ? { channelId: "quran-reminders" } : {}),
    },
  })

  return true
}

async function fridayEveningDate(now = new Date()): Promise<Date | null> {
  const friday = getKahfFridayDate(now)
  const maghrib = (await readCachedPrayerTimes())?.Maghrib
  const parsed = maghrib ? parsePrayerTimeHourMinute(maghrib) : null
  friday.setHours(parsed?.hour ?? 18, parsed?.minute ?? 0, 0, 0)
  if (friday.getTime() <= now.getTime()) return null
  return friday
}

async function scheduleKahfDate(id: string, date: Date, kind: KahfNotifKind) {
  if (kind === "skip") return
  await Notifications.scheduleNotificationAsync({
    identifier: id,
    content: kahfNotifContent(kind),
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date,
      ...(Platform.OS === "android" ? { channelId: "quran-reminders" } : {}),
    },
  })
}

/** Weekly Kahf reminders: Thu 9pm start, Fri 9:30am + evening from this week's progress. */
export async function scheduleAlKahfReminder() {
  await cancelAlKahfReminders()

  const notifEnabled = await AsyncStorage.getItem("notifications_enabled")
  if (notifEnabled === "false") return false

  if (Platform.OS === "android") {
    await ensureQuranReminderChannel()
  }

  const now = new Date()
  const progress = await loadKahfWeeklyProgress(now)

  await Notifications.scheduleNotificationAsync({
    identifier: "al-kahf-thursday-eve",
    content: kahfNotifContent("start"),
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
      weekday: 5, // Thursday
      hour: 21,
      minute: 0,
    },
  })

  const nextFriAm = nextWeekdayAt(5, 9, 30, now)
  const sameWeekAsNextAm = getKahfWeekId(nextFriAm) === getKahfWeekId(now)
  const nextAmProgress = sameWeekAsNextAm ? progress : emptyKahfProgress(nextFriAm)
  const nextAmKind = kahfNotifKind("FriAm", nextAmProgress)

  if (nextAmKind === "skip") {
    const following = new Date(nextFriAm)
    following.setDate(following.getDate() + 7)
    await scheduleKahfDate("al-kahf-friday", following, "dontMiss")
    const afterThat = new Date(following)
    afterThat.setDate(afterThat.getDate() + 7)
    await scheduleKahfDate("al-kahf-friday-next", afterThat, "dontMiss")
  } else {
    await scheduleKahfDate("al-kahf-friday", nextFriAm, nextAmKind)
    const following = new Date(nextFriAm)
    following.setDate(following.getDate() + 7)
    await scheduleKahfDate("al-kahf-friday-next", following, "dontMiss")
  }

  const eveKind = kahfNotifKind("FriEve", progress)
  const eveningAt = eveKind === "skip" ? null : await fridayEveningDate(now)
  if (eveningAt) {
    await scheduleKahfDate("al-kahf-friday-evening", eveningAt, eveKind)
  }

  return true
}

function journeyNotifCopy(
  type: "umrah" | "hajj",
  kind: Exclude<JourneyNotifKind, "skip">,
  phaseName: string,
): { title: string; body: string } {
  const label = type === "hajj" ? "Hajj" : "Umrah"
  const prefix = type === "hajj" ? "journeyHajj" : "journeyUmrah"
  if (kind === "start") {
    return {
      title: i18n.t(`${prefix}StartTitle`, { defaultValue: `Start your ${label} journey` }),
      body: i18n.t(`${prefix}StartBody`, {
        phase: phaseName,
        defaultValue: `Begin with ${phaseName}. Open UmrahConnect to start.`,
      }),
    }
  }
  if (kind === "finish") {
    return {
      title: i18n.t(`${prefix}FinishTitle`, { defaultValue: `Finish your ${label} journey` }),
      body: i18n.t(`${prefix}FinishBody`, {
        phase: phaseName,
        defaultValue: `You're on ${phaseName} — open UmrahConnect to finish.`,
      }),
    }
  }
  return {
    title: i18n.t(`${prefix}ContinueTitle`, { defaultValue: `Continue your ${label} journey` }),
    body: i18n.t(`${prefix}ContinueBody`, {
      phase: phaseName,
      defaultValue: `Pick up at ${phaseName}. Open UmrahConnect to continue.`,
    }),
  }
}

const JOURNEY_WELCOME_KEY = "journey_welcome_at"
const JOURNEY_OCCASIONAL_KEY = "journey_occasional_at"
const JOURNEY_NEAR_KEY = "journey_near_burst_at"
const JOURNEY_ARAFAH_KEY = "journey_arafah_for"
const OCCASIONAL_GAP_MS = 21 * 24 * 60 * 60 * 1000
const NEAR_GAP_MS = 14 * 24 * 60 * 60 * 1000

/** Saudi Arabia plus the approaches used by pilgrims (Red Sea and Gulf). */
export function isNearSaudiCoords(latitude: number, longitude: number) {
  return latitude >= 15.5 && latitude <= 32.5 && longitude >= 34 && longitude <= 56.5
}

function morningOn(base: Date, hour = 9) {
  const d = new Date(base)
  d.setHours(hour, 0, 0, 0)
  return d
}

function addDays(base: Date, days: number) {
  const d = new Date(base)
  d.setDate(d.getDate() + days)
  return morningOn(d)
}

async function cancelDailyJourneyNotifications() {
  await Promise.all(
    ["journey-reminder", "journey-reminder-umrah", "journey-reminder-hajj"].map(id =>
      Notifications.cancelScheduledNotificationAsync(id).catch(() => {})
    )
  )
}

async function activeJourney(): Promise<"umrah" | "hajj" | null> {
  const [umrah, hajj] = await Promise.all([getUmrahProgress(), getHajjProgress()])
  const umrahOpen = umrah.length < UMRAH_JOURNEY_PHASES
  const hajjOpen = hajj.length < HAJJ_JOURNEY_PHASES
  if (!umrahOpen && !hajjOpen) return null
  if (hajj.length > 0 && hajjOpen) return "hajj"
  if (umrah.length > 0 && umrahOpen) return "umrah"
  if (umrahOpen) return "umrah"
  return "hajj"
}

async function scheduleJourneyAt(
  id: string,
  when: Date,
  type: "umrah" | "hajj",
  phaseName: string,
) {
  if (when.getTime() <= Date.now()) return
  const completed = type === "hajj" ? await getHajjProgress() : await getUmrahProgress()
  const total = type === "hajj" ? HAJJ_JOURNEY_PHASES : UMRAH_JOURNEY_PHASES
  const kind = journeyNotifKind(completed.length, total)
  if (kind === "skip") return
  const copy = journeyNotifCopy(type, kind, phaseName)
  await Notifications.scheduleNotificationAsync({
    identifier: id,
    content: {
      title: copy.title,
      body: copy.body,
      sound: true,
      data: { type },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: when,
    },
  })
}

async function isNearSaudi() {
  try {
    const perm = await Location.getForegroundPermissionsAsync()
    if (perm.status !== "granted") return false
    const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Low })
    return isNearSaudiCoords(pos.coords.latitude, pos.coords.longitude)
  } catch {
    return false
  }
}

/** Progress updates refresh the same sparse schedule. They do not add a daily alarm. */
export async function scheduleJourneyReminder(_phaseName?: string, _type?: "umrah" | "hajj") {
  return scheduleJourneyReminders()
}

const UMRAH_PHASE_TITLE_KEYS = [
  "phase_umrah_1_title",
  "phase_umrah_2_title",
  "phase_umrah_3_title",
  "phase_umrah_4_title",
  "phase_umrah_5_title",
  "phase_umrah_6_title",
  "phase_umrah_7_title",
] as const

const HAJJ_PHASE_TITLE_KEYS = [
  "phase_hajj_1_title",
  "phase_hajj_2_title",
  "phase_hajj_3_title",
  "phase_hajj_4_title",
  "phase_hajj_5_title",
  "phase_hajj_6_title",
  "phase_hajj_7_title",
  "phase_hajj_8_title",
  "phase_hajj_9_title",
] as const

/** One welcome after install, then about every three weeks. Near Saudi: two mornings. Before Arafah: one extra reminder. */
export async function scheduleJourneyReminders() {
  const notifEnabled = await AsyncStorage.getItem("notifications_enabled")
  await cancelDailyJourneyNotifications()
  if (notifEnabled === "false") {
    await Promise.all(
      ["journey-welcome", "journey-occasional", "journey-near-1", "journey-near-2", "journey-arafah"].map(id =>
        Notifications.cancelScheduledNotificationAsync(id).catch(() => {})
      )
    )
    return false
  }

  const type = await activeJourney()
  if (!type) {
    await Promise.all(
      ["journey-welcome", "journey-occasional", "journey-near-1", "journey-near-2", "journey-arafah"].map(id =>
        Notifications.cancelScheduledNotificationAsync(id).catch(() => {})
      )
    )
    return false
  }

  const done = type === "hajj" ? await getHajjProgress() : await getUmrahProgress()
  const keys = type === "hajj" ? HAJJ_PHASE_TITLE_KEYS : UMRAH_PHASE_TITLE_KEYS
  const phaseName = i18n.t(keys[done.length] ?? keys[0])
  const now = new Date()

  const welcomeRaw = await AsyncStorage.getItem(JOURNEY_WELCOME_KEY)
  let welcomeAt = welcomeRaw ? Number(welcomeRaw) : 0
  if (!welcomeAt) {
    welcomeAt = addDays(now, 1).getTime()
    await AsyncStorage.setItem(JOURNEY_WELCOME_KEY, String(welcomeAt))
    await scheduleJourneyAt("journey-welcome", new Date(welcomeAt), type, phaseName)
  }

  const occasionalRaw = await AsyncStorage.getItem(JOURNEY_OCCASIONAL_KEY)
  let occasionalAt = occasionalRaw ? Number(occasionalRaw) : 0
  if (!occasionalAt || occasionalAt <= now.getTime()) {
    occasionalAt = Math.max(welcomeAt + OCCASIONAL_GAP_MS, now.getTime() + OCCASIONAL_GAP_MS)
    await AsyncStorage.setItem(JOURNEY_OCCASIONAL_KEY, String(occasionalAt))
  }
  await Notifications.cancelScheduledNotificationAsync("journey-occasional").catch(() => {})
  await scheduleJourneyAt("journey-occasional", new Date(occasionalAt), type, phaseName)

  if (await isNearSaudi()) {
    const burstRaw = await AsyncStorage.getItem(JOURNEY_NEAR_KEY)
    const burstAt = burstRaw ? Number(burstRaw) : 0
    if (!burstAt || now.getTime() - burstAt > NEAR_GAP_MS) {
      await scheduleJourneyAt("journey-near-1", addDays(now, 1), type, phaseName)
      await scheduleJourneyAt("journey-near-2", addDays(now, 2), type, phaseName)
      await AsyncStorage.setItem(JOURNEY_NEAR_KEY, String(now.getTime()))
    }
  }

  const hajjOpen = (await getHajjProgress()).length < HAJJ_JOURNEY_PHASES
  if (hajjOpen) {
    const events = await fetchAndCacheIslamicEvents().catch(() => [])
    const arafah = events.find(event => event.baseId === "arafah")
    if (arafah) {
      const already = await AsyncStorage.getItem(JOURNEY_ARAFAH_KEY)
      if (already !== arafah.gregorianDate) {
        const lead = new Date(arafah.gregorianYear, arafah.gregorianMonth - 1, arafah.gregorianDay)
        lead.setDate(lead.getDate() - 2)
        const when = morningOn(lead)
        if (when.getTime() > now.getTime()) {
          await scheduleJourneyAt("journey-arafah", when, "hajj", phaseName)
          await AsyncStorage.setItem(JOURNEY_ARAFAH_KEY, arafah.gregorianDate)
        }
      }
    }
  }

  return true
}

export async function scheduleIslamicDateReminders() {
  const notifEnabled = await AsyncStorage.getItem("notifications_enabled")
  if (notifEnabled === "false") return false

  const islamicEnabled = (await AsyncStorage.getItem("islamic_dates_enabled")) !== "false"
  if (!islamicEnabled) {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync()
    for (const notif of scheduled) {
      if (notif.identifier.startsWith("islamic-")) {
        await Notifications.cancelScheduledNotificationAsync(notif.identifier).catch(() => {})
      }
    }
    return false
  }

  if (!Device.isDevice) {
    console.log("Islamic date notifications only work on real devices")
    return false
  }

  const events = await fetchAndCacheIslamicEvents()
  if (!events.length) return false

  const scheduled = await Notifications.getAllScheduledNotificationsAsync()
  for (const notif of scheduled) {
    if (notif.identifier.startsWith("islamic-")) {
      await Notifications.cancelScheduledNotificationAsync(notif.identifier)
    }
  }

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("islamic-events", {
      name: "Islamic Calendar",
      importance: Notifications.AndroidImportance.HIGH,
      sound: "default",
      vibrationPattern: [0, 250, 250, 250],
      enableVibrate: true,
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
    })
  }

  const now = Date.now()
  const eveIds = new Set(
    ISLAMIC_EVENTS_HIJRI.filter(e => e.eveReminder).map(e => e.id)
  )

  let scheduledCount = 0

  for (const event of events) {
    const dayOf = buildEventDate(event, 8, 0)
    if (dayOf && dayOf.getTime() > now) {
      const copy = getEventNotificationCopy(event, "day")
      await Notifications.scheduleNotificationAsync({
        identifier: `islamic-${event.id}-day`,
        content: {
          title: copy.title,
          body: copy.body,
          sound: true,
          data: {
            screen: "islamic-calendar",
            eventId: event.id,
            baseId: event.baseId,
          },
          ...(Platform.OS === "android" ? { channelId: "islamic-events" } : {}),
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: dayOf,
          ...(Platform.OS === "android" ? { channelId: "islamic-events" } : {}),
        },
      })
      scheduledCount++
    }

    if (!eveIds.has(event.baseId)) continue

    // Laylatul Qadr: evening of the day itself (night of power)
    const isLaylatulQadr = event.baseId === "laylatul-qadr"
    const eve = isLaylatulQadr
      ? buildEventDate(event, 20, 0)
      : (() => {
          const d = buildEventDate(event, 20, 0)
          if (!d) return null
          d.setDate(d.getDate() - 1)
          return d
        })()

    if (eve && eve.getTime() > now) {
      const copy = getEventNotificationCopy(event, "eve")
      await Notifications.scheduleNotificationAsync({
        identifier: `islamic-${event.id}-eve`,
        content: {
          title: copy.title,
          body: copy.body,
          sound: true,
          data: {
            screen: "islamic-calendar",
            eventId: event.id,
            baseId: event.baseId,
          },
          ...(Platform.OS === "android" ? { channelId: "islamic-events" } : {}),
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: eve,
          ...(Platform.OS === "android" ? { channelId: "islamic-events" } : {}),
        },
      })
      scheduledCount++
    }
  }

  console.log(`Scheduled ${scheduledCount} Islamic calendar notifications`)
  return scheduledCount > 0
}

function buildEventDate(event: IslamicEvent, hour: number, minute: number) {
  const year = event.gregorianYear
  const month = event.gregorianMonth
  const day = event.gregorianDay

  if (year && month && day) {
    return new Date(year, month - 1, day, hour, minute, 0, 0)
  }

  const parsed = new Date(event.gregorianDate)
  if (Number.isNaN(parsed.getTime())) return null
  parsed.setHours(hour, minute, 0, 0)
  return parsed
}

export async function cancelAllNotifications() {
  cancelPrayerAlarms()
  await Notifications.cancelAllScheduledNotificationsAsync()
}

/** Lock-screen notification clips are ≤30s — only sync within that window. */
const LOCK_CLIP_SYNC_SECONDS = 28

export function handlePrayerNotificationOpen(
  identifier: string,
  data: Record<string, unknown> | undefined,
  navigateToGuide: () => void,
  deliveredAt?: Date | number | string | null
) {
  if (!identifier.startsWith("prayer-")) return false

  const prayerName = prayerNameFromNotification(identifier, data)
  navigateToGuide()

  if (prayerName) {
    const deliveredMs =
      deliveredAt != null ? new Date(deliveredAt).getTime() : NaN
    const elapsedSec = Number.isFinite(deliveredMs)
      ? Math.max(0, (Date.now() - deliveredMs) / 1000)
      : 0

    setTimeout(() => {
      const alreadyPlaying = isAdhanPlaying()

      // Sync with the lock-screen clip only while it would still be playing.
      // Late opens (after the clip ended) start the full Adhan from 0 —
      // never seek far into the track (that felt like a silent "continue").
      const syncWithLockClip =
        !alreadyPlaying &&
        elapsedSec > 1.5 &&
        elapsedSec <= LOCK_CLIP_SYNC_SECONDS

      triggerPrayerAlert(prayerName, {
        playSound: true,
        continueIfPlaying: true,
        forceRestart: !alreadyPlaying && !syncWithLockClip,
        forceShow: true,
        seekSeconds: syncWithLockClip
          ? Math.min(elapsedSec, LOCK_CLIP_SYNC_SECONDS)
          : undefined,
      })
    }, 350)
  }

  return true
}
