import i18n from "@/i18n"
import {
  fetchAndCacheIslamicEvents,
  getEventNotificationCopy,
  ISLAMIC_EVENTS_HIJRI,
  type IslamicEvent,
} from "@/lib/islamicEvents"
import { isAdhanPlaying } from "@/lib/adhanAudio"
import { triggerPrayerAlert } from "@/lib/prayerAlert"
import { DEFAULT_ADHAN_ID, prayerNameFromNotification } from "@/lib/prayerConstants"
import { parsePrayerTimeHourMinute } from "@/lib/prayerTimes"
import AsyncStorage from "@react-native-async-storage/async-storage"
import * as Device from "expo-device"
import * as Notifications from "expo-notifications"
import {
  AndroidAudioContentType,
  AndroidAudioUsage,
} from "expo-notifications"
import { Platform } from "react-native"

export const PRAYER_CHANNEL_ID = "prayer-adhan"
/**
 * Android channels with lock-screen Adhan clips.
 * v8 = WAV sounds (iOS-reliable; Expo recommends .wav over .mp3 for notifications).
 */
const PRAYER_CHANNEL_PREFIX = "prayer-adhan-v8"

export function getPrayerChannelId(adhanId: string, isFajr = false) {
  return isFajr
    ? `${PRAYER_CHANNEL_PREFIX}-${adhanId}-fajr`
    : `${PRAYER_CHANNEL_PREFIX}-${adhanId}`
}

/**
 * Must match basename of files listed in app.json → expo.notification.sounds
 * and expo-notifications plugin sounds (extension included).
 */
function getNotificationAdhanSound(adhanId: string, isFajr = false) {
  const id = ["1", "2", "3", "4", "5"].includes(String(adhanId))
    ? String(adhanId)
    : DEFAULT_ADHAN_ID
  return isFajr ? `azan${id}_fajr_lock.wav` : `azan${id}_lock.wav`
}

async function getSelectedAdhanId() {
  return (await AsyncStorage.getItem("selected_adhan")) || DEFAULT_ADHAN_ID
}

