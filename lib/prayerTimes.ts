import { PRAYER_NAMES } from "@/lib/prayerConstants"
import AsyncStorage from "@react-native-async-storage/async-storage"
import * as Location from "expo-location"

export const PRAYER_TIMES_CACHE_KEY = "cached_prayer_times"
const LOCATION_TIMEOUT_MS = 5000

export type CachedPrayerTimes = {
  Fajr: string
  /** Shuruq — end of Fajr window; not a prayer, shown for reference */
  Sunrise: string
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
  /** Device-local calendar day these timings were fetched for (YYYY-M-D) */
  gregorianDate?: string
  latitude?: number
  longitude?: number
}

export function getLocalGregorianDateKey(d = new Date()) {
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`
}

export function isPrayerTimesCacheFresh(times: CachedPrayerTimes | null, d = new Date()) {
  if (!times?.Fajr || !times?.Dhuhr) return false
  // Older caches omit Sunrise — refetch so Shuruq can appear in the widget.
  if (!times.Sunrise) return false
  if (!times.gregorianDate) return false
  return times.gregorianDate === getLocalGregorianDateKey(d)
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

async function resolveCoordinates(): Promise<{
  lat: number
  lng: number
  city: string
}> {
  // Defaults: Makkah (Kaaba area) if permission / GPS unavailable
  let lat = 21.4225
  let lng = 39.8262
  let city = "Makkah"

  try {
    const { status } = await Location.requestForegroundPermissionsAsync()
    if (status !== "granted") return { lat, lng, city }

    // Instant offline-friendly path
    try {
      const last = await Location.getLastKnownPositionAsync()
      if (last?.coords) {
        lat = last.coords.latitude
        lng = last.coords.longitude
      }
    } catch {}

    try {
      const location = await Promise.race([
        Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
        new Promise<null>(resolve => setTimeout(() => resolve(null), LOCATION_TIMEOUT_MS)),
      ])
      if (location?.coords) {
        lat = location.coords.latitude
        lng = location.coords.longitude
      }
    } catch {}

    try {
      const geocode = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng })
      city = geocode[0]?.city || geocode[0]?.region || city
    } catch {}
  } catch {}

  return { lat, lng, city }
}

export async function fetchAndCachePrayerTimes(
  opts?: { force?: boolean }
): Promise<CachedPrayerTimes | null> {
  try {
    if (!opts?.force) {
      const existing = await readCachedPrayerTimes()
      if (isPrayerTimesCacheFresh(existing)) {
        // Still refresh notifications in case they were cancelled
        await syncPrayerNotifications(existing!)
        return existing
      }
    }

    const { lat, lng, city } = await resolveCoordinates()

    const today = new Date()
    const inSaudiArabia = lat >= 16.0 && lat <= 32.0 && lng >= 36.0 && lng <= 56.0
    const method = inSaudiArabia ? 4 : 5
    const day = today.getDate()
    const month = today.getMonth() + 1
    const year = today.getFullYear()

    const res = await fetch(
      `https://api.aladhan.com/v1/timings/${day}-${month}-${year}?latitude=${lat}&longitude=${lng}&method=${method}`
    )
    const data = await res.json()

    if (data.code !== 200) {
      const fallback = await readCachedPrayerTimes()
      if (fallback) await syncPrayerNotifications(fallback)
      return fallback
    }

    const timings = data.data.timings
    const hijriDate = data.data.date.hijri
    const times: CachedPrayerTimes = {
      Fajr: timings.Fajr,
      Sunrise: timings.Sunrise,
      Dhuhr: timings.Dhuhr,
      Asr: timings.Asr,
      Maghrib: timings.Maghrib,
      Isha: timings.Isha,
      date: `${hijriDate.day} ${hijriDate.month.en} ${hijriDate.year} AH`,
      hijri: hijriDate.month.en,
      hijriDay: String(hijriDate.day),
      hijriMonth: hijriDate.month.en,
      hijriYear: String(hijriDate.year),
      city,
      gregorianDate: getLocalGregorianDateKey(today),
      latitude: lat,
      longitude: lng,
    }

    await AsyncStorage.setItem(PRAYER_TIMES_CACHE_KEY, JSON.stringify(times))
    await syncPrayerNotifications(times)
    return times
  } catch {
    const fallback = await readCachedPrayerTimes()
    if (fallback) await syncPrayerNotifications(fallback).catch(() => {})
    return fallback
  }
}
