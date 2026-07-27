import { useAIGuide } from "@/context/AIGuideContext"
import { isNetworkError } from "@/lib/networkError"
import { getUmrahProgress, supabase, supabaseAnonKey, supabaseUrl } from "@/lib/supabase"
import { FunctionsFetchError, FunctionsHttpError } from "@supabase/supabase-js"
import { Ionicons } from "@expo/vector-icons"
import { useRouter } from "expo-router"
import { StatusBar } from "expo-status-bar"
import { useEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native"
import Markdown from "react-native-markdown-display"
import { useSafeAreaInsets } from "react-native-safe-area-context"

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

const SUGGESTED_QUESTIONS = [
  "How do I perform Tawaf?",
  "Nearest Zamzam station",
  "What is the Umrah checklist?",
  "Fajr prayer steps",
]

const MARKDOWN_STYLES = {
  body: { color: NAVY, fontSize: 15, lineHeight: 22 },
  paragraph: { color: NAVY, fontSize: 15, lineHeight: 22, marginTop: 0, marginBottom: 8 },
  heading1: { color: NAVY, fontWeight: "bold", fontSize: 18, marginBottom: 6 },
  heading2: { color: NAVY, fontWeight: "bold", fontSize: 16, marginBottom: 6 },
  heading3: { color: NAVY, fontWeight: "600", fontSize: 15, marginBottom: 4 },
  strong: { color: NAVY, fontWeight: "bold" },
  em: { color: NAVY, fontStyle: "italic" },
  hr: { backgroundColor: "#E0E0E0", height: 1, marginVertical: 8 },
  bullet_list: { marginLeft: 8, marginBottom: 6 },
  ordered_list: { marginLeft: 8, marginBottom: 6 },
  list_item: { color: NAVY, fontSize: 15, lineHeight: 22 },
  blockquote: {
    backgroundColor: "#F5F0E8",
    borderLeftColor: GOLD,
    borderLeftWidth: 3,
    paddingLeft: 8,
    paddingVertical: 4,
    marginVertical: 6,
  },
  code_inline: {
    backgroundColor: "#F5F0E8",
    color: NAVY,
    borderRadius: 4,
    paddingHorizontal: 4,
    fontSize: 13,
  },
  fence: {
    backgroundColor: "#F5F0E8",
    color: NAVY,
    borderRadius: 8,
    padding: 10,
    fontSize: 13,
  },
  link: { color: GOLD },
}

const LINK_MARKER_RE = /\[LINK:\s*([^|\]]+?)\s*\|\s*([^\]]+?)\]/gi

/** Slug aliases Claude may emit → real expo routes */
const LINK_ALIASES = {
  home: "/(tabs)",
  prayer: "/(tabs)",
  "prayer-times": "/(tabs)",
  quran: "/quran",
  qibla: "/qiblah",
  qiblah: "/qiblah",
  hajj: "/hajj",
  umrah: "/umrah-guide",
  "umrah-guide": "/umrah-guide",
  checklist: "/umrah-guide",
  services: "/(tabs)/services",
  hotels: "/hotels",
  restaurants: "/restaurants",
  hospitals: "/maps/hospital-makkah",
  "travel-agents": "/travel-agents",
  agents: "/travel-agents",
  "maps/makkah": "/maps/haram",
  "maps/madinah": "/maps/nabawi",
  "maps/rawdah": "/maps/nabawi",
  "maps/prophet": "/maps/nabawi",
  "umrah/tawaf": "/umrah/4",
  "umrah/sai": "/umrah/5",
  "umrah/sa'i": "/umrah/5",
  "umrah/ihram": "/umrah/2",
  "umrah/madinah": "/umrah/1",
  "umrah/makkah": "/umrah/3",
  "umrah/halq": "/umrah/6",
  "umrah/taqsir": "/umrah/6",
  "umrah/complete": "/umrah/7",
  "hajj/arafah": "/hajj/4",
  "hajj/mina": "/hajj/3",
  "hajj/muzdalifah": "/hajj/5",
  "hajj/jamarat": "/hajj/6",
}

