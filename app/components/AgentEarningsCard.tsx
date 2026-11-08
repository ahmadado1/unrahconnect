// "Your earnings" card on the agent dashboard.
// Agents earn 10% of the Premium paid by pilgrims they brought (first agent gets credit,
// first 12 months, 30-day refund wait). Numbers come from the database:
//   pilgrim_referrals          -> how many pilgrims this agent brought
//   agent_commission_summary   -> pending / ready / paid totals, per currency
import { Ionicons } from "@expo/vector-icons"
import { useCallback, useState } from "react"
import { useFocusEffect } from "expo-router"
import { useTranslation } from "react-i18next"
import { StyleSheet, Text, View } from "react-native"
import { useTheme } from "@/context/themeContext"
import { supabase } from "@/lib/supabase"

const NAVY = "#1E3A5F"
const GOLD = "#C9A84C"

type Summary = { currency: string; premium_pilgrims: number; pending: number; ready: number; paid: number }

/** "$12.50", "₦30,000" ... in the agent's language. */
function money(amount: number, currency: string, locale: string) {
  try {
    return new Intl.NumberFormat(locale, { style: "currency", currency, maximumFractionDigits: 2 }).format(amount)
  } catch {
    return `${currency} ${amount.toFixed(2)}`
  }
}

export default function AgentEarningsCard({ agentId }: { agentId: string }) {
  const { t, i18n } = useTranslation()
  const { theme } = useTheme()
  const [referred, setReferred] = useState<number | null>(null)
  const [rows, setRows] = useState<Summary[]>([])

  // Reload every time the dashboard opens.
  useFocusEffect(
    useCallback(() => {
      let cancelled = false
      ;(async () => {
        const [refs, sums] = await Promise.all([
          supabase.from("pilgrim_referrals").select("user_id", { count: "exact", head: true }).eq("agent_id", agentId),
          supabase.from("agent_commission_summary").select("currency, premium_pilgrims, pending, ready, paid").eq("agent_id", agentId),
        ])
        if (cancelled) return
        setReferred(refs.count ?? 0)
        setRows(((sums.data as Summary[] | null) ?? []).map(r => ({
          ...r,
          pending: Number(r.pending) || 0,
          ready: Number(r.ready) || 0,
          paid: Number(r.paid) || 0,
          premium_pilgrims: Number(r.premium_pilgrims) || 0,
        })))
      })().catch(e => console.log("Earnings load error:", e))
      return () => {
        cancelled = true
      }
    }, [agentId]),
  )

  const locale = i18n.language || "en"
  const premiumPilgrims = rows.reduce((n, r) => n + r.premium_pilgrims, 0)
  // Show USD row first (app stores), then any local currency (website payments).
  const sorted = [...rows].sort((a, b) => (a.currency === "USD" ? -1 : b.currency === "USD" ? 1 : 0))

  return (
    <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
      {/* Title + rule */}
      <View style={styles.titleRow}>
        <View style={styles.icon}>
          <Ionicons name="wallet-outline" size={18} color={GOLD} />
        </View>
        <Text style={[styles.title, { color: theme.text }]}>{t("earnTitle")}</Text>
      </View>
      <Text style={[styles.body, { color: theme.textSecondary }]}>{t("earnRule")}</Text>

      {/* Pilgrims brought / on Premium */}
      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Text style={styles.statNum}>{referred ?? "–"}</Text>
          <Text style={styles.statLabel}>{t("earnReferred")}</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statNum}>{premiumPilgrims}</Text>
          <Text style={styles.statLabel}>{t("earnPremium")}</Text>
        </View>
      </View>

      {/* Money, one block per currency */}
      {sorted.length === 0 ? (
        <Text style={[styles.body, { color: theme.textSecondary, marginTop: 4 }]}>{t("earnNone")}</Text>
      ) : (
        sorted.map(r => (
          <View key={r.currency} style={[styles.moneyRow, { borderColor: theme.border }]}>
            <View style={styles.moneyCell}>
              <Text style={[styles.moneyLabel, { color: theme.textSecondary }]}>{t("earnPending")}</Text>
              <Text style={[styles.moneyValue, { color: theme.text }]}>{money(r.pending, r.currency, locale)}</Text>
            </View>
            <View style={styles.moneyCell}>
              <Text style={[styles.moneyLabel, { color: theme.textSecondary }]}>{t("earnReady")}</Text>
              <Text style={[styles.moneyValue, { color: GOLD }]}>{money(r.ready, r.currency, locale)}</Text>
            </View>
            <View style={styles.moneyCell}>
              <Text style={[styles.moneyLabel, { color: theme.textSecondary }]}>{t("earnPaid")}</Text>
              <Text style={[styles.moneyValue, { color: theme.text }]}>{money(r.paid, r.currency, locale)}</Text>
            </View>
          </View>
        ))
      )}

      <Text style={[styles.small, { color: theme.textSecondary }]}>{t("earnHint")}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  card: { marginHorizontal: 16, marginBottom: 12, borderRadius: 16, padding: 16, borderWidth: 0.5 },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 8 },
  icon: { width: 32, height: 32, borderRadius: 9, backgroundColor: NAVY, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 15, fontWeight: "bold" },
  body: { fontSize: 13, lineHeight: 19 },
  small: { fontSize: 11, lineHeight: 16, marginTop: 10 },
  statsRow: { flexDirection: "row", gap: 10, marginTop: 12, marginBottom: 4 },
  stat: { flex: 1, borderRadius: 12, padding: 12, alignItems: "center", backgroundColor: NAVY },
  statNum: { fontSize: 20, fontWeight: "bold", color: GOLD },
  statLabel: { fontSize: 11, color: "rgba(255,255,255,0.75)", marginTop: 2, textAlign: "center" },
  moneyRow: { flexDirection: "row", marginTop: 10, paddingTop: 10, borderTopWidth: 0.5 },
  moneyCell: { flex: 1, alignItems: "center" },
  moneyLabel: { fontSize: 11 },
  moneyValue: { fontSize: 15, fontWeight: "bold", marginTop: 2 },
})
