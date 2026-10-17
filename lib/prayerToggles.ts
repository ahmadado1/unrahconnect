// Turn the Adhan alert on/off for each prayer (e.g. keep Fajr and Maghrib, mute Dhuhr at work).
// Saved on the phone. The prayer scheduler and the "Adhan interrupts Quran" check both read it.
import AsyncStorage from "@react-native-async-storage/async-storage"

export const ALERT_PRAYERS = ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"] as const
export type AlertPrayer = (typeof ALERT_PRAYERS)[number]

const KEY = "prayer_alerts_off_v1"
/** Set by the scheduler: true when a system alarm / native player plays the Adhan (iPhone AlarmKit, Android player). */
export const SYSTEM_ADHAN_KEY = "system_adhan_active_v1"

export async function loadOffPrayers(): Promise<Set<string>> {
  try {
    const raw = await AsyncStorage.getItem(KEY)
    return new Set(raw ? (JSON.parse(raw) as string[]) : [])
  } catch {
    return new Set()
  }
}

export async function setPrayerAlertOn(prayer: AlertPrayer, on: boolean) {
  const off = await loadOffPrayers()
  if (on) off.delete(prayer)
  else off.add(prayer)
  await AsyncStorage.setItem(KEY, JSON.stringify([...off])).catch(() => {})
  return off
}

/** Are prayer alerts on at all (master switch + prayer switch)? */
export async function prayerAlertsOn() {
  const [master, prayer] = await Promise.all([
    AsyncStorage.getItem("notifications_enabled"),
    AsyncStorage.getItem("prayer_alerts_enabled"),
  ])
  return master !== "false" && prayer !== "false"
}
