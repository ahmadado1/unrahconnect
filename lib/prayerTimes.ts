import { PRAYER_NAMES } from "@/lib/prayerConstants"
import AsyncStorage from "@react-native-async-storage/async-storage"
import * as Location from "expo-location"

export const PRAYER_TIMES_CACHE_KEY = "cached_prayer_times"

export type CachedPrayerTimes = {
  Fajr: string
  Dhuhr: string
  Asr: string
  Maghrib: string
  Isha: string
  date: string
  hijri: string
  hijriDay: string
  hijriMonth: string
  hijriYear: string
  city: string
}

/** Parse "05:30", "05:30:00", or "05:30 (GMT+3)" into hour/minute. */
export function parsePrayerTimeHourMinute(
  time: string
): { hour: number; minute: number } | null {
  const match = String(time ?? "").match(/(\d{1,2}):(\d{2})/)
  if (!match) return null
  const hour = parseInt(match[1], 10)
  const minute = parseInt(match[2], 10)
  if (hour > 23 || minute > 59) return null
  return { hour, minute }
}

export function timeToMinutes(time: string): number {
  const parsed = parsePrayerTimeHourMinute(time)
  if (!parsed) return -1
  return parsed.hour * 60 + parsed.minute
}

export function getNextPrayerFromTimes(
  times: Pick<CachedPrayerTimes, "Fajr" | "Dhuhr" | "Asr" | "Maghrib" | "Isha">,
  now = new Date()
) {
  const nowMinutes = now.getHours() * 60 + now.getMinutes()
  for (const name of PRAYER_NAMES) {
    const prayerMin = timeToMinutes(times[name])
    if (prayerMin > nowMinutes) {
      return { name, time: times[name] }
    }
  }
  return { name: "Fajr" as const, time: times.Fajr }
}

async function syncPrayerNotifications(times: CachedPrayerTimes) {
  const notifEnabled = await AsyncStorage.getItem("notifications_enabled")
  if (notifEnabled === "false") return

  const { schedulePrayerNotifications } = await import("@/lib/notifications")
  await schedulePrayerNotifications({
    fajr: times.Fajr,
    dhuhr: times.Dhuhr,
    asr: times.Asr,
    maghrib: times.Maghrib,
    isha: times.Isha,
  }).catch(e => console.log("Prayer notification error:", e))
}

export async function readCachedPrayerTimes(): Promise<CachedPrayerTimes | null> {
  try {
    const cached = await AsyncStorage.getItem(PRAYER_TIMES_CACHE_KEY)
    return cached ? JSON.parse(cached) : null
  } catch {
    return null
  }
}

export async function fetchAndCachePrayerTimes(): Promise<CachedPrayerTimes | null> {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync()
    let lat = 21.3891
    let lng = 39.8579
    let city = "Makkah"

    if (status === "granted") {
      const location = await Location.getCurrentPositionAsync({})
      lat = location.coords.latitude
      lng = location.coords.longitude
      const geocode = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng })
      city = geocode[0]?.city || geocode[0]?.region || "Your location"
    }

    const today = new Date()
    const inSaudiArabia = lat >= 16.0 && lat <= 32.0 && lng >= 36.0 && lng <= 56.0
    const method = inSaudiArabia ? 4 : 5

    const res = await fetch(
      `https://api.aladhan.com/v1/timings/${today.getDate()}-${today.getMonth() + 1}-${today.getFullYear()}?latitude=${lat}&longitude=${lng}&method=${method}`
    )
    const data = await res.json()

    if (data.code !== 200) return readCachedPrayerTimes()

    const timings = data.data.timings
    const hijriDate = data.data.date.hijri
    const times: CachedPrayerTimes = {
      Fajr: timings.Fajr,
      Dhuhr: timings.Dhuhr,
      Asr: timings.Asr,
      Maghrib: timings.Maghrib,
      Isha: timings.Isha,
      date: `${hijriDate.day} ${hijriDate.month.en} ${hijriDate.year} AH`,
      hijri: hijriDate.month.en,
      hijriDay: hijriDate.day,
      hijriMonth: hijriDate.month.en,
      hijriYear: hijriDate.year,
      city,
    }

    await AsyncStorage.setItem(PRAYER_TIMES_CACHE_KEY, JSON.stringify(times))
    await syncPrayerNotifications(times)
    return times
  } catch {
    return readCachedPrayerTimes()
  }
}
