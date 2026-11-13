import { useAIGuide } from "@/context/AIGuideContext"
import OfflineBanner from "@/app/components/OfflineBanner"
import { useTheme } from "@/context/themeContext"
import { isNetworkError } from "@/lib/networkError"
import { getUmrahProgress, getUserFast, supabase, supabaseAnonKey, supabaseUrl } from "@/lib/supabase"
import { FunctionsFetchError, FunctionsHttpError } from "@supabase/supabase-js"
import { Ionicons } from "@expo/vector-icons"
import { useRouter } from "expo-router"
import { StatusBar } from "expo-status-bar"
import { useEffect, useMemo, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Keyboard,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native"
// Keyboard handling from react-native-keyboard-controller: works the same on every Android version (edge-to-edge).
import { KeyboardAvoidingView } from "react-native-keyboard-controller"
import TouchableOpacity from "@/app/components/AppPressable"
import Markdown from "react-native-markdown-display"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { usePremium } from "@/lib/premium"
import { showPremiumPrompt } from "@/lib/premiumPrompt"

// Must match free_limit in the SQL function ai_use_request.
const AI_FREE_WEEKLY = 12

const NAVY = "#1E3A5F"
const GOLD = "#C9A84C"

const LANGUAGE_NAMES = {
  en: "English",
  ar: "Arabic",
  fr: "French",
  ur: "Urdu",
  tr: "Turkish",
  bn: "Bangla",
}

const UMRAH_STEPS = [
  { id: "1", name: "Madinah Visit" },
  { id: "2", name: "Entering Ihram" },
  { id: "3", name: "Arriving in Makkah" },
  { id: "4", name: "Tawaf" },
  { id: "5", name: "Sa'i" },
  { id: "6", name: "Halq / Taqsir" },
  { id: "7", name: "Umrah Complete" },
]

// Translated in the screen (see suggestedQuestions below).
const SUGGESTED_KEYS = [
  ["aiQTawaf", "How do I perform Tawaf?"],
  ["aiQZamzam", "Nearest Zamzam station"],
  ["aiQChecklist", "What is the Umrah checklist?"],
  ["aiQFajr", "Fajr prayer steps"],
]

function buildMarkdownStyles(theme) {
  const text = theme.text
  const mutedBg = theme.inputBg
  return {
    body: { color: text, fontSize: 15, lineHeight: 22 },
    paragraph: { color: text, fontSize: 15, lineHeight: 22, marginTop: 0, marginBottom: 8 },
    heading1: { color: text, fontWeight: "bold", fontSize: 18, marginBottom: 6 },
    heading2: { color: text, fontWeight: "bold", fontSize: 16, marginBottom: 6 },
    heading3: { color: text, fontWeight: "600", fontSize: 15, marginBottom: 4 },
    strong: { color: text, fontWeight: "bold" },
    em: { color: text, fontStyle: "italic" },
    hr: { backgroundColor: theme.border, height: 1, marginVertical: 8 },
    bullet_list: { marginLeft: 8, marginBottom: 6 },
    ordered_list: { marginLeft: 8, marginBottom: 6 },
    list_item: { color: text, fontSize: 15, lineHeight: 22 },
    blockquote: {
      backgroundColor: mutedBg,
      borderLeftColor: GOLD,
      borderLeftWidth: 3,
      paddingLeft: 8,
      paddingVertical: 4,
      marginVertical: 6,
    },
    code_inline: {
      backgroundColor: mutedBg,
      color: text,
      borderRadius: 4,
      paddingHorizontal: 4,
      fontSize: 13,
    },
    fence: {
      backgroundColor: mutedBg,
      color: text,
      borderRadius: 8,
      padding: 10,
      fontSize: 13,
    },
    link: { color: GOLD },
  }
}

const LINK_MARKER_RE = /\[LINK:\s*([^|\]]+?)\s*\|\s*([^\]]+?)\]/gi

/**
 * The ONLY screens the AI guide can open. Same keys as supabase/functions/ai-guide/appScreens.ts.
 * A key that isn't here (or a made-up path) gives NO button, so a button never opens the wrong screen.
 */
