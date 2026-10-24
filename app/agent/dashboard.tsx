// Agent Dashboard (in the app).
// Shows real numbers only: pilgrims joined, contacts this month, listing status.
// No prices or payment links here (App Store / Play rules) — plans are handled on the website and by email.
import QRCode from "react-native-qrcode-svg"
import {
  agentJoinUrl,
  getMyAgentProfile,
  getMyPilgrims,
  postAnnouncement,
  type AgentPilgrim,
  type AgentProfile,
} from "@/lib/agents"
import { AnimatedHeroIcon } from "@/components/AnimatedHeroIcon"
import * as Clipboard from "expo-clipboard"
import { useTheme } from "@/context/themeContext"
import { Ionicons } from "@expo/vector-icons"
import { useFocusEffect, useRouter } from "expo-router"
import { StatusBar } from "expo-status-bar"
import { useCallback, useState } from "react"
import { useTranslation } from "react-i18next"
import { ActivityIndicator, Linking, ScrollView, Share, StyleSheet, Text, TextInput, View } from "react-native"
import TouchableOpacity from "@/app/components/AppPressable"
import { tabScrollBottom } from "@/lib/ui"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { supabase } from "../../lib/supabase"

const NAVY = "#1E3A5F"
const GOLD = "#C9A84C"
const GREEN = "#2F855A"
const SITE_ADDRESS = "myumrahconnect.com/agents"

type Mode = "active" | "pending" | "inactive" | "suspended"

// ─── Which state is the agency in? ───────────────────────────────────────────
function modeFor(agent: AgentProfile): Mode {
  const status = String(agent.status || "pending").toLowerCase()
  if (status === "pending") return "pending"
  if (status === "suspended") return "suspended"
  const today = new Date().toISOString().slice(0, 10)
  if (status === "active" && agent.paid_until && agent.paid_until.slice(0, 10) >= today) return "active"
  return "inactive"
}

function formatDate(value: string, lang: string) {
  return new Date(value).toLocaleDateString(lang, { day: "numeric", month: "short", year: "numeric" })
}

