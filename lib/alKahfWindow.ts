import { timeToMinutes, type CachedPrayerTimes } from "@/lib/prayerTimes"

/** Surah Al-Kahf (18) — Friday sunnah reading. */
export const AL_KAHF_SURAH_NUMBER = 18

/**
 * Islamic Friday begins at Maghrib on Thursday evening.
 * Window: Thursday Maghrib → Friday Isha (inclusive of Isha time).
 * Uses today's cached Maghrib/Isha when evaluating Thu/Fri.
 */
export function isAlKahfReminderWindow(
  times: Pick<CachedPrayerTimes, "Maghrib" | "Isha"> | null | undefined,
  now = new Date(),
): boolean {
  if (!times?.Maghrib || !times?.Isha) return false

  const day = now.getDay() // 0 Sun … 4 Thu, 5 Fri
  const nowMin = now.getHours() * 60 + now.getMinutes()
  const maghribMin = timeToMinutes(times.Maghrib)
  const ishaMin = timeToMinutes(times.Isha)
  if (maghribMin < 0 || ishaMin < 0) return false

  if (day === 4) {
    // Thursday evening after Maghrib (start of Islamic Friday)
    return nowMin >= maghribMin
  }
  if (day === 5) {
    // Gregorian Friday until Isha
    return nowMin <= ishaMin
  }
  return false
}