const SCREEN_ROUTES = {
  home: "/(tabs)",
  guide: "/(tabs)/umrah",
  maps: "/(tabs)/maps",
  services: "/(tabs)/services",
  me: "/(tabs)/me",
  "umrah-guide": "/umrah-guide",
  hajj: "/hajj",
  "makkah-companion": "/makkah-companion",
  "miqat-alert": "/miqat-alert",
  "trip-planner": "/trip-planner",
  quran: "/quran",
  "quran-listen": "/quran-listen",
  kahf: "/quran/kahf",
  mulk: "/quran/mulk",
  duas: "/duas",
  dhikr: "/dhikr",
  "morning-adhkar": "/MorningAdhkarScreen",
  "evening-adhkar": "/EveningAdhkarScreen",
  qiblah: "/qiblah",
  "islamic-calendar": "/islamic-calendar",
  "offline-map": "/offline-map",
  "makkah-places": "/makkah-places",
  "makkah-place/abraj-mall": "/makkah-place/abraj-mall",
  "makkah-place/clock-tower-museum": "/makkah-place/clock-tower-museum",
  hotels: "/hotels",
  flights: "/services/flights",
  esim: "/services/esim",
  airalo: "/services/airalo",
  restaurants: "/nearby/restaurants",
  malls: "/nearby/malls",
  transport: "/services/transport",
  shopping: "/nearby/malls",
  "find-agent": "/agent",
  "scan-agent": "/agent/scan",
  profile: "/profile",
  favorites: "/favorites",
  notifications: "/notifications",
  "notification-check": "/notification-check",
  settings: "/settings",
  premium: "/premium",
  "start-guide": "/start-guide",
  contact: "/contact",
  about: "/about",
  "agency-dashboard": "/agent/dashboard",
  "agency-apply": "/agent/apply?auto=1",
}

// Older names the AI may still use → the right key
const KEY_ALIASES = {
  prayer: "home", "prayer-times": "home", qibla: "qiblah", umrah: "umrah-guide", checklist: "umrah-guide",
  "travel-agents": "find-agent", agents: "find-agent", agent: "find-agent", "find-an-agent": "find-agent",
  hospitals: "maps/hospital-makkah", hospital: "maps/hospital-makkah", pharmacy: "maps/hospital-makkah", pharmacies: "maps/hospital-makkah", nahdi: "maps/hospital-makkah",
  "places-to-see": "makkah-places", "clock-tower-museum": "makkah-place/clock-tower-museum", "abraj-mall": "makkah-place/abraj-mall",
  "maps/makkah": "maps/haram", "maps/madinah": "maps/nabawi", "maps/rawdah": "maps/nabawi", "maps/prophet": "maps/nabawi",
  "umrah/madinah": "umrah/1", "umrah/ihram": "umrah/2", "umrah/makkah": "umrah/3", "umrah/tawaf": "umrah/4",
  "umrah/sai": "umrah/5", "umrah/sa'i": "umrah/5", "umrah/halq": "umrah/6", "umrah/taqsir": "umrah/6", "umrah/complete": "umrah/7",
  "hajj/mina": "hajj/3", "hajj/arafah": "hajj/4", "hajj/muzdalifah": "hajj/5", "hajj/jamarat": "hajj/6", "hajj/tashreeq": "hajj/7", "hajj/wadaa": "hajj/8",
  "quran/kahf": "kahf", "quran/mulk": "mulk", "al-kahf": "kahf", "al-mulk": "mulk", tasbih: "duas",
  adhkar: "morning-adhkar", eflights: "flights", "services/flights": "flights", "services/esim": "esim",
  "services/airalo": "airalo", "services/transport": "transport", "services/shopping": "shopping", "agent/dashboard": "agency-dashboard",
}

const MAP_SITES = new Set(["haram", "nabawi", "mina", "arafah", "zamzam", "safa", "hospital-makkah", "lost-found"])

/** AI key → real route, or null when it isn't a real screen. */
function normalizeLinkTarget(raw) {
  let key = String(raw || "").trim().replace(/^\/+/, "").replace(/\s+/g, "").toLowerCase()
  if (!key) return null
  if (KEY_ALIASES[key]) key = KEY_ALIASES[key]
  if (SCREEN_ROUTES[key]) return SCREEN_ROUTES[key]

  let m = key.match(/^quran\/(\d{1,3})$/)
  if (m) {
    const n = Number(m[1])
    return n >= 1 && n <= 114 ? `/quran/${n}` : null
  }
  m = key.match(/^umrah\/([1-7])$/)
  if (m) return `/umrah/${m[1]}`
  m = key.match(/^hajj\/([1-9])$/)
  if (m) return `/hajj/${m[1]}`
  m = key.match(/^maps\/([a-z-]+)$/)
  if (m && MAP_SITES.has(m[1])) return `/maps/${m[1]}`
  return null
}

function extractLinkMarkers(text) {
  const links = []
  const seen = new Set()
  const re = new RegExp(LINK_MARKER_RE.source, "gi")
  let match
  while ((match = re.exec(text)) !== null && links.length < 3) {
    const route = normalizeLinkTarget(match[1])
    const label = String(match[2] || "").trim()
    if (!route || !label || seen.has(route)) continue
    seen.add(route)
    links.push({ id: `marker-${links.length}-${route}`, label, route })
  }

  let cleaned = text.replace(new RegExp(LINK_MARKER_RE.source, "gi"), "")
  cleaned = cleaned.replace(/\n{3,}/g, "\n\n").trim()
  return { cleaned, links }
}