function normalizeLinkTarget(raw) {
  const path = String(raw || "")
    .trim()
    .replace(/^\/+/, "")
    .replace(/\s+/g, "")
  if (!path) return "/(tabs)"

  const key = path.toLowerCase()
  if (LINK_ALIASES[key]) return LINK_ALIASES[key]

  if (/^quran\/\d{1,3}$/i.test(path)) return `/${path}`
  if (/^umrah\/[1-7]$/i.test(path)) return `/${path}`
  if (/^hajj\/[1-9]$/i.test(path)) return `/${path}`
  if (/^maps\/[a-z0-9-]+$/i.test(path)) return `/${path}`

  return `/${path}`
}

function extractLinkMarkers(text) {
  const links = []
  const seen = new Set()
  const re = new RegExp(LINK_MARKER_RE.source, "gi")
  let match
  while ((match = re.exec(text)) !== null && links.length < 3) {
    const route = normalizeLinkTarget(match[1])
    const label = String(match[2] || "").trim()
    if (!label || seen.has(route)) continue
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
      links.push({ id: `surah-${n}`, label: `📖 Surah ${n}`, route: `/quran/${n}` })
    }
  }

  for (const s of SURAH_ALIASES) {
    if (links.some((l) => l.route === `/quran/${s.n}`)) continue
    if (s.names.some((name) => lower.includes(name))) {
      links.push({
        id: `surah-${s.n}`,
        label: `📖 Read Surah ${s.n}`,
        route: `/quran/${s.n}`,
      })
    }
  }

  return links
}

