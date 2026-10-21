// Makkah companion (Premium): knows when you are in Makkah, Tawaf / Sa'i round counters,
// and your own duas for Tawaf, the Multazam, Arafah and Zamzam (with an Arafah reminder).
//
// Location: we use the place already saved for prayer times (no extra permission).
// Everything is saved on the phone only (duas are personal).
import AsyncStorage from "@react-native-async-storage/async-storage"
import * as Notifications from "expo-notifications"
import { Platform } from "react-native"
import i18n from "@/i18n"
import { gregorianToHijri } from "./hijriDate"
import { isPremiumNow } from "./premium"
import { readCachedPrayerTimes } from "./prayerTimes"

// ─── Where am I? ────────────────────────────────────────────────────────────
const KAABA = { lat: 21.4225, lng: 39.8262 }
/** Makkah and the area around it (Aziziyah, Mina, Arafah are inside 25 km). */
const MAKKAH_RADIUS_KM = 25
const STAY_KEY = "makkah_stay_v1"
/** The card stays this long after the last time we saw you in Makkah. */
const STAY_KEEP_MS = 36 * 60 * 60 * 1000

function distanceKm(aLat: number, aLng: number, bLat: number, bLng: number) {
  const r = 6371
  const dLat = ((bLat - aLat) * Math.PI) / 180
  const dLng = ((bLng - aLng) * Math.PI) / 180
  const x =
    Math.sin(dLat / 2) ** 2 + Math.cos((aLat * Math.PI) / 180) * Math.cos((bLat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2
  return 2 * r * Math.asin(Math.sqrt(x))
}

export type MakkahStay = { since: number; lastSeen: number }

/** Checks the saved location; returns the stay (with the day number) or null if not in Makkah. */
export async function checkMakkahStay(now = Date.now()): Promise<MakkahStay | null> {
  let stay: MakkahStay | null = null
  try {
    const raw = await AsyncStorage.getItem(STAY_KEY)
    stay = raw ? (JSON.parse(raw) as MakkahStay) : null
  } catch {}
  const times = (await readCachedPrayerTimes().catch(() => null)) as { latitude?: number; longitude?: number } | null
  const here =
    typeof times?.latitude === "number" && typeof times?.longitude === "number"
      ? distanceKm(times.latitude, times.longitude, KAABA.lat, KAABA.lng) <= MAKKAH_RADIUS_KM
      : false
  if (here) {
    // A new stay if the old one ended.
    const next = stay && now - stay.lastSeen < STAY_KEEP_MS ? { ...stay, lastSeen: now } : { since: now, lastSeen: now }
    await AsyncStorage.setItem(STAY_KEY, JSON.stringify(next)).catch(() => {})
    return next
  }
  if (stay && now - stay.lastSeen < STAY_KEEP_MS) return stay
  return null
}

export function stayDay(stay: MakkahStay, now = Date.now()) {
  const start = new Date(stay.since)
  const a = new Date(start.getFullYear(), start.getMonth(), start.getDate()).getTime()
  const b = new Date(new Date(now).getFullYear(), new Date(now).getMonth(), new Date(now).getDate()).getTime()
  return Math.round((b - a) / 86400000) + 1
}

// ─── Round counters (saved, so a closed app keeps the count) ───────────────
export type RitualKind = "tawaf" | "sai"
export type RitualState = { count: number; updatedAt: number }
const COUNTER_KEY = (k: RitualKind) => `ritual_counter_v1_${k}`

export async function loadCounter(kind: RitualKind): Promise<RitualState> {
  try {
    const raw = await AsyncStorage.getItem(COUNTER_KEY(kind))
    const s = raw ? (JSON.parse(raw) as RitualState) : null
    // An old count (more than 12 hours) starts again at 0.
    if (s && Date.now() - s.updatedAt < 12 * 60 * 60 * 1000) return s
  } catch {}
  return { count: 0, updatedAt: Date.now() }
}

export async function saveCounter(kind: RitualKind, count: number) {
  const s: RitualState = { count: Math.max(0, Math.min(7, count)), updatedAt: Date.now() }
  await AsyncStorage.setItem(COUNTER_KEY(kind), JSON.stringify(s)).catch(() => {})
  return s
}

// ─── My duas ────────────────────────────────────────────────────────────────
export type DuaPlace = "tawaf" | "multazam" | "arafah" | "zamzam" | "anytime"
export const DUA_PLACES: DuaPlace[] = ["tawaf", "multazam", "arafah", "zamzam", "anytime"]
export type MyDua = { id: string; text: string; place: DuaPlace; done?: boolean }
const DUAS_KEY = "my_duas_v1"

export async function loadMyDuas(): Promise<MyDua[]> {
  try {
    const raw = await AsyncStorage.getItem(DUAS_KEY)
    const list = raw ? (JSON.parse(raw) as MyDua[]) : []
    return Array.isArray(list) ? list : []
  } catch {
    return []
  }
}

export async function saveMyDuas(list: MyDua[]) {
  await AsyncStorage.setItem(DUAS_KEY, JSON.stringify(list)).catch(() => {})
  void scheduleArafahDuaReminder()
}

// ─── Arafah reminder: 9 Dhul-Hijjah after Dhuhr, if you have Arafah duas ────
const ARAFAH_NOTIF_ID = "my-duas-arafah"

/** Next 9 Dhul-Hijjah (Day of Arafah) within a year, at 14:00 local time. */
export function nextArafahDate(from = new Date()): Date | null {
  for (let i = 0; i < 400; i++) {
    const d = new Date(from.getFullYear(), from.getMonth(), from.getDate() + i, 14, 0, 0, 0)
    const h = gregorianToHijri(d)
    if (h.month === 12 && h.day === 9) return d.getTime() > from.getTime() ? d : null
  }
  return null
}

export async function scheduleArafahDuaReminder() {
  await Notifications.cancelScheduledNotificationAsync(ARAFAH_NOTIF_ID).catch(() => {})
  if ((await AsyncStorage.getItem("notifications_enabled")) === "false") return
  if (!(await isPremiumNow())) return
  const duas = (await loadMyDuas()).filter(d => d.place === "arafah" && !d.done)
  if (!duas.length) return
  const when = nextArafahDate()
  if (!when) return
  await Notifications.scheduleNotificationAsync({
    identifier: ARAFAH_NOTIF_ID,
    content: {
      title: i18n.t("mkArafahNotifTitle"),
      body: i18n.t("mkArafahNotifBody", { count: duas.length }),
      sound: true,
      data: { screen: "makkah-companion", tab: "duas" },
      ...(Platform.OS === "android" ? { channelId: "quran-reminders" } : {}),
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: when,
      ...(Platform.OS === "android" ? { channelId: "quran-reminders" } : {}),
    },
  })
}
