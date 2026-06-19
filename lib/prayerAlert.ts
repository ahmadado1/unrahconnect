import type { PrayerName } from "./prayerConstants"

type PrayerAlertHandler = (prayerName: PrayerName, playSound?: boolean) => void

let handler: PrayerAlertHandler | null = null

export function registerPrayerAlertHandler(nextHandler: PrayerAlertHandler) {
  handler = nextHandler
  return () => {
    if (handler === nextHandler) handler = null
  }
}

export function triggerPrayerAlert(prayerName: PrayerName, playSound = true) {
  handler?.(prayerName, playSound)
}
