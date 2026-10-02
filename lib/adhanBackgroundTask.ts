import * as BackgroundFetch from "expo-background-fetch"
import * as TaskManager from "expo-task-manager"
import { Platform } from "react-native"

export const ADHAN_RESCHEDULE_TASK = "adhan-reschedule"

TaskManager.defineTask(ADHAN_RESCHEDULE_TASK, async () => {
  try {
    const { reschedulePrayerNotificationsFromCache } = await import("@/lib/notifications")
    const ok = await reschedulePrayerNotificationsFromCache()
    return ok === false
      ? BackgroundFetch.BackgroundFetchResult.NoData
      : BackgroundFetch.BackgroundFetchResult.NewData
  } catch (e) {
    console.log("[Adhan] background reschedule failed", e)
    return BackgroundFetch.BackgroundFetchResult.Failed
  }
})

/** Ask iOS to refresh the Adhan chain when it next wakes the app. Not guaranteed every day. */
export async function registerAdhanRescheduleTask() {
  if (Platform.OS !== "ios") return
  try {
    const status = await BackgroundFetch.getStatusAsync()
    if (
      status === BackgroundFetch.BackgroundFetchStatus.Denied ||
      status === BackgroundFetch.BackgroundFetchStatus.Restricted
    ) {
      return
    }
    const registered = await TaskManager.isTaskRegisteredAsync(ADHAN_RESCHEDULE_TASK)
    if (registered) return
    await BackgroundFetch.registerTaskAsync(ADHAN_RESCHEDULE_TASK, {
      minimumInterval: 60 * 60,
      stopOnTerminate: false,
      startOnBoot: false,
    })
  } catch (e) {
    console.log("[Adhan] background task register failed", e)
  }
}
