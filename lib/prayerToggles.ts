// Alert mode for each prayer: full Adhan, notification only (quiet), or off.
// e.g. Adhan for Fajr and Maghrib, a quiet notification for Dhuhr at work.
// Saved on the phone. The prayer scheduler and the "Adhan interrupts Quran" check both read it.
import AsyncStorage from "@react-native-async-storage/async-storage"

export const ALERT_PRAYERS = ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"] as const
export type AlertPrayer = (typeof ALERT_PRAYERS)[number]
export type PrayerAlertMode = "adhan" | "notify" | "off"

/** Prayers switched off. Kept as the source of truth for "off" (older screens read it). */
const KEY = "prayer_alerts_off_v1"
/** Prayers set to "notification only" (no Adhan sound). */
const QUIET_KEY = "prayer_alerts_quiet_v1"
/** Set by the scheduler: true when a system alarm / native player plays the Adhan (iPhone AlarmKit, Android player). */
export const SYSTEM_ADHAN_KEY = "system_adhan_active_v1"

async function readSet(key: string): Promise<Set<string>> {
  try {
    const raw = await AsyncStorage.getItem(key)
    return new Set(raw ? (JSON.parse(raw) as string[]) : [])
  } catch {
    return new Set()
  }
}

async function writeSet(key: string, value: Set<string>) {
  await AsyncStorage.setItem(key, JSON.stringify([...value])).catch(() => {})
}

export async function loadOffPrayers(): Promise<Set<string>> {
  return readSet(KEY)
}

/** Prayers that get a quiet notification instead of the Adhan (never includes "off" prayers). */
export async function loadQuietPrayers(): Promise<Set<string>> {
  const [off, quiet] = await Promise.all([readSet(KEY), readSet(QUIET_KEY)])
  for (const p of off) quiet.delete(p)
  return quiet
}

export async function loadPrayerModes(): Promise<Record<AlertPrayer, PrayerAlertMode>> {
  const [off, quiet] = await Promise.all([readSet(KEY), readSet(QUIET_KEY)])
  const modes = {} as Record<AlertPrayer, PrayerAlertMode>
  for (const p of ALERT_PRAYERS) modes[p] = off.has(p) ? "off" : quiet.has(p) ? "notify" : "adhan"
  return modes
}

export async function setPrayerMode(prayer: AlertPrayer, mode: PrayerAlertMode) {
  const [off, quiet] = await Promise.all([readSet(KEY), readSet(QUIET_KEY)])
  if (mode === "off") off.add(prayer)
  else off.delete(prayer)
  if (mode === "notify") quiet.add(prayer)
  else quiet.delete(prayer)
  await Promise.all([writeSet(KEY, off), writeSet(QUIET_KEY, quiet)])
  return loadPrayerModes()
}

/** Notifications screen switch: on = full Adhan, off = no alert. */
export async function setPrayerAlertOn(prayer: AlertPrayer, on: boolean) {
  await setPrayerMode(prayer, on ? "adhan" : "off")
  return loadOffPrayers()
}

/** Are prayer alerts on at all (master switch + prayer switch)? */
export async function prayerAlertsOn() {
  const [master, prayer] = await Promise.all([
    AsyncStorage.getItem("notifications_enabled"),
    AsyncStorage.getItem("prayer_alerts_enabled"),
  ])
  return master !== "false" && prayer !== "false"
}
