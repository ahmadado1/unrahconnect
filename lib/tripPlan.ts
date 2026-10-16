// Trip Planner (Premium): trip dates, nights in Makkah / Madinah and a checklist.
// Everything is saved on the phone.
import AsyncStorage from "@react-native-async-storage/async-storage"

const TRIP_KEY = "trip_plan_v1"

export type TripPlan = {
  /** "YYYY-MM-DD" or null when not picked yet */
  departDate: string | null
  returnDate: string | null
  makkahNights: number
  madinahNights: number
  /** Which city comes first */
  firstCity: "makkah" | "madinah"
  /** Ids of ticked checklist items */
  done: string[]
}

export const EMPTY_TRIP: TripPlan = {
  departDate: null,
  returnDate: null,
  makkahNights: 5,
  madinahNights: 4,
  firstCity: "makkah",
  done: [],
}

export type ChecklistItem = { id: string; icon: string; route?: string }
export type ChecklistGroup = { id: "docs" | "pack" | "prep"; items: ChecklistItem[] }

/** The checklist. Text comes from i18n: tp_item_<id>. route = a screen that helps with that item. */
export const TRIP_CHECKLIST: ChecklistGroup[] = [
  {
    id: "docs",
    items: [
      { id: "passport", icon: "document-text-outline" },
      { id: "visa", icon: "card-outline" },
      { id: "tickets", icon: "airplane-outline", route: "/services/flights" },
      { id: "hotel", icon: "bed-outline", route: "/hotels" },
      { id: "vaccine", icon: "medkit-outline" },
      { id: "insurance", icon: "shield-checkmark-outline" },
    ],
  },
  {
    id: "pack",
    items: [
      { id: "ihram", icon: "shirt-outline" },
      { id: "sandals", icon: "footsteps-outline" },
      { id: "unscented", icon: "water-outline" },
      { id: "bag", icon: "bag-handle-outline" },
      { id: "medicine", icon: "bandage-outline" },
      { id: "powerbank", icon: "battery-charging-outline" },
    ],
  },
  {
    id: "prep",
    items: [
      { id: "learnSteps", icon: "walk-outline", route: "/umrah-guide" },
      { id: "duas", icon: "hand-left-outline", route: "/duas" },
      { id: "esim", icon: "cellular-outline", route: "/services/esim" },
      { id: "agency", icon: "briefcase-outline", route: "/agent" },
    ],
  },
]

export const TRIP_CHECKLIST_COUNT = TRIP_CHECKLIST.reduce((n, g) => n + g.items.length, 0)

export async function loadTripPlan(): Promise<TripPlan> {
  try {
    const raw = await AsyncStorage.getItem(TRIP_KEY)
    return raw ? { ...EMPTY_TRIP, ...(JSON.parse(raw) as Partial<TripPlan>) } : EMPTY_TRIP
  } catch {
    return EMPTY_TRIP
  }
}

export async function saveTripPlan(plan: TripPlan) {
  await AsyncStorage.setItem(TRIP_KEY, JSON.stringify(plan)).catch(() => {})
}

/** "YYYY-MM-DD" → local Date at midnight */
export function parseDay(day: string) {
  const [y, m, d] = day.split("-").map(Number)
  return new Date(y, m - 1, d)
}

export function toDay(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
}

/** Where the trip is right now: before (days to go), during (day N), after, or no date. */
export function tripStatus(plan: TripPlan, now = new Date()) {
  if (!plan.departDate) return { kind: "noDate" as const }
  const today = parseDay(toDay(now)).getTime()
  const start = parseDay(plan.departDate).getTime()
  const end = plan.returnDate ? parseDay(plan.returnDate).getTime() : start
  const DAY = 24 * 60 * 60 * 1000
  if (today < start) return { kind: "before" as const, days: Math.round((start - today) / DAY) }
  if (today <= end) return { kind: "during" as const, day: Math.round((today - start) / DAY) + 1 }
  return { kind: "after" as const }
}
