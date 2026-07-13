import { type PrayerName } from "@/lib/prayerConstants"
import AsyncStorage from "@react-native-async-storage/async-storage"

const PRAYER_LOG_KEY = "prayer_completion_log_v1"

export type DayPrayerStatus = "completed" | "missed" | "today" | "future"

type PrayerLog = Record<string, Partial<Record<PrayerName, boolean>>>

function dateKey(date: Date) {
  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`
}

function startOfDay(date: Date) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

/** Saturday-start week: Sat Sun Mon Tue Wed Thu Fri */
export function getWeekStartingSaturday(from = new Date()) {
  const today = startOfDay(from)
  const day = today.getDay() // 0 Sun … 6 Sat
  const daysSinceSat = (day + 1) % 7
  const saturday = new Date(today)
  saturday.setDate(today.getDate() - daysSinceSat)
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(saturday)
    d.setDate(saturday.getDate() + i)
    return d
  })
}

async function readLog(): Promise<PrayerLog> {
  try {
    const raw = await AsyncStorage.getItem(PRAYER_LOG_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === "object" ? parsed : {}
  } catch {
    return {}
  }
}

async function writeLog(log: PrayerLog) {
  await AsyncStorage.setItem(PRAYER_LOG_KEY, JSON.stringify(log))
}

export async function isPrayerMarked(prayerName: PrayerName, date = new Date()) {
  const log = await readLog()
  return !!log[dateKey(date)]?.[prayerName]
}

export async function markPrayerCompleted(prayerName: PrayerName, date = new Date()) {
  const log = await readLog()
  const key = dateKey(date)
  log[key] = { ...(log[key] ?? {}), [prayerName]: true }
  await writeLog(log)
}

export async function getWeekStatusesForPrayer(
  prayerName: PrayerName,
  from = new Date()
): Promise<{ date: Date; status: DayPrayerStatus }[]> {
  const log = await readLog()
  const today = startOfDay(from)
  const week = getWeekStartingSaturday(from)

  return week.map(date => {
    const key = dateKey(date)
    const marked = !!log[key]?.[prayerName]
    const day = startOfDay(date)

    if (day.getTime() > today.getTime()) {
      return { date, status: "future" as const }
    }
    if (day.getTime() === today.getTime()) {
      return { date, status: marked ? ("completed" as const) : ("today" as const) }
    }
    return { date, status: marked ? ("completed" as const) : ("missed" as const) }
  })
}
