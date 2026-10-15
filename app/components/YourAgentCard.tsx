// Home card for a pilgrim linked to an agency: who the agency is, quick WhatsApp/Call, and the latest announcement.
// Renders nothing when the pilgrim has no agency (or the agency is no longer live).
import { useTheme } from "@/context/themeContext"
import { getAgentAnnouncements, getMyAgent, recordLead, type AgentAnnouncement, type PublicAgent } from "@/lib/agents"
import { Ionicons } from "@expo/vector-icons"
import { Image } from "expo-image"
import { useFocusEffect, useRouter } from "expo-router"
import { useCallback, useState } from "react"
import { useTranslation } from "react-i18next"
import { Linking, StyleSheet, Text, View } from "react-native"
import TouchableOpacity from "@/app/components/AppPressable"

const NAVY = "#1E3A5F"
const GOLD = "#C9A84C"
const BLUE = "#1D9BF0"

function digits(value: string | null | undefined) {
  return (value || "").replace(/\D/g, "")
}

export default function YourAgentCard() {
  const router = useRouter()
  const { theme } = useTheme()
  const { t, i18n } = useTranslation()
  const [agent, setAgent] = useState<PublicAgent | null>(null)
  const [latest, setLatest] = useState<AgentAnnouncement | null>(null)

  useFocusEffect(
    useCallback(() => {
      let cancelled = false
      async function load() {
        try {
          const mine = await getMyAgent()
          if (cancelled) return
          setAgent(mine)
          if (mine) {
            const news = await getAgentAnnouncements(mine.id, 1)
            if (!cancelled) setLatest(news[0] ?? null)
          } else {
            setLatest(null)
          }
        } catch (e) {
          console.log("YourAgentCard load error:", e)
        }
      }
      load()
      return () => {
        cancelled = true
      }
    }, [])
  )

  if (!agent) return null

  const whatsapp = digits(agent.whatsapp) || digits(agent.phone)
  const open = (type: "whatsapp" | "call") => {
    const url = type === "whatsapp" ? (whatsapp ? `https://wa.me/${whatsapp}` : "") : agent.phone ? `tel:${agent.phone.replace(/\s/g, "")}` : ""
    if (!url) return
    void recordLead(agent.id, type)
    Linking.openURL(url).catch(() => undefined)
  }
  const date = latest
    ? new Date(latest.created_at).toLocaleDateString(i18n.language || "en", { day: "numeric", month: "short" })
    : ""

  return (
    <View style={[styles.card, { backgroundColor: theme.card, borderColor: GOLD }]}>
      <Text style={styles.label}>{t("yourAgentTitle")}</Text>
      <TouchableOpacity style={styles.row} onPress={() => router.push(`/agent/${agent.id}` as any)}>
        {agent.logo_url ? (
          <Image source={{ uri: agent.logo_url }} style={styles.logo} contentFit="cover" />
        ) : (
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{agent.business_name.charAt(0).toUpperCase() || "A"}</Text>
          </View>
        )}
        <View style={{ flex: 1 }}>
          <View style={styles.nameRow}>
            <Text style={[styles.name, { color: theme.text }]} numberOfLines={1}>{agent.business_name}</Text>
            {agent.verified ? <Ionicons name="checkmark-circle" size={16} color={BLUE} /> : null}
          </View>
          {agent.country ? <Text style={[styles.meta, { color: theme.textSecondary }]}>{agent.country}</Text> : null}
        </View>
        <Ionicons name="chevron-forward" size={18} color={GOLD} />
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.news, { backgroundColor: theme.background }]}
        onPress={() => router.push("/agent/announcements" as any)}
      >
        <View style={styles.newsHead}>
          <Ionicons name="megaphone-outline" size={14} color={GOLD} />
          <Text style={[styles.newsLabel, { color: theme.textSecondary }]}>{t("yourAgentLatest")}</Text>
          {date ? <Text style={[styles.newsDate, { color: theme.textSecondary }]}>{date}</Text> : null}
        </View>
        {latest ? (
          <>
            <Text style={[styles.newsTitle, { color: theme.text }]} numberOfLines={1}>{latest.title}</Text>
            <Text style={[styles.newsBody, { color: theme.textSecondary }]} numberOfLines={2}>{latest.body}</Text>
          </>
        ) : (
          <Text style={[styles.newsBody, { color: theme.textSecondary }]}>{t("yourAgentNoNews")}</Text>
        )}
      </TouchableOpacity>

      <View style={styles.actions}>
        {whatsapp ? (
          <TouchableOpacity style={[styles.btn, { backgroundColor: "#25D366" }]} onPress={() => open("whatsapp")}>
            <Ionicons name="logo-whatsapp" size={18} color="#fff" />
            <Text style={styles.btnTextLight}>{t("agentWhatsapp")}</Text>
          </TouchableOpacity>
        ) : null}
        {agent.phone ? (
          <TouchableOpacity style={[styles.btn, { borderWidth: 1, borderColor: theme.border }]} onPress={() => open("call")}>
            <Ionicons name="call-outline" size={18} color={GOLD} />
            <Text style={[styles.btnText, { color: theme.text }]}>{t("agentCall")}</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  card: { marginHorizontal: 16, marginTop: 14, borderRadius: 18, borderWidth: 1.2, padding: 14 },
  label: { color: GOLD, fontSize: 12, fontWeight: "800", letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 10 },
  row: { flexDirection: "row", alignItems: "center", gap: 12 },
  logo: { width: 46, height: 46, borderRadius: 12, backgroundColor: "#F1F4F8" },
  avatar: { width: 46, height: 46, borderRadius: 12, backgroundColor: NAVY, alignItems: "center", justifyContent: "center" },
  avatarText: { color: GOLD, fontSize: 18, fontWeight: "bold" },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  name: { fontSize: 15, fontWeight: "bold", flexShrink: 1 },
  meta: { fontSize: 12, marginTop: 2 },
  news: { borderRadius: 12, padding: 12, marginTop: 12 },
  newsHead: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 4 },
  newsLabel: { fontSize: 11, fontWeight: "700", flex: 1 },
  newsDate: { fontSize: 11 },
  newsTitle: { fontSize: 14, fontWeight: "bold", marginBottom: 2 },
  newsBody: { fontSize: 13, lineHeight: 18 },
  actions: { flexDirection: "row", gap: 10, marginTop: 12 },
  btn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, borderRadius: 22, paddingVertical: 10 },
  btnTextLight: { color: "#fff", fontWeight: "bold", fontSize: 14 },
  btnText: { fontWeight: "600", fontSize: 14 },
})
