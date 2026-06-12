import i18n from "@/i18n"
import * as Device from "expo-device"
import * as Notifications from "expo-notifications"

// How notifications appear when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
})

// ─── REQUEST PERMISSION ───────────────────────────────────────────────────────

export async function requestNotificationPermission(): Promise<boolean> {
  if (!Device.isDevice) {
    console.log("Notifications only work on real devices")
    return false
  }

  const permissions = await Notifications.getPermissionsAsync() as any
  
  if (permissions.canAskAgain && !permissions.granted) {
    const newPermissions = await Notifications.requestPermissionsAsync() as any
    return newPermissions.granted ?? false
  }

  return permissions.granted ?? false
}

// ─── DAILY VERSE NOTIFICATION ────────────────────────────────────────────────

export async function scheduleDailyVerseNotification() {
  await Notifications.cancelScheduledNotificationAsync("daily-verse")

  await Notifications.scheduleNotificationAsync({
    identifier: "daily-verse",
    content: {
      title: i18n.language === "ar" ? "✨ آية اليوم"
        : i18n.language === "fr" ? "✨ Verset du jour"
        : i18n.language === "tr" ? "✨ Günün Ayeti"
        : i18n.language === "ur" ? "✨ آج کی آیت"
        : "✨ Verse of the Day",
      body: i18n.language === "ar" ? "آيتك القرآنية اليومية جاهزة. افتح UmrahConnect لقراءتها."
        : i18n.language === "fr" ? "Votre verset du jour est prêt. Ouvrez UmrahConnect pour le lire."
        : i18n.language === "tr" ? "Günlük Kuran ayetiniz hazır. Okumak için UmrahConnect'i açın."
        : i18n.language === "ur" ? "آپ کی روزانہ کی قرآنی آیت تیار ہے۔ پڑھنے کے لیے UmrahConnect کھولیں۔"
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

// ─── PRAYER TIME NOTIFICATIONS ───────────────────────────────────────────────

export async function schedulePrayerNotifications(prayerTimes: {
  fajr: string
  dhuhr: string
  asr: string
  maghrib: string
  isha: string
}) {
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
    const [hourStr, minuteStr] = prayer.time.split(":")
    const hour = parseInt(hourStr)
    const minute = parseInt(minuteStr)

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
        : `It's time for ${prayer.name} prayer. Allahu Akbar 🕌`,
        sound: true,
        data: { screen: "prayer", prayerName: prayer.name },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour,
        minute,
      },
    })
  }
}

// ─── DHIKR REMINDER ──────────────────────────────────────────────────────────

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

// ─── HAJJ/UMRAH JOURNEY REMINDER ─────────────────────────────────────────────

export async function scheduleJourneyReminder(phaseName: string, type: 'umrah' | 'hajj') {
  await Notifications.cancelScheduledNotificationAsync("journey-reminder")

  await Notifications.scheduleNotificationAsync({
    identifier: "journey-reminder",
    content: {
      title: "🕋 Continue Your Journey",
      body: `Don't forget to complete: ${phaseName}. Open UmrahConnect to continue.`,
      sound: true,
      data: { type }, // 👈 this is what the tap handler reads
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: 9,
      minute: 0,
    },
  })
}

// ─── ISLAMIC DATE REMINDERS ───────────────────────────────────────────────────

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

// ─── CANCEL ALL ───────────────────────────────────────────────────────────────

export async function cancelAllNotifications() {
  await Notifications.cancelAllScheduledNotificationsAsync()
}