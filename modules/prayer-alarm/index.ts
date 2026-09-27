import { requireNativeModule } from "expo-modules-core"
import { Platform } from "react-native"

export type PrayerAlarmDraft = {
  prayerName: string
  hour: number
  minute: number
  soundName: string
  title: string
}

type PrayerAlarmNative = {
  isSupported: () => boolean
  requestAuthorization: () => Promise<string>
  scheduleAlarms: (json: string) => Promise<number>
  scheduleTest: (
    prayerName: string,
    seconds: number,
    soundName: string,
    title: string
  ) => Promise<boolean>
  cancelAll: () => void
  consumePendingPrayer: () => string | null
}

let native: PrayerAlarmNative | null | undefined

function getNative(): PrayerAlarmNative | null {
  if (Platform.OS !== "ios") return null
  if (native !== undefined) return native
  try {
    native = requireNativeModule<PrayerAlarmNative>("PrayerAlarm")
  } catch {
    // Current binary was built before this module. Prayer notifications still work.
    native = null
  }
  return native
}

/** iOS 26 AlarmKit is in the installed build. */
export function prayerAlarmsSupported(): boolean {
  try {
    return getNative()?.isSupported() === true
  } catch {
    return false
  }
}

export async function syncPrayerAlarms(alarms: PrayerAlarmDraft[]): Promise<void> {
  const module = getNative()
  if (!module || alarms.length === 0) return
  try {
    if (!module.isSupported()) return
    const auth = await module.requestAuthorization()
    if (auth !== "authorized") {
      console.log("[PrayerAlarm] authorization:", auth)
      return
    }
    const count = await module.scheduleAlarms(JSON.stringify(alarms))
    console.log("[PrayerAlarm] scheduled", count, "of", alarms.length)
  } catch (error) {
    console.log("[PrayerAlarm] schedule failed:", error)
  }
}

export async function scheduleTestPrayerAlarm(
  prayerName: string,
  seconds: number,
  soundName: string,
  title: string
): Promise<boolean> {
  const module = getNative()
  if (!module) return false
  try {
    if (!module.isSupported()) return false
    const auth = await module.requestAuthorization()
    if (auth !== "authorized") return false
    return await module.scheduleTest(prayerName, seconds, soundName, title)
  } catch (error) {
    console.log("[PrayerAlarm] test schedule failed:", error)
    return false
  }
}

export function cancelPrayerAlarms(): void {
  try {
    getNative()?.cancelAll()
  } catch (error) {
    console.log("[PrayerAlarm] cancel failed:", error)
  }
}

export function consumePendingPrayerAlarm(): string | null {
  try {
    const name = getNative()?.consumePendingPrayer()
    return name && name.length > 0 ? name : null
  } catch {
    return null
  }
}
