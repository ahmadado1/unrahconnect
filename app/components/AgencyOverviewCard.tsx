// Agency card for Home and the "My Agency" tab:
//   "Earth Travel ✓ · 12 pilgrims · 3 new contacts this week"
//   [Share my QR] [Post update] [Dashboard]
// Only for agency accounts whose listing is live. Agencies still applying see AgentApplyBanner instead.
import { Ionicons } from "@expo/vector-icons"
import { useFocusEffect, useRouter } from "expo-router"
import { useCallback, useState } from "react"
import { useTranslation } from "react-i18next"
import i18n from "@/i18n"
import { Share, StyleSheet, Text, View } from "react-native"
import TouchableOpacity from "@/app/components/AppPressable"
import { agentJoinUrl, getMyAgentProfile, type AgentProfile } from "@/lib/agents"
import { getUserFast, supabase } from "@/lib/supabase"

const NAVY = "#1E3A5F"
const GOLD = "#C9A84C"

type Numbers = { pilgrims: number; contacts: number }

function isLive(agent: AgentProfile) {
  const status = String(agent.status || "").toLowerCase()
  if (status !== "active") return false
  if (!agent.paid_until) return true // free founding agency
  return agent.paid_until.slice(0, 10) >= new Date().toISOString().slice(0, 10)
}

/** Opens the share sheet (WhatsApp, SMS…) with the agency's join link. */
export async function shareAgencyQr(agent: Pick<AgentProfile, "agent_code" | "business_name">) {
  if (!agent.agent_code) return
  const url = agentJoinUrl(agent.agent_code)
  const message = i18n.t("agencyShareMsg", { name: agent.business_name || "", url, code: agent.agent_code })
  await Share.share({ message }).catch(() => {})
}

export default function AgencyOverviewCard({ style }: { style?: object }) {
  const router = useRouter()
  const { t } = useTranslation()
  const [agent, setAgent] = useState<AgentProfile | null>(null)
  const [numbers, setNumbers] = useState<Numbers | null>(null)

  // Refresh each time the screen comes back into view
  useFocusEffect(
    useCallback(() => {
      let cancelled = false
      ;(async () => {
        try {
          const { data: { user } } = await getUserFast()
          if (!user || user.user_metadata?.user_type !== "agent") return
          const profile = await getMyAgentProfile()
          if (cancelled) return
          setAgent(profile)
          if (!profile) return
          const weekAgo = new Date(Date.now() - 7 * 86_400_000).toISOString()
          const [pilgrims, contacts] = await Promise.all([
            supabase.from("agent_pilgrims").select("id", { count: "exact", head: true }).eq("agent_id", profile.id),
            supabase.from("agent_leads").select("id", { count: "exact", head: true }).eq("agent_id", profile.id).gte("created_at", weekAgo),
          ])
          if (!cancelled) setNumbers({ pilgrims: pilgrims.count ?? 0, contacts: contacts.count ?? 0 })
        } catch (e) {
          console.log("Agency card load error:", e)
        }
      })()
      return () => {
        cancelled = true
      }
    }, []),
  )

  if (!agent || !isLive(agent)) return null

  return (
    <View style={[styles.card, style]}>
      {/* Name + live numbers */}
      <TouchableOpacity onPress={() => router.push("/agent/dashboard" as any)} activeOpacity={0.85}>
        <View style={styles.nameRow}>
          <Ionicons name="briefcase" size={16} color={GOLD} />
          <Text style={styles.name} numberOfLines={1}>{agent.business_name || t("myAgency")}</Text>
          {agent.verified ? <Ionicons name="checkmark-circle" size={16} color="#1D9BF0" /> : null}
          <Ionicons name="chevron-forward" size={18} color={GOLD} style={{ marginLeft: "auto" }} />
        </View>
        <View style={styles.stats}>
          <View style={styles.stat}>
            <Text style={styles.statNum}>{numbers ? numbers.pilgrims : "…"}</Text>
            <Text style={styles.statLabel}>{t("agencyPilgrims")}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.stat}>
            <Text style={styles.statNum}>{numbers ? numbers.contacts : "…"}</Text>
            <Text style={styles.statLabel}>{t("agencyContactsWeek")}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.stat}>
            <Text style={[styles.statNum, { fontSize: 16, letterSpacing: 1 }]} numberOfLines={1}>{agent.agent_code || "—"}</Text>
            <Text style={styles.statLabel}>{t("agentCodeLabel")}</Text>
          </View>
        </View>
      </TouchableOpacity>

      {/* One-tap actions */}
      <View style={styles.actions}>
        <TouchableOpacity style={[styles.btn, styles.btnGold]} onPress={() => shareAgencyQr(agent)}>
          <Ionicons name="qr-code-outline" size={16} color={NAVY} />
          <Text style={styles.btnGoldText}>{t("agencyShareQr")}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.btn, styles.btnLine]} onPress={() => router.push("/agent/dashboard?focus=announce" as any)}>
          <Ionicons name="megaphone-outline" size={16} color="#fff" />
          <Text style={styles.btnLineText}>{t("agencyPostUpdate")}</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  card: { backgroundColor: NAVY, borderRadius: 18, padding: 16, borderWidth: 1, borderColor: "rgba(201,168,76,0.5)" },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  name: { color: "#fff", fontSize: 17, fontWeight: "bold", flexShrink: 1 },
  stats: { flexDirection: "row", alignItems: "center", marginTop: 14 },
  stat: { flex: 1, alignItems: "center" },
  statNum: { color: GOLD, fontSize: 22, fontWeight: "bold" },
  statLabel: { color: "#D7DEEA", fontSize: 11, marginTop: 2, textAlign: "center" },
  divider: { width: 1, height: 30, backgroundColor: "rgba(255,255,255,0.15)" },
  actions: { flexDirection: "row", gap: 10, marginTop: 16 },
  btn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, borderRadius: 999, paddingVertical: 11 },
  btnGold: { backgroundColor: GOLD },
  btnGoldText: { color: NAVY, fontWeight: "bold", fontSize: 14 },
  btnLine: { borderWidth: 1, borderColor: "rgba(255,255,255,0.4)" },
  btnLineText: { color: "#fff", fontWeight: "bold", fontSize: 14 },
})
