import { requireNativeModule } from "expo-modules-core"
import { Platform } from "react-native"

type ExactAlarmNative = {
  canScheduleExactAlarms: () => boolean
  openExactAlarmSettings: () => boolean
  scheduleAdhanAlarms?: (json: string) => number
  cancelAdhanAlarms?: () => boolean
  stopAdhanPlayer?: () => boolean
  isAdhanPlaying?: () => boolean
  setPrayerWidgetData?: (json: string) => boolean
  isIgnoringBatteryOptimizations?: () => boolean
  openAppSettings?: () => boolean
}

function getNative(): ExactAlarmNative | null {
  if (Platform.OS !== "android") return null
  try {
    return requireNativeModule<ExactAlarmNative>("ExactAlarm")
  } catch {
    return null
  }
}

/** Android 12+ can turn exact alarms off. Older Android and iOS are treated as allowed. */
export function canScheduleExactAlarms(): boolean {
  if (Platform.OS !== "android") return true
  if (typeof Platform.Version === "number" && Platform.Version < 31) return true
  try {
    return getNative()?.canScheduleExactAlarms() ?? true
  } catch {
    return true
  }
}

/** Opens the system Alarms & reminders screen for this app. */
export function openExactAlarmSettings(): boolean {
  if (Platform.OS !== "android") return false
  try {
    return getNative()?.openExactAlarmSettings() === true
  } catch {
    return false
  }
}

// ─── Full Adhan player (Android) ────────────────────────────────────────────
// At prayer time a small background player plays the FULL Adhan on the alarm volume,
// even with the screen locked or another app open, with a Stop button in the notification.
// Only in builds that include this native code; older builds return false and keep the old way.

export type AdhanAlarm = {
  /** Stable id per prayer, e.g. "prayer-dhuhr-2026-10-17" */
  id: string
  /** Time in ms */
  at: number
  title: string
  body: string
  /** Raw sound name without ".mp3", e.g. "adhan_alafasy_fajr" */
  sound: string
}

/** True when this build has the native Adhan player. */
export function hasNativeAdhanPlayer(): boolean {
  if (Platform.OS !== "android") return false
  return typeof getNative()?.scheduleAdhanAlarms === "function"
}

/** Replace all Adhan alarms. Returns how many were set (0 if not available). */
export function scheduleAdhanAlarms(alarms: AdhanAlarm[]): number {
  if (!hasNativeAdhanPlayer()) return 0
  try {
    return getNative()?.scheduleAdhanAlarms?.(JSON.stringify(alarms)) ?? 0
  } catch {
    return 0
  }
}

export function cancelAdhanAlarms() {
  try {
    getNative()?.cancelAdhanAlarms?.()
  } catch {}
}

export function stopNativeAdhan() {
  try {
    getNative()?.stopAdhanPlayer?.()
  } catch {}
}

export function isNativeAdhanPlaying(): boolean {
  try {
    return getNative()?.isAdhanPlaying?.() === true
  } catch {
    return false
  }
}

/** Prayer widget data (Android home-screen widget). */
export function setAndroidPrayerWidgetData(json: string): boolean {
  try {
    return getNative()?.setPrayerWidgetData?.(json) === true
  } catch {
    return false
  }
}

/** Android: true when the app's battery setting is "Unrestricted" (Android never pauses it). */
export function isBatteryUnrestricted(): boolean {
  if (Platform.OS !== "android") return true
  try {
    const fn = getNative()?.isIgnoringBatteryOptimizations
    return typeof fn === "function" ? fn() === true : true
  } catch {
    return true
  }
}

/** Android: opens this app's settings page (Battery → Unrestricted is there). */
export function openAndroidAppSettings(): boolean {
  try {
    return getNative()?.openAppSettings?.() === true
  } catch {
    return false
  }
}
