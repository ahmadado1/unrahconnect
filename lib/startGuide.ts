// "Getting started" guide: a simple checklist that walks a new user through the app.
// A step is ticked when the user opens it from the guide. Saved on the phone.
import AsyncStorage from "@react-native-async-storage/async-storage"

const DONE_KEY = "start_guide_done_v1"
const HIDDEN_KEY = "start_guide_home_hidden_v1"

export type GuideStep = {
  id: string
  /** Ionicons name */
  icon: string
  route: string
}

export type GuideSection = { id: "start" | "plan" | "there"; steps: GuideStep[] }

/** Order matters: this is the order a new user should try things. */
export const GUIDE_SECTIONS: GuideSection[] = [
  {
    id: "start",
    steps: [
      { id: "prayer", icon: "time-outline", route: "/(tabs)/umrah" },
      { id: "adhan", icon: "volume-high-outline", route: "/(tabs)/umrah" },
      { id: "notifications", icon: "notifications-outline", route: "/notifications" },
      { id: "quran", icon: "book-outline", route: "/quran" },
      { id: "listen", icon: "headset-outline", route: "/quran-listen" },
      { id: "adhkar", icon: "sunny-outline", route: "/MorningAdhkarScreen" },
      { id: "ai", icon: "sparkles-outline", route: "/AIGuideScreen" },
    ],
  },
  {
    id: "plan",
    steps: [
      { id: "umrah", icon: "walk-outline", route: "/umrah-guide" },
      { id: "agent", icon: "briefcase-outline", route: "/agent" },
      { id: "hotels", icon: "bed-outline", route: "/hotels" },
      { id: "flights", icon: "airplane-outline", route: "/services/flights" },
      { id: "esim", icon: "cellular-outline", route: "/services/esim" },
    ],
  },
  {
    id: "there",
    steps: [
      { id: "qibla", icon: "compass-outline", route: "/qiblah" },
      { id: "maps", icon: "map-outline", route: "/(tabs)/maps" },
      { id: "duas", icon: "hand-left-outline", route: "/duas" },
      { id: "calendar", icon: "calendar-outline", route: "/islamic-calendar" },
    ],
  },
]

export const GUIDE_STEP_COUNT = GUIDE_SECTIONS.reduce((n, s) => n + s.steps.length, 0)

export async function loadGuideDone(): Promise<Set<string>> {
  try {
    const raw = await AsyncStorage.getItem(DONE_KEY)
    return new Set(raw ? (JSON.parse(raw) as string[]) : [])
  } catch {
    return new Set()
  }
}

export async function markGuideStepDone(id: string) {
  const done = await loadGuideDone()
  if (done.has(id)) return done
  done.add(id)
  await AsyncStorage.setItem(DONE_KEY, JSON.stringify([...done])).catch(() => {})
  return done
}

export async function isGuideHiddenOnHome() {
  return (await AsyncStorage.getItem(HIDDEN_KEY)) === "true"
}

export async function setGuideHiddenOnHome(hidden: boolean) {
  await AsyncStorage.setItem(HIDDEN_KEY, hidden ? "true" : "false").catch(() => {})
}
