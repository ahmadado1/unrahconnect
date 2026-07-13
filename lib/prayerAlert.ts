import type { PrayerName } from "./prayerConstants"

export type PrayerAlertOptions = {
  /** Start/ensure adhan audio. Default true. */
  playSound?: boolean
  /** If already playing, leave it alone unless forceRestart. Default true. */
  continueIfPlaying?: boolean
  /** Seek into the track (e.g. continue after lock-screen clip). */
  seekSeconds?: number
  /** Restart from the beginning even if already playing. */
  forceRestart?: boolean
  /** Show popup even if this prayer was already marked shown today. */
  forceShow?: boolean
}

type PrayerAlertHandler = (
  prayerName: PrayerName,
  options?: boolean | PrayerAlertOptions
) => void | Promise<void>

let handler: PrayerAlertHandler | null = null

export function registerPrayerAlertHandler(nextHandler: PrayerAlertHandler) {
  handler = nextHandler
  return () => {
    if (handler === nextHandler) handler = null
  }
}

export function normalizePrayerAlertOptions(
  options?: boolean | PrayerAlertOptions
): Required<Pick<PrayerAlertOptions, "playSound" | "continueIfPlaying" | "forceRestart" | "forceShow">> &
  Pick<PrayerAlertOptions, "seekSeconds"> {
  if (typeof options === "boolean" || options === undefined) {
    return {
      playSound: options !== false,
      continueIfPlaying: true,
      forceRestart: false,
      forceShow: false,
    }
  }
  return {
    playSound: options.playSound !== false,
    continueIfPlaying: options.continueIfPlaying !== false,
    forceRestart: options.forceRestart === true,
    forceShow: options.forceShow === true,
    seekSeconds: options.seekSeconds,
  }
}

export function triggerPrayerAlert(
  prayerName: PrayerName,
  options: boolean | PrayerAlertOptions = true
) {
  void handler?.(prayerName, options)
}