/** Hide incomplete trailing [LINK: while streaming */
function displayContentFromRaw(raw) {
  let text = String(raw || "").replace(new RegExp(LINK_MARKER_RE.source, "gi"), "")
  const idx = text.lastIndexOf("[LINK:")
  if (idx !== -1) {
    const after = text.slice(idx)
    if (!after.includes("]")) text = text.slice(0, idx)
  }
  return text.replace(/\n{3,}/g, "\n\n").trimEnd()
}

/** Popular surah names → number (fallback when Claude omits markers) */
const SURAH_ALIASES = [
  { n: 1, names: ["al-fatiha", "al fatiha", "fatiha", "fatihah", "الفاتحة"] },
  { n: 2, names: ["al-baqarah", "al baqarah", "baqarah", "baqara", "البقرة"] },
  { n: 3, names: ["al-imran", "ali imran", "imran", "آل عمران"] },
  { n: 12, names: ["yusuf", "يوسف"] },
  { n: 18, names: ["al-kahf", "al kahf", "kahf", "الكهف"] },
  { n: 19, names: ["maryam", "مريم"] },
  { n: 36, names: ["ya-sin", "ya sin", "yasin", "yaseen", "يس"] },
  { n: 55, names: ["ar-rahman", "ar rahman", "rahman", "الرحمن"] },
  { n: 56, names: ["al-waqiah", "al waqiah", "waqiah", "الواقعة"] },
  { n: 67, names: ["al-mulk", "al mulk", "mulk", "الملك"] },
  { n: 78, names: ["an-naba", "an naba", "naba", "النبأ"] },
  { n: 112, names: ["al-ikhlas", "al ikhlas", "ikhlas", "الإخلاص"] },
  { n: 113, names: ["al-falaq", "al falaq", "falaq", "الفلق"] },
  { n: 114, names: ["an-nas", "an nas", "nas", "الناس"] },
]

function detectSurahLinks(text) {
  const lower = text.toLowerCase()
  const links = []

  const numMatch = lower.match(/\b(?:surah|sura|chapter|سورة)\s*(?:number\s*)?(\d{1,3})\b/)
  if (numMatch) {
    const n = Number(numMatch[1])
    if (n >= 1 && n <= 114) {
      links.push({ id: `surah-${n}`, label: `Surah ${n}`, route: `/quran/${n}` })
    }
  }

  for (const s of SURAH_ALIASES) {
    if (links.some((l) => l.route === `/quran/${s.n}`)) continue
    if (s.names.some((name) => lower.includes(name))) {
      links.push({
        id: `surah-${s.n}`,
        label: `Read Surah ${s.n}`,
        route: `/quran/${s.n}`,
      })
    }
  }

  return links
}

/**
 * Fallback when the AI added no button: only very specific words in the QUESTION
 * (Tawaf, Zamzam, Qibla, hotels…). Broad words like "Makkah", "Umrah" or "prayer" no longer
 * add a button, because they often pointed to the wrong screen.
 */
