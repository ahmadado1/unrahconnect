import { useAIGuide } from "@/context/AIGuideContext"
import { getUmrahProgress, supabase } from "@/lib/supabase"
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

/** More specific rules first — max 3 chips shown per message */
const DEEP_LINK_RULES = [
  {
    id: "tawaf",
    label: "✅ Umrah Checklist",
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
    id: "hajj",
    label: "🕋 Open Hajj Guide",
    route: "/hajj",
    patterns: [/\bhajj\b/i, /حج/],
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
    patterns: [/\bprayer\b/i, /\bsalah\b/i, /\bsalat\b/i, /\badhan\b/i, /\bfajr\b/i, /\bdhuhr\b/i, /\basr\b/i, /\bmaghrib\b/i, /\bisha\b/i, /صلاة/, /أذان/, /نماز/],
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
    id: "zamzam",
    label: "🗺 Open Maps",
    route: "/(tabs)/maps",
    patterns: [/\bzamzam\b/i, /زمزم/],
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

function getDeepLinksForText(...texts) {
  const combined = texts.filter(Boolean).join("\n")
  if (!combined) return []

  const links = []
  const seenRoutes = new Set()

  for (const rule of DEEP_LINK_RULES) {
    if (links.length >= 3) break
    if (!rule.patterns.some((re) => re.test(combined))) continue
    // Avoid duplicate chips that go to the same screen
    if (seenRoutes.has(rule.route)) continue
    seenRoutes.add(rule.route)
    links.push({ id: rule.id, label: rule.label, route: rule.route })
  }

  return links
}

async function getInvokeErrorMessage(error) {
  if (error instanceof FunctionsHttpError) {
    try {
      const body = await error.context.json()
      if (body?.error) return String(body.error)
    } catch {
      // ignore parse errors
    }
  }

  if (error instanceof FunctionsFetchError) {
    return "Could not reach the AI service. Check your connection and try again."
  }

  return error?.message ?? "Something went wrong. Please try again."
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

export default function AIGuideScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { i18n } = useTranslation()
  const listRef = useRef(null)
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

        // Only personalize the welcome once while it's still the lone welcome bubble
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
              links: getDeepLinksForText("checklist prayer"),
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
                links: getDeepLinksForText("checklist prayer"),
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
    const nextMessages = [...messages, userMessage]
    setMessages(nextMessages)
    setLoading(true)

    try {
      // Refresh progress each send so answers stay accurate
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

      const { data, error } = await supabase.functions.invoke("ai-guide", {
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
      })

      if (error) throw error

      if (data?.error) {
        throw new Error(data.error)
      }

      const reply =
        data?.reply ??
        "Sorry, I couldn't get a response right now. Please try again."

      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: reply,
          // Match both the user's question and the AI reply so e.g. "Quran" always shows a button
          links: getDeepLinksForText(trimmed, reply),
        },
      ])
    } catch (err) {
      const detail = await getInvokeErrorMessage(err)
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: detail,
          links: [],
        },
      ])
    } finally {
      setLoading(false)
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

    return (
      <View style={[styles.messageRow, isUser && styles.messageRowUser]}>
        <View style={[styles.bubble, isUser ? styles.userBubble : styles.assistantBubble]}>
          {isUser ? (
            <Text style={[styles.bubbleText, styles.userBubbleText]}>{item.content}</Text>
          ) : (
            <Markdown style={MARKDOWN_STYLES}>{item.content}</Markdown>
          )}
        </View>

        {links.length > 0 && (
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

      {/* Header */}
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
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
      >
        {/* Suggested questions */}
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

        {/* Messages */}
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

        {/* Input */}
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
