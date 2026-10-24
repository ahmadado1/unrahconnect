// All announcements from the pilgrim's agency, plus "Leave this agency".
import { useTheme } from "@/context/themeContext"
import { getAgentAnnouncements, getMyAgent, leaveAgent, type AgentAnnouncement, type PublicAgent } from "@/lib/agents"
import { Ionicons } from "@expo/vector-icons"
import { useRouter } from "expo-router"
import { StatusBar } from "expo-status-bar"
import { useCallback, useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { ActivityIndicator, Alert, FlatList, RefreshControl, StyleSheet, Text, View } from "react-native"
import TouchableOpacity from "@/app/components/AppPressable"
import { useSafeAreaInsets } from "react-native-safe-area-context"

const NAVY = "#1E3A5F"
const GOLD = "#C9A84C"

export default function AgentAnnouncementsScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { theme } = useTheme()
  const { t, i18n } = useTranslation()
  const [agent, setAgent] = useState<PublicAgent | null>(null)
  const [items, setItems] = useState<AgentAnnouncement[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const load = useCallback(async () => {
    try {
      const mine = await getMyAgent()
      setAgent(mine)
      setItems(mine ? await getAgentAnnouncements(mine.id) : [])
    } catch (e) {
      console.log("Announcements load error:", e)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const leave = () => {
    if (!agent) return
    Alert.alert(t("yourAgentLeave"), t("yourAgentLeaveConfirm", { name: agent.business_name }), [
      { text: t("cancel"), style: "cancel" },
      {
        text: t("yourAgentLeave"),
        style: "destructive",
        onPress: async () => {
          try {
            await leaveAgent()
            router.back()
          } catch {
            Alert.alert(t("somethingWentWrong"))
          }
        },
      },
    ])
  }

  return (
    <View style={[styles.screen, { backgroundColor: theme.background }]}>
      <StatusBar style="light" />
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color="#fff" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>{t("announcementsTitle")}</Text>
          {agent ? <Text style={styles.headerSub}>{agent.business_name}</Text> : null}
        </View>
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator color={GOLD} size="large" /></View>
      ) : (
        <FlatList keyboardDismissMode="on-drag" keyboardShouldPersistTaps="handled"
          data={items}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 40 }]}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load() }} tintColor={GOLD} />}
          renderItem={({ item }) => (
            <View style={[styles.item, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <Text style={[styles.date, { color: theme.textSecondary }]}>
                {new Date(item.created_at).toLocaleString(i18n.language || "en", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
              </Text>
              <Text style={[styles.title, { color: theme.text }]}>{item.title}</Text>
              <Text style={[styles.body, { color: theme.textSecondary }]}>{item.body}</Text>
            </View>
          )}
          ListEmptyComponent={<Text style={[styles.empty, { color: theme.textSecondary }]}>{t("yourAgentNoNews")}</Text>}
          ListFooterComponent={
            agent ? (
              <TouchableOpacity onPress={leave} style={styles.leave}>
                <Text style={styles.leaveText}>{t("yourAgentLeave")}</Text>
              </TouchableOpacity>
            ) : null
          }
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: { backgroundColor: NAVY, padding: 20, paddingBottom: 16, flexDirection: "row", alignItems: "center", gap: 12 },
  backBtn: { backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 20, padding: 6 },
  headerTitle: { color: "#fff", fontSize: 20, fontWeight: "bold" },
  headerSub: { color: GOLD, fontSize: 12, marginTop: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  list: { padding: 16, gap: 12 },
  item: { borderRadius: 16, borderWidth: 0.5, padding: 14 },
  date: { fontSize: 11, marginBottom: 4 },
  title: { fontSize: 16, fontWeight: "bold", marginBottom: 4 },
  body: { fontSize: 14, lineHeight: 20 },
  empty: { textAlign: "center", marginTop: 40, fontSize: 14 },
  leave: { alignItems: "center", marginTop: 24, padding: 12 },
  leaveText: { color: "#E24B4A", fontWeight: "600" },
})
