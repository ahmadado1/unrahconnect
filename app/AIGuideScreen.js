import { supabase } from "@/lib/supabase"
import { FunctionsFetchError, FunctionsHttpError } from "@supabase/supabase-js"
import { Ionicons } from "@expo/vector-icons"
import { useRouter } from "expo-router"
import { StatusBar } from "expo-status-bar"
import { useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import {
  ActivityIndicator,
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

const SUGGESTED_QUESTIONS = [
  "How do I perform Tawaf?",
  "Nearest Zamzam station",
  "What is the Umrah checklist?",
  "Fajr prayer steps",
]

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

export default function AIGuideScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { i18n } = useTranslation()
  const listRef = useRef(null)

  const [messages, setMessages] = useState([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Assalamu Alaikum! I'm your UmrahConnect AI guide. Ask me about Umrah, Hajj, prayer, navigating the Haram, or anything in the app.",
    },
  ])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)

  const language = LANGUAGE_NAMES[i18n.language?.split("-")[0]] ?? "English"

  const sendMessage = async (text) => {
    const trimmed = text.trim()
    if (!trimmed || loading) return

    Keyboard.dismiss()
    setInput("")

    const userMessage = { id: Date.now().toString(), role: "user", content: trimmed }
    const nextMessages = [...messages, userMessage]
    setMessages(nextMessages)
    setLoading(true)

    try {
      const apiMessages = nextMessages
        .filter((m) => m.id !== "welcome")
        .map((m) => ({ role: m.role, content: m.content }))

      const { data, error } = await supabase.functions.invoke("ai-guide", {
        body: { messages: apiMessages, language },
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
        { id: (Date.now() + 1).toString(), role: "assistant", content: reply },
      ])
    } catch (err) {
      const detail = await getInvokeErrorMessage(err)
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: detail,
        },
      ])
    } finally {
      setLoading(false)
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100)
    }
  }

  const renderMessage = ({ item }) => {
    const isUser = item.role === "user"
    return (
      <View style={[styles.messageRow, isUser && styles.messageRowUser]}>
        <View style={[styles.bubble, isUser ? styles.userBubble : styles.assistantBubble]}>
          <Text style={[styles.bubbleText, isUser && styles.userBubbleText]}>{item.content}</Text>
        </View>
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
          <Text style={styles.headerSub}>Your Umrah companion</Text>
        </View>
        <View style={{ width: 38 }} />
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
            placeholder="Ask anything about Umrah, Hajj, or the app..."
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
