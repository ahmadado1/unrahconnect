import AsyncStorage from "@react-native-async-storage/async-storage"

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
  emoji: string
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
  emoji: string
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
    emoji: "🌙",
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
    emoji: "🕯️",
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
    emoji: "🌟",
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
    emoji: "✨",
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
    emoji: "🌙",
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
    emoji: "⭐",
    hijriDay: 27,
    hijriMonth: 9,
    description:
      "The Night of Power — better than a thousand months. Seek it in the last 10 nights of Ramadan.",
    category: "holy",
    eveReminder: true,
  },
  {
    id: "eid-fitr",
    name: "Eid al-Fitr",
    emoji: "🎉",
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
    emoji: "🕋",
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
    emoji: "🐑",
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

export function getEventNotificationCopy(event: Pick<IslamicEvent, "baseId" | "name" | "emoji" | "description">, kind: "day" | "eve") {
  const name = event.name
  const emoji = event.emoji

  if (kind === "eve") {
    const bodies: Record<string, string> = {
      ramadan: "Ramadan begins tomorrow. Prepare your heart, intention, and fasting schedule.",
      "eid-fitr": "Eid al-Fitr is tomorrow. Prepare for prayer, charity, and celebration.",
      "eid-adha": "Eid al-Adha is tomorrow. Prepare for prayer and the remembrance of Ibrahim's sacrifice.",
      arafah: "Tomorrow is the Day of Arafah — the best day to fast and make abundant dua.",
      ashura: "Ashura is tomorrow. Fasting on this day expiates sins of the past year.",
      "laylatul-qadr": "Laylatul Qadr is tonight. Seek it with prayer, Quran, and dua — better than a thousand months.",
      isra: "Isra wal Mi'raj is tomorrow. Reflect on the Prophet's ﷺ night journey.",
      mawlid: "Mawlid an-Nabi is tomorrow. Take time to learn from the Prophet's ﷺ example.",
      "new-year": "Islamic New Year begins tomorrow. Renew your intentions for the year ahead.",
    }
    return {
      title: `${emoji} ${name} tomorrow`,
      body: bodies[event.baseId] ?? `${name} is tomorrow. Open UmrahConnect for details.`,
    }
  }

  const bodies: Record<string, string> = {
    ramadan: "Ramadan begins today. May Allah accept your fasting and dua.",
    "eid-fitr": "Eid Mubarak! Eid al-Fitr is today — celebrate with prayer, charity, and family.",
    "eid-adha": "Eid Mubarak! Eid al-Adha is today — remember Ibrahim's sacrifice.",
    arafah: "Today is the Day of Arafah. Fast and make abundant dua.",
    ashura: "Today is the Day of Ashura. Fasting today expiates sins of the past year.",
    "laylatul-qadr": "Seek Laylatul Qadr tonight — better than a thousand months.",
    isra: "Today is Isra wal Mi'raj. Reflect on the Prophet's ﷺ night journey.",
    mawlid: "Today is Mawlid an-Nabi. Learn from the life of the Prophet ﷺ.",
    "new-year": "Islamic New Year begins today. Renew your intentions.",
  }

  return {
    title: `${emoji} ${name}`,
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
    emoji: String(raw.emoji ?? def?.emoji ?? "🌙"),
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

export async function fetchAndCacheIslamicEvents(force = false): Promise<IslamicEvent[]> {
  const now = new Date()

  if (!force) {
    const cached = await readCachedIslamicEvents()
    const cachedDate = await AsyncStorage.getItem(EVENTS_CACHE_DATE_KEY)
    if (cached.length && cachedDate) {
      const lastFetch = new Date(cachedDate)
      if (
        lastFetch.getMonth() === now.getMonth() &&
        lastFetch.getFullYear() === now.getFullYear()
      ) {
        return cached
      }
    }
  }

  try {
    const todayRes = await fetch(
      `https://api.aladhan.com/v1/gToH?date=${now.getDate()}-${now.getMonth() + 1}-${now.getFullYear()}`
    )
    const todayData = await todayRes.json()
    const currentHijriYear = parseInt(todayData.data.hijri.year, 10)
    if (!Number.isFinite(currentHijriYear)) {
      return readCachedIslamicEvents()
    }

    const allEvents: IslamicEvent[] = []

    for (const hijriYear of [currentHijriYear, currentHijriYear + 1]) {
      for (const event of ISLAMIC_EVENTS_HIJRI) {
        try {
          const res = await fetch(
            `https://api.aladhan.com/v1/hToG?date=${event.hijriDay}-${event.hijriMonth}-${hijriYear}`
          )
          const data = await res.json()
          if (data.code !== 200) continue

          const g = data.data.gregorian
          const day = parseInt(g.day, 10)
          const month = parseInt(g.month.number, 10)
          const year = parseInt(g.year, 10)
          const gregorianDateStr = `${g.month.en} ${day}, ${year}`

          allEvents.push({
            id: `${event.id}-${hijriYear}`,
            baseId: event.id,
            name: event.name,
            emoji: event.emoji,
            hijriDate: `${event.hijriDay} ${HIJRI_MONTHS[event.hijriMonth - 1]} ${hijriYear} AH`,
            gregorianDate: gregorianDateStr,
            gregorianYear: year,
            gregorianMonth: month,
            gregorianDay: day,
            description: event.description,
            category: event.category,
          })
        } catch (e) {
          console.log(`Failed to fetch ${event.name}:`, e)
        }
      }
    }

    if (allEvents.length) {
      const sorted = allEvents.sort(
        (a, b) => new Date(a.gregorianDate).getTime() - new Date(b.gregorianDate).getTime()
      )
      await AsyncStorage.setItem(EVENTS_CACHE_KEY, JSON.stringify(sorted))
      await AsyncStorage.setItem(EVENTS_CACHE_DATE_KEY, now.toISOString())
      return sorted
    }
  } catch (e) {
    console.log("Islamic events fetch error:", e)
  }

  return readCachedIslamicEvents()
}