async function ensureAndroidChannel(adhanId: string, isFajr: boolean) {
  const channelId = getPrayerChannelId(adhanId, isFajr)
  const adhanSound = getNotificationAdhanSound(adhanId, isFajr)

  // New channel id (v8) — Android ignores sound changes on existing channels.
  await Notifications.setNotificationChannelAsync(channelId, {
    name: isFajr ? "Fajr Adhan" : "Prayer Times",
    importance: Notifications.AndroidImportance.MAX,
    sound: adhanSound,
    vibrationPattern: [0, 250, 250, 250],
    enableVibrate: true,
    bypassDnd: true,
    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
    audioAttributes: {
      usage: AndroidAudioUsage.NOTIFICATION_RINGTONE,
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

  const adhanId = selectedAdhan || (await getSelectedAdhanId())
  const channelId = await ensureAndroidChannel(adhanId, false)
  await ensureAndroidChannel(adhanId, true)

  // Clean silent / old channels that may still be selected by stale schedules.
  await Notifications.deleteNotificationChannelAsync(PRAYER_CHANNEL_ID).catch(() => {})
  for (const id of ["1", "2", "3", "4", "5"]) {
    for (const prefix of [
      "prayer-adhan-v2-",
      "prayer-adhan-v3-",
      "prayer-adhan-v4-",
      "prayer-adhan-v5-",
      "prayer-adhan-v6-silent-",
      "prayer-adhan-v7-",
    ]) {
      await Notifications.deleteNotificationChannelAsync(`${prefix}${id}`).catch(() => {})
      await Notifications.deleteNotificationChannelAsync(`${prefix}${id}-fajr`).catch(() => {})
    }
  }

  return channelId
}

Notifications.setNotificationHandler({
  handleNotification: async notification => {
    const identifier = notification.request.identifier
    const data = notification.request.content.data as Record<string, unknown> | undefined
    const isPrayer = identifier.startsWith("prayer-") || identifier === "prayer-adhan-test"

    if (isPrayer && identifier !== "prayer-adhan-test") {
      const prayerName = prayerNameFromNotification(identifier, data)
      if (prayerName) {
        // App open: full Adhan via expo-av (not the short notification clip).
        triggerPrayerAlert(prayerName, true)
      }
    }

    return {
      shouldShowAlert: true,
      // Foreground: suppress system sound for real prayer alerts — expo-av plays full track.
      // Test notification keeps system sound so we can verify the lock clip.
      shouldPlaySound: !isPrayer || identifier === "prayer-adhan-test",
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
      },
    })
    console.log("Notification permission (after request):", newPermissions.status)
    return newPermissions.status === "granted"
  }

  return true
}

export async function scheduleDailyVerseNotification() {
  await Notifications.cancelScheduledNotificationAsync("daily-verse")

  await Notifications.scheduleNotificationAsync({
    identifier: "daily-verse",
    content: {
      title: i18n.language === "ar" ? "✨ آية اليوم"
        : i18n.language === "fr" ? "✨ Verset du jour"
        : i18n.language === "tr" ? "✨ Günün Ayeti"
        : i18n.language === "ur" ? "✨ آج کی آیت"
        : i18n.language === "bn" ? "✨ আজকের আয়াত"
        : "✨ Verse of the Day",
      body: i18n.language === "ar" ? "آيتك القرآنية اليومية جاهزة. افتح UmrahConnect لقراءتها."
        : i18n.language === "fr" ? "Votre verset du jour est prêt. Ouvrez UmrahConnect pour le lire."
        : i18n.language === "tr" ? "Günlük Kuran ayetiniz hazır. Okumak için UmrahConnect'i açın."
        : i18n.language === "ur" ? "آپ کی روزانہ کی قرآنی آیت تیار ہے۔ پڑھنے کے لیے UmrahConnect کھولیں۔"
        : i18n.language === "bn" ? "আপনার দৈনিক কুরআনের আয়াত প্রস্তুত। পড়তে UmrahConnect খুলুন।"
        : "Your daily Quran verse is ready. Open UmrahConnect to read it.",
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: 7,
      minute: 0,
    },
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
  const granted = await requestNotificationPermission()
  if (!granted) {
    console.warn("[Notifications] Skipping prayer schedule — permission not granted")
    return
  }

  const adhanId = selectedAdhan || (await getSelectedAdhanId())
  const regularChannelId = await setupPrayerNotificationChannel(adhanId)
  const fajrChannelId =
    Platform.OS === "android" ? getPrayerChannelId(adhanId, true) : null

  const scheduled = await Notifications.getAllScheduledNotificationsAsync()
  for (const notif of scheduled) {
    if (notif.identifier.startsWith("prayer-")) {
      await Notifications.cancelScheduledNotificationAsync(notif.identifier)
    }
  }

  const prayers = [
    { name: "Fajr", time: prayerTimes.fajr, emoji: "🌅", arabic: "الفجر" },
    { name: "Dhuhr", time: prayerTimes.dhuhr, emoji: "☀️", arabic: "الظهر" },
    { name: "Asr", time: prayerTimes.asr, emoji: "🌤️", arabic: "العصر" },
    { name: "Maghrib", time: prayerTimes.maghrib, emoji: "🌇", arabic: "المغرب" },
    { name: "Isha", time: prayerTimes.isha, emoji: "🌙", arabic: "العشاء" },
  ]

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

    console.log("Scheduling notification for:", prayer.name, `${hour}:${String(minute).padStart(2, "0")}`, "sound:", sound)

    await Notifications.scheduleNotificationAsync({
      identifier: `prayer-${prayer.name.toLowerCase()}-now`,
      content: {
        title: `${prayer.emoji} ${prayer.name} — ${prayer.arabic}`,
        body: i18n.language === "ar"
          ? `حان وقت صلاة ${prayer.arabic} · الله أكبر 🕌`
          : i18n.language === "fr"
            ? `C'est l'heure de la prière ${prayer.name}. Allahou Akbar 🕌`
            : i18n.language === "tr"
              ? `${prayer.name} namazı vakti. Allahu Ekber 🕌`
              : i18n.language === "ur"
                ? `${prayer.name} کی نماز کا وقت ہوگیا۔ اللہ اکبر 🕌`
                : i18n.language === "bn"
                  ? `${prayer.name} নামাজের সময় হয়েছে। আল্লাহু আকবার 🕌`
                  : `It's time for ${prayer.name} prayer. Allahu Akbar 🕌`,
        // Background/closed: OS plays short lock clip. Foreground: handler suppresses this.
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
  }

  const after = await Notifications.getAllScheduledNotificationsAsync()
  const prayerCount = after.filter(n => n.identifier.startsWith("prayer-")).length
  console.log(`[Notifications] Scheduled ${prayerCount} prayer alerts (adhan ${adhanId})`)
}

/**
 * Fire a one-off Adhan lock-sound notification in ~60s so you can lock the phone and verify audio.
 */
export async function scheduleTestAdhanNotification(seconds = 60) {
  const granted = await requestNotificationPermission()
  if (!granted) {
    console.warn("[Notifications] Test Adhan blocked — permission not granted")
    return false
  }

  const adhanId = await getSelectedAdhanId()
  const sound = getNotificationAdhanSound(adhanId, false)
  const channelId = await setupPrayerNotificationChannel(adhanId)

  await Notifications.cancelScheduledNotificationAsync("prayer-adhan-test").catch(() => {})

  console.log("Scheduling TEST Adhan notification in", seconds, "s with sound:", sound)

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
      seconds,
      repeats: false,
      ...(Platform.OS === "android" && channelId ? { channelId } : {}),
    },
  })

  return true
}

export async function reschedulePrayerNotificationsFromCache(selectedAdhan?: string) {
  const notifEnabled = await AsyncStorage.getItem("notifications_enabled")
  if (notifEnabled === "false") return false

  const cached = await AsyncStorage.getItem("cached_prayer_times")
  if (!cached) return false

  const times = JSON.parse(cached)
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

  const slots = [
    {
      id: "dhikr-reminder-morning",
      hour: 8,
      minute: 0,
      title: "🌅 Morning Dhikr",
      body: "Start your day with SubhanAllah, Alhamdulillah, and Allahu Akbar.",
    },
    {
      id: "dhikr-reminder-evening",
      hour: 17,
      minute: 0,
      title: "🌇 Evening Dhikr",
      body: "End your afternoon with dhikr. SubhanAllah, Alhamdulillah, Allahu Akbar.",
    },
  ]

  // Cancel legacy single reminder + current slots
  await Notifications.cancelScheduledNotificationAsync("dhikr-reminder").catch(() => {})
  for (const slot of slots) {
    await Notifications.cancelScheduledNotificationAsync(slot.id).catch(() => {})
  }

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("dhikr-reminders", {
      name: "Daily Dhikr",
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
        data: { screen: "dhikr" },
        ...(Platform.OS === "android" ? { channelId: "dhikr-reminders" } : {}),
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: slot.hour,
        minute: slot.minute,
        ...(Platform.OS === "android" ? { channelId: "dhikr-reminders" } : {}),
      },
    })
  }

  return true
}

/** @deprecated Use scheduleDailyDhikrReminders — kept for compatibility */
export async function scheduleDhikrReminder(_hour?: number, _minute?: number) {
  return scheduleDailyDhikrReminders()
}

export async function scheduleJourneyReminder(phaseName: string, type: "umrah" | "hajj") {
  await Notifications.cancelScheduledNotificationAsync("journey-reminder")

  await Notifications.scheduleNotificationAsync({
    identifier: "journey-reminder",
    content: {
      title: "🕋 Continue Your Journey",
      body: `Don't forget to complete: ${phaseName}. Open UmrahConnect to continue.`,
      sound: true,
      data: { type },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: 9,
      minute: 0,
    },
  })
}

export async function scheduleIslamicDateReminders() {
  const notifEnabled = await AsyncStorage.getItem("notifications_enabled")
  if (notifEnabled === "false") return false

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
  await Notifications.cancelAllScheduledNotificationsAsync()
}

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

    // Notifications are silent; full Adhan should already be playing from the
    // background task. Opening the alert only continues / starts playback.
    setTimeout(() => {
      const alreadyPlaying = isAdhanPlaying()
      triggerPrayerAlert(prayerName, {
        playSound: true,
        continueIfPlaying: true,
        forceRestart: false,
        forceShow: true,
        seekSeconds:
          alreadyPlaying || elapsedSec <= 1.5
            ? undefined
            : Math.min(elapsedSec, 180),
      })
    }, 350)
  }

  return true
}