const DEEP_LINK_RULES = [
  {
    id: "tawaf",
    label: "Tawaf Guide",
    route: "/umrah/4",
    patterns: [/\btawaf\b/i, /طواف/],
  },
  {
    id: "sai",
    label: "Sa'i Step",
    route: "/umrah/5",
    patterns: [/\bsa['’]?i\b/i, /سعي/],
  },
  {
    id: "ihram",
    label: "Ihram Step",
    route: "/umrah/2",
    patterns: [/\bihram\b/i, /إحرام/, /احرام/],
  },
  {
    id: "halq",
    label: "Halq / Taqsir",
    route: "/umrah/6",
    patterns: [/\bhalq\b/i, /\btaqsir\b/i, /حلق/, /تقصير/],
  },
  {
    id: "hajj-arafah",
    label: "Day of Arafah",
    route: "/hajj/4",
    patterns: [/\barafah\b/i, /\barafat\b/i, /عرفة/],
  },
  {
    id: "hajj-muzdalifah",
    label: "Muzdalifah",
    route: "/hajj/5",
    patterns: [/\bmuzdalifah\b/i, /مزدلفة/],
  },
  {
    id: "hajj-jamarat",
    label: "Jamarat",
    route: "/hajj/6",
    patterns: [/\bjamarat\b/i, /\bstoning\b/i, /جمرات/],
  },
  {
    id: "zamzam",
    label: "Zamzam",
    route: "/maps/zamzam",
    patterns: [/\bzamzam\b/i, /زمزم/],
  },
  {
    id: "safa",
    label: "Safa & Marwah",
    route: "/maps/safa",
    patterns: [/\bsafa\b/i, /\bmarwa\b/i, /\bmarwah\b/i, /صفا/, /مروة/],
  },
  {
    id: "mina",
    label: "Mina Map",
    route: "/maps/mina",
    patterns: [/\bmina\b/i, /منى/],
  },
  {
    id: "qibla",
    label: "Open Qibla",
    route: "/qiblah",
    patterns: [/\bqibla\b/i, /\bqiblah\b/i, /قبلة/, /قبلہ/],
  },
  {
    id: "hotels",
    label: "Featured Hotels",
    route: "/hotels",
    patterns: [
      /\bhotel\b/i,
      /\bhotels\b/i,
      /\baccommodation\b/i,
      /\bbooking\.com\b/i,
      /\bbudget hotel\b/i,
      /\bswissotel\b/i,
      /\bpullman\b/i,
      /\bfairmont\b/i,
      /فندق/,
    ],
  },
  {
    id: "makkah-places",
    label: "Places to See",
    route: "/makkah-places",
    patterns: [
      /\bplaces to see\b/i,
      /\bclock tower museum\b/i,
      /\babraj\b/i,
      /\babraj al bait\b/i,
      /أبراج البيت/,
      /متحف ساعة/,
    ],
  },
  {
    id: "restaurants",
    label: "Restaurants",
    route: "/nearby/restaurants",
    patterns: [/\brestaurants?\b/i, /مطعم/, /مطاعم/],
  },
  {
    id: "hospitals",
    label: "Hospitals & Pharmacy",
    route: "/maps/hospital-makkah",
    patterns: [
      /\bhospital\b/i,
      /\bmedical\b/i,
      /\bpharmacy\b/i,
      /\bpharmacies\b/i,
      /\bnahdi\b/i,
      /مستشفى/,
      /صيدلية/,
      /النهدي/,
    ],
  },
  {
    id: "alkahf",
    label: "Surah Al-Kahf",
    route: "/quran/18",
    patterns: [/\bal-?kahf\b/i, /\bkahf\b/i, /سورة الكهف/, /الكهف/],
  },
  {
    id: "transport",
    label: "Transport",
    route: "/(tabs)/services",
    patterns: [/\btransport\b/i, /\bbus\b/i, /\btrain\b/i, /\buber\b/i, /\bharamain\b/i, /\bsaptco\b/i],
  },
]

const WELCOME_LINKS = [
  { id: "welcome-umrah", label: "Umrah Guide", route: "/umrah-guide" },
  { id: "welcome-prayer", label: "Prayer Times", route: "/(tabs)" },
]

function getKeywordDeepLinks(...texts) {
  const combined = texts.filter(Boolean).join("\n")
  if (!combined) return []

  const links = []
  const seenRoutes = new Set()

  for (const surah of detectSurahLinks(combined)) {
    if (links.length >= 3) break
    if (seenRoutes.has(surah.route)) continue
    seenRoutes.add(surah.route)
    links.push(surah)
  }

  for (const rule of DEEP_LINK_RULES) {
    if (links.length >= 3) break
    if (!rule.patterns.some((re) => re.test(combined))) continue
    if (seenRoutes.has(rule.route)) continue
    seenRoutes.add(rule.route)
    links.push({ id: rule.id, label: rule.label, route: rule.route })
  }

  return links
}

async function getInvokeErrorKey(error) {
  if (error instanceof FunctionsHttpError) {
    try {
      const body = await error.context.json()
      if (body?.error && isNetworkError(body.error)) return "networkError"
      // Keep specific server errors as plain text via null → caller uses somethingWentWrong
      if (body?.error) return null
    } catch {
      // ignore parse errors
    }
  }

  if (error instanceof FunctionsFetchError) return "networkError"
  if (isNetworkError(error)) return "networkError"
  return "somethingWentWrong"
}

function buildProgressContext(completedIds) {
  const completedSet = new Set((completedIds ?? []).map(String))
  const completedSteps = UMRAH_STEPS.filter((s) => completedSet.has(s.id)).map((s) => s.name)
  const completedCount = completedSteps.length
  const currentStep = completedCount >= UMRAH_STEPS.length ? UMRAH_STEPS.length : completedCount + 1
  const currentStepName = UMRAH_STEPS[currentStep - 1]?.name ?? `Step ${currentStep}`

  return {
    umrahProgress: currentStep,
    completedSteps,
    currentStep,
    currentStepName,
  }
}

async function streamAiGuide({ body, onText, signal, onQuota }) {
  const { data: sessionData } = await supabase.auth.getSession()
  const accessToken = sessionData?.session?.access_token || supabaseAnonKey

  const response = await fetch(`${supabaseUrl}/functions/v1/ai-guide`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      apikey: supabaseAnonKey,
      "Content-Type": "application/json",
      Accept: "text/event-stream",
    },
    body: JSON.stringify({ ...body, stream: true }),
    signal,
  })

  const contentType = response.headers.get("content-type") || ""

  if (!response.ok) {
    let message = `Request failed (${response.status})`
    try {
      const errJson = await response.json()
      if (errJson?.error) message = String(errJson.error)
    } catch {
      // ignore
    }
    // Weekly free limit reached (or not logged in): the screen shows a friendly message.
    if (message === "ai_limit" || message === "ai_login") onQuota?.(0)
    throw new Error(message)
  }

  // Free questions left this week. Empty header = Premium (unlimited) or unknown.
  const remainingHeader = response.headers.get("x-ai-remaining")
  if (remainingHeader !== null && remainingHeader !== "") onQuota?.(Number(remainingHeader))
  else onQuota?.(null)

  // Legacy JSON fallback if edge function didn't stream
  if (contentType.includes("application/json")) {
    const data = await response.json()
    if (data?.error) throw new Error(String(data.error))
    const reply = data?.reply ?? ""
    if (reply) onText(reply)
    return reply
  }

  const reader = response.body?.getReader?.()
  if (!reader) {
    const full = await response.text()
    // Try parse as SSE blob or plain text
    let assembled = ""
    for (const line of full.split("\n")) {
      const trimmed = line.trim()
      if (!trimmed.startsWith("data:")) continue
      try {
        const event = JSON.parse(trimmed.slice(5).trim())
        if (event.type === "text" && event.text) {
          assembled += event.text
          onText(assembled)
        } else if (event.type === "error") {
          throw new Error(event.error || "Stream error")
        }
      } catch (e) {
        if (e instanceof Error && e.message !== "Unexpected end of JSON input") {
          if (String(e.message).includes("Stream") || String(e.message).includes("Request")) throw e
        }
      }
    }
    if (!assembled && full.trim()) {
      assembled = full.trim()
      onText(assembled)
    }
    return assembled
  }

  const decoder = new TextDecoder()
  let buffer = ""
  let assembled = ""

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split("\n")
    buffer = lines.pop() ?? ""

    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed.startsWith("data:")) continue
      const payload = trimmed.slice(5).trim()
      if (!payload) continue

      let event
      try {
        event = JSON.parse(payload)
      } catch {
        continue
      }

      if (event.type === "text" && event.text) {
        assembled += event.text
        onText(assembled)
      } else if (event.type === "error") {
        throw new Error(event.error || "Stream error")
      }
    }
  }

  return assembled
}

