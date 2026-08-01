import type { AppIconKey } from "@/components/AppIcon"
import { HOTELS } from "@/lib/hotels"
import { ISLAMIC_EVENTS_HIJRI } from "@/lib/islamicEvents"
import { MADINAH_PLACES } from "@/lib/madinahPlaces"
import { RESTAURANTS } from "@/lib/restaurants"
import { TRAVEL_AGENT_COUNTRIES } from "@/lib/travelAgents"

export type SearchCategory =
  | "Home"
  | "Maps"
  | "Services"
  | "Hotels"
  | "Restaurants"
  | "Flights"
  | "Agents"
  | "Transport"
  | "Shopping"
  | "Umrah"
  | "Hajj"
  | "Madinah"
  | "Duas"
  | "Quran"
  | "Calendar"
  | "Features"

export type SearchResult = {
  id: string
  title: string
  subtitle: string
  icon: AppIconKey
  countryCode?: string
  category: SearchCategory
  action: "navigate" | "link"
  target: string
  /** Extra terms for matching (aliases, synonyms, related content) */
  keywords: string[]
  /** Higher = shown first when scores are close (hub pages, key features) */
  boost?: number
}

type TFunc = (key: string, options?: { defaultValue?: string }) => string

function kw(...parts: (string | undefined | null)[]): string[] {
  const out: string[] = []
  for (const p of parts) {
    if (!p) continue
    const cleaned = p
      .toLowerCase()
      .replace(/[^\p{L}\p{N}\s'/+-]/gu, " ")
      .replace(/\s+/g, " ")
      .trim()
    if (cleaned) out.push(cleaned)
  }
  return out
}

function item(
  partial: Omit<SearchResult, "keywords"> & { keywords?: string[] }
): SearchResult {
  return {
    ...partial,
    keywords: partial.keywords ?? [],
  }
}

/** Popular Quran surahs for offline search (no API). */
const POPULAR_SURAHS: { n: number; name: string; aliases: string[] }[] = [
  { n: 1, name: "Al-Fatiha", aliases: ["fatiha", "opening", "الفاتحة"] },
  { n: 2, name: "Al-Baqarah", aliases: ["baqarah", "cow", "البقرة"] },
  { n: 3, name: "Ali 'Imran", aliases: ["imran", "al imran"] },
  { n: 18, name: "Al-Kahf", aliases: ["kahf", "cave", "friday", "الكهف"] },
  { n: 36, name: "Ya-Sin", aliases: ["yasin", "yaseen", "ya sin", "يس"] },
  { n: 55, name: "Ar-Rahman", aliases: ["rahman", "الرحمن"] },
  { n: 56, name: "Al-Waqi'ah", aliases: ["waqiah", "waqi'ah"] },
  { n: 67, name: "Al-Mulk", aliases: ["mulk", "sovereignty", "الملك"] },
  { n: 78, name: "An-Naba", aliases: ["naba"] },
  { n: 112, name: "Al-Ikhlas", aliases: ["ikhlas", "sincerity"] },
  { n: 113, name: "Al-Falaq", aliases: ["falaq"] },
  { n: 114, name: "An-Nas", aliases: ["nas", "mankind"] },
]

const DUA_SEARCH: {
  id: string
  title: string
  categoryLabel: string
  keywords: string[]
}[] = [
  { id: "u1", title: "Entering Ihram (Talbiyah)", categoryLabel: "Umrah duas", keywords: ["ihram", "talbiyah", "labbayk", "dua"] },
  { id: "u2", title: "Entering Masjid al-Haram", categoryLabel: "Umrah duas", keywords: ["haram", "mosque", "dua"] },
  { id: "u3", title: "First sight of the Kaaba", categoryLabel: "Umrah duas", keywords: ["kaaba", "kabah", "dua"] },
  { id: "u4", title: "During Tawaf", categoryLabel: "Umrah duas", keywords: ["tawaf", "rabbana", "dua"] },
  { id: "u5", title: "At the Black Stone", categoryLabel: "Umrah duas", keywords: ["black stone", "hajar", "dua"] },
  { id: "u6", title: "At Safa and Marwa", categoryLabel: "Umrah duas", keywords: ["safa", "marwah", "sai", "dua"] },
  { id: "u7", title: "Drinking Zamzam", categoryLabel: "Umrah duas", keywords: ["zamzam", "water", "dua"] },
  { id: "p1", title: "After prayer", categoryLabel: "Prayer duas", keywords: ["salah", "prayer", "dua"] },
  { id: "d1", title: "Morning remembrance", categoryLabel: "Daily duas", keywords: ["morning", "adhkar", "dua"] },
  { id: "d2", title: "Evening remembrance", categoryLabel: "Daily duas", keywords: ["evening", "adhkar", "dua"] },
  { id: "t1", title: "Travel dua", categoryLabel: "Travel duas", keywords: ["travel", "journey", "safar", "dua"] },
  { id: "z1", title: "Salawat on the Prophet", categoryLabel: "Zikr", keywords: ["salawat", "muhammad", "prophet", "peace", "dua", "zikr"] },
]

const MADINAH_EXTRA_KEYWORDS: Record<string, string[]> = {
  "1": ["nabawi", "prophet mosque", "masjid nabawi", "madinah", "muhammad", "prophet", "salawat"],
  "2": ["rawdah", "riyad", "jannah", "paradise", "garden", "nusuk", "prophet", "muhammad", "madinah"],
  "3": ["grave", "tomb", "prophet muhammad", "muhammad", "mohammed", "rasulullah", "pbuh", "ﷺ", "salawat", "madinah", "abu bakr", "umar"],
  "4": ["baqi", "jannat", "cemetery", "companions", "madinah"],
  "5": ["quba", "first mosque", "madinah"],
  "6": ["qiblatayn", "two qiblas", "jerusalem", "madinah"],
  "7": ["uhud", "hamza", "battle", "martyrs", "madinah"],
  "8": ["seven mosques", "trench", "khandaq", "madinah"],
  "9": ["museum", "dar al madinah", "hejaz", "railway", "madinah"],
}

/**
 * Full-app searchable catalog: home features, services, guides, places, hotels, etc.
 */
export function buildSearchIndex(t: TFunc): SearchResult[] {
  const items: SearchResult[] = []

  // ── Home / core features (everything accessible from home) ───────────────
  items.push(
    item({
      id: "home",
      title: t("home", { defaultValue: "Home" }),
      subtitle: "Prayer times, journey cards, and shortcuts",
      icon: "moon",
      category: "Home",
      action: "navigate",
      target: "/(tabs)",
      keywords: kw("home", "main", "dashboard", "prayer times", "salah", "fajr", "dhuhr", "asr", "maghrib", "isha"),
      boost: 8,
    }),
    item({
      id: "prayer",
      title: t("prayerTimes", { defaultValue: "Prayer Times" }),
      subtitle: "Daily salah schedule on the home screen",
      icon: "mosque",
      category: "Home",
      action: "navigate",
      target: "/(tabs)",
      keywords: kw("prayer", "salah", "salat", "namaz", "adhan", "athan", "fajr", "dhuhr", "asr", "maghrib", "isha"),
      boost: 10,
    }),
    item({
      id: "qibla",
      title: t("qiblaDirection", { defaultValue: "Qibla Direction" }),
      subtitle: "Compass toward the Kaaba — works offline",
      icon: "compass",
      category: "Features",
      action: "navigate",
      target: "/qiblah",
      keywords: kw("qibla", "qiblah", "direction", "kaaba", "compass", "قبلة"),
      boost: 12,
    }),
    item({
      id: "ai-guide",
      title: "AI Guide",
      subtitle: "Ask about Umrah, Hajj, maps, and the app",
      icon: "sparkles",
      category: "Features",
      action: "navigate",
      target: "/AIGuideScreen",
      keywords: kw("ai", "assistant", "chat", "ask", "help", "guide", "claude"),
      boost: 10,
    }),
    item({
      id: "duas-hub",
      title: t("duas", { defaultValue: "Duas" }),
      subtitle: "Umrah, prayer, travel duas and tasbih counter",
      icon: "prayer",
      category: "Duas",
      action: "navigate",
      target: "/duas",
      keywords: kw("dua", "duas", "supplication", "tasbih", "dhikr", "zikr", "beads", "counter"),
      boost: 10,
    }),
    item({
      id: "morning-adhkar",
      title: t("morningAdhkarTitle", { defaultValue: "Morning Adhkar" }),
      subtitle: t("morningAdhkarSub", { defaultValue: "Start your day with remembrance" }),
      icon: "sunny",
      category: "Features",
      action: "navigate",
      target: "/MorningAdhkarScreen",
      keywords: kw("morning", "adhkar", "azkar", "dhikr", "remembrance", "fajr"),
      boost: 9,
    }),
    item({
      id: "evening-adhkar",
      title: t("eveningAdhkarTitle", { defaultValue: "Evening Adhkar" }),
      subtitle: t("eveningAdhkarSub", { defaultValue: "End your day with remembrance" }),
      icon: "moon",
      category: "Features",
      action: "navigate",
      target: "/EveningAdhkarScreen",
      keywords: kw("evening", "adhkar", "azkar", "dhikr", "remembrance", "maghrib"),
      boost: 9,
    }),
    item({
      id: "calendar",
      title: t("islamicCalendarTitle", { defaultValue: "Islamic Calendar" }),
      subtitle: "Ramadan, Eid, Arafah, and key dates",
      icon: "calendar",
      category: "Calendar",
      action: "navigate",
      target: "/islamic-calendar",
      keywords: kw("calendar", "hijri", "ramadan", "eid", "mawlid", "ashura"),
      boost: 7,
    }),
    item({
      id: "notifications",
      title: t("notifications", { defaultValue: "Notifications" }),
      subtitle: t("notificationsManage", { defaultValue: "Adhan, adhkar, and daily alerts" }),
      icon: "time",
      category: "Features",
      action: "navigate",
      target: "/notifications",
      keywords: kw(
        "notifications",
        "adhan",
        "adhkar",
        "dhikr",
        "reminders",
        "prayer alerts",
        "daily verse"
      ),
      boost: 6,
    }),
    item({
      id: "settings",
      title: t("settings", { defaultValue: "Settings" }),
      subtitle: t("preferences", { defaultValue: "Language, theme, notifications" }),
      icon: "settings",
      category: "Features",
      action: "navigate",
      target: "/settings",
      keywords: kw("settings", "preferences", "language", "dark mode", "notifications"),
      boost: 4,
    }),
    item({
      id: "profile",
      title: t("profile", { defaultValue: "Profile" }),
      subtitle: "Account and personal info",
      icon: "person",
      category: "Features",
      action: "navigate",
      target: "/profile",
      keywords: kw("profile", "account", "user"),
      boost: 3,
    }),
    item({
      id: "favorites",
      title: t("favorites", { defaultValue: "Favorites" }),
      subtitle: "Saved hotels and restaurants",
      icon: "heart",
      category: "Services",
      action: "navigate",
      target: "/favorites",
      keywords: kw("favorites", "saved", "wishlist"),
      boost: 5,
    }),
    item({
      id: "services-hub",
      title: t("services", { defaultValue: "Services" }),
      subtitle: "Hotels, food, agents, transport, shopping",
      icon: "bag",
      category: "Services",
      action: "navigate",
      target: "/(tabs)/services",
      keywords: kw("services", "hub", "bookings", "utility"),
      boost: 11,
    }),
    item({
      id: "maps-hub",
      title: t("maps", { defaultValue: "Maps" }),
      subtitle: "Haram, Nabawi, Mina, Arafah, Zamzam, hospitals",
      icon: "map",
      category: "Maps",
      action: "navigate",
      target: "/(tabs)/maps",
      keywords: kw("maps", "locations", "sites", "places"),
      boost: 11,
    }),
    item({
      id: "guide-hub",
      title: t("guide", { defaultValue: "Guide" }),
      subtitle: "Umrah, Hajj, Qibla, Duas, Calendar",
      icon: "book",
      category: "Features",
      action: "navigate",
      target: "/(tabs)/umrah",
      keywords: kw("guide", "rituals", "journey"),
      boost: 8,
    })
  )

  // ── Services ─────────────────────────────────────────────────────────────
  items.push(
    item({
      id: "hotels",
      title: t("hotels", { defaultValue: "Hotels" }),
      subtitle: t("hotelsSub", { defaultValue: "Stay near Haram and Nabawi" }),
      icon: "bed",
      category: "Services",
      action: "navigate",
      target: "/hotels",
      keywords: kw(
        "hotel",
        "hotels",
        "accommodation",
        "stay",
        "lodging",
        "room",
        "booking",
        "near haram",
        "near nabawi",
        "sleep"
      ),
      boost: 14,
    }),
    item({
      id: "restaurants",
      title: t("restaurants", { defaultValue: "Restaurants" }),
      subtitle: t("restaurantsSub", { defaultValue: "Halal food near the holy sites" }),
      icon: "restaurant",
      category: "Services",
      action: "navigate",
      target: "/restaurants",
      keywords: kw("restaurant", "restaurants", "food", "eat", "halal", "dining", "cafe", "grill"),
      boost: 12,
    }),
    item({
      id: "agents",
      title: t("findAgent", { defaultValue: "Find an Agent" }),
      subtitle: t("findAgentSub", { defaultValue: "Trusted Umrah & Hajj travel agents" }),
      icon: "handshake",
      category: "Services",
      action: "navigate",
      target: "/travel-agents",
      keywords: kw("agent", "agents", "travel agent", "package", "tour", "agency"),
      boost: 12,
    }),
    item({
      id: "hospitals",
      title: t("hospitals", { defaultValue: "Hospitals" }),
      subtitle: t("hospitalsSub", { defaultValue: "Emergency care in Makkah & Madinah" }),
      icon: "hospital",
      category: "Services",
      action: "navigate",
      target: "/maps/hospital-makkah",
      keywords: kw("hospital", "hospitals", "medical", "emergency", "clinic", "doctor", "ambulance"),
      boost: 12,
    })
  )

  // ── Maps ─────────────────────────────────────────────────────────────────
  const mapSites: {
    id: string
    title: string
    subtitle: string
    icon: AppIconKey
    target: string
    keywords: string[]
    boost?: number
  }[] = [
    {
      id: "haram",
      title: "Masjid Al-Haram",
      subtitle: "Holy Mosque · Makkah",
      icon: "kaaba",
      target: "/maps/haram",
      keywords: ["haram", "kaaba", "kabah", "makkah", "mecca", "masjid", "tawaf", "black stone"],
      boost: 10,
    },
    {
      id: "nabawi",
      title: "Masjid Nabawi",
      subtitle: "Prophet's Mosque · Madinah",
      icon: "mosque",
      target: "/maps/nabawi",
      keywords: [
        "nabawi",
        "madinah",
        "medina",
        "prophet",
        "muhammad",
        "mohammed",
        "rasulullah",
        "rawdah",
        "riyad",
      ],
      boost: 12,
    },
    {
      id: "mina",
      title: "Mina",
      subtitle: "Hajj site · tents & Jamarat",
      icon: "camp",
      target: "/maps/mina",
      keywords: ["mina", "hajj", "jamarat", "tents", "stoning"],
    },
    {
      id: "arafah",
      title: "Mount Arafah",
      subtitle: "Hajj site · Day of Arafah",
      icon: "mountain",
      target: "/maps/arafah",
      keywords: ["arafah", "arafat", "hajj", "wuquf"],
    },
    {
      id: "zamzam",
      title: "Zamzam Well",
      subtitle: "Holy water · Makkah",
      icon: "water",
      target: "/maps/zamzam",
      keywords: ["zamzam", "water", "well", "drink"],
      boost: 9,
    },
    {
      id: "safa",
      title: "Safa & Marwah",
      subtitle: "Sa'i location · Makkah",
      icon: "walk",
      target: "/maps/safa",
      keywords: ["safa", "marwah", "marwa", "sai", "sa'i", "saee"],
    },
    {
      id: "lost",
      title: "Lost & Found",
      subtitle: "Pilgrim support centers",
      icon: "search",
      target: "/maps/lost-found",
      keywords: ["lost", "found", "missing", "civil defense"],
    },
  ]

  for (const s of mapSites) {
    items.push(
      item({
        id: s.id,
        title: s.title,
        subtitle: s.subtitle,
        icon: s.icon,
        category: "Maps",
        action: "navigate",
        target: s.target,
        keywords: kw(...s.keywords),
        boost: s.boost,
      })
    )
  }

  // Hospitals (detail list lives on hospital map page)
  const hospitals = [
    { id: "h-abdulaziz", title: "King Abdulaziz Hospital", city: "Makkah" },
    { id: "h-noor", title: "Al-Noor Specialist Hospital", city: "Makkah" },
    { id: "h-faisal", title: "King Faisal Hospital", city: "Makkah" },
    { id: "h-fahd", title: "King Fahd Hospital", city: "Madinah" },
  ]
  for (const h of hospitals) {
    items.push(
      item({
        id: h.id,
        title: h.title,
        subtitle: `${h.city} · Hospital`,
        icon: "medkit",
        category: "Services",
        action: "navigate",
        target: "/maps/hospital-makkah",
        keywords: kw(h.title, h.city, "hospital", "emergency", "medical"),
        boost: 6,
      })
    )
  }

  // ── Transport / flights / shopping ───────────────────────────────────────
  items.push(
    item({
      id: "saudia",
      title: "Saudia Airlines",
      subtitle: "Official Saudi carrier — Jeddah & Madinah",
      icon: "airplane",
      category: "Flights",
      action: "navigate",
      target: "/flight-detail/saudia",
      keywords: kw("saudia", "flight", "flights", "airline", "plane", "jeddah", "airport"),
      boost: 8,
    }),
    item({
      id: "kayak",
      title: "Kayak",
      subtitle: "Compare flight sites",
      icon: "airplane",
      category: "Flights",
      action: "navigate",
      target: "/flight-detail/kayak",
      keywords: kw("kayak", "flight", "flights", "compare"),
    }),
    item({
      id: "skyscanner",
      title: "Skyscanner",
      subtitle: "Find flight deals worldwide",
      icon: "airplane",
      category: "Flights",
      action: "navigate",
      target: "/flight-detail/skyscanner",
      keywords: kw("skyscanner", "flight", "flights", "deals"),
    }),
    item({
      id: "haramain-makkah",
      title: t("makkahStation", { defaultValue: "Haramain · Makkah Station" }),
      subtitle: t("makkahStationAddress", { defaultValue: "High-speed train to Madinah" }),
      icon: "train",
      category: "Transport",
      action: "navigate",
      target: "/haramain/makkah",
      keywords: kw("haramain", "train", "railway", "makkah station", "high speed"),
      boost: 8,
    }),
    item({
      id: "haramain-madinah",
      title: t("madinahStation", { defaultValue: "Haramain · Madinah Station" }),
      subtitle: t("madinahStationAddress", { defaultValue: "High-speed train to Makkah" }),
      icon: "train",
      category: "Transport",
      action: "navigate",
      target: "/haramain/madinah",
      keywords: kw("haramain", "train", "railway", "madinah station"),
      boost: 8,
    }),
    item({
      id: "saptco",
      title: t("saptcoBuses", { defaultValue: "SAPTCO Buses" }),
      subtitle: t("saptcoSub", { defaultValue: "Intercity buses" }),
      icon: "bus",
      category: "Transport",
      action: "link",
      target: "https://www.saptco.com.sa",
      keywords: kw("saptco", "bus", "buses", "transport"),
    }),
    item({
      id: "uber",
      title: t("uber", { defaultValue: "Uber" }),
      subtitle: t("uberSub", { defaultValue: "Ride to the Haram" }),
      icon: "car",
      category: "Transport",
      action: "link",
      target: "https://www.uber.com",
      keywords: kw("uber", "taxi", "ride", "car", "careem"),
    }),
    item({
      id: "abraj",
      title: t("abrajMall", { defaultValue: "Abraj Al Bait Mall" }),
      subtitle: t("abrajSub", { defaultValue: "Shopping next to the Haram" }),
      icon: "bag",
      category: "Shopping",
      action: "link",
      target: "https://maps.google.com/?q=Abraj+Al+Bait+Mall+Makkah",
      keywords: kw("abraj", "mall", "shopping", "clock tower"),
    }),
    item({
      id: "souq",
      title: t("souqZal", { defaultValue: "Souq Al Zal" }),
      subtitle: t("souqZalSub", { defaultValue: "Traditional market · Makkah" }),
      icon: "storefront",
      category: "Shopping",
      action: "link",
      target: "https://maps.google.com/?q=Souq+Al+Zal+Makkah",
      keywords: kw("souq", "zal", "market", "shopping", "bazaar"),
    }),
    item({
      id: "madinah-mall",
      title: t("madinahMall", { defaultValue: "Madinah Mall" }),
      subtitle: t("madinahMallSub", { defaultValue: "Shopping in Madinah" }),
      icon: "storefront",
      category: "Shopping",
      action: "link",
      target: "https://maps.google.com/?q=Madinah+Mall+Saudi+Arabia",
      keywords: kw("madinah mall", "shopping", "mall"),
    }),
    item({
      id: "ansar",
      title: t("ansarMall", { defaultValue: "Ansar Mall" }),
      subtitle: t("ansarMallSub", { defaultValue: "Shopping in Madinah" }),
      icon: "cart",
      category: "Shopping",
      action: "link",
      target: "https://maps.google.com/?q=Ansar+Mall+Madinah",
      keywords: kw("ansar", "mall", "shopping"),
    })
  )

  // ── Umrah & Hajj guides ──────────────────────────────────────────────────
  items.push(
    item({
      id: "umrah-guide",
      title: t("umrahGuide", { defaultValue: "Umrah Guide" }),
      subtitle: "Full step-by-step Umrah checklist",
      icon: "kaaba",
      category: "Umrah",
      action: "navigate",
      target: "/umrah-guide",
      keywords: kw("umrah", "omrah", "checklist", "rituals", "pilgrimage"),
      boost: 13,
    }),
    item({
      id: "hajj-guide",
      title: t("hajj", { defaultValue: "Hajj Guide" }),
      subtitle: "Complete Hajj day-by-day rituals",
      icon: "crescent",
      category: "Hajj",
      action: "navigate",
      target: "/hajj",
      keywords: kw("hajj", "hadj", "pilgrimage", "arafah", "mina"),
      boost: 12,
    })
  )

  const umrahPhases: { id: string; titleKey: string; subKey: string; keywords: string[]; boost?: number }[] = [
    {
      id: "1",
      titleKey: "phase_umrah_1_title",
      subKey: "phase_umrah_1_sub",
      keywords: [
        "madinah visit",
        "madinah",
        "medina",
        "ziyarat",
        "prophet",
        "muhammad",
        "mohammed",
        "nabawi",
        "rawdah",
        "grave",
        "salawat",
      ],
      boost: 14,
    },
    {
      id: "2",
      titleKey: "phase_umrah_2_title",
      subKey: "phase_umrah_2_sub",
      keywords: ["ihram", "miqat", "niyyah", "talbiyah", "ghusl"],
      boost: 10,
    },
    {
      id: "3",
      titleKey: "phase_umrah_3_title",
      subKey: "phase_umrah_3_sub",
      keywords: ["makkah", "mecca", "haram", "arrive", "kaaba"],
    },
    {
      id: "4",
      titleKey: "phase_umrah_4_title",
      subKey: "phase_umrah_4_sub",
      keywords: ["tawaf", "circumambulation", "kaaba", "black stone", "rounds"],
      boost: 11,
    },
    {
      id: "5",
      titleKey: "phase_umrah_5_title",
      subKey: "phase_umrah_5_sub",
      keywords: ["sai", "sa'i", "saee", "safa", "marwah", "marwa"],
      boost: 10,
    },
    {
      id: "6",
      titleKey: "phase_umrah_6_title",
      subKey: "phase_umrah_6_sub",
      keywords: ["halq", "taqsir", "shave", "haircut", "trim"],
    },
    {
      id: "7",
      titleKey: "phase_umrah_7_title",
      subKey: "phase_umrah_7_sub",
      keywords: ["complete", "finished", "done", "mabrook"],
    },
  ]

  for (const p of umrahPhases) {
    const title = t(p.titleKey, { defaultValue: p.titleKey })
    const subtitle = t(p.subKey, { defaultValue: "" })
    items.push(
      item({
        id: `umrah-${p.id}`,
        title,
        subtitle: `Umrah · ${subtitle}`,
        icon: p.id === "1" ? "mosque" : "kaaba",
        category: "Umrah",
        action: "navigate",
        target: `/umrah/${p.id}`,
        keywords: kw(title, subtitle, "umrah", ...p.keywords),
        boost: p.boost,
      })
    )
  }

  const hajjPhases: { id: string; titleKey: string; subKey: string; keywords: string[] }[] = [
    { id: "1", titleKey: "phase_hajj_1_title", subKey: "phase_hajj_1_sub", keywords: ["ihram", "preparation", "hajj"] },
    { id: "2", titleKey: "phase_hajj_2_title", subKey: "phase_hajj_2_sub", keywords: ["makkah", "tawaf qudum", "hajj"] },
    { id: "3", titleKey: "phase_hajj_3_title", subKey: "phase_hajj_3_sub", keywords: ["mina", "tarwiyah", "hajj"] },
    { id: "4", titleKey: "phase_hajj_4_title", subKey: "phase_hajj_4_sub", keywords: ["arafah", "arafat", "wuquf", "hajj"] },
    { id: "5", titleKey: "phase_hajj_5_title", subKey: "phase_hajj_5_sub", keywords: ["muzdalifah", "pebbles", "hajj"] },
    { id: "6", titleKey: "phase_hajj_6_title", subKey: "phase_hajj_6_sub", keywords: ["jamarat", "stoning", "eid", "sacrifice", "hajj"] },
    { id: "7", titleKey: "phase_hajj_7_title", subKey: "phase_hajj_7_sub", keywords: ["tashreeq", "mina", "hajj"] },
    { id: "8", titleKey: "phase_hajj_8_title", subKey: "phase_hajj_8_sub", keywords: ["wadaa", "farewell", "tawaf", "hajj"] },
    { id: "9", titleKey: "phase_hajj_9_title", subKey: "phase_hajj_9_sub", keywords: ["complete", "hajji", "hajj"] },
  ]

  for (const p of hajjPhases) {
    const title = t(p.titleKey, { defaultValue: p.titleKey })
    const subtitle = t(p.subKey, { defaultValue: "" })
    items.push(
      item({
        id: `hajj-${p.id}`,
        title,
        subtitle: `Hajj · ${subtitle}`,
        icon: "crescent",
        category: "Hajj",
        action: "navigate",
        target: `/hajj/${p.id}`,
        keywords: kw(title, subtitle, "hajj", ...p.keywords),
        boost: 7,
      })
    )
  }

  // ── Madinah places (Prophet Muhammad ziyarat content) ────────────────────
  for (const place of MADINAH_PLACES) {
    const title = t(place.titleKey, { defaultValue: place.titleKey })
    const desc = t(place.descriptionKey, { defaultValue: "" })
    const extra = MADINAH_EXTRA_KEYWORDS[place.number] ?? ["madinah"]
    items.push(
      item({
        id: `madinah-${place.number}`,
        title,
        subtitle: "Madinah Visit · Ziyarat places",
        icon: place.number === "3" || place.number === "1" ? "mosque" : "map",
        category: "Madinah",
        action: "navigate",
        target: "/umrah/1",
        keywords: kw(title, desc.slice(0, 120), "madinah", "ziyarat", "visit", ...extra),
        boost: place.crucial ? 13 : 8,
      })
    )
  }

  // Also surface Nabawi map when searching prophet/muhammad
  items.push(
    item({
      id: "madinah-visit-hub",
      title: t("phase_umrah_1_title", { defaultValue: "Madinah Visit" }),
      subtitle: "Prophet's Mosque, Rawdah, grave, Quba, Uhud",
      icon: "mosque",
      category: "Madinah",
      action: "navigate",
      target: "/umrah/1",
      keywords: kw(
        "muhammad",
        "mohammed",
        "mohammad",
        "prophet",
        "rasul",
        "rasulullah",
        "pbuh",
        "salawat",
        "ziyarat",
        "madinah visit",
        "nabi"
      ),
      boost: 16,
    })
  )

  // ── Duas ─────────────────────────────────────────────────────────────────
  for (const d of DUA_SEARCH) {
    items.push(
      item({
        id: `dua-${d.id}`,
        title: d.title,
        subtitle: d.categoryLabel,
        icon: "prayer",
        category: "Duas",
        action: "navigate",
        target: "/duas",
        keywords: kw(d.title, ...d.keywords),
        boost: 5,
      })
    )
  }

  // ── Quran ────────────────────────────────────────────────────────────────
  items.push(
    item({
      id: "quran",
      title: t("quran", { defaultValue: "Quran" }),
      subtitle: "Read 114 surahs with translation",
      icon: "book",
      category: "Quran",
      action: "navigate",
      target: "/quran",
      keywords: kw("quran", "quraan", "koran", "surah", "ayah", "recite", "read"),
      boost: 12,
    })
  )
  for (const s of POPULAR_SURAHS) {
    items.push(
      item({
        id: `surah-${s.n}`,
        title: s.name,
        subtitle: `Surah ${s.n}`,
        icon: "book",
        category: "Quran",
        action: "navigate",
        target: `/quran/${s.n}`,
        keywords: kw(s.name, `surah ${s.n}`, ...s.aliases),
        boost: 6,
      })
    )
  }

  // ── Islamic calendar events ──────────────────────────────────────────────
  for (const ev of ISLAMIC_EVENTS_HIJRI) {
    items.push(
      item({
        id: `event-${ev.id}`,
        title: ev.name,
        subtitle: ev.description.slice(0, 90),
        icon: ev.icon,
        category: "Calendar",
        action: "navigate",
        target: "/islamic-calendar",
        keywords: kw(ev.name, ev.description.slice(0, 100), ev.category, "hijri", "calendar"),
        boost: 5,
      })
    )
  }

  // ── Travel agents ────────────────────────────────────────────────────────
  for (const c of TRAVEL_AGENT_COUNTRIES) {
    items.push(
      item({
        id: `agent-country-${c.id}`,
        title: `Travel Agents · ${c.name}`,
        subtitle: c.comingSoon ? "Coming soon" : "Trusted Umrah & Hajj agents",
        icon: "flag",
        countryCode: c.id === "nigeria" ? "NG" : c.id === "egypt" ? "EG" : c.id.slice(0, 2).toUpperCase(),
        category: "Agents",
        action: "navigate",
        target: `/travel-agents/${c.id}`,
        keywords: kw(c.name, "travel agent", "agents", "umrah package", c.id),
        boost: c.comingSoon ? 2 : 9,
      })
    )
  }

  // Individual agents are loaded from Supabase on the country screen (cached).

  // ── Hotels & restaurants ─────────────────────────────────────────────────
  for (const hotel of HOTELS) {
    items.push(
      item({
        id: `hotel-${hotel.id}`,
        title: hotel.name,
        subtitle: `${hotel.city} · ${hotel.distanceLabel}`,
        icon: "bed",
        category: "Hotels",
        action: "navigate",
        target: `/hotel-detail/${hotel.id}`,
        keywords: kw(
          hotel.name,
          hotel.city,
          hotel.distanceLabel,
          hotel.description?.slice(0, 80),
          "hotel",
          "hotels",
          "stay",
          "accommodation",
          ...hotel.amenities.slice(0, 6)
        ),
        boost: 4,
      })
    )
  }

  for (const restaurant of RESTAURANTS) {
    items.push(
      item({
        id: `restaurant-${restaurant.id}`,
        title: restaurant.name,
        subtitle: `${restaurant.city} · ${restaurant.cuisine} · ${restaurant.distance}`,
        icon: "restaurant",
        category: "Restaurants",
        action: "navigate",
        target: `/restaurant-detail/${restaurant.id}`,
        keywords: kw(
          restaurant.name,
          restaurant.city,
          restaurant.cuisine,
          "restaurant",
          "food",
          "halal",
          "eat"
        ),
        boost: 3,
      })
    )
  }

  items.push(
    item({
      id: "maidabo",
      title: "Maidabo Foundation",
      subtitle: "Donate · Support education and healthcare",
      icon: "heart",
      category: "Features",
      action: "link",
      target: "https://maidabo.com",
      keywords: kw("maidabo", "donate", "charity", "foundation"),
    })
  )

  return items
}

function normalizeQuery(q: string): string {
  return q
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u064B-\u065F]/g, "")
    .replace(/[^\p{L}\p{N}\s'/+-]/gu, " ")
    .replace(/\s+/g, " ")
    .trim()
}

/** Score how well an item matches the query (higher is better). */
export function scoreSearchItem(item: SearchResult, rawQuery: string): number {
  const q = normalizeQuery(rawQuery)
  if (q.length < 1) return 0

  const title = normalizeQuery(item.title)
  const subtitle = normalizeQuery(item.subtitle)
  const category = normalizeQuery(item.category)
  const keywords = item.keywords.map(normalizeQuery).filter(Boolean)
  const haystack = [title, subtitle, category, ...keywords].join(" | ")

  let score = 0

  if (title === q) score += 120
  else if (title.startsWith(q)) score += 90
  else if (title.includes(q)) score += 70

  if (keywords.some(k => k === q)) score += 85
  else if (keywords.some(k => k.startsWith(q) || q.startsWith(k))) score += 55
  else if (keywords.some(k => k.includes(q) || q.includes(k))) score += 40

  if (subtitle.includes(q)) score += 25
  if (category === q || category.includes(q)) score += 35

  // Multi-word: all tokens present somewhere
  const tokens = q.split(" ").filter(t => t.length > 1)
  if (tokens.length > 1) {
    const hits = tokens.filter(t => haystack.includes(t)).length
    score += hits * 12
    if (hits === tokens.length) score += 20
  }

  // Soft plural / stemming-ish
  const singular = q.endsWith("s") && q.length > 3 ? q.slice(0, -1) : q
  if (singular !== q && haystack.includes(singular)) score += 30
  if (!haystack.includes(q) && !haystack.includes(singular) && score === 0) return 0

  score += item.boost ?? 0
  return score
}

export function searchCatalog(items: SearchResult[], query: string, limit = 80): SearchResult[] {
  const q = query.trim()
  if (q.length < 2) return []

  return items
    .map(item => ({ item, score: scoreSearchItem(item, q) }))
    .filter(x => x.score > 0)
    .sort((a, b) => b.score - a.score || (b.item.boost ?? 0) - (a.item.boost ?? 0))
    .slice(0, limit)
    .map(x => x.item)
}

export const SEARCH_CATEGORY_COLORS: Record<string, string> = {
  Home: "#1E3A5F",
  Maps: "#1E3A5F",
  Services: "#2D6A4F",
  Hotels: "#1B4F9C",
  Restaurants: "#C9A84C",
  Flights: "#0770E3",
  Agents: "#1E3A5F",
  Transport: "#5C3D00",
  Shopping: "#7B2FBE",
  Umrah: "#C9A84C",
  Hajj: "#8B5E34",
  Madinah: "#2D6A4F",
  Duas: "#5B4B8A",
  Quran: "#1E3A5F",
  Calendar: "#0E7490",
  Features: "#555",
}

export const SEARCH_QUICK_CHIPS: { label: string; icon: AppIconKey; q: string }[] = [
  { label: "Hotels", icon: "bed", q: "hotel" },
  { label: "Prophet", icon: "mosque", q: "muhammad" },
  { label: "Qibla", icon: "compass", q: "qibla" },
  { label: "Tawaf", icon: "sync", q: "tawaf" },
  { label: "Food", icon: "restaurant", q: "restaurant" },
  { label: "Quran", icon: "book", q: "quran" },
  { label: "Zamzam", icon: "water", q: "zamzam" },
  { label: "Agents", icon: "handshake", q: "agent" },
  { label: "Services", icon: "bag", q: "services" },
  { label: "Prayer", icon: "mosque", q: "prayer" },
]