/** Keyword fallback — more specific rules first; max filled later with markers */
const DEEP_LINK_RULES = [
  {
    id: "tawaf",
    label: "✅ Tawaf Guide",
    route: "/umrah/4",
    patterns: [/\btawaf\b/i, /طواف/],
  },
  {
    id: "sai",
    label: "✅ Sa'i Step",
    route: "/umrah/5",
    patterns: [/\bsa['’]?i\b/i, /سعي/],
  },
  {
    id: "ihram",
    label: "✅ Ihram Step",
    route: "/umrah/2",
    patterns: [/\bihram\b/i, /إحرام/, /احرام/],
  },
  {
    id: "halq",
    label: "✅ Halq / Taqsir",
    route: "/umrah/6",
    patterns: [/\bhalq\b/i, /\btaqsir\b/i, /حلق/, /تقصير/],
  },
  {
    id: "hajj-arafah",
    label: "🕋 Day of Arafah",
    route: "/hajj/4",
    patterns: [/\barafah\b/i, /\barafat\b/i, /عرفة/],
  },
  {
    id: "hajj-muzdalifah",
    label: "🕋 Muzdalifah",
    route: "/hajj/5",
    patterns: [/\bmuzdalifah\b/i, /مزدلفة/],
  },
  {
    id: "hajj-jamarat",
    label: "🕋 Jamarat",
    route: "/hajj/6",
    patterns: [/\bjamarat\b/i, /\bstoning\b/i, /جمرات/],
  },
  {
    id: "hajj",
    label: "🕋 Open Hajj Guide",
    route: "/hajj",
    patterns: [/\bhajj\b/i, /حج/],
  },
  {
    id: "madinah-map",
    label: "🗺 Madinah Map",
    route: "/maps/nabawi",
    patterns: [
      /\bmadinah\b/i,
      /\bmadina\b/i,
      /\bnabawi\b/i,
      /\brawdah\b/i,
      /\briyad\b/i,
      /prophet.?s?\s+grave/i,
      /قبر\s*النبي/,
      /الروضة/,
      /المدينة/,
      /نبوي/,
    ],
  },
  {
    id: "makkah-map",
    label: "🗺 Makkah Map",
    route: "/maps/haram",
    patterns: [/\bmakkah\b/i, /\bmecca\b/i, /\bkaaba\b/i, /\bharam\b/i, /مكة/, /الكعبة/, /الحرم/],
  },
  {
    id: "zamzam",
    label: "💧 Zamzam",
    route: "/maps/zamzam",
    patterns: [/\bzamzam\b/i, /زمزم/],
  },
  {
    id: "safa",
    label: "🚶 Safa & Marwah",
    route: "/maps/safa",
    patterns: [/\bsafa\b/i, /\bmarwa\b/i, /\bmarwah\b/i, /صفا/, /مروة/],
  },
  {
    id: "mina",
    label: "⛺ Mina Map",
    route: "/maps/mina",
    patterns: [/\bmina\b/i, /منى/],
  },
  {
    id: "umrah",
    label: "✅ Open Umrah Guide",
    route: "/umrah-guide",
    patterns: [/\bumrah\b/i, /عمرة/],
  },
  {
    id: "checklist",
    label: "✅ My Checklist",
    route: "/umrah-guide",
    patterns: [/\bchecklist\b/i, /\bnext step\b/i, /\bumrah step\b/i],
  },
  {
    id: "prayer",
    label: "🕌 Prayer Times",
    route: "/(tabs)",
    patterns: [
      /\bprayer\b/i,
      /\bsalah\b/i,
      /\bsalat\b/i,
      /\badhan\b/i,
      /\bfajr\b/i,
      /\bdhuhr\b/i,
      /\basr\b/i,
      /\bmaghrib\b/i,
      /\bisha\b/i,
      /صلاة/,
      /أذان/,
      /نماز/,
    ],
  },
  {
    id: "quran",
    label: "📖 Open Quran",
    route: "/quran",
    patterns: [/\bquran\b/i, /\bverse\b/i, /\bsurah\b/i, /\bayah\b/i, /\baya\b/i, /قرآن/, /سورة/, /آية/],
  },
  {
    id: "qibla",
    label: "🧭 Open Qibla",
    route: "/qiblah",
    patterns: [/\bqibla\b/i, /\bqiblah\b/i, /قبلة/, /قبلہ/],
  },
  {
    id: "hotels",
    label: "🏨 Hotels",
    route: "/hotels",
    patterns: [/\bhotel\b/i, /\baccommodation\b/i, /\bstay\b/i],
  },
  {
    id: "restaurants",
    label: "🍽 Restaurants",
    route: "/restaurants",
    patterns: [/\brestaurant\b/i, /\bfood\b/i, /\beat\b/i, /\bdine\b/i],
  },
  {
    id: "hospitals",
    label: "🏥 Hospitals",
    route: "/maps/hospital-makkah",
    patterns: [/\bhospital\b/i, /\bmedical\b/i, /مستشفى/],
  },
  {
    id: "transport",
    label: "🚌 Transport",
    route: "/(tabs)/services",
    patterns: [/\btransport\b/i, /\bbus\b/i, /\btrain\b/i, /\buber\b/i, /\bharamain\b/i, /\bsaptco\b/i],
  },
  {
    id: "maps",
    label: "🗺 Open Maps",
    route: "/(tabs)/maps",
    patterns: [/\bmap\b/i, /\bmaps\b/i, /\bdirections\b/i, /\bnavigate\b/i, /\blandmark\b/i],
  },
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

async function streamAiGuide({ body, onText, signal }) {
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
    throw new Error(message)
  }

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
  const insets = useSafeAreaInsets()
  const { i18n, t } = useTranslation()
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

  useEffect(() => {
    let cancelled = false

    const loadContext = async () => {
      try {
        const [{ data: authData }, completedIds] = await Promise.all([
          supabase.auth.getUser(),
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
        userContextRef.current = { userName: name, ...progress }

        setMessages((prev) => {
          if (personalizedWelcomeRef.current) return prev
          if (prev.length !== 1 || !String(prev[0].id).startsWith("welcome")) return prev
          personalizedWelcomeRef.current = true
          const progressHint =
            progress.completedSteps.length > 0
              ? ` You're on step ${progress.currentStep} — ${progress.currentStepName}.`
              : ` Ready to begin with ${progress.currentStepName}?`
          return [
            {
              ...prev[0],
              content: `Assalamu Alaikum, ${name}! I'm your UmrahConnect AI guide.${progressHint} Ask me about Umrah, Hajj, prayer, the Haram, or any app feature.`,
              links: getKeywordDeepLinks("checklist prayer"),
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
      "New Chat",
      "Are you sure you want to clear the chat?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Yes",
          style: "destructive",
          onPress: () => {
            abortRef.current?.abort()
            const ctx = userContextRef.current
            const name = ctx.userName || userName || "Pilgrim"
            const progressHint =
              ctx.completedSteps?.length > 0
                ? ` You're on step ${ctx.currentStep} — ${ctx.currentStepName}.`
                : ` Ready to begin with ${ctx.currentStepName}?`

            personalizedWelcomeRef.current = true
            clearChat()
            setMessages([
              {
                id: `welcome-${Date.now()}`,
                role: "assistant",
                content: `Assalamu Alaikum, ${name}! I'm your UmrahConnect AI guide.${progressHint} Ask me about Umrah, Hajj, prayer, the Haram, or any app feature.`,
                links: getKeywordDeepLinks("checklist prayer"),
              },
            ])
          },
        },
      ]
    )
  }

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
        body: {
          messages: apiMessages,
          language,
          currentLanguage: language,
          userName: ctx.userName || userName,
          umrahProgress: ctx.umrahProgress,
          completedSteps: ctx.completedSteps,
          currentStep: ctx.currentStep,
          currentStepName: ctx.currentStepName,
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
      const links =
        markerLinks.length > 0
          ? markerLinks.slice(0, 3)
          : getKeywordDeepLinks(trimmed)

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
      const key = await getInvokeErrorKey(err)
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId
            ? {
                ...m,
                content: key ? t(key) : t("somethingWentWrong"),
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

  const renderMessage = ({ item }) => {
    const isUser = item.role === "user"
    const links = !isUser && Array.isArray(item.links) ? item.links : []
    const showTyping = !isUser && item.streaming && !String(item.content || "").trim()

    return (
      <View style={[styles.messageRow, isUser && styles.messageRowUser]}>
        <View style={[styles.bubble, isUser ? styles.userBubble : styles.assistantBubble]}>
          {isUser ? (
            <Text style={[styles.bubbleText, styles.userBubbleText]}>{item.content}</Text>
          ) : showTyping ? (
            <View style={styles.typingRow}>
              <ActivityIndicator size="small" color={GOLD} />
              <Text style={styles.typingText}>Thinking…</Text>
            </View>
          ) : item.streaming ? (
            <Text style={styles.bubbleText}>
              {item.content}
              <Text style={styles.cursor}> ▍</Text>
            </Text>
          ) : (
            <Markdown style={MARKDOWN_STYLES}>{item.content || " "}</Markdown>
          )}
        </View>

        {!item.streaming && links.length > 0 && (
          <View style={styles.linkRow}>
            {links.map((link) => (
              <TouchableOpacity
                key={`${item.id}-${link.id}`}
                style={styles.linkChip}
                onPress={() => openLink(link.route)}
                activeOpacity={0.75}
              >
                <Text style={styles.linkChipText}>{link.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    )
  }

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />

      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>AI Guide</Text>
          <Text style={styles.headerSub}>
            {userName !== "Pilgrim" ? `Helping ${userName}` : "Your Umrah companion"}
          </Text>
        </View>
        <TouchableOpacity
          onPress={confirmClearChat}
          style={styles.backBtn}
          accessibilityLabel="New Chat"
        >
          <Ionicons name="trash-outline" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={0}
      >
        <View style={styles.chipsSection}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipsRow}
            keyboardShouldPersistTaps="handled"
          >
            {SUGGESTED_QUESTIONS.map((question) => (
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
          keyboardDismissMode="interactive"
        />

        <View style={[styles.inputBar, { paddingBottom: Math.max(insets.bottom, 12) }]}>
          <TextInput
            style={styles.input}
            placeholder="Ask about Umrah, Hajj, Islam, or the app..."
            placeholderTextColor="#94A3B8"
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
  screen: { flex: 1, backgroundColor: "#F5F0E8" },
  flex: { flex: 1 },
  header: {
    backgroundColor: NAVY,
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
    backgroundColor: NAVY,
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
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#E0D9CE",
    borderTopLeftRadius: 4,
  },
  userBubble: {
    backgroundColor: NAVY,
    borderTopRightRadius: 4,
  },
  bubbleText: { color: NAVY, fontSize: 15, lineHeight: 22 },
  userBubbleText: { color: "#fff" },
  typingRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 4 },
  typingText: { color: "#64748B", fontSize: 14, fontStyle: "italic" },
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
    backgroundColor: "rgba(201,168,76,0.08)",
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  linkChipText: {
    color: NAVY,
    fontSize: 12,
    fontWeight: "600",
  },
  inputBar: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 12,
    paddingTop: 10,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#E0D9CE",
    gap: 8,
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    backgroundColor: "#F5F0E8",
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    color: NAVY,
    borderWidth: 1,
    borderColor: "#E0D9CE",
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
