// Phone home-screen widget (Premium): sends the next prayers to the native widget
// (iPhone: App Group + WidgetKit, Android: AppWidget). Safe no-op on builds without it.
import i18n from "@/i18n"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { endIosPrayerActivities, setIosPrayerWidgetData, startIosPrayerActivity } from "@/modules/adhan-alarm"
import { setAndroidPrayerWidgetData } from "@/modules/exact-alarm"
import { Platform } from "react-native"
import { isPremiumNow } from "./premium"
import { parsePrayerTimeHourMinute, readCachedPrayerTimes } from "./prayerTimes"

type Day = { date: Date; fajr: string; dhuhr: string; asr: string; maghrib: string; isha: string }

const NAMES = ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"] as const

/** iPhone lock-screen countdown (Live Activity): "true" = on. Off by default. */
export const LIVE_COUNTDOWN_KEY = "live_countdown_enabled"

/**
 * days: prayer times of the next days (from the prayer alerts). Without it, today's cached
 * times are used. Writes up to ~3 days so the widget keeps working if the app isn't opened.
 */
export async function updatePrayerWidget(days?: Day[]) {
  try {
    let list = days
    const cached = await readCachedPrayerTimes()
    if (!list?.length) {
      if (!cached) return
      list = [{ date: new Date(), fajr: cached.Fajr, dhuhr: cached.Dhuhr, asr: cached.Asr, maghrib: cached.Maghrib, isha: cached.Isha }]
    }
    const prayers: { n: string; at: number }[] = []
    for (const day of list.slice(0, 4)) {
      const times = [day.fajr, day.dhuhr, day.asr, day.maghrib, day.isha]
      times.forEach((time, i) => {
        const hm = parsePrayerTimeHourMinute(time)
        if (!hm) return
        const at = new Date(day.date)
        at.setHours(hm.hour, hm.minute, 0, 0)
        if (at.getTime() > Date.now() - 60 * 1000) {
          prayers.push({ n: String(i18n.t(`prayerName${NAMES[i]}`)), at: at.getTime() })
        }
      })
    }
    prayers.sort((a, b) => a.at - b.at)
    const premium = await isPremiumNow()
    // iPhone (Premium): live "Next prayer" countdown on the lock screen and Dynamic Island.
    if (Platform.OS === "ios") {
      const next = prayers.find(p => p.at > Date.now())
      // Only when switched on (Notifications settings) and only in the last hour before the prayer,
      // so it doesn't sit on the lock screen all day.
      const enabled = (await AsyncStorage.getItem(LIVE_COUNTDOWN_KEY).catch(() => null)) === "true"
      const soon = next ? next.at - Date.now() <= 60 * 60 * 1000 : false
      if (premium && enabled && next && soon) {
        void startIosPrayerActivity({
          prayer: next.n,
          at: next.at,
          city: cached?.city ?? "",
          next: String(i18n.t("nextPrayer")),
          now: String(i18n.t("laPrayerTime", { defaultValue: "Prayer time" })),
          tap: String(i18n.t("laTapAdhan", { defaultValue: "Tap to hear the full Adhan" })),
        })
      } else {
        void endIosPrayerActivities()
      }
    }
    const json = JSON.stringify({
      premium,
      city: cached?.city ?? "",
      prayers,
      labels: {
        next: String(i18n.t("nextPrayer")),
        premium: String(i18n.t("wgPremium")),
        open: String(i18n.t("wgOpen")),
      },
    })
    if (Platform.OS === "ios") setIosPrayerWidgetData(json)
    else if (Platform.OS === "android") setAndroidPrayerWidgetData(json)
  } catch {}
}