export default function AgentDashboard() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { theme } = useTheme()
  const { t, i18n } = useTranslation()

  const [agent, setAgent] = useState<AgentProfile | null>(null)
  const [pilgrims, setPilgrims] = useState<AgentPilgrim[]>([])
  const [contacts, setContacts] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState("")

  // Announcement box
  const [title, setTitle] = useState("")
  const [body, setBody] = useState("")
  const [posting, setPosting] = useState(false)
  const [postMsg, setPostMsg] = useState("")

  // ─── Load everything each time the screen opens ────────────────────────────
  useFocusEffect(
    useCallback(() => {
      let cancelled = false
      const load = async () => {
        try {
          const profile = await getMyAgentProfile()
          if (cancelled) return
          setAgent(profile)
          if (!profile) return

          const start = new Date()
          start.setDate(1)
          start.setHours(0, 0, 0, 0)
          const [list, leads] = await Promise.all([
            getMyPilgrims().catch(() => []),
            supabase
              .from("agent_leads")
              .select("id", { count: "exact", head: true })
              .eq("agent_id", profile.id)
              .gte("created_at", start.toISOString()),
          ])
          if (cancelled) return
          setPilgrims(list)
          setContacts(leads.count ?? 0)
        } catch (e) {
          console.log("Dashboard load error:", e)
        } finally {
          if (!cancelled) setLoading(false)
        }
      }
      load()
      return () => {
        cancelled = true
      }
    }, []),
  )

  const copy = async (text: string, key: string) => {
    await Clipboard.setStringAsync(text)
    setCopied(key)
    setTimeout(() => setCopied(""), 2500)
  }

  const sendAnnouncement = async () => {
    setPostMsg("")
    if (!title.trim() || !body.trim()) {
      setPostMsg(t("dashAnnNeedBoth"))
      return
    }
    setPosting(true)
    try {
      await postAnnouncement(title, body)
      setTitle("")
      setBody("")
      setPostMsg(t("dashAnnPosted"))
    } catch (e) {
      console.log("Announcement error:", e)
      setPostMsg(t("somethingWentWrong"))
    } finally {
      setPosting(false)
    }
  }

  // ─── Header (same on every state) ──────────────────────────────────────────
  const header = (
    <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
      <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
        <Ionicons name="chevron-back" size={22} color="#fff" />
      </TouchableOpacity>
      <View style={{ flex: 1 }}>
        <Text style={styles.headerTitle}>{t("agentDashboard")}</Text>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
          <Text style={styles.headerSub}>{agent?.business_name || t("myAgency")}</Text>
          {agent?.verified ? <Ionicons name="checkmark-circle" size={14} color="#1D9BF0" /> : null}
        </View>
      </View>
      <View style={styles.badge}>
        <Text style={styles.badgeText}>{t("agentBadge")}</Text>
      </View>
    </View>
  )

  if (loading) {
    return (
      <View style={[styles.screen, { backgroundColor: theme.background }]}>
        <StatusBar style="light" />
        {header}
        <ActivityIndicator color={GOLD} style={{ marginTop: 40 }} />
      </View>
    )
  }

  // ─── No agency yet: send them to the website to finish setup ───────────────
  if (!agent) {
    return (
      <View style={[styles.screen, { backgroundColor: theme.background }]}>
        <StatusBar style="light" />
        {header}
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border, marginTop: 16 }]}>
          <Text style={[styles.cardTitle, { color: theme.text }]}>{t("agentReceivedTitle")}</Text>
          <Text style={[styles.body, { color: theme.textSecondary }]}>{t("agentReceivedBody")}</Text>
          <AddressChip copied={copied === "site"} onPress={() => copy(SITE_ADDRESS, "site")} t={t} />
          <Text style={[styles.small, { color: theme.textSecondary }]}>{t("agentSameEmail")}</Text>
        </View>
      </View>
    )
  }

  const mode = modeFor(agent)
  const code = agent.agent_code

  return (
    <View style={[styles.screen, { backgroundColor: theme.background }]}>
      <StatusBar style="light" />
      {header}

      <ScrollView keyboardDismissMode="on-drag" keyboardShouldPersistTaps="handled" automaticallyAdjustKeyboardInsets showsVerticalScrollIndicator={false}>
        {/* ─── Status card ─────────────────────────────────────────────── */}
        <View
          style={[
            styles.card,
            styles.statusCard,
            { backgroundColor: theme.card, borderColor: mode === "active" ? GREEN : GOLD },
          ]}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <Ionicons
              name={mode === "active" ? "checkmark-circle" : mode === "pending" ? "time-outline" : "alert-circle-outline"}
              size={20}
              color={mode === "active" ? GREEN : GOLD}
            />
            <Text style={[styles.cardTitle, { color: theme.text, marginBottom: 0 }]}>
              {mode === "active"
                ? t("dashActiveTitle")
                : mode === "pending"
                  ? t("dashPendingTitle")
                  : mode === "suspended"
                    ? t("dashSuspendedTitle")
                    : t("dashInactiveTitle")}
            </Text>
          </View>
          <Text style={[styles.body, { color: theme.textSecondary }]}>
            {mode === "active"
              ? t("dashActiveBody", { date: formatDate(agent.paid_until as string, i18n.language) })
              : mode === "pending"
                ? t("dashPendingBody")
                : mode === "suspended"
                  ? t("dashSuspendedBody")
                  : t("dashInactiveBody")}
          </Text>
          {mode !== "active" ? (
            <AddressChip copied={copied === "site"} onPress={() => copy(SITE_ADDRESS, "site")} t={t} />
          ) : null}
        </View>

        {/* ─── Real numbers ────────────────────────────────────────────── */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statNum}>{pilgrims.length}</Text>
            <Text style={styles.statLabel}>{t("dashPilgrims")}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNum}>{contacts ?? "…"}</Text>
            <Text style={styles.statLabel}>{t("dashContacts")}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statNum, { fontSize: 15 }]}>
              {agent.plan === "featured" ? t("dashFeatured") : t("dashListed")}
            </Text>
            <Text style={styles.statLabel}>{t("dashPlan")}</Text>
          </View>
        </View>

        {/* ─── QR + agent code ─────────────────────────────────────────── */}
        {code ? (
          <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border, alignItems: "center" }]}>
            <Text style={[styles.cardTitle, { color: theme.text, alignSelf: "flex-start" }]}>{t("agentYourQr")}</Text>
            <View style={styles.qrBox}>
              <QRCode value={agentJoinUrl(code)} size={180} color={NAVY} backgroundColor="#FFFFFF" ecl="M" />
            </View>
            <Text style={[styles.body, { color: theme.textSecondary, textAlign: "center", marginTop: 10 }]}>
              {mode === "active" ? t("agentYourQrBody") : t("dashQrNotLive")}
            </Text>
            <Text style={[styles.codeText, { color: theme.text }]}>{code}</Text>
            <View style={styles.row}>
              <TouchableOpacity style={styles.goldBtn} onPress={() => copy(code, "code")}>
                <Ionicons name={copied === "code" ? "checkmark" : "copy-outline"} size={16} color={NAVY} />
                <Text style={styles.goldBtnText}>{copied === "code" ? t("agentCopied") : t("copyCode")}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.goldBtn}
                onPress={() =>
                  Share.share({
                    message: `${t("shareAgentCodeMessage", { code, agency: agent.business_name || t("myAgency") })}\n\n${agentJoinUrl(code)}`,
                  })
                }
              >
                <Ionicons name="share-outline" size={16} color={NAVY} />
                <Text style={styles.goldBtnText}>{t("shareMyAgency")}</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : null}

        {/* ─── Preview my public profile (only when listed) ────────────── */}
        {mode === "active" ? (
          <TouchableOpacity
            style={[styles.card, styles.actionRow, { backgroundColor: theme.card, borderColor: theme.border }]}
            onPress={() => router.push(`/agent/${agent.id}` as any)}
          >
            <View style={styles.actionIcon}>
              <Ionicons name="eye-outline" size={18} color={GOLD} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.actionTitle, { color: theme.text }]}>{t("dashPreview")}</Text>
              <Text style={[styles.small, { color: theme.textSecondary, marginTop: 1 }]}>{t("dashPreviewSub")}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={GOLD} />
          </TouchableOpacity>
        ) : null}

        {/* ─── Announcement to my pilgrims (only when listed) ──────────── */}
        {mode === "active" ? (
          <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Text style={[styles.cardTitle, { color: theme.text }]}>{t("dashAnnTitle")}</Text>
            <TextInput
              style={[styles.input, { borderColor: theme.border, color: theme.text }]}
              placeholder={t("dashAnnTitlePh")}
              placeholderTextColor={theme.textSecondary}
              value={title}
              onChangeText={setTitle}
              maxLength={80}
            />
            <TextInput
              style={[styles.input, styles.textarea, { borderColor: theme.border, color: theme.text }]}
              placeholder={t("dashAnnBodyPh")}
              placeholderTextColor={theme.textSecondary}
              value={body}
              onChangeText={setBody}
              multiline
              textAlignVertical="top"
              maxLength={600}
            />
            {postMsg ? <Text style={[styles.small, { color: theme.textSecondary, marginBottom: 8 }]}>{postMsg}</Text> : null}
            <TouchableOpacity style={[styles.navyBtn, posting && { opacity: 0.6 }]} onPress={sendAnnouncement} disabled={posting}>
              <Text style={styles.navyBtnText}>{posting ? t("saving") : t("dashAnnSend")}</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {/* ─── My pilgrims ─────────────────────────────────────────────── */}
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.cardTitle, { color: theme.text }]}>
            {t("dashMyPilgrims", { count: pilgrims.length })}
          </Text>
          {pilgrims.length === 0 ? (
            <View style={{ alignItems: "center", paddingVertical: 20 }}>
              <AnimatedHeroIcon name="kaaba" size={36} accent="gold" style={{ marginBottom: 8 }} />
              <Text style={[styles.body, { color: theme.textSecondary, textAlign: "center" }]}>{t("dashNoPilgrims")}</Text>
            </View>
          ) : (
            pilgrims.map((p, i) => (
              <View
                key={p.user_id}
                style={[styles.pilgrimRow, { borderBottomColor: theme.border, borderBottomWidth: i < pilgrims.length - 1 ? 0.5 : 0 }]}
              >
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{(p.name || "?").trim().charAt(0).toUpperCase()}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.actionTitle, { color: theme.text }]}>{p.name || t("pilgrim")}</Text>
                  <Text style={[styles.small, { color: theme.textSecondary }]}>
                    {[p.nationality, t("dashJoined", { date: formatDate(p.joined_at, i18n.language) })].filter(Boolean).join(" · ")}
                  </Text>
                </View>
                <View style={styles.row}>
                  {p.phone ? (
                    <TouchableOpacity
                      style={styles.roundBtn}
                      onPress={() => Linking.openURL(`https://wa.me/${(p.phone as string).replace(/\D/g, "")}`)}
                    >
                      <Ionicons name="logo-whatsapp" size={18} color="#25D366" />
                    </TouchableOpacity>
                  ) : null}
                  {p.phone ? (
                    <TouchableOpacity style={styles.roundBtn} onPress={() => Linking.openURL(`tel:${p.phone}`)}>
                      <Ionicons name="call-outline" size={18} color={GOLD} />
                    </TouchableOpacity>
                  ) : null}
                  {p.email ? (
                    <TouchableOpacity style={styles.roundBtn} onPress={() => Linking.openURL(`mailto:${p.email}`)}>
                      <Ionicons name="mail-outline" size={18} color={GOLD} />
                    </TouchableOpacity>
                  ) : null}
                </View>
              </View>
            ))
          )}
        </View>

        <View style={{ height: tabScrollBottom(insets.bottom) }} />
      </ScrollView>
    </View>
  )
}

