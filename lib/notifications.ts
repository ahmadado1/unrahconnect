import i18n from "@/i18n"
import { triggerPrayerAlert } from "@/lib/prayerAlert"
import { prayerNameFromNotification } from "@/lib/prayerConstants"
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
const PRAYER_CHANNEL_PREFIX = "prayer-adhan-v4"

export function getPrayerChannelId(adhanId: string, isFajr = false) {
  return isFajr
    ? `${PRAYER_CHANNEL_PREFIX}-${adhanId}-fajr`
    : `${PRAYER_CHANNEL_PREFIX}-${adhanId}`
}

/** Lock-screen / notification sounds must be ≤30s on iOS or the system plays the default chime. */
function getNotificationAdhanSound(adhanId: string, isFajr = false) {
  return isFajr ? `azan${adhanId}_fajr_lock.mp3` : `azan${adhanId}_lock.mp3`
}

async function getSelectedAdhanId() {
  return (await AsyncStorage.getItem("selected_adhan")) || "1"
}

async function ensureAndroidChannel(adhanId: string, isFajr: boolean) {
  const channelId = getPrayerChannelId(adhanId, isFajr)
  const adhanSound = getNotificationAdhanSound(adhanId, isFajr)

  await Notifications.deleteNotificationChannelAsync(channelId).catch(() => {})

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

  return channelId
}

export async function setupPrayerNotificationChannel(selectedAdhan?: string) {
  if (Platform.OS !== "android") return null

  const adhanId = selectedAdhan || (await getSelectedAdhanId())
  const channelId = await ensureAndroidChannel(adhanId, false)
  await ensureAndroidChannel(adhanId, true)

  // Remove legacy channels that may still play the default chime.
  await Notifications.deleteNotificationChannelAsync(PRAYER_CHANNEL_ID).catch(() => {})
  for (const id of ["1", "2", "3", "4", "5"]) {
    for (const prefix of ["prayer-adhan-", "prayer-adhan-v2-", "prayer-adhan-v3-"]) {
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
    const isPrayer = identifier.startsWith("prayer-")

    if (isPrayer) {
      const prayerName = prayerNameFromNotification(identifier, data)
      if (prayerName) {
        triggerPrayerAlert(prayerName, true)
      }
    }

    return {
      shouldShowAlert: true,
      // Foreground: play full adhan in-app instead of the default notification chime.
      shouldPlaySound: !isPrayer,
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

  if (permissions.status !== "granted") {
    const newPermissions = await Notifications.requestPermissionsAsync({
      ios: {
        allowAlert: true,
        allowBadge: true,
        allowSound: true,
      },
    })
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
    const { hour, minute } = parsePrayerTimeHourMinute(prayer.time)
    const isFajr = prayer.name === "Fajr"
    const sound = getNotificationAdhanSound(adhanId, isFajr)
    const channelId = isFajr ? fajrChannelId : regularChannelId

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
        sound,
        data: { screen: "prayer", prayerName: prayer.name },
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

export async function scheduleDhikrReminder(hour: number, minute: number) {
  await Notifications.cancelScheduledNotificationAsync("dhikr-reminder")

  await Notifications.scheduleNotificationAsync({
    identifier: "dhikr-reminder",
    content: {
      title: "🤲 Dhikr Reminder",
      body: "SubhanAllah, Alhamdulillah, Allahu Akbar. Take a moment to remember Allah.",
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
    },
  })
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
  const reminders = [
    { id: "ramadan", title: "🌙 Ramadan Preparation", body: "Ramadan is approaching. Start preparing your heart, fasting schedule and duas." },
    { id: "arafah", title: "🕋 Day of Arafah", body: "Tomorrow is the Day of Arafah — the best day of the year. Fast today and make abundant dua." },
    { id: "ashura", title: "📅 Day of Ashura", body: "The Day of Ashura is tomorrow. Fasting today expiates sins of the past year." },
  ]

  for (const reminder of reminders) {
    await Notifications.scheduleNotificationAsync({
      identifier: `islamic-${reminder.id}`,
      content: {
        title: reminder.title,
        body: reminder.body,
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: 8,
        minute: 0,
      },
    })
  }
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

    // Don't restart from 0 — continue from where the lock-screen clip likely left off.
    setTimeout(
      () =>
        triggerPrayerAlert(prayerName, {
          playSound: true,
          continueIfPlaying: true,
          forceRestart: false,
          forceShow: true,
          seekSeconds: elapsedSec > 1.5 ? Math.min(elapsedSec, 180) : undefined,
        }),
      350
    )
  }

  return true
}
