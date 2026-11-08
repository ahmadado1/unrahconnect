// Background refresh: every few hours iPhone/Android wakes the app for a moment (when it
// decides it is a good time). We use it to book the next prayers again, so the full Adhan
// parts on iPhone keep going even if the app is not opened for a day or two.
//
// ANDROID: switched OFF. On Android the wake-up crashed the whole app
// ("Unable to start receiver expo.modules.taskManager.TaskBroadcastReceiver: NullPointerException"),
// even while the user was using it. Android prayer alerts are booked days ahead whenever the
// app is opened, so it doesn't need this. On first start, phones that already had it get it removed.
import * as BackgroundFetch from "expo-background-fetch"
import * as TaskManager from "expo-task-manager"
import { Platform } from "react-native"

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
  if (Platform.OS === "android") {
    // Remove the wake-up from phones that registered it with an older version.
    try {
      if (await TaskManager.isTaskRegisteredAsync(REBOOK_TASK)) {
        await BackgroundFetch.unregisterTaskAsync(REBOOK_TASK)
      }
      await TaskManager.unregisterAllTasksAsync().catch(() => {})
    } catch (e) {
      console.log("[BackgroundRebook] unregister:", e)
    }
    return
  }
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
