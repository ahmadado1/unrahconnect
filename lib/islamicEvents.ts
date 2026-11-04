import AsyncStorage from "@react-native-async-storage/async-storage"
import type { AppIconKey } from "../components/AppIcon"

export const EVENTS_CACHE_KEY = "islamic_events_cache"
export const EVENTS_CACHE_DATE_KEY = "islamic_events_cache_date"

export const HIJRI_MONTHS = [
  "Muharram",
  "Safar",
  "Rabi al-Awwal",
  "Rabi al-Thani",
  "Jumada al-Awwal",
  "Jumada al-Thani",
  "Rajab",
  "Sha'ban",
  "Ramadan",
  "Shawwal",
  "Dhul Qi'dah",
  "Dhul Hijjah",
] as const

export type IslamicEventCategory = "pilgrimage" | "celebration" | "observance" | "holy"

export type IslamicEventDefinition = {
  id: string
  name: string
  icon: AppIconKey
  hijriDay: number
  hijriMonth: number
  description: string
  category: IslamicEventCategory
  /** Notify the evening before (8 PM) */
  eveReminder?: boolean
}

export type IslamicEvent = {
  id: string
  baseId: string
  name: string
  icon: AppIconKey
  hijriDate: string
  gregorianDate: string
  gregorianYear: number
  gregorianMonth: number
  gregorianDay: number
  description: string
  category: IslamicEventCategory
}

/** Crucial dates shown on the Islamic Calendar page */
export const ISLAMIC_EVENTS_HIJRI: IslamicEventDefinition[] = [
  {
    id: "new-year",
    name: "Islamic New Year",
    icon: "moon",
    hijriDay: 1,
    hijriMonth: 1,
    description:
      "The first day of the Islamic lunar calendar. A time for reflection and renewing intentions.",
    category: "observance",
    eveReminder: true,
  },
  {
    id: "ashura",
    name: "Day of Ashura",
    icon: "flame",
    hijriDay: 10,
    hijriMonth: 1,
    description:
      "A day of fasting commemorating the day Allah saved Musa (AS) and his people. Fasting expiates sins of the previous year.",
    category: "observance",
    eveReminder: true,
  },
  {
    id: "mawlid",
    name: "Mawlid an-Nabi",
    icon: "star",
    hijriDay: 12,
    hijriMonth: 3,
    description:
      "The birth of the Prophet Muhammad ﷺ. A time to learn about his life and follow his example.",
    category: "observance",
    eveReminder: true,
  },
  {
    id: "isra",
    name: "Isra wal Mi'raj",
    icon: "sparkles",
    hijriDay: 27,
    hijriMonth: 7,
    description:
      "The night journey of the Prophet Muhammad ﷺ from Makkah to Jerusalem and his ascension to the heavens.",
    category: "holy",
    eveReminder: true,
  },
  {
    id: "ramadan",
    name: "Ramadan Begins",
    icon: "moon",
    hijriDay: 1,
    hijriMonth: 9,
    description:
      "The blessed month of fasting, prayer, reflection and community. One of the five pillars of Islam.",
    category: "observance",
    eveReminder: true,
  },
  {
    id: "laylatul-qadr",
    name: "Laylatul Qadr",
    icon: "star",
    hijriDay: 27,
    hijriMonth: 9,
    description:
      "The Night of Power, better than a thousand months. Seek it in the last 10 nights of Ramadan.",
    category: "holy",
    eveReminder: true,
  },
  {
    id: "eid-fitr",
    name: "Eid al-Fitr",
    icon: "gift",
    hijriDay: 1,
    hijriMonth: 10,
    description:
      "The festival of breaking the fast, celebrating the end of Ramadan with prayer, charity and family.",
    category: "celebration",
    eveReminder: true,
  },
  {
    id: "arafah",
    name: "Day of Arafah",
    icon: "kaaba",
    hijriDay: 9,
    hijriMonth: 12,
    description:
      "The most important day of Hajj. Fasting expiates sins of the past and coming year for non-pilgrims.",
    category: "pilgrimage",
    eveReminder: true,
  },
  {
    id: "eid-adha",
    name: "Eid al-Adha",
    icon: "sheep",
    hijriDay: 10,
    hijriMonth: 12,
    description:
      "The festival of sacrifice, commemorating Ibrahim's willingness to sacrifice his son for Allah.",
    category: "celebration",
    eveReminder: true,
  },
]

function eventDefById(baseId: string) {
  return ISLAMIC_EVENTS_HIJRI.find(e => e.id === baseId)
}

