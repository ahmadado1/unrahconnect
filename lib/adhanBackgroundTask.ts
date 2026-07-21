/**
 * Background Adhan playback.
 *
 * iOS does not reliably run JS for local notifications while locked.
 * We combine:
 * 1) Silent / visual prayer notifications (no 30s lock clip)
 * 2) Notifications.registerTaskAsync — runs when the OS delivers a notif (esp. Android)
 * 3) Background fetch — opportunistic check near prayer times
 * 4) App resume check — catches cases where fetch was delayed
 *
 * Requires a native build (not Expo Go) with UIBackgroundModes: audio + fetch.
 */
import { playAdhan, isAdhanPlaying } from "@/lib/adhanAudio"
import { triggerPrayerAlert } from "@/lib/prayerAlert"
import {
  PRAYER_NAMES,
  prayerNameFromNotification,
  type PrayerName,
} from "@/lib/prayerConstants"
import { readCachedPrayerTimes, timeToMinutes } from "@/lib/prayerTimes"
import AsyncStorage from "@react-native-async-storage/async-storage"
import * as BackgroundFetch from "expo-background-fetch"
import * as Notifications from "expo-notifications"
import * as TaskManager from "expo-task-manager"
import { AppState, type AppStateStatus, Platform } from "react-native"

export const ADHAN_BACKGROUND_FETCH_TASK = "ADHAN_BACKGROUND_FETCH_TASK"
export const ADHAN_NOTIFICATION_TASK = "ADHAN_NOTIFICATION_TASK"

const SHOWN_POPUPS_KEY = "prayer_popups_shown_date"
const SHOWN_POPUPS_LIST_KEY = "prayer_popups_shown_list"

/** Minutes after prayer start where background Adhan may still start. */
const DUE_WINDOW_MINUTES = 12

function getTodayKey() {
  const now = new Date()
  return `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`
}

async function areNotificationsEnabled() {
  return (await AsyncStorage.getItem("notifications_enabled")) !== "false"
}

async function getShownPrayersToday(): Promise<Set<string>> {
  const today = getTodayKey()
  try {
    const saved = await AsyncStorage.getItem(SHOWN_POPUPS_KEY)
    if (saved !== today) {
      await AsyncStorage.setItem(SHOWN_POPUPS_KEY, today)
      await AsyncStorage.setItem(SHOWN_POPUPS_LIST_KEY, "[]")
      return new Set()
    }
    const list = await AsyncStorage.getItem(SHOWN_POPUPS_LIST_KEY)
    return new Set(list ? (JSON.parse(list) as string[]) : [])
  } catch {
    return new Set()
  }
}

async function markPrayerAlerted(prayerName: PrayerName) {
  const today = getTodayKey()
  const shown = await getShownPrayersToday()
  shown.add(prayerName)
  await AsyncStorage.setItem(SHOWN_POPUPS_KEY, today)
  await AsyncStorage.setItem(SHOWN_POPUPS_LIST_KEY, JSON.stringify([...shown]))
}

export async function findDuePrayer(
  windowMinutes = DUE_WINDOW_MINUTES
): Promise<PrayerName | null> {
  const times = await readCachedPrayerTimes()
  if (!times) return null

  const now = new Date()
  const nowMinutes = now.getHours() * 60 + now.getMinutes()

  for (const name of PRAYER_NAMES) {
    const prayerMin = timeToMinutes(times[name])
    if (prayerMin < 0) continue
    if (nowMinutes >= prayerMin && nowMinutes <= prayerMin + windowMinutes) {
      return name
    }
  }
  return null
}

/**
 * Start full Adhan via expo-av (staysActiveInBackground).
 * Used from background fetch / notification task / app resume.
 */
export async function startBackgroundAdhan(prayerName: PrayerName): Promise<boolean> {
  if (!(await areNotificationsEnabled())) return false

  if (isAdhanPlaying()) {
    triggerPrayerAlert(prayerName, {
      playSound: true,
      continueIfPlaying: true,
      forceRestart: false,
      forceShow: true,
    })
    await markPrayerAlerted(prayerName)
    return true
  }

  const shown = await getShownPrayersToday()
  if (shown.has(prayerName)) {
    return false
  }

  try {
    const ok = await playAdhan(prayerName, {
      forceRestart: false,
      continueIfPlaying: true,
      // Never fall back to the short lock clip — notification is silent by design.
      allowFallback: false,
    })

    if (ok) {
      await markPrayerAlerted(prayerName)
      triggerPrayerAlert(prayerName, {
        playSound: true,
        continueIfPlaying: true,
        forceRestart: false,
        forceShow: true,
      })
    }
    return ok
  } catch (e) {
    console.log("startBackgroundAdhan failed:", e)
    return false
  }
}

