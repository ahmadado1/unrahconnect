import { requireNativeModule } from "expo-modules-core"
import { Platform } from "react-native"

type ExactAlarmNative = {
  canScheduleExactAlarms: () => boolean
  openExactAlarmSettings: () => boolean
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