export default function AIGuideScreen() {
  const router = useRouter()
  // Pilgrim or agency: the AI answers differently, and some buttons are only for one of them
  // Who is asking: pilgrim (free or Premium) or agency (verified or not).
  // The AI answers for that account, and buttons that don't fit it are removed.
  const { agency, isPremium: hasPremium } = usePremium()
  const accountType =
    agency === "verified" ? "agency"
      : agency === "pending" ? "agency-pending"
        : hasPremium ? "pilgrim-premium"
          : "pilgrim-free"
  const insets = useSafeAreaInsets()
  const { theme, isDark } = useTheme()
  const { i18n, t } = useTranslation()
  const suggestedQuestions = SUGGESTED_KEYS.map(([key, fallback]) => t(key, { defaultValue: fallback }))
  // Umrah progress for the welcome message (set when the account loads).
  const [progressInfo, setProgressInfo] = useState(null)
  const listRef = useRef(null)
  const abortRef = useRef(null)
  const { messages, setMessages, loading, setLoading, clearChat } = useAIGuide()
  const userContextRef = useRef({
    userName: "Pilgrim",
    umrahProgress: 1,
    completedSteps: [],
    currentStep: 1,
    currentStepName: UMRAH_STEPS[0].name,
  })

  const [userName, setUserName] = useState("Pilgrim")
  const [input, setInput] = useState("")
  const personalizedWelcomeRef = useRef(false)

  const language = LANGUAGE_NAMES[i18n.language?.split("-")[0]] ?? "English"
  const markdownStyles = useMemo(() => buildMarkdownStyles(theme), [theme])
  const headerBg = isDark ? theme.header : NAVY

  useEffect(() => {
    let cancelled = false

    const loadContext = async () => {
      try {
        const [{ data: authData }, completedIds] = await Promise.all([
          getUserFast(),
          getUmrahProgress(),
        ])

        const user = authData?.user
        const name =
          user?.user_metadata?.full_name?.split(" ")[0] ||
          user?.user_metadata?.name?.split(" ")[0] ||
          "Pilgrim"
        const progress = buildProgressContext(completedIds)

        if (cancelled) return

        setUserName(name)
        setProgressInfo(progress)
        userContextRef.current = { userName: name, ...progress }

        setMessages((prev) => {
          if (personalizedWelcomeRef.current) return prev
          if (prev.length !== 1 || !String(prev[0].id).startsWith("welcome")) return prev
          personalizedWelcomeRef.current = true
          const progressHint =
            progress.completedSteps.length > 0
              ? ` You're on step ${progress.currentStep}: ${progress.currentStepName}.`
              : ` Ready to begin with ${progress.currentStepName}?`
          return [
            {
              ...prev[0],
              content: `Assalamu Alaikum, ${name}! I'm your UmrahConnect AI guide.${progressHint} Ask me about Umrah, Hajj, prayer, the Haram, or any app feature.`,
              links: WELCOME_LINKS,
            },
          ]
        })
      } catch (e) {
        console.log("AI guide context load error:", e)
      }
    }

    loadContext()
    return () => {
      cancelled = true
      abortRef.current?.abort()
    }
  }, [setMessages])

  const confirmClearChat = () => {
    Alert.alert(
      t("aiNewChat", { defaultValue: "New chat" }),
      t("aiClearConfirm", { defaultValue: "Are you sure you want to clear the chat?" }),
      [
        { text: t("cancel", { defaultValue: "Cancel" }), style: "cancel" },
        {
          text: t("yes", { defaultValue: "Yes" }),
          style: "destructive",
          onPress: () => {
            abortRef.current?.abort()
            const ctx = userContextRef.current
            const name = ctx.userName || userName || "Pilgrim"
            const progressHint =
              ctx.completedSteps?.length > 0
                ? ` You're on step ${ctx.currentStep}: ${ctx.currentStepName}.`
                : ` Ready to begin with ${ctx.currentStepName}?`

            personalizedWelcomeRef.current = true
            clearChat()
            setMessages([
              {
                id: `welcome-${Date.now()}`,
                role: "assistant",
                content: `Assalamu Alaikum, ${name}! I'm your UmrahConnect AI guide.${progressHint} Ask me about Umrah, Hajj, prayer, the Haram, or any app feature.`,
                links: WELCOME_LINKS,
              },
            ])
          },
        },
      ]
    )
  }

  // Free questions left this week (null = Premium/unlimited or not known yet).
  const [aiRemaining, setAiRemaining] = useState(null)
  const premium = usePremium()

  // On open: count this week's questions so the header shows "8 of 12 left" straight away.
  useEffect(() => {
    if (premium.isPremium) {
      setAiRemaining(null)
      return
    }
    let active = true
    ;(async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) return
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
        const { count, error } = await supabase
          .from("ai_usage")
          .select("id", { count: "exact", head: true })
          .eq("user_id", session.user.id)
          .gt("created_at", weekAgo)
        if (!error && active) setAiRemaining(Math.max(0, AI_FREE_WEEKLY - (count ?? 0)))
      } catch {
        // offline: the count appears after the next question
      }
    })()
    return () => {
      active = false
    }
  }, [premium.isPremium])

  const sendMessage = async (text) => {
    const trimmed = text.trim()
    if (!trimmed || loading) return

    Keyboard.dismiss()
    setInput("")

    const userMessage = { id: Date.now().toString(), role: "user", content: trimmed, links: [] }
    const assistantId = (Date.now() + 1).toString()
    const streamingAssistant = {
      id: assistantId,
      role: "assistant",
      content: "",
      rawContent: "",
      links: [],
      streaming: true,
    }

    const nextMessages = [...messages, userMessage]
    setMessages([...nextMessages, streamingAssistant])
    setLoading(true)

    const controller = new AbortController()
    abortRef.current = controller

    try {
      try {
        const completedIds = await getUmrahProgress()
        const progress = buildProgressContext(completedIds)
        userContextRef.current = {
          ...userContextRef.current,
          ...progress,
        }
      } catch {}

      const ctx = userContextRef.current
      const apiMessages = nextMessages
        .filter((m) => !String(m.id).startsWith("welcome"))
        .map((m) => ({ role: m.role, content: m.content }))

      const fullReply = await streamAiGuide({
        signal: controller.signal,
        onQuota: setAiRemaining,
        body: {
          messages: apiMessages,
          language,
          currentLanguage: language,
          userName: ctx.userName || userName,
          umrahProgress: ctx.umrahProgress,
          completedSteps: ctx.completedSteps,
          currentStep: ctx.currentStep,
          currentStepName: ctx.currentStepName,
          accountType,
        },
        onText: (assembled) => {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId
                ? {
                    ...m,
                    rawContent: assembled,
                    content: displayContentFromRaw(assembled),
                    streaming: true,
                  }
                : m
            )
          )
          listRef.current?.scrollToEnd({ animated: false })
        },
      })

      const { cleaned, links: markerLinks } = extractLinkMarkers(fullReply || "")
      // Prefer Claude's [LINK:] markers; fall back to user-question keywords only
      const allLinks =
        markerLinks.length > 0
          ? markerLinks.slice(0, 3)
          : getKeywordDeepLinks(trimmed)
      // Only buttons that fit this account:
      //  - agencies: never the Premium screen; a verified agency doesn't need "agency-apply"
      //  - pilgrims: never the agency screens
      //  - Premium pilgrims: no "Get Premium" button unless they asked about their subscription
      const asksAboutSubscription = /subscri|cancel|restore|renew|abonn|اشتراك|abonelik|سبسکرپشن|সাবস্ক্রিপশন|premium/i.test(trimmed)
      const links = allLinks.filter((l) => {
        const route = String(l.route)
        const agencyScreen = route.startsWith("/agent/dashboard") || route.startsWith("/agent/apply")
        if (accountType === "pilgrim-free") return !agencyScreen
        if (accountType === "pilgrim-premium") return !agencyScreen && (route !== "/premium" || asksAboutSubscription)
        if (accountType === "agency") return route !== "/premium" && !route.startsWith("/agent/apply")
        return route !== "/premium" // agency-pending
      })

      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId
            ? {
                ...m,
                content:
                  cleaned ||
                  "Sorry, I couldn't get a response right now. Please try again.",
                rawContent: fullReply || "",
                links,
                streaming: false,
              }
            : m
        )
      )
    } catch (err) {
      if (err?.name === "AbortError") return
      const limitHit = err?.message === "ai_limit" || err?.message === "ai_login"
      // Free weekly questions used up: show the Premium card (unlimited AI).
      if (err?.message === "ai_limit") showPremiumPrompt()
      const key = limitHit
        ? err.message === "ai_login" ? "aiLoginNeeded" : "aiLimitReached"
        : await getInvokeErrorKey(err)
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId
            ? {
                ...m,
                // The short reason in brackets helps us find the problem from a screenshot.
                content: key
                  ? t(key)
                  : `${t("somethingWentWrong")}${err?.message ? `\n\n(${String(err.message).slice(0, 140)})` : ""}`,
                links: [],
                streaming: false,
              }
            : m
        )
      )
    } finally {
      setLoading(false)
      abortRef.current = null
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100)
    }
  }

  const openLink = (route) => {
    try {
      router.push(route)
    } catch (e) {
      console.log("AI deep link error:", e)
    }
  }

  // Welcome message, always in the app language (shown instead of the stored English text).
  const welcomeText = (() => {
    const name = userName && userName !== "Pilgrim" ? userName : null
    const parts = [name ? t("aiWelcomeName", { name, defaultValue: "Assalamu Alaikum, {{name}}! I'm your UmrahConnect AI guide." }) : t("aiWelcome", { defaultValue: "Assalamu Alaikum! I'm your UmrahConnect AI guide." })]
    if (progressInfo) {
      const step = progressInfo.currentStep
      const stepName = t(`phase_umrah_${step}_title`, { defaultValue: progressInfo.currentStepName })
      parts.push(
        progressInfo.completedSteps.length > 0
          ? t("aiWelcomeStep", { step, name: stepName, defaultValue: "You're on step {{step}}: {{name}}." })
          : t("aiWelcomeBegin", { name: stepName, defaultValue: "Ready to begin with {{name}}?" })
      )
    }
    parts.push(t("aiWelcomeAsk", { defaultValue: "Ask me about Umrah, Hajj, prayer, the Haram, or any app feature." }))
    return parts.join(" ")
  })()

  const renderMessage = ({ item }) => {
    const isUser = item.role === "user"
    if (!isUser && String(item.id).startsWith("welcome")) item = { ...item, content: welcomeText }
    const links = !isUser && Array.isArray(item.links) ? item.links : []
    const showTyping = !isUser && item.streaming && !String(item.content || "").trim()

    return (
      <View style={[styles.messageRow, isUser && styles.messageRowUser]}>
        <View
          style={[
            styles.bubble,
            isUser
              ? [styles.userBubble, { backgroundColor: headerBg }]
              : [
                  styles.assistantBubble,
                  {
                    backgroundColor: theme.card,
                    borderColor: theme.border,
                  },
                ],
          ]}
        >
          {isUser ? (
            <Text style={[styles.bubbleText, styles.userBubbleText]}>{item.content}</Text>
          ) : showTyping ? (
            <View style={styles.typingRow}>
              <ActivityIndicator size="small" color={GOLD} />
              <Text style={[styles.typingText, { color: theme.textSecondary }]}>{t("aiThinking", { defaultValue: "Thinking…" })}</Text>
            </View>
          ) : item.streaming ? (
            <Text style={[styles.bubbleText, { color: theme.text }]}>
              {item.content}
              <Text style={styles.cursor}> ▍</Text>
            </Text>
          ) : (
            <Markdown style={markdownStyles}>{item.content || " "}</Markdown>
          )}
        </View>

        {!item.streaming && links.length > 0 && (
          <View style={styles.linkRow}>
            {links.map((link) => (
              <TouchableOpacity
                key={`${item.id}-${link.id}`}
                style={[
                  styles.linkChip,
                  {
                    backgroundColor: isDark
                      ? "rgba(201,168,76,0.12)"
                      : "rgba(201,168,76,0.08)",
                  },
                ]}
                onPress={() => openLink(link.route)}
                activeOpacity={0.75}
              >
                <Text style={[styles.linkChipText, { color: theme.text }]}>{link.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    )
  }

  return (
    <View style={[styles.screen, { backgroundColor: theme.background }]}>
      <StatusBar style="light" />
      {/* "No internet" pill: this screen needs the internet */}
      <OfflineBanner />

      <View style={[styles.header, { backgroundColor: headerBg, paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>{t("ui_aiGuide")}</Text>
          <Text style={styles.headerSub}>
            {userName !== "Pilgrim"
              ? t("aiHelping", { name: userName, defaultValue: "Helping {{name}}" })
              : t("aiCompanion", { defaultValue: "Your Umrah companion" })}
          </Text>
          {premium.isPremium ? (
            <View style={[styles.planPill, styles.planPillPremium]}>
              <Ionicons name="star" size={10} color="#1E3A5F" />
              <Text style={[styles.planPillText, { color: "#1E3A5F" }]}>{t("aiUnlimited")}</Text>
            </View>
          ) : aiRemaining !== null ? (
            <View style={styles.planPill}>
              <Text style={styles.planPillText}>
                {t("aiFreeOfTotal", { left: aiRemaining, total: AI_FREE_WEEKLY })}
              </Text>
            </View>
          ) : null}
        </View>
        <TouchableOpacity
          onPress={confirmClearChat}
          style={styles.backBtn}
          accessibilityLabel={t("aiNewChat", { defaultValue: "New chat" })}
        >
          <Ionicons name="trash-outline" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior="padding"
        keyboardVerticalOffset={0}
      >
        <View style={[styles.chipsSection, { backgroundColor: headerBg }]}>
          <ScrollView keyboardDismissMode="on-drag"
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipsRow}
            keyboardShouldPersistTaps="handled"
          >
            {suggestedQuestions.map((question) => (
              <TouchableOpacity
                key={question}
                style={styles.chip}
                onPress={() => sendMessage(question)}
                disabled={loading}
                activeOpacity={0.7}
              >
                <Text style={styles.chipText}>{question}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          contentContainerStyle={styles.messageList}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode={Platform.OS === "ios" ? "interactive" : "on-drag"}
        />


        <View
          style={[
            styles.inputBar,
            {
              backgroundColor: theme.card,
              borderTopColor: theme.border,
              paddingBottom: Math.max(insets.bottom, 12),
            },
          ]}
        >
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: theme.inputBg,
                color: theme.text,
                borderColor: theme.border,
              },
            ]}
            placeholder={t("aiPlaceholder", { defaultValue: "Ask about Umrah, Hajj, Islam, or the app..." })}
            placeholderTextColor={theme.textMuted}
            value={input}
            onChangeText={setInput}
            multiline
            maxLength={500}
            editable={!loading}
            returnKeyType="send"
            onSubmitEditing={() => sendMessage(input)}
          />
          <TouchableOpacity
            style={[styles.sendBtn, (!input.trim() || loading) && styles.sendBtnDisabled]}
            onPress={() => sendMessage(input)}
            disabled={!input.trim() || loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color={NAVY} />
            ) : (
              <Ionicons name="send" size={18} color={NAVY} />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  )
}

const styles = StyleSheet.create({
  planPill: { flexDirection: "row", alignItems: "center", gap: 4, alignSelf: "center", marginTop: 4, paddingHorizontal: 10, paddingVertical: 2, borderRadius: 999, backgroundColor: "rgba(255,255,255,0.14)" },
  planPillPremium: { backgroundColor: "#C9A84C" },
  planPillText: { fontSize: 11, fontWeight: "700", color: "#E8D5A3" },
  screen: { flex: 1 },
  flex: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerCenter: { flex: 1, alignItems: "center" },
  headerTitle: { color: "#fff", fontSize: 18, fontWeight: "700" },
  headerSub: { color: GOLD, fontSize: 12, marginTop: 2 },
  chipsSection: {
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(201,168,76,0.25)",
  },
  chipsRow: { paddingHorizontal: 16, gap: 8 },
  chip: {
    backgroundColor: "rgba(201,168,76,0.15)",
    borderWidth: 1,
    borderColor: "rgba(201,168,76,0.45)",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  chipText: { color: "#fff", fontSize: 13, fontWeight: "500" },
  messageList: { padding: 16, paddingBottom: 8, flexGrow: 1 },
  messageRow: { marginBottom: 12, alignItems: "flex-start" },
  messageRowUser: { alignItems: "flex-end" },
  bubble: {
    maxWidth: "85%",
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  assistantBubble: {
    borderWidth: 1,
    borderTopLeftRadius: 4,
  },
  userBubble: {
    borderTopRightRadius: 4,
  },
  bubbleText: { fontSize: 15, lineHeight: 22 },
  userBubbleText: { color: "#fff" },
  typingRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 4 },
  typingText: { fontSize: 14, fontStyle: "italic" },
  cursor: { color: GOLD, fontSize: 16, lineHeight: 18, marginTop: -4 },
  linkRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 8,
    maxWidth: "92%",
  },
  linkChip: {
    borderWidth: 1.5,
    borderColor: GOLD,
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  linkChipText: {
    fontSize: 12,
    fontWeight: "600",
  },
  inputBar: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    gap: 8,
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    borderWidth: 1,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: GOLD,
    alignItems: "center",
    justifyContent: "center",
  },
  sendBtnDisabled: { opacity: 0.5 },
})
