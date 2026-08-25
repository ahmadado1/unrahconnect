import { PRAYER_NAMES } from "@/lib/prayerConstants"
import AsyncStorage from "@react-native-async-storage/async-storage"
import * as Location from "expo-location"

export const PRAYER_TIMES_CACHE_KEY = "cached_prayer_times"
const LOCATION_TIMEOUT_MS = 8000
/** Refetch prayer times when the user moves farther than this from the cached coords. */
const LOCATION_MOVE_KM = 15

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

/** Approximate great-circle distance in km. */
export function distanceKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const toRad = (d: number) => (d * Math.PI) / 180
  const R = 6371
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(a))
}

export function isPrayerTimesCacheFresh(
  times: CachedPrayerTimes | null,
  d = new Date(),
  coords?: { lat: number; lng: number } | null
) {
  if (!times?.Fajr || !times?.Dhuhr) return false
  // Older caches omit Sunrise — refetch so Shuruq can appear in the widget.
  if (!times.Sunrise) return false
  if (!times.gregorianDate) return false
  if (times.gregorianDate !== getLocalGregorianDateKey(d)) return false

  // If we know where the user is now, stale location must invalidate the day cache.
  if (
    coords &&
    typeof times.latitude === "number" &&
    typeof times.longitude === "number"
  ) {
    if (
      distanceKm(times.latitude, times.longitude, coords.lat, coords.lng) >
      LOCATION_MOVE_KM
    ) {
      return false
    }
  }

  return true
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

export async function clearPrayerTimesCache(): Promise<void> {
  try {
    await AsyncStorage.removeItem(PRAYER_TIMES_CACHE_KEY)
  } catch {}
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

    let lastKnown: { lat: number; lng: number } | null = null
    try {
      const last = await Location.getLastKnownPositionAsync()
      if (last?.coords) {
        lastKnown = {
          lat: last.coords.latitude,
          lng: last.coords.longitude,
        }
      }
    } catch {}

    // Prefer a fresh fix so travel/city changes are not stuck on stale lastKnown.
    let current: { lat: number; lng: number } | null = null
    try {
      const location = await Promise.race([
        Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
        new Promise<null>(resolve => setTimeout(() => resolve(null), LOCATION_TIMEOUT_MS)),
      ])
      if (location?.coords) {
        current = {
          lat: location.coords.latitude,
          lng: location.coords.longitude,
        }
      }
    } catch {}

    if (current) {
      lat = current.lat
      lng = current.lng
    } else if (lastKnown) {
      lat = lastKnown.lat
      lng = lastKnown.lng
    }

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
    const { lat, lng, city } = await resolveCoordinates()
    const existing = await readCachedPrayerTimes()

    if (
      !opts?.force &&
      isPrayerTimesCacheFresh(existing, new Date(), { lat, lng })
    ) {
      // Still refresh notifications in case they were cancelled
      await syncPrayerNotifications(existing!)
      // Keep displayed city in sync if geocode improved but coords are the same
      if (existing!.city !== city && city) {
        const updated = { ...existing!, city }
        await AsyncStorage.setItem(PRAYER_TIMES_CACHE_KEY, JSON.stringify(updated))
        return updated
      }
      return existing
    }

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