export function getEventNotificationCopy(event: Pick<IslamicEvent, "baseId" | "name" | "description">, kind: "day" | "eve") {
  const name = event.name

  if (kind === "eve") {
    const bodies: Record<string, string> = {
      ramadan: "Ramadan begins tomorrow. Prepare your heart, intention, and fasting schedule.",
      "eid-fitr": "Eid al-Fitr is tomorrow. Prepare for prayer, charity, and celebration.",
      "eid-adha": "Eid al-Adha is tomorrow. Prepare for prayer and the remembrance of Ibrahim's sacrifice.",
      arafah: "Tomorrow is the Day of Arafah, the best day to fast and make abundant dua.",
      ashura: "Ashura is tomorrow. Fasting on this day expiates sins of the past year.",
      "laylatul-qadr": "Laylatul Qadr is tonight. Seek it with prayer, Quran, and dua, better than a thousand months.",
      isra: "Isra wal Mi'raj is tomorrow. Reflect on the Prophet's ﷺ night journey.",
      mawlid: "Mawlid an-Nabi is tomorrow. Take time to learn from the Prophet's ﷺ example.",
      "new-year": "Islamic New Year begins tomorrow. Renew your intentions for the year ahead.",
    }
    return {
      title: `${name} tomorrow`,
      body: bodies[event.baseId] ?? `${name} is tomorrow. Open UmrahConnect for details.`,
    }
  }

  const bodies: Record<string, string> = {
    ramadan: "Ramadan begins today. May Allah accept your fasting and dua.",
    "eid-fitr": "Eid Mubarak! Eid al-Fitr is today, celebrate with prayer, charity, and family.",
    "eid-adha": "Eid Mubarak! Eid al-Adha is today, remember Ibrahim's sacrifice.",
    arafah: "Today is the Day of Arafah. Fast and make abundant dua.",
    ashura: "Today is the Day of Ashura. Fasting today expiates sins of the past year.",
    "laylatul-qadr": "Seek Laylatul Qadr tonight, better than a thousand months.",
    isra: "Today is Isra wal Mi'raj. Reflect on the Prophet's ﷺ night journey.",
    mawlid: "Today is Mawlid an-Nabi. Learn from the life of the Prophet ﷺ.",
    "new-year": "Islamic New Year begins today. Renew your intentions.",
  }

  return {
    title: name,
    body: bodies[event.baseId] ?? `${name} is today. ${event.description}`,
  }
}

function normalizeCachedEvent(raw: any): IslamicEvent | null {
  if (!raw?.name || !raw?.gregorianDate) return null

  const parsed = new Date(raw.gregorianDate)
  if (Number.isNaN(parsed.getTime())) return null

  const baseId =
    typeof raw.baseId === "string"
      ? raw.baseId
      : typeof raw.id === "string"
        ? raw.id.replace(/-\d{4}$/, "")
        : ""

  const def = eventDefById(baseId)

  return {
    id: String(raw.id ?? `${baseId}-${parsed.getFullYear()}`),
    baseId: baseId || def?.id || "event",
    name: String(raw.name),
    icon: (raw.icon ?? def?.icon ?? "moon") as AppIconKey,
    hijriDate: String(raw.hijriDate ?? ""),
    gregorianDate: raw.gregorianDate,
    gregorianYear: raw.gregorianYear ?? parsed.getFullYear(),
    gregorianMonth: raw.gregorianMonth ?? parsed.getMonth() + 1,
    gregorianDay: raw.gregorianDay ?? parsed.getDate(),
    description: String(raw.description ?? def?.description ?? ""),
    category: (raw.category ?? def?.category ?? "observance") as IslamicEventCategory,
  }
}

export async function readCachedIslamicEvents(): Promise<IslamicEvent[]> {
  try {
    const raw = await AsyncStorage.getItem(EVENTS_CACHE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.map(normalizeCachedEvent).filter(Boolean) as IslamicEvent[]
  } catch {
    return []
  }
}

// ─── Dates ─────────────────────────────────────────────────────────────────
// 1) Offline, instantly: the official Saudi Umm al-Qura calendar (hijri-converter, the same
//    calendar the month grid uses).
// 2) Online, about once a week: AlAdhan with the Saudi High Judicial Council method (HJCoSA),
//    which follows the official moon-sighting announcements (e.g. the start of Ramadan / Eid).
//    Saved on the phone, so the screen never waits for the internet.
const REFRESH_MS = 7 * 24 * 60 * 60 * 1000
const MONTHS_EN = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]