// ─── "myumrahconnect.com/agents  [Copy]" chip (copy only, not a link) ───────
function AddressChip({ copied, onPress, t }: { copied: boolean; onPress: () => void; t: (key: string) => string }) {
  return (
    <TouchableOpacity style={styles.address} onPress={onPress}>
      <Text style={styles.addressText}>{SITE_ADDRESS}</Text>
      <View style={styles.copyChip}>
        <Ionicons name={copied ? "checkmark" : "copy-outline"} size={14} color={NAVY} />
        <Text style={styles.copyChipText}>{copied ? t("agentCopied") : t("agentCopyAddress")}</Text>
      </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: { backgroundColor: NAVY, padding: 20, paddingBottom: 16, flexDirection: "row", alignItems: "center", gap: 12 },
  backBtn: { backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 20, padding: 6 },
  headerTitle: { color: "#fff", fontSize: 18, fontWeight: "bold" },
  headerSub: { color: GOLD, fontSize: 12, marginTop: 1 },
  badge: { backgroundColor: GOLD, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  badgeText: { fontSize: 11, fontWeight: "bold", color: NAVY },
  card: { marginHorizontal: 16, marginBottom: 12, borderRadius: 16, padding: 16, borderWidth: 0.5 },
  statusCard: { marginTop: 16, borderWidth: 1.5 },
  cardTitle: { fontSize: 15, fontWeight: "bold", marginBottom: 12 },
  body: { fontSize: 13, lineHeight: 19 },
  small: { fontSize: 11, lineHeight: 16 },
  statsRow: { flexDirection: "row", gap: 10, paddingHorizontal: 16, marginBottom: 12 },
  statCard: { flex: 1, borderRadius: 12, padding: 14, alignItems: "center", justifyContent: "center", backgroundColor: NAVY },
  statNum: { fontSize: 22, fontWeight: "bold", color: GOLD, textAlign: "center" },
  statLabel: { fontSize: 11, color: "rgba(255,255,255,0.7)", marginTop: 2, textAlign: "center" },
  qrBox: { padding: 12, backgroundColor: "#fff", borderRadius: 16, borderWidth: 1, borderColor: "rgba(201,168,76,0.4)" },
  codeText: { fontSize: 22, fontWeight: "bold", letterSpacing: 3, marginTop: 12 },
  row: { flexDirection: "row", gap: 8, marginTop: 12, flexWrap: "wrap", justifyContent: "center" },
  goldBtn: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: GOLD, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 9 },
  goldBtnText: { fontSize: 13, fontWeight: "bold", color: NAVY },
  navyBtn: { backgroundColor: NAVY, borderRadius: 22, paddingVertical: 12, alignItems: "center" },
  navyBtnText: { color: "#fff", fontWeight: "bold", fontSize: 14 },
  actionRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  actionIcon: { width: 38, height: 38, borderRadius: 10, alignItems: "center", justifyContent: "center", backgroundColor: NAVY },
  actionTitle: { fontSize: 14, fontWeight: "600" },
  input: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, marginBottom: 10 },
  textarea: { minHeight: 90 },
  pilgrimRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 12 },
  avatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: NAVY, alignItems: "center", justifyContent: "center" },
  avatarText: { color: GOLD, fontWeight: "bold", fontSize: 14 },
  roundBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: "rgba(201,168,76,0.1)", alignItems: "center", justifyContent: "center" },
  address: { flexDirection: "row", alignItems: "center", alignSelf: "flex-start", gap: 10, marginTop: 12, backgroundColor: NAVY, borderRadius: 14, paddingVertical: 9, paddingHorizontal: 12 },
  addressText: { color: "#fff", fontSize: 14, fontWeight: "bold" },
  copyChip: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: GOLD, borderRadius: 999, paddingVertical: 4, paddingHorizontal: 10 },
  copyChipText: { color: NAVY, fontSize: 12, fontWeight: "bold" },
})
