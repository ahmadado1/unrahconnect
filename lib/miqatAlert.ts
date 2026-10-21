// Miqat alert (Premium): reminds you to be in Ihram and to make your intention at the Miqat.
//
// Why time-based (not GPS): most pilgrims cross the Miqat in a plane, where phone location is
// unreliable and a plane passes it in a few minutes. So the user enters the landing time in
// Jeddah (or the time they leave Madinah), and we remind them at the right moments.
// No location permission is needed. Airlines also announce the Miqat on board.
import AsyncStorage from "@react-native-async-storage/async-storage"
import * as Notifications from "expo-notifications"
import { Platform } from "react-native"
import i18n from "@/i18n"
import { isPremiumNow } from "./premium"

export type MiqatTrip =
  | { mode: "plane"; landingAt: number }
  | { mode: "madinah"; departAt: number }

const KEY = "miqat_trip_v1"
const IDS = ["miqat-1", "miqat-2", "miqat-3"]

export async function loadMiqatTrip(): Promise<MiqatTrip | null> {
  try {
    const raw = await AsyncStorage.getItem(KEY)
    const trip = raw ? (JSON.parse(raw) as MiqatTrip) : null
    if (!trip) return null
    const when = trip.mode === "plane" ? trip.landingAt : trip.departAt
    // Old trips (more than a day ago) are forgotten.
    return when > Date.now() - 24 * 60 * 60 * 1000 ? trip : null
  } catch {
    return null
  }
}

/** The reminders of a trip: [time, title key, body key]. */
export function miqatPlan(trip: MiqatTrip): { at: number; title: string; body: string }[] {
  const min = 60 * 1000
  if (trip.mode === "plane") {
    const L = trip.landingAt
    return [
      // Before the flight (about 4 hours before landing is usually before boarding on short trips;
      // on long flights the first one arrives on board, which is still fine).
      { at: L - 4 * 60 * min, title: "mqNotifPrepTitle", body: "mqNotifPrepPlane" },
      { at: L - 75 * min, title: "mqNotifSoonTitle", body: "mqNotifSoonPlane" },
      { at: L - 45 * min, title: "mqNotifNowTitle", body: "mqNotifNowPlane" },
    ]
  }
  const D = trip.departAt
  return [
    { at: D - 60 * min, title: "mqNotifPrepTitle", body: "mqNotifPrepMadinah" },
    { at: D, title: "mqNotifSoonTitle", body: "mqNotifSoonMadinah" },
    { at: D + 10 * min, title: "mqNotifNowTitle", body: "mqNotifNowMadinah" },
  ]
}

export async function cancelMiqatAlerts() {
  for (const id of IDS) await Notifications.cancelScheduledNotificationAsync(id).catch(() => {})
}

/** Save the trip and book its reminders (Premium). Returns how many were booked. */
export async function saveMiqatTrip(trip: MiqatTrip | null): Promise<number> {
  await cancelMiqatAlerts()
  if (!trip) {
    await AsyncStorage.removeItem(KEY).catch(() => {})
    return 0
  }
  await AsyncStorage.setItem(KEY, JSON.stringify(trip)).catch(() => {})
  if (!(await isPremiumNow())) return 0
  const perm = await Notifications.getPermissionsAsync()
  if (perm.status !== "granted") {
    const asked = await Notifications.requestPermissionsAsync()
    if (asked.status !== "granted") return 0
  }
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("miqat", {
      name: "Miqat alert",
      importance: Notifications.AndroidImportance.HIGH,
      sound: "default",
    }).catch(() => {})
  }
  let booked = 0
  const plan = miqatPlan(trip)
  for (let i = 0; i < plan.length; i++) {
    const step = plan[i]
    if (step.at <= Date.now() + 30 * 1000) continue
    await Notifications.scheduleNotificationAsync({
      identifier: IDS[i],
      content: {
        title: String(i18n.t(step.title)),
        body: String(i18n.t(step.body)),
        sound: true,
        data: { screen: "miqat" },
        ...(Platform.OS === "ios" ? { interruptionLevel: "timeSensitive" as const } : {}),
        ...(Platform.OS === "android" ? { channelId: "miqat" } : {}),
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: new Date(step.at),
        ...(Platform.OS === "android" ? { channelId: "miqat" } : {}),
      },
    })
    booked++
  }
  return booked
}
