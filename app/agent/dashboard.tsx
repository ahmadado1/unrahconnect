import { AnimatedHeroIcon } from "@/components/AnimatedHeroIcon"
import { AppIcon } from "@/components/AppIcon"
import * as Clipboard from "expo-clipboard"
import { useTheme } from "@/context/themeContext"
import { Ionicons } from "@expo/vector-icons"
import { useRouter } from "expo-router"
import { StatusBar } from "expo-status-bar"
import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { Linking, ScrollView, Share, StyleSheet, Text, TouchableOpacity, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { supabase } from "../../lib/supabase"


export default function AgentDashboard() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { theme } = useTheme()
  const { t } = useTranslation()
  const [agent, setAgent] = useState<any>(null)
  const [agentData, setAgentData] = useState<any>(null)
  const [pilgrims, setPilgrims] = useState<any[]>([])

  useEffect(() => {
    const loadAgent = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setAgent(user.user_metadata)
    
      const { data: agentData, error } = await supabase
        .from("agents")
        .select("*")
        .eq("user_id", user.id)
        .single()
      
      console.log("Agent data:", agentData, "Error:", error)
      if (agentData) setAgentData(agentData)
    }
    loadAgent()

    const loadPilgrims = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
    
      const { data: agentRow } = await supabase
        .from("agents")
        .select("id")
        .eq("user_id", user.id)
        .single()
    
      if (!agentRow) return
    
      const { data: linkedPilgrims } = await supabase
        .from("agent_pilgrims_view")
        .select("*")
        .eq("agent_id", agentRow.id)
        .order("created_at", { ascending: false })
    
      if (linkedPilgrims) setPilgrims(linkedPilgrims)
    }
    loadPilgrims()
  }, [])

  const shareProfile = () => {
    const code = agentData?.referral_code || "AGT-XXXXXX"
    Share.share({
      message: t("shareAgentCodeMessage", {
        code,
        agency: agent?.agency_name || t("myAgency"),
      }),
    })
  }

  const copyAgentCode = async () => {
    const code = agentData?.referral_code
    if (!code) return
    await Clipboard.setStringAsync(code)
  }

  return (
    <View style={[styles.screen, { backgroundColor: theme.background }]}>
      <StatusBar style="light" />

      <View style={[styles.header, { paddingTop: insets.top }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color="#fff" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>{t("agentDashboard")}</Text>
          <Text style={styles.headerSub}>{agent?.agency_name || t("myAgency")}</Text>
        </View>
        <View style={styles.verifiedBadge}>
          <Text style={styles.verifiedText}>{t("agentBadge")}</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>

        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: "#1E3A5F" }]}>
            <Text style={styles.statNum}>0</Text>
            <Text style={styles.statLabel}>{t("bookings")}</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: "#1E3A5F" }]}>
            <Text style={styles.statNum}>{pilgrims.length}</Text>
            <Text style={styles.statLabel}>{t("clients")}</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: "#1E3A5F" }]}>
            <Text style={styles.statNum}>$0</Text>
            <Text style={styles.statLabel}>{t("revenue")}</Text>
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.cardTitle, { color: theme.text }]}>{t("agencyInformation")}</Text>
          <View style={styles.infoRow}>
            <Ionicons name="briefcase-outline" size={16} color="#C9A84C" />
            <Text style={[styles.infoText, { color: theme.text }]}>{agent?.agency_name || t("notSet")}</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="location-outline" size={16} color="#C9A84C" />
            <Text style={[styles.infoText, { color: theme.text }]}>{agent?.agency_country || t("notSet")}</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="call-outline" size={16} color="#C9A84C" />
            <Text style={[styles.infoText, { color: theme.text }]}>{agent?.phone || t("notSet")}</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="flag-outline" size={16} color="#C9A84C" />
            <Text style={[styles.infoText, { color: theme.text }]}>{agent?.nationality || t("notSet")}</Text>
          </View>
        </View>

        {agentData?.referral_code && (
            <View style={[styles.card, { backgroundColor: "#1E3A5F", borderColor: "rgba(201,168,76,0.3)" }]}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <AppIcon name="key" size={16} color="#C9A84C" />
                <Text style={{ color: "#C9A84C", fontWeight: "bold", fontSize: 13 }}>
                  {t("yourAgentCode")}
                </Text>
              </View>
              <Text style={styles.codeText}>{agentData.referral_code}</Text>
              <View style={styles.codeActions}>
                <TouchableOpacity style={styles.copyBtn} onPress={copyAgentCode}>
                  <Ionicons name="copy-outline" size={18} color="#1E3A5F" />
                  <Text style={styles.copyBtnText}>{t("copyCode")}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.copyBtn}
                  onPress={() => {
                    Share.share({
                      message: t("shareAgentCodeMessage", {
                        code: agentData.referral_code,
                        agency: agent?.agency_name || t("myAgency"),
                      }),
                    })
                  }}
                >
                  <Ionicons name="share-outline" size={18} color="#1E3A5F" />
                  <Text style={styles.copyBtnText}>{t("shareMyAgency")}</Text>
                </TouchableOpacity>
              </View>
              <Text style={{ color: "rgba(255,255,255,0.5)", fontSize: 11, marginTop: 10 }}>
                {t("shareAgentCodeHint")}
              </Text>
            </View>
          )}

        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.cardTitle, { color: theme.text }]}>{t("quickActions")}</Text>

          <TouchableOpacity style={styles.actionRow} onPress={shareProfile}>
            <View style={[styles.actionIcon, { backgroundColor: "#1E3A5F" }]}>
              <Ionicons name="share-social-outline" size={18} color="#C9A84C" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.actionTitle, { color: theme.text }]}>{t("shareMyAgency")}</Text>
              <Text style={[styles.actionSub, { color: theme.textSecondary }]}>{t("shareAgencySub")}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#C9A84C" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionRow}
            onPress={() => router.push("/auth/plans" as any)}
          >
            <View style={[styles.actionIcon, { backgroundColor: "#C9A84C" }]}>
              <Ionicons name="star-outline" size={18} color="#1E3A5F" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.actionTitle, { color: theme.text }]}>{t("upgradePlan")}</Text>
              <Text style={[styles.actionSub, { color: theme.textSecondary }]}>{t("upgradeplanSub")}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#C9A84C" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionRow} onPress={() => router.push("/hotels" as any)}>
            <View style={[styles.actionIcon, { backgroundColor: "#1E3A5F" }]}>
              <Ionicons name="bed-outline" size={18} color="#C9A84C" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.actionTitle, { color: theme.text }]}>{t("browseHotels")}</Text>
              <Text style={[styles.actionSub, { color: theme.textSecondary }]}>{t("browseHotelsSub")}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#C9A84C" />
          </TouchableOpacity>
        </View>

        <View style={[styles.subCard, { borderColor: "#C9A84C" }]}>
          <View style={styles.subRow}>
            <View>
              <Text style={styles.subPlan}>{t("freeTrial")}</Text>
              <Text style={styles.subExpiry}>{t("daysRemaining")}</Text>
            </View>
            <TouchableOpacity
              style={styles.upgradeBtn}
              onPress={() => router.push("/auth/plans" as any)}
            >
              <Text style={styles.upgradeBtnText}>{t("upgrade")}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Pilgrims List */}
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Text style={[styles.cardTitle, { color: theme.text }]}>
              My Pilgrims ({pilgrims.length})
            </Text>

            {pilgrims.length === 0 ? (
              <View style={{ alignItems: "center", paddingVertical: 20 }}>
                <AnimatedHeroIcon name="kaaba" size={36} accent="gold" style={{ marginBottom: 8 }} />
                <Text style={{ color: theme.textSecondary, fontSize: 13, textAlign: "center" }}>
                  No pilgrims yet. Share your agent code to get started.
                </Text>
              </View>
            ) : (
              pilgrims.map((p, i) => (
                <View
                  key={p.pilgrim_id}
                  style={[styles.pilgrimRow, { borderBottomColor: theme.border, borderBottomWidth: i < pilgrims.length - 1 ? 0.5 : 0 }]}
                >
                  <View style={styles.pilgrimAvatar}>
                    <Text style={styles.pilgrimAvatarText}>{i + 1}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.pilgrimId, { color: theme.text }]}>
                      {p.pilgrim_name || "Pilgrim"}
                    </Text>
                    <Text style={[styles.pilgrimDate, { color: theme.textSecondary }]}>
                      {p.pilgrim_nationality} · Joined {new Date(p.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </Text>
                  </View>
                  <View style={styles.pilgrimActions}>
                    {p.pilgrim_phone && (
                      <TouchableOpacity
                        style={styles.pilgrimActionBtn}
                        onPress={() => {
                          const phone = p.pilgrim_phone.replace(/\D/g, "")
                          Linking.openURL(`https://wa.me/${phone}`)
                        }}
                      >
                        <Ionicons name="logo-whatsapp" size={18} color="#25D366" />
                      </TouchableOpacity>
                    )}
                    {p.pilgrim_phone && (
                      <TouchableOpacity
                        style={styles.pilgrimActionBtn}
                        onPress={() => Linking.openURL(`tel:${p.pilgrim_phone}`)}
                      >
                        <Ionicons name="call-outline" size={18} color="#C9A84C" />
                      </TouchableOpacity>
                    )}
                    {p.pilgrim_email && (
                      <TouchableOpacity
                        style={styles.pilgrimActionBtn}
                        onPress={() => Linking.openURL(`mailto:${p.pilgrim_email}`)}
                      >
                        <Ionicons name="mail-outline" size={18} color="#C9A84C" />
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              ))
            )}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: { backgroundColor: "#1E3A5F", padding: 20, paddingBottom: 16, flexDirection: "row", alignItems: "center", gap: 12 },
  backBtn: { backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 20, padding: 6 },
  headerTitle: { color: "#fff", fontSize: 18, fontWeight: "bold" },
  headerSub: { color: "#C9A84C", fontSize: 12, marginTop: 1 },
  verifiedBadge: { backgroundColor: "#C9A84C", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  verifiedText: { fontSize: 11, fontWeight: "bold", color: "#1E3A5F" },
  statsRow: { flexDirection: "row", gap: 10, padding: 16 },
  statCard: { flex: 1, borderRadius: 12, padding: 14, alignItems: "center" },
  statNum: { fontSize: 22, fontWeight: "bold", color: "#C9A84C" },
  statLabel: { fontSize: 11, color: "rgba(255,255,255,0.6)", marginTop: 2 },
  card: { marginHorizontal: 16, marginBottom: 12, borderRadius: 16, padding: 16, borderWidth: 0.5 },
  cardTitle: { fontSize: 15, fontWeight: "bold", marginBottom: 14 },
  infoRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 8, borderBottomWidth: 0.5, borderBottomColor: "rgba(0,0,0,0.05)" },
  infoText: { fontSize: 14 },
  actionRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 12, borderBottomWidth: 0.5, borderBottomColor: "rgba(0,0,0,0.05)" },
  actionIcon: { width: 38, height: 38, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  actionTitle: { fontSize: 14, fontWeight: "600" },
  actionSub: { fontSize: 11, marginTop: 1 },
  subCard: { marginHorizontal: 16, marginBottom: 12, borderRadius: 16, padding: 16, borderWidth: 1, backgroundColor: "rgba(201,168,76,0.08)" },
  subRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  subPlan: { fontSize: 15, fontWeight: "bold", color: "#C9A84C" },
  subExpiry: { fontSize: 12, color: "#888", marginTop: 2 },
  upgradeBtn: { backgroundColor: "#C9A84C", borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8 },
  upgradeBtnText: { fontSize: 13, fontWeight: "bold", color: "#1E3A5F" },
  codeRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  codeActions: { flexDirection: "row", gap: 10, marginTop: 14 },
  codeText: { fontSize: 28, fontWeight: "bold", color: "#fff", letterSpacing: 3 },
  copyBtn: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "#C9A84C", borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8 },
  copyBtnText: { fontSize: 13, fontWeight: "bold", color: "#1E3A5F" },
  pilgrimRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 12 },
  pilgrimAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: "#1E3A5F", alignItems: "center", justifyContent: "center" },
  pilgrimAvatarText: { color: "#C9A84C", fontWeight: "bold", fontSize: 14 },
  pilgrimId: { fontSize: 13, fontWeight: "600" },
  pilgrimDate: { fontSize: 11, marginTop: 2 },
  pilgrimBadge: { backgroundColor: "rgba(201,168,76,0.15)", borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  pilgrimBadgeText: { fontSize: 10, color: "#C9A84C", fontWeight: "600" },
  pilgrimActions: { flexDirection: "row", gap: 8 },
  pilgrimActionBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: "rgba(201,168,76,0.1)", alignItems: "center", justifyContent: "center" },
})
