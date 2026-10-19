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
    // The everyday essentials: prayer, Quran, remembrance, AI.
    id: "start",
    steps: [
      { id: "prayer", icon: "time-outline", route: "/(tabs)/umrah" },
      { id: "quran", icon: "book-outline", route: "/quran" },
      { id: "listen", icon: "headset-outline", route: "/quran-listen" },
      { id: "dhikr", icon: "finger-print-outline", route: "/dhikr" },
      { id: "adhkar", icon: "sunny-outline", route: "/MorningAdhkarScreen" },
      { id: "duas", icon: "hand-left-outline", route: "/duas" },
      { id: "ai", icon: "sparkles-outline", route: "/AIGuideScreen" },
    ],
  },
  {
    // For the journey itself.
    id: "there",
    steps: [
      { id: "umrah", icon: "walk-outline", route: "/umrah-guide" },
      { id: "qibla", icon: "compass-outline", route: "/qiblah" },
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
