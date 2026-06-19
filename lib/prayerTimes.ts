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
  city: string
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
      city,
    }

    await AsyncStorage.setItem(PRAYER_TIMES_CACHE_KEY, JSON.stringify(times))
    return times
  } catch {
    return readCachedPrayerTimes()
  }
}
