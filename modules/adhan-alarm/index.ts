// iPhone full Adhan with AlarmKit (iOS 26+). Everything is a safe no-op on Android,
// older iPhones and builds without this native code.
import { requireNativeModule } from "expo-modules-core"
import { Platform } from "react-native"

type AdhanAlarmNative = {
  isAvailable: () => boolean
  requestPermission: () => Promise<boolean>
  schedule: (json: string) => Promise<number>
  cancelAll: () => Promise<boolean>
  scheduleTest?: (json: string) => Promise<boolean>
  hasSound?: (name: string) => boolean
  installSound?: (source: string, name: string) => boolean
  hasNotificationSound?: (name: string) => boolean
  removeSounds?: (prefix: string) => number
  setPrayerWidgetData?: (json: string) => boolean
}

let cached: AdhanAlarmNative | null | undefined
function native(): AdhanAlarmNative | null {
  if (cached !== undefined) return cached
  if (Platform.OS !== "ios") return (cached = null)
  try {
    cached = requireNativeModule<AdhanAlarmNative>("AdhanAlarm")
  } catch {
    cached = null
  }
  return cached
}

export type IosAdhanAlarm = {
  /** ms */
  at: number
  /** Short, shows in the alarm and Dynamic Island, e.g. "Dhuhr · Adhan" */
  title: string
  /** File in the app bundle WITH ".caf", e.g. "adhan_alafasy_alarm.caf" */
  sound: string
  /** Stop button text (translated) */
  stop?: string
}

/** iOS 26+ with this build. */
export function iosAlarmsAvailable(): boolean {
  try {
    return native()?.isAvailable() === true
  } catch {
    return false
  }
}

export async function requestIosAlarmPermission(): Promise<boolean> {
  try {
    return (await native()?.requestPermission()) === true
  } catch {
    return false
  }
}

export async function scheduleIosAdhanAlarms(alarms: IosAdhanAlarm[]): Promise<number> {
  try {
    return (await native()?.schedule(JSON.stringify(alarms))) ?? 0
  } catch {
    return 0
  }
}

export async function cancelIosAdhanAlarms() {
  try {
    await native()?.cancelAll()
  } catch {}
}

/** Test button: one full-Adhan alarm in ~60 seconds. Returns false if not possible. */
export async function testIosAdhanAlarm(alarm: IosAdhanAlarm): Promise<boolean> {
  try {
    if (!(await requestIosAlarmPermission())) return false
    return (await native()?.scheduleTest?.(JSON.stringify(alarm))) === true
  } catch {
    return false
  }
}

/** Is the Adhan sound file inside the app? */
export function iosHasSound(name: string): boolean {
  try {
    return native()?.hasSound?.(name) === true
  } catch {
    return false
  }
}

// ─── Full Adhan in 30-second parts: sounds in Library/Sounds ───

/** This build can install notification sounds (new native code). */
export function canInstallIosSounds(): boolean {
  return typeof native()?.installSound === "function"
}

/** Copy a downloaded file into Library/Sounds so notifications can play it. */
export function installIosSound(source: string, name: string): boolean {
  try {
    return native()?.installSound?.(source, name) === true
  } catch {
    return false
  }
}

/** Is this notification sound installed (Library/Sounds) or bundled? */
export function iosHasNotificationSound(name: string): boolean {
  try {
    return native()?.hasNotificationSound?.(name) === true
  } catch {
    return false
  }
}

/** Remove installed sounds starting with prefix. */
export function removeIosSounds(prefix: string): number {
  try {
    return native()?.removeSounds?.(prefix) ?? 0
  } catch {
    return 0
  }
}

/** Prayer widget data (iPhone): saved in the App Group the widget reads. */
export function setIosPrayerWidgetData(json: string): boolean {
  try {
    return native()?.setPrayerWidgetData?.(json) === true
  } catch {
    return false
  }
}