function makeEvent(def: IslamicEventDefinition, hijriYear: number, year: number, month: number, day: number): IslamicEvent {
  return {
    id: `${def.id}-${hijriYear}`,
    baseId: def.id,
    name: def.name,
    icon: def.icon,
    hijriDate: `${def.hijriDay} ${HIJRI_MONTHS[def.hijriMonth - 1]} ${hijriYear} AH`,
    gregorianDate: `${MONTHS_EN[month - 1]} ${day}, ${year}`,
    gregorianYear: year,
    gregorianMonth: month,
    gregorianDay: day,
    description: def.description,
    category: def.category,
  }
}

const byDate = (a: IslamicEvent, b: IslamicEvent) =>
  new Date(a.gregorianYear, a.gregorianMonth - 1, a.gregorianDay).getTime() -
  new Date(b.gregorianYear, b.gregorianMonth - 1, b.gregorianDay).getTime()

/** This Hijri year and next, worked out on the phone (no internet). */
export function offlineIslamicEvents(now = new Date()): IslamicEvent[] {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { toGregorian, toHijri } = require("hijri-converter") as typeof import("hijri-converter")
  const currentHijriYear = toHijri(now.getFullYear(), now.getMonth() + 1, now.getDate()).hy
  const out: IslamicEvent[] = []
  for (const hijriYear of [currentHijriYear, currentHijriYear + 1]) {
    for (const def of ISLAMIC_EVENTS_HIJRI) {
      try {
        const g = toGregorian(hijriYear, def.hijriMonth, def.hijriDay)
        out.push(makeEvent(def, hijriYear, g.gy, g.gm, g.gd))
      } catch {}
    }
  }
  return out.sort(byDate)
}

/** Has the saved list still got dates ahead of us? */
function stillUseful(events: IslamicEvent[], now: Date) {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
  return events.some(e => new Date(e.gregorianYear, e.gregorianMonth - 1, e.gregorianDay).getTime() >= today)
}

/** Saved dates right away (or the offline calendar the first time). Never waits for the internet. */
export async function getIslamicEventsFast(): Promise<IslamicEvent[]> {
  const cached = await readCachedIslamicEvents()
  if (cached.length && stillUseful(cached, new Date())) return cached
  return offlineIslamicEvents()
}

/** Refresh from the internet when the saved dates are older than a week (or force). */
export async function fetchAndCacheIslamicEvents(force = false): Promise<IslamicEvent[]> {
  const now = new Date()
  const cached = await readCachedIslamicEvents()
  if (!force && cached.length && stillUseful(cached, now)) {
    const at = Date.parse((await AsyncStorage.getItem(EVENTS_CACHE_DATE_KEY)) ?? "")
    if (Number.isFinite(at) && now.getTime() - at < REFRESH_MS) return cached
  }

  try {
    const method = "HJCoSA"
    const todayRes = await fetch(
      `https://api.aladhan.com/v1/gToH/${now.getDate()}-${now.getMonth() + 1}-${now.getFullYear()}?calendarMethod=${method}`
    )
    const todayData = await todayRes.json()
    const currentHijriYear = parseInt(todayData?.data?.hijri?.year, 10)
    if (!Number.isFinite(currentHijriYear)) throw new Error("no hijri year")

    // All dates at once (was one after another: slow).
    const jobs = [currentHijriYear, currentHijriYear + 1].flatMap(hijriYear =>
      ISLAMIC_EVENTS_HIJRI.map(async def => {
        const res = await fetch(
          `https://api.aladhan.com/v1/hToG/${def.hijriDay}-${def.hijriMonth}-${hijriYear}?calendarMethod=${method}`
        )
        const data = await res.json()
        if (data?.code !== 200) return null
        const g = data.data.gregorian
        return makeEvent(def, hijriYear, parseInt(g.year, 10), parseInt(g.month.number, 10), parseInt(g.day, 10))
      })
    )
    const results = await Promise.allSettled(jobs)
    const online = results.flatMap(r => (r.status === "fulfilled" && r.value ? [r.value] : []))
    if (online.length >= ISLAMIC_EVENTS_HIJRI.length) {
      const sorted = online.sort(byDate)
      await AsyncStorage.setItem(EVENTS_CACHE_KEY, JSON.stringify(sorted))
      await AsyncStorage.setItem(EVENTS_CACHE_DATE_KEY, now.toISOString())
      return sorted
    }
  } catch (e) {
    console.log("Islamic events fetch error:", e)
  }

  // Offline or the server failed: keep the saved dates, else the offline Umm al-Qura calendar.
  if (cached.length && stillUseful(cached, now)) return cached
  const offline = offlineIslamicEvents(now)
  await AsyncStorage.setItem(EVENTS_CACHE_KEY, JSON.stringify(offline)).catch(() => {})
  return offline
}
