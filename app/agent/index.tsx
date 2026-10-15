// Find an Agent: verified, paid agencies from the website's Agent Zone (active_agents view).
// Featured agencies are shown first with a gold badge; verified ones get a blue ✓.
import { AnimatedHeroIcon } from "@/components/AnimatedHeroIcon"
import { AppIcon } from "@/components/AppIcon"
import { useTheme } from "@/context/themeContext"
import { getActiveAgents, type PublicAgent } from "@/lib/agents"
import { Ionicons } from "@expo/vector-icons"
import { Image } from "expo-image"
import { useLocalSearchParams, useRouter } from "expo-router"
import { StatusBar } from "expo-status-bar"
import { useCallback, useEffect, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { ActivityIndicator, FlatList, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from "react-native"
import TouchableOpacity from "@/app/components/AppPressable"
import { useSafeAreaInsets } from "react-native-safe-area-context"

const NAVY = "#1E3A5F"
const GOLD = "#C9A84C"
const BLUE = "#1D9BF0"

/** Featured first, then verified, then A–Z. */
function sortAgents(list: PublicAgent[]) {
  return [...list].sort((a, b) => {
    if (a.plan !== b.plan) return a.plan === "featured" ? -1 : 1
    if (a.verified !== b.verified) return a.verified ? -1 : 1
    return a.business_name.localeCompare(b.business_name)
  })
}

export default function FindAgentScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { theme } = useTheme()
  const { t } = useTranslation()
  const params = useLocalSearchParams<{ country?: string }>()

  const [agents, setAgents] = useState<PublicAgent[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [failed, setFailed] = useState(false)
  const [search, setSearch] = useState("")
  const [country, setCountry] = useState<string>(params.country ? String(params.country) : "")

  const load = useCallback(async () => {
    try {
      setFailed(false)
      const rows = await getActiveAgents()
      setAgents(sortAgents(rows))
    } catch (e) {
      console.log("Find agent load error:", e)
      setFailed(true)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  // Countries that have at least one agency, for the filter chips.
  const countries = useMemo(() => {
    const set = new Map<string, string>()
    for (const agent of agents) {
      const name = agent.country?.trim()
      if (name) set.set(name.toLowerCase(), name)
    }
    return [...set.values()].sort((a, b) => a.localeCompare(b))
  }, [agents])

  const shown = useMemo(() => {
    const q = search.trim().toLowerCase()
    const wanted = country.trim().toLowerCase()
    return agents.filter((agent) => {
      if (wanted && agent.country?.toLowerCase() !== wanted) return false
      if (!q) return true
      return (
        agent.business_name.toLowerCase().includes(q) ||
        (agent.country || "").toLowerCase().includes(q) ||
        agent.cities.some((city) => city.toLowerCase().includes(q)) ||
        (agent.description || "").toLowerCase().includes(q)
      )
    })
  }, [agents, search, country])

  const renderAgent = ({ item }: { item: PublicAgent }) => {
    const featured = item.plan === "featured"
    const place = [item.country, item.cities.slice(0, 2).join(", ")].filter(Boolean).join(" · ")
    return (
      <TouchableOpacity
        style={[
          styles.card,
          { backgroundColor: theme.card, borderColor: featured ? GOLD : theme.border },
          featured && styles.cardFeatured,
        ]}
        onPress={() => router.push(`/agent/${item.id}` as any)}
      >
        {item.logo_url ? (
          <Image source={{ uri: item.logo_url }} style={styles.logo} contentFit="cover" />
        ) : (
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{item.business_name?.charAt(0)?.toUpperCase() || "A"}</Text>
          </View>
        )}

        <View style={{ flex: 1 }}>
          <View style={styles.nameRow}>
            <Text style={[styles.name, { color: theme.text }]} numberOfLines={1}>
              {item.business_name}
            </Text>
            {item.verified ? (
              <Ionicons name="checkmark-circle" size={16} color={BLUE} accessibilityLabel={t("agentVerified")} />
            ) : null}
          </View>

          {place ? (
            <View style={styles.metaRow}>
              <Ionicons name="location-outline" size={12} color={GOLD} />
              <Text style={[styles.meta, { color: theme.textSecondary }]} numberOfLines={1}>
                {place}
              </Text>
            </View>
          ) : null}

          {item.description ? (
            <Text style={[styles.desc, { color: theme.textSecondary }]} numberOfLines={2}>
              {item.description}
            </Text>
          ) : null}

          <View style={styles.badges}>
            {featured ? (
              <View style={styles.featuredBadge}>
                <AppIcon name="star" size={10} color={NAVY} />
                <Text style={styles.featuredText}>{t("featured")}</Text>
              </View>
            ) : null}
            {item.verified ? (
              <View style={styles.verifiedBadge}>
                <Ionicons name="shield-checkmark" size={10} color={BLUE} />
                <Text style={styles.verifiedText}>{t("agentVerified")}</Text>
              </View>
            ) : null}
          </View>
        </View>

        <Ionicons name="chevron-forward" size={20} color={GOLD} />
      </TouchableOpacity>
    )
  }

  return (
    <View style={[styles.screen, { backgroundColor: theme.background }]}>
      <StatusBar style="light" />

      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color="#fff" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>{t("findAgent")}</Text>
          <Text style={styles.headerSub}>{t("findAgentSub")}</Text>
        </View>
        <TouchableOpacity
          onPress={() => router.push("/agent/scan" as any)}
          style={styles.scanBtn}
          accessibilityLabel={t("agentScanQr")}
        >
          <Ionicons name="qr-code-outline" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={[styles.searchBar, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <Ionicons name="search" size={16} color={theme.textSecondary} />
        <TextInput
          style={[styles.searchInput, { color: theme.text }]}
          placeholder={t("agentsSearchPlaceholder")}
          placeholderTextColor={theme.textSecondary}
          value={search}
          onChangeText={setSearch}
          autoCapitalize="none"
        />
        {search ? (
          <TouchableOpacity onPress={() => setSearch("")}>
            <Ionicons name="close-circle" size={16} color={theme.textSecondary} />
          </TouchableOpacity>
        ) : null}
      </View>

      {countries.length > 1 ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips} style={{ flexGrow: 0 }}>
          {["", ...countries].map((name) => {
            const active = country.toLowerCase() === name.toLowerCase()
            return (
              <TouchableOpacity
                key={name || "all"}
                onPress={() => setCountry(name)}
                style={[styles.chip, { borderColor: active ? NAVY : theme.border, backgroundColor: active ? NAVY : theme.card }]}
              >
                <Text style={[styles.chipText, { color: active ? "#fff" : theme.text }]}>{name || t("agentsAll")}</Text>
              </TouchableOpacity>
            )
          })}
        </ScrollView>
      ) : null}

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={GOLD} size="large" />
        </View>
      ) : (
        <FlatList
          data={shown}
          keyExtractor={(item) => item.id}
          renderItem={renderAgent}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.list, shown.length === 0 && { flexGrow: 1 }]}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load() }} tintColor={GOLD} />}
          ListHeaderComponent={
            shown.length ? (
              <Text style={[styles.count, { color: theme.textSecondary }]}>
                {t("agentsCount", { count: shown.length })}
              </Text>
            ) : null
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <AnimatedHeroIcon name="business" size={48} accent="gold" />
              <Text style={[styles.emptyTitle, { color: theme.text }]}>
                {failed ? t("agentsLoadError") : t("noAgentsFound")}
              </Text>
              <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                {failed ? t("agentsPullToRetry") : t("agentsEmptyBody")}
              </Text>
            </View>
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
  scanBtn: { backgroundColor: "rgba(201,168,76,0.35)", borderRadius: 20, padding: 8 },
  headerTitle: { color: "#fff", fontSize: 20, fontWeight: "bold" },
  headerSub: { color: GOLD, fontSize: 12, marginTop: 1 },
  searchBar: { flexDirection: "row", alignItems: "center", gap: 10, marginHorizontal: 16, marginTop: 16, marginBottom: 10, borderRadius: 12, padding: 12, borderWidth: 0.5 },
  searchInput: { flex: 1, fontSize: 14 },
  chips: { paddingHorizontal: 16, gap: 8, paddingBottom: 6 },
  chip: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 7 },
  chipText: { fontSize: 13, fontWeight: "600" },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  list: { padding: 16, gap: 12, paddingBottom: 100 },
  count: { fontSize: 12, marginBottom: 2 },
  card: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderRadius: 16, borderWidth: 0.5 },
  cardFeatured: { borderWidth: 1.5 },
  logo: { width: 52, height: 52, borderRadius: 12, backgroundColor: "#F1F4F8" },
  avatar: { width: 52, height: 52, borderRadius: 12, backgroundColor: NAVY, alignItems: "center", justifyContent: "center" },
  avatarText: { fontSize: 20, fontWeight: "bold", color: GOLD },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 5, marginBottom: 3 },
  name: { fontSize: 15, fontWeight: "bold", flexShrink: 1 },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 4 },
  meta: { fontSize: 12, flexShrink: 1 },
  desc: { fontSize: 12, lineHeight: 17, marginBottom: 6 },
  badges: { flexDirection: "row", gap: 6, flexWrap: "wrap" },
  featuredBadge: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: GOLD, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2 },
  featuredText: { fontSize: 10, color: NAVY, fontWeight: "700" },
  verifiedBadge: { flexDirection: "row", alignItems: "center", gap: 3, backgroundColor: "rgba(29,155,240,0.12)", borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2 },
  verifiedText: { fontSize: 10, color: BLUE, fontWeight: "700" },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12, padding: 32 },
  emptyTitle: { fontSize: 18, fontWeight: "bold", textAlign: "center" },
  emptyText: { fontSize: 14, textAlign: "center" },
})