function extractPrayerFromNotificationPayload(data: unknown): PrayerName | null {
  if (!data || typeof data !== "object") return null
  const payload = data as Record<string, unknown>

  const identifier =
    (payload.notification as { request?: { identifier?: string } } | undefined)?.request
      ?.identifier ??
    (payload.request as { identifier?: string } | undefined)?.identifier ??
    (typeof payload.identifier === "string" ? payload.identifier : "")

  const contentData =
    (payload.notification as { request?: { content?: { data?: Record<string, unknown> } } } | undefined)
      ?.request?.content?.data ??
    (payload.request as { content?: { data?: Record<string, unknown> } } | undefined)?.content
      ?.data ??
    (payload.data as Record<string, unknown> | undefined) ??
    (payload.body as Record<string, unknown> | undefined)

  const fromId = prayerNameFromNotification(String(identifier || ""), contentData)
  if (fromId) return fromId

  const name = contentData?.prayerName
  if (typeof name === "string" && (PRAYER_NAMES as readonly string[]).includes(name)) {
    return name as PrayerName
  }
  return null
}

TaskManager.defineTask(ADHAN_BACKGROUND_FETCH_TASK, async () => {
  try {
    const due = await findDuePrayer()
    if (!due) {
      return BackgroundFetch.BackgroundFetchResult.NoData
    }
    const started = await startBackgroundAdhan(due)
    return started
      ? BackgroundFetch.BackgroundFetchResult.NewData
      : BackgroundFetch.BackgroundFetchResult.NoData
  } catch (e) {
    console.log("ADHAN_BACKGROUND_FETCH_TASK failed:", e)
    return BackgroundFetch.BackgroundFetchResult.Failed
  }
})

TaskManager.defineTask(ADHAN_NOTIFICATION_TASK, async ({ data, error }) => {
  if (error) {
    console.log("ADHAN_NOTIFICATION_TASK error:", error)
    return
  }

  try {
    let prayerName = extractPrayerFromNotificationPayload(data)
    if (!prayerName) {
      prayerName = await findDuePrayer()
    }
    if (prayerName) {
      await startBackgroundAdhan(prayerName)
    }
  } catch (e) {
    console.log("ADHAN_NOTIFICATION_TASK failed:", e)
  }
})

let appStateSub: { remove: () => void } | null = null
let registered = false

async function checkDueOnResume(next: AppStateStatus) {
  if (next !== "active") return
  try {
    const due = await findDuePrayer()
    if (due) await startBackgroundAdhan(due)
  } catch (e) {
    console.log("Adhan resume check failed:", e)
  }
}

/**
 * Register background fetch + notification task. Safe to call multiple times.
 * Import this module early (custom entry) so defineTask runs before wake-ups.
 */
export async function registerAdhanBackgroundTasks() {
  try {
    const status = await BackgroundFetch.getStatusAsync()
    if (
      status === BackgroundFetch.BackgroundFetchStatus.Restricted ||
      status === BackgroundFetch.BackgroundFetchStatus.Denied
    ) {
      console.log("Background fetch unavailable:", status)
    } else {
      const isRegistered = await TaskManager.isTaskRegisteredAsync(ADHAN_BACKGROUND_FETCH_TASK)
      if (!isRegistered) {
        await BackgroundFetch.registerTaskAsync(ADHAN_BACKGROUND_FETCH_TASK, {
          minimumInterval: 60,
          stopOnTerminate: false,
          startOnBoot: true,
        })
      }
      // Advisory only on iOS — OS decides actual cadence.
      await BackgroundFetch.setMinimumIntervalAsync(60).catch(() => {})
    }
  } catch (e) {
    console.log("Background fetch registration failed:", e)
  }

  try {
    await Notifications.registerTaskAsync(ADHAN_NOTIFICATION_TASK)
  } catch (e) {
    console.log("Notifications.registerTaskAsync failed:", e)
  }

  if (!appStateSub) {
    appStateSub = AppState.addEventListener("change", checkDueOnResume)
  }

  if (!registered) {
    registered = true
    if (Platform.OS === "ios") {
      console.log(
        "Adhan background: silent prayer alerts + fetch/audio modes. Full Adhan needs a native build; iOS fetch timing is opportunistic."
      )
    }
  }
}
