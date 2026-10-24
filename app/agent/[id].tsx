// Agency profile in the app. Contact taps are counted as leads for the agency's dashboard,
// and pilgrims can join the agency (same as entering its agent code or scanning its QR).
import { AppIcon } from "@/components/AppIcon"
import { useTheme } from "@/context/themeContext"
import {
  getActiveAgentById,
  getMyAgentId,
  isSignedIn,
  joinAgent,
  recordLead,
  type LeadType,
  type PublicAgent,
} from "@/lib/agents"
import { saveReferralCode } from "@/lib/referral"
import { tabScrollBottom } from "@/lib/ui"
import { Ionicons } from "@expo/vector-icons"
import { Image } from "expo-image"
import { useLocalSearchParams, useRouter } from "expo-router"
import { StatusBar } from "expo-status-bar"
import { useCallback, useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { ActivityIndicator, Linking, ScrollView, StyleSheet, Text, View } from "react-native"
import TouchableOpacity from "@/app/components/AppPressable"
import ScreenState from "@/app/components/ScreenState"
import { useSafeAreaInsets } from "react-native-safe-area-context"

const NAVY = "#1E3A5F"
const GOLD = "#C9A84C"
const BLUE = "#1D9BF0"

function digits(value: string | null | undefined) {
  return (value || "").replace(/\D/g, "")
}

export default function AgentProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { theme } = useTheme()
  const { t, i18n } = useTranslation()

  const [agent, setAgent] = useState<PublicAgent | null>(null)
  const [loading, setLoading] = useState(true)
  const [myAgentId, setMyAgentId] = useState<string | null>(null)
  const [joining, setJoining] = useState(false)
  const [joinMessage, setJoinMessage] = useState("")

  const load = useCallback(async () => {
    try {
      const [row, mine] = await Promise.all([getActiveAgentById(String(id)), getMyAgentId()])
      setAgent(row)
      setMyAgentId(mine)
    } catch (e) {
      console.log("Agent profile load error:", e)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    load()
  }, [load])

  const contact = (type: LeadType) => {
    if (!agent) return
    let url = ""
    if (type === "whatsapp") {
      const number = digits(agent.whatsapp) || digits(agent.phone)
      if (number) url = `https://wa.me/${number}`
    } else if (type === "call") {
      if (agent.phone) url = `tel:${agent.phone.replace(/\s/g, "")}`
    } else if (type === "email") {
      if (agent.email) url = `mailto:${agent.email}`
    } else if (agent.website) {
      url = /^https?:\/\//i.test(agent.website) ? agent.website : `https://${agent.website}`
    }
    if (!url) return
    void recordLead(agent.id, type)
    Linking.openURL(url).catch(() => undefined)
  }

  const join = async () => {
    if (!agent?.agent_code) return
    setJoinMessage("")
    if (!(await isSignedIn())) {
      await saveReferralCode(agent.agent_code)
      setJoinMessage(t("agentJoinLogin"))
      router.push("/auth/login" as any)
      return
    }
    setJoining(true)
    try {
      await joinAgent(agent.agent_code, true)
      setMyAgentId(agent.id)
    } catch (e) {
      const message = e instanceof Error ? e.message : ""
      setJoinMessage(/already linked/i.test(message) ? t("agentJoinedOther") : t("somethingWentWrong"))
    } finally {
      setJoining(false)
    }
  }

  if (loading) {
    return (
      <View style={[styles.screen, { backgroundColor: theme.background, alignItems: "center", justifyContent: "center" }]}>
        <ActivityIndicator color={GOLD} size="large" />
      </View>
    )
  }

  if (!agent) {
    return <ScreenState kind="missing" title={t("agentNotFound")} body={t("agentNotFoundBody")} />
  }

  const featured = agent.plan === "featured"
  const hasWhatsapp = Boolean(digits(agent.whatsapp) || digits(agent.phone))
  const isMine = myAgentId === agent.id
  const linkedElsewhere = Boolean(myAgentId && myAgentId !== agent.id)
  const since = agent.created_at
    ? new Date(agent.created_at).toLocaleDateString(i18n.language || "en", { month: "long", year: "numeric" })
    : ""

  return (
    <View style={[styles.screen, { backgroundColor: theme.background }]}>
      <StatusBar style="light" />

      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t("agentProfileTitle")}</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView keyboardDismissMode="on-drag" keyboardShouldPersistTaps="handled"
        style={{ backgroundColor: NAVY }}
        contentContainerStyle={{ backgroundColor: theme.background, flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          {agent.logo_url ? (
            <Image source={{ uri: agent.logo_url }} style={styles.logo} contentFit="cover" />
          ) : (
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{agent.business_name?.charAt(0)?.toUpperCase() || "A"}</Text>
            </View>
          )}
          <View style={styles.nameRow}>
            <Text style={styles.agencyName}>{agent.business_name}</Text>
            {agent.verified ? <Ionicons name="checkmark-circle" size={20} color={BLUE} /> : null}
          </View>
          {agent.owner_name ? <Text style={styles.ownerName}>{agent.owner_name}</Text> : null}

          <View style={styles.badgesRow}>
            {featured ? (
              <View style={styles.featuredBadge}>
                <AppIcon name="star" size={12} color={NAVY} />
                <Text style={styles.featuredText}>{t("featured")}</Text>
              </View>
            ) : null}
            {agent.verified ? (
              <View style={styles.verifiedBadge}>
                <Ionicons name="shield-checkmark" size={12} color={BLUE} />
                <Text style={styles.verifiedText}>{t("agentVerified")}</Text>
              </View>
            ) : null}
          </View>

          {agent.country ? (
            <View style={styles.heroMeta}>
              <Ionicons name="location-outline" size={14} color={GOLD} />
              <Text style={styles.heroMetaText}>{agent.country}</Text>
            </View>
          ) : null}
        </View>

        {/* Contact first: this is what pilgrims came for */}
        <View style={styles.contactSection}>
          <Text style={[styles.cardTitle, { color: theme.text, marginHorizontal: 16, marginBottom: 12 }]}>
            {t("agentContact")}
          </Text>
          {hasWhatsapp ? (
            <TouchableOpacity style={styles.whatsappBtn} onPress={() => contact("whatsapp")}>
              <Ionicons name="logo-whatsapp" size={22} color="#fff" />
              <Text style={styles.whatsappBtnText}>{t("agentWhatsapp")}</Text>
            </TouchableOpacity>
          ) : null}
          <View style={styles.contactRow}>
            {agent.phone ? (
              <TouchableOpacity style={[styles.contactBtn, { backgroundColor: theme.card, borderColor: theme.border }]} onPress={() => contact("call")}>
                <Ionicons name="call-outline" size={20} color={GOLD} />
                <Text style={[styles.contactBtnText, { color: theme.text }]}>{t("agentCall")}</Text>
              </TouchableOpacity>
            ) : null}
            {agent.email ? (
              <TouchableOpacity style={[styles.contactBtn, { backgroundColor: theme.card, borderColor: theme.border }]} onPress={() => contact("email")}>
                <Ionicons name="mail-outline" size={20} color={GOLD} />
                <Text style={[styles.contactBtnText, { color: theme.text }]}>{t("agentEmail")}</Text>
              </TouchableOpacity>
            ) : null}
          </View>
          {agent.website ? (
            <TouchableOpacity style={[styles.websiteBtn, { borderColor: theme.border }]} onPress={() => contact("website")}>
              <Ionicons name="globe-outline" size={18} color={GOLD} />
              <Text style={[styles.contactBtnText, { color: theme.text }]}>{t("agentWebsite")}</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Join this agency */}
        <View style={[styles.card, styles.joinCard, { borderColor: isMine ? "#2F855A" : GOLD, backgroundColor: theme.card }]}>
          {isMine ? (
            <Text style={[styles.joinedText]}>{t("agentJoined")}</Text>
          ) : (
            <>
              <Text style={[styles.cardTitle, { color: theme.text, marginBottom: 4 }]}>{t("agentJoinTitle")}</Text>
              <Text style={[styles.bioText, { color: theme.textSecondary, marginBottom: 12 }]}>{t("agentJoinBody")}</Text>
              {linkedElsewhere ? (
                <Text style={[styles.bioText, { color: theme.textSecondary }]}>{t("agentJoinedOther")}</Text>
              ) : (
                <TouchableOpacity style={[styles.joinBtn, joining && { opacity: 0.6 }]} onPress={join} disabled={joining}>
                  <Text style={styles.joinBtnText}>{t("agentJoinBtn", { name: agent.business_name })}</Text>
                </TouchableOpacity>
              )}
            </>
          )}
          {joinMessage ? <Text style={[styles.joinMsg, { color: theme.textSecondary }]}>{joinMessage}</Text> : null}
          <Text style={[styles.codeLine, { color: theme.textSecondary }]}>
            {t("agentCodeLabel")}: <Text style={styles.code}>{agent.agent_code}</Text>
          </Text>
        </View>

        {agent.description ? (
          <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Text style={[styles.cardTitle, { color: theme.text }]}>{t("agentAbout")}</Text>
            <Text style={[styles.bioText, { color: theme.textSecondary }]}>{agent.description}</Text>
          </View>
        ) : null}

        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          {agent.cities.length ? (
            <View style={styles.detailRow}>
              <Ionicons name="business-outline" size={16} color={GOLD} />
              <Text style={[styles.detailText, { color: theme.text }]}>
                {t("agentCitiesServed")}: {agent.cities.join(", ")}
              </Text>
            </View>
          ) : null}
          {agent.years_experience > 0 ? (
            <View style={styles.detailRow}>
              <Ionicons name="ribbon-outline" size={16} color={GOLD} />
              <Text style={[styles.detailText, { color: theme.text }]}>{t("agentYears", { count: agent.years_experience })}</Text>
            </View>
          ) : null}
          {agent.pilgrims_managed > 0 ? (
            <View style={styles.detailRow}>
              <Ionicons name="people-outline" size={16} color={GOLD} />
              <Text style={[styles.detailText, { color: theme.text }]}>{t("agentPilgrimsManaged", { count: agent.pilgrims_managed })}</Text>
            </View>
          ) : null}
          {since ? (
            <View style={styles.detailRow}>
              <Ionicons name="calendar-outline" size={16} color={GOLD} />
              <Text style={[styles.detailText, { color: theme.text }]}>{t("agentMemberSince", { date: since })}</Text>
            </View>
          ) : null}
        </View>

        <View style={{ height: tabScrollBottom(insets.bottom) }} />
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: { backgroundColor: NAVY, padding: 20, paddingBottom: 16, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  backBtn: { backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 20, padding: 6 },
  headerTitle: { color: "#fff", fontSize: 18, fontWeight: "bold" },
  hero: { backgroundColor: NAVY, alignItems: "center", paddingVertical: 24, paddingHorizontal: 20 },
  logo: { width: 84, height: 84, borderRadius: 18, backgroundColor: "#fff", marginBottom: 12 },
  avatar: { width: 84, height: 84, borderRadius: 18, backgroundColor: GOLD, alignItems: "center", justifyContent: "center", marginBottom: 12 },
  avatarText: { fontSize: 32, fontWeight: "bold", color: NAVY },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 4, paddingHorizontal: 12 },
  agencyName: { fontSize: 22, fontWeight: "bold", color: "#fff", textAlign: "center", flexShrink: 1 },
  ownerName: { fontSize: 14, color: "rgba(255,255,255,0.65)", marginBottom: 12 },
  badgesRow: { flexDirection: "row", gap: 8, marginBottom: 10 },
  featuredBadge: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: GOLD, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4 },
  featuredText: { fontSize: 11, fontWeight: "bold", color: NAVY },
  verifiedBadge: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "rgba(255,255,255,0.92)", borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4 },
  verifiedText: { fontSize: 11, fontWeight: "bold", color: BLUE },
  heroMeta: { flexDirection: "row", alignItems: "center", gap: 4 },
  heroMetaText: { color: "#fff", fontSize: 13 },
  contactSection: { marginTop: 16, marginBottom: 12 },
  whatsappBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: "#25D366", marginHorizontal: 16, borderRadius: 25, padding: 14, marginBottom: 10 },
  whatsappBtnText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  contactRow: { flexDirection: "row", gap: 10, marginHorizontal: 16 },
  contactBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: 25, padding: 14, borderWidth: 0.5 },
  contactBtnText: { fontSize: 15, fontWeight: "600" },
  websiteBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: 25, padding: 12, borderWidth: 0.5, marginHorizontal: 16, marginTop: 10 },
  card: { marginHorizontal: 16, marginBottom: 12, borderRadius: 16, padding: 16, borderWidth: 0.5 },
  joinCard: { borderWidth: 1.5 },
  joinBtn: { backgroundColor: NAVY, borderRadius: 25, padding: 14, alignItems: "center" },
  joinBtnText: { color: "#fff", fontSize: 15, fontWeight: "bold" },
  joinedText: { color: "#2F855A", fontSize: 15, fontWeight: "bold" },
  joinMsg: { fontSize: 13, marginTop: 8 },
  codeLine: { fontSize: 12, marginTop: 12 },
  code: { fontWeight: "bold", letterSpacing: 1 },
  cardTitle: { fontSize: 15, fontWeight: "bold", marginBottom: 12 },
  bioText: { fontSize: 13, lineHeight: 20 },
  detailRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 8 },
  detailText: { fontSize: 14, flexShrink: 1 },
})
