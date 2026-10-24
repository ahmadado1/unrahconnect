// "Check my reminders": shows what iOS / Android really has scheduled for this app,
// and the phone settings that can hide notifications. Used to find out why a prayer was missed.
import TouchableOpacity from "@/app/components/AppPressable"
import { useTheme } from "@/context/themeContext"
import { reschedulePrayerNotificationsFromCache, scheduleAlMulkReminder } from "@/lib/notifications"
import { SYSTEM_ADHAN_KEY } from "@/lib/prayerToggles"
import { Ionicons } from "@expo/vector-icons"
import AsyncStorage from "@react-native-async-storage/async-storage"
import * as Notifications from "expo-notifications"
import { useFocusEffect, useRouter } from "expo-router"
import { StatusBar } from "expo-status-bar"
import { useCallback, useState } from "react"
import { useTranslation } from "react-i18next"
import { ActivityIndicator, Linking, Platform, ScrollView, StyleSheet, Text, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"

const NAVY = "#1E3A5F"
const GOLD = "#C9A84C"

type Item = { id: string; title: string; at: number | null; sound: boolean }
type Report = {
  permission: Record<string, unknown>
  total: number
  prayers: Item[]
  others: Item[]
  systemAdhan: boolean
  prayerSwitch: string | null
  master: string | null
}

/** When a scheduled notification fires (ms), or null if it repeats / unknown. */
function fireTime(n: Notifications.NotificationRequest): number | null {
  const t = n.trigger as { date?: number | string; value?: number; type?: string } | null
  if (!t) return null
  if (typeof t.value === "number") return t.value
  if (t.date) return new Date(t.date).getTime()
  return null
}

function clock(ms: number | null) {
  if (!ms) return "—"
  const d = new Date(ms)
  return d.toLocaleString(undefined, { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })
}

export default function NotificationCheckScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { theme } = useTheme()
  const { t } = useTranslation()
  const [report, setReport] = useState<Report | null>(null)
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    const [perm, pending, systemAdhan, prayerSwitch, master] = await Promise.all([
      Notifications.getPermissionsAsync(),
      Notifications.getAllScheduledNotificationsAsync(),
      AsyncStorage.getItem(SYSTEM_ADHAN_KEY),
      AsyncStorage.getItem("prayer_alerts_enabled"),
      AsyncStorage.getItem("notifications_enabled"),
    ])
    const items: Item[] = pending
      .map(n => ({
        id: n.identifier,
        title: String(n.content.title ?? n.identifier),
        at: fireTime(n),
        sound: Boolean(n.content.sound),
      }))
      .sort((a, b) => (a.at ?? Infinity) - (b.at ?? Infinity))
    setReport({
      permission: { ...(perm as unknown as Record<string, unknown>), ...((perm as { ios?: Record<string, unknown> }).ios ?? {}) },
      total: pending.length,
      prayers: items.filter(i => i.id.startsWith("prayer-")),
      others: items.filter(i => !i.id.startsWith("prayer-")),
      systemAdhan: systemAdhan === "true",
      prayerSwitch,
      master,
    })
  }, [])

  useFocusEffect(
    useCallback(() => {
      void load()
    }, [load])
  )

  const fixNow = async () => {
    setBusy(true)
    try {
      await reschedulePrayerNotificationsFromCache()
      await scheduleAlMulkReminder()
      await load()
    } finally {
      setBusy(false)
    }
  }

  // ─── Problems we can see ───
  const problems: string[] = []
  if (report) {
    const p = report.permission
    if (p.status !== "granted") problems.push(t("nc_pNotAllowed"))
    if (p.allowsSound === false) problems.push(t("nc_pNoSound"))
    if (p.allowsAlert === false || p.alertStyle === 0) problems.push(t("nc_pNoBanner"))
    if (p.allowsDisplayOnLockScreen === false) problems.push(t("nc_pNoLock"))
    if (report.master === "false" || report.prayerSwitch === "false") problems.push(t("nc_pSwitchOff"))
    if (!report.prayers.length && !report.systemAdhan) problems.push(t("nc_pNoPrayers"))
    if (report.total >= 60) problems.push(t("nc_pLimit", { count: report.total }))
  }

  const row = (label: string, value: string, ok: boolean | null) => (
    <View style={[styles.row, { borderBottomColor: theme.border }]} key={label}>
      <Text style={[styles.rowLabel, { color: theme.text }]}>{label}</Text>
      <Text style={[styles.rowValue, { color: ok === false ? "#DC2626" : ok ? "#2F855A" : theme.textSecondary }]}>{value}</Text>
    </View>
  )

  return (
    <View style={[styles.screen, { backgroundColor: theme.background }]}>
      <StatusBar style="light" />
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t("nc_title")}</Text>
        <View style={{ width: 34 }} />
      </View>

      {!report ? (
        <ActivityIndicator color={GOLD} style={{ marginTop: 40 }} />
      ) : (
        <ScrollView keyboardDismissMode="on-drag" keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 40 }}>
          {/* Summary */}
          <View style={[styles.card, { backgroundColor: problems.length ? "#FDECEC" : "#E6F4EA" }]}>
            <Text style={[styles.cardTitle, { color: problems.length ? "#9B1C1C" : "#2F855A" }]}>
              {problems.length ? t("nc_problems") : t("nc_allGood")}
            </Text>
            {problems.map(p => (
              <Text key={p} style={styles.problem}>• {p}</Text>
            ))}
          </View>

          {/* Phone settings */}
          <Text style={[styles.section, { color: theme.textSecondary }]}>{t("nc_settings")}</Text>
          <View style={[styles.box, { backgroundColor: theme.card, borderColor: theme.border }]}>
            {row(t("nc_allowed"), String(report.permission.status ?? "?"), report.permission.status === "granted")}
            {"allowsSound" in report.permission ? row(t("nc_sound"), report.permission.allowsSound ? "✓" : "✗", Boolean(report.permission.allowsSound)) : null}
            {"allowsDisplayOnLockScreen" in report.permission
              ? row(t("nc_lock"), report.permission.allowsDisplayOnLockScreen ? "✓" : "✗", Boolean(report.permission.allowsDisplayOnLockScreen))
              : null}
            {row(t("nc_scheduled"), `${report.total}${Platform.OS === "ios" ? " / 64" : ""}`, report.total < 60)}
            {row(t("nc_fullAdhan"), report.systemAdhan ? t("nc_on") : t("nc_off"), null)}
          </View>
          {Platform.OS === "ios" ? (
            <Text style={[styles.tip, { color: theme.textSecondary }]}>{t("nc_iosTip")}</Text>
          ) : null}
          {Platform.OS === "ios" ? (
            /* Full Adhan while using the phone: iPhone stops a notification's sound when a
               temporary banner slides away, so each 30-second part only plays a few seconds. */
            <Text style={[styles.tip, { color: theme.textSecondary }]}>{t("nc_iosBannerTip")}</Text>
          ) : null}
          <TouchableOpacity style={styles.settingsBtn} onPress={() => void Linking.openSettings()}>
            <Ionicons name="settings-outline" size={16} color={NAVY} />
            <Text style={styles.settingsBtnText}>{t("nc_openSettings")}</Text>
          </TouchableOpacity>

          {/* Next prayer alerts */}
          <Text style={[styles.section, { color: theme.textSecondary }]}>{t("nc_nextPrayers")}</Text>
          <View style={[styles.box, { backgroundColor: theme.card, borderColor: theme.border }]}>
            {report.prayers.length
              ? report.prayers.slice(0, 10).map(i => row(i.title, `${clock(i.at)}${i.sound ? " 🔊" : ""}`, null))
              : row(t("nc_none"), "", false)}
          </View>

          {/* Other reminders */}
          <Text style={[styles.section, { color: theme.textSecondary }]}>{t("nc_other")}</Text>
          <View style={[styles.box, { backgroundColor: theme.card, borderColor: theme.border }]}>
            {report.others.length ? report.others.slice(0, 15).map(i => row(i.title, clock(i.at), null)) : row(t("nc_none"), "", null)}
          </View>

          <TouchableOpacity style={styles.fixBtn} onPress={fixNow} disabled={busy}>
            {busy ? <ActivityIndicator color={NAVY} /> : <Ionicons name="refresh" size={18} color={NAVY} />}
            <Text style={styles.fixText}>{t("nc_fix")}</Text>
          </TouchableOpacity>
        </ScrollView>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: { backgroundColor: NAVY, paddingHorizontal: 16, paddingBottom: 14, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  backBtn: { backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 20, padding: 6 },
  headerTitle: { color: "#fff", fontSize: 17, fontWeight: "bold" },
  card: { borderRadius: 14, padding: 14, marginBottom: 6 },
  cardTitle: { fontSize: 15, fontWeight: "800", marginBottom: 4 },
  problem: { color: "#7F1D1D", fontSize: 13, marginTop: 4, lineHeight: 18 },
  section: { fontSize: 12, fontWeight: "800", letterSpacing: 0.6, textTransform: "uppercase", marginTop: 18, marginBottom: 8 },
  box: { borderRadius: 14, borderWidth: 0.5, overflow: "hidden" },
  row: { flexDirection: "row", justifyContent: "space-between", gap: 10, paddingHorizontal: 14, paddingVertical: 11, borderBottomWidth: 0.5 },
  rowLabel: { flex: 1, fontSize: 13 },
  rowValue: { fontSize: 13, fontWeight: "700", textAlign: "right" },
  tip: { fontSize: 12, lineHeight: 18, marginTop: 8 },
  settingsBtn: { flexDirection: "row", alignItems: "center", gap: 6, alignSelf: "flex-start", marginTop: 10, backgroundColor: GOLD, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8 },
  settingsBtnText: { color: NAVY, fontWeight: "800", fontSize: 13 },
  fixBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 22, backgroundColor: GOLD, borderRadius: 14, paddingVertical: 13 },
  fixText: { color: NAVY, fontWeight: "800", fontSize: 15 },
})
