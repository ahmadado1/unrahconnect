// Background refresh: every few hours iPhone/Android wakes the app for a moment (when it
// decides it is a good time). We use it to book the next prayers again, so the full Adhan
// parts on iPhone keep going even if the app is not opened for a day or two.
import * as BackgroundFetch from "expo-background-fetch"
import * as TaskManager from "expo-task-manager"

export const REBOOK_TASK = "uc-rebook-prayer-alerts"

// Must be defined at the top level (runs when the app is woken in the background).
TaskManager.defineTask(REBOOK_TASK, async () => {
  try {
    const { reschedulePrayerNotificationsFromCache } = await import("@/lib/notifications")
    const ok = await reschedulePrayerNotificationsFromCache()
    return ok ? BackgroundFetch.BackgroundFetchResult.NewData : BackgroundFetch.BackgroundFetchResult.NoData
  } catch {
    return BackgroundFetch.BackgroundFetchResult.Failed
  }
})

/** Ask the system to wake the app about every 3 hours. Safe to call on every start. */
export async function registerBackgroundRebook() {
  try {
    const status = await BackgroundFetch.getStatusAsync()
    if (status !== BackgroundFetch.BackgroundFetchStatus.Available) return
    if (await TaskManager.isTaskRegisteredAsync(REBOOK_TASK)) return
    await BackgroundFetch.registerTaskAsync(REBOOK_TASK, {
      minimumInterval: 3 * 60 * 60,
      stopOnTerminate: false,
      startOnBoot: true,
    })
  } catch (e) {
    console.log("[BackgroundRebook] not available:", e)
  }
}
